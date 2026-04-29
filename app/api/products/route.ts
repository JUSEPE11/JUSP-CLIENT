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

type ProductMediaManifest = Record<string, string[]>;

const CACHE_VERSION = 1;
const CACHE_FILE_NAME = "catalog_products.json";

let productMediaManifestCache: ProductMediaManifest | null | undefined;

function getDataDirCandidates(): string[] {
  return Array.from(
    new Set([
      path.join(process.cwd(), "data"),
      path.resolve(__dirname, "../../../../../data"),
      path.resolve(__dirname, "../../../../data"),
      path.resolve(__dirname, "../../../data"),
    ])
  );
}

function resolveExistingDataFile(candidates: string[]): string | null {
  for (const dataDir of getDataDirCandidates()) {
    for (const basename of candidates) {
      const fullPath = path.join(dataDir, basename);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

function resolveWritableDataDir(): string {
  for (const dataDir of getDataDirCandidates()) {
    if (fs.existsSync(dataDir)) return dataDir;
  }

  const fallback = path.join(process.cwd(), "data");
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

function resolveCachePath(): string {
  return path.join(resolveWritableDataDir(), CACHE_FILE_NAME);
}

function resolveExcelPath(): string | null {
  return resolveExistingDataFile(["catalogo_jusp.xlsx"]);
}

function resolveParametersPath(): string | null {
  return resolveExistingDataFile(["product_parameters.xlsx", "parametros_producto.xlsx"]);
}

function readWorkbook(filePath: string) {
  const bytes = fs.readFileSync(filePath);
  return XLSX.read(bytes, { type: "buffer" });
}

function getExcelMtimeMs(excelPath: string | null): number {
  if (!excelPath || !fs.existsSync(excelPath)) return 0;

  try {
    return fs.statSync(excelPath).mtimeMs;
  } catch {
    return 0;
  }
}

function writeProductCache(payload: CachePayload): void {
  try {
    const cachePath = resolveCachePath();
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), "utf8");
  } catch (error) {
    console.error("[api/products] cache write failed", error);
  }
}

function buildProductsAndRefreshCache(): Product[] {
  const excelPath = resolveExcelPath();
  const excelMtimeMs = getExcelMtimeMs(excelPath);
  const products = buildProductsFromExcel();

  writeProductCache({
    version: CACHE_VERSION,
    generatedAt: new Date().toISOString(),
    excelPath,
    excelMtimeMs,
    products,
  });

  return products;
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

function getRowValue(row: Record<string, unknown>, keys: string[], fallback: unknown = "") {
  const map = new Map<string, unknown>();

  for (const [k, v] of Object.entries(row)) {
    map.set(normalizeHeaderKey(k), v);
  }

  for (const key of keys) {
    const hit = map.get(normalizeHeaderKey(key));
    if (hit !== undefined) return hit;
  }

  return fallback;
}

function uniqCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const raw of values) {
    const value = String(raw || "").trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(value);
  }

  return output;
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

function isVideoFile(file: string): boolean {
  return /\.(mp4|mov|webm|m4v)$/i.test(file);
}

function isImageFile(file: string): boolean {
  return /\.(jpg|jpeg|png|webp|avif)$/i.test(file);
}

function readProductMediaManifest(): ProductMediaManifest | null {
  if (productMediaManifestCache !== undefined) return productMediaManifestCache;

  try {
    const manifestPath = resolveExistingDataFile(["product_media_manifest.json"]);
    if (!manifestPath || !fs.existsSync(manifestPath)) {
      productMediaManifestCache = null;
      return productMediaManifestCache;
    }

    const raw = fs.readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as ProductMediaManifest;
    productMediaManifestCache = parsed && typeof parsed === "object" ? parsed : null;
    return productMediaManifestCache;
  } catch {
    productMediaManifestCache = null;
    return productMediaManifestCache;
  }
}

function getManifestMediaFiles(slug: string): { folderSlug: string; files: string[] } | null {
  const manifest = readProductMediaManifest();
  if (!manifest) return null;

  const exact = manifest[slug];
  if (Array.isArray(exact)) return { folderSlug: slug, files: exact };

  const lowerSlug = slug.toLowerCase();
  const folderSlug = Object.keys(manifest).find((key) => key.toLowerCase() === lowerSlug);
  const files = folderSlug ? manifest[folderSlug] : null;

  return folderSlug && Array.isArray(files) ? { folderSlug, files } : null;
}

function mediaSortScore(file: string): number {
  const name = file.toLowerCase();
  const numericMatch = name.match(/\d+/);
  const numericValue = numericMatch ? Number.parseInt(numericMatch[0], 10) : 999;

  if (isImageFile(name)) return numericValue;
  if (isVideoFile(name)) return 1000 + numericValue;

  return 9999;
}

function normalizePublicSrc(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;

  const cleaned = raw.replace(/\\/g, "/").replace(/^public\//i, "");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

function splitMediaColumn(value: unknown): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  return raw
    .split(/[,;\n|]+/g)
    .map((item) => normalizePublicSrc(item))
    .filter(Boolean);
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
    if (!fs.existsSync(dir)) {
      const manifestEntry = getManifestMediaFiles(slug);
      if (!manifestEntry) return [];

      return manifestEntry.files
        .filter((file) => isImageFile(file) || isVideoFile(file))
        .sort((a, b) => {
          const scoreDiff = mediaSortScore(a) - mediaSortScore(b);
          if (scoreDiff !== 0) return scoreDiff;
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        })
        .map((file) => ({
          type: isVideoFile(file) ? "video" : "image",
          src: `/products/${manifestEntry.folderSlug}/${file}`,
        }));
    }

    const files = fs
      .readdirSync(dir)
      .filter((file) => isImageFile(file) || isVideoFile(file))
      .sort((a, b) => {
        const scoreDiff = mediaSortScore(a) - mediaSortScore(b);
        if (scoreDiff !== 0) return scoreDiff;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      });

    return files.map((file) => ({
      type: isVideoFile(file) ? "video" : "image",
      src: `/products/${slug}/${file}`,
    }));
  } catch {
    return [];
  }
}

function loadProductParameters(): Map<string, ProductParameter[]> {
  try {
    const parametersPath = resolveParametersPath();
    if (!parametersPath || !fs.existsSync(parametersPath)) return new Map();

    const workbook = readWorkbook(parametersPath);
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

function buildProductsFromExcel(): Product[] {
  const excelPath = resolveExcelPath();
  if (!excelPath || !fs.existsSync(excelPath)) return [];

  const workbook = readWorkbook(excelPath);
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
    const discountPercent = toSafeNumber(getRowValue(row, ["discount_percent", "discount", "descuento"], 0), 0);
    const rowIsActive = getRowValue(row, ["is_active", "active", "activo"], "");
    const isRowActive = String(rowIsActive).trim() ? toSafeBoolean(rowIsActive) : true;
    const flashWindow = resolveFlashWindow({
      isFlash24h: getRowValue(row, ["is_flash_24h", "flash_24h", "flash24h"], ""),
      flashStartsAt: getRowValue(row, ["flash_starts_at", "flash_start", "inicio_flash"], ""),
      flashExpiresAt: getRowValue(row, ["flash_expires_at", "flash_end", "fin_flash"], ""),
    });

    if (!slug || !title || price <= 0) continue;

    if (!map.has(slug)) {
      const folderMedia = listProductMedia(slug);

      const excelImagePaths = splitMediaColumn(
        getRowValue(row, ["image", "imagen", "main_image", "cover", "portada"], "")
      ).filter((src) => isImageFile(src) || /^https?:\/\//i.test(src));

      const excelImagesPaths = splitMediaColumn(
        getRowValue(row, ["images", "imagenes", "gallery", "galeria"], "")
      ).filter((src) => isImageFile(src) || /^https?:\/\//i.test(src));

      const excelVideoPaths = splitMediaColumn(
        getRowValue(row, ["video", "videos", "media_video"], "")
      ).filter((src) => isVideoFile(src) || /^https?:\/\//i.test(src));

      const folderImages = folderMedia.filter((item) => item.type === "image").map((item) => item.src);
      const folderVideos = folderMedia.filter((item) => item.type === "video").map((item) => item.src);

      const images = uniqCaseInsensitive([...excelImagePaths, ...excelImagesPaths, ...folderImages]);
      const videos = uniqCaseInsensitive([...excelVideoPaths, ...folderVideos]);

      const mainImage = images[0];

      const orderedMedia: ProductMediaItem[] = [
        ...videos.map((src) => ({ type: "video" as const, src })),
        ...images.map((src) => ({ type: "image" as const, src })),
      ];

      map.set(slug, {
        id: slug,
        slug,
        product_code: slug,
        title,
        name: title,
        price,
        currency: "COP",
        description: `${title}. Producto disponible en JUSP.`,
        image: mainImage,
        images,
        videos,
        media: orderedMedia,
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

export async function GET(req: NextRequest) {
  try {
    const includeFlash24h =
      String(req.nextUrl.searchParams.get("includeFlash24h") || "").trim() === "1";

    const products = buildProductsAndRefreshCache();

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
    console.error("[api/products] excel/cache rebuild failed", error);

    return NextResponse.json([], {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}