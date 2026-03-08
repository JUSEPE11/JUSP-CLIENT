// app/help/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type HelpCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  category: string;
  keywords: string[];
  searchText: string;
};

export default function HelpHomePage() {
  const [q, setQ] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const cards: HelpCard[] = useMemo(
    () => [
      {
        icon: "📦",
        title: "Envío y entrega",
        description: "Tiempos, costos, cobertura y cómo preparamos tu pedido.",
        href: "/help/envio",
        category: "Ayuda",
        keywords: [
          "envio",
          "envíos",
          "entrega",
          "shipping",
          "courier",
          "logistica",
          "logística",
          "tiempos",
          "pedido",
          "colombia",
        ],
        searchText:
          "envio envíos entrega shipping courier logística logistica tiempos cobertura pedido pedidos colombia transporte alistamiento preparación preparar pedido estado logístico despacho",
      },
      {
        icon: "📍",
        title: "Estado de mi pedido",
        description: "Cómo ver el tracking y qué significa cada estado.",
        href: "/help/estado",
        category: "Ayuda",
        keywords: [
          "tracking",
          "seguimiento",
          "estado",
          "pedido",
          "guia",
          "guía",
          "rastreo",
          "envio",
          "envío",
        ],
        searchText:
          "tracking seguimiento estado pedido pedidos guia guía rastreo rastrear tracking number número de guía transporte courier envio envío dónde va mi pedido",
      },
      {
        icon: "🔁",
        title: "Cambios",
        description: "Qué aplica, cómo solicitar y tiempos de gestión.",
        href: "/help/cambios",
        category: "Ayuda",
        keywords: [
          "cambio",
          "cambios",
          "talla",
          "producto",
          "solicitud",
          "gestion",
          "gestión",
        ],
        searchText:
          "cambio cambios talla producto solicitud gestión gestion tiempo aplicar aplica reemplazo modificación referencia modelo talla incorrecta",
      },
      {
        icon: "↩️",
        title: "Devoluciones",
        description: "Cuándo aplican, excepciones y proceso (sin enredos).",
        href: "/help/devoluciones",
        category: "Ayuda",
        keywords: [
          "devolucion",
          "devolución",
          "devoluciones",
          "return",
          "returns",
          "retracto",
          "reembolso",
        ],
        searchText:
          "devolucion devolución devoluciones return returns retracto reembolso reembolsos excepciones proceso devolver devolución internacional",
      },
      {
        icon: "💳",
        title: "Pagos",
        description: "Métodos, confirmaciones y seguridad.",
        href: "/help/pagos",
        category: "Ayuda",
        keywords: [
          "pago",
          "pagos",
          "wompi",
          "tarjeta",
          "transferencia",
          "confirmacion",
          "confirmación",
          "seguridad",
        ],
        searchText:
          "pago pagos wompi tarjeta transferencia confirmación confirmacion seguridad antifraude validación validacion checkout cobro método medios de pago",
      },
      {
        icon: "🧾",
        title: "PQR / Reclamos",
        description: "Canal oficial y tiempos de respuesta.",
        href: "/help/pqr",
        category: "Ayuda",
        keywords: [
          "pqr",
          "reclamo",
          "reclamos",
          "queja",
          "peticion",
          "petición",
          "solicitud",
          "soporte",
        ],
        searchText:
          "pqr reclamo reclamos queja petición peticion solicitud solicitudes soporte canal oficial tiempos de respuesta incidencia problema caso ayuda",
      },
      {
        icon: "🛡️",
        title: "Autenticidad",
        description: "Qué hacemos para validar originalidad y calidad.",
        href: "/help/autenticidad",
        category: "Ayuda",
        keywords: [
          "autenticidad",
          "autentico",
          "auténtico",
          "original",
          "originalidad",
          "calidad",
          "verificacion",
          "verificación",
        ],
        searchText:
          "autenticidad autentico auténtico original originalidad calidad verificación verificacion validar validación autenticidad del producto control de calidad",
      },
      {
        icon: "🌎",
        title: "Cross-border",
        description: "Compras internacionales sin sorpresas (Colombia).",
        href: "/help/crossborder",
        category: "Ayuda",
        keywords: [
          "crossborder",
          "cross-border",
          "internacional",
          "colombia",
          "aduana",
          "compras internacionales",
          "importacion",
          "importación",
        ],
        searchText:
          "crossborder cross-border internacional colombia aduana compras internacionales importación importacion envío internacional intermediación courier logística internacional sorpresas",
      },

      // Páginas legales / operativas reales
      {
        icon: "🚚",
        title: "Política de Envíos",
        description: "Tiempos estimados, seguimiento, dirección, incidencias y eventos externos.",
        href: "/shipping",
        category: "Políticas",
        keywords: [
          "shipping",
          "envio",
          "envíos",
          "envio internacional",
          "entrega",
          "courier",
          "seguimiento",
          "incidencia",
          "direccion",
          "dirección",
          "logistica",
          "logística",
        ],
        searchText:
          "shipping política de envíos política de envios envio envíos entrega courier seguimiento incidencia incidencias dirección direccion logística logistica tiempos 15 20 días habiles colombia eventos externos operador",
      },
      {
        icon: "📄",
        title: "Términos y Condiciones",
        description: "Reglas generales de uso, compra, intermediación y responsabilidad.",
        href: "/terms",
        category: "Legal",
        keywords: [
          "terms",
          "terminos",
          "términos",
          "condiciones",
          "legal",
          "intermediacion",
          "intermediación",
          "jurisdiccion",
          "jurisdicción",
        ],
        searchText:
          "terms términos terminos condiciones legal intermediación intermediacion jurisdicción jurisdiccion responsabilidad ley colombiana comerciante contrato uso compra fabricante vendedor directo nit 902044152 jusp club internacional sas",
      },
      {
        icon: "🔒",
        title: "Política de Privacidad",
        description: "Tratamiento de datos personales, seguridad, cookies y derechos del titular.",
        href: "/privacy",
        category: "Legal",
        keywords: [
          "privacy",
          "privacidad",
          "datos",
          "datos personales",
          "cookies",
          "seguridad",
          "habeas data",
          "tratamiento de datos",
        ],
        searchText:
          "privacy privacidad datos datos personales cookies seguridad habeas data tratamiento de datos ley 1581 titular derechos supresión rectificación rectificacion autorización autorizacion correo director@juspco.com nit 902044152",
      },
      {
        icon: "📦",
        title: "Devoluciones y Garantías",
        description: "Casos cubiertos, plazos de reporte, costos y proceso de garantías.",
        href: "/returns",
        category: "Políticas",
        keywords: [
          "returns",
          "devoluciones",
          "garantias",
          "garantías",
          "retracto",
          "defecto",
          "daño",
          "reporte",
          "cambio",
        ],
        searchText:
          "returns devoluciones garantias garantías retracto defecto daño daños reporte reportar cambio cambios fabricante proveedor costos proceso plazo 3 días garantia garantía devolución internacional",
      },
    ],
    []
  );

  function normalize(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreCard(card: HelpCard, query: string) {
    if (!query) return 1;

    const qn = normalize(query);
    const title = normalize(card.title);
    const description = normalize(card.description);
    const category = normalize(card.category);
    const keywords = card.keywords.map(normalize);
    const searchText = normalize(card.searchText);

    let score = 0;

    if (title === qn) score += 140;
    if (title.startsWith(qn)) score += 90;
    if (title.includes(qn)) score += 60;

    if (description.includes(qn)) score += 30;
    if (category.includes(qn)) score += 12;
    if (searchText.includes(qn)) score += 36;

    for (const kw of keywords) {
      if (kw === qn) score += 90;
      else if (kw.startsWith(qn)) score += 45;
      else if (kw.includes(qn)) score += 24;
    }

    const queryWords = qn.split(/\s+/).filter(Boolean);
    for (const word of queryWords) {
      if (title.includes(word)) score += 18;
      if (description.includes(word)) score += 10;
      if (category.includes(word)) score += 4;
      if (keywords.some((kw) => kw.includes(word))) score += 14;
      if (searchText.includes(word)) score += 12;
    }

    return score;
  }

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return cards;

    return cards
      .map((card) => ({ card, score: scoreCard(card, s) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title))
      .map((entry) => entry.card);
  }, [cards, q]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, HelpCard[]> = {};

    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }

    return groups;
  }, [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [q]);

  const quickTopResults = filtered.slice(0, 5);
  const hasSearch = q.trim().length > 0;
  const firstResult = quickTopResults[0] ?? null;

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
            opacity: 0.1,
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
          <p
            style={{
              marginTop: 12,
              marginBottom: 22,
              maxWidth: 760,
              color: "rgba(255,255,255,0.78)",
              fontSize: 16,
            }}
          >
            Respuestas claras, sin vueltas. Envíos, tracking, pagos, cambios, devoluciones, políticas y reclamos — todo en un solo lugar.
          </p>

          {/* Search */}
          <div
            style={{
              maxWidth: 920,
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
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((prev) => Math.min(prev + 1, Math.max(quickTopResults.length - 1, 0)));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((prev) => Math.max(prev - 1, 0));
                  }
                  if (e.key === "Enter" && firstResult) {
                    window.location.href = quickTopResults[activeIndex]?.href || firstResult.href;
                  }
                }}
                placeholder="Busca: “shipping”, “nit”, “cookies”, “estado de mi pedido”, “privacidad”, “devoluciones”…"
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

              {q ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  style={{
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Limpiar
                </button>
              ) : null}

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

            {hasSearch ? (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.28)",
                  overflow: "hidden",
                }}
              >
                {quickTopResults.length > 0 ? (
                  quickTopResults.map((result, index) => {
                    const active = index === activeIndex;
                    return (
                      <Link
                        key={result.href}
                        href={result.href}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 14px",
                          textDecoration: "none",
                          color: "inherit",
                          background: active ? "rgba(247,198,0,0.10)" : "transparent",
                          borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(247,198,0,0.12)",
                            border: "1px solid rgba(247,198,0,0.22)",
                            fontSize: 16,
                            flex: "0 0 auto",
                          }}
                        >
                          {result.icon}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>{result.title}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                            {result.category} · {result.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div style={{ padding: 14, color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                    No encontré resultados para <strong style={{ color: "white" }}>{q}</strong>. Prueba con:
                    {" "}
                    <span style={{ color: "#f7c600" }}>shipping</span>,{" "}
                    <span style={{ color: "#f7c600" }}>nit</span>,{" "}
                    <span style={{ color: "#f7c600" }}>cookies</span>,{" "}
                    <span style={{ color: "#f7c600" }}>privacidad</span>,{" "}
                    <span style={{ color: "#f7c600" }}>devoluciones</span>.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 14, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
            Tip: este buscador ya revisa ayuda, políticas y páginas legales del cliente. Si no encuentras la respuesta, entra a{" "}
            <Link href="/help/pqr" style={{ color: "#f7c600", textDecoration: "none" }}>
              PQR / Reclamos
            </Link>
            .
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
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.2 }}>
              Servicio de asistencia rápida
            </h2>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          {Object.entries(groupedResults).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 18 }}>
              <div
                style={{
                  marginBottom: 10,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  color: "rgba(255,255,255,0.55)",
                  textTransform: "uppercase",
                }}
              >
                {group}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: 12,
                }}
              >
                {items.map((c) => (
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
                          flex: "0 0 auto",
                        }}
                      >
                        {c.icon}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>{c.title}</div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 13,
                            color: "rgba(255,255,255,0.70)",
                            lineHeight: 1.35,
                          }}
                        >
                          {c.description}
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 11,
                            color: "#f7c600",
                            fontWeight: 800,
                            letterSpacing: 0.2,
                          }}
                        >
                          {c.category}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

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
              href="/shipping"
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
              Envíos
            </Link>

            <Link
              href="/returns"
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
              Devoluciones y garantías
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