import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { resolveFlashWindow } from "@/lib/flash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductVariant = {
  key: string;
  color?: string;
  size?: string;
  price: number;
  stock?: number;
};

type ProductMediaItem = {
  type: "image" | "video";
  src: string;
};

type ProductParameter = {
  label: string;
  value: string;
  order?: number;
};

type Product = {
  id: string;
  slug?: string;
  product_code?: string;
  title: string;
  name?: string;
  price: number;
  currency?: string;
  description?: string;
  image?: string;
  images?: string[];
  videos?: string[];
  media?: ProductMediaItem[];
  parameters?: ProductParameter[];
  colors?: string[];
  sizes?: string[];
  category?: string;
  brand?: string;
  gender?: "men" | "women" | "kids" | "unisex";
  productType?: "shoes" | "clothing" | "accessory";
  kind?: string;
  sport?: string[];
  tags?: string[];
  isNew?: boolean;
  discountPercent?: number;
  stockHint?: number;
  pickupToday?: boolean;
  expressDelivery?: boolean;
  isFlash24h?: boolean;
  flashStartsAt?: string;
  flashExpiresAt?: string;
  flashActive?: boolean;
  flashUpcoming?: boolean;
  isActive?: boolean;
  variants?: ProductVariant[];
  favoritesCount?: number;
  isFavorite?: boolean;
};

type CachePayload = {
  version: number;
  generatedAt: string;
  excelPath: string | null;
  excelMtimeMs: number;
  products: Product[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_PATH = path.join(DATA_DIR, "catalog_products.cache.json");
const EXCEL_PATH = path.join(DATA_DIR, "catalogo_jusp.xlsx");
const PARAMETERS_PATH = path.join(DATA_DIR, "product_parameters.xlsx");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readWorkbook(filePath: string) {
  const bytes = fs.readFileSync(filePath);
  return XLSX.read(bytes, { type: "buffer" });
}

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toSafeBoolean(value: unknown): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "si", "sí", "x", "ok"].includes(v);
}

function normalizeHeaderKey(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getRowValue(row: Record<string, unknown>, possibleKeys: string[], fallback: unknown = "") {
  const normalizedMap = new Map<string, unknown>();

  for (const [key, value] of Object.entries(row)) {
    normalizedMap.set(normalizeHeaderKey(key), value);
  }

  for (const key of possibleKeys) {
    const hit = normalizedMap.get(normalizeHeaderKey(key));
    if (hit !== undefined) return hit;
  }

  return fallback;
}

function uniqCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }

  return out;
}

function normalizeColor(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function sanitizeVariantPart(value?: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function derivePriceFromVariants(variants?: ProductVariant[]): number {
  if (!variants?.length) return 0;
  return Math.min(...variants.map((variant) => variant.price));
}

function inferCategoryFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("dunk") || t.includes("air force") || t.includes("zapatilla") || t.includes("tenis") || t.includes("sneaker")) return "Sneakers";
  if (t.includes("gorra") || t.includes("cap")) return "Accessories";
  return "Apparel";
}

function inferProductType(title: string): "shoes" | "clothing" | "accessory" {
  const t = title.toLowerCase();
  if (t.includes("dunk") || t.includes("air force") || t.includes("zapatilla") || t.includes("tenis") || t.includes("sneaker")) return "shoes";
  if (t.includes("gorra") || t.includes("cap")) return "accessory";
  return "clothing";
}

function inferGender(title: string): "men" | "women" | "kids" | "unisex" {
  const t = title.toLowerCase();
  if (t.includes("niño") || t.includes("niños") || t.includes("kids")) return "kids";
  if (t.includes("mujer") || t.includes("women") || t.includes("bra") || t.includes("sujetador")) return "women";
  if (t.includes("hombre") || t.includes("men")) return "men";
  return "unisex";
}

function inferKind(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("leggings")) return "leggings";
  if (t.includes("short")) return "shorts";
  if (t.includes("gorra") || t.includes("cap")) return "gorras";
  if (t.includes("bra") || t.includes("sujetador")) return "sports-bra";
  if (t.includes("top")) return "tops";
  if (t.includes("dunk") || t.includes("air force") || t.includes("zapatilla") || t.includes("tenis") || t.includes("sneaker")) return "zapatillas";
  return "general";
}

function normalizeExcelGender(value: unknown): "men" | "women" | "kids" | "unisex" | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "men" || v === "women" || v === "kids" || v === "unisex") return v;
  if (v === "hombre") return "men";
  if (v === "mujer") return "women";
  if (["niños", "ninos", "niño", "nino", "kid"].includes(v)) return "kids";
  return null;
}

function listProductMedia(slug: string): ProductMediaItem[] {
  try {
    const dir = path.join(process.cwd(), "public", "products", slug);
    if (!fs.existsSync(dir)) return [];

    const files = fs
      .readdirSync(dir)
      .filter((file) => /\.(jpg|jpeg|png|webp|mp4|mov|webm|m4v)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    return files.map((file) => ({
      type: /\.(mp4|mov|webm|m4v)$/i.test(file) ? "video" : "image",
      src: `/products/${slug}/${file}`,
    }));
  } catch {
    return [];
  }
}

function loadProductParameters(): Map<string, ProductParameter[]> {
  try {
    if (!fs.existsSync(PARAMETERS_PATH)) return new Map();
    const workbook = readWorkbook(PARAMETERS_PATH);
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return new Map();

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: "",
      raw: false,
    }) as Record<string, unknown>[];

    const map = new Map<string, ProductParameter[]>();
    for (const row of rows) {
      const slug = String(getRowValue(row, ["product_slug", "slug"], "")).trim().toLowerCase();
      const label = String(getRowValue(row, ["label", "nombre", "campo", "parametro", "parámetro"], "")).trim();
      const value = String(getRowValue(row, ["value", "valor", "detalle", "descripcion"], "")).trim();
      const order = toSafeNumber(getRowValue(row, ["order", "orden", "display_order"], 0), 0);
      if (!slug || !label || !value) continue;

      const current = map.get(slug) ?? [];
      current.push({ label, value, order });
      map.set(slug, current);
    }

    for (const [slug, items] of map.entries()) {
      map.set(slug, items.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }

    return map;
  } catch {
    return new Map();
  }
}

function readCache(): CachePayload | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    return Array.isArray(parsed.products) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(products: Product[]) {
  ensureDataDir();
  const payload: CachePayload = {
    version: 10,
    generatedAt: new Date().toISOString(),
    excelPath: EXCEL_PATH,
    excelMtimeMs: fs.existsSync(EXCEL_PATH) ? fs.statSync(EXCEL_PATH).mtimeMs : 0,
    products,
  };

  fs.writeFileSync(CACHE_PATH, JSON.stringify(payload, null, 2), "utf8");
}

function buildProductsFromExcel(): Product[] {
  if (!fs.existsSync(EXCEL_PATH)) return [];

  const workbook = readWorkbook(EXCEL_PATH);
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: "",
    raw: false,
  }) as Record<string, unknown>[];

  const parameterMap = loadProductParameters();
  const map = new Map<string, Product>();

  for (const row of rows) {
    const slug = String(getRowValue(row, ["product_slug", "slug", "productslug"], "")).trim();
    const title = String(getRowValue(row, ["title", "titulo", "name", "nombre"], "")).trim();
    const brand = String(getRowValue(row, ["brand", "marca"], "JUSP")).trim();
    const size = String(getRowValue(row, ["size", "talla"], "")).trim();
    const color = normalizeColor(getRowValue(row, ["color", "colour"], ""));
    const price = toSafeNumber(getRowValue(row, ["price", "precio"], 0), 0);
    const stock = toSafeNumber(getRowValue(row, ["stock", "inventario"], 0), 0);
    const excelGender = normalizeExcelGender(getRowValue(row, ["gender", "genero", "género"], ""));
    const excelCategory = String(getRowValue(row, ["category", "categoria", "categoría"], "")).trim();
    const pickupToday = toSafeBoolean(getRowValue(row, ["pickup_today", "pickup", "retiro_hoy"], ""));
    const expressDelivery = toSafeBoolean(getRowValue(row, ["express_delivery", "express", "envio_express"], ""));
    const flashWindow = resolveFlashWindow({
      isFlash24h: getRowValue(row, ["is_flash_24h", "flash_24h", "flash24h"], ""),
      flashStartsAt: getRowValue(row, ["flash_starts_at", "flash_start", "inicio_flash"], ""),
      flashExpiresAt: getRowValue(row, ["flash_expires_at", "flash_end", "fin_flash"], ""),
    });
    const discountPercent = toSafeNumber(getRowValue(row, ["discount_percent", "discount", "descuento"], 0), 0);
    const rowIsActive = getRowValue(row, ["is_active", "active", "activo"], "");
    const isRowActive = String(rowIsActive).trim() ? toSafeBoolean(rowIsActive) : true;

    if (!slug || !title || price <= 0) continue;

    if (!map.has(slug)) {
      const media = listProductMedia(slug);
      const images = media.filter((item) => item.type === "image").map((item) => item.src);
      const videos = media.filter((item) => item.type === "video").map((item) => item.src);

      map.set(slug, {
        id: slug,
        slug,
        product_code: slug,
        title,
        name: title,
        price,
        currency: "COP",
        description: `${title}. Producto disponible en JUSP.`,
        image: images[0],
        images,
        videos,
        media,
        parameters: parameterMap.get(slug.toLowerCase()) ?? [],
        colors: [],
        sizes: [],
        category: excelCategory || inferCategoryFromTitle(title),
        brand,
        gender: excelGender || inferGender(title),
        productType: inferProductType(title),
        kind: inferKind(title),
        sport: ["lifestyle"],
        tags: ["nuevo"],
        isNew: true,
        discountPercent: discountPercent > 0 ? discountPercent : undefined,
        stockHint: 0,
        pickupToday,
        expressDelivery,
        isFlash24h: flashWindow.isFlash24h,
        flashStartsAt: flashWindow.flashStartsAt,
        flashExpiresAt: flashWindow.flashExpiresAt,
        flashActive: flashWindow.flashActive,
        flashUpcoming: flashWindow.flashUpcoming,
        isActive: isRowActive,
        variants: [],
        favoritesCount: 0,
        isFavorite: false,
      });
    }

    const product = map.get(slug)!;
    product.variants!.push({
      key: `${slug}-${sanitizeVariantPart(size || color || "one")}`,
      size: size || undefined,
      color: color || undefined,
      price,
      stock,
    });

    if (size) product.sizes = uniqCaseInsensitive([...(product.sizes || []), size]);
    if (color) product.colors = uniqCaseInsensitive([...(product.colors || []), color]);
    product.stockHint = (product.stockHint || 0) + stock;
  }

  return Array.from(map.values())
    .map((product) => ({
      ...product,
      price: derivePriceFromVariants(product.variants),
      favoritesCount: Number(product.favoritesCount ?? 0),
      isFavorite: false,
    }))
    .filter((product) => product.isActive !== false && Number(product.stockHint || 0) > 0);
}

function getProductsFromExcelOrCache(): Product[] {
  const excelMtimeMs = fs.existsSync(EXCEL_PATH) ? fs.statSync(EXCEL_PATH).mtimeMs : 0;
  const cached = readCache();

  if (
    cached?.products?.length &&
    cached.excelPath === EXCEL_PATH &&
    Number(cached.excelMtimeMs || 0) >= Number(excelMtimeMs || 0)
  ) {
    return cached.products;
  }

  const fresh = buildProductsFromExcel();
  if (fresh.length) {
    writeCache(fresh);
    return fresh;
  }

  return cached?.products ?? [];
}

export async function GET(req: NextRequest) {
  try {
    const includeFlash24h =
      String(req.nextUrl.searchParams.get("includeFlash24h") || "").trim() === "1";
    const products = getProductsFromExcelOrCache();
    const visibleProducts = includeFlash24h
      ? products
      : products.filter((product) => !Boolean(product?.isFlash24h));

    return NextResponse.json(visibleProducts, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/products] excel rebuild failed", error);
    return NextResponse.json([], {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
