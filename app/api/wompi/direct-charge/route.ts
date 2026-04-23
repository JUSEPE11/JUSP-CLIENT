import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";
import { dbInsertLog, dbUpsertOrder, type OrderItem } from "@/lib/ordersRepo";
import {
  consumeExcelReservationAndDecrement,
  releaseExcelReservation,
  reserveExcelStock,
} from "@/lib/stockExcel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DocumentType = "CC" | "CE" | "NIT" | "PAS";

type Shipping = {
  fullName?: string;
  email?: string;
  documentType?: DocumentType | string;
  documentNumber?: string;
  phone?: string;
  city?: string;
  municipality?: string;
  addressLine1?: string;
  region?: string;
  country?: string;
  notes?: string;
};

type Customer = {
  fullName?: string;
  email?: string;
  documentType?: DocumentType | string;
  documentNumber?: string;
  phone?: string;
};

type Totals = {
  subtotal?: number;
  shipping?: number;
  total?: number;
};

type PaymentSelection = {
  id?: string | null;
  paymentSourceId?: string | null;
  tokenizationMode?: string | null;
  label?: string | null;
  brand?: string | null;
  last4?: string | null;
  provider?: string | null;
};

type WompiTransactionResponse = {
  id?: string;
  status?: string;
  reference?: string;
  amount_in_cents?: number;
  payment_method_type?: string | null;
  redirect_url?: string | null;
  payment_link?: string | null;
  customer_email?: string | null;
  payment_method?: {
    extra?: Record<string, unknown> | null;
  } | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(phone: string) {
  let digits = String(phone || "").replace(/\D/g, "").trim();
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  const digits = normalizePhone(phone);
  return digits.length >= 7 && digits.length <= 15;
}

function isValidDocumentNumber(value: string) {
  const normalized = value.trim();
  return /^[A-Za-z0-9.\-]{5,30}$/.test(normalized);
}

function isValidPubKey(k: string) {
  return typeof k === "string" && (k.startsWith("pub_test_") || k.startsWith("pub_prod_"));
}

function wompiBaseUrl(pubKey: string) {
  return pubKey.startsWith("pub_test_")
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";
}

function pickOrigin(req: NextRequest) {
  const h = req.headers;
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  return "";
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function normalizeItems(input: unknown): OrderItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw: any) => ({
      id: raw?.id ? String(raw.id) : String(raw?.product_id || ""),
      product_id: raw?.product_id ? String(raw.product_id) : null,
      slug: raw?.slug ? String(raw.slug) : null,
      product_slug: raw?.product_slug ? String(raw.product_slug) : null,
      name: raw?.name ? String(raw.name) : null,
      qty: Number.isFinite(Number(raw?.qty)) ? Number(raw.qty) : 1,
      price: Number.isFinite(Number(raw?.price)) ? Number(raw.price) : 0,
      image: raw?.image ? String(raw.image) : null,
      size: raw?.size ? String(raw.size) : null,
      color: raw?.color ? String(raw.color) : null,
    }))
    .filter((it) => Number(it.qty || 0) > 0 && normalizeText(it.id));
}

function sumQty(items: OrderItem[]) {
  return items.reduce((acc, it) => acc + Math.max(1, Number(it.qty || 1)), 0);
}

async function getAuthedUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_AT)?.value?.trim();
  if (!token) return null;
  try {
    return (await verifyAccessToken(token)) as any;
  } catch {
    return null;
  }
}

function mapWompiStatus(statusRaw: string | null | undefined) {
  const status = String(statusRaw || "").trim().toUpperCase();
  if (status === "APPROVED") return "paid";
  if (status === "PENDING") return "pending";
  if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") return "cancelled";
  return "pending";
}

async function getAcceptanceTokens(publicKey: string) {
  const baseUrl = wompiBaseUrl(publicKey);
  const res = await fetch(`${baseUrl}/merchants/${encodeURIComponent(publicKey)}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  const merchant = json?.data || {};
  return {
    acceptanceToken: normalizeText(merchant?.presigned_acceptance?.acceptance_token),
    acceptPersonalAuth: normalizeText(merchant?.presigned_personal_data_auth?.acceptance_token),
  };
}

function pickNextActionUrl(tx: WompiTransactionResponse) {
  const extra = tx?.payment_method?.extra || {};
  const candidates = [
    tx?.redirect_url,
    tx?.payment_link,
    typeof extra === "object" ? String((extra as any)?.async_payment_url || "") : "",
    typeof extra === "object" ? String((extra as any)?.redirect_url || "") : "",
    typeof extra === "object" ? String((extra as any)?.url || "") : "",
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return candidates[0] || null;
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Debes iniciar sesión para continuar con el pago." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const publicKey = normalizeText(process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY);
    const privateKey = normalizeText(process.env.WOMPI_PRIVATE_KEY);
    const integrity = normalizeText(process.env.WOMPI_INTEGRITY_SECRET);

    if (!isValidPubKey(publicKey)) {
      return NextResponse.json(
        { ok: false, error: "Falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY válida." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!privateKey) {
      return NextResponse.json(
        { ok: false, error: "Falta WOMPI_PRIVATE_KEY para cobrar con tarjetas guardadas." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!integrity) {
      return NextResponse.json(
        { ok: false, error: "Falta WOMPI_INTEGRITY_SECRET." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = (await req.json().catch(() => null)) as any;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Body inválido." }, { status: 400 });
    }

    const amountInCents = Number(body?.amountInCents);
    const currency = String(body?.currency || "COP").toUpperCase();
    const reference = normalizeText(body?.reference);
    const paymentSelection: PaymentSelection =
      body?.paymentSelection && typeof body.paymentSelection === "object" ? body.paymentSelection : {};
    const shipping: Shipping =
      body?.shipping && typeof body.shipping === "object" ? (body.shipping as Shipping) : {};
    const customer: Customer =
      body?.customer && typeof body.customer === "object" ? (body.customer as Customer) : {};
    const totals: Totals =
      body?.totals && typeof body.totals === "object" ? (body.totals as Totals) : {};
    const items = normalizeItems(body?.items);

    const fullName = normalizeText(customer.fullName || shipping.fullName);
    const email = normalizeEmail(customer.email || shipping.email || user?.email);
    const documentType = normalizeText(customer.documentType || shipping.documentType);
    const documentNumber = normalizeText(customer.documentNumber || shipping.documentNumber);
    const phone = normalizePhone(normalizeText(customer.phone || shipping.phone));
    const city = normalizeText(shipping.city || shipping.municipality);
    const addressLine1 = normalizeText(shipping.addressLine1);
    const region = normalizeText(shipping.region);
    const country = normalizeText(shipping.country || "CO").toUpperCase();
    const paymentSourceId = normalizeText(paymentSelection.paymentSourceId);

    if (!paymentSourceId || normalizeText(paymentSelection.tokenizationMode) !== "real") {
      return NextResponse.json(
        { ok: false, error: "La tarjeta elegida no está tokenizada realmente en Wompi." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ ok: false, error: "amountInCents inválido." }, { status: 400 });
    }
    if (currency !== "COP") {
      return NextResponse.json({ ok: false, error: "currency debe ser COP." }, { status: 400 });
    }
    if (!reference || !items.length) {
      return NextResponse.json({ ok: false, error: "La orden no trae referencia o items válidos." }, { status: 400 });
    }
    if (!fullName || !email || !documentType || !documentNumber || !phone || !city || !addressLine1 || !region) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos obligatorios de cliente y envío." },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Correo electrónico inválido." }, { status: 400 });
    }
    if (!isValidDocumentNumber(documentNumber)) {
      return NextResponse.json({ ok: false, error: "Número de documento inválido." }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ ok: false, error: "Teléfono inválido." }, { status: 400 });
    }

    const origin = normalizeText(process.env.NEXT_PUBLIC_SITE_URL) || pickOrigin(req);
    if (!origin) {
      return NextResponse.json(
        { ok: false, error: "No se pudo inferir el origin. Define NEXT_PUBLIC_SITE_URL." },
        { status: 400 }
      );
    }

    const redirectUrl = `${origin}/checkout/success?reference=${encodeURIComponent(reference)}`;
    const reservation = await reserveExcelStock(reference, items, 10);
    const { acceptanceToken, acceptPersonalAuth } = await getAcceptanceTokens(publicKey);

    if (!acceptanceToken || !acceptPersonalAuth) {
      await releaseExcelReservation(reference);
      return NextResponse.json(
        { ok: false, error: "Wompi no devolvió los acceptance tokens del comercio." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const baseUrl = wompiBaseUrl(publicKey);
    const txRes = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount_in_cents: amountInCents,
        currency,
        customer_email: email,
        payment_method: {
          installments: 1,
        },
        reference,
        payment_source_id: Number(paymentSourceId),
        acceptance_token: acceptanceToken,
        accept_personal_auth: acceptPersonalAuth,
        redirect_url: redirectUrl,
        signature: sha256Hex(`${reference}${amountInCents}${currency}${integrity}`),
        shipping_address: {
          address_line_1: addressLine1,
          country,
          city,
          phone_number: phone,
          region,
          name: fullName,
        },
      }),
    });

    const txJson = await txRes.json().catch(() => null);
    const tx: WompiTransactionResponse = txJson?.data || {};

    if (!txRes.ok || !normalizeText(tx.id)) {
      await releaseExcelReservation(reference);
      return NextResponse.json(
        {
          ok: false,
          error:
            txJson?.error?.reason ||
            txJson?.error?.messages?.[0] ||
            "Wompi no pudo crear la transacción con la tarjeta guardada.",
          wompi: txJson,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const wompiStatus = normalizeText(tx.status).toUpperCase();
    const appStatus = mapWompiStatus(wompiStatus);

    if (wompiStatus === "APPROVED") {
      await consumeExcelReservationAndDecrement(reference, items);
    } else if (wompiStatus === "DECLINED" || wompiStatus === "VOIDED" || wompiStatus === "ERROR") {
      await releaseExcelReservation(reference);
    }

    await dbUpsertOrder({
      order_code: reference,
      wompi_reference: reference,
      status: appStatus,
      total_amount: Number.isFinite(Number(totals.total)) ? Number(totals.total) : amountInCents / 100,
      currency,
      customer_name: fullName,
      customer_email: email,
      customer_document_type: documentType,
      customer_document: documentNumber,
      phone,
      country,
      city,
      customer_region: region,
      address: addressLine1,
      items_count: sumQty(items),
      provider: "wompi",
      payment_id: normalizeText(tx.id) || null,
      paid_at: wompiStatus === "APPROVED" ? new Date().toISOString() : null,
      items,
    });

    await dbInsertLog({
      level: wompiStatus === "APPROVED" ? "info" : "warn",
      scope: "wompi.direct-charge",
      message:
        wompiStatus === "APPROVED"
          ? "Pago directo aprobado con payment_source"
          : `Pago directo creado con estado ${wompiStatus || "UNKNOWN"}`,
      order_id: reference,
      user_email: email,
      meta: {
        transactionId: normalizeText(tx.id),
        paymentSourceId,
        wompiStatus,
        reservedUntil: reservation.expiresAt,
      },
    });

    const nextActionUrl = pickNextActionUrl(tx);

    return NextResponse.json(
      {
        ok: true,
        mode: "direct",
        reference,
        transactionId: normalizeText(tx.id),
        wompiStatus,
        appStatus,
        reservedUntil: reservation.expiresAt,
        checkoutUrl: nextActionUrl,
        successUrl: redirectUrl,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    try {
      await dbInsertLog({
        level: "error",
        scope: "wompi.direct-charge",
        message: error?.message || "Error creando cargo directo con payment_source",
        meta: { stack: error?.stack || null },
      });
    } catch {}

    return NextResponse.json(
      { ok: false, error: error?.message || "No se pudo completar el cobro directo con Wompi." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
