// /lib/size-guides.ts

export type SizeTableRow = {
  label: string;
  values: string[];
};

export type SizeTable = {
  /** Section title shown on the page (e.g. "Zapatos", "Parte superior") */
  title: string;
  /** Optional helper line under the hero (or above table). Keep short. */
  subtitle?: string;
  /** Column headers (e.g. ["XS","S","M"...] or ["1Y","1.5Y"...]) */
  columns: string[];
  /** Table rows (labels + values aligned to columns length) */
  rows: SizeTableRow[];
};

export type SizeGuide = {
  key: "men" | "women" | "kids";
  title: string;
  subtitle: string;
  /** Multiple tables per guide (shoes + apparel + accessories, etc.) */
  tables: SizeTable[];
};

/**
 * ✅ Fuente: tablas de referencia (capturas del usuario).
 * Nota: mantenemos todo como strings para respetar rangos.
 */
export const SIZE_GUIDES: SizeGuide[] = [
  {
    key: "men",
    title: "Hombre",
    subtitle: "Calzado, ropa y trajes de baño — tablas de referencia.",
    tables: [
      {
        title: "Calzado — Hombre",
        subtitle: "Conversión UK / USA / EU / CM.",
        columns: [
          "7",
          "7.5",
          "8",
          "8.5",
          "9",
          "9.5",
          "10",
          "10.5",
          "11",
          "11.5",
          "12",
          "12.5",
          "13",
          "13.5",
          "14",
          "14.5",
          "15",
          "15.5",
          "16",
        ],
        rows: [
          {
            label: "UK",
            values: [
              "6",
              "6.5",
              "7",
              "7.5",
              "8",
              "8.5",
              "9",
              "9.5",
              "10",
              "10.5",
              "11",
              "11.5",
              "12",
              "12.5",
              "13",
              "13.5",
              "14",
              "14.5",
              "15",
            ],
          },
          {
            label: "EU",
            values: [
              "40",
              "40.5",
              "41",
              "42",
              "42.5",
              "43",
              "44",
              "44.5",
              "45",
              "45.5",
              "46",
              "47",
              "47.5",
              "48",
              "48.5",
              "49",
              "49.5",
              "50",
              "50.5",
            ],
          },
          {
            label: "CM",
            values: [
              "25",
              "25.5",
              "26",
              "26.5",
              "27",
              "27.5",
              "28",
              "28.5",
              "29",
              "29.5",
              "30",
              "30.5",
              "31",
              "31.5",
              "32",
              "32.5",
              "33",
              "33.5",
              "34",
            ],
          },
        ],
      },

      {
        title: "Parte superior (Polera / Polerón / Chaqueta)",
        subtitle: "Medidas (cm).",
        columns: ["XS", "S", "M", "L", "XL"],
        rows: [
          { label: "Pecho", values: ["80 - 88", "88 - 96", "96 - 104", "104 - 112", "112 - 124"] },
          { label: "Cintura", values: ["65 - 73", "73 - 81", "81 - 89", "89 - 97", "97 - 109"] },
          { label: "Cadera", values: ["80 - 88", "88 - 96", "96 - 104", "104 - 112", "112 - 124"] },
          { label: "Estatura", values: ["< 170", "170 - 183", "170 - 183", "170 - 183", "183 - 196"] },
        ],
      },

      {
        title: "Parte inferior (Pantalón / Short)",
        subtitle: "Medidas (cm).",
        columns: ["XS", "S", "M", "L", "XL", "2XL"],
        rows: [
          { label: "Cintura", values: ["65 - 73", "73 - 81", "81 - 89", "89 - 97", "97 - 109", "109 - 121"] },
          { label: "Cadera", values: ["80 - 88", "88 - 96", "96 - 104", "104 - 112", "112 - 120", "120 - 128"] },
          { label: "Largo", values: ["82", "82.5", "83", "83.5", "84", "84.5"] },
          { label: "Estatura", values: ["< 170", "170 - 183", "170 - 183", "170 - 183", "183 - 196", "183 - 196"] },
        ],
      },

      {
        title: "Traje de baño — Hombre",
        subtitle: "Medidas (cm).",
        columns: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
        rows: [
          {
            label: "Pecho (cm)",
            values: ["82.5 - 90", "90 - 98", "98 - 105.5", "105.5 - 113", "113 - 120.5", "120.5 - 129.5", "129.5 - 137"],
          },
          {
            label: "Cintura (cm)",
            values: ["66 - 73.5", "73.5 - 81", "81 - 89", "89 - 96.5", "96.5 - 104", "104 - 112", "112 - 119.5"],
          },
          {
            label: "Cadera (cm)",
            values: ["81 - 89", "89 - 96.5", "96.5 - 104", "104 - 112", "112 - 119.5", "119.5 - 127", "127 - 134.5"],
          },
        ],
      },
    ],
  },

  {
    key: "women",
    title: "Mujer",
    subtitle: "Calzado y ropa — tablas de referencia.",
    tables: [
      {
        title: "Zapatos",
        subtitle: "Calzado — Talla CL / US Mujer / Largo del pie (cm).",
        columns: ["35.5", "36", "36.5", "37", "37.5", "38", "38.5", "39", "39.5"],
        rows: [
          { label: "Talla US Mujer", values: ["5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5"] },
          { label: "Largo del pie (cm)", values: ["22.5", "23", "23.5", "24", "24.5", "25", "25.5", "26", "26.5"] },
        ],
      },

      {
        title: "Parte superior (Polerón / Chaqueta)",
        subtitle: "Busto / Cintura / Cadera (cm).",
        columns: ["XS", "S", "M", "L", "XL", "1X", "2X", "3X"],
        rows: [
          { label: "Busto", values: ["76 - 83", "83 - 90", "90 - 97", "97 - 104", "104 - 114", "114 - 124", "124 - 134", "134 - 144"] },
          { label: "Cintura", values: ["60 - 67", "67 - 74", "74 - 81", "81 - 88", "88 - 98", "104 - 114", "114 - 124", "124 - 134"] },
          { label: "Cadera", values: ["84 - 91", "91 - 98", "98 - 105", "105 - 112", "112 - 120", "118 - 128", "128 - 138", "138 - 148"] },
        ],
      },

      {
        title: "Sujetador deportivo — Alate",
        subtitle: "Conversión XS–4X por contorno/copa.",
        columns: ["XS", "S", "M", "L", "XL", "XXL", "1X", "2X", "3X", "4X"],
        rows: [
          {
            label: "Talla por contorno/copa",
            values: [
              "30A - 30E · 32A - 32B",
              "32C - 32E · 34A - 34C",
              "34D - 34E · 36A - 36C",
              "36D - 36E · 38A - 38C",
              "38D - 38E · 40A - 40C",
              "40D - 40E · 42A - 42C",
              "42D - 42E · 44A - 44C",
              "44D - 44E · 46A - 46C",
              "46D - 46E · 48A - 48C",
              "48D - 59E · 50A - 50C",
            ],
          },
        ],
      },

      {
        title: "Sujetador deportivo — Swoosh / Indy",
        subtitle: "Talla por contorno y copas.",
        columns: ["XS", "S", "M", "L", "XL", "2XL", "1X", "2X", "3X"],
        rows: [
          {
            label: "Talla por contorno y copas",
            values: [
              "30A - 30E · 32A - 32B",
              "32C - 32D · 34A - 34C",
              "34D - 34E · 36A - 36C",
              "36D - 36E · 38A - 38C",
              "38D - 38E · 40A - 40C",
              "40D - 40E · 42A - 42C",
              "42A - 42C",
              "42D - 42E",
              "44D - 44E · 46A - 46C",
            ],
          },
        ],
      },

      {
        title: "Parte inferior (Pantalón / Calza / Short / Vestido-Falda)",
        subtitle: "Cintura / Cadera / Estatura (cm).",
        columns: ["XS", "S", "M", "L", "XL", "1X", "2X", "3X"],
        rows: [
          { label: "Cintura", values: ["60 - 67", "67 - 74", "74 - 81", "81 - 88", "88 - 98", "104 - 114", "114 - 124", "124 - 134"] },
          { label: "Cadera", values: ["84 - 91", "91 - 98", "98 - 105", "105 - 112", "112 - 120", "118 - 128", "128 - 138", "138 - 148"] },
          { label: "Estatura", values: ["< 163", "163 - 173", "163 - 173", "163 - 173", "163 - 173", "163 - 173", "163 - 173", "173 >"] },
        ],
      },

      {
        title: "Traje de baño",
        subtitle: "US + medidas (cm).",
        columns: ["XS", "S", "M", "L", "XL", "2XL"],
        rows: [
          { label: "US", values: ["0 - 2", "4 - 6", "8 - 10", "12 - 14", "16 - 18", "20 - 22"] },
          { label: "Busto (cm)", values: ["80 - 85", "85 - 90", "90 - 95.5", "95.5 - 103", "103 - 110.5", "110.5 - 118"] },
          { label: "Cintura (cm)", values: ["61 - 66", "66 - 71", "71 - 76", "76 - 84", "84 - 91.5", "91.5 - 99"] },
          { label: "Cadera (cm)", values: ["87.5 - 92.5", "92.5 - 98", "98 - 103", "103 - 110.5", "110.5 - 118", "118 - 125.5"] },
          { label: "Torso (cm)", values: ["139.5 - 146.5", "146.5 - 153.5", "153.5 - 160.5", "160.5 - 167.5", "167.5 - 174", "174 - 178.5"] },
        ],
      },
    ],
  },

  {
    key: "kids",
    title: "Niños",
    subtitle: "Calzado, ropa y accesorios — tablas de referencia.",
    tables: [
      {
        title: "Zapatos — Niños grandes (20–25 cm)",
        subtitle: "US Niños + Largo del pie (cm).",
        columns: ["1Y", "1.5Y", "2Y", "2.5Y", "3Y", "3.5Y", "4Y", "4.5Y", "5Y"],
        rows: [
          { label: "US: Niños", values: ["1Y", "1.5Y", "2Y", "2.5Y", "3Y", "3.5Y", "4Y", "4.5Y", "5Y"] },
          { label: "Largo del pie (cm)", values: ["20.1", "20.5", "20.9", "21.4", "21.8", "22.2", "22.4", "22.7", "23.2"] },
        ],
      },

      {
        title: "Zapatos — Preescolar (14–22 cm)",
        subtitle: "US Niños + Largo del pie (cm).",
        columns: ["8C", "9C", "10C", "10.5C", "11C", "11.5C", "12C", "12.5C", "13C"],
        rows: [
          { label: "US: Niños", values: ["8C", "9C", "10C", "10.5C", "11C", "11.5C", "12C", "12.5C", "13C"] },
          { label: "Largo del pie (cm)", values: ["15", "15.9", "16.7", "17.2", "17.6", "18", "18.4", "18.8", "19.3"] },
        ],
      },

      {
        title: "Zapatos — Bebé e infantil (7–16 cm)",
        subtitle: "US Niños + Edad (meses) + Largo del pie (cm).",
        columns: ["1C", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C"],
        rows: [
          { label: "US: Niños", values: ["1C", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C"] },
          { label: "Edad (meses)", values: ["3", "6", "9", "12", "18", "24", "36", "", ""] },
          { label: "Largo del pie (cm)", values: ["9.1", "10", "10.8", "11.6", "12.5", "13.3", "14.2", "15", "15.9"] },
        ],
      },

      {
        title: "Ropa — Niña",
        subtitle: "Medidas (cm).",
        columns: ["XS", "S", "M", "L", "XL"],
        rows: [
          { label: "Talla numérica", values: ["6 - 7", "8 - 9", "10 - 12", "14 - 16", "18 - 20"] },
          { label: "Edad", values: ["7 - 8 años", "8 - 10 años", "10 - 12 años", "12 - 13 años", "13 - 15 años"] },
          { label: "Estatura (cm)", values: ["122 - 128", "128 - 137", "137 - 147", "147 - 158", "158 - 168"] },
          { label: "Pecho (cm)", values: ["64.5 - 68", "68 - 73", "73 - 79", "79 - 85.5", "85.5 - 92.5"] },
          { label: "Cintura (cm)", values: ["58.5 - 61", "61 - 64", "64 - 68", "68 - 71.5", "71.5 - 74.5"] },
          { label: "Cadera (cm)", values: ["68.5 - 71", "71 - 74.5", "74.5 - 80.5", "80.5 - 86.5", "86.5 - 93.5"] },
        ],
      },

      {
        title: "Ropa — Niño",
        subtitle: "Medidas (cm).",
        columns: ["XS", "S", "S+", "M", "M+", "L", "L+", "XL", "XL+"],
        rows: [
          { label: "Talla numérica", values: ["6 - 7", "8 - 9", "8 - 9 PLUS", "10 - 12", "10 - 12 PLUS", "14 - 16", "14 - 16 PLUS", "18 - 20", "18 - 20 PLUS"] },
          { label: "Edad", values: ["7 - 8", "8 - 10", "8 - 10", "10 - 12", "10 - 12", "12 - 13", "12 - 13", "13 - 15", "13 - 15"] },
          { label: "Estatura (cm)", values: ["122 - 128", "128 - 137", "128 - 137", "137 - 147", "137 - 147", "147 - 158", "147 - 158", "158 - 170", "158 - 170"] },
          { label: "Pecho (cm)", values: ["64.5 - 66", "66 - 69", "70.5 - 76.5", "69 - 75", "76.5 - 83.5", "75 - 81.5", "83.5 - 91", "81.5 - 88.5", "91 - 98"] },
          { label: "Cintura (cm)", values: ["59.5 - 61.5", "61.5 - 65", "65.5 - 70.5", "65 - 69", "70.5 - 76", "69 - 72.5", "76 - 82", "72.5 - 75.5", "82 - 88"] },
          { label: "Cadera (cm)", values: ["68.5 - 71", "71 - 74.5", "75.5 - 81", "74.5 - 79.5", "81 - 87", "79.5 - 84.5", "87 - 93.5", "84.5 - 89.5", "93.5 - 100"] },
        ],
      },

      {
        title: "Calcetines infantiles",
        subtitle: "Tamaño vs edad.",
        columns: ["0 - M6", "6 - 12M", "12 - 14M", "24 - 36M", "2 - 4Y", "XXS", "XS", "S", "M"],
        rows: [{ label: "Edad (Meses)", values: ["0 - 6M", "6 - 12M", "12 - 14M", "3 - 4Y", "2 - 4Y", "4 - 5Y", "5 - 7Y", "7 - 9Y", "9 - 11Y"] }],
      },
    ],
  },
];

export function getSizeGuide(key: "men" | "women" | "kids") {
  return SIZE_GUIDES.find((g) => g.key === key) ?? SIZE_GUIDES[0];
}