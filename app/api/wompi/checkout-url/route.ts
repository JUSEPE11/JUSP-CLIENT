import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbInsertLog, dbUpsertOrder, type OrderItem } from "@/lib/ordersRepo";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function isValidPubKey(k: string) {
  return typeof k === "string" && (k.startsWith("pub_test_") || k.startsWith("pub_prod_"));
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

type DocumentType = "CC" | "CE" | "NIT" | "PAS";

type Shipping = {
  fullName?: string;
  email?: string;
  documentType?: DocumentType | string;
  documentNumber?: string;
  phone?: string;
  city?: string;
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

function normalizeItems(input: unknown): OrderItem[] {
  if (!Array.isArray(input)) return [];
  return input.map((raw: any) => ({
    id: String(raw?.id || raw?.product_id || crypto.randomUUID()),
    product_id: raw?.product_id ? String(raw.product_id) : null,
    name: raw?.name ? String(raw.name) : null,
    qty: Number.isFinite(Number(raw?.qty)) ? Number(raw.qty) : 1,
    price: Number.isFinite(Number(raw?.price)) ? Number(raw.price) : 0,
    image: raw?.image ? String(raw.image) : null,
    size: raw?.size ? String(raw.size) : null,
    color: raw?.color ? String(raw.color) : null,
  }));
}

function sumQty(items: OrderItem[]) {
  return items.reduce((acc, it) => acc + Math.max(1, Number(it.qty || 1)), 0);
}

function normalizeDocumentType(value: unknown): DocumentType | "" {
  const v = String(value || "").trim().toUpperCase();
  if (v === "CC" || v === "CE" || v === "NIT" || v === "PAS") return v;
  return "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildAdminNote(input: {
  notes: string;
  email: string;
  documentType: DocumentType;
  documentNumber: string;
}) {
  const blocks = [
    input.notes.trim(),
    `Email: ${input.email}`,
    `Documento: ${input.documentType} ${input.documentNumber}`,
  ].filter(Boolean);

  return blocks.join("\n");
}

async function getAuthedUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE_AT)?.value?.trim();

  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Debes iniciar sesión para continuar con el pago." },
        { status: 401 }
      );
    }

    const pubKey = (process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "").trim();
    const integrity = (process.env.WOMPI_INTEGRITY_SECRET || "").trim();

    if (!isValidPubKey(pubKey)) {
      return NextResponse.json(
        { ok: false, error: "Falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY (pub_test_... o pub_prod_...)" },
        { status: 400 }
      );
    }

    if (!integrity) {
      return NextResponse.json(
        { ok: false, error: "Falta WOMPI_INTEGRITY_SECRET (secret de integridad)" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as any;

    const amountInCents = Number(body?.amountInCents);
    const currency = String(body?.currency || "COP").toUpperCase();
    const reference = String(body?.reference || "").trim();

    const shipping: Shipping =
      body?.shipping && typeof body.shipping === "object" ? (body.shipping as Shipping) : {};

    const customer: Customer =
      body?.customer && typeof body.customer === "object" ? (body.customer as Customer) : {};

    const totals: Totals =
      body?.totals && typeof body.totals === "object" ? (body.totals as Totals) : {};

    const items = normalizeItems(body?.items);

    const fullName = String(customer.fullName || shipping.fullName || "").trim();
    const email = String(customer.email || shipping.email || "").trim().toLowerCase();
    const documentType = normalizeDocumentType(customer.documentType || shipping.documentType);
    const documentNumber = String(customer.documentNumber || shipping.documentNumber || "").trim();

    const phone = String(customer.phone || shipping.phone || "").trim();
    const city = String(shipping.city || "").trim();
    const addressLine1 = String(shipping.addressLine1 || "").trim();
    const region = String(shipping.region || "").trim();
    const country = String(shipping.country || "CO").trim().toUpperCase();
    const notes = String(shipping.notes || "").trim();

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ ok: false, error: "amountInCents inválido" }, { status: 400 });
    }

    if (currency !== "COP") {
      return NextResponse.json({ ok: false, error: "currency debe ser COP" }, { status: 400 });
    }

    if (!reference) {
      return NextResponse.json({ ok: false, error: "reference requerida" }, { status: 400 });
    }

    if (!fullName || !email || !documentType || !documentNumber || !phone || !city || !addressLine1 || !region) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan datos obligatorios (nombre, correo, tipo de documento, número de documento, teléfono, ciudad, región y dirección).",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Correo electrónico inválido." }, { status: 400 });
    }

    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json(
        { ok: false, error: "shipping.country inválido. Debe ser código ISO de 2 letras, por ejemplo CO." },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json({ ok: false, error: "No hay items para procesar la compra." }, { status: 400 });
    }

    const totalFromBody = Number(totals.total);
    const totalCalculated = amountInCents / 100;

    if (!Number.isFinite(totalFromBody) || Math.round(totalFromBody) !== Math.round(totalCalculated)) {
      return NextResponse.json(
        { ok: false, error: "El total enviado no coincide con amountInCents." },
        { status: 400 }
      );
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    const origin = siteUrl || pickOrigin(req);

    if (!origin) {
      return NextResponse.json(
        { ok: false, error: "No se pudo inferir el origin. Define NEXT_PUBLIC_SITE_URL." },
        { status: 400 }
      );
    }

    const redirectUrl = `${origin}/checkout/success?reference=${encodeURIComponent(reference)}`;
    const signature = sha256Hex(`${reference}${amountInCents}${currency}${integrity}`);
    const adminNote = buildAdminNote({
      notes,
      email,
      documentType,
      documentNumber,
    });

    await dbUpsertOrder({
      order_code: reference,
      wompi_reference: reference,
      status: "pending",
      total_amount: totalCalculated,
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
      payment_id: null,
      items,
      admin_note: adminNote || null,
    });

    await dbInsertLog({
      level: "info",
      scope: "wompi.checkout-url",
      message: "Checkout Wompi creado",
      order_id: reference,
      meta: {
        reference,
        amountInCents,
        currency,
        redirectUrl,
        customer_email: email,
        customer_document_type: documentType,
        customer_document_number: documentNumber,
        shipping_address_line_1: addressLine1,
        shipping_region: region,
      },
    });

    const u = new URL("https://checkout.wompi.co/p/");
    u.searchParams.set("public-key", pubKey);
    u.searchParams.set("currency", currency);
    u.searchParams.set("amount-in-cents", String(amountInCents));
    u.searchParams.set("reference", reference);
    u.searchParams.set("signature:integrity", signature);
    u.searchParams.set("redirect-url", redirectUrl);

    u.searchParams.set("collect-shipping", "true");
    u.searchParams.set("shipping-address:address-line-1", addressLine1);
    u.searchParams.set("shipping-address:country", country);
    u.searchParams.set("shipping-address:city", city);
    u.searchParams.set("shipping-address:phone-number", phone);
    u.searchParams.set("shipping-address:region", region);
    u.searchParams.set("shipping-address:name", fullName);

    return NextResponse.json({
      ok: true,
      checkoutUrl: u.toString(),
      reference,
      amountInCents,
      currency,
      redirectUrl,
    });
  } catch (e: any) {
    try {
      await dbInsertLog({
        level: "error",
        scope: "wompi.checkout-url",
        message: e?.message || "Error inesperado creando checkout Wompi",
        meta: {
          stack: e?.stack || null,
        },
      });
    } catch {}

    return NextResponse.json(
      { ok: false, error: e?.message || "Error inesperado creando sesión Wompi" },
      { status: 500 }
    );
  }
}