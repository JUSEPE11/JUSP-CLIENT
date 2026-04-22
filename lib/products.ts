import { resolveFlashWindow } from "@/lib/flash";

export type ProductVariant = {
  key: string;
  color?: string;
  size?: string;
  price: number;
  supplierPrice?: number;
  stock?: number;
};

export type ProductMediaItem = {
  type: "image" | "video";
  src: string;
};

export type ProductParameter = {
  label: string;
  value: string;
  order?: number;
};

export type Product = {
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
  models?: string[];
  tags?: string[];
  isExclusive?: boolean;
  isCollection?: boolean;

  isFeatured?: boolean;
  isNew?: boolean;
  discountPercent?: number;
  bestSeller?: boolean;
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
  version: 4;
  generatedAt: string;
  excelPath: string | null;
  excelMtimeMs: number;
  products: Product[];
};

type GetProductsOptions = {
  includeFlash24h?: boolean;
};

function isServer(): boolean {
  return typeof window === "undefined";
}

function getNodeRequire(): NodeRequire | null {
  if (!isServer()) return null;

  try {
    return Function("return require")() as NodeRequire;
  } catch {
    return null;
  }
}

function getFs() {
  const req = getNodeRequire();
  return req ? (req("fs") as typeof import("fs")) : null;
}

function getPath() {
  const req = getNodeRequire();
  return req ? (req("path") as typeof import("path")) : null;
}

function getXlsx() {
  const req = getNodeRequire();
  return req ? req("xlsx") : null;
}

function derivePriceFromVariants(variants?: ProductVariant[]): number {
  if (!variants || !variants.length) return 0;
  return Math.min(...variants.map((v) => v.price));
}

function sanitizeVariantPart(value?: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
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

  return (
    v === "1" ||
    v === "true" ||
    v === "yes" ||
    v === "si" ||
    v === "sí" ||
    v === "x" ||
    v === "ok"
  );
}

function normalizeColor(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
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

function normalizeHeaderKey(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getRowValue(
  row: Record<string, unknown>,
  possibleKeys: string[],
  fallback: unknown = ""
): unknown {
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

function getDataDir(): string | null {
  const path = getPath();
  if (!path) return null;
  return path.join(process.cwd(), "data");
}

function ensureDataDir() {
  if (!isServer()) return;

  try {
    const fs = getFs();
    const dataDir = getDataDir();
    if (!fs || !dataDir) return;

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {}
}

function getPreferredCachePath(): string {
  const path = getPath();
  const dataDir = getDataDir();

  if (!path || !dataDir) return "data/catalog_products.cache.json";

  ensureDataDir();
  return path.join(dataDir, "catalog_products.cache.json");
}

function resolveCachePath(): string {
  if (!isServer()) return getPreferredCachePath();

  try {
    const fs = getFs();
    const path = getPath();
    const dataDir = getDataDir();

    if (!fs || !path || !dataDir) return getPreferredCachePath();

    const basenames = ["catalog_products.cache.json", "catalogo_jusp.cache.json"];

    for (const basename of basenames) {
      const full = path.join(dataDir, basename);
      if (fs.existsSync(full)) return full;
    }
  } catch {}

  return getPreferredCachePath();
}

function resolveExcelPath(): string | null {
  if (!isServer()) return null;

  try {
    const fs = getFs();
    const path = getPath();
    const dataDir = getDataDir();

    if (!fs || !path || !dataDir) return null;

    const preferred = path.join(dataDir, "catalogo_jusp.xlsx");

    if (fs.existsSync(preferred)) return preferred;
    if (!fs.existsSync(dataDir)) return null;

    const files = fs.readdirSync(dataDir);
    const candidate = files.find(
      (file: string) =>
        /^catalogo_jusp(\.[^.]+)?\.xlsx$/i.test(file) || /^catalogo_jusp\.xlsx$/i.test(file)
    );

    return candidate ? path.join(dataDir, candidate) : null;
  } catch {
    return null;
  }
}

function resolveParametersExcelPath(): string | null {
  if (!isServer()) return null;

  try {
    const fs = getFs();
    const path = getPath();
    const dataDir = getDataDir();

    if (!fs || !path || !dataDir) return null;

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
      (file: string) =>
        /^product_parameters(\.[^.]+)?\.xlsx$/i.test(file) ||
        /^parametros_producto(\.[^.]+)?\.xlsx$/i.test(file)
    );

    return dynamic ? path.join(dataDir, dynamic) : null;
  } catch {
    return null;
  }
}

function safeStatMtimeMs(filePath: string | null): number {
  if (!isServer() || !filePath) return 0;

  try {
    const fs = getFs();
    if (!fs) return 0;
    return fs.statSync(filePath).mtimeMs || 0;
  } catch {
    return 0;
  }
}

function listProductMedia(slug: string): ProductMediaItem[] {
  if (!isServer()) return [];

  try {
    const fs = getFs();
    const path = getPath();
    if (!fs || !path) return [];

    const dir = path.join(process.cwd(), "public", "products", slug);

    if (!fs.existsSync(dir)) return [];

    const files = fs
      .readdirSync(dir)
      .filter((file: string) => /\.(jpg|jpeg|png|webp|mp4|mov|webm|m4v)$/i.test(file))
      .sort((a: string, b: string) => {
        const aNum = Number(a.split(".")[0]);
        const bNum = Number(b.split(".")[0]);

        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      });

    return files.map((file: string) => ({
      type: /\.(mp4|mov|webm|m4v)$/i.test(file) ? "video" : "image",
      src: `/products/${slug}/${file}`,
    }));
  } catch {
    return [];
  }
}

function loadProductParameters(): Map<string, ProductParameter[]> {
  if (!isServer()) return new Map();

  try {
    const fs = getFs();
    const XLSX = getXlsx();
    const filePath = resolveParametersExcelPath();

    if (!fs || !XLSX || !filePath || !fs.existsSync(filePath)) return new Map();

    const workbook = XLSX.readFile(filePath);
    const firstSheetName =
      workbook.SheetNames.find((sheetName: string) =>
        ["parametros", "Parametros", "parameters", "Parameters"].includes(sheetName)
      ) || workbook.SheetNames[0];

    if (!firstSheetName) return new Map();

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    }) as Record<string, unknown>[];

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
  } catch {
    return new Map();
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

function inferProductType(title: string): "shoes" | "clothing" | "accessory" {
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

function inferGender(title: string): "men" | "women" | "kids" | "unisex" {
  const t = title.toLowerCase();

  if (t.includes("niño") || t.includes("niños") || t.includes("kids")) return "kids";
  if (
    t.includes("mujer") ||
    t.includes("women") ||
    t.includes("bra") ||
    t.includes("sujetador")
  ) {
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

function normalizeExcelGender(value: unknown): "men" | "women" | "kids" | "unisex" | null {
  const v = String(value || "").trim().toLowerCase();

  if (v === "men" || v === "women" || v === "kids" || v === "unisex") return v;
  if (v === "hombre") return "men";
  if (v === "mujer") return "women";
  if (v === "niños" || v === "ninos" || v === "niño" || v === "nino" || v === "kid") {
    return "kids";
  }

  return null;
}

function normalizeExcelCategory(value: unknown): string {
  return String(value || "").trim();
}

function buildProductsFromExcel(): Product[] {
  if (!isServer()) return [];

  try {
    const fs = getFs();
    const XLSX = getXlsx();
    const filePath = resolveExcelPath();

    if (!fs || !XLSX || !filePath || !fs.existsSync(filePath)) return [];

    const workbook = XLSX.readFile(filePath);
    const firstSheetName =
      workbook.SheetNames.find((sheetName: string) => ["productos", "Productos"].includes(sheetName)) ??
      workbook.SheetNames[0];

    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    }) as Record<string, unknown>[];

    if (!rows.length) return [];

    const map = new Map<string, Product>();
    const productParameters = loadProductParameters();

    for (const row of rows) {
      const slug = String(getRowValue(row, ["product_slug", "slug", "productslug"], "")).trim();
      const title = String(getRowValue(row, ["title", "titulo", "name", "nombre"], "")).trim();
      const brand = String(getRowValue(row, ["brand", "marca"], "JUSP")).trim();
      const size = String(getRowValue(row, ["size", "talla"], "")).trim();
      const color = normalizeColor(getRowValue(row, ["color", "colour"], ""));
      const price = toSafeNumber(getRowValue(row, ["price", "precio"], 0), 0);
      const stock = toSafeNumber(getRowValue(row, ["stock", "inventario"], 0), 0);
      const excelGender = normalizeExcelGender(getRowValue(row, ["gender", "genero", "género"], ""));
      const excelCategory = normalizeExcelCategory(getRowValue(row, ["category", "categoria", "categoría"], ""));
      const pickupToday = toSafeBoolean(getRowValue(row, ["pickup_today", "pickup", "retiro_hoy"], ""));
      const expressDelivery = toSafeBoolean(
        getRowValue(row, ["express_delivery", "express", "envio_express"], "")
      );
      const flashWindow = resolveFlashWindow({
        isFlash24h: getRowValue(row, ["is_flash_24h", "flash_24h", "flash24h"], ""),
        flashStartsAt: getRowValue(row, ["flash_starts_at", "flash_start", "inicio_flash"], ""),
        flashExpiresAt: getRowValue(row, ["flash_expires_at", "flash_end", "fin_flash"], ""),
      });
      const discountPercent = toSafeNumber(
        getRowValue(row, ["discount_percent", "discount", "descuento", "porcentaje_descuento"], 0),
        0
      );
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
          currency: "COP",
          description: `${title}. Producto disponible en JUSP.`,
          brand,
          category: excelCategory || inferCategoryFromTitle(title),
          gender: excelGender || inferGender(title),
          productType: inferProductType(title),
          kind: inferKind(title),
          sport: ["lifestyle"],
          tags: ["nuevo"],
          isNew: true,
          discountPercent: discountPercent > 0 ? discountPercent : undefined,
          stockHint: 0,
          image: images[0],
          images,
          videos,
          media,
          parameters: productParameters.get(slug.toLowerCase()) ?? [],
          variants: [],
          sizes: [],
          colors: [],
          price,
          pickupToday,
          expressDelivery,
          isFlash24h: flashWindow.isFlash24h,
          flashStartsAt: flashWindow.flashStartsAt,
          flashExpiresAt: flashWindow.flashExpiresAt,
          flashActive: flashWindow.flashActive,
          flashUpcoming: flashWindow.flashUpcoming,
          isActive: isRowActive,
          favoritesCount: 0,
          isFavorite: false,
        });
      }

      const product = map.get(slug)!;
      const variantKey = `${slug}-${sanitizeVariantPart(size || color || "one")}`;

      product.variants!.push({
        key: variantKey,
        size: size || undefined,
        color: color || undefined,
        price,
        stock,
      });

      if (size) product.sizes = uniqCaseInsensitive([...(product.sizes || []), size]);
      if (color) product.colors = uniqCaseInsensitive([...(product.colors || []), color]);
      product.stockHint = (product.stockHint || 0) + stock;

      product.pickupToday = Boolean(product.pickupToday || pickupToday);
      product.expressDelivery = Boolean(product.expressDelivery || expressDelivery);
      product.isFlash24h = Boolean(product.isFlash24h || flashWindow.isFlash24h);
      product.flashStartsAt = product.flashStartsAt || flashWindow.flashStartsAt;
      product.flashExpiresAt = product.flashExpiresAt || flashWindow.flashExpiresAt;
      product.flashActive = Boolean(product.flashActive || flashWindow.flashActive);
      product.flashUpcoming = Boolean(product.flashUpcoming || flashWindow.flashUpcoming);
      if (product.isActive !== false && !isRowActive) {
        product.isActive = false;
      }
      if (!product.discountPercent && discountPercent > 0) {
        product.discountPercent = discountPercent;
      }
    }

    return Array.from(map.values())
      .map((product) => ({
        ...product,
        price: derivePriceFromVariants(product.variants),
        favoritesCount: product.favoritesCount ?? 0,
        isFavorite: product.isFavorite ?? false,
      }))
      .filter((product) => product.isActive !== false && Number(product.stockHint || 0) > 0);
  } catch {
    return [];
  }
}

function readCache(cachePath: string): CachePayload | null {
  if (!isServer()) return null;

  try {
    const fs = getFs();
    if (!fs || !fs.existsSync(cachePath)) return null;

    const raw = fs.readFileSync(cachePath, "utf8");
    if (!raw.trim()) return null;

    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed || !Array.isArray(parsed.products)) return null;
    if (parsed.version !== 4) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeCache(
  cachePath: string,
  products: Product[],
  excelPath: string | null,
  excelMtimeMs: number
) {
  if (!isServer()) return;

  try {
    const fs = getFs();
    if (!fs) return;

    ensureDataDir();

    const payload: CachePayload = {
      version: 4,
      generatedAt: new Date().toISOString(),
      excelPath,
      excelMtimeMs,
      products,
    };

    fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), "utf8");
  } catch {}
}

function filterVisibleProducts(products: Product[], options?: GetProductsOptions): Product[] {
  if (options?.includeFlash24h) return products;
  return products.filter((product) => !Boolean(product?.isFlash24h));
}

function getProductsFast(options?: GetProductsOptions): Product[] {
  if (!isServer()) return [];

  const excelPath = resolveExcelPath();
  const excelMtimeMs = safeStatMtimeMs(excelPath);
  const cachePath = resolveCachePath();
  const cached = readCache(cachePath);

  if (cached && cached.excelMtimeMs >= excelMtimeMs && cached.products.length) {
    return filterVisibleProducts(
      cached.products.map((product) => ({
        ...product,
        favoritesCount: product.favoritesCount ?? 0,
        isFavorite: product.isFavorite ?? false,
      })),
      options
    );
  }

  const fresh = buildProductsFromExcel();

  if (fresh.length) {
    writeCache(cachePath, fresh, excelPath, excelMtimeMs);
    return filterVisibleProducts(fresh, options);
  }

  if (cached?.products?.length) {
    return filterVisibleProducts(
      cached.products.map((product) => ({
        ...product,
        favoritesCount: product.favoritesCount ?? 0,
        isFavorite: product.isFavorite ?? false,
      })),
      options
    );
  }

  return [];
}

async function getProductsFromApi(options?: GetProductsOptions): Promise<Product[]> {
  try {
    const includeFlash24h = options?.includeFlash24h ? "?includeFlash24h=1" : "";
    const res = await fetch(`/api/products${includeFlash24h}`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? (data as Product[]) : [];
  } catch {
    return [];
  }
}

const EXCEL_PRODUCTS = isServer() ? getProductsFast() : [];

export const PRODUCTS: Product[] = EXCEL_PRODUCTS;

export async function getProducts(options?: GetProductsOptions): Promise<Product[]> {
  if (isServer()) {
    return getProductsFast(options);
  }

  return getProductsFromApi(options);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const lookup = String(id || "").trim().toLowerCase();
  if (!lookup) return undefined;

  const products = await getProducts();

  return products.find((p) => {
    const pid = String(p.id || "").trim().toLowerCase();
    const pslug = String(p.slug || "").trim().toLowerCase();
    const pcode = String(p.product_code || "").trim().toLowerCase();

    return pid === lookup || pslug === lookup || pcode === lookup;
  });
}
