import type { Metadata } from "next";
import Link from "next/link";

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

const LEGAL_EMAIL = "contacto@juspco.com";
const LEGAL_GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  LEGAL_EMAIL
)}`;

const sections: Section[] = [
  {
    id: "identificacion",
    title: "1. Identificación del comerciante",
    paragraphs: [
      "JUSP CLUB INTERNACIONAL S.A.S., nombre comercial JUSP S.A.S., identificada con NIT 902044152, es una sociedad constituida conforme a las leyes de la República de Colombia y titular del sitio juspco.com.",
      "Su canal legal oficial es contacto@juspco.com. Para efectos del sitio, JUSP actúa como intermediario en la gestión de compras internacionales.",
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
      "Para iniciar un trámite, el usuario deberá contactar a JUSP a través de contacto@juspco.com.",
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
      "Para peticiones, quejas, reclamos y solicitudes (PQRS), el usuario podrá comunicarse a través de contacto@juspco.com.",
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

const pageCss = `
.termsPage {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 10%, rgba(255, 215, 0, 0.14), transparent 24%),
    radial-gradient(circle at 88% 18%, rgba(255, 255, 255, 0.07), transparent 22%),
    linear-gradient(180deg, #050506 0%, #0a0b0e 34%, #0d1014 100%);
  color: #ffffff;
}

.bgGlow {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  z-index: 0;
}

.bgGlowA {
  top: 90px;
  left: -140px;
  width: 420px;
  height: 420px;
  background: rgba(255, 208, 0, 0.12);
  filter: blur(110px);
}

.bgGlowB {
  top: 150px;
  right: -160px;
  width: 460px;
  height: 460px;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(120px);
}

.bgGlowC {
  bottom: -180px;
  left: 24%;
  width: 520px;
  height: 520px;
  background: rgba(59, 130, 246, 0.1);
  filter: blur(130px);
}

.vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 240px rgba(0, 0, 0, 0.92);
  pointer-events: none;
  z-index: 0;
}

.shell {
  position: relative;
  z-index: 1;
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 16px 72px;
}

.glass {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.03)
  );
  box-shadow:
    0 30px 120px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.heroCard {
  border-radius: 34px;
  padding: 28px;
  overflow: hidden;
}

.pillsRow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}

.pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.pillAccent {
  border: 1px solid rgba(250, 204, 21, 0.28);
  background: rgba(250, 204, 21, 0.12);
  color: #fff4bf;
}

.heroGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 24px;
  align-items: stretch;
}

.eyebrow,
.summaryEyebrow,
.ctaEyebrow,
.sidebarEyebrow {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 900;
}

.eyebrow {
  letter-spacing: 0.22em;
  color: #f5dc78;
}

.heroTitle {
  margin: 12px 0 0;
  font-size: clamp(2.8rem, 5vw, 5.6rem);
  line-height: 0.96;
  letter-spacing: -0.06em;
  font-weight: 1000;
  color: #ffffff;
}

.heroSubtitle {
  display: block;
  margin-top: 14px;
  font-size: clamp(1rem, 1.9vw, 1.55rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.58);
}

.heroText,
.paragraph,
.summaryText,
.ctaText,
.noteText,
.companyMeta,
.bulletItem {
  color: rgba(255, 255, 255, 0.74);
  font-size: 15px;
  line-height: 1.9;
  font-weight: 600;
}

.heroText {
  margin-top: 24px;
  max-width: 860px;
}

.strong {
  color: #ffffff;
  font-weight: 800;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.primaryBtn,
.secondaryBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 16px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 900;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.primaryBtn:hover,
.secondaryBtn:hover,
.tocItem:hover {
  transform: translateY(-1px);
}

.primaryBtn {
  color: #111111;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 14px 34px rgba(255, 255, 255, 0.08);
}

.secondaryBtn {
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.summaryCard {
  border-radius: 28px;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03)),
    linear-gradient(180deg, rgba(255, 214, 10, 0.05), transparent 45%);
}

.summaryEyebrow {
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.48);
}

.summaryTitle {
  margin-top: 12px;
  font-size: 30px;
  line-height: 1.04;
  letter-spacing: -0.05em;
  font-weight: 1000;
  color: #ffffff;
}

.chipsRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 800;
}

.summaryText {
  margin-top: 18px;
}

.mailLink,
.inlineLink {
  color: #ffffff;
  text-decoration: none;
  font-weight: 800;
}

.mailLink {
  display: inline-flex;
  margin-top: 18px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.32);
  padding-bottom: 3px;
  word-break: break-word;
}

.inlineLink {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 1px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  margin-top: 24px;
}

.mainCol {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.sectionCard {
  border-radius: 28px;
  padding: 26px;
}

.sectionTitle {
  margin: 0;
  font-size: 30px;
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: #ffffff;
  font-weight: 1000;
  scroll-margin-top: 110px;
}

.paragraphStack {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.paragraph {
  margin: 0;
}

.bulletsList {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: grid;
  gap: 10px;
}

.bulletItem {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.bulletDot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  margin-top: 10px;
  flex: 0 0 auto;
  background: linear-gradient(180deg, #ffe36a, #ffcf24);
  box-shadow: 0 0 18px rgba(255, 214, 10, 0.65);
}

.ctaCard {
  border-radius: 32px;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(255, 214, 10, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.04));
}

.ctaEyebrow {
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.5);
}

.ctaTitle {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.04;
  letter-spacing: -0.05em;
  color: #ffffff;
  font-weight: 1000;
}

.ctaText {
  margin-top: 16px;
  max-width: 760px;
}

.sidebar {
  display: grid;
  gap: 18px;
  align-content: start;
  height: fit-content;
  position: sticky;
  top: 88px;
}

.sidebarCard {
  border-radius: 26px;
  padding: 20px;
}

.sidebarEyebrow {
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.48);
}

.tocList {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.tocItem {
  display: block;
  padding: 11px 12px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.companyName {
  margin-top: 12px;
  font-size: 24px;
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: #ffffff;
  font-weight: 1000;
}

.companyMeta {
  margin-top: 8px;
  line-height: 1.7;
  font-weight: 700;
}

.noteText {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 1180px) {
  .heroGrid {
    grid-template-columns: 1fr;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    top: auto;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .shell {
    padding: 16px 12px 56px;
  }

  .heroCard,
  .summaryCard,
  .sectionCard,
  .ctaCard,
  .sidebarCard {
    border-radius: 24px;
  }

  .heroCard {
    padding: 18px;
  }

  .summaryCard,
  .sectionCard,
  .ctaCard,
  .sidebarCard {
    padding: 18px;
  }

  .pillsRow {
    gap: 8px;
    margin-bottom: 18px;
  }

  .pill,
  .pillAccent,
  .chip {
    font-size: 11px;
  }

  .heroTitle {
    font-size: clamp(2.2rem, 11vw, 3.4rem);
    line-height: 0.94;
    letter-spacing: -0.06em;
    word-break: break-word;
  }

  .heroSubtitle {
    margin-top: 12px;
    font-size: 1rem;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }

  .heroText,
  .paragraph,
  .summaryText,
  .ctaText,
  .noteText,
  .companyMeta,
  .bulletItem {
    font-size: 14px;
    line-height: 1.75;
  }

  .summaryTitle,
  .sectionTitle,
  .ctaTitle {
    line-height: 1.04;
    letter-spacing: -0.04em;
    word-break: break-word;
  }

  .summaryTitle {
    font-size: 24px;
  }

  .sectionTitle {
    font-size: 24px;
  }

  .ctaTitle {
    font-size: 28px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .primaryBtn,
  .secondaryBtn {
    width: 100%;
    min-height: 46px;
    padding: 0 16px;
  }

  .companyName {
    font-size: 20px;
  }

  .tocItem {
    font-size: 12px;
    line-height: 1.35;
  }

  .mailLink {
    font-size: 12px;
  }

  .bgGlowA {
    top: 60px;
    left: -180px;
    width: 320px;
    height: 320px;
    filter: blur(95px);
  }

  .bgGlowB {
    top: 120px;
    right: -170px;
    width: 300px;
    height: 300px;
    filter: blur(95px);
  }

  .bgGlowC {
    bottom: -160px;
    left: 10%;
    width: 320px;
    height: 320px;
    filter: blur(100px);
  }

  .vignette {
    box-shadow: inset 0 0 140px rgba(0, 0, 0, 0.88);
  }
}

@media (max-width: 420px) {
  .heroCard,
  .summaryCard,
  .sectionCard,
  .ctaCard,
  .sidebarCard {
    padding: 16px;
    border-radius: 22px;
  }

  .heroTitle {
    font-size: clamp(2rem, 12vw, 2.7rem);
  }

  .summaryTitle,
  .sectionTitle {
    font-size: 22px;
  }

  .ctaTitle {
    font-size: 25px;
  }

  .pillsRow {
    gap: 7px;
  }

  .pill,
  .pillAccent {
    min-height: 32px;
    padding: 7px 12px;
  }

  .chipsRow {
    gap: 7px;
  }
}

@media print {
  .bgGlow,
  .vignette,
  .sidebar,
  .actions {
    display: none !important;
  }

  .termsPage {
    background: #ffffff !important;
    color: #111111 !important;
  }

  .shell {
    max-width: none;
    padding: 0;
  }

  .glass,
  .heroCard,
  .summaryCard,
  .sectionCard,
  .ctaCard {
    background: #ffffff !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: 1px solid #e5e7eb !important;
    color: #111111 !important;
  }

  .heroGrid,
  .layout {
    grid-template-columns: 1fr !important;
  }

  .heroTitle,
  .summaryTitle,
  .sectionTitle,
  .ctaTitle,
  .companyName,
  .paragraph,
  .heroText,
  .summaryText,
  .ctaText,
  .noteText,
  .companyMeta,
  .bulletItem,
  .eyebrow,
  .summaryEyebrow,
  .ctaEyebrow,
  .sidebarEyebrow,
  .pill,
  .pillAccent,
  .chip,
  .mailLink,
  .inlineLink {
    color: #111111 !important;
  }
}
`;

function renderParagraph(sectionId: string, text: string, index: number) {
  if (sectionId === "identificacion" && index === 0) {
    return (
      <p className="paragraph">
        <strong className="strong">JUSP CLUB INTERNACIONAL S.A.S.</strong>, nombre comercial{" "}
        <strong className="strong">JUSP S.A.S.</strong>, identificada con{" "}
        <strong className="strong">NIT 902044152</strong>, es una sociedad constituida conforme a
        las leyes de la República de Colombia y titular del sitio{" "}
        <strong className="strong">juspco.com</strong>.
      </p>
    );
  }

  if (sectionId === "identificacion" && index === 1) {
    return (
      <p className="paragraph">
        Su canal legal oficial es{" "}
        <a href={`mailto:${LEGAL_EMAIL}`} className="inlineLink">
          {LEGAL_EMAIL}
        </a>
        . Para efectos del sitio, JUSP actúa como intermediario en la gestión de compras
        internacionales.
      </p>
    );
  }

  if (sectionId === "retracto" && index === 1) {
    return (
      <p className="paragraph">
        Para iniciar un trámite, el usuario deberá contactar a JUSP a través de{" "}
        <a href={`mailto:${LEGAL_EMAIL}`} className="inlineLink">
          {LEGAL_EMAIL}
        </a>
        .
      </p>
    );
  }

  if (sectionId === "datos" && index === 1) {
    return (
      <p className="paragraph">
        Consulta la{" "}
        <Link href="/privacy" className="inlineLink">
          Política de Privacidad
        </Link>
        .
      </p>
    );
  }

  if (sectionId === "pqrs" && index === 0) {
    return (
      <p className="paragraph">
        Para peticiones, quejas, reclamos y solicitudes (PQRS), el usuario podrá comunicarse a
        través de{" "}
        <a href={`mailto:${LEGAL_EMAIL}`} className="inlineLink">
          {LEGAL_EMAIL}
        </a>
        .
      </p>
    );
  }

  return <p className="paragraph">{text}</p>;
}

export default function TermsPage() {
  return (
    <main className="termsPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="bgGlow bgGlowA" />
      <div className="bgGlow bgGlowB" />
      <div className="bgGlow bgGlowC" />
      <div className="vignette" />

      <div className="shell">
        <section className="glass heroCard">
          <div className="pillsRow">
            <span className="pill">JUSP · Legal</span>
            <span className="pill">Colombia</span>
            <span className="pill pillAccent">NIT 902044152</span>
            <span className="pill">Últ. actualización: 13 abr 2026</span>
          </div>

          <div className="heroGrid">
            <div className="heroCol">
              <div className="eyebrow">Términos oficiales</div>

              <h1 className="heroTitle">
                Términos y Condiciones
                <span className="heroSubtitle">claridad legal para una compra internacional</span>
              </h1>

              <p className="heroText">
                Este documento regula el uso de <strong className="strong">juspco.com</strong> y las
                compras gestionadas por{" "}
                <strong className="strong">JUSP CLUB INTERNACIONAL S.A.S.</strong>, nombre comercial{" "}
                <strong className="strong">JUSP S.A.S.</strong>, identificada con{" "}
                <strong className="strong">NIT 902044152</strong>.
              </p>

              <div className="actions">
                <a
                  href={LEGAL_GMAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primaryBtn"
                >
                  Contacto legal
                </a>
                <Link href="/privacy" className="secondaryBtn">
                  Ver privacidad
                </Link>
              </div>
            </div>

            <div className="glass summaryCard">
              <div className="summaryEyebrow">Resumen legal</div>
              <h2 className="summaryTitle">Intermediación internacional</h2>

              <div className="chipsRow">
                <span className="chip">JUSP S.A.S.</span>
                <span className="chip">NIT 902044152</span>
                <span className="chip">No vendedor directo</span>
              </div>

              <p className="summaryText">
                JUSP actúa como intermediario en la gestión de compras internacionales entre clientes
                y proveedores globales. Los productos son enviados directamente desde proveedores
                internacionales al cliente final.
              </p>

              <a href={`mailto:${LEGAL_EMAIL}`} className="mailLink">
                {LEGAL_EMAIL}
              </a>
            </div>
          </div>
        </section>

        <div className="layout">
          <div className="mainCol">
            {sections.map((section) => (
              <section key={section.id} className="glass sectionCard">
                <h2 id={section.id} className="sectionTitle">
                  {section.title}
                </h2>

                <div className="paragraphStack">
                  {section.paragraphs.map((paragraph, index) => (
                    <div key={`${section.id}-${index}`}>
                      {renderParagraph(section.id, paragraph, index)}
                    </div>
                  ))}
                </div>

                {section.bullets ? (
                  <ul className="bulletsList">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="bulletItem">
                        <span className="bulletDot" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="glass ctaCard">
              <div className="ctaEyebrow">Canal oficial</div>
              <h3 className="ctaTitle">PQRS y soporte por escrito</h3>
              <p className="ctaText">
                Para asuntos legales, soporte formal y comunicaciones oficiales relacionadas con el
                servicio de intermediación internacional de JUSP.
              </p>

              <div className="actions">
                <a href={`mailto:${LEGAL_EMAIL}`} className="primaryBtn">
                  {LEGAL_EMAIL}
                </a>
                <Link href="/help" className="secondaryBtn">
                  Centro de ayuda
                </Link>
                <Link href="/privacy" className="secondaryBtn">
                  Privacidad
                </Link>
              </div>
            </section>
          </div>

          <aside className="sidebar">
            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Contenido</div>
              <div className="tocList">
                {sections.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="tocItem">
                    {item.title}
                  </a>
                ))}
              </div>
            </section>

            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Empresa</div>
              <div className="companyName">JUSP CLUB INTERNACIONAL S.A.S.</div>
              <div className="companyMeta">Nombre comercial: JUSP S.A.S.</div>
              <div className="companyMeta">NIT: 902044152</div>
              <div className="companyMeta">País: Colombia</div>
              <a href={`mailto:${LEGAL_EMAIL}`} className="mailLink">
                {LEGAL_EMAIL}
              </a>
            </section>

            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Nota</div>
              <p className="noteText">
                Este documento puede actualizarse. La versión vigente será la publicada en esta URL.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}