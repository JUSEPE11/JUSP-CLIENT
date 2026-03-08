import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Política de Privacidad | JUSP",
  description:
    "Política de tratamiento de datos personales de JUSP CLUB INTERNACIONAL S.A.S. conforme a la normatividad colombiana aplicable.",
};

type Section = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  cards?: Array<{
    title: string;
    description: string;
  }>;
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
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
    marginTop: 18,
  },
  miniCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 18,
  },
  miniCardTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.3,
  },
  miniCardText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.70)",
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
    id: "datos",
    title: "2. Datos que recolectamos",
    paragraphs: [
      "Podemos recolectar información de identificación, contacto, entrega, operación, soporte y seguridad cuando el usuario interactúa con la plataforma.",
    ],
    bullets: [
      "Identificación y contacto: nombre, documento, correo electrónico y teléfono.",
      "Datos de envío: dirección, ciudad, referencias de entrega e información logística necesaria.",
      "Datos transaccionales: historial de pedidos, estados, incidencias y soporte relacionado.",
      "Datos técnicos: IP, dispositivo, cookies, sesión y eventos para seguridad, autenticación y antifraude.",
    ],
  },
  {
    id: "finalidades",
    title: "3. Finalidades",
    cards: [
      {
        title: "Gestión de pedidos",
        description:
          "Crear, procesar, coordinar y dar seguimiento a compras gestionadas por intermediación internacional.",
      },
      {
        title: "Atención al cliente",
        description:
          "Responder solicitudes, PQRS, garantías, cambios, devoluciones y comunicaciones sobre tu pedido.",
      },
      {
        title: "Seguridad",
        description:
          "Prevenir fraude, abuso, accesos no autorizados, contracargos indebidos y reforzar la protección de la cuenta.",
      },
      {
        title: "Mejora del servicio",
        description:
          "Analítica interna, experiencia de usuario y mejora continua del desempeño de la plataforma.",
      },
    ],
  },
  {
    id: "derechos",
    title: "4. Derechos del titular",
    paragraphs: [
      "El titular de los datos personales podrá conocer, actualizar, rectificar y solicitar la supresión de sus datos, así como revocar la autorización, en los términos de la ley.",
    ],
  },
  {
    id: "canales",
    title: "5. Canales y tiempos",
    paragraphs: [
      "El canal oficial para solicitudes relacionadas con privacidad, protección de datos y ejercicio de derechos es DIRECTOR@JUSPCO.COM.",
      "El tiempo objetivo de respuesta es de 1 a 2 días hábiles, sin perjuicio de la complejidad del caso o de los términos legales aplicables.",
    ],
  },
  {
    id: "seguridad",
    title: "6. Seguridad",
    paragraphs: [
      "Aplicamos medidas técnicas y administrativas razonables para proteger la información contra acceso no autorizado, alteración, pérdida, filtración o uso indebido.",
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies",
    paragraphs: [
      "Usamos cookies y tecnologías similares para autenticación, seguridad, preferencia de usuario, rendimiento y analítica interna.",
      "Algunas cookies son necesarias para el funcionamiento de la plataforma. El usuario puede gestionar cookies desde su navegador, aunque ello podría afectar ciertas funciones.",
    ],
  },
  {
    id: "vigencia",
    title: "8. Vigencia",
    paragraphs: [
      "Esta política rige desde su publicación y podrá actualizarse. Cualquier cambio material será informado en la plataforma o en los canales que JUSP considere apropiados.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={styles.page}>
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGlowC} />
      <div style={styles.vignette} />

      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.pillsRow}>
            <span style={styles.pill}>JUSP · Privacidad</span>
            <span style={styles.pill}>Ley 1581 de 2012</span>
            <span style={styles.pillAccent}>NIT 902044152</span>
            <span style={styles.pill}>Últ. actualización: 07 mar 2026</span>
          </div>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.eyebrow}>Tratamiento de datos</div>

              <h1 style={styles.heroTitle}>
                Política de Privacidad
                <span style={styles.heroSubtitle}>transparencia real, protección real</span>
              </h1>

              <p style={styles.heroText}>
                Esta política describe cómo <strong style={styles.strong}>JUSP CLUB INTERNACIONAL S.A.S.</strong>,
                nombre comercial <strong style={styles.strong}>JUSP S.A.S.</strong>, recolecta, usa
                y protege datos personales al utilizar <strong style={styles.strong}>juspco.com</strong>,
                de acuerdo con la normatividad colombiana aplicable.
              </p>

              <div style={styles.actions}>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  Contacto de privacidad
                </a>
                <Link href="/terms" style={styles.secondaryBtn}>
                  Ver términos
                </Link>
                <a href="javascript:window.print()" style={styles.secondaryBtn}>
                  Imprimir / Guardar PDF
                </a>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryEyebrow}>Resumen clave</div>
              <h2 style={styles.summaryTitle}>Tus datos son tuyos</h2>

              <div style={styles.chipsRow}>
                <span style={styles.chip}>JUSP S.A.S.</span>
                <span style={styles.chip}>Protección de datos</span>
                <span style={styles.chip}>Colombia</span>
              </div>

              <p style={styles.summaryText}>
                JUSP usa la información necesaria para operar pedidos, atender al cliente, proteger la
                plataforma y mejorar el servicio. El usuario puede ejercer sus derechos a través del
                canal oficial de privacidad.
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
              <h2 id="responsable" style={styles.sectionTitle}>
                1. Responsable del tratamiento
              </h2>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Razón social</div>
                  <div style={styles.infoValue}>JUSP CLUB INTERNACIONAL S.A.S.</div>
                  <div style={styles.infoSub}>Nombre comercial: JUSP S.A.S.</div>
                  <div style={styles.infoSub}>NIT: 902044152</div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Contacto oficial</div>
                  <div style={styles.infoValue}>DIRECTOR@JUSPCO.COM</div>
                  <div style={styles.infoSub}>País: Colombia</div>
                  <div style={styles.infoSub}>Dominio: juspco.com</div>
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
                      if (section.id === "canales" && index === 0) {
                        return (
                          <p key={`${section.id}-${index}`} style={styles.paragraph}>
                            El canal oficial para solicitudes relacionadas con privacidad, protección
                            de datos y ejercicio de derechos es{" "}
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

                {section.bullets?.length ? (
                  <ul style={styles.bulletsList}>
                    {section.bullets.map((bullet) => (
                      <li key={bullet} style={styles.bulletItem}>
                        <span style={styles.bulletDot} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.cards?.length ? (
                  <div style={styles.cardsGrid}>
                    {section.cards.map((card) => (
                      <div key={card.title} style={styles.miniCard}>
                        <div style={styles.miniCardTitle}>{card.title}</div>
                        <div style={styles.miniCardText}>{card.description}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.id === "datos" ? (
                  <div style={styles.noteBox}>
                    <div style={styles.noteTitle}>Nota importante</div>
                    <p style={styles.noteText}>
                      JUSP no solicita datos sensibles salvo que sea estrictamente necesario y cuente
                      con la autorización expresa del titular, cuando legalmente aplique.
                    </p>
                  </div>
                ) : null}

                {section.id === "derechos" ? (
                  <div style={styles.noteBox}>
                    <div style={styles.noteTitle}>Cómo ejercer tus derechos</div>
                    <p style={styles.noteText}>
                      Envía tu solicitud a{" "}
                      <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.inlineLink}>
                        DIRECTOR@JUSPCO.COM
                      </a>{" "}
                      indicando: nombre completo, documento, descripción de la solicitud y medio de
                      respuesta.
                    </p>
                  </div>
                ) : null}
              </section>
            ))}

            <section style={styles.ctaCard}>
              <div style={styles.ctaEyebrow}>Transparencia real</div>
              <h3 style={styles.ctaTitle}>Tus datos son tuyos. Tú mandas.</h3>
              <p style={styles.ctaText}>
                Si necesitas consultar, actualizar, rectificar o solicitar la gestión de tus datos
                personales, usa el canal oficial de privacidad de JUSP.
              </p>

              <div style={styles.actions}>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  Solicitar gestión de datos
                </a>
                <Link href="/terms" style={styles.secondaryBtn}>
                  Términos
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
                <a href="#responsable" style={styles.tocItem}>
                  1. Responsable
                </a>
                <a href="#datos" style={styles.tocItem}>
                  2. Datos que recolectamos
                </a>
                <a href="#finalidades" style={styles.tocItem}>
                  3. Finalidades
                </a>
                <a href="#derechos" style={styles.tocItem}>
                  4. Derechos del titular
                </a>
                <a href="#canales" style={styles.tocItem}>
                  5. Canales y tiempos
                </a>
                <a href="#seguridad" style={styles.tocItem}>
                  6. Seguridad
                </a>
                <a href="#cookies" style={styles.tocItem}>
                  7. Cookies
                </a>
                <a href="#vigencia" style={styles.tocItem}>
                  8. Vigencia
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
              <div style={styles.sidebarEyebrow}>Relación con términos</div>
              <p style={styles.noteText}>
                Esta política complementa los{" "}
                <Link href="/terms" style={styles.inlineLink}>
                  Términos y Condiciones
                </Link>{" "}
                de JUSP y debe interpretarse de forma coherente con ellos.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}