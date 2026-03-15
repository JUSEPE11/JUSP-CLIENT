import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type ProductVariant = {
  key: string;
  size: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  title: string;
  brand: string;
  price: number;
  images: string[];
  variants: ProductVariant[];
};

export function getProductsFromExcel(): Product[] {
  const filePath = path.join(process.cwd(), "data", "catalogo_jusp.xlsx");

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  const productsMap: Record<string, Product> = {};

  rows.forEach((row) => {
    const slug = row.product_slug;

    if (!productsMap[slug]) {
      const imageDir = path.join(process.cwd(), "public", "products", slug);

      let images: string[] = [];

      if (fs.existsSync(imageDir)) {
        images = fs
          .readdirSync(imageDir)
          .filter((f) => f.endsWith(".jpg"))
          .map((f) => `/products/${slug}/${f}`);
      }

      productsMap[slug] = {
        id: slug,
        title: row.title,
        brand: row.brand,
        price: row.price,
        images,
        variants: [],
      };
    }

    productsMap[slug].variants.push({
      key: `${slug}-${row.size}`,
      size: row.size,
      price: row.price,
      stock: row.stock,
    });
  });

  return Object.values(productsMap);
}