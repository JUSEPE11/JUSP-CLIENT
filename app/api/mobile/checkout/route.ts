import { NextResponse } from "next/server";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "http";
  const host = req.headers.get("host") || url.host;

  return `${proto}://${host}`;
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

function normalizeItems(items: any[]) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: item?.id,
      productId: item?.productId ?? item?.id,
      slug: item?.slug ?? null,
      name: item?.name ?? item?.title ?? null,
      title: item?.title ?? item?.name ?? null,
      price: item?.price ?? 0,
      qty: item?.qty ?? item?.quantity ?? item?.qtyInCart ?? 1,
      quantity: item?.quantity ?? item?.qty ?? item?.qtyInCart ?? 1,
      image: item?.image ?? null,
      brand: item?.brand ?? null,
      size: item?.size ?? null,
      color: item?.color ?? null,
    }))
    .filter((item) => item.productId);
}

function makeReference() {
  return `MOB-${Date.now()}`;
}

export async function POST(req: Request) {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const verified = await verifyAccessToken(accessToken).catch(() => null);

    if (!verified?.sub) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const items = normalizeItems(body?.items || []);
    const reference = String(body?.reference || makeReference()).trim();

    if (!items.length) {
      return NextResponse.json(
        { ok: false, error: "Items requeridos" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const baseUrl = getBaseUrl(req);

    // 1) Reutiliza la lógica real de creación de orden
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_AT}=${accessToken}`,
      },
      body: JSON.stringify({
        reference,
        items,
      }),
      cache: "no-store",
    });

    const orderJson = await orderRes.json().catch(() => ({}));

    if (!orderRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "order",
          error: orderJson?.error || "No se pudo crear la orden",
          details: orderJson,
        },
        {
          status: orderRes.status,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    // Intenta sacar datos útiles de la orden creada
    const createdOrder =
      orderJson?.order ||
      orderJson?.data ||
      orderJson?.result ||
      orderJson ||
      null;

    const orderId =
      createdOrder?.id ||
      createdOrder?.order_id ||
      createdOrder?.orderId ||
      null;

    const wompiPayload = {
      orderId,
      reference,
      items,
    };

    // 2) Reutiliza la lógica real de Wompi
    const wompiRes = await fetch(`${baseUrl}/api/wompi/checkout-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_AT}=${accessToken}`,
      },
      body: JSON.stringify(wompiPayload),
      cache: "no-store",
    });

    const wompiJson = await wompiRes.json().catch(() => ({}));

    if (!wompiRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "wompi",
          error: wompiJson?.error || "Orden creada pero checkout falló",
          order: createdOrder,
          details: wompiJson,
        },
        {
          status: wompiRes.status,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const checkoutUrl =
      wompiJson?.checkoutUrl ||
      wompiJson?.url ||
      wompiJson?.data?.checkoutUrl ||
      wompiJson?.data?.url ||
      null;

    return NextResponse.json(
      {
        ok: true,
        reference,
        order: createdOrder,
        checkoutUrl,
        wompi: wompiJson,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mobile checkout error",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}