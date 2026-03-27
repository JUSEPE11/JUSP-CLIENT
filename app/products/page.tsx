import React, { Suspense } from "react";
import ProductsClient from "./products-client";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

function ProductsSkeleton() {
  return (
    <div className="px-4 pt-6">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-gray-200 aspect-square"
          />
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsClient initialProducts={PRODUCTS} />
    </Suspense>
  );
}