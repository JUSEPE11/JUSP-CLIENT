import type { CSSProperties } from "react";
import Link from "next/link";
import EarlyAccessForm from "./EarlyAccessForm";

export const metadata = {
  title: "Early Access | JUSP",
};

export default function EarlyAccessPage() {
  return (
    <main style={styles.main}>
      <div aria-hidden style={styles.bgWrap}>
        <div style={styles.bgBase} />
        <div style={styles.bgGoldRadialTop} />
        <div style={styles.bgGoldHaloLeft} />
        <div style={styles.bgGoldHaloRight} />
        <div style={styles.bgFadeDown} />
        <div style={styles.bgVignette} />
        <div style={styles.bgGrain} />
      </div>

      <div style={styles.container}>
        <div style={styles.topbar} className="ea-topbar">
          <div style={styles.badge}>
            <span style={styles.dot} />
            <span style={styles.badgeText}>JUSP · Early Access</span>
          </div>

          <div style={styles.topActions} className="ea-topActions">
            <Link href="/" style={styles.linkButton}>
              Volver
            </Link>
            <Link href="/terms" style={styles.linkButtonSolid}>
              Términos →
            </Link>
          </div>
        </div>

        <section style={styles.hero}>
          <div style={styles.kicker}>ACCESO ANTICIPADO</div>

          <h1 style={styles.h1} className="ea-h1">
            Entra antes
          </h1>

          <p style={styles.lead} className="ea-lead">
            Lista de espera real. Cupos limitados por operación y activación por fases.
          </p>

          <div style={styles.grid} className="ea-grid">
            <div style={styles.card}>
              <div style={styles.cardHeader} className="ea-cardHeader">
                <div>
                  <div style={styles.cardTitle}>Solicita acceso</div>
                  <div style={styles.cardSub}>
                    Déjanos tu email. Entrarás a una waitlist real con posición y revisión por
                    fases.
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

      <style>{`
        @media (max-width: 980px) {
          .ea-topbar {
            align-items: flex-start !important;
          }

          .ea-topActions {
            width: 100% !important;
          }

          .ea-topActions a {
            flex: 1 1 0 !important;
            text-align: center !important;
          }

          .ea-h1 {
            font-size: 52px !important;
            line-height: 0.98 !important;
          }

          .ea-lead {
            font-size: 17px !important;
            line-height: 1.6 !important;
          }

          .ea-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .ea-cardHeader {
            align-items: flex-start !important;
          }
        }

        @media (max-width: 640px) {
          .ea-h1 {
            font-size: 40px !important;
            letter-spacing: -0.8px !important;
          }

          .ea-lead {
            font-size: 16px !important;
          }

          .ea-topActions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }

          .ea-cardHeader {
            display: grid !important;
            gap: 12px !important;
          }
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

const styles: Record<string, CSSProperties> = {
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
    height: 620,
    background:
      "radial-gradient(900px 420px at 14% 18%, rgba(255,200,0,0.30), transparent 60%)",
  },
  bgGoldHaloLeft: {
    position: "absolute",
    top: -160,
    left: -220,
    width: 980,
    height: 980,
    borderRadius: 9999,
    background: "rgba(250,204,21,0.16)",
    filter: "blur(190px)",
  },
  bgGoldHaloRight: {
    position: "absolute",
    top: 120,
    right: -220,
    width: 620,
    height: 620,
    borderRadius: 9999,
    background: "rgba(255,255,255,0.05)",
    filter: "blur(140px)",
  },
  bgFadeDown: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.88))",
  },
  bgVignette: {
    position: "absolute",
    inset: 0,
    boxShadow: "inset 0 0 320px rgba(0,0,0,0.96)",
  },
  bgGrain: {
    position: "absolute",
    inset: 0,
    opacity: 0.06,
    mixBlendMode: "overlay",
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)",
  },

  container: {
    width: "min(1120px, calc(100% - 32px))",
    margin: "0 auto",
    padding: "56px 0 80px",
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
    padding: "12px 16px",
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
    color: "rgba(255,255,255,0.78)",
    fontWeight: 700,
  },

  topActions: { display: "flex", gap: 10, alignItems: "center" },

  linkButton: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.92)",
    textDecoration: "none",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(16px)",
  },
  linkButtonSolid: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.96)",
    textDecoration: "none",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
  },

  hero: { marginTop: 56 },
  kicker: {
    fontSize: 12,
    letterSpacing: "0.28em",
    color: "rgba(255,255,255,0.56)",
    fontWeight: 700,
  },
  h1: {
    marginTop: 14,
    fontSize: 84,
    fontWeight: 900,
    lineHeight: 0.98,
    letterSpacing: -2,
    textShadow: "0 14px 60px rgba(0,0,0,0.55)",
  },
  lead: {
    marginTop: 20,
    maxWidth: 760,
    fontSize: 22,
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.76)",
  },

  grid: {
    marginTop: 42,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.02fr) minmax(340px, 0.98fr)",
    gap: 20,
    alignItems: "start",
  },

  card: {
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(18,18,24,0.74), rgba(8,8,12,0.84))",
    backdropFilter: "blur(18px)",
    boxShadow: "0 40px 140px rgba(0,0,0,0.72)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "24px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(90deg, rgba(250,204,21,0.12), rgba(255,255,255,0.04), rgba(0,0,0,0))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 34, fontWeight: 900, letterSpacing: -0.8, lineHeight: 1.04 },
  cardSub: {
    marginTop: 8,
    fontSize: 15,
    color: "rgba(255,255,255,0.68)",
    lineHeight: 1.5,
    maxWidth: 420,
  },
  pill: {
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(250,204,21,0.22)",
    background: "rgba(250,204,21,0.10)",
    color: "rgba(255,245,210,0.94)",
    backdropFilter: "blur(14px)",
    fontWeight: 700,
  },
  cardBody: { padding: 24 },

  divider: {
    marginTop: 18,
    height: 1,
    width: "100%",
    background:
      "linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)",
  },
  legal: {
    marginTop: 14,
    fontSize: 12,
    color: "rgba(255,255,255,0.48)",
    lineHeight: 1.7,
  },

  sideCard: {
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(0,0,0,0.34), rgba(10,10,14,0.72))",
    backdropFilter: "blur(18px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
    padding: 24,
  },
  sideTitle: { fontSize: 34, fontWeight: 900, letterSpacing: -0.8, lineHeight: 1.04 },
  benefits: { marginTop: 18, display: "flex", flexDirection: "column", gap: 14 },

  benefit: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    padding: 16,
  },
  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.32)",
    flex: "0 0 auto",
    fontSize: 20,
  },
  benefitTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "rgba(255,255,255,0.94)",
    lineHeight: 1.15,
  },
  benefitDesc: {
    marginTop: 6,
    fontSize: 16,
    color: "rgba(255,255,255,0.68)",
    lineHeight: 1.55,
  },

  promise: {
    marginTop: 18,
    borderRadius: 20,
    border: "1px solid rgba(250,204,21,0.22)",
    background: "rgba(250,204,21,0.10)",
    padding: 18,
  },
  promiseLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255,245,210,0.95)",
    letterSpacing: 0.2,
  },
  promiseText: {
    marginTop: 8,
    fontSize: 15,
    color: "rgba(255,245,210,0.84)",
    lineHeight: 1.6,
  },
};