import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type Gender = "men" | "women" | "kids" | "unisex";
type ProductType = "shoes" | "clothing" | "accessory";

type Variant = {
  key: string;
  size?: string;
  color?: string;
  price: number;
  stock?: number;
};

type Product = {
  id: string;
  slug: string;
  product_code: string;
  title: string;
  name: string;
  brand?: string;
  price: number;
  currency: string;
  description?: string;
  image?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  category?: string;
  gender?: Gender;
  productType: ProductType;
  kind?: string;
  sport: string[];
  tags: string[];
  isNew: boolean;
  stockHint: number;
  variants: Variant[];
};

type CachePayload = {
  version: 1;
  generatedAt: string;
  excelPath: string | null;
  excelMtimeMs: number;
  products: Product[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_BASENAMES = ["catalog_products.cache.json", "catalogo_jusp.cache.json"];

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function getPreferredCachePath(): string {
  ensureDataDir();
  return path.join(DATA_DIR, CACHE_BASENAMES[0]);
}

function resolveCachePath(): string {
  for (const basename of CACHE_BASENAMES) {
    const full = path.join(DATA_DIR, basename);
    if (fs.existsSync(full)) return full;
  }
  return getPreferredCachePath();
}

function resolveExcelPath(): string | null {
  const preferred = path.join(DATA_DIR, "catalogo_jusp.xlsx");
  if (fs.existsSync(preferred)) return preferred;

  if (!fs.existsSync(DATA_DIR)) return null;

  const files = fs.readdirSync(DATA_DIR);
  const candidate = files.find(
    (file) => /^catalogo_jusp(\.[^.]+)?\.xlsx$/i.test(file) || /^catalogo_jusp\.xlsx$/i.test(file)
  );

  return candidate ? path.join(DATA_DIR, candidate) : null;
}

function safeStatMtimeMs(filePath: string | null): number {
  if (!filePath) return 0;
  try {
    return fs.statSync(filePath).mtimeMs || 0;
  } catch {
    return 0;
  }
}

function loadWorkbook(filePath: string): XLSX.WorkBook | null {
  try {
    const buffer = fs.readFileSync(filePath);
    return XLSX.read(buffer, { type: "buffer" });
  } catch {
    return null;
  }
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

function sanitizeVariantPart(value?: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

function uniq(values: string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    const v = String(value || "").trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

function listProductImages(slug: string): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "products", slug);
    if (!fs.existsSync(dir)) return [];

    const files = fs
      .readdirSync(dir)
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a, b) => {
        const aNum = Number(a.split(".")[0]);
        const bNum = Number(b.split(".")[0]);

        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      });

    return files.map((file) => `/products/${slug}/${file}`);
  } catch {
    return [];
  }
}

function inferCategoryFromTitle(title: string): string {
  const t = title.toLowerCase();

  if (
    t.includes("dunk") ||
    t.includes("air force") ||
    t.includes("zapatilla") ||
    t.includes("tenis") ||
    t.includes("sneaker")
  ) {
    return "Sneakers";
  }

  if (t.includes("gorra") || t.includes("cap")) {
    return "Accessories";
  }

  return "Apparel";
}

function inferProductType(title: string): ProductType {
  const t = title.toLowerCase();

  if (
    t.includes("dunk") ||
    t.includes("air force") ||
    t.includes("zapatilla") ||
    t.includes("tenis") ||
    t.includes("sneaker")
  ) {
    return "shoes";
  }

  if (t.includes("gorra") || t.includes("cap")) {
    return "accessory";
  }

  return "clothing";
}

function inferGender(title: string): Gender {
  const t = title.toLowerCase();

  if (t.includes("niño") || t.includes("niños") || t.includes("kids")) return "kids";
  if (t.includes("mujer") || t.includes("women") || t.includes("bra") || t.includes("sujetador")) {
    return "women";
  }
  if (t.includes("hombre") || t.includes("men")) return "men";

  return "unisex";
}

function inferKind(title: string): string {
  const t = title.toLowerCase();

  if (t.includes("leggings")) return "leggings";
  if (t.includes("short") || t.includes("pantalones cortos")) return "shorts";
  if (t.includes("gorra") || t.includes("cap")) return "gorras";
  if (t.includes("bra") || t.includes("sujetador")) return "sports-bra";
  if (t.includes("top")) return "tops";

  if (
    t.includes("dunk") ||
    t.includes("air force") ||
    t.includes("zapatilla") ||
    t.includes("tenis") ||
    t.includes("sneaker")
  ) {
    return "zapatillas";
  }

  return "general";
}

function normalizeExcelGender(value: unknown): Gender | null {
  const v = String(value || "").trim().toLowerCase();

  if (v === "men" || v === "women" || v === "kids" || v === "unisex") return v;
  if (v === "hombre") return "men";
  if (v === "mujer") return "women";
  if (v === "niños" || v === "ninos" || v === "niño" || v === "nino" || v === "kid") return "kids";

  return null;
}

function normalizeExcelCategory(value: unknown): string {
  return String(value || "").trim();
}

function loadExcelProducts(): Product[] {
  const excelPath = resolveExcelPath();
  if (!excelPath) return [];

  const workbook = loadWorkbook(excelPath);
  if (!workbook) return [];

  const sheet =
    workbook.Sheets["productos"] ??
    workbook.Sheets["Productos"] ??
    workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<{
    product_slug?: string;
    title?: string;
    brand?: string;
    size?: string;
    color?: string;
    price?: number | string;
    stock?: number | string;
    gender?: string;
    category?: string;
  }>(sheet, { defval: "" });

  const map = new Map<string, Product>();

  for (const row of rows) {
    const slug = String(row.product_slug || "").trim();
    const title = String(row.title || "").trim();
    const brand = String(row.brand || "JUSP").trim();
    const size = String(row.size || "").trim();
    const color = String(row.color || "").trim();
    const price = toSafeNumber(row.price, 0);
    const stock = toSafeNumber(row.stock, 0);
    const excelGender = normalizeExcelGender(row.gender);
    const excelCategory = normalizeExcelCategory(row.category);

    if (!slug || !title || price <= 0) continue;

    if (!map.has(slug)) {
      const images = listProductImages(slug);

      map.set(slug, {
        id: slug,
        slug,
        product_code: slug,
        title,
        name: title,
        brand,
        price,
        currency: "COP",
        description: `${title}. Producto disponible en JUSP.`,
        image: images[0],
        images,
        sizes: [],
        colors: [],
        category: excelCategory || inferCategoryFromTitle(title),
        gender: excelGender || inferGender(title),
        productType: inferProductType(title),
        kind: inferKind(title),
        sport: ["lifestyle"],
        tags: ["nuevo"],
        isNew: true,
        stockHint: 0,
        variants: [],
      });
    }

    const product = map.get(slug)!;
    const variantKey = `${slug}-${sanitizeVariantPart(size || color || "one")}`;

    product.variants.push({
      key: variantKey,
      size: size || undefined,
      color: color || undefined,
      price,
      stock,
    });

    if (size) product.sizes = uniq([...product.sizes, size]);
    if (color) product.colors = uniq([...product.colors, color]);
    product.stockHint = (product.stockHint || 0) + stock;
    if (price < product.price) product.price = price;
  }

  return Array.from(map.values());
}

function readCache(cachePath: string): CachePayload | null {
  try {
    if (!fs.existsSync(cachePath)) return null;
    const raw = fs.readFileSync(cachePath, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed || !Array.isArray(parsed.products)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(cachePath: string, products: Product[], excelPath: string | null, excelMtimeMs: number) {
  try {
    ensureDataDir();
    const payload: CachePayload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      excelPath,
      excelMtimeMs,
      products,
    };
    fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), "utf8");
  } catch {}
}

function getProductsFast(): Product[] {
  const excelPath = resolveExcelPath();
  const excelMtimeMs = safeStatMtimeMs(excelPath);
  const cachePath = resolveCachePath();
  const cached = readCache(cachePath);

  if (cached && cached.excelMtimeMs >= excelMtimeMs && cached.products.length) {
    return cached.products;
  }

  const fresh = loadExcelProducts();

  if (fresh.length) {
    writeCache(cachePath, fresh, excelPath, excelMtimeMs);
    return fresh;
  }

  if (cached?.products?.length) {
    return cached.products;
  }

  return [];
}

export async function GET() {
  const products = getProductsFast();

  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
