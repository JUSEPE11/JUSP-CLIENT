// app/verify/page.tsx
import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}>
      <VerifyClient />
    </Suspense>
  );
}
