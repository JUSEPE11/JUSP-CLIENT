// src/app/api/wompi/webhook/route.ts
import { NextResponse } from "next/server";
import { dbInsertLog, dbUpsertOrder } from "@/lib/ordersRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WompiTransaction = {
  id?: string;
  status?: string;
  reference?: string;
  amount_in_cents?: number;
  currency?: string;
  customer_email?: string | null;
  shipping_address?: {
    address_line_1?: string | null;
    city?: string | null;
    region?: string | null;
    country?: string | null;
    phone_number?: string | null;
    name?: string | null;
  } | null;
};

function getTransactionId(body: any): string {
  return String(
    body?.data?.transaction?.id ||
      body?.data?.id ||
      body?.transaction?.id ||
      body?.id ||
      ""
  ).trim();
}

function getEventName(body: any): string {
  return String(body?.event || body?.type || "").trim();
}

function mapWompiStatus(statusRaw: string | undefined | null) {
  const status = String(statusRaw || "").toUpperCase();

  if (status === "APPROVED") return "paid";
  if (status === "PENDING") return "pending";
  if (status === "DECLINED") return "cancelled";
  if (status === "VOIDED") return "cancelled";
  if (status === "ERROR") return "cancelled";

  return "pending";
}

async function fetchTransactionFromWompi(transactionId: string): Promise<WompiTransaction> {
  const privateKey = (process.env.WOMPI_PRIVATE_KEY || "").trim();

  const res = await fetch(`https://production.wompi.co/v1/transactions/${transactionId}`, {
    method: "GET",
    headers: privateKey
      ? {
          Authorization: `Bearer ${privateKey}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        },
    cache: "no-store",
  });

  const raw = await res.text();
  let json: any = null;

  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(`No se pudo verificar la transacción en Wompi (${res.status}): ${raw || "sin detalle"}`);
  }

  const tx = json?.data;
  if (!tx || typeof tx !== "object") {
    throw new Error("Respuesta inválida de Wompi al verificar la transacción.");
  }

  return tx as WompiTransaction;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: true });
    }

    const eventName = getEventName(body);
    const transactionId = getTransactionId(body);

    await dbInsertLog({
      level: "info",
      scope: "wompi.webhook",
      message: "Webhook recibido",
      meta: {
        eventName,
        transactionId,
      },
    });

    if (eventName && eventName !== "transaction.updated") {
      return NextResponse.json({ ok: true });
    }

    if (!transactionId) {
      await dbInsertLog({
        level: "warn",
        scope: "wompi.webhook",
        message: "Webhook sin transactionId",
        meta: body,
      });

      return NextResponse.json({ ok: true });
    }

    const tx = await fetchTransactionFromWompi(transactionId);

    const reference = String(tx.reference || "").trim();
    const wompiStatus = String(tx.status || "").toUpperCase();
    const appStatus = mapWompiStatus(wompiStatus);
    const amount = Number(tx.amount_in_cents || 0) / 100;
    const shipping = tx.shipping_address || null;

    if (!reference) {
      throw new Error("La transacción verificada en Wompi no trae reference.");
    }

    await dbUpsertOrder({
      id: reference,
      status: appStatus,
      total_amount: Number.isFinite(amount) ? amount : null,
      currency: tx.currency || "COP",
      customer_name: shipping?.name || null,
      customer_email: tx.customer_email || null,
      phone: shipping?.phone_number || null,
      country: shipping?.country || null,
      city: shipping?.city || null,
      provider: "wompi",
      payment_id: transactionId,
      paid_at: wompiStatus === "APPROVED" ? new Date().toISOString() : null,
    });

    await dbInsertLog({
      level: wompiStatus === "APPROVED" ? "info" : "warn",
      scope: "wompi.webhook",
      message: wompiStatus === "APPROVED" ? "Pago aprobado por Wompi" : `Cambio de estado Wompi: ${wompiStatus}`,
      order_id: reference,
      meta: {
        transactionId,
        wompiStatus,
        appStatus,
        amount_in_cents: tx.amount_in_cents || null,
        currency: tx.currency || null,
        shipping_address_line_1: shipping?.address_line_1 || null,
        shipping_region: shipping?.region || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    try {
      await dbInsertLog({
        level: "error",
        scope: "wompi.webhook",
        message: e?.message || "Error procesando webhook de Wompi",
        meta: {
          stack: e?.stack || null,
        },
      });
    } catch {}

    return NextResponse.json({ ok: true });
  }
}