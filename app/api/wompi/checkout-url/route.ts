// src/app/api/wompi/checkout-url/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function isValidPubKey(k: string) {
  return typeof k === "string" && (k.startsWith("pub_test_") || k.startsWith("pub_prod_"));
}

function pickOrigin(req: Request) {
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

type Shipping = {
  fullName?: string;
  phone?: string;
  city?: string;
  addressLine1?: string;
  region?: string;
  country?: string;
};

export async function POST(req: Request) {
  try {
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

    const fullName = String(shipping.fullName || "").trim();
    const phone = String(shipping.phone || "").trim();
    const city = String(shipping.city || "").trim();
    const addressLine1 = String(shipping.addressLine1 || "").trim();
    const region = String(shipping.region || "").trim();
    const country = String(shipping.country || "CO").trim().toUpperCase();

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ ok: false, error: "amountInCents inválido" }, { status: 400 });
    }

    if (currency !== "COP") {
      return NextResponse.json({ ok: false, error: "currency debe ser COP" }, { status: 400 });
    }

    if (!reference) {
      return NextResponse.json({ ok: false, error: "reference requerida" }, { status: 400 });
    }

    if (!fullName || !phone || !city || !addressLine1 || !region) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan datos de envío obligatorios (nombre, teléfono, ciudad, región, dirección).",
        },
        { status: 400 }
      );
    }

    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json(
        { ok: false, error: "shipping.country inválido. Debe ser código ISO de 2 letras, por ejemplo CO." },
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

    const redirectUrl = `${origin}/checkout/success`;

    // Wompi Checkout Web usa firma de integridad sobre:
    // "<reference><amount-in-cents><currency><integrity_secret>"
    const signature = sha256Hex(`${reference}${amountInCents}${currency}${integrity}`);

    const u = new URL("https://checkout.wompi.co/p/");
    u.searchParams.set("public-key", pubKey);
    u.searchParams.set("currency", currency);
    u.searchParams.set("amount-in-cents", String(amountInCents));
    u.searchParams.set("reference", reference);
    u.searchParams.set("signature:integrity", signature);
    u.searchParams.set("redirect-url", redirectUrl);

    // Activa el formulario de envío en Wompi
    u.searchParams.set("collect-shipping", "true");

    // Shipping address correcto según Wompi
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
    return NextResponse.json(
      { ok: false, error: e?.message || "Error inesperado creando sesión Wompi" },
      { status: 500 }
    );
  }
}