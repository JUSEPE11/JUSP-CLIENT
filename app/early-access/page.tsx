// app/early-access/page.tsx
import Link from "next/link";
import EarlyAccessForm from "./EarlyAccessForm";

export const metadata = {
  title: "Early Access | JUSP",
};

export default function EarlyAccessPage() {
  return (
    <main style={styles.main}>
      {/* Fondo cinematográfico estilo /help (sin depender de Tailwind) */}
      <div aria-hidden style={styles.bgWrap}>
        <div style={styles.bgBase} />
        <div style={styles.bgGoldRadialTop} />
        <div style={styles.bgGoldHaloLeft} />
        <div style={styles.bgFadeDown} />
        <div style={styles.bgVignette} />
        <div style={styles.bgGrain} />
      </div>

      <div style={styles.container}>
        {/* Top bar */}
        <div style={styles.topbar}>
          <div style={styles.badge}>
            <span style={styles.dot} />
            <span style={styles.badgeText}>JUSP · Early Access</span>
          </div>

          <div style={styles.topActions}>
            <Link href="/" style={styles.linkButton}>
              Volver
            </Link>
            <Link href="/terms" style={styles.linkButtonSolid}>
              Términos →
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section style={styles.hero}>
          <div style={styles.kicker}>ACCESO ANTICIPADO</div>

          <h1 style={styles.h1}>Entra antes</h1>

          <p style={styles.lead}>
            Gestión internacional transparente. Cupos limitados por operación.
          </p>

          {/* Grid */}
          <div style={styles.grid}>
            {/* Form card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardTitle}>Solicita acceso</div>
                  <div style={styles.cardSub}>
                    Déjanos tu email y te habilitamos por fases.
                  </div>
                </div>

                <span style={styles.pill}>Cupos limitados</span>
              </div>

              <div style={styles.cardBody}>
                <EarlyAccessForm />

                <div style={styles.divider} />

                <p style={styles.legal}>
                  JUSP actúa como intermediario de compra internacional. Consulta términos para
                  detalle legal.
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>¿Por qué Early Access?</div>

              <div style={styles.benefits}>
                <Benefit
                  icon="⚡"
                  title="Cupo controlado"
                  desc="Entradas por fases para mantener calidad y soporte real."
                />
                <Benefit
                  icon="✓"
                  title="Transparencia total"
                  desc="Costos y tiempos claros. Sin letra pequeña."
                />
                <Benefit
                  icon="🧠"
                  title="Soporte humano"
                  desc="Cuando importa, responde una persona."
                />
                <Benefit
                  icon="↗"
                  title="Acceso prioritario"
                  desc="Drops y ofertas antes que el público general."
                />
              </div>

              <div style={styles.promise}>
                <div style={styles.promiseLabel}>Promesa JUSP</div>
                <div style={styles.promiseText}>
                  “Compra internacional transparente + acompañamiento real”.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CSS mínimo para responsive sin Tailwind */}
      <style>{`
        @media (max-width: 980px) {
          .jusp-grid { grid-template-columns: 1fr !important; }
          .jusp-h1 { font-size: 44px !important; }
        }
        @media (max-width: 520px) {
          .jusp-h1 { font-size: 38px !important; }
        }
      `}</style>
    </main>
  );
}

function Benefit({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div style={styles.benefit}>
      <div style={styles.benefitIcon}>{icon}</div>
      <div>
        <div style={styles.benefitTitle}>{title}</div>
        <div style={styles.benefitDesc}>{desc}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    position: "relative",
    minHeight: "100dvh",
    overflow: "hidden",
    color: "#fff",
    backgroundColor: "#0b0b0f",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },

  // Background layers
  bgWrap: { position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" },
  bgBase: { position: "absolute", inset: 0, background: "#0b0b0f" },
  bgGoldRadialTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 560,
    background:
      "radial-gradient(900px 420px at 15% 18%, rgba(255,200,0,0.36), transparent 60%)",
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
    padding: "64px 0 80px",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
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
  badgeText: { fontSize: 12, letterSpacing: 0.6, color: "rgba(255,255,255,0.75)" },

  topActions: { display: "flex", gap: 10, alignItems: "center" },

  linkButton: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    background: "transparent",
    transition: "transform .15s ease, background .15s ease, border-color .15s ease",
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
    transition: "transform .15s ease, background .15s ease, border-color .15s ease",
  },

  hero: { marginTop: 56 },
  kicker: {
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
  lead: {
    marginTop: 18,
    maxWidth: 720,
    fontSize: 18,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.74)",
  },

  grid: {
    marginTop: 40,
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 18,
  },

  card: {
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(15, 15, 21, 0.62)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 40px 140px rgba(0,0,0,0.72)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "22px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(90deg, rgba(250,204,21,0.12), rgba(255,255,255,0.06), rgba(0,0,0,0))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 26, fontWeight: 900, letterSpacing: -0.4 },
  cardSub: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.62)" },
  pill: {
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(250,204,21,0.22)",
    background: "rgba(250,204,21,0.10)",
    color: "rgba(255,245,210,0.92)",
    backdropFilter: "blur(14px)",
  },
  cardBody: { padding: 22 },

  divider: {
    marginTop: 18,
    height: 1,
    width: "100%",
    background:
      "linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)",
  },
  legal: { marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.48)", lineHeight: 1.6 },

  sideCard: {
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 22,
  },
  sideTitle: { fontSize: 20, fontWeight: 900, letterSpacing: -0.2 },
  benefits: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },

  benefit: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    padding: 14,
  },
  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.32)",
    flex: "0 0 auto",
  },
  benefitTitle: { fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.92)" },
  benefitDesc: { marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: 1.55 },

  promise: {
    marginTop: 16,
    borderRadius: 18,
    border: "1px solid rgba(250,204,21,0.22)",
    background: "rgba(250,204,21,0.10)",
    padding: 16,
  },
  promiseLabel: { fontSize: 13, fontWeight: 800, color: "rgba(255,245,210,0.95)" },
  promiseText: { marginTop: 6, fontSize: 13, color: "rgba(255,245,210,0.82)", lineHeight: 1.55 },
};

// Attach class names used by the small <style> block
(styles as any).grid.className = "jusp-grid";
(styles as any).h1.className = "jusp-h1";