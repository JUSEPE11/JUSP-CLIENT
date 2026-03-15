declare const require: any;

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

function isServer(): boolean {
  return typeof window === "undefined";
}

function listProductImages(slug: string): string[] {
  if (!isServer()) return [];

  try {
    const fs = require("fs");
    const path = require("path");

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
  if (t.includes("mujer") || t.includes("women") || t.includes("bra") || t.includes("sujetador"))
    return "women";
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
  if (v === "niños" || v === "ninos" || v === "niño" || v === "nino") return "kids";

  return null;
}

function normalizeExcelCategory(value: unknown): string {
  const v = String(value || "").trim();
  return v;
}

function buildProductsFromExcel(): Product[] {
  if (!isServer()) return [];

  try {
    const fs = require("fs");
    const path = require("path");
    const XLSX = require("xlsx");

    const filePath = path.join(process.cwd(), "data", "catalogo_jusp.xlsx");

    if (!fs.existsSync(filePath)) return [];

    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as Array<{
      product_slug?: string;
      title?: string;
      brand?: string;
      size?: string;
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
      const price = toSafeNumber(row.price, 0);
      const stock = toSafeNumber(row.stock, 0);
      const excelGender = normalizeExcelGender(row.gender);
      const excelCategory = normalizeExcelCategory(row.category);

      if (!slug || !title || !size || price <= 0) continue;

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
          price: 0,
        });
      }

      const product = map.get(slug)!;
      const variantKey = `${slug}-${sanitizeVariantPart(size)}`;

      product.variants!.push({
        key: variantKey,
        size,
        price,
        stock,
      });

      if (!product.sizes!.includes(size)) product.sizes!.push(size);

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

const EXCEL_PRODUCTS = buildProductsFromExcel();

export const PRODUCTS: Product[] = EXCEL_PRODUCTS;

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}