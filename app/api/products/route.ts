import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductVariant = {
  key: string;
  color?: string;
  size?: string;
  price: number;
  supplierPrice?: number;
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

type CatalogCacheFile = {
  version?: number;
  generatedAt?: string;
  excelPath?: string | null;
  excelMtimeMs?: number;
  products?: Product[];
};

function normalizeProducts(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    stockHint: Number(product.stockHint ?? 0),
    favoritesCount: Number(product.favoritesCount ?? 0),
    isFavorite: Boolean(product.isFavorite),
  }));
}

function readBundledCatalogProducts(): Product[] {
  try {
    const fromCwd = [
      path.join(process.cwd(), "data", "catalog_products.cache.json"),
      path.join(process.cwd(), "data", "catalogo_jusp.cache.json"),
    ];
    const fromModuleDir =
      typeof __dirname === "string"
        ? [
            path.resolve(__dirname, "../../../../../data/catalog_products.cache.json"),
            path.resolve(__dirname, "../../../../../data/catalogo_jusp.cache.json"),
          ]
        : [];
    const candidates = Array.from(new Set([...fromCwd, ...fromModuleDir]));

    for (const filePath of candidates) {
      try {
        if (!fs.existsSync(filePath)) continue;

        const raw = fs.readFileSync(filePath, "utf8");
        if (!raw.trim()) continue;

        const payload = JSON.parse(raw) as CatalogCacheFile | null;
        const products = Array.isArray(payload?.products) ? payload.products : [];
        if (!products.length) continue;

        return normalizeProducts(products);
      } catch (error) {
        console.error("[api/products] cache read failed", filePath, error);
      }
    }
  } catch (error) {
    console.error("[api/products] runtime bootstrap failed", error);
  }

  return [];
}

async function getFavoritesCountMapSafe(): Promise<Record<string, number>> {
  try {
    const mod = await import("@/lib/favoritesRepo");
    return await mod.getFavoritesCountMap();
  } catch (error) {
    console.error("[api/products] favorites count failed", error);
    return {};
  }
}

export async function GET(req: NextRequest) {
  try {
    const includeFlash24h =
      String(req.nextUrl.searchParams.get("includeFlash24h") || "").trim() === "1";
    const products = readBundledCatalogProducts();
    const countMap = await getFavoritesCountMapSafe();

    const visibleProducts = products
      .map((product) => {
        const productId = String(product.id || "").trim();
        return {
          ...product,
          favoritesCount: Number(countMap[productId] || 0),
          isFavorite: false,
        };
      })
      .filter((product) => includeFlash24h || !Boolean(product?.isFlash24h));

    return NextResponse.json(visibleProducts, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/products] unhandled failure", error);

    return NextResponse.json([], {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
