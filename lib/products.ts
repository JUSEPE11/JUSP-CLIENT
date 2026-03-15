export type ProductVariant = {
  key: string;
  color?: string;
  size?: string;
  price: number;
  supplierPrice?: number;
  stock?: number;
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

  variants?: ProductVariant[];
};

type CachePayload = {
  version: 1;
  generatedAt: string;
  excelPath: string | null;
  excelMtimeMs: number;
  products: Product[];
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

function listProductImages(slug: string): string[] {
  if (!isServer()) return [];

  try {
    const fs = getFs();
    const path = getPath();
    if (!fs || !path) return [];

    const dir = path.join(process.cwd(), "public", "products", slug);

    if (!fs.existsSync(dir)) return [];

    const files = fs
      .readdirSync(dir)
      .filter((file: string) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a: string, b: string) => {
        const aNum = Number(a.split(".")[0]);
        const bNum = Number(b.split(".")[0]);

        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      });

    return files.map((file: string) => `/products/${slug}/${file}`);
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
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Array<{
      product_slug?: string;
      title?: string;
      brand?: string;
      size?: string;
      color?: string;
      price?: number | string;
      stock?: number | string;
      gender?: string;
      category?: string;
    }>;

    if (!rows.length) return [];

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
          stockHint: 0,
          image: images[0],
          images,
          variants: [],
          sizes: [],
          colors: [],
          price,
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

      if (size && !product.sizes!.includes(size)) product.sizes!.push(size);
      if (color && !product.colors!.includes(color)) product.colors!.push(color);
      product.stockHint = (product.stockHint || 0) + stock;
    }

    return Array.from(map.values()).map((product) => ({
      ...product,
      price: derivePriceFromVariants(product.variants),
    }));
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
  if (!isServer()) return [];

  const excelPath = resolveExcelPath();
  const excelMtimeMs = safeStatMtimeMs(excelPath);
  const cachePath = resolveCachePath();
  const cached = readCache(cachePath);

  if (cached && cached.excelMtimeMs >= excelMtimeMs && cached.products.length) {
    return cached.products;
  }

  const fresh = buildProductsFromExcel();

  if (fresh.length) {
    writeCache(cachePath, fresh, excelPath, excelMtimeMs);
    return fresh;
  }

  if (cached?.products?.length) {
    return cached.products;
  }

  return [];
}

async function getProductsFromApi(): Promise<Product[]> {
  try {
    const res = await fetch("/api/products", {
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

export async function getProducts(): Promise<Product[]> {
  if (isServer()) {
    return getProductsFast();
  }

  return getProductsFromApi();
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