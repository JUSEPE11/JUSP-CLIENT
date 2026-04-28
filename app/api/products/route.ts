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

function normalizeProducts(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    stockHint: Number(product.stockHint ?? 0),
    favoritesCount: Number(product.favoritesCount ?? 0),
    isFavorite: Boolean(product.isFavorite),
  }));
}

// ⚠️ FIX: eliminar dependencia directa de fs en runtime
function readBundledCatalogProductsSafe(): Product[] {
  try {
    // solo intenta si está en entorno local (DEV)
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    const fs = require("node:fs");

    const filePath = path.join(process.cwd(), "data", "catalog_products.cache.json");

    if (!fs.existsSync(filePath)) return [];

    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return [];

    const payload = JSON.parse(raw);
    const products = Array.isArray(payload?.products) ? payload.products : [];

    return normalizeProducts(products);
  } catch (error) {
    console.error("[api/products] safe read failed", error);
    return [];
  }
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

    const products = readBundledCatalogProductsSafe();
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