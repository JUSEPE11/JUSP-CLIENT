import { NextRequest, NextResponse } from "next/server";
import { requirePaymentIdentity, listSavedPaymentMethodsForIdentity, upsertSavedPaymentMethodForIdentity } from "@/lib/paymentMethods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function wompiBaseUrl(publicKey: string) {
  return publicKey.startsWith("pub_test_")
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";
}

export async function POST(req: NextRequest) {
  const identity = await requirePaymentIdentity(req);
  if (!identity?.email) {
    return NextResponse.json(
      { ok: false, error: "Debes iniciar sesión para guardar una tarjeta." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const publicKey = normalizeText(process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY);
    const privateKey = normalizeText(process.env.WOMPI_PRIVATE_KEY);

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "La tokenización real de Wompi no está habilitada todavía en esta integración.",
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const tokenId = normalizeText(body?.tokenId);
    const acceptanceToken = normalizeText(body?.acceptanceToken);
    const acceptPersonalAuth = normalizeText(body?.acceptPersonalAuth);
    const installments = Math.max(1, Number(body?.installments || 1));
    const label = normalizeText(body?.label);
    const cardholderName = normalizeText(body?.cardholderName);
    const expMonth = normalizeText(body?.expMonth);
    const expYear = normalizeText(body?.expYear);
    const customerEmail = normalizeEmail(body?.customerEmail || identity.email);

    if (!tokenId || !acceptanceToken || !acceptPersonalAuth || !customerEmail) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos para crear la fuente de pago real en Wompi." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const baseUrl = wompiBaseUrl(publicKey);
    const wompiRes = await fetch(`${baseUrl}/payment_sources`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "CARD",
        token: tokenId,
        customer_email: customerEmail,
        acceptance_token: acceptanceToken,
        accept_personal_auth: acceptPersonalAuth,
        installments,
      }),
    });

    const wompiJson = await wompiRes.json().catch(() => null);
    const source = wompiJson?.data || {};

    if (!wompiRes.ok || !source?.id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            wompiJson?.error?.reason ||
            wompiJson?.error?.messages?.[0] ||
            wompiJson?.error?.type ||
            "Wompi no permitió crear la payment source.",
          wompi: wompiJson,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const existingMethods = await listSavedPaymentMethodsForIdentity(identity);
    const method = await upsertSavedPaymentMethodForIdentity(identity, {
      id: normalizeText(source?.id) || `pm_${Date.now()}`,
      label: label || undefined,
      brand: normalizeText(source?.public_data?.brand) || normalizeText(body?.brand),
      last4:
        normalizeText(source?.public_data?.last_four) ||
        normalizeText(body?.last4),
      cardholderName,
      expMonth,
      expYear,
      provider: "wompi",
      isDefault: body?.isDefault ?? existingMethods.length === 0,
      paymentSourceId: normalizeText(source?.id),
      sourceStatus: normalizeText(source?.status) || "AVAILABLE",
      tokenizationMode: "real",
      customerEmail,
    });

    const paymentMethods = await listSavedPaymentMethodsForIdentity(identity);

    return NextResponse.json(
      {
        ok: true,
        paymentMethod: method,
        paymentMethods,
        wompiSourceId: normalizeText(source?.id),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "No se pudo tokenizar y guardar la tarjeta en Wompi.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
