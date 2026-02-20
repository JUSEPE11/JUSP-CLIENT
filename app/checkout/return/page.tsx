import React, { Suspense } from "react";
import ReturnClient from "./return-client";

export const dynamic = "force-dynamic";

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnClient />
    </Suspense>
  );
}
