// app/api/wompi/session/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function isValidPubKey(k: string) {
  return typeof k === "string" && (k.startsWith("pub_test_") || k.startsWith("pub_prod_"));
}

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
      return NextResponse.json({ ok: false, error: "Falta WOMPI_INTEGRITY_SECRET (secret de integridad)" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);

    const amountInCents = Number(body?.amountInCents);
    const currency = String(body?.currency || "COP").toUpperCase();
    const reference = String(body?.reference || "").trim();
    const redirectUrl = String(body?.redirectUrl || "").trim();

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ ok: false, error: "amountInCents inválido" }, { status: 400 });
    }
    if (currency !== "COP") {
      return NextResponse.json({ ok: false, error: "currency debe ser COP" }, { status: 400 });
    }
    if (!reference) {
      return NextResponse.json({ ok: false, error: "reference requerida" }, { status: 400 });
    }
    if (!redirectUrl) {
      return NextResponse.json({ ok: false, error: "redirectUrl requerida" }, { status: 400 });
    }

    // Firma de integridad Wompi:
    // "<Referencia><MontoEnCentavos><Moneda><SecretoIntegridad>"
    const signature = sha256Hex(`${reference}${amountInCents}${currency}${integrity}`);

    // Hosted Checkout URL
    const u = new URL("https://checkout.wompi.co/p/");
    u.searchParams.set("public-key", pubKey);
    u.searchParams.set("currency", currency);
    u.searchParams.set("amount-in-cents", String(amountInCents));
    u.searchParams.set("reference", reference);
    u.searchParams.set("signature:integrity", signature);
    u.searchParams.set("redirect-url", redirectUrl);

    return NextResponse.json({
      ok: true,
      checkoutUrl: u.toString(),
      reference,
      amountInCents,
      currency,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error inesperado creando sesión Wompi" }, { status: 500 });
  }
}