export type ProductVariant = {
  key: string; // identificador único variante
  color?: string;
  size?: string;
  price: number; // precio real por variante
  supplierPrice?: number; // opcional control interno
  stock?: number;
};

export type Product = {
  id: string;
  title: string;
  name?: string;

  /**
   * IMPORTANTE:
   * price ahora será el precio "DESDE"
   * (mínimo de variants)
   */
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

export const PRODUCTS: Product[] = [
  {
    id: "nike-dunk-low-retro",
    title: "Nike Dunk Low Retro",
    name: "Nike Dunk Low Retro",
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
    image: "/products/nike-dunk-low-retro/1.jpg",
    images: [
      "/products/nike-dunk-low-retro/1.jpg",
      "/products/nike-dunk-low-retro/2.jpg",
      "/products/nike-dunk-low-retro/3.jpg",
      "/products/nike-dunk-low-retro/4.jpg",
      "/products/nike-dunk-low-retro/5.jpg",
      "/products/nike-dunk-low-retro/6.jpg",
      "/products/nike-dunk-low-retro/7.jpg",
      "/products/nike-dunk-low-retro/8.jpg",
    ],

    variants: [
      { key: "black-7", color: "Black", size: "7", price: 99900, supplierPrice: 25000, stock: 5 },
      { key: "black-8", color: "Black", size: "8", price: 119900, supplierPrice: 28000, stock: 3 },
      { key: "black-9", color: "Black", size: "9", price: 149900, supplierPrice: 35000, stock: 2 },

      { key: "white-8", color: "White", size: "8", price: 139900, supplierPrice: 33000, stock: 4 },
      { key: "white-9", color: "White", size: "9", price: 159900, supplierPrice: 38000, stock: 2 },

      { key: "red-9", color: "Red", size: "9", price: 179900, supplierPrice: 42000, stock: 1 },
    ],

    colors: ["Black", "White", "Red"],
    sizes: ["7", "8", "9"],
    price: 0,
  },

  {
    id: "nike-air-force-1-07",
    title: "Nike Air Force 1 '07",
    name: "Nike Air Force 1 '07",
    currency: "COP",
    description: "El ícono AF1. Versátil, resistente y siempre vigente.",
    brand: "Nike",
    category: "Sneakers",
    gender: "unisex",
    bestSeller: true,
    image: "/products/nike-air-force-1-07/1.jpg",
    images: [
      "/products/nike-air-force-1-07/1.jpg",
      "/products/nike-air-force-1-07/2.jpg",
      "/products/nike-air-force-1-07/3.jpg",
      "/products/nike-air-force-1-07/4.jpg",
      "/products/nike-air-force-1-07/5.jpg",
      "/products/nike-air-force-1-07/6.jpg",
      "/products/nike-air-force-1-07/7.jpg",
      "/products/nike-air-force-1-07/8.jpg",
    ],

    variants: [
      { key: "white-7", color: "White", size: "7", price: 149900 },
      { key: "white-8", color: "White", size: "8", price: 159900 },
      { key: "black-8", color: "Black", size: "8", price: 169900 },
    ],

    colors: ["White", "Black"],
    sizes: ["7", "8"],
    price: 0,
  },

  {
    id: "nike-dri-fit-quick-dry-running-compression-training-sports-tank-top-women",
    title: "Nike Dri-FIT Quick Dry Training Sports Tank Top",
    name: "Nike Dri-FIT Quick Dry Training Sports Tank Top",
    currency: "COP",
    description: "Top deportivo de mujer, ligero, elástico y de secado rápido para entrenamiento diario.",
    brand: "Nike",
    category: "Apparel",
    gender: "women",
    isNew: true,
    stockHint: 6,
    image:
      "/products/nike-dri-fit-quick-dry-running-compression-training-sports-tank-top-women/1.jpg",
    images: [
      "/products/nike-dri-fit-quick-dry-running-compression-training-sports-tank-top-women/1.jpg",
      "/products/nike-dri-fit-quick-dry-running-compression-training-sports-tank-top-women/2.jpg",
      "/products/nike-dri-fit-quick-dry-running-compression-training-sports-tank-top-women/3.jpg",
      "/products/nike-dri-fit-quick-dry-running-compression-training-sports-tank-top-women/4.jpg",
      "/products/nike-dri-fit-quick-dry-running-compression-training-sports-tank-top-women/5.jpg",
    ],
    variants: [{ key: "women-l", size: "L", price: 129990 }],
    sizes: ["L"],
    colors: ["Black"],
    price: 0,
  },

  {
    id: "nike-sports-pants-womens-purple",
    title: "Nike Sports Pants Women's Purple",
    name: "Nike Sports Pants Women's Purple",
    currency: "COP",
    description: "Pantalón deportivo para mujer en tono purple, cómodo para training, running y uso diario.",
    brand: "Nike",
    category: "Apparel",
    gender: "women",
    isNew: true,
    stockHint: 8,
    image: "/products/nike-sports-pants-womens-purple/1.jpg",
    images: [
      "/products/nike-sports-pants-womens-purple/1.jpg",
      "/products/nike-sports-pants-womens-purple/2.jpg",
      "/products/nike-sports-pants-womens-purple/3.jpg",
      "/products/nike-sports-pants-womens-purple/4.jpg",
      "/products/nike-sports-pants-womens-purple/5.jpg",
      "/products/nike-sports-pants-womens-purple/6.jpg",
    ],
    variants: [
      { key: "purple-m", size: "M", price: 69990 },
      { key: "purple-l", size: "L", price: 75990 },
    ],
    sizes: ["M", "L"],
    colors: ["Purple"],
    price: 0,
  },

  {
    id: "jordan-club-cap",
    title: "Jordan Club Cap",
    name: "Jordan Club Cap",
    currency: "COP",
    description: "Gorra Jordan Club con ajuste cómodo y look limpio para uso diario.",
    brand: "Jordan",
    category: "Accessories",
    gender: "men",
    isNew: true,
    stockHint: 10,
    image: "/products/jordan-club-cap/1.jpg",
    images: [
      "/products/jordan-club-cap/1.jpg",
      "/products/jordan-club-cap/2.jpg",
      "/products/jordan-club-cap/3.jpg",
      "/products/jordan-club-cap/4.jpg",
      "/products/jordan-club-cap/5.jpg",
      "/products/jordan-club-cap/6.jpg",
    ],
    variants: [
      { key: "cap-sm", size: "S/M", price: 75990 },
      { key: "cap-ml", size: "M/L", price: 79990 },
      { key: "cap-lxl", size: "L/XL", price: 78990 },
    ],
    sizes: ["S/M", "M/L", "L/XL"],
    colors: ["White"],
    price: 0,
  },
];

PRODUCTS.forEach((p) => {
  if (p.variants?.length) {
    p.price = derivePriceFromVariants(p.variants);
  }
});

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}