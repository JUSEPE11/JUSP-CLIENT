import { NextRequest, NextResponse } from "next/server";
import bundledCatalogCache from "@/data/catalog_products.cache.json";
import type { Product } from "@/lib/products";

export const runtime = "nodejs";

type CatalogCacheFile = {
  version: number;
  generatedAt: string;
  excelPath: string | null;
  excelMtimeMs: number;
  products: Product[];
};

function normalizeProducts(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    stockHint: Number(product.stockHint ?? 0),
    favoritesCount: product.favoritesCount ?? 0,
    isFavorite: product.isFavorite ?? false,
  }));
}

function getBundledProducts(): Product[] {
  try {
    const payload = bundledCatalogCache as CatalogCacheFile | null;
    const products = Array.isArray(payload?.products) ? payload.products : [];
    return normalizeProducts(products);
  } catch (error) {
    console.error("[api/products] bundled cache failed", error);
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
  const includeFlash24h = String(req.nextUrl.searchParams.get("includeFlash24h") || "").trim() === "1";
  const products = getBundledProducts();
  const countMap = await getFavoritesCountMapSafe();

  const visibleProducts = products
    .map((product) => {
      const productId = String(product.id || "").trim();
      return {
        ...product,
        favoritesCount: countMap[productId] || 0,
        isFavorite: false,
      };
    })
    .filter((product) => includeFlash24h || !Boolean(product?.isFlash24h));

  return NextResponse.json(visibleProducts, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
