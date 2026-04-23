import { NextResponse } from "next/server";
import { verifyAccessToken, COOKIE_AT } from "@/lib/auth";

// 🔥 FIX: agregar esta función (era lo que faltaba)
function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

// 🔥 helpers mínimos (si ya los tienes en otro lado, esto no rompe)
function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "http";
  const host = req.headers.get("host") || url.host;
  return `${proto}://${host}`;
}

function normalizeItems(items: any[]) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: item.id,
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
  }));
}

function calculateTotal(items: any[]) {
  return items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

function makeReference() {
  return `JUSP-${Date.now()}`;
}

export async function POST(req: Request) {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401 }
      );
    }

    const verified = await verifyAccessToken(accessToken).catch(() => null);

    if (!verified?.sub) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const items = normalizeItems(body?.items || []);
    const reference = String(body?.reference || makeReference()).trim();

    if (!items.length) {
      return NextResponse.json(
        { ok: false, error: "Items requeridos" },
        { status: 400 }
      );
    }

    const total = Math.round(calculateTotal(items));
    const amountInCents = total * 100;

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "amountInCents inválido" },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(req);

    const wompiRes = await fetch(`${baseUrl}/api/wompi/checkout-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_AT}=${accessToken}`,
      },
      body: JSON.stringify({
        reference,
        items,
        amountInCents,
        currency: "COP",
        totals: { total },
        customer: {
          fullName: verified.name || "Cliente JUSP",
          email: verified.email,
          documentType: "CC",
          documentNumber: "000000000",
          phone: "3000000000",
        },
        shipping: {
          addressLine1: "Por definir",
          city: "Cali",
          region: "Valle del Cauca",
          country: "CO",
        },
      }),
    });

    const wompiJson = await wompiRes.json().catch(() => ({}));

    if (!wompiRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "wompi",
          error: wompiJson?.error || "Error creando checkout",
        },
        { status: wompiRes.status }
      );
    }

    const checkoutUrl =
      wompiJson?.checkoutUrl ||
      wompiJson?.url ||
      wompiJson?.data?.checkoutUrl ||
      wompiJson?.data?.url;

    return NextResponse.json({
      ok: true,
      reference,
      checkoutUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mobile checkout error",
      },
      { status: 500 }
    );
  }
}