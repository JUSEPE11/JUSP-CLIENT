// /lib/products.ts
export type Product = {
  id: string; // slug (URL)
  title: string; // usado en Home/Products
  name?: string; // compat: algunas pantallas usan name
  price: number;

  currency?: string;
  description?: string;

  // imágenes (PDP PRO)
  image?: string; // compat
  images?: string[]; // recomendado
  colors?: string[];
  sizes?: string[];

  // taxonomía / filtros
  category?: string;
  brand?: string;
  gender?: "men" | "women" | "kids" | "unisex";

  // conversión
  isFeatured?: boolean;
  isNew?: boolean;
  discountPercent?: number; // 0-90
  bestSeller?: boolean;

  // urgencia (fake ahora, real luego)
  stockHint?: number; // ej: 7 => "quedan pocas"
};

export const PRODUCTS: Product[] = [
  {
    id: "nike-dunk-low-retro",
    title: "Nike Dunk Low Retro",
    name: "Nike Dunk Low Retro",
    price: 129900,
    currency: "COP",
    description:
      "Estilo retro, comodidad diaria y look premium. Ideal para rotación diaria. Originales y envío rápido.",
    brand: "Nike",
    category: "Sneakers",
    gender: "men",
    isFeatured: true,
    isNew: true,
    discountPercent: 15,
    bestSeller: true,
    stockHint: 8,
    image: "/products/nike-dunk-low-retro.jpg",
    images: [
      "/products/nike-dunk-low-retro.jpg",
      "/products/nike-dunk-low-retro-2.jpg",
      "/products/nike-dunk-low-retro-3.jpg",
    ],
    colors: ["Black", "White", "Red"],
    sizes: ["7", "7.5", "8", "8.5", "9", "9.5"],
  },

  // Ejemplos (para cross-sell y grid)
  {
    id: "nike-air-force-1-07",
    title: "Nike Air Force 1 '07",
    name: "Nike Air Force 1 '07",
    price: 159900,
    currency: "COP",
    description: "El ícono AF1. Versátil, resistente y siempre vigente.",
    brand: "Nike",
    category: "Sneakers",
    gender: "unisex",
    isNew: false,
    discountPercent: 0,
    bestSeller: true,
    stockHint: 14,
    image: "/products/nike-air-force-1-07.jpg",
    images: ["/products/nike-air-force-1-07.jpg"],
    colors: ["White", "Black"],
    sizes: ["7", "8", "9", "10"],
  },
  {
    id: "nike-air-max-90",
    title: "Nike Air Max 90",
    name: "Nike Air Max 90",
    price: 189900,
    currency: "COP",
    description: "Air visible, look clásico, comodidad diaria.",
    brand: "Nike",
    category: "Sneakers",
    gender: "unisex",
    isNew: true,
    discountPercent: 10,
    bestSeller: false,
    stockHint: 6,
    image: "/products/nike-air-max-90.jpg",
    images: ["/products/nike-air-max-90.jpg"],
    colors: ["White", "Grey"],
    sizes: ["7", "8", "9", "10"],
  },
];

export async function getProducts(): Promise<Product[]> {
  // hoy local; mañana conectas backend real sin tocar UI
  return PRODUCTS;
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}