import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CatalogProduct = Record<string, unknown>;

type ProductVisualIndexEntry = {
  id: string;
  title: string;
  brand: string;
  category: string;
  gender: string;
  colors: string[];
  images: string[];
  searchText: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return "";
}

function pushValue(target: string[], value: unknown) {
  if (Array.isArray(value)) {
    for (const item of value) pushValue(target, item);
    return;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) pushValue(target, item);
    return;
  }

  const text = String(value ?? "").trim();
  if (text) target.push(text);
}

function getProductImages(product: CatalogProduct): string[] {
  const values: string[] = [];
  const seen = new Set<string>();
  const imagePattern = /(?:^data:image\/|\.(?:png|jpe?g|webp|gif|avif)(?:[?#].*)?$|\/image\/|\/images\/|\/media\/|cdn|cloudinary|shopify|supabase|storage|firebasestorage|alicdn|amazonaws|googleusercontent)/i;

  function add(value: unknown) {
    const raw = String(value ?? "").trim();
    if (!raw) return;

    const parts = raw.startsWith("[") && raw.endsWith("]")
      ? (() => {
          try {
            const parsed = JSON.parse(raw);
            const arr: string[] = [];
            pushValue(arr, parsed);
            return arr;
          } catch {
            return [raw];
          }
        })()
      : raw.split(/\s*(?:,|\||;|\n|\r)\s*/g);

    for (const part of parts) {
      const clean = String(part ?? "").trim().replace(/^['"]+|['"]+$/g, "").replace(/&amp;/g, "&");
      if (!clean || seen.has(clean) || !imagePattern.test(clean)) continue;
      seen.add(clean);
      values.push(clean);
    }
  }

  function walk(value: unknown, depth = 0, imageContext = false) {
    if (depth > 6 || value == null) return;

    if (typeof value === "string") {
      if (imageContext || imagePattern.test(value)) add(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1, imageContext);
      return;
    }

    if (typeof value === "object") {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        const keyLooksImage = /image|img|photo|picture|media|gallery|thumbnail|thumb|src|url/i.test(key);
        walk(nested, depth + 1, imageContext || keyLooksImage);
      }
    }
  }

  walk(product);
  return values.slice(0, 12);
}

function inferColors(product: CatalogProduct): string[] {
  const haystack = normalize([
    product.color,
    product.colors,
    product.colour,
    product.title,
    product.name,
    product.description,
    product.tags,
  ].map((value) => {
    const out: string[] = [];
    pushValue(out, value);
    return out.join(" ");
  }).join(" "));

  const map: Record<string, string[]> = {
    black: ["black", "negro"],
    white: ["white", "blanco"],
    red: ["red", "rojo"],
    blue: ["blue", "azul"],
    green: ["green", "verde"],
    gray: ["gray", "grey", "gris"],
    beige: ["beige", "cream", "crema"],
    brown: ["brown", "cafe", "marron"],
    pink: ["pink", "rosa"],
    purple: ["purple", "morado"],
    yellow: ["yellow", "amarillo"],
    orange: ["orange", "naranja"],
  };

  return Object.entries(map)
    .filter(([, aliases]) => aliases.some((alias) => haystack.includes(alias)))
    .map(([color]) => color);
}

function buildEntry(product: CatalogProduct): ProductVisualIndexEntry {
  const id = firstString(product.id, product.sku, product.slug, product.product_id, product.title, product.name);
  const title = firstString(product.title, product.name, product.productName);
  const brand = firstString(product.brand, product.marca);
  const category = firstString(product.category, product.kind, product.type, product.categoria);
  const gender = firstString(product.gender, product.genero, product.audience);
  const colors = inferColors(product);
  const images = getProductImages(product);

  const extra: string[] = [];
  pushValue(extra, product.tags);
  pushValue(extra, product.collections);
  pushValue(extra, product.sport);
  pushValue(extra, product.models);
  pushValue(extra, product.slug);

  return {
    id,
    title,
    brand,
    category,
    gender,
    colors,
    images,
    searchText: normalize([id, title, brand, category, gender, colors.join(" "), extra.join(" ")].join(" ")),
  };
}

async function getCatalog(req: NextRequest): Promise<CatalogProduct[]> {
  const origin = req.nextUrl.origin;
  const response = await fetch(`${origin}/api/products?__visual_index=${Date.now()}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) return [];

  const payload = await response.json();
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const catalog = await getCatalog(req);
    const entries = catalog
      .map(buildEntry)
      .filter((entry) => entry.id && entry.title && entry.images.length > 0);

    return json({
      ok: true,
      count: entries.length,
      version: "jusp_visual_index_v1",
      entries,
    });
  } catch {
    return json({ ok: false, error: "visual_index_failed", entries: [] }, 500);
  }
}
