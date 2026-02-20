import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export const runtime = "nodejs";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}