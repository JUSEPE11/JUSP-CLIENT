"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DropsGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });

        if (!res.ok) {
          router.replace("/login?next=%2Fdrops");
          return;
        }

        if (!cancelled) setStatus("allowed");
      } catch {
        router.replace("/login?next=%2Fdrops");
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status !== "allowed") {
    return (
      <main
        style={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#0b0b0f",
          color: "#fff",
        }}
      >
        <div
          style={{
            width: "min(520px, 100%)",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            padding: 24,
            textAlign: "center",
            boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.08em", opacity: 0.7 }}>
            DROP-HYPE
          </div>
          <div style={{ marginTop: 10, fontSize: 28, fontWeight: 1000, lineHeight: 1.05 }}>
            Verificando tu sesión
          </div>
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.72 }}>
            Necesitas iniciar sesión para entrar al Drop-Hype del viernes.
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
