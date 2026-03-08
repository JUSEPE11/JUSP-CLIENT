import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Aviso legal | JUSP",
  description:
    "Aviso legal de JUSP CLUB INTERNACIONAL S.A.S., con información corporativa, comunicaciones oficiales, seguridad y lineamientos generales del sitio.",
};

type Section = {
  id: string;
  title: string;
  paragraphs?: string[];
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
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
    marginTop: 18,
  },
  infoItem: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 18,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.48)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.25,
  },
  infoSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.68)",
    fontWeight: 600,
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
    id: "exactitud",
    title: "2. Exactitud de la información",
    paragraphs: [
      "JUSP procura mantener la información del sitio actualizada, precisa y coherente con la operación vigente.",
      "Sin embargo, pueden existir cambios en disponibilidad, precios, condiciones comerciales, contenido, estructura o componentes del sitio sin previo aviso.",
    ],
  },
  {
    id: "enlaces",
    title: "3. Enlaces externos",
    paragraphs: [
      "El sitio puede incluir enlaces a servicios, plataformas o sitios web de terceros para facilitar procesos de navegación, soporte o referencia.",
      "JUSP no controla ni es responsable por contenidos, políticas, disponibilidad o prácticas de dichos sitios externos.",
    ],
  },
  {
    id: "seguridad",
    title: "4. Seguridad del sitio",
    paragraphs: [
      "JUSP implementa medidas razonables de seguridad para proteger la plataforma, la navegación y la información procesada dentro de sus canales oficiales.",
      "Aun así, ningún sistema digital puede garantizar seguridad absoluta frente a eventos externos, ataques avanzados o vulnerabilidades no conocidas al momento.",
    ],
  },
  {
    id: "comunicaciones",
    title: "5. Comunicaciones oficiales",
    paragraphs: [
      "Las comunicaciones oficiales de JUSP se realizan únicamente desde canales y correos del dominio @juspco.com.",
      "JUSP no solicitará contraseñas, códigos de verificación ni información financiera sensible por medios no oficiales o bajo formatos inusuales.",
    ],
  },
];

export default function Page() {
  return (
    <main style={styles.page}>
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGlowC} />
      <div style={styles.vignette} />

      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.pillsRow}>
            <span style={styles.pill}>JUSP · Legal</span>
            <span style={styles.pill}>Aviso corporativo</span>
            <span style={styles.pillAccent}>NIT 902044152</span>
            <span style={styles.pill}>Últ. actualización: 07 mar 2026</span>
          </div>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.eyebrow}>Información corporativa</div>

              <h1 style={styles.heroTitle}>
                Aviso legal
                <span style={styles.heroSubtitle}>seriedad jurídica, confianza real</span>
              </h1>

              <p style={styles.heroText}>
                Este aviso legal reúne información general sobre la operación del sitio web de{" "}
                <strong style={styles.strong}>JUSP CLUB INTERNACIONAL S.A.S.</strong>, incluyendo
                identificación del operador, seguridad razonable, comunicaciones oficiales y
                limitaciones generales de responsabilidad.
              </p>

              <div style={styles.actions}>
                <Link href="/" style={styles.secondaryBtn}>
                  Volver a JUSP
                </Link>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  Contacto legal
                </a>
                <Link href="/terms" style={styles.secondaryBtn}>
                  Ver términos
                </Link>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryEyebrow}>Resumen corporativo</div>
              <h2 style={styles.summaryTitle}>JUSP CLUB INTERNACIONAL S.A.S.</h2>

              <div style={styles.chipsRow}>
                <span style={styles.chip}>JUSP S.A.S.</span>
                <span style={styles.chip}>NIT 902044152</span>
                <span style={styles.chip}>Colombia</span>
              </div>

              <p style={styles.summaryText}>
                JUSP opera bajo un modelo de intermediación para compras internacionales y mantiene
                canales oficiales para soporte, comunicaciones corporativas y asuntos legales.
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
              <h2 id="identificacion" style={styles.sectionTitle}>
                1. Identificación del operador
              </h2>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Razón social</div>
                  <div style={styles.infoValue}>JUSP CLUB INTERNACIONAL S.A.S.</div>
                  <div style={styles.infoSub}>Nombre comercial: JUSP S.A.S.</div>
                  <div style={styles.infoSub}>NIT: 902044152</div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Operación</div>
                  <div style={styles.infoValue}>Colombia</div>
                  <div style={styles.infoSub}>Sitio: juspco.com</div>
                  <div style={styles.infoSub}>Canal oficial: DIRECTOR@JUSPCO.COM</div>
                </div>
              </div>
            </section>

            {sections.map((section) => (
              <section key={section.id} style={styles.sectionCard}>
                <h2 id={section.id} style={styles.sectionTitle}>
                  {section.title}
                </h2>

                <div style={styles.paragraphStack}>
                  {section.paragraphs?.map((paragraph, index) => {
                    if (section.id === "comunicaciones" && index === 0) {
                      return (
                        <p key={`${section.id}-${index}`} style={styles.paragraph}>
                          Las comunicaciones oficiales de JUSP se realizan únicamente desde canales y
                          correos del dominio{" "}
                          <strong style={styles.strong}>@juspco.com</strong>.
                        </p>
                      );
                    }

                    if (section.id === "seguridad" && index === 1) {
                      return (
                        <p key={`${section.id}-${index}`} style={styles.paragraph}>
                          Aun así, ningún sistema digital puede garantizar seguridad absoluta frente
                          a eventos externos, ataques avanzados o vulnerabilidades no conocidas al
                          momento. Si detectas una posible novedad, repórtala a{" "}
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
              </section>
            ))}

            <section style={styles.noteBox}>
              <div style={styles.noteTitle}>Importante</div>
              <p style={styles.noteText}>
                Este documento tiene carácter informativo y no constituye asesoría legal individual.
                Para situaciones específicas o decisiones jurídicas sensibles, se recomienda consultar
                un profesional del derecho en Colombia.
              </p>
            </section>

            <section style={styles.ctaCard}>
              <div style={styles.ctaEyebrow}>Canal oficial</div>
              <h3 style={styles.ctaTitle}>La confianza también se construye con claridad.</h3>
              <p style={styles.ctaText}>
                Si necesitas verificar información corporativa, hacer una consulta formal o validar
                un canal oficial de JUSP, utiliza siempre el correo corporativo de la empresa.
              </p>

              <div style={styles.actions}>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  DIRECTOR@JUSPCO.COM
                </a>
                <Link href="/privacy" style={styles.secondaryBtn}>
                  Privacidad
                </Link>
                <Link href="/shipping" style={styles.secondaryBtn}>
                  Envíos
                </Link>
              </div>
            </section>
          </div>

          <aside style={styles.sidebar}>
            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Contenido</div>
              <div style={styles.tocList}>
                <a href="#identificacion" style={styles.tocItem}>
                  1. Identificación del operador
                </a>
                <a href="#exactitud" style={styles.tocItem}>
                  2. Exactitud de la información
                </a>
                <a href="#enlaces" style={styles.tocItem}>
                  3. Enlaces externos
                </a>
                <a href="#seguridad" style={styles.tocItem}>
                  4. Seguridad del sitio
                </a>
                <a href="#comunicaciones" style={styles.tocItem}>
                  5. Comunicaciones oficiales
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
              <div style={styles.sidebarEyebrow}>Relación con otras páginas</div>
              <p style={styles.noteText}>
                Este aviso legal complementa los{" "}
                <Link href="/terms" style={styles.inlineLink}>
                  Términos
                </Link>
                , la{" "}
                <Link href="/privacy" style={styles.inlineLink}>
                  Política de Privacidad
                </Link>
                , la política de{" "}
                <Link href="/shipping" style={styles.inlineLink}>
                  Envíos
                </Link>{" "}
                y la de{" "}
                <Link href="/returns" style={styles.inlineLink}>
                  Devoluciones y Garantías
                </Link>
                .
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}