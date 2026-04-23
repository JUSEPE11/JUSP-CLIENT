import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function isValidPubKey(value: string) {
  return value.startsWith("pub_test_") || value.startsWith("pub_prod_");
}

function wompiBaseUrl(pubKey: string) {
  return pubKey.startsWith("pub_test_")
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";
}

export async function GET() {
  try {
    const publicKey = normalizeText(process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY);
    const privateKey = normalizeText(process.env.WOMPI_PRIVATE_KEY);

    if (!isValidPubKey(publicKey)) {
      return NextResponse.json(
        { ok: false, enabled: false, error: "NEXT_PUBLIC_WOMPI_PUBLIC_KEY no configurada." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const baseUrl = wompiBaseUrl(publicKey);
    const merchantRes = await fetch(`${baseUrl}/merchants/${encodeURIComponent(publicKey)}`, {
      method: "GET",
      cache: "no-store",
    });

    const merchantJson = await merchantRes.json().catch(() => null);
    const merchant = merchantJson?.data || {};
    const acceptance = merchant?.presigned_acceptance || {};
    const personalAuth = merchant?.presigned_personal_data_auth || {};

    const acceptanceToken = normalizeText(acceptance?.acceptance_token);
    const acceptPersonalAuth = normalizeText(personalAuth?.acceptance_token);

    const enabled = Boolean(publicKey && privateKey && acceptanceToken && acceptPersonalAuth);

    return NextResponse.json(
      {
        ok: true,
        enabled,
        mode: enabled ? "real" : "disabled",
        publicKey,
        environment: publicKey.startsWith("pub_test_") ? "sandbox" : "production",
        acceptanceToken,
        acceptPersonalAuth,
        acceptancePermalink: normalizeText(acceptance?.permalink),
        personalDataPermalink: normalizeText(personalAuth?.permalink),
        reason: enabled
          ? null
          : !privateKey
            ? "Falta WOMPI_PRIVATE_KEY para crear payment sources reales."
            : "No se pudieron obtener los acceptance tokens del comercio.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        enabled: false,
        error: error?.message || "No se pudo cargar la configuración de tokenización de Wompi.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
