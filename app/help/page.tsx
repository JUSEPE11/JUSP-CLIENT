// app/help/page.tsx
"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

type HelpCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
};

export default function HelpHomePage() {
  const [q, setQ] = useState("");

  const cards: HelpCard[] = useMemo(
    () => [
      { icon: "📦", title: "Envío y entrega", description: "Tiempos, costos, cobertura y cómo preparamos tu pedido.", href: "/help/envio" },
      { icon: "📍", title: "Estado de mi pedido", description: "Cómo ver el tracking y qué significa cada estado.", href: "/help/estado" },
      { icon: "🔁", title: "Cambios", description: "Qué aplica, cómo solicitar y tiempos de gestión.", href: "/help/cambios" },
      { icon: "↩️", title: "Devoluciones", description: "Cuándo aplican, excepciones y proceso (sin enredos).", href: "/help/devoluciones" },
      { icon: "💳", title: "Pagos", description: "Métodos, confirmaciones y seguridad.", href: "/help/pagos" },
      { icon: "🧾", title: "PQR / Reclamos", description: "Canal oficial y tiempos de respuesta.", href: "/help/pqr" },
      { icon: "🛡️", title: "Autenticidad", description: "Qué hacemos para validar originalidad y calidad.", href: "/help/autenticidad" },
      { icon: "🌎", title: "Cross‑border", description: "Compras internacionales sin sorpresas (Colombia).", href: "/help/crossborder" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cards;
    return cards.filter(
      (c) => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s)
    );
  }, [cards, q]);

  return (
    <main style={{ background: "#0b0b10", minHeight: "100vh", color: "white" }}>
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(1200px 600px at 15% 25%, rgba(247,198,0,0.22), transparent 55%), radial-gradient(900px 500px at 85% 30%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(900px 700px at 60% 120%, rgba(247,198,0,0.10), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent 55%)",
            filter: "saturate(1.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.10,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "56px 18px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#f7c600",
                boxShadow: "0 0 0 6px rgba(247,198,0,0.15)",
              }}
            />
            <span style={{ fontSize: 12, letterSpacing: 0.6, color: "rgba(255,255,255,0.72)" }}>
              CENTRO DE AYUDA JUSP
            </span>
          </div>

          <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: 0, fontWeight: 900, letterSpacing: -0.6 }}>
            ¿Cómo te podemos ayudar?
          </h1>
          <p style={{ marginTop: 12, marginBottom: 22, maxWidth: 760, color: "rgba(255,255,255,0.78)", fontSize: 16 }}>
            Respuestas claras, sin vueltas. Envíos, tracking, pagos, cambios, devoluciones y reclamos — todo en un solo lugar.
          </p>

          {/* Search */}
          <div
            style={{
              maxWidth: 860,
              borderRadius: 18,
              padding: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 80px rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                aria-hidden
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: "rgba(247,198,0,0.16)",
                  border: "1px solid rgba(247,198,0,0.35)",
                  display: "grid",
                  placeItems: "center",
                  color: "#f7c600",
                  fontWeight: 900,
                }}
              >
                ⌕
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca: “estado de mi pedido”, “devoluciones”, “pagos”…"
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                  padding: "0 14px",
                  outline: "none",
                  fontSize: 14,
                }}
              />
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  padding: "0 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "white",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                }}
              >
                Volver
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 14, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
            Tip: si no encuentras la respuesta, entra a <Link href="/help/pqr" style={{ color: "#f7c600", textDecoration: "none" }}>PQR / Reclamos</Link>.
          </div>
        </div>
      </section>

      {/* CARDS */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 18px 64px" }}>
        <div
          style={{
            borderRadius: 26,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.2 }}>Servicio de asistencia rápida</h2>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{filtered.length} opciones</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 12,
            }}
          >
            {filtered.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  borderRadius: 18,
                  background: "rgba(0,0,0,0.42)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 12px 44px rgba(0,0,0,0.45)",
                  padding: 16,
                  display: "block",
                  transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                  e.currentTarget.style.borderColor = "rgba(247,198,0,0.35)";
                  e.currentTarget.style.boxShadow = "0 18px 60px rgba(0,0,0,0.60)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px) scale(1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                  e.currentTarget.style.boxShadow = "0 12px 44px rgba(0,0,0,0.45)";
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    aria-hidden
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 16,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(247,198,0,0.12)",
                      border: "1px solid rgba(247,198,0,0.28)",
                      fontSize: 20,
                    }}
                  >
                    {c.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>{c.title}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.70)", lineHeight: 1.35 }}>
                      {c.description}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              href="/terms"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Términos
            </Link>
            <Link
              href="/privacy"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Privacidad
            </Link>
            <Link
              href="/help/pqr"
              style={{
                textDecoration: "none",
                color: "#0b0b10",
                border: "1px solid rgba(247,198,0,0.55)",
                background: "#f7c600",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              PQR / Reclamos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
