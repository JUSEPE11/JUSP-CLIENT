import React, { Suspense } from "react";
import ProductsClient from "./products-client";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsClient initialProducts={PRODUCTS} />
    </Suspense>
  );
}