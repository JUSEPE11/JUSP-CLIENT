// lib/products.ts

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

  // 🔥 NUEVO: estilo Taobao
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
    image: "/products/nike-dunk-low-retro.jpg",
    images: [
      "/products/nike-dunk-low-retro.jpg",
      "/products/nike-dunk-low-retro-2.jpg",
      "/products/nike-dunk-low-retro-3.jpg",
    ],

    // 🔥 PRECIO POR TALLA
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
    price: 0, // se calculará abajo
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
    image: "/products/nike-air-force-1-07.jpg",
    images: ["/products/nike-air-force-1-07.jpg"],

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
      "/products/Nike-Dri-Fit-Quick-Dry-Running-Compression-Training-Sports-Tank-Top-Women/1.jpg",
    images: [
      "/products/Nike-Dri-Fit-Quick-Dry-Running-Compression-Training-Sports-Tank-Top-Women/1.jpg",
      "/products/Nike-Dri-Fit-Quick-Dry-Running-Compression-Training-Sports-Tank-Top-Women/2.jpg",
      "/products/Nike-Dri-Fit-Quick-Dry-Running-Compression-Training-Sports-Tank-Top-Women/3.jpg",
      "/products/Nike-Dri-Fit-Quick-Dry-Running-Compression-Training-Sports-Tank-Top-Women/4.jpg",
      "/products/Nike-Dri-Fit-Quick-Dry-Running-Compression-Training-Sports-Tank-Top-Women/5.jpg",
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
    image: "/products/Nike-Sports-Pants-Women's-Purple/1.jpg",
    images: [
      "/products/Nike-Sports-Pants-Women's-Purple/1.jpg",
      "/products/Nike-Sports-Pants-Women's-Purple/2.jpg",
      "/products/Nike-Sports-Pants-Women's-Purple/3.jpg",
      "/products/Nike-Sports-Pants-Women's-Purple/4.jpg",
      "/products/Nike-Sports-Pants-Women's-Purple/5.jpg",
      "/products/Nike-Sports-Pants-Women's-Purple/6.jpg",
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
    image: "/products/Jordan-Club-Cap/1.jpg",
    images: [
      "/products/Jordan-Club-Cap/1.jpg",
      "/products/Jordan-Club-Cap/2.jpg",
      "/products/Jordan-Club-Cap/3.jpg",
      "/products/Jordan-Club-Cap/4.jpg",
      "/products/Jordan-Club-Cap/5.jpg",
      "/products/Jordan-Club-Cap/6.jpg",
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

// 🔥 Calcula automáticamente el precio "desde"
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