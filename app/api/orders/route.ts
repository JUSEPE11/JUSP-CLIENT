import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";
import { rememberShippingAddressForIdentity } from "@/lib/addressBook";
import { checkExcelStock } from "@/lib/stockExcel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireSession(req: NextRequest) {
  const at = req.cookies.get(COOKIE_AT)?.value;

  if (!at) {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: "No session" }, { status: 401 }),
    };
  }

  try {
    const payload = await verifyAccessToken(at);
    return { ok: true as const, payload };
  } catch {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 }),
    };
  }
}

function pickUserId(payload: any): string {
  return String(payload?.sub || payload?.userId || payload?.id || "").trim();
}

function pickEmail(payload: any): string {
  return String(payload?.email || payload?.user?.email || "")
    .trim()
    .toLowerCase();
}

function toSafeQty(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function sanitizeOrderItems(items: any[]) {
  return items
    .map((item) => ({
      id: String(item?.id || item?.product_id || "").trim(),
      product_id: String(item?.product_id || item?.id || "").trim() || null,
      slug: String(item?.slug || item?.product_slug || "").trim() || null,
      product_slug: String(item?.product_slug || item?.slug || "").trim() || null,
      name: String(item?.name || "").trim() || null,
      qty: toSafeQty(item?.qty),
      price: Number.isFinite(Number(item?.price)) ? Number(item?.price) : 0,
      image: item?.image ? String(item.image).trim() : null,
      size: item?.size ? String(item.size).trim() : null,
      color: item?.color ? String(item.color).trim() : null,
    }))
    .filter((item) => item.id && item.qty > 0);
}

function normalizeCarrierName(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  return value || null;
}

export async function GET(req: NextRequest) {
  const gate = await requireSession(req);
  if (!gate.ok) return gate.res;

  try {
    const payload = gate.payload;
    const userId = pickUserId(payload);
    const emailSession = pickEmail(payload);
    const supabase = supabaseAdmin();

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (emailSession) {
      query = query.eq("customer_email", emailSession);
    } else {
      return NextResponse.json(
        { ok: false, error: "No user identity in session" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const orders = Array.isArray(data) ? data : [];
    const orderIds = orders
      .map((order) => String(order?.id ?? "").trim())
      .filter(Boolean);

    let shipmentMap = new Map<string, any>();
    if (orderIds.length) {
      const { data: shipments } = await supabase
        .from("order_shipments")
        .select("order_id,tracking_code,provider,updated_at,shipped_at,last_event_status,last_event_at")
        .in("order_id", orderIds);

      shipmentMap = new Map(
        (Array.isArray(shipments) ? shipments : []).map((shipment: any) => [
          String(shipment?.order_id ?? "").trim(),
          shipment,
        ])
      );
    }

    const hydratedOrders = orders.map((order: any) => {
      const shipment = shipmentMap.get(String(order?.id ?? "").trim());
      const trackingCode =
        String(order?.tracking_code ?? "").trim() ||
        String(shipment?.tracking_code ?? "").trim() ||
        null;
      const carrier =
        normalizeCarrierName(order?.carrier) ||
        normalizeCarrierName(order?.courier_name) ||
        normalizeCarrierName(order?.shipping_carrier) ||
        normalizeCarrierName(shipment?.provider);

      return {
        ...order,
        tracking_code: trackingCode,
        carrier,
        courier_name: order?.courier_name ?? carrier,
        shipping_carrier: order?.shipping_carrier ?? carrier,
        shipped_at: order?.shipped_at ?? shipment?.shipped_at ?? null,
        tracking_updated_at: shipment?.updated_at ?? shipment?.last_event_at ?? null,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        orders: hydratedOrders,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireSession(req);
  if (!gate.ok) return gate.res;

  try {
    const payload = gate.payload;
    const userId = pickUserId(payload);
    const emailSession = pickEmail(payload);

    const body = await req.json();

    const reference = String(body.reference || "").trim();

    if (!reference) {
      return NextResponse.json(
        { ok: false, error: "La orden no trae referencia." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const existing = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", reference)
      .maybeSingle();

    if (existing.data) {
      return NextResponse.json(
        {
          ok: true,
          order: existing.data,
          reused: true,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = sanitizeOrderItems(rawItems);

    const shipping = body.shipping || {};
    const totals = body.totals || {};
    const customer = body.customer || {};
    const coupon = body.coupon && typeof body.coupon === "object" ? body.coupon : null;

    if (!items.length) {
      return NextResponse.json(
        { ok: false, error: "La orden no trae items válidos." },
        { status: 400 }
      );
    }

    const stockChecks = checkExcelStock(
      items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        size: item.size,
        color: item.color,
        qty: item.qty,
      }))
    );

    const failed = stockChecks.find((row) => !row.ok);

    if (failed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Stock insuficiente para ${failed.slug}${failed.size ? ` / talla ${failed.size}` : ""}${
            failed.color ? ` / ${failed.color}` : ""
          }. Disponible: ${failed.available}.`,
        },
        { status: 409 }
      );
    }

    const orderInsert = {
      order_code: reference,
      wompi_reference: reference,
      status: "pending",
      payment_status: "in_progress",
      payment_provider: "wompi",

      user_id: userId || null,
      user_email: emailSession || null,

      customer_email: customer.email || emailSession || null,
      customer_name: customer.fullName || null,

      phone: customer.phone || null,
      document_type: customer.documentType || null,
      document_number: customer.documentNumber || null,

      address: shipping.addressLine1 || null,
      city: shipping.city || null,
      region: shipping.region || null,
      country: shipping.country || "CO",

      shipping_address: {
        ...shipping,
        coupon: coupon || null,
      },

      items,
      items_count: items.reduce((a: number, b: any) => a + (b.qty || 0), 0),

      subtotal_cop: Number(totals.subtotal || 0),
      shipping_cop: Number(totals.shipping || 0),
      total_cop: Number(totals.total || 0),

      amount_cents: Number(body.amountInCents || 0),
      currency: body.currency || "COP",

      provider: "wompi",

      created_at: new Date().toISOString(),
    };

    const insert = await supabase
      .from("orders")
      .insert(orderInsert)
      .select()
      .single();

    if (insert.error) {
      return NextResponse.json(
        { ok: false, error: insert.error.message },
        { status: 500 }
      );
    }

    await rememberShippingAddressForIdentity(
      {
        userId: userId || null,
        email: (customer.email || emailSession || "").trim().toLowerCase() || null,
      },
      {
        fullName: customer.fullName || null,
        email: customer.email || emailSession || null,
        documentType: customer.documentType || null,
        documentNumber: customer.documentNumber || null,
        phone: customer.phone || null,
        municipality: shipping.municipality || shipping.city || null,
        region: shipping.region || null,
        addressLine1: shipping.addressLine1 || null,
        notes: shipping.notes || null,
      }
    );

    return NextResponse.json(
      {
        ok: true,
        order: insert.data,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
