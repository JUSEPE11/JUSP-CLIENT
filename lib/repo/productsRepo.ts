import type { Product } from "@/lib/products";
import { PRODUCTS } from "@/lib/products";

export type ProductsRepo = {
  list: () => Promise<Product[]>;
  getById: (id: string) => Promise<Product | null>;
};

class InMemoryProductsRepo implements ProductsRepo {
  async list() {
    return PRODUCTS;
  }
  async getById(id: string) {
    const p = PRODUCTS.find((x) => x.id === id);
    return p ?? null;
  }
}

// 🔥 Cuando conectes backend real, solo cambias acá:
export function getProductsRepo(): ProductsRepo {
  // Ejemplo futuro:
  // if (process.env.PRODUCTS_PROVIDER === "SUPABASE") return new SupabaseProductsRepo();
  return new InMemoryProductsRepo();
}