import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

function pickUserId(payload: any): string {
  return String(payload?.sub || payload?.userId || payload?.id || "").trim();
}

function pickEmail(payload: any): string {
  return String(payload?.email || payload?.user?.email || "")
    .trim()
    .toLowerCase();
}

function normalizeCarrierName(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  return value || null;
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload = await verifyAccessToken(accessToken).catch(() => null);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const userId = pickUserId(payload);
    const emailSession = pickEmail(payload);

    if (!userId && !emailSession) {
      return NextResponse.json(
        { ok: false, error: "No user identity in session" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = supabaseAdmin();

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("customer_email", emailSession);
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

    if (orderIds.length > 0) {
      const { data: shipments } = await supabase
        .from("order_shipments")
        .select(
          "order_id,tracking_code,provider,updated_at,shipped_at,last_event_status,last_event_at"
        )
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