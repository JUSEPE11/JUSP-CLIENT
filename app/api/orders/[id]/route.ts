import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars (URL / KEY)");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** ✅ Gate duro: requiere cookie HttpOnly + JWT válido */
async function requireSession(req: NextRequest) {
  const at = req.cookies.get(COOKIE_AT)?.value;
  if (!at) {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: "No session" }, { status: 401 }),
    };
  }

  try {
    const payload = await verifyAccessToken(at);
    return { ok: true as const, payload };
  } catch {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 }),
    };
  }
}

/**
 * ✅ Next 16: en algunos builds, ctx.params viene como Promise
 */
type Ctx = { params: Promise<{ id: string }> };

type JsonMap = Record<string, any>;

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asNullableString(value: unknown): string | null {
  const str = asString(value, "").trim();
  return str ? str : null;
}

function pickFirstString(obj: JsonMap, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = obj[key];
    const str = asString(value, "").trim();
    if (str) return str;
  }
  return fallback;
}

function pickFirstNullableString(obj: JsonMap, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    const str = asString(value, "").trim();
    if (str) return str;
  }
  return null;
}

function pickFirstNumber(obj: JsonMap, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = obj[key];
    const n = asNumber(value, Number.NaN);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeOrigin(raw: string): "DALLAS" | "MIAMI" {
  const v = raw.trim().toUpperCase();

  if (
    v.includes("MIAMI") ||
    v === "MIA" ||
    v === "FL" ||
    v.includes("FLORIDA")
  ) {
    return "MIAMI";
  }

  return "DALLAS";
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "ORDER_CONFIRMED":
      return "Pedido confirmado";
    case "PREPARING_ORDER":
      return "Preparando tu pedido";
    case "ARRIVED_DALLAS":
      return "En hub logístico (Dallas)";
    case "ARRIVED_MIAMI":
      return "En hub logístico (Miami)";
    case "HUB_RECEIVED":
      return "Recibido en hub logístico";
    case "INTERNATIONAL_TRANSIT":
      return "En camino a tu país";
    case "ARRIVED_COUNTRY":
      return "Llegó a tu país";
    case "CUSTOMS_CLEARANCE":
      return "En proceso aduanero";
    case "LOCAL_COURIER":
      return "Recibido por courier local";
    case "OUT_FOR_DELIVERY":
      return "En reparto";
    case "DELIVERED":
      return "Entregado";
    case "DELAYED":
      return "Demora logística";
    default:
      return "Estado actualizado";
  }
}

function getProgressPercent(status: string): number {
  switch (status) {
    case "ORDER_CONFIRMED":
      return 10;
    case "PREPARING_ORDER":
      return 20;
    case "ARRIVED_DALLAS":
    case "ARRIVED_MIAMI":
    case "HUB_RECEIVED":
      return 38;
    case "INTERNATIONAL_TRANSIT":
      return 58;
    case "ARRIVED_COUNTRY":
    case "CUSTOMS_CLEARANCE":
    case "LOCAL_COURIER":
      return 76;
    case "OUT_FOR_DELIVERY":
      return 92;
    case "DELIVERED":
      return 100;
    case "DELAYED":
      return 64;
    default:
      return 18;
  }
}

function getHealthTone(status: string): "green" | "yellow" | "red" {
  if (status === "DELAYED") return "yellow";
  return "green";
}

function getHealthLabel(status: string): string {
  if (status === "DELAYED") return "Demora logística";
  if (status === "DELIVERED") return "Entregado correctamente";
  return "Normal";
}

function buildTimeline(
  status: string,
  shippingOrigin: "DALLAS" | "MIAMI",
  destinationCountry: string,
  destinationCity: string,
  destinationAddress: string,
  dates?: {
    confirmed_at?: string | null;
    preparing_at?: string | null;
    hub_received_at?: string | null;
    international_transit_at?: string | null;
    arrived_country_at?: string | null;
    local_courier_at?: string | null;
    out_for_delivery_at?: string | null;
    delivered_at?: string | null;
  }
) {
  const originLabel =
    shippingOrigin === "MIAMI" ? "Miami, Florida 🇺🇸" : "Dallas, Texas 🇺🇸";

  const allSteps = [
    {
      key: "confirmed",
      label: "Pedido confirmado",
      location: "JUSP",
      description: "Recibimos tu orden y comenzamos validación.",
      date: dates?.confirmed_at ?? null,
      activeFor: [
        "ORDER_CONFIRMED",
        "PREPARING_ORDER",
        "ARRIVED_DALLAS",
        "ARRIVED_MIAMI",
        "HUB_RECEIVED",
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "preparing",
      label: "Preparando tu pedido",
      location: "Centro de procesamiento JUSP",
      description: "Confirmamos producto, compra y salida hacia hub.",
      date: dates?.preparing_at ?? null,
      activeFor: [
        "PREPARING_ORDER",
        "ARRIVED_DALLAS",
        "ARRIVED_MIAMI",
        "HUB_RECEIVED",
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "hub",
      label:
        shippingOrigin === "MIAMI"
          ? "Recibido en hub JUSP Miami"
          : "Recibido en hub JUSP Dallas",
      location: originLabel,
      description: "Tu pedido ya está en el punto de salida internacional.",
      date: dates?.hub_received_at ?? null,
      activeFor: [
        "ARRIVED_DALLAS",
        "ARRIVED_MIAMI",
        "HUB_RECEIVED",
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "international",
      label: "En camino a tu país",
      location: `Ruta internacional → ${destinationCountry || "País destino"}`,
      description: "En tránsito desde el hub logístico hacia destino.",
      date: dates?.international_transit_at ?? null,
      activeFor: [
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "country",
      label: "Llegó a tu país",
      location: destinationCountry || "País destino",
      description: "Ingreso confirmado al país de destino.",
      date: dates?.arrived_country_at ?? null,
      activeFor: [
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "city",
      label: "En courier local",
      location: destinationCity || "Ciudad destino",
      description: "Última milla en preparación.",
      date: dates?.local_courier_at ?? null,
      activeFor: [
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "address",
      label: "En camino a tu dirección",
      location: destinationAddress || "Dirección del cliente",
      description: "Entrega final hacia la dirección registrada.",
      date: dates?.out_for_delivery_at ?? null,
      activeFor: ["OUT_FOR_DELIVERY", "DELIVERED", "DELAYED"],
    },
    {
      key: "delivered",
      label: "Entregado",
      location: destinationAddress || "Dirección del cliente",
      description: "Pedido entregado correctamente.",
      date: dates?.delivered_at ?? null,
      activeFor: ["DELIVERED"],
    },
  ];

  const currentIndex = allSteps.findIndex((step) =>
    step.activeFor.includes(status)
  );
  const normalizedCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  return allSteps.map((step, index) => {
    let stepStatus: "done" | "current" | "upcoming" = "upcoming";

    if (status === "DELIVERED") {
      stepStatus = "done";
    } else if (index < normalizedCurrentIndex) {
      stepStatus = "done";
    } else if (index === normalizedCurrentIndex) {
      stepStatus = "current";
    }

    return {
      key: step.key,
      label: step.label,
      location: step.location,
      description: step.description,
      date: step.date,
      status: stepStatus,
    };
  });
}

function normalizeOrderForTracking(row: JsonMap) {
  const status = pickFirstString(
    row,
    ["status", "order_status", "shipping_status"],
    "ORDER_CONFIRMED"
  ).toUpperCase();

  const originRaw = pickFirstString(
    row,
    ["shipping_origin", "origin_hub", "origin", "hub", "warehouse_origin"],
    "DALLAS"
  );

  const shippingOrigin = normalizeOrigin(originRaw);

  const destinationCountry = pickFirstString(row, [
    "destination_country",
    "shipping_country",
    "country",
    "country_name",
  ], "País destino");

  const destinationCity = pickFirstString(row, [
    "destination_city",
    "shipping_city",
    "city",
  ], "Ciudad destino");

  const destinationAddress = pickFirstString(row, [
    "destination_address",
    "shipping_address",
    "customer_address",
    "address",
    "address_line_1",
  ], "Dirección del cliente");

  const customerName = pickFirstString(row, [
    "customer_name",
    "full_name",
    "name",
  ], "Cliente JUSP");

  const customerEmail = pickFirstString(row, [
    "customer_email",
    "email",
  ], "");

  const trackingCode = pickFirstString(row, [
    "tracking_code",
    "tracking",
    "guide",
    "shipping_guide",
  ], "Pendiente");

  const trackingUrl = pickFirstString(row, [
    "tracking_url",
    "courier_tracking_url",
    "guide_url",
  ], "");

  const courierName = pickFirstString(row, [
    "courier_name",
    "courier",
    "shipping_carrier",
  ], "Courier internacional");

  const etaLabel = pickFirstString(row, [
    "eta_label",
    "estimated_delivery_label",
    "delivery_eta",
  ], "3-7 días hábiles");

  const productTitle = pickFirstString(row, [
    "product_title",
    "title",
    "item_name",
    "name",
  ], "Tu pedido JUSP");

  const productImage = pickFirstString(row, [
    "product_image",
    "image",
    "image_url",
    "photo",
    "thumbnail",
  ], "");

  const progressPercent = pickFirstNumber(
    row,
    ["progress_percent", "progress"],
    getProgressPercent(status)
  );

  const healthToneRaw = pickFirstString(
    row,
    ["health_tone"],
    getHealthTone(status)
  ).toLowerCase();

  const healthTone: "green" | "yellow" | "red" =
    healthToneRaw === "red"
      ? "red"
      : healthToneRaw === "yellow"
      ? "yellow"
      : "green";

  const healthLabel = pickFirstString(
    row,
    ["health_label"],
    getHealthLabel(status)
  );

  const timeline =
    Array.isArray(row.timeline) && row.timeline.length > 0
      ? row.timeline
      : buildTimeline(
          status,
          shippingOrigin,
          destinationCountry,
          destinationCity,
          destinationAddress,
          {
            confirmed_at: pickFirstNullableString(row, ["confirmed_at", "created_at"]),
            preparing_at: pickFirstNullableString(row, ["preparing_at"]),
            hub_received_at: pickFirstNullableString(row, [
              "hub_received_at",
              "arrived_dallas_at",
              "arrived_miami_at",
            ]),
            international_transit_at: pickFirstNullableString(row, [
              "international_transit_at",
            ]),
            arrived_country_at: pickFirstNullableString(row, [
              "arrived_country_at",
            ]),
            local_courier_at: pickFirstNullableString(row, ["local_courier_at"]),
            out_for_delivery_at: pickFirstNullableString(row, [
              "out_for_delivery_at",
            ]),
            delivered_at: pickFirstNullableString(row, ["delivered_at"]),
          }
        );

  return {
    id: asString(row.id, ""),
    orderCode: pickFirstString(row, ["order_code", "code"], ""),
    status,
    statusLabel: getStatusLabel(status),
    customerName,
    customerEmail,
    trackingCode,
    trackingUrl,
    courierName,
    etaLabel,
    shippingOrigin,
    destinationCountry,
    destinationCity,
    destinationAddress,
    productTitle,
    productImage,
    progressPercent,
    healthLabel,
    healthTone,
    lastUpdateLabel: pickFirstNullableString(row, ["updated_at", "created_at"]),
    timeline,
  };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const gate = await requireSession(req);
  if (!gate.ok) return gate.res;

  try {
    const { id } = await ctx.params;
    const cleanId = String(id || "").trim();

    if (!cleanId) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", cleanId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const normalizedOrder = normalizeOrderForTracking(data);

    const res = NextResponse.json(
      {
        ok: true,
        order: normalizedOrder,
        raw: data,
      },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireSession(req);
  if (!gate.ok) return gate.res;

  try {
    const { id } = await ctx.params;
    const cleanId = String(id || "").trim();

    if (!cleanId) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // 🔒 Whitelist de campos editables (evita dañar columnas)
    const patch: Record<string, any> = {};
    const ALLOWED = [
      "status",
      "tracking_code",
      "tracking_url",
      "notes",
      "updated_at",
      "courier_name",
      "eta_label",
      "shipping_origin",
      "destination_country",
      "destination_city",
      "destination_address",
      "customer_name",
      "customer_email",
      "product_title",
      "product_image",
      "confirmed_at",
      "preparing_at",
      "hub_received_at",
      "international_transit_at",
      "arrived_country_at",
      "local_courier_at",
      "out_for_delivery_at",
      "delivered_at",
      "timeline",
      "health_label",
      "health_tone",
      "progress_percent",
    ];

    for (const k of ALLOWED) {
      if (k in body) patch[k] = (body as any)[k];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No allowed fields to update" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", cleanId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const normalizedOrder = normalizeOrderForTracking(data);

    const res = NextResponse.json(
      {
        ok: true,
        order: normalizedOrder,
        raw: data,
      },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}