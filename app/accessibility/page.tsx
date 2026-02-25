// app/accessibility/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Accessibility | JUSP",
};

type Item = { t: string; d: string };
type Pillar = { tag: string; title: string; desc: string; badge?: "Compromiso" | "Transparencia" | "Proceso" };

const pillars: Pillar[] = [
  {
    tag: "LECTURA",
    title: "Texto claro, sin letra pequeña",
    desc: "Preferimos lenguaje simple. Menos vueltas, más entendimiento.",
    badge: "Compromiso",
  },
  {
    tag: "NAVEGACIÓN",
    title: "Estructura predecible",
    desc: "Secciones consistentes para que encuentres rápido lo importante.",
    badge: "Proceso",
  },
  {
    tag: "ACCESO",
    title: "Diseño usable",
    desc: "Contraste, tamaños y botones pensados para usarse bien en móvil y PC.",
    badge: "Transparencia",
  },
];

const checklist: Item[] = [
  { t: "Contraste y legibilidad", d: "Diseño con contraste suficiente y tipografía clara." },
  { t: "Botones y targets cómodos", d: "Áreas clicables más grandes para reducir errores de toque." },
  { t: "Orden lógico del contenido", d: "Títulos, secciones y jerarquía para leer sin perderse." },
  { t: "Accesibilidad práctica", d: "Mejoras continuas enfocadas en uso real (no solo “cumplir”)." },
];

const faqs = [
  {
    q: "¿JUSP cumple accesibilidad al 100%?",
    a: "Estamos en mejora continua. No vendemos perfección: priorizamos utilidad real y correcciones rápidas cuando algo falla.",
  },
  {
    q: "¿Qué puedo hacer si algo no se ve bien?",
    a: "Escríbenos por PQR/Reclamos o Ayuda. Indica tu dispositivo, navegador y captura. Lo corregimos por prioridad.",
  },
  {
    q: "¿Por qué algunas páginas son simples?",
    a: "Porque claridad > adornos. El objetivo es que encuentres lo importante rápido y sin confusión.",
  },
  {
    q: "¿Dónde reporto un problema?",
    a: "En /help o /terms (según el caso). Para atención formal, usa PQR/Reclamos.",
  },
];

function ToneBadge({
  tone,
  children,
}: {
  tone: "gold" | "blue" | "neutral";
  children: ReactNode;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(14px)",
  };

  const toneStyle: React.CSSProperties =
    tone === "gold"
      ? { borderColor: "rgba(250,204,21,0.22)", background: "rgba(250,204,21,0.10)", color: "rgba(255,245,210,0.92)" }
      : tone === "blue"
      ? { borderColor: "rgba(147,197,253,0.22)", background: "rgba(59,130,246,0.10)", color: "rgba(219,234,254,0.92)" }
      : {};

  return <span style={{ ...base, ...toneStyle }}>{children}</span>;
}

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(14px)",
      }}
    >
      {label}
    </span>
  );
}

export default function AccessibilityPage() {
  return (
    <main style={S.main}>
      {/* Fondo help-like premium */}
      <div aria-hidden style={S.bgWrap}>
        <div style={S.bgBase} />
        <div style={S.bgGoldRadialTop} />
        <div style={S.bgGoldHaloLeft} />
        <div style={S.bgBlueHaloRight} />
        <div style={S.bgFadeDown} />
        <div style={S.bgVignette} />
        <div style={S.bgGrain} />
      </div>

      <div style={S.container}>
        {/* Top micro-nav */}
        <div style={S.topbar}>
          <div style={S.badge}>
            <span style={S.dot} />
            <span style={S.badgeText}>JUSP · Accessibility</span>
          </div>

          <div style={S.topActions}>
            <Link href="/help" style={S.linkButton}>
              Volver
            </Link>
            <Link href="/pqr" style={S.linkButton}>
              PQR →
            </Link>
            <Link href="/products" style={S.linkButtonSolidWhite}>
              Ver productos
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section style={S.hero}>
          <div style={S.heroTopBadges}>
            <ToneBadge tone="gold">Usabilidad</ToneBadge>
            <ToneBadge tone="neutral">Claridad</ToneBadge>
            <ToneBadge tone="blue">Mejora continua</ToneBadge>
          </div>

          <div style={S.kicker}>ACCESSIBILITY</div>

          <h1 style={S.h1} className="jusp-h1">
            Accesibilidad
            <span style={S.h1Sub}></span>
          </h1>

          <p style={S.lead}>
            Diseñamos para que navegar y comprar sea fácil: texto claro, estructura lógica y controles cómodos. Si algo te
            estorba, lo corregimos.
          </p>

          <div style={S.ctaRow}>
            <Link href="/help" style={S.ctaSecondary}>
              Ir a Ayuda →
            </Link>
            <Link href="/terms" style={S.ctaPrimary}>
              Ver términos
            </Link>
          </div>

          <p style={S.noteTop}>
            Si detectas un problema de accesibilidad, repórtalo con captura + dispositivo + navegador. Lo priorizamos.
          </p>
        </section>

        {/* PANEL */}
        <section style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelKicker}>Estándar</div>
              <div style={S.panelTitle}>Qué cuidamos</div>
            </div>
            <ToneBadge tone="gold">Sin excusas</ToneBadge>
          </div>

          <div style={S.panelBody}>
            <div style={S.grid3} className="jusp-grid3">
              {pillars.map((p) => (
                <div key={p.title} style={S.card}>
                  <div style={S.cardTop}>
                    <div style={S.cardTag}>{p.tag}</div>
                    {p.badge ? <Badge label={p.badge} /> : null}
                  </div>

                  <div style={S.cardTitle}>{p.title}</div>
                  <div style={S.cardDesc}>{p.desc}</div>

                  <div style={S.cardDivider} />
                  <div style={S.cardFoot}>
                    <span style={S.mini}>Legible</span>
                    <span style={S.mini}>Predecible</span>
                    <span style={S.mini}>Rápido</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div style={S.listCard}>
              <div style={S.listTop}>
                <div style={S.listTitle}>Checklist de mejoras</div>
                <ToneBadge tone="gold">Práctico</ToneBadge>
              </div>

              <div style={S.listGrid} className="jusp-list">
                {checklist.map((x) => (
                  <div key={x.t} style={S.listItem}>
                    <div style={S.listItemTitle}>{x.t}</div>
                    <div style={S.listItemDesc}>{x.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div style={S.faqCard}>
              <div style={S.faqTop}>
                <div style={S.faqTitle}>Preguntas rápidas</div>
                <ToneBadge tone="gold">Claro</ToneBadge>
              </div>

              <div style={S.faqGrid} className="jusp-faq">
                {faqs.map((f) => (
                  <div key={f.q} style={S.faqItem}>
                    <div style={S.faqQ}>{f.q}</div>
                    <div style={S.faqA}>{f.a}</div>
                  </div>
                ))}
              </div>

              <div style={S.faqActions}>
                <Link href="/help" style={S.linkButtonSolid}>
                  Ayuda →
                </Link>
                <Link href="/pqr" style={S.linkButton}>
                  PQR / Reclamos →
                </Link>
                <Link href="/products" style={S.linkButtonSolidWhite}>
                  Ver productos
                </Link>
              </div>

              <p style={S.note}>
                Nota: JUSP gestiona la compra internacional como intermediario. Consulta términos para el detalle legal.
              </p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .jusp-grid3 { grid-template-columns: 1fr !important; }
          .jusp-faq { grid-template-columns: 1fr !important; }
          .jusp-list { grid-template-columns: 1fr !important; }
          .jusp-h1 { font-size: 44px !important; }
        }
        @media (max-width: 520px) {
          .jusp-h1 { font-size: 38px !important; }
        }
      `}</style>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    position: "relative",
    minHeight: "100dvh",
    overflow: "hidden",
    color: "#fff",
    backgroundColor: "#0b0b0f",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },

  bgWrap: { position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" },
  bgBase: { position: "absolute", inset: 0, background: "#0b0b0f" },
  bgGoldRadialTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 560,
    background: "radial-gradient(900px 420px at 15% 18%, rgba(255,200,0,0.34), transparent 60%)",
  },
  bgGoldHaloLeft: {
    position: "absolute",
    top: -160,
    left: -220,
    width: 980,
    height: 980,
    borderRadius: 9999,
    background: "rgba(250,204,21,0.18)",
    filter: "blur(190px)",
  },
  bgBlueHaloRight: {
    position: "absolute",
    bottom: -260,
    right: -260,
    width: 980,
    height: 980,
    borderRadius: 9999,
    background: "rgba(59,130,246,0.12)",
    filter: "blur(220px)",
  },
  bgFadeDown: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.86))",
  },
  bgVignette: {
    position: "absolute",
    inset: 0,
    boxShadow: "inset 0 0 320px rgba(0,0,0,0.96)",
  },
  bgGrain: {
    position: "absolute",
    inset: 0,
    opacity: 0.08,
    mixBlendMode: "overlay" as any,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
  },

  container: { width: "min(1120px, calc(100% - 48px))", margin: "0 auto", padding: "56px 0 86px" },

  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 18px 70px rgba(0,0,0,0.45)",
  },
  dot: { width: 8, height: 8, borderRadius: 999, background: "#facc15", boxShadow: "0 0 18px rgba(250,204,21,0.70)" },
  badgeText: { fontSize: 12, letterSpacing: 0.6, color: "rgba(255,255,255,0.75)" },
  topActions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },

  linkButton: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.90)",
    textDecoration: "none",
    background: "transparent",
  },
  linkButtonSolid: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.92)",
    textDecoration: "none",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
  },
  linkButtonSolidWhite: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#000",
    textDecoration: "none",
    background: "#fff",
    fontWeight: 900,
  },

  hero: { marginTop: 48 },
  heroTopBadges: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  kicker: { marginTop: 22, fontSize: 12, letterSpacing: "0.28em", color: "rgba(255,255,255,0.55)" },
  h1: { marginTop: 14, fontSize: 72, fontWeight: 900, lineHeight: 1.02, letterSpacing: -1.2, textShadow: "0 14px 60px rgba(0,0,0,0.55)" },
  h1Sub: { color: "rgba(255,255,255,0.70)", fontWeight: 900 },
  lead: { marginTop: 18, maxWidth: 860, fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.74)" },

  ctaRow: { marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" },
  ctaPrimary: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "#fff",
    color: "#000",
    fontWeight: 900,
    textDecoration: "none",
  },
  ctaSecondary: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 900,
    textDecoration: "none",
    backdropFilter: "blur(18px)",
  },
  noteTop: { marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.52)", lineHeight: 1.6, maxWidth: 860 },

  panel: {
    marginTop: 22,
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(15,15,21,0.62)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 40px 140px rgba(0,0,0,0.72)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "22px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(90deg, rgba(250,204,21,0.12), rgba(255,255,255,0.06), rgba(59,130,246,0.08))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  panelKicker: { fontSize: 12, color: "rgba(255,255,255,0.60)", letterSpacing: 0.4 },
  panelTitle: { marginTop: 6, fontSize: 24, fontWeight: 900, letterSpacing: -0.4 },
  panelBody: { padding: 22 },

  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },

  card: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.34)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 18,
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  cardTag: { fontSize: 12, letterSpacing: "0.18em", color: "rgba(255,255,255,0.58)" },
  cardTitle: { marginTop: 12, fontSize: 18, fontWeight: 900, letterSpacing: -0.2 },
  cardDesc: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.7 },
  cardDivider: { marginTop: 14, height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)" },
  cardFoot: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  mini: {
    fontSize: 12,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(14px)",
  },

  listCard: {
    marginTop: 14,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.26)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 18,
  },
  listTop: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" },
  listTitle: { fontSize: 18, fontWeight: 900, letterSpacing: -0.2 },
  listGrid: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  listItem: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", padding: 14 },
  listItemTitle: { fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.92)" },
  listItemDesc: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.6 },

  faqCard: {
    marginTop: 14,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.26)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 18,
  },
  faqTop: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" },
  faqTitle: { fontSize: 18, fontWeight: 900, letterSpacing: -0.2 },
  faqGrid: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  faqItem: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", padding: 14 },
  faqQ: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.92)" },
  faqA: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.6 },
  faqActions: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  note: { marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 },
};