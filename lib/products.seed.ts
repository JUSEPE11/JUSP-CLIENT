// lib/products.seed.ts
// PRO MAX: catálogo fake para probar UI sin DB.
// Cuando tengas productos reales, reemplazas SOLO la fuente de data, no el UI.

export type SeedProduct = {
  id: string;
  title: string;
  price: number;
  image: string;
  brand: string;
  size: string;
  color: string;
  href: string;
};

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "seed-air-max-1",
    title: "Air Max 1 Premium",
    price: 499000,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    brand: "Nike",
    size: "42",
    color: "Black/White",
    href: "/products/seed-air-max-1",
  },
  {
    id: "seed-jordan-4",
    title: "Jordan 4 Retro",
    price: 899000,
    image:
      "https://images.unsplash.com/photo-1528701800489-20be3c2ea0a5?auto=format&fit=crop&w=1200&q=80",
    brand: "Jordan",
    size: "41",
    color: "White/Red",
    href: "/products/seed-jordan-4",
  },
  {
    id: "seed-dunk-low",
    title: "Dunk Low Classic",
    price: 599000,
    image:
      "https://images.unsplash.com/photo-1528701800489-20be3c2ea0a5?auto=format&fit=crop&w=1200&q=80",
    brand: "Nike",
    size: "40",
    color: "Grey/Black",
    href: "/products/seed-dunk-low",
  },
  {
    id: "seed-tech-fleece",
    title: "Tech Fleece Set",
    price: 699000,
    image:
      "https://images.unsplash.com/photo-1520975867597-0f7b5f01d7b8?auto=format&fit=crop&w=1200&q=80",
    brand: "Nike",
    size: "M",
    color: "Charcoal",
    href: "/products/seed-tech-fleece",
  },
];