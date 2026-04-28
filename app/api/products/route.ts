/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { getActiveReservationSummary } from "@/lib/stockExcel";
import { getFavoritesCountMap } from "@/lib/favoritesRepo";
import { resolveFlashWindow } from "@/lib/flash";

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
  videos?: string[];
  media?: ProductMediaItem[];
  parameters?: ProductParameter[];
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
  discountPercent?: number;

  stock: number;
  inventory: number;
  quantity: number;
  qty: number;
  availableStock: number;
  available_quantity: number;
  stockHint: number;

  pickupToday?: boolean;
  expressDelivery?: boolean;
  isFlash24h?: boolean;
  flashStartsAt?: string;
  flashExpiresAt?: string;
  flashActive?: boolean;
  flashUpcoming?: boolean;
  variants: Variant[];
  isActive: boolean;
  isSoldOut: boolean;
  favoritesCount?: number;
  isFavorite?: boolean;
};

type CatalogCacheFile = {
  version: 10;
  generatedAt: string;
  excelPath: string;
  excelMtimeMs: number;
  products: Product[];
};

const CACHE_VERSION = 10;

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

function resolveParametersExcelPath(): string | null {
  const dataDir = path.join(process.cwd(), "data");
  const candidates = [
    path.join(dataDir, "product_parameters.xlsx"),
    path.join(dataDir, "parametros_producto.xlsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  if (!fs.existsSync(dataDir)) return null;

  const files = fs.readdirSync(dataDir);
  const dynamic = files.find(
    (file) =>
      /^product_parameters(\.[^.]+)?\.xlsx$/i.test(file) ||
      /^parametros_producto(\.[^.]+)?\.xlsx$/i.test(file)
  );

  return dynamic ? path.join(dataDir, dynamic) : null;
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

function listProductMedia(slug: string): ProductMediaItem[] {
  try {
    const dir = path.join(process.cwd(), "public", "products", slug);
    if (!fs.existsSync(dir)) return [];

    const files = fs
      .readdirSync(dir)
      .filter((file) => /\.(jpg|jpeg|png|webp|mp4|mov|webm|m4v)$/i.test(file))
      .sort((a, b) => {
        const aNum = Number(a.split(".")[0]);
        const bNum = Number(b.split(".")[0]);

        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      });

    return files.map((file) => ({
      type: /\.(mp4|mov|webm|m4v)$/i.test(file) ? "video" : "image",
      src: `/products/${slug}/${file}`,
    }));
  } catch {
    return [];
  }
}

function loadProductParameters(): Map<string, ProductParameter[]> {
  const filePath = resolveParametersExcelPath();
  if (!filePath) return new Map();

  const workbook = loadWorkbook(filePath);
  if (!workbook) return new Map();

  const preferredSheetName =
    workbook.SheetNames.find((sheetName) =>
      ["parametros", "Parametros", "parameters", "Parameters"].includes(sheetName)
    ) ?? workbook.SheetNames[0];

  if (!preferredSheetName) return new Map();

  const sheet = workbook.Sheets[preferredSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  const map = new Map<string, ProductParameter[]>();

  for (const row of rows) {
    const slug = String(
      getRowValue(row, ["product_slug", "slug", "product", "producto", "productslug"], "")
    )
      .trim()
      .toLowerCase();
    const label = String(getRowValue(row, ["label", "nombre", "campo", "parametro", "parámetro"], ""))
      .trim();
    const value = String(getRowValue(row, ["value", "valor", "detalle", "descripcion"], "")).trim();
    const order = toSafeNumber(getRowValue(row, ["order", "orden", "display_order"], 0), 0);

    if (!slug || !label || !value) continue;

    const current = map.get(slug) ?? [];
    current.push({ label, value, order });
    map.set(slug, current);
  }

  for (const [slug, items] of map.entries()) {
    map.set(
      slug,
      items
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label, "es"))
    );
  }

  return map;
}

function inferCategoryFromTitle(title: string): string {
  const t = title.toLowerCase();

  if (t.includes("dunk") || t.includes("air force") || t.includes("zapatilla") || t.includes("tenis") || t.includes("sneaker")) {
    return "Sneakers";
  }

  if (t.includes("gorra") || t.includes("cap")) {
    return "Accessories";
  }

  return "Apparel";
}

function inferProductType(title: string): ProductType {
  const t = title.toLowerCase();

  if (t.includes("dunk") || t.includes("air force") || t.includes("zapatilla") || t.includes("tenis") || t.includes("sneaker")) {
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
  if (t.includes("mujer") || t.includes("women") || t.includes("bra") || t.includes("sujetador")) return "women";
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
  if (t.includes("hoodie") || t.includes("sudadera")) return "hoodies";
  if (t.includes("jacket") || t.includes("chaqueta")) return "jackets";
  if (t.includes("camiseta") || t.includes("t-shirt") || t.includes("tee")) return "tshirts";

  if (t.includes("dunk") || t.includes("air force") || t.includes("zapatilla") || t.includes("tenis") || t.includes("sneaker")) {
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

function normalizeForMatch(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferProductTypeFromCategory(category: string, title: string): ProductType {
  const c = normalizeForMatch(category);
  const t = normalizeForMatch(title);

  if (
    c.includes("accessor") ||
    c.includes("gorra") ||
    c.includes("cap") ||
    c.includes("mochila") ||
    c.includes("bag")
  ) {
    return "accessory";
  }

  if (
    c.includes("shoe") ||
    c.includes("sneaker") ||
    c.includes("tenis") ||
    c.includes("zapatilla") ||
    c.includes("calzado")
  ) {
    return "shoes";
  }

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

function inferKindFromCategory(category: string, title: string): string {
  const c = normalizeForMatch(category);
  const t = normalizeForMatch(title);

  if (c.includes("boxer")) return "boxers";
  if (c.includes("legging")) return "leggings";
  if (c.includes("short")) return "shorts";
  if (c.includes("gorra") || c.includes("cap")) return "gorras";
  if (c.includes("bra") || c.includes("sujetador")) return "sports-bra";
  if (c.includes("top")) return "tops";
  if (c.includes("hoodie") || c.includes("sudadera")) return "hoodies";
  if (c.includes("jacket") || c.includes("chaqueta")) return "jackets";
  if (c.includes("camiseta") || c.includes("t-shirt") || c.includes("tee")) return "tshirts";
  if (c.includes("zapatilla") || c.includes("tenis") || c.includes("sneaker")) return "zapatillas";

  if (t.includes("boxer")) return "boxers";

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

function inferCollectionsFromTitle(title: string, productType: ProductType, kind: string): string[] {
  const t = title.toLowerCase();
  const collections: string[] = [];

  if (productType === "shoes") collections.push("shoes");
  if (productType === "clothing") collections.push("clothing");
  if (productType === "accessory") collections.push("accessories");

  if (kind === "tops" || kind === "sports-bra" || t.includes("top") || t.includes("bra") || t.includes("sujetador") || t.includes("tank")) {
    collections.push("tops");
  }

  if (kind === "leggings" || kind === "shorts" || t.includes("leggings") || t.includes("tight") || t.includes("short") || t.includes("jogger") || t.includes("pants") || t.includes("pantalon") || t.includes("pantalón")) {
    collections.push("bottoms");
  }

  if (kind === "hoodies" || kind === "jackets" || t.includes("hoodie") || t.includes("sudadera") || t.includes("jacket") || t.includes("chaqueta")) {
    collections.push("outerwear");
  }

  if (t.includes("gym") || t.includes("training") || t.includes("train") || t.includes("dri-fit") || t.includes("compression") || t.includes("fitness") || kind === "sports-bra" || kind === "leggings") {
    collections.push("gym", "training");
  }

  if (t.includes("running") || t.includes("run") || t.includes("runner")) collections.push("running");
  if (t.includes("football") || t.includes("soccer") || t.includes("futbol") || t.includes("fútbol")) collections.push("football");
  if (t.includes("basketball") || t.includes("baloncesto") || t.includes("basket")) collections.push("basketball");
  if (t.includes("tennis") || t.includes("tenis")) collections.push("tennis");

  if (productType === "accessory" || t.includes("cap") || t.includes("gorra") || t.includes("bag") || t.includes("mochila")) {
    collections.push("accessories");
  }

  if (collections.length === 0 || t.includes("club") || t.includes("sportswear") || t.includes("essential") || t.includes("casual")) {
    collections.push("lifestyle");
  }

  return uniqCaseInsensitive(collections);
}

function inferCollections(category: string, title: string, productType: ProductType, kind: string): string[] {
  const base = inferCollectionsFromTitle(title, productType, kind);
  const c = normalizeForMatch(category);

  const extra: string[] = [];

  if (kind === "boxers" || c.includes("boxer")) {
    extra.push("clothing", "bottoms", "underwear");
  }

  if (productType === "accessory" || c.includes("accessor")) {
    extra.push("accessories");
  }

  if (productType === "shoes" || c.includes("shoe") || c.includes("sneaker") || c.includes("tenis")) {
    extra.push("shoes");
  }

  return uniqCaseInsensitive([...base, ...extra]);
}

function inferSportFromTitle(title: string): string[] {
  const t = title.toLowerCase();
  const out: string[] = [];

  if (t.includes("gym") || t.includes("training") || t.includes("train") || t.includes("dri-fit") || t.includes("fitness") || t.includes("compression")) {
    out.push("training");
  }

  if (t.includes("running") || t.includes("run") || t.includes("runner")) out.push("running");
  if (t.includes("football") || t.includes("soccer") || t.includes("futbol") || t.includes("fútbol")) out.push("football");
  if (t.includes("basketball") || t.includes("basket") || t.includes("baloncesto")) out.push("basketball");
  if (t.includes("tennis") || t.includes("tenis")) out.push("tennis");
  if (!out.length) out.push("lifestyle");

  return uniqCaseInsensitive(out);
}

function inferTagsFromTitle(title: string, brand: string, kind: string, collections: string[]): string[] {
  const t = title.toLowerCase();
  const tags: string[] = ["nuevo"];

  if (brand.trim()) tags.push(brand.trim().toLowerCase());
  if (kind && kind !== "general") tags.push(kind);
  tags.push(...collections);

  if (t.includes("dri-fit")) tags.push("dri-fit");
  if (t.includes("compression")) tags.push("compression");
  if (t.includes("high rise") || t.includes("high-rise")) tags.push("high-rise");
  if (t.includes("club")) tags.push("club");
  if (t.includes("essential")) tags.push("essentials");

  return uniqCaseInsensitive(tags);
}

function inferTags(category: string, title: string, brand: string, kind: string, collections: string[]): string[] {
  const base = inferTagsFromTitle(title, brand, kind, collections);
  const c = normalizeForMatch(category);

  const extra: string[] = [];

  if (c.includes("boxer")) extra.push("boxer", "underwear");
  if (c.includes("accessor")) extra.push("accessories");
  if (c.includes("shoe") || c.includes("sneaker") || c.includes("tenis")) extra.push("shoes");

  return uniqCaseInsensitive([...base, ...extra]);
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
  const productParameters = loadProductParameters();
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
    const flashWindow = resolveFlashWindow({
      isFlash24h: getRowValue(rawRow, ["is_flash_24h", "flash_24h", "flash24h"], ""),
      flashStartsAt: getRowValue(rawRow, ["flash_starts_at", "flash_start", "inicio_flash"], ""),
      flashExpiresAt: getRowValue(rawRow, ["flash_expires_at", "flash_end", "fin_flash"], ""),
    });
    const discountPercent = toSafeNumber(
      getRowValue(rawRow, ["discount_percent", "discount", "descuento", "porcentaje_descuento"], 0),
      0
    );
    const rowIsActive = getRowValue(rawRow, ["is_active", "active", "activo"], "");
    const isRowActive = String(rowIsActive).trim() ? toSafeBoolean(rowIsActive) : true;

    if (!slug || !title || price <= 0) continue;

    if (!map.has(slug)) {
      const media = listProductMedia(slug);
      const images = media.filter((item) => item.type === "image").map((item) => item.src);
      const videos = media.filter((item) => item.type === "video").map((item) => item.src);
      const resolvedCategory = excelCategory || inferCategoryFromTitle(title);
      const productType = excelCategory
        ? inferProductTypeFromCategory(excelCategory, title)
        : inferProductType(title);
      const kind = excelCategory
        ? inferKindFromCategory(excelCategory, title)
        : inferKind(title);
      const collections = excelCategory
        ? inferCollections(excelCategory, title, productType, kind)
        : inferCollectionsFromTitle(title, productType, kind);
      const sport = inferSportFromTitle(title);
      const tags = excelCategory
        ? inferTags(excelCategory, title, brand, kind, collections)
        : inferTagsFromTitle(title, brand, kind, collections);

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
        videos,
        media,
        parameters: productParameters.get(slug.toLowerCase()) ?? [],
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
        discountPercent: discountPercent > 0 ? discountPercent : undefined,

        stock: 0,
        inventory: 0,
        quantity: 0,
        qty: 0,
        availableStock: 0,
        available_quantity: 0,
        stockHint: 0,

        pickupToday,
        expressDelivery,
        isFlash24h: flashWindow.isFlash24h,
        flashStartsAt: flashWindow.flashStartsAt,
        flashExpiresAt: flashWindow.flashExpiresAt,
        flashActive: flashWindow.flashActive,
        flashUpcoming: flashWindow.flashUpcoming,
        variants: [],
        isActive: isRowActive,
        isSoldOut: false,
        favoritesCount: 0,
        isFavorite: false,
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

    if (size) product.sizes = uniqCaseInsensitive([...product.sizes, size]);
    if (color) product.colors = uniqCaseInsensitive([...product.colors, color]);

    product.stockHint = product.variants.reduce((acc, variant) => acc + toSafeNumber(variant.stock, 0), 0);
    product.stock = product.stockHint;
    product.inventory = product.stockHint;
    product.quantity = product.stockHint;
    product.qty = product.stockHint;
    product.availableStock = product.stockHint;
    product.available_quantity = product.stockHint;

    product.pickupToday = Boolean(product.pickupToday || pickupToday);
    product.expressDelivery = Boolean(product.expressDelivery || expressDelivery);
    product.isFlash24h = Boolean(product.isFlash24h || flashWindow.isFlash24h);
    product.flashStartsAt = product.flashStartsAt || flashWindow.flashStartsAt;
    product.flashExpiresAt = product.flashExpiresAt || flashWindow.flashExpiresAt;
    product.flashActive = Boolean(product.flashActive || flashWindow.flashActive);
    product.flashUpcoming = Boolean(product.flashUpcoming || flashWindow.flashUpcoming);
    if (product.isActive && !isRowActive) {
      product.isActive = false;
    }
    if (!product.discountPercent && discountPercent > 0) {
      product.discountPercent = discountPercent;
    }

    if (price < product.price) product.price = price;
  }

  return Array.from(map.values())
    .map((product) => {
      const stockHint = product.variants.reduce((acc, variant) => acc + toSafeNumber(variant.stock, 0), 0);
      const isSoldOut = stockHint <= 0;

      return {
        ...product,
        stock: stockHint,
        inventory: stockHint,
        quantity: stockHint,
        qty: stockHint,
        availableStock: stockHint,
        available_quantity: stockHint,
        stockHint,
        isSoldOut,
        isActive: product.isActive !== false && !isSoldOut,
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
        favoritesCount: product.favoritesCount ?? 0,
        isFavorite: product.isFavorite ?? false,
      };
    })
    .filter((product) => product.isActive !== false && Number(product.stockHint || 0) > 0);
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
  const cache = readCatalogCache();

  if (cache?.products?.length) {
    return cache.products.map((product) => ({
      ...product,
      stock: Number(product.stock ?? product.stockHint ?? 0),
      inventory: Number(product.inventory ?? product.stockHint ?? 0),
      quantity: Number(product.quantity ?? product.stockHint ?? 0),
      qty: Number(product.qty ?? product.stockHint ?? 0),
      availableStock: Number(product.availableStock ?? product.stockHint ?? 0),
      available_quantity: Number(product.available_quantity ?? product.stockHint ?? 0),
      favoritesCount: product.favoritesCount ?? 0,
      isFavorite: product.isFavorite ?? false,
    }));
  }

  const excelPath = resolveExcelPath();

  if (!excelPath) {
    return [];
  }

  const excelProducts = loadExcelProducts();

  if (excelProducts.length > 0) {
    writeCatalogCache({
      version: CACHE_VERSION,
      generatedAt: new Date().toISOString(),
      excelPath,
      excelMtimeMs: getExcelMtimeMs(excelPath),
      products: excelProducts,
    });
    return excelProducts;
  }

  return [];
}

export async function GET(req: NextRequest) {
  const sessionId = String(req.nextUrl.searchParams.get("session_id") || "").trim();
  const includeFlash24h = String(req.nextUrl.searchParams.get("includeFlash24h") || "").trim() === "1";
  const products = getProductsFast();

  let countMap: Record<string, number> = {};

  try {
    countMap = await getFavoritesCountMap();
  } catch {
    countMap = {};
  }

  const enriched = products.map((product) => {
    const productId = String(product.id || "").trim();
    const favoritesCount = countMap[productId] || 0;

    return {
      ...product,
      favoritesCount,
      isFavorite: sessionId ? false : false,
    };
  });

  const visibleProducts = includeFlash24h
    ? enriched
    : enriched.filter((product) => !Boolean(product?.isFlash24h));

  return NextResponse.json(visibleProducts, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
