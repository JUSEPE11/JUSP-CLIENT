// app/originalidad/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Originalidad | JUSP",
};

const bullets = [
  {
    k: "Originales",
    t: "Proveedores seleccionados + verificación real",
    d: "No compramos “a ciegas”. Filtramos vendedores, revisamos señales de autenticidad y consistencia del producto antes de gestionar tu compra.",
    icon: "✓",
    tone: "gold" as const,
  },
  {
    k: "Directo",
    t: "Costos y tiempos claros, sin letra pequeña",
    d: "Te mostramos el camino real: compra internacional + entrega a Colombia + seguimiento. Sin promesas mágicas. Sin sorpresas.",
    icon: "↗",
    tone: "neutral" as const,
  },
  {
    k: "Flash",
    t: "Acompañamiento humano hasta la entrega",
    d: "Tracking, updates y soporte real. Si algo se mueve, tú lo sabes. Si hay duda, respondemos con criterio (no con bots).",
    icon: "⚡",
    tone: "blue" as const,
  },
];

const steps = [
  {
    n: "01",
    t: "Selección",
    d: "Elegimos proveedores con historial, señales de autenticidad y consistencia.",
  },
  {
    n: "02",
    t: "Verificación",
    d: "Validamos referencias, detalles del producto y control de calidad antes de gestionar.",
  },
  {
    n: "03",
    t: "Gestión de compra",
    d: "Operamos como intermediario: gestionamos la compra internacional con trazabilidad.",
  },
  {
    n: "04",
    t: "Cross-border",
    d: "Envío internacional + coordinación de entrega final a Colombia sin enredos.",
  },
  {
    n: "05",
    t: "Entrega",
    d: "Seguimiento y soporte hasta que lo tengas en tus manos.",
  },
];

const faqs = [
  {
    q: "¿JUSP vende los productos directamente?",
    a: "No. JUSP gestiona la compra internacional como intermediario. Te acompañamos en el proceso con claridad, trazabilidad y soporte humano.",
  },
  {
    q: "¿Qué significa “Originales” en JUSP?",
    a: "Que trabajamos con proveedores seleccionados y aplicamos controles de verificación y calidad para minimizar riesgo y aumentar confianza.",
  },
  {
    q: "¿Qué pasa si hay retrasos o cambios en el envío?",
    a: "Te informamos. Los envíos cross-border pueden moverse por operación, clima o aduana. Por eso JUSP prioriza seguimiento y comunicación clara.",
  },
  {
    q: "¿Dónde veo términos y condiciones?",
    a: "En la sección de términos. Ahí está el detalle legal del rol de intermediación, tiempos y reglas.",
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
      ? {
          borderColor: "rgba(250,204,21,0.22)",
          background: "rgba(250,204,21,0.10)",
          color: "rgba(255,245,210,0.92)",
        }
      : tone === "blue"
      ? {
          borderColor: "rgba(147,197,253,0.22)",
          background: "rgba(59,130,246,0.10)",
          color: "rgba(219,234,254,0.92)",
        }
      : {};

  return <span style={{ ...base, ...toneStyle }}>{children}</span>;
}

function Pill({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div style={S.pillCard}>
      <div style={S.pillLabel}>{label}</div>
      <div style={S.pillValue}>{value}</div>
      <div style={S.pillHint}>{hint}</div>
    </div>
  );
}

function BigQuote({ children }: { children: ReactNode }) {
  return (
    <div style={S.quoteCard}>
      <div aria-hidden style={S.quoteGlow} />
      <div style={S.quoteBody}>
        <div style={S.quoteText}>{children}</div>
        <div style={S.quoteSub}>
          Esto es método. Trazabilidad, claridad y soporte humano.
        </div>
      </div>
    </div>
  );
}

export default function OriginalidadPage() {
  return (
    <main style={S.main}>
      {/* Fondo cinematográfico (help-like) */}
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
            <span style={S.badgeText}>JUSP · Originalidad</span>
          </div>

          <div style={S.topActions}>
            <Link href="/products" style={S.linkButtonSolid}>
              Ver productos
            </Link>
            <Link href="/terms" style={S.linkButton}>
              Ver términos →
            </Link>
            <Link href="/help" style={S.linkButton}>
              Volver
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section style={S.hero}>
          <div style={S.heroTopBadges}>
            <ToneBadge tone="gold">Transparencia total</ToneBadge>
            <ToneBadge tone="neutral">Intermediación (gestión)</ToneBadge>
            <ToneBadge tone="blue">Soporte humano</ToneBadge>
          </div>

          <div style={S.kicker}>ORIGINALIDAD</div>

          <h1 style={S.h1} className="jusp-h1">
            Originales{" "}
            <span style={S.arrowGold} aria-hidden>
              ➡
            </span>{" "}
            Directo{" "}
            <span style={S.arrowBlue} aria-hidden>
              ➡
            </span>{" "}
            Flash
          </h1>

          <p style={S.lead}>
            No es un eslogan: es cómo operamos. Transparencia total, compra
            internacional gestionada con trazabilidad y soporte humano real.
          </p>

          {/* Pilares */}
          <div style={S.pillGrid} className="jusp-pillgrid">
            <Pill
              label="Enfoque"
              value="Claridad + Acompañamiento"
              hint="Te explicamos el proceso sin humo y sin dramatismos."
            />
            <Pill
              label="Modelo"
              value="Intermediación premium"
              hint="No revendemos: gestionamos tu compra con trazabilidad."
            />
            <Pill
              label="Promesa"
              value="Confianza operativa"
              hint="Tracking, updates y respuesta humana cuando importa."
            />
          </div>
        </section>

        {/* Quote ancla */}
        <section style={{ marginTop: 22 }}>
          <BigQuote>
            “Compra internacional{" "}
            <span style={S.wordGold}>transparente</span> +{" "}
            <span style={S.wordBlue}>acompañamiento real</span>.”
          </BigQuote>
        </section>

        {/* Panel principal */}
        <section style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <div style={S.panelKicker}>Cómo lo hacemos (en serio)</div>
              <div style={S.panelTitle}>Un sistema diseñado para confianza</div>
            </div>
            <ToneBadge tone="gold">Sin letra pequeña</ToneBadge>
          </div>

          <div style={S.panelBody}>
            {/* bullets */}
            <div style={S.bulletGrid} className="jusp-bullets">
              {bullets.map((b) => (
                <div key={b.k} style={S.bulletCard}>
                  <div style={S.bulletTop}>
                    <div
                      style={{
                        ...S.bulletIcon,
                        ...(b.tone === "gold"
                          ? {
                              borderColor: "rgba(250,204,21,0.22)",
                              background: "rgba(250,204,21,0.10)",
                              color: "rgba(255,245,210,0.95)",
                            }
                          : b.tone === "blue"
                          ? {
                              borderColor: "rgba(147,197,253,0.22)",
                              background: "rgba(59,130,246,0.10)",
                              color: "rgba(219,234,254,0.95)",
                            }
                          : {}),
                      }}
                    >
                      {b.icon}
                    </div>

                    <div>
                      <div style={S.bulletKey}>{b.k}</div>
                      <div style={S.bulletTitle}>{b.t}</div>
                    </div>
                  </div>

                  <div style={S.bulletDesc}>{b.d}</div>
                  <div style={S.bulletDivider} />
                </div>
              ))}
            </div>

            {/* proceso + no hacemos */}
            <div style={S.twoCol} className="jusp-twocol">
              {/* Proceso */}
              <div style={S.blockCard}>
                <div style={S.blockTop}>
                  <div style={S.blockTitle}>Proceso JUSP</div>
                  <ToneBadge tone="neutral">Trazabilidad</ToneBadge>
                </div>

                <div style={S.stepsGrid} className="jusp-steps">
                  {steps.map((s) => (
                    <div key={s.n} style={S.stepCard}>
                      <div style={S.stepTop}>
                        <span style={S.stepN}>{s.n}</span>
                        <span style={S.stepT}>{s.t}</span>
                      </div>
                      <div style={S.stepD}>{s.d}</div>
                    </div>
                  ))}
                </div>

                <div style={S.infoBox}>
                  <div style={S.infoTitle}>Importante</div>
                  <div style={S.infoText}>
                    JUSP actúa como intermediario/gestor de compra internacional.
                    Esa claridad es parte de la confianza.
                  </div>
                </div>
              </div>

              {/* No hacemos */}
              <div style={S.blockCard}>
                <div style={S.blockTitle}>Lo que NO hacemos</div>
                <div style={S.blockDesc}>
                  Para que esto sea confianza real, dejamos claro el límite:
                </div>

                <ul style={S.list}>
                  <li style={S.li}>
                    <span style={S.bulletDot}>•</span>
                    No prometemos “entrega mágica” sin explicar el cross-border.
                  </li>
                  <li style={S.li}>
                    <span style={S.bulletDot}>•</span>
                    No escondemos costos o tiempos detrás de letra pequeña.
                  </li>
                  <li style={S.li}>
                    <span style={S.bulletDot}>•</span>
                    No te dejamos solo: el soporte es parte del producto.
                  </li>
                </ul>

                <div style={S.resultBox}>
                  <div style={S.resultTitle}>Resultado</div>
                  <div style={S.resultText}>
                    “Compra internacional transparente + acompañamiento real”.
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div style={S.faqCard}>
              <div style={S.faqTop}>
                <div style={S.faqTitle}>Preguntas rápidas</div>
                <ToneBadge tone="gold">Sin vueltas</ToneBadge>
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
                  Ir a Ayuda →
                </Link>
                <Link href="/terms" style={S.linkButton}>
                  Ver términos →
                </Link>
                <Link href="/products" style={S.linkButtonSolidWhite}>
                  Ver productos
                </Link>
              </div>
            </div>

            <p style={S.note}>
              Nota: JUSP gestiona la compra internacional como intermediario.
              Consulta términos para el detalle legal.
            </p>
          </div>
        </section>
      </div>

      {/* Responsive mínimo (sin Tailwind) */}
      <style>{`
        @media (max-width: 980px) {
          .jusp-pillgrid { grid-template-columns: 1fr !important; }
          .jusp-bullets { grid-template-columns: 1fr !important; }
          .jusp-twocol { grid-template-columns: 1fr !important; }
          .jusp-steps { grid-template-columns: 1fr !important; }
          .jusp-faq { grid-template-columns: 1fr !important; }
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

  // Background
  bgWrap: { position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" },
  bgBase: { position: "absolute", inset: 0, background: "#0b0b0f" },
  bgGoldRadialTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 560,
    background:
      "radial-gradient(900px 420px at 15% 18%, rgba(255,200,0,0.34), transparent 60%)",
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

  container: {
    width: "min(1120px, calc(100% - 48px))",
    margin: "0 auto",
    padding: "56px 0 86px",
  },

  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#facc15",
    boxShadow: "0 0 18px rgba(250,204,21,0.70)",
  },
  badgeText: {
    fontSize: 12,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.75)",
  },
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
  kicker: {
    marginTop: 22,
    fontSize: 12,
    letterSpacing: "0.28em",
    color: "rgba(255,255,255,0.55)",
  },
  h1: {
    marginTop: 14,
    fontSize: 72,
    fontWeight: 900,
    lineHeight: 1.02,
    letterSpacing: -1.2,
    textShadow: "0 14px 60px rgba(0,0,0,0.55)",
  },
  arrowGold: {
    display: "inline-block",
    margin: "0 10px",
    color: "rgba(250,204,21,0.95)",
    textShadow: "0 0 18px rgba(250,204,21,0.35)",
  },
  arrowBlue: {
    display: "inline-block",
    margin: "0 10px",
    color: "rgba(191,219,254,0.95)",
    textShadow: "0 0 18px rgba(147,197,253,0.28)",
  },
  lead: {
    marginTop: 18,
    maxWidth: 820,
    fontSize: 18,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.74)",
  },

  pillGrid: {
    marginTop: 26,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  pillCard: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 18,
  },
  pillLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  pillValue: { marginTop: 6, fontSize: 18, fontWeight: 900, letterSpacing: -0.2 },
  pillHint: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.6 },

  quoteCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 40px 140px rgba(0,0,0,0.72)",
  },
  quoteGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(900px 260px at 10% 20%, rgba(250,204,21,0.16), transparent 55%), radial-gradient(900px 260px at 90% 80%, rgba(59,130,246,0.12), transparent 55%)",
  },
  quoteBody: { position: "relative", padding: 22 },
  quoteText: { fontSize: 22, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.2 },
  quoteSub: { marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.60)" },
  wordGold: { color: "rgba(255,245,210,0.95)" },
  wordBlue: { color: "rgba(219,234,254,0.92)" },

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
    background:
      "linear-gradient(90deg, rgba(250,204,21,0.12), rgba(255,255,255,0.06), rgba(59,130,246,0.08))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  panelKicker: { fontSize: 12, color: "rgba(255,255,255,0.60)", letterSpacing: 0.4 },
  panelTitle: { marginTop: 6, fontSize: 24, fontWeight: 900, letterSpacing: -0.4 },

  panelBody: { padding: 22 },

  bulletGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  bulletCard: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.34)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 18,
  },
  bulletTop: { display: "flex", alignItems: "flex-start", gap: 12 },
  bulletIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.90)",
    flex: "0 0 auto",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  },
  bulletKey: { fontSize: 16, fontWeight: 900, letterSpacing: -0.2 },
  bulletTitle: { marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.70)", lineHeight: 1.4 },
  bulletDesc: { marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.7 },
  bulletDivider: {
    marginTop: 14,
    height: 1,
    background:
      "linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)",
    opacity: 0.9,
  },

  twoCol: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 12,
    alignItems: "start",
  },
  blockCard: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 18,
  },
  blockTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  blockTitle: { fontSize: 18, fontWeight: 900, letterSpacing: -0.2 },
  blockDesc: { marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.7 },

  stepsGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  stepCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    padding: 14,
  },
  stepTop: { display: "flex", alignItems: "center", gap: 10 },
  stepN: {
    fontSize: 12,
    letterSpacing: "0.20em",
    color: "rgba(255,245,210,0.85)",
  },
  stepT: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.92)" },
  stepD: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.6 },

  infoBox: {
    marginTop: 12,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.26)",
    padding: 14,
  },
  infoTitle: { fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)" },
  infoText: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.6 },

  list: { marginTop: 14, paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 },
  li: { display: "flex", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.70)", lineHeight: 1.6 },
  bulletDot: { color: "rgba(255,245,210,0.90)" },

  resultBox: {
    marginTop: 14,
    borderRadius: 18,
    border: "1px solid rgba(250,204,21,0.22)",
    background: "rgba(250,204,21,0.10)",
    padding: 14,
  },
  resultTitle: { fontSize: 13, fontWeight: 800, color: "rgba(255,245,210,0.95)" },
  resultText: { marginTop: 6, fontSize: 13, color: "rgba(255,245,210,0.82)", lineHeight: 1.6 },

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
  faqItem: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    padding: 14,
  },
  faqQ: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.92)" },
  faqA: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.6 },

  faqActions: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },

  note: { marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 },
};