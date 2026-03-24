import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { getActiveReservationSummary } from "@/lib/stockExcel";

export const runtime = "nodejs";

type Gender = "men" | "women" | "kids" | "unisex";
type ProductType = "shoes" | "clothing" | "accessory";

type Variant = {
  key: string;
  size?: string;
  color?: string;
  price: number;
  stock?: number;
  isAvailable?: boolean;
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
  collections: string[];
  sport: string[];
  tags: string[];
  isNew: boolean;
  stockHint: number;
  pickupToday?: boolean;
  expressDelivery?: boolean;
  variants: Variant[];
  isActive: boolean;
  isSoldOut: boolean;
};

type CatalogCacheFile = {
  version: 7;
  generatedAt: string;
  excelPath: string;
  excelMtimeMs: number;
  products: Product[];
};

const CACHE_VERSION = 7;

function resolveExcelPath(): string | null {
  const dataDir = path.join(process.cwd(), "data");

  const preferred = path.join(dataDir, "catalogo_jusp.xlsx");
  if (fs.existsSync(preferred)) return preferred;

  if (!fs.existsSync(dataDir)) return null;

  const files = fs.readdirSync(dataDir);
  const candidate = files.find(
    (file) => /^catalogo_jusp(\.[^.]+)?\.xlsx$/i.test(file) || /^catalogo_jusp\.xlsx$/i.test(file)
  );

  return candidate ? path.join(dataDir, candidate) : null;
}

function getCachePath(): string {
  return path.join(process.cwd(), "data", "catalog_products.cache.json");
}

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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

function toSafeBoolean(value: unknown): boolean {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();

  return v === "1" || v === "true" || v === "yes" || v === "si" || v === "sí" || v === "x" || v === "ok";
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

function uniqCaseInsensitive(values: string[]): string[] {
  const seen = new Set();
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

function normalizeHeaderKey(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getRowValue(row: Record<string, unknown>, possibleKeys: string[], fallback: unknown = ""): unknown {
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

function normalizeTextForMatch(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeExcelCategory(value: unknown): string {
  return String(value || "").trim();
}

function inferCategoryFromTitle(title: string): string {
  const t = normalizeTextForMatch(title);

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
  const t = normalizeTextForMatch(title);

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
  const t = normalizeTextForMatch(title);

  if (t.includes("nino") || t.includes("ninos") || t.includes("kids")) return "kids";
  if (t.includes("mujer") || t.includes("women") || t.includes("bra") || t.includes("sujetador")) return "women";
  if (t.includes("hombre") || t.includes("men")) return "men";

  return "unisex";
}

function inferKind(title: string): string {
  const t = normalizeTextForMatch(title);

  if (t.includes("leggings")) return "leggings";
  if (t.includes("short") || t.includes("pantalones cortos")) return "shorts";
  if (t.includes("gorra") || t.includes("cap")) return "gorras";
  if (t.includes("bra") || t.includes("sujetador")) return "sports-bra";
  if (t.includes("top")) return "tops";
  if (t.includes("hoodie") || t.includes("sudadera")) return "hoodies";
  if (t.includes("jacket") || t.includes("chaqueta")) return "jackets";
  if (t.includes("camiseta") || t.includes("t-shirt") || t.includes("tee")) return "tshirts";

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

function inferProductTypeFromCategory(category: string | undefined, title: string): ProductType {
  const c = normalizeTextForMatch(category);
  const t = normalizeTextForMatch(title);
  const hay = `${c} ${t}`.trim();

  const shoeWords = [
    "shoe",
    "shoes",
    "sneaker",
    "sneakers",
    "tenis",
    "zapatilla",
    "zapatillas",
    "calzado",
    "running",
    "runner",
    "dunk",
    "air force",
    "af1",
    "tn",
    "jordan",
    "slides",
    "slide",
    "sandalia",
    "sandalias",
    "slipper",
    "slippers",
    "boot",
    "boots",
    "bota",
    "botas",
    "guayo",
    "guayos",
    "cleat",
    "cleats",
  ];

  const accessoryWords = [
    "accessory",
    "accessories",
    "accesorio",
    "accesorios",
    "gorra",
    "gorras",
    "cap",
    "caps",
    "hat",
    "hats",
    "bag",
    "bags",
    "mochila",
    "mochilas",
    "backpack",
    "backpacks",
    "sock",
    "socks",
    "calcetin",
    "calcetines",
    "belt",
    "belts",
    "wallet",
    "wallets",
    "beanie",
    "beanies",
  ];

  if (shoeWords.some((word) => hay.includes(word))) return "shoes";
  if (accessoryWords.some((word) => hay.includes(word))) return "accessory";
  return "clothing";
}

function inferKindFromCategory(category: string | undefined, title: string): string {
  const c = normalizeTextForMatch(category);
  const t = normalizeTextForMatch(title);
  const hay = `${c} ${t}`.trim();

  if (hay.includes("boxer") || hay.includes("boxers")) return "boxers";
  if (hay.includes("brief") || hay.includes("briefs")) return "briefs";
  if (hay.includes("underwear") || hay.includes("ropa interior")) return "underwear";
  if (hay.includes("legging") || hay.includes("leggings")) return "leggings";
  if (hay.includes("short") || hay.includes("shorts") || hay.includes("bermuda")) return "shorts";
  if (hay.includes("gorra") || hay.includes("gorras") || hay.includes("cap") || hay.includes("caps")) return "gorras";
  if (hay.includes("bra") || hay.includes("sujetador")) return "sports-bra";
  if (hay.includes("top") || hay.includes("tops")) return "tops";
  if (hay.includes("hoodie") || hay.includes("hoodies") || hay.includes("sudadera")) return "hoodies";
  if (hay.includes("jacket") || hay.includes("jackets") || hay.includes("chaqueta")) return "jackets";
  if (hay.includes("camiseta") || hay.includes("t-shirt") || hay.includes("tee")) return "tshirts";
  if (
    hay.includes("dunk") ||
    hay.includes("air force") ||
    hay.includes("zapatilla") ||
    hay.includes("zapatillas") ||
    hay.includes("tenis") ||
    hay.includes("sneaker") ||
    hay.includes("sneakers")
  ) {
    return "zapatillas";
  }

  return inferKind(title);
}

function buildVariantKey(slug: string, size?: string, color?: string): string {
  const sizePart = sanitizeVariantPart(size || "nosize");
  const colorPart = sanitizeVariantPart(color || "nocolor");
  return `${slug}-${sizePart}-${colorPart}`;
}

function reservationKey(slug: string, size?: string, color?: string) {
  return `${String(slug || "").trim().toLowerCase()}__${String(size || "").trim()}__${String(color || "")
    .trim()
    .toLowerCase()}`;
}

function inferCollections(
  title: string,
  category: string | undefined,
  productType: ProductType,
  kind: string
): string[] {
  const t = normalizeTextForMatch(title);
  const c = normalizeTextForMatch(category);
  const hay = `${c} ${t}`.trim();
  const collections: string[] = [];

  if (productType === "shoes") collections.push("shoes");
  if (productType === "clothing") collections.push("clothing");
  if (productType === "accessory") collections.push("accessories");

  if (
    kind === "tops" ||
    kind === "sports-bra" ||
    hay.includes("top") ||
    hay.includes("bra") ||
    hay.includes("sujetador") ||
    hay.includes("tank")
  ) {
    collections.push("tops");
  }

  if (
    kind === "leggings" ||
    kind === "shorts" ||
    kind === "boxers" ||
    kind === "briefs" ||
    kind === "underwear" ||
    hay.includes("leggings") ||
    hay.includes("tight") ||
    hay.includes("short") ||
    hay.includes("jogger") ||
    hay.includes("pants") ||
    hay.includes("pantalon") ||
    hay.includes("ropa interior") ||
    hay.includes("underwear") ||
    hay.includes("boxer") ||
    hay.includes("brief")
  ) {
    collections.push("bottoms");
  }

  if (
    kind === "underwear" ||
    kind === "boxers" ||
    kind === "briefs" ||
    hay.includes("underwear") ||
    hay.includes("ropa interior") ||
    hay.includes("boxer") ||
    hay.includes("brief")
  ) {
    collections.push("underwear");
  }

  if (
    kind === "hoodies" ||
    kind === "jackets" ||
    hay.includes("hoodie") ||
    hay.includes("sudadera") ||
    hay.includes("jacket") ||
    hay.includes("chaqueta")
  ) {
    collections.push("outerwear");
  }

  if (
    hay.includes("gym") ||
    hay.includes("training") ||
    hay.includes("train") ||
    hay.includes("dri-fit") ||
    hay.includes("compression") ||
    hay.includes("fitness") ||
    kind === "sports-bra" ||
    kind === "leggings"
  ) {
    collections.push("gym", "training");
  }

  if (hay.includes("running") || hay.includes("run") || hay.includes("runner")) collections.push("running");
  if (hay.includes("football") || hay.includes("soccer") || hay.includes("futbol")) collections.push("football");
  if (hay.includes("basketball") || hay.includes("baloncesto") || hay.includes("basket")) collections.push("basketball");
  if (hay.includes("tennis") || hay.includes("tenis")) collections.push("tennis");

  if (
    productType === "accessory" ||
    hay.includes("cap") ||
    hay.includes("gorra") ||
    hay.includes("bag") ||
    hay.includes("mochila")
  ) {
    collections.push("accessories");
  }

  if (collections.length === 0 || hay.includes("club") || hay.includes("sportswear") || hay.includes("essential") || hay.includes("casual")) {
    collections.push("lifestyle");
  }

  return uniqCaseInsensitive(collections);
}

function inferSport(title: string, category?: string): string[] {
  const t = normalizeTextForMatch(title);
  const c = normalizeTextForMatch(category);
  const hay = `${c} ${t}`.trim();
  const out: string[] = [];

  if (
    hay.includes("gym") ||
    hay.includes("training") ||
    hay.includes("train") ||
    hay.includes("dri-fit") ||
    hay.includes("fitness") ||
    hay.includes("compression")
  ) {
    out.push("training");
  }

  if (hay.includes("running") || hay.includes("run") || hay.includes("runner")) out.push("running");
  if (hay.includes("football") || hay.includes("soccer") || hay.includes("futbol")) out.push("football");
  if (hay.includes("basketball") || hay.includes("basket") || hay.includes("baloncesto")) out.push("basketball");
  if (hay.includes("tennis") || hay.includes("tenis")) out.push("tennis");
  if (!out.length) out.push("lifestyle");

  return uniqCaseInsensitive(out);
}

function inferTags(
  title: string,
  brand: string,
  kind: string,
  category: string | undefined,
  collections: string[]
): string[] {
  const t = normalizeTextForMatch(title);
  const c = normalizeTextForMatch(category);
  const tags: string[] = ["nuevo"];

  if (brand.trim()) tags.push(brand.trim().toLowerCase());
  if (kind && kind !== "general") tags.push(kind);
  if (category && category.trim()) tags.push(category.trim().toLowerCase());
  tags.push(...collections);

  if (c.includes("boxer") || t.includes("boxer")) tags.push("boxer", "underwear");
  if (c.includes("brief") || t.includes("brief")) tags.push("brief", "underwear");
  if (c.includes("ropa interior") || c.includes("underwear") || t.includes("ropa interior") || t.includes("underwear")) {
    tags.push("underwear");
  }

  if (t.includes("dri-fit")) tags.push("dri-fit");
  if (t.includes("compression")) tags.push("compression");
  if (t.includes("high rise") || t.includes("high-rise")) tags.push("high-rise");
  if (t.includes("club")) tags.push("club");
  if (t.includes("essential")) tags.push("essentials");

  return uniqCaseInsensitive(tags);
}

function loadExcelProducts(): Product[] {
  const excelPath = resolveExcelPath();
  if (!excelPath) return [];

  const workbook = loadWorkbook(excelPath);
  if (!workbook) return [];

  const sheet = workbook.Sheets["productos"] ?? workbook.Sheets["Productos"] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  const reservationSummary = getActiveReservationSummary();
  const map = new Map<string, Product>();

  for (const rawRow of rows) {
    const slug = String(getRowValue(rawRow, ["product_slug", "slug", "productslug"], "")).trim();
    const title = String(getRowValue(rawRow, ["title", "titulo", "name", "nombre"], "")).trim();
    const brand = String(getRowValue(rawRow, ["brand", "marca"], "JUSP")).trim();
    const size = String(getRowValue(rawRow, ["size", "talla"], "")).trim();
    const color = normalizeColor(getRowValue(rawRow, ["color", "colour"], ""));
    const price = toSafeNumber(getRowValue(rawRow, ["price", "precio"], 0), 0);
    const rawStock = toSafeNumber(getRowValue(rawRow, ["stock", "inventario"], 0), 0);
    const reserved = reservationSummary.get(reservationKey(slug, size, color)) || 0;
    const stock = Math.max(0, rawStock - reserved);
    const excelGender = normalizeExcelGender(getRowValue(rawRow, ["gender", "genero", "género"], ""));
    const excelCategory = normalizeExcelCategory(getRowValue(rawRow, ["category", "categoria", "categoría"], ""));
    const pickupToday = toSafeBoolean(getRowValue(rawRow, ["pickup_today", "pickup", "retiro_hoy"], ""));
    const expressDelivery = toSafeBoolean(getRowValue(rawRow, ["express_delivery", "express", "envio_express"], ""));

    if (!slug || !title || price <= 0) continue;

    if (!map.has(slug)) {
      const images = listProductImages(slug);
      const resolvedCategory = excelCategory || inferCategoryFromTitle(title);
      const productType = inferProductTypeFromCategory(resolvedCategory, title);
      const kind = inferKindFromCategory(resolvedCategory, title);
      const collections = inferCollections(title, resolvedCategory, productType, kind);
      const sport = inferSport(title, resolvedCategory);
      const tags = inferTags(title, brand, kind, resolvedCategory, collections);

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
        category: resolvedCategory,
        gender: excelGender || inferGender(title),
        productType,
        kind,
        collections,
        sport,
        tags,
        isNew: true,
        stockHint: 0,
        pickupToday,
        expressDelivery,
        variants: [],
        isActive: true,
        isSoldOut: false,
      });
    }

    const product = map.get(slug)!;
    const variantKey = buildVariantKey(slug, size, color);
    const existingVariantIndex = product.variants.findIndex((variant) => variant.key === variantKey);

    if (existingVariantIndex >= 0) {
      const existing = product.variants[existingVariantIndex];
      existing.price = price;
      existing.stock = stock;
      existing.size = size || existing.size;
      existing.color = color || existing.color;
      existing.isAvailable = stock > 0;
    } else {
      product.variants.push({
        key: variantKey,
        size: size || undefined,
        color: color || undefined,
        price,
        stock,
        isAvailable: stock > 0,
      });
    }

    if (excelCategory && !product.category) {
      product.category = excelCategory;
      product.productType = inferProductTypeFromCategory(excelCategory, product.title);
      product.kind = inferKindFromCategory(excelCategory, product.title);
      product.collections = inferCollections(product.title, excelCategory, product.productType, product.kind || "general");
      product.sport = inferSport(product.title, excelCategory);
      product.tags = inferTags(product.title, product.brand || "", product.kind || "general", excelCategory, product.collections);
    }

    if (size) product.sizes = uniqCaseInsensitive([...product.sizes, size]);
    if (color) product.colors = uniqCaseInsensitive([...product.colors, color]);

    product.stockHint = product.variants.reduce((acc, variant) => acc + toSafeNumber(variant.stock, 0), 0);
    product.pickupToday = Boolean(product.pickupToday || pickupToday);
    product.expressDelivery = Boolean(product.expressDelivery || expressDelivery);

    if (price < product.price) product.price = price;
  }

  return Array.from(map.values()).map((product) => {
    const stockHint = product.variants.reduce((acc, variant) => acc + toSafeNumber(variant.stock, 0), 0);
    const isSoldOut = stockHint <= 0;

    return {
      ...product,
      stockHint,
      isSoldOut,
      isActive: !isSoldOut,
      sizes: uniqCaseInsensitive(product.sizes),
      colors: uniqCaseInsensitive(product.colors),
      collections: uniqCaseInsensitive(product.collections),
      sport: uniqCaseInsensitive(product.sport),
      tags: uniqCaseInsensitive(product.tags),
      variants: product.variants.map((variant) => ({
        ...variant,
        stock: toSafeNumber(variant.stock, 0),
        isAvailable: toSafeNumber(variant.stock, 0) > 0,
      })),
    };
  });
}

function readCatalogCache(): CatalogCacheFile | null {
  try {
    const cachePath = getCachePath();
    if (!fs.existsSync(cachePath)) return null;

    const raw = fs.readFileSync(cachePath, "utf8");
    const parsed = JSON.parse(raw) as CatalogCacheFile;

    if (!parsed || parsed.version !== CACHE_VERSION || !Array.isArray(parsed.products)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCatalogCache(payload: CatalogCacheFile) {
  try {
    ensureDataDir();
    fs.writeFileSync(getCachePath(), JSON.stringify(payload, null, 2), "utf8");
  } catch {}
}

function getExcelMtimeMs(excelPath: string): number {
  try {
    return fs.statSync(excelPath).mtimeMs;
  } catch {
    return 0;
  }
}

function getProductsFast(): Product[] {
  const excelPath = resolveExcelPath();

  if (!excelPath) {
    const cache = readCatalogCache();
    return cache?.products ?? [];
  }

  const excelMtimeMs = getExcelMtimeMs(excelPath);
  const cache = readCatalogCache();

  const cacheIsFresh =
    !!cache &&
    cache.version === CACHE_VERSION &&
    cache.excelPath === excelPath &&
    cache.excelMtimeMs === excelMtimeMs &&
    Array.isArray(cache.products) &&
    cache.products.length > 0;

  if (cacheIsFresh) {
    return cache.products;
  }

  const excelProducts = loadExcelProducts();

  if (excelProducts.length > 0) {
    writeCatalogCache({
      version: CACHE_VERSION,
      generatedAt: new Date().toISOString(),
      excelPath,
      excelMtimeMs,
      products: excelProducts,
    });
    return excelProducts;
  }

  return cache?.products ?? [];
}

export async function GET() {
  const products = getProductsFast();

  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}