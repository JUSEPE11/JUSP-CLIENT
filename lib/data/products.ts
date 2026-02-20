import { PRODUCTS, type Product } from "../products";

/**
 * Cambia esto a tu backend real cuando lo tengas.
 * - Hoy: API mock interna (/api/products)
 * - Fallback: PRODUCTS local
 */
const USE_API = true;

export async function fetchProducts(): Promise<Product[]> {
  if (!USE_API) return PRODUCTS;

  try {
    const res = await fetch(`${getBaseUrl()}/api/products`, {
      // App Router caching: ajusta cuando tengas datos reales
      cache: "no-store",
    });
    if (!res.ok) throw new Error("API failed");
    const data = (await res.json()) as { products: Product[] };
    return data.products ?? PRODUCTS;
  } catch {
    return PRODUCTS;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (!USE_API) return PRODUCTS.find((p) => p.id === id) ?? null;

  try {
    const res = await fetch(`${getBaseUrl()}/api/products/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { product: Product | null };
    return data.product ?? null;
  } catch {
    return PRODUCTS.find((p) => p.id === id) ?? null;
  }
}

/**
 * Base URL para SSR (server). En dev funciona con localhost.
 * En prod lo puedes setear con NEXT_PUBLIC_SITE_URL o VERCEL_URL.
 */
function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}