// app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dbInsertLog } from "@/lib/ordersRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeId(raw: unknown) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = String(v ?? "").trim();
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function safeNum(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function roundCop(value: number) {
  return Math.max(0, Math.round(value));
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, serviceRole);
}

function itemKey(item: any) {
  return safeText(item?.id || item?.product_id || item?.slug || item?.product_slug).toLowerCase();
}

function normalizeOrderItems(items: unknown) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const qty = Math.max(0, Math.floor(safeNum(item?.qty)));
      const price = Math.max(0, safeNum(item?.price));
      return {
        ...item,
        id: safeText(item?.id || item?.product_id) || null,
        product_id: safeText(item?.product_id || item?.id) || null,
        slug: safeText(item?.slug) || null,
        product_slug: safeText(item?.product_slug || item?.slug) || null,
        name: safeText(item?.name || item?.title) || null,
        qty,
        price,
        image: safeText(item?.image) || null,
        size: safeText(item?.size) || null,
        color: safeText(item?.color) || null,
      };
    })
    .filter((item) => item.qty > 0 && itemKey(item));
}

function computeItemsTotal(items: any[]) {
  return items.reduce(
    (acc, item) => acc + safeNum(item?.price) * Math.max(0, Math.floor(safeNum(item?.qty))),
    0
  );
}

function appendAdminNote(current: unknown, line: string) {
  const prev = safeText(current);
  return prev ? `${prev}\n${line}` : line;
}

function applyPartialRefund(orderItems: any[], requestedItems: any[]) {
  const wanted = normalizeOrderItems(requestedItems);
  if (!wanted.length) {
    return {
      refundedItems: [],
      remainingItems: orderItems,
      refundAmountCop: 0,
    };
  }

  const remainingItems = orderItems.map((item) => ({ ...item }));
  const refundedItems: any[] = [];
  let refundAmountCop = 0;

  for (const request of wanted) {
    const key = itemKey(request);
    const index = remainingItems.findIndex((item) => itemKey(item) === key);
    if (index < 0) continue;

    const current = remainingItems[index];
    const currentQty = Math.max(0, Math.floor(safeNum(current?.qty)));
    const requestQty = Math.max(0, Math.floor(safeNum(request?.qty)));
    const qtyToRefund = Math.min(currentQty, requestQty);
    if (!qtyToRefund) continue;

    refundedItems.push({
      ...current,
      qty: qtyToRefund,
    });

    refundAmountCop += safeNum(current?.price) * qtyToRefund;

    const nextQty = currentQty - qtyToRefund;
    if (nextQty <= 0) {
      remainingItems.splice(index, 1);
    } else {
      remainingItems[index] = {
        ...current,
        qty: nextQty,
      };
    }
  }

  return {
    refundedItems,
    remainingItems,
    refundAmountCop: roundCop(refundAmountCop),
  };
}

async function attemptWompiRefund(paymentId: string) {
  const transactionId = safeText(paymentId);
  if (!transactionId) {
    return {
      attempted: false,
      success: false,
      message: "La orden no tiene transaction id de Wompi para intentar el reembolso automático.",
    };
  }

  const privateKey = safeText(process.env.WOMPI_PRIVATE_KEY);
  if (!privateKey) {
    return {
      attempted: false,
      success: false,
      message: "Falta WOMPI_PRIVATE_KEY para intentar el reembolso automático.",
    };
  }

  try {
    const res = await fetch(
      `https://production.wompi.co/v1/transactions/${encodeURIComponent(transactionId)}/void`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${privateKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const raw = await res.text();
    let json: any = null;

    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      return {
        attempted: true,
        success: false,
        message:
          json?.error?.reason ||
          (Array.isArray(json?.error?.messages) ? json.error.messages.join(", ") : "") ||
          raw ||
          "Wompi no aceptó el reembolso automático.",
      };
    }

    return {
      attempted: true,
      success: true,
      message: json?.data?.status || "Reembolso/void enviado a Wompi.",
      providerResponse: json,
    };
  } catch (error: any) {
    return {
      attempted: true,
      success: false,
      message: error?.message || "No se pudo contactar a Wompi para el reembolso automático.",
    };
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = normalizeId(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const res = NextResponse.json(
      { ok: true, order: data },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = normalizeId(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const supabase = getSupabaseAdmin();

    const { data: currentOrder, error: currentError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      return NextResponse.json(
        { ok: false, error: currentError.message },
        { status: 500 }
      );
    }

    if (!currentOrder) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (safeText(body?.action).toLowerCase() === "refund") {
      const refundMode = safeText(body?.refundMode).toLowerCase() === "items" ? "items" : "full";
      const reason = safeText(body?.reason) || "Producto no disponible";
      const now = new Date().toISOString();
      const currentItems = normalizeOrderItems(currentOrder.items);

      let refundedItems = currentItems;
      let remainingItems: any[] = [];
      let refundAmountCop = roundCop(computeItemsTotal(currentItems));
      let providerRefund: any = {
        attempted: false,
        success: false,
        message: "No se intentó reembolso automático todavía.",
      };

      if (refundMode === "items") {
        const partial = applyPartialRefund(currentItems, body?.items);
        refundedItems = partial.refundedItems;
        remainingItems = partial.remainingItems;
        refundAmountCop = partial.refundAmountCop;
        providerRefund = {
          attempted: false,
          success: false,
          message:
            "La orden quedó ajustada y registrada. El reembolso parcial queda listo para gestión operativa.",
        };
      } else {
        providerRefund = await attemptWompiRefund(
          safeText(currentOrder.payment_id || currentOrder.payment_intent_id)
        );
      }

      if (!refundedItems.length || refundAmountCop <= 0) {
        return NextResponse.json(
          { ok: false, error: "No hay productos válidos para reembolsar." },
          { status: 400 }
        );
      }

      const currentSubtotal = roundCop(
        safeNum(currentOrder.subtotal_cop || computeItemsTotal(currentItems))
      );
      const currentShipping = roundCop(safeNum(currentOrder.shipping_cop));
      const nextSubtotal = refundMode === "full" ? 0 : roundCop(computeItemsTotal(remainingItems));
      const nextShipping = refundMode === "full" ? 0 : currentShipping;
      const nextTotal = refundMode === "full" ? 0 : roundCop(nextSubtotal + nextShipping);
      const nextAmountCents = refundMode === "full" ? 0 : roundCop(nextTotal * 100);

      const metadata =
        currentOrder.metadata && typeof currentOrder.metadata === "object"
          ? { ...currentOrder.metadata }
          : {};
      const refundEntry = {
        created_at: now,
        mode: refundMode,
        reason,
        amount_cop: refundAmountCop,
        refunded_items: refundedItems,
        previous_subtotal_cop: currentSubtotal,
        provider: "wompi",
        provider_result: providerRefund,
      };
      const history = Array.isArray((metadata as any).refunds)
        ? [...(metadata as any).refunds, refundEntry]
        : [refundEntry];

      const updatePayload =
        refundMode === "full"
          ? {
              status: "cancelled",
              payment_status: "refunded",
              cancelled_at: now,
              items: [],
              items_count: 0,
              subtotal_cop: 0,
              shipping_cop: 0,
              total_cop: 0,
              amount_cents: 0,
              metadata: {
                ...metadata,
                refunds: history,
                last_refund: refundEntry,
              },
              admin_note: appendAdminNote(
                currentOrder.admin_note,
                `[${now}] Reembolso total por producto no disponible. Monto: ${refundAmountCop} COP. Motivo: ${reason}.`
              ),
            }
          : {
              status: safeText(currentOrder.status) || "paid",
              payment_status: safeText(currentOrder.payment_status) || "paid",
              items: remainingItems,
              items_count: remainingItems.reduce(
                (acc: number, item: any) => acc + Math.max(0, Math.floor(safeNum(item?.qty))),
                0
              ),
              subtotal_cop: nextSubtotal,
              shipping_cop: nextShipping,
              total_cop: nextTotal,
              amount_cents: nextAmountCents,
              metadata: {
                ...metadata,
                refunds: history,
                last_refund: refundEntry,
                partial_refund_active: true,
              },
              admin_note: appendAdminNote(
                currentOrder.admin_note,
                `[${now}] Reembolso parcial por producto no disponible. Monto: ${refundAmountCop} COP. Motivo: ${reason}.`
              ),
            };

      const { data, error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      await dbInsertLog({
        level: providerRefund.success ? "info" : "warn",
        scope: "admin.orders.refund",
        message:
          refundMode === "full"
            ? "Reembolso total solicitado"
            : "Reembolso parcial solicitado",
        order_id: id,
        user_email: safeText(currentOrder.customer_email || currentOrder.user_email) || null,
        meta: {
          reason,
          refundMode,
          refundAmountCop,
          providerRefund,
          refundedItems,
          remainingItems,
        },
      });

      return NextResponse.json(
        {
          ok: true,
          order: data,
          refund: refundEntry,
        },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update(body)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const res = NextResponse.json(
      { ok: true, order: data },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
