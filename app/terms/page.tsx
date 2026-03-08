import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | JUSP",
  description:
    "Términos y condiciones de JUSP CLUB INTERNACIONAL S.A.S. para la intermediación en compras internacionales gestionadas a través de JUSP.",
};

type Section = {
  id: string;
  title: string;
  paragraphs: string[];
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
    fontSize: "clamp(2.6rem, 5vw, 5.6rem)",
    lineHeight: 0.96,
    letterSpacing: "-0.06em",
    fontWeight: 1000,
    color: "#ffffff",
  },
  heroSubtitle: {
    display: "block",
    marginTop: 14,
    fontSize: "clamp(1rem, 2vw, 1.55rem)",
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
  noteText: {
    margin: "12px 0 0",
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 1.8,
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
    id: "identificacion",
    title: "1. Identificación del comerciante",
    paragraphs: [
      "JUSP CLUB INTERNACIONAL S.A.S., nombre comercial JUSP S.A.S., identificada con NIT 902044152, es una sociedad constituida conforme a las leyes de la República de Colombia y titular del sitio juspco.com.",
      "Su canal legal oficial es DIRECTOR@JUSPCO.COM. Para efectos del sitio, JUSP actúa como intermediario en la gestión de compras internacionales.",
    ],
  },
  {
    id: "objeto",
    title: "2. Objeto y aceptación",
    paragraphs: [
      "Estos términos regulan el acceso, navegación y uso del sitio, así como las condiciones aplicables a la intermediación que JUSP presta respecto de productos ofrecidos por terceros.",
      "Al acceder, navegar, registrarse o realizar una solicitud de compra, el usuario declara haber leído, entendido y aceptado íntegramente estos términos.",
    ],
  },
  {
    id: "naturaleza",
    title: "3. Naturaleza de la actividad",
    paragraphs: [
      "JUSP actúa exclusivamente como intermediario en la gestión de compras internacionales entre clientes y proveedores externos.",
      "JUSP no actúa como fabricante, productor, distribuidor oficial, representante, franquiciado, licenciatario ni vendedor directo de las marcas o productos exhibidos en el sitio, salvo que se indique expresamente lo contrario.",
      "Los productos son gestionados con proveedores internacionales y pueden ser enviados directamente desde dichos proveedores u operadores logísticos al cliente final.",
    ],
  },
  {
    id: "proceso",
    title: "4. Proceso de compra",
    paragraphs: [
      "El proceso de compra se entiende perfeccionado cuando el pago ha sido aprobado por la pasarela correspondiente y JUSP confirma el pedido.",
      "El usuario se obliga a suministrar información veraz, completa y actualizada para la correcta ejecución del pedido.",
    ],
    bullets: [
      "La disponibilidad final puede depender del proveedor en el exterior y del inventario real al momento de la gestión.",
      "En caso de indisponibilidad, JUSP podrá ofrecer alternativas equivalentes o proceder con la devolución del dinero, según corresponda.",
    ],
  },
  {
    id: "precios",
    title: "5. Precios, pagos y validaciones",
    paragraphs: [
      "Los precios publicados corresponden al valor total estimado a pagar por el usuario e incluyen, según corresponda, los componentes del producto, gestión y logística.",
      "JUSP podrá implementar validaciones antifraude y de seguridad. En caso de indicios razonables de fraude, uso no autorizado, inconsistencias o riesgos de contracargo, JUSP podrá solicitar verificación adicional, suspender temporalmente el procesamiento o cancelar el pedido.",
    ],
  },
  {
    id: "envios",
    title: "6. Envíos, plazos y entrega",
    paragraphs: [
      "El plazo estimado de entrega es de 15 a 20 días hábiles contados desde la confirmación del pago, sin perjuicio de eventos ajenos al control razonable de JUSP.",
      "El usuario es responsable de suministrar una dirección completa y correcta. Errores u omisiones pueden generar retrasos o costos adicionales.",
    ],
  },
  {
    id: "aduana",
    title: "7. Aduana, inspecciones y retenciones",
    paragraphs: [
      "Los envíos internacionales pueden ser objeto de inspección, retención temporal o requerimientos por parte de autoridades aduaneras u otras entidades competentes. Dichas actuaciones son ajenas al control de JUSP.",
      "En caso de retención definitiva que impida la entrega del producto, JUSP procederá a gestionar la devolución del dinero pagado una vez exista confirmación suficiente de la imposibilidad de entrega.",
    ],
  },
  {
    id: "retracto",
    title: "8. Retracto y devoluciones",
    paragraphs: [
      "El derecho de retracto se regirá por lo previsto en la Ley 1480 de 2011 y demás normas aplicables en Colombia, cuando resulte procedente y sin perjuicio de las excepciones legales.",
      "Para iniciar un trámite, el usuario deberá contactar a JUSP a través de DIRECTOR@JUSPCO.COM.",
    ],
  },
  {
    id: "cambios",
    title: "9. Cambios por talla y defectos",
    paragraphs: [
      "JUSP gestionará cambios en los supuestos aplicables según evidencia, validación y disponibilidad.",
    ],
    bullets: [
      "Defecto de fábrica comprobable, sujeto a evidencia y validación.",
      "Cambio por talla, sujeto a disponibilidad del proveedor y a la logística internacional aplicable.",
    ],
  },
  {
    id: "garantias",
    title: "10. Garantías",
    paragraphs: [
      "Las garantías sobre los productos serán canalizadas ante el proveedor o fabricante correspondiente, de acuerdo con sus políticas, la naturaleza del producto y la ley aplicable.",
    ],
  },
  {
    id: "responsabilidad",
    title: "11. Limitación de responsabilidad",
    paragraphs: [
      "En la medida permitida por la ley, JUSP no será responsable por retrasos, pérdidas o afectaciones derivadas de eventos fuera de su control razonable, incluyendo actuaciones de autoridades, aduana, inspecciones, clima, fuerza mayor, restricciones logísticas o decisiones de terceros.",
    ],
  },
  {
    id: "contracargos",
    title: "12. Contracargos, fraude y uso indebido",
    paragraphs: [
      "El usuario se obliga a no realizar conductas fraudulentas, suplantación de identidad, uso no autorizado de medios de pago o contracargos indebidos.",
    ],
    bullets: [
      "JUSP podrá suspender cuentas o cancelar pedidos ante indicios razonables de fraude o abuso.",
      "La activación de contracargos sin fundamento podrá generar restricciones operativas.",
    ],
  },
  {
    id: "propiedad",
    title: "13. Propiedad intelectual y marcas",
    paragraphs: [
      "Las marcas, nombres comerciales, logotipos y demás signos distintivos de terceros pertenecen a sus respectivos titulares. Su exhibición en el sitio no implica afiliación, representación o distribución oficial con JUSP.",
    ],
  },
  {
    id: "datos",
    title: "14. Protección de datos personales",
    paragraphs: [
      "El tratamiento de datos personales se regirá por la Política de Privacidad de JUSP y por la normativa aplicable en Colombia.",
      "Consulta la Política de Privacidad.",
    ],
  },
  {
    id: "pqrs",
    title: "15. PQRS y soporte",
    paragraphs: [
      "Para peticiones, quejas, reclamos y solicitudes (PQRS), el usuario podrá comunicarse a través de DIRECTOR@JUSPCO.COM.",
      "El tiempo objetivo de respuesta es de 1 a 2 días hábiles, sin perjuicio de la complejidad del caso.",
    ],
  },
  {
    id: "ley",
    title: "16. Ley aplicable y jurisdicción",
    paragraphs: [
      "Estos términos se rigen por la legislación colombiana. Cualquier controversia será sometida a las autoridades competentes de la República de Colombia.",
    ],
  },
];

function renderParagraph(sectionId: string, text: string, index: number) {
  if (sectionId === "identificacion" && index === 0) {
    return (
      <p style={styles.paragraph}>
        <strong style={styles.strong}>JUSP CLUB INTERNACIONAL S.A.S.</strong>, nombre comercial{" "}
        <strong style={styles.strong}>JUSP S.A.S.</strong>, identificada con{" "}
        <strong style={styles.strong}>NIT 902044152</strong>, es una sociedad constituida conforme a
        las leyes de la República de Colombia y titular del sitio{" "}
        <strong style={styles.strong}>juspco.com</strong>.
      </p>
    );
  }

  if (sectionId === "identificacion" && index === 1) {
    return (
      <p style={styles.paragraph}>
        Su canal legal oficial es{" "}
        <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.inlineLink}>
          DIRECTOR@JUSPCO.COM
        </a>
        . Para efectos del sitio, JUSP actúa como intermediario en la gestión de compras
        internacionales.
      </p>
    );
  }

  if (sectionId === "retracto" && index === 1) {
    return (
      <p style={styles.paragraph}>
        Para iniciar un trámite, el usuario deberá contactar a JUSP a través de{" "}
        <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.inlineLink}>
          DIRECTOR@JUSPCO.COM
        </a>
        .
      </p>
    );
  }

  if (sectionId === "datos" && index === 1) {
    return (
      <p style={styles.paragraph}>
        Consulta la{" "}
        <Link href="/privacy" style={styles.inlineLink}>
          Política de Privacidad
        </Link>
        .
      </p>
    );
  }

  if (sectionId === "pqrs" && index === 0) {
    return (
      <p style={styles.paragraph}>
        Para peticiones, quejas, reclamos y solicitudes (PQRS), el usuario podrá comunicarse a
        través de{" "}
        <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.inlineLink}>
          DIRECTOR@JUSPCO.COM
        </a>
        .
      </p>
    );
  }

  return <p style={styles.paragraph}>{text}</p>;
}

export default function TermsPage() {
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
            <span style={styles.pill}>Colombia</span>
            <span style={styles.pillAccent}>NIT 902044152</span>
            <span style={styles.pill}>Últ. actualización: 07 mar 2026</span>
          </div>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.eyebrow}>Términos oficiales</div>

              <h1 style={styles.heroTitle}>
                Términos y Condiciones
                <span style={styles.heroSubtitle}>claros, serios y con presencia premium</span>
              </h1>

              <p style={styles.heroText}>
                Este documento regula el uso de <strong style={styles.strong}>juspco.com</strong> y
                las compras gestionadas por{" "}
                <strong style={styles.strong}>JUSP CLUB INTERNACIONAL S.A.S.</strong>, nombre
                comercial <strong style={styles.strong}>JUSP S.A.S.</strong>, identificada con{" "}
                <strong style={styles.strong}>NIT 902044152</strong>.
              </p>

              <div style={styles.actions}>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  Contacto legal
                </a>
                <a href="javascript:window.print()" style={styles.secondaryBtn}>
                  Imprimir / Guardar PDF
                </a>
                <Link href="/privacy" style={styles.secondaryBtn}>
                  Ver privacidad
                </Link>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryEyebrow}>Resumen legal</div>
              <h2 style={styles.summaryTitle}>Intermediación internacional</h2>

              <div style={styles.chipsRow}>
                <span style={styles.chip}>JUSP S.A.S.</span>
                <span style={styles.chip}>NIT 902044152</span>
                <span style={styles.chip}>No vendedor directo</span>
              </div>

              <p style={styles.summaryText}>
                JUSP actúa como intermediario en la gestión de compras internacionales entre clientes
                y proveedores globales. Los productos son enviados directamente desde proveedores
                internacionales al cliente final.
              </p>

              <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.mailLink}>
                DIRECTOR@JUSPCO.COM
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

                <div style={styles.paragraphStack}>
                  {section.paragraphs.map((paragraph, index) => (
                    <div key={`${section.id}-${index}`}>
                      {renderParagraph(section.id, paragraph, index)}
                    </div>
                  ))}
                </div>

                {section.bullets ? (
                  <ul style={styles.bulletsList}>
                    {section.bullets.map((bullet) => (
                      <li key={bullet} style={styles.bulletItem}>
                        <span style={styles.bulletDot} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section style={styles.ctaCard}>
              <div style={styles.ctaEyebrow}>Canal oficial</div>
              <h3 style={styles.ctaTitle}>PQRS y soporte por escrito</h3>
              <p style={styles.ctaText}>
                Para asuntos legales, soporte formal y comunicaciones oficiales relacionadas con el
                servicio de intermediación internacional de JUSP.
              </p>

              <div style={styles.actions}>
                <a href="mailto:DIRECTOR@JUSPCO.COM" style={styles.primaryBtn}>
                  DIRECTOR@JUSPCO.COM
                </a>
                <Link href="/help" style={styles.secondaryBtn}>
                  Centro de ayuda
                </Link>
                <Link href="/privacy" style={styles.secondaryBtn}>
                  Privacidad
                </Link>
              </div>
            </section>
          </div>

          <aside style={styles.sidebar}>
            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Contenido</div>
              <div style={styles.tocList}>
                {sections.map((item) => (
                  <a key={item.id} href={`#${item.id}`} style={styles.tocItem}>
                    {item.title}
                  </a>
                ))}
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
              <div style={styles.sidebarEyebrow}>Nota</div>
              <p style={styles.noteText}>
                Este documento puede actualizarse. La versión vigente será la publicada en esta URL.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}