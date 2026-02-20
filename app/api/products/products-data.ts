export type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
  description: string;
  // extras opcionales para badges/ordenamientos futuros
  gender?: "Hombre" | "Mujer" | "Niños";
  isNew?: boolean;
  offPct?: number; // ej 20 para "-20% OFF"
  soldCount?: number; // para "Lo más vendido"
};

export const PRODUCTS: Product[] = [
  {
    id: "nike-dunk-low-retro",
    name: "Nike Dunk Low Retro",
    price: 122990,
    images: ["/images/dunk1.png", "/images/dunk2.png"],
    colors: ["Black", "White", "Red"],
    sizes: ["7", "7.5", "8", "8.5", "9", "9.5"],
    description: "Zapatillas Nike Dunk Low Retro, estilo clásico y comodidad diaria.",
    gender: "Hombre",
    isNew: true,
    offPct: 20,
    soldCount: 120,
  },
];