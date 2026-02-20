export type Product = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  images: string[];
  description?: string;
  category?: string;
  sizes?: string[];
  inStock?: boolean;
  discountPercent?: number;
};

export const PRODUCTS: Product[] = [
  {
    id: "nike-dunk-low-retro",
    name: "Nike Dunk Low Retro",
    brand: "Nike",
    price: 499000,
    images: [
      "https://images.unsplash.com/photo-1606813902917-6f4b5f75c1a4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1528701800489-20be9c94f98f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Dunk Low Retro premium. Estilo clásico, limpio y rápido.",
    category: "ZAPATILLAS",
    sizes: ["38", "39", "40", "41", "42", "43"],
    inStock: true,
    discountPercent: 20
  }
];