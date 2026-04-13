import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Devoluciones y Garantías | JUSP",
  description:
    "Política de devoluciones, retracto y garantías para compras internacionales gestionadas por intermediación a través de JUSP CLUB INTERNACIONAL S.A.S.",
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

const SUPPORT_EMAIL = "contacto@juspco.com";

const OPEN_CASE_SUBJECT = "Abrir caso | Devoluciones y Garantías | JUSP";
const OPEN_CASE_BODY = [
  "Hola JUSP, quiero abrir un caso.",
  "",
  "Número de pedido:",
  "Nombre completo:",
  "Correo de contacto:",
  "Teléfono:",
  "",
  "Tipo de caso:",
  "- Producto defectuoso",
  "- Daño en transporte",
  "- Error de referencia",
  "- Faltantes",
  "- Otro",
  "",
  "Descripción clara del caso:",
  "",
  "Fecha de entrega:",
  "",
  "Evidencia adjunta:",
  "- Fotos",
  "- Videos",
  "- Estado del empaque",
  "",
  "Quedo atento(a).",
].join("\n");

const OPEN_CASE_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  OPEN_CASE_SUBJECT
)}&body=${encodeURIComponent(OPEN_CASE_BODY)}`;

const OPEN_CASE_GMAIL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  SUPPORT_EMAIL
)}&su=${encodeURIComponent(OPEN_CASE_SUBJECT)}&body=${encodeURIComponent(OPEN_CASE_BODY)}`;

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
  reportBox: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 18,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.48)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  reportValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.25,
  },
  reportSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.68)",
    fontWeight: 600,
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
    id: "principios",
    title: "1. Principios",
    bullets: [
      "Transparencia: informamos lo que aplica, lo que no aplica y el alcance real de cada gestión.",
      "Acompañamiento: JUSP acompaña el caso y la comunicación durante el proceso.",
      "Evidencia: fotografías, videos y detalles claros aceleran la evaluación y la solución.",
    ],
  },
  {
    id: "plazos",
    title: "2. Plazos y reporte",
    paragraphs: [
      "Las novedades deben reportarse dentro de los 3 días calendario posteriores a la entrega del pedido.",
      "El reporte debe enviarse al canal oficial con número de pedido, descripción del caso y evidencia suficiente.",
    ],
  },
  {
    id: "casos",
    title: "3. Casos cubiertos",
    cards: [
      {
        title: "Producto defectuoso",
        description:
          "Fallas de fabricación evidentes, daños funcionales o defectos verificables según el caso.",
      },
      {
        title: "Daño en transporte",
        description:
          "Daños visibles atribuibles al transporte o manipulación logística, con evidencia suficiente.",
      },
      {
        title: "Error de referencia",
        description:
          "Entrega de talla, variante o modelo diferente al solicitado en el pedido confirmado.",
      },
      {
        title: "Faltantes",
        description:
          "Accesorios, componentes o elementos faltantes reportados con evidencia y contexto del empaque.",
      },
    ],
  },
  {
    id: "proceso",
    title: "4. Proceso",
    bullets: [
      "Abre el caso desde el botón oficial o escribe al canal oficial con número de pedido, descripción clara del caso y evidencia.",
      "JUSP revisa la incidencia y define el camino aplicable: reposición, devolución logística, nota crédito o gestión con proveedor/fabricante.",
      "Si se requiere devolución física, se compartirán instrucciones y condiciones según el proveedor y el operador logístico.",
    ],
  },
  {
    id: "costos",
    title: "5. Costos",
    paragraphs: [
      "Los costos logísticos pueden variar según la causa del caso, la decisión del proveedor, la naturaleza del producto y el operador involucrado.",
      "Cuando aplique un costo adicional o una cobertura parcial, JUSP lo informará antes de ejecutar el proceso.",
    ],
  },
  {
    id: "garantias",
    title: "6. Garantías",
    paragraphs: [
      "Las garantías se rigen por las condiciones del fabricante y/o proveedor, considerando la naturaleza internacional de la operación.",
      "JUSP acompaña la gestión, pero no sustituye ni reemplaza los términos del fabricante, del proveedor o de la garantía específica aplicable.",
    ],
  },
];

export default function ReturnsPage() {
  return (
    <main style={styles.page}>
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGlowC} />
      <div style={styles.vignette} />

      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.pillsRow}>
            <span style={styles.pill}>JUSP · Devoluciones</span>
            <span style={styles.pill}>Garantías</span>
            <span style={styles.pillAccent}>NIT 902044152</span>
            <span style={styles.pill}>Últ. actualización: 13 abr 2026</span>
          </div>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.eyebrow}>Postventa y soporte</div>

              <h1 style={styles.heroTitle}>
                Devoluciones y Garantías
                <span style={styles.heroSubtitle}>respuestas reales cuando algo falla</span>
              </h1>

              <p style={styles.heroText}>
                Esta política aplica a compras internacionales gestionadas por{" "}
                <strong style={styles.strong}>JUSP CLUB INTERNACIONAL S.A.S.</strong> como
                intermediario. Si algo no sale como debería, lo enfrentamos contigo. Evaluamos cada
                caso con evidencia real y definimos la mejor solución posible según el proveedor, el
                fabricante y la logística internacional involucrada.
              </p>

              <div style={styles.actions}>
                <a
                  href={OPEN_CASE_GMAIL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.primaryBtn}
                >
                  Abrir caso
                </a>
                <Link href="/shipping" style={styles.secondaryBtn}>
                  Ver envíos
                </Link>
                <Link href="/terms" style={styles.secondaryBtn}>
                  Ver términos
                </Link>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryEyebrow}>Resumen clave</div>
              <h2 style={styles.summaryTitle}>No estás solo si algo falla</h2>

              <div style={styles.chipsRow}>
                <span style={styles.chip}>Reporte en máximo 3 días</span>
                <span style={styles.chip}>Evidencia requerida</span>
                <span style={styles.chip}>Gestión acompañada</span>
              </div>

              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#ffe36a",
                }}
              >
                Autenticidad protegida: si no es original, aplican compensaciones según términos.
              </p>

              <p style={styles.summaryText}>
                Analizamos cada caso con evidencia real, te acompañamos en todo el proceso y
                ejecutamos la solución que corresponda según la situación.
              </p>

              <a href={OPEN_CASE_MAILTO} style={styles.mailLink}>
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>

        <div style={styles.layout}>
          <div style={styles.mainCol}>
            {sections.map((section) => (
              <section key={section.id} style={styles.sectionCard}>
                <h2 id={section.id} style={styles.sectionTitle}>
                  {section.title}
                </h2>

                {section.paragraphs?.length ? (
                  <div style={styles.paragraphStack}>
                    {section.paragraphs.map((paragraph, index) => {
                      if (section.id === "plazos" && index === 1) {
                        return (
                          <p key={`${section.id}-${index}`} style={styles.paragraph}>
                            El reporte debe enviarse al canal oficial{" "}
                            <a href={OPEN_CASE_MAILTO} style={styles.inlineLink}>
                              {SUPPORT_EMAIL}
                            </a>{" "}
                            con número de pedido, descripción del caso y evidencia suficiente.
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

                {section.id === "plazos" ? (
                  <div style={styles.noteBox}>
                    <div style={styles.noteTitle}>Tip PRO</div>
                    <p style={styles.noteText}>
                      Si el paquete llega con señales de apertura, manipulación o daño visible, toma
                      fotografías antes de abrirlo y conserva empaque, etiquetas y contenido tal como
                      fue recibido.
                    </p>
                  </div>
                ) : null}

                {section.id === "proceso" ? (
                  <div style={styles.noteBox}>
                    <div style={styles.noteTitle}>Cómo abrir el caso</div>
                    <p style={styles.noteText}>
                      Usa el botón <strong style={styles.strong}>Abrir caso</strong> para abrir Gmail
                      con la plantilla lista. Si no usas Gmail, también puedes escribir directamente a{" "}
                      <a href={OPEN_CASE_MAILTO} style={styles.inlineLink}>
                        {SUPPORT_EMAIL}
                      </a>
                      .
                    </p>
                  </div>
                ) : null}
              </section>
            ))}

            <section style={styles.ctaCard}>
              <div style={styles.ctaEyebrow}>Soporte real</div>
              <h3 style={styles.ctaTitle}>Si algo falla, actuamos contigo.</h3>
              <p style={styles.ctaText}>
                Si necesitas abrir un caso, comparte el número de pedido, una descripción clara y
                evidencia suficiente para acelerar la evaluación y la respuesta.
              </p>

              <div style={styles.actions}>
                <a
                  href={OPEN_CASE_GMAIL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.primaryBtn}
                >
                  Abrir caso
                </a>
                <Link href="/shipping" style={styles.secondaryBtn}>
                  Ver envíos
                </Link>
                <Link href="/terms" style={styles.secondaryBtn}>
                  Ver términos
                </Link>
              </div>
            </section>
          </div>

          <aside style={styles.sidebar}>
            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Contenido</div>
              <div style={styles.tocList}>
                <a href="#principios" style={styles.tocItem}>
                  1. Principios
                </a>
                <a href="#plazos" style={styles.tocItem}>
                  2. Plazos y reporte
                </a>
                <a href="#casos" style={styles.tocItem}>
                  3. Casos cubiertos
                </a>
                <a href="#proceso" style={styles.tocItem}>
                  4. Proceso
                </a>
                <a href="#costos" style={styles.tocItem}>
                  5. Costos
                </a>
                <a href="#garantias" style={styles.tocItem}>
                  6. Garantías
                </a>
              </div>

              <div style={styles.reportBox}>
                <div style={styles.reportLabel}>Reporte</div>
                <div style={styles.reportValue}>Dentro de máximo 3 días</div>
                <div style={styles.reportSub}>{SUPPORT_EMAIL}</div>
              </div>
            </section>

            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Empresa</div>
              <div style={styles.companyName}>JUSP CLUB INTERNACIONAL S.A.S.</div>
              <div style={styles.companyMeta}>Nombre comercial: JUSP S.A.S.</div>
              <div style={styles.companyMeta}>NIT: 902044152</div>
              <div style={styles.companyMeta}>País: Colombia</div>
              <a href={OPEN_CASE_MAILTO} style={styles.mailLink}>
                {SUPPORT_EMAIL}
              </a>
            </section>

            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Relación con otras políticas</div>
              <p style={styles.noteText}>
                Esta política debe leerse junto con{" "}
                <Link href="/shipping" style={styles.inlineLink}>
                  Envíos
                </Link>
                ,{" "}
                <Link href="/terms" style={styles.inlineLink}>
                  Términos
                </Link>{" "}
                y la{" "}
                <Link href="/privacy" style={styles.inlineLink}>
                  Política de Privacidad
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