import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Política de Envíos | JUSP",
  description:
    "Política de envíos y tiempos estimados para compras internacionales gestionadas por intermediación a través de JUSP CLUB INTERNACIONAL S.A.S.",
};

type Section = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const glass: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
  boxShadow: "0 30px 120px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const styles: Record<string, CSSProperties> = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 12% 10%, rgba(255,215,0,0.14), transparent 24%), radial-gradient(circle at 88% 18%, rgba(255,255,255,0.07), transparent 22%), linear-gradient(180deg, #050506 0%, #0a0b0e 34%, #0d1014 100%)",
    color: "#ffffff",
  },
  bgGlowA: {
    position: "absolute",
    top: 90,
    left: -140,
    width: 420,
    height: 420,
    borderRadius: 9999,
    background: "rgba(255, 208, 0, 0.12)",
    filter: "blur(110px)",
    pointerEvents: "none",
  },
  bgGlowB: {
    position: "absolute",
    top: 150,
    right: -160,
    width: 460,
    height: 460,
    borderRadius: 9999,
    background: "rgba(255,255,255,0.08)",
    filter: "blur(120px)",
    pointerEvents: "none",
  },
  bgGlowC: {
    position: "absolute",
    bottom: -180,
    left: "24%",
    width: 520,
    height: 520,
    borderRadius: 9999,
    background: "rgba(59,130,246,0.10)",
    filter: "blur(130px)",
    pointerEvents: "none",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    boxShadow: "inset 0 0 240px rgba(0,0,0,0.92)",
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1320,
    margin: "0 auto",
    padding: "24px 16px 72px",
  },
  heroCard: {
    ...glass,
    borderRadius: 34,
    padding: 28,
    overflow: "hidden",
  },
  pillsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "8px 14px",
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  pillAccent: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "8px 14px",
    borderRadius: 9999,
    border: "1px solid rgba(250,204,21,0.28)",
    background: "rgba(250,204,21,0.12)",
    color: "#fff4bf",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
    gap: 24,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    color: "#f5dc78",
    fontWeight: 900,
  },
  heroTitle: {
    margin: "12px 0 0",
    fontSize: "clamp(2.6rem, 5vw, 5.3rem)",
    lineHeight: 0.96,
    letterSpacing: "-0.06em",
    fontWeight: 1000,
    color: "#ffffff",
  },
  heroSubtitle: {
    display: "block",
    marginTop: 14,
    fontSize: "clamp(1rem, 2vw, 1.45rem)",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    fontWeight: 800,
    color: "rgba(255,255,255,0.58)",
  },
  heroText: {
    marginTop: 24,
    maxWidth: 860,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.9,
    fontWeight: 600,
  },
  strong: {
    color: "#ffffff",
    fontWeight: 800,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 26,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 16,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 900,
    color: "#111111",
    background: "#ffffff",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 14px 34px rgba(255,255,255,0.08)",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 16,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  summaryCard: {
    ...glass,
    borderRadius: 28,
    padding: 24,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)), linear-gradient(180deg, rgba(255,214,10,0.05), transparent 45%)",
  },
  summaryEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "rgba(255,255,255,0.48)",
    fontWeight: 900,
  },
  summaryTitle: {
    marginTop: 12,
    fontSize: 30,
    lineHeight: 1.04,
    letterSpacing: "-0.05em",
    fontWeight: 1000,
    color: "#ffffff",
  },
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "6px 12px",
    borderRadius: 9999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: 800,
  },
  summaryText: {
    marginTop: 18,
    color: "rgba(255,255,255,0.74)",
    fontSize: 14,
    lineHeight: 1.85,
    fontWeight: 600,
  },
  mailLink: {
    display: "inline-flex",
    marginTop: 18,
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
    borderBottom: "1px solid rgba(255,255,255,0.32)",
    paddingBottom: 3,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 340px",
    gap: 24,
    marginTop: 24,
  },
  mainCol: {
    display: "grid",
    gap: 18,
  },
  sectionCard: {
    ...glass,
    borderRadius: 28,
    padding: 26,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.08,
    letterSpacing: "-0.04em",
    color: "#ffffff",
    fontWeight: 1000,
    scrollMarginTop: 110,
  },
  paragraphStack: {
    display: "grid",
    gap: 14,
    marginTop: 16,
  },
  paragraph: {
    margin: 0,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.9,
    fontWeight: 600,
  },
  bulletsList: {
    listStyle: "none",
    padding: 0,
    margin: "18px 0 0",
    display: "grid",
    gap: 10,
  },
  bulletItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.85,
    fontWeight: 600,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    marginTop: 10,
    flex: "0 0 auto",
    background: "linear-gradient(180deg, #ffe36a, #ffcf24)",
    boxShadow: "0 0 18px rgba(255,214,10,0.65)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
    marginTop: 18,
  },
  metricCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 18,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.48)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  metricValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.25,
  },
  noteBox: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 18,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#ffffff",
  },
  noteText: {
    margin: "8px 0 0",
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 1.8,
    fontWeight: 600,
  },
  ctaCard: {
    ...glass,
    borderRadius: 32,
    padding: 28,
    background:
      "radial-gradient(circle at top left, rgba(255,214,10,0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04))",
  },
  ctaEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "rgba(255,255,255,0.50)",
    fontWeight: 900,
  },
  ctaTitle: {
    margin: "10px 0 0",
    fontSize: 34,
    lineHeight: 1.04,
    letterSpacing: "-0.05em",
    color: "#ffffff",
    fontWeight: 1000,
  },
  ctaText: {
    marginTop: 16,
    maxWidth: 760,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.85,
    fontWeight: 600,
  },
  sidebar: {
    display: "grid",
    gap: 18,
    alignContent: "start",
    height: "fit-content",
    position: "sticky",
    top: 88,
  },
  sidebarCard: {
    ...glass,
    borderRadius: 26,
    padding: 20,
  },
  sidebarEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.48)",
    fontWeight: 900,
  },
  tocList: {
    display: "grid",
    gap: 8,
    marginTop: 14,
  },
  tocItem: {
    display: "block",
    padding: "11px 12px",
    borderRadius: 14,
    color: "rgba(255,255,255,0.80)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.03)",
  },
  companyName: {
    marginTop: 12,
    fontSize: 24,
    lineHeight: 1.08,
    letterSpacing: "-0.04em",
    color: "#ffffff",
    fontWeight: 1000,
  },
  companyMeta: {
    marginTop: 8,
    color: "rgba(255,255,255,0.74)",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  inlineLink: {
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
    borderBottom: "1px solid rgba(255,255,255,0.30)",
    paddingBottom: 1,
  },
};

const sections: Section[] = [
  {
    id: "tiempos",
    title: "2. Tiempos",
    paragraphs: [
      "El tiempo estimado de entrega es de 15 a 20 días hábiles contados desde la confirmación del pago y la validación del pedido.",
      "Se trata de un estimado y no de una promesa fija, ya que pueden intervenir variables logísticas, operativas, aduaneras y de transporte internacional.",
    ],
  },
  {
    id: "seguimiento",
    title: "3. Seguimiento",
    paragraphs: [
      "Cuando exista número de seguimiento disponible, este será compartido por los canales definidos en la plataforma o durante el flujo de atención correspondiente.",
      "El tracking puede tardar en activarse dependiendo del operador logístico, la consolidación del envío o el momento exacto de registro en tránsito.",
    ],
  },
  {
    id: "direccion",
    title: "4. Dirección",
    paragraphs: [
      "El usuario debe suministrar una dirección correcta, completa y suficientemente clara para la entrega.",
      "Errores, omisiones, referencias incorrectas o datos incompletos pueden generar retrasos, devoluciones, reintentos de entrega o costos adicionales.",
    ],
  },
  {
    id: "eventos",
    title: "5. Eventos externos",
    paragraphs: [
      "Pueden presentarse demoras por inspecciones aduaneras, restricciones logísticas, clima, alta demanda, congestión del operador, novedades de seguridad o eventos de fuerza mayor.",
      "JUSP acompaña la gestión del pedido, pero no controla decisiones, tiempos ni actuaciones de terceros intervinientes en el transporte o en procesos aduaneros.",
    ],
  },
  {
    id: "incidencias",
    title: "6. Incidencias",
    paragraphs: [
      "Si el usuario detecta una incidencia como estado detenido, entrega fallida, empaque comprometido o daño aparente, debe reportarla oportunamente al canal oficial.",
      "Para una mejor gestión, la solicitud debe incluir número de pedido, descripción del caso y evidencia, como fotografías si aplica.",
    ],
  },
];

export default function ShippingPage() {
  return (
    <main style={styles.page}>
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGlowC} />
      <div style={styles.vignette} />

      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.pillsRow}>
            <span style={styles.pill}>JUSP · Envíos</span>
            <span style={styles.pill}>Intermediación</span>
            <span style={styles.pillAccent}>NIT 902044152</span>
            <span style={styles.pill}>Últ. actualización: 07 mar 2026</span>
          </div>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.eyebrow}>Logística y entrega</div>

              <h1 style={styles.heroTitle}>
                Política de Envíos
                <span style={styles.heroSubtitle}>claridad operativa, sin sorpresas</span>
              </h1>

              <p style={styles.heroText}>
                Así operan los envíos de compras internacionales gestionadas por{" "}
                <strong style={styles.strong}>JUSP CLUB INTERNACIONAL S.A.S.</strong> para Colombia,
                dentro del modelo de intermediación que usa la plataforma.
              </p>

              <div style={styles.actions}>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  Reportar incidencia
                </a>
                <Link href="/terms" style={styles.secondaryBtn}>
                  Ver términos
                </Link>
                <Link href="/privacy" style={styles.secondaryBtn}>
                  Ver privacidad
                </Link>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryEyebrow}>Resumen operativo</div>
              <h2 style={styles.summaryTitle}>Envío internacional a Colombia</h2>

              <div style={styles.chipsRow}>
                <span style={styles.chip}>15 a 20 días hábiles</span>
                <span style={styles.chip}>Courier / operador</span>
                <span style={styles.chip}>Seguimiento</span>
              </div>

              <p style={styles.summaryText}>
                El flujo puede incluir alistamiento, transporte internacional, procesamiento logístico
                y entrega final. JUSP acompaña la gestión del pedido durante el proceso.
              </p>

              <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.mailLink}>
                DIRECTOR@JUSPCO.COM
              </a>
            </div>
          </div>
        </section>

        <div style={styles.layout}>
          <div style={styles.mainCol}>
            <section style={styles.sectionCard}>
              <h2 id="resumen" style={styles.sectionTitle}>
                1. Resumen
              </h2>

              <p style={{ ...styles.paragraph, marginTop: 16 }}>
                Los pedidos se gestionan mediante operadores logísticos o courier. El flujo puede
                incluir alistamiento, consolidación, transporte internacional, validaciones
                intermedias y entrega en Colombia.
              </p>

              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Tiempo estimado</div>
                  <div style={styles.metricValue}>15 a 20 días hábiles</div>
                </div>

                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Destino</div>
                  <div style={styles.metricValue}>Colombia</div>
                </div>

                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Soporte</div>
                  <div style={styles.metricValue}>DIRECTOR@JUSPCO.COM</div>
                </div>
              </div>
            </section>

            {sections.map((section) => (
              <section key={section.id} style={styles.sectionCard}>
                <h2 id={section.id} style={styles.sectionTitle}>
                  {section.title}
                </h2>

                {section.paragraphs?.length ? (
                  <div style={styles.paragraphStack}>
                    {section.paragraphs.map((paragraph, index) => {
                      if (section.id === "incidencias" && index === 1) {
                        return (
                          <p key={`${section.id}-${index}`} style={styles.paragraph}>
                            Para una mejor gestión, la solicitud debe incluir número de pedido,
                            descripción del caso y evidencia, como fotografías si aplica. El canal
                            oficial es{" "}
                            <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.inlineLink}>
                              DIRECTOR@JUSPCO.COM
                            </a>
                            .
                          </p>
                        );
                      }

                      return (
                        <p key={`${section.id}-${index}`} style={styles.paragraph}>
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            ))}

            <section style={styles.noteBox}>
              <div style={styles.noteTitle}>Nota importante</div>
              <p style={styles.noteText}>
                Los tiempos son estimados razonables. El estado del envío puede verse afectado por
                terceros, autoridades, rutas internacionales y variables fuera del control directo de
                JUSP.
              </p>
            </section>

            <section style={styles.ctaCard}>
              <div style={styles.ctaEyebrow}>Seguimiento y soporte</div>
              <h3 style={styles.ctaTitle}>Tu pedido no va solo. Nosotros lo acompañamos.</h3>
              <p style={styles.ctaText}>
                Si necesitas reportar una novedad o dar seguimiento a una incidencia logística, usa
                el canal oficial de JUSP y comparte la información del pedido para agilizar la
                gestión.
              </p>

              <div style={styles.actions}>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  Reportar incidencia
                </a>
                <Link href="/returns" style={styles.secondaryBtn}>
                  Ver devoluciones
                </Link>
                <Link href="/help" style={styles.secondaryBtn}>
                  Centro de ayuda
                </Link>
              </div>
            </section>
          </div>

          <aside style={styles.sidebar}>
            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Contenido</div>
              <div style={styles.tocList}>
                <a href="#resumen" style={styles.tocItem}>
                  1. Resumen
                </a>
                <a href="#tiempos" style={styles.tocItem}>
                  2. Tiempos
                </a>
                <a href="#seguimiento" style={styles.tocItem}>
                  3. Seguimiento
                </a>
                <a href="#direccion" style={styles.tocItem}>
                  4. Dirección
                </a>
                <a href="#eventos" style={styles.tocItem}>
                  5. Eventos externos
                </a>
                <a href="#incidencias" style={styles.tocItem}>
                  6. Incidencias
                </a>
              </div>
            </section>

            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Empresa</div>
              <div style={styles.companyName}>JUSP CLUB INTERNACIONAL S.A.S.</div>
              <div style={styles.companyMeta}>Nombre comercial: JUSP S.A.S.</div>
              <div style={styles.companyMeta}>NIT: 902044152</div>
              <div style={styles.companyMeta}>País: Colombia</div>
              <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.mailLink}>
                DIRECTOR@JUSPCO.COM
              </a>
            </section>

            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Relación con otras políticas</div>
              <p style={styles.noteText}>
                Esta política debe leerse junto con los{" "}
                <Link href="/terms" style={styles.inlineLink}>
                  Términos
                </Link>{" "}
                y la{" "}
                <Link href="/privacy" style={styles.inlineLink}>
                  Política de Privacidad
                </Link>{" "}
                de JUSP.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}