import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Product = {
  id: string;
  isFlash24h?: boolean;
  favoritesCount?: number;
  isFavorite?: boolean;
};

type CatalogCacheFile = {
  products?: Product[];
};

function readBundledCacheFallback(): Product[] {
  const candidates = Array.from(
    new Set([
      path.join(process.cwd(), "data", "catalog_products.cache.json"),
      path.join(process.cwd(), "data", "catalogo_jusp.cache.json"),
      path.resolve(__dirname, "../../../../../data/catalog_products.cache.json"),
      path.resolve(__dirname, "../../../../../data/catalogo_jusp.cache.json"),
    ])
  );

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, "utf8");
      if (!raw.trim()) continue;

      const payload = JSON.parse(raw) as CatalogCacheFile | null;
      const products = Array.isArray(payload?.products) ? payload.products : [];
      if (products.length) {
        return products.map((product) => ({
          ...product,
          favoritesCount: Number(product.favoritesCount ?? 0),
          isFavorite: false,
        }));
      }
    } catch (error) {
      console.error("[api/products] cache fallback failed", filePath, error);
    }
  }

  return [];
}

export async function GET(req: NextRequest) {
  const includeFlash24h =
    String(req.nextUrl.searchParams.get("includeFlash24h") || "").trim() === "1";

  try {
    const mod = await import("@/lib/products");
    const products = await mod.getProducts({ includeFlash24h: true });
    const visibleProducts = (Array.isArray(products) ? products : []).filter(
      (product) => includeFlash24h || !Boolean(product?.isFlash24h)
    );

    return NextResponse.json(visibleProducts, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/products] primary catalog read failed", error);

    const fallbackProducts = readBundledCacheFallback().filter(
      (product) => includeFlash24h || !Boolean(product?.isFlash24h)
    );

    return NextResponse.json(fallbackProducts, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
