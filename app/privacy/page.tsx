import type { Metadata } from "next";
import Link from "next/link";

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

const pageCss = `
.privacyPage {
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
  background: rgba(59, 130, 246, 0.10);
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
  border: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  box-shadow: 0 30px 120px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04);
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
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.pillAccent {
  border: 1px solid rgba(250,204,21,0.28);
  background: rgba(250,204,21,0.12);
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
.sidebarEyebrow,
.infoLabel {
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
  font-size: clamp(2.6rem, 5vw, 5.3rem);
  line-height: 0.96;
  letter-spacing: -0.06em;
  font-weight: 1000;
  color: #ffffff;
}

.heroSubtitle {
  display: block;
  margin-top: 14px;
  font-size: clamp(1rem, 2vw, 1.45rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 800;
  color: rgba(255,255,255,0.58);
}

.heroText,
.paragraph,
.summaryText,
.ctaText,
.noteText,
.companyMeta,
.bulletItem,
.infoSub {
  color: rgba(255,255,255,0.74);
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
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.primaryBtn:hover,
.secondaryBtn:hover,
.tocItem:hover {
  transform: translateY(-1px);
}

.primaryBtn {
  color: #111111;
  background: #ffffff;
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: 0 14px 34px rgba(255,255,255,0.08);
}

.secondaryBtn {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.summaryCard {
  border-radius: 28px;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)),
    linear-gradient(180deg, rgba(255,214,10,0.05), transparent 45%);
}

.summaryEyebrow {
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.48);
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
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
  font-size: 12px;
  font-weight: 800;
}

.summaryText {
  margin-top: 18px;
  font-size: 14px;
  line-height: 1.85;
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
  border-bottom: 1px solid rgba(255,255,255,0.32);
  padding-bottom: 3px;
  word-break: break-word;
}

.inlineLink {
  border-bottom: 1px solid rgba(255,255,255,0.30);
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
  line-height: 1.85;
}

.bulletDot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  margin-top: 10px;
  flex: 0 0 auto;
  background: linear-gradient(180deg, #ffe36a, #ffcf24);
  box-shadow: 0 0 18px rgba(255,214,10,0.65);
}

.infoGrid,
.cardsGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.infoItem,
.miniCard,
.noteBox {
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  padding: 18px;
}

.infoLabel {
  color: rgba(255,255,255,0.48);
  letter-spacing: 0.08em;
}

.infoValue {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.25;
  word-break: break-word;
}

.infoSub {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255,255,255,0.68);
}

.miniCardTitle,
.noteTitle {
  font-size: 16px;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.3;
}

.miniCardText {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255,255,255,0.70);
  font-weight: 600;
}

.noteBox {
  margin-top: 18px;
}

.noteTitle {
  font-size: 15px;
}

.noteText {
  margin: 8px 0 0;
  color: rgba(255,255,255,0.72);
  font-size: 14px;
  line-height: 1.8;
}

.ctaCard {
  border-radius: 32px;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(255,214,10,0.08), transparent 28%),
    linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
}

.ctaEyebrow {
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.50);
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
  line-height: 1.85;
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
  color: rgba(255,255,255,0.48);
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
  color: rgba(255,255,255,0.80);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
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
  font-size: 14px;
  line-height: 1.7;
  font-weight: 700;
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
  .bulletItem,
  .infoSub {
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

  .infoGrid,
  .cardsGrid {
    grid-template-columns: 1fr;
  }

  .infoValue {
    font-size: 17px;
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

  .pill {
    min-height: 32px;
    padding: 7px 12px;
  }

  .chipsRow {
    gap: 7px;
  }

  .infoItem,
  .miniCard,
  .noteBox {
    padding: 16px;
  }
}

@media print {
  .bgGlow,
  .vignette,
  .sidebar,
  .actions {
    display: none !important;
  }

  .privacyPage {
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
  .layout,
  .infoGrid,
  .cardsGrid {
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
  .inlineLink,
  .infoLabel,
  .infoValue,
  .infoSub,
  .miniCardTitle,
  .miniCardText,
  .noteTitle {
    color: #111111 !important;
  }
}
`;

export default function PrivacyPage() {
  return (
    <main className="privacyPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="bgGlow bgGlowA" />
      <div className="bgGlow bgGlowB" />
      <div className="bgGlow bgGlowC" />
      <div className="vignette" />

      <div className="shell">
        <section className="glass heroCard">
          <div className="pillsRow">
            <span className="pill">JUSP · Privacidad</span>
            <span className="pill">Ley 1581 de 2012</span>
            <span className="pill pillAccent">NIT 902044152</span>
            <span className="pill">Últ. actualización: 07 mar 2026</span>
          </div>

          <div className="heroGrid">
            <div>
              <div className="eyebrow">Tratamiento de datos</div>

              <h1 className="heroTitle">
                Política de Privacidad
                <span className="heroSubtitle">transparencia real, protección real</span>
              </h1>

              <p className="heroText">
                Esta política describe cómo{" "}
                <strong className="strong">JUSP CLUB INTERNACIONAL S.A.S.</strong>, nombre comercial{" "}
                <strong className="strong">JUSP S.A.S.</strong>, recolecta, usa y protege datos
                personales al utilizar <strong className="strong">juspco.com</strong>, de acuerdo
                con la normatividad colombiana aplicable.
              </p>

              <div className="actions">
                <a href="mailto:DIRECTOR@JUSPCO.COM" className="primaryBtn">
                  Contacto de privacidad
                </a>
                <Link href="/terms" className="secondaryBtn">
                  Ver términos
                </Link>
                <a href="javascript:window.print()" className="secondaryBtn">
                  Imprimir / Guardar PDF
                </a>
              </div>
            </div>

            <div className="glass summaryCard">
              <div className="summaryEyebrow">Resumen clave</div>
              <h2 className="summaryTitle">Tus datos son tuyos</h2>

              <div className="chipsRow">
                <span className="chip">JUSP S.A.S.</span>
                <span className="chip">Protección de datos</span>
                <span className="chip">Colombia</span>
              </div>

              <p className="summaryText">
                JUSP usa la información necesaria para operar pedidos, atender al cliente, proteger
                la plataforma y mejorar el servicio. El usuario puede ejercer sus derechos a través
                del canal oficial de privacidad.
              </p>

              <a href="mailto:DIRECTOR@JUSPCO.COM" className="mailLink">
                DIRECTOR@JUSPCO.COM
              </a>
            </div>
          </div>
        </section>

        <div className="layout">
          <div className="mainCol">
            <section className="glass sectionCard">
              <h2 id="responsable" className="sectionTitle">
                1. Responsable del tratamiento
              </h2>

              <div className="infoGrid">
                <div className="infoItem">
                  <div className="infoLabel">Razón social</div>
                  <div className="infoValue">JUSP CLUB INTERNACIONAL S.A.S.</div>
                  <div className="infoSub">Nombre comercial: JUSP S.A.S.</div>
                  <div className="infoSub">NIT: 902044152</div>
                </div>

                <div className="infoItem">
                  <div className="infoLabel">Contacto oficial</div>
                  <div className="infoValue">DIRECTOR@JUSPCO.COM</div>
                  <div className="infoSub">País: Colombia</div>
                  <div className="infoSub">Dominio: juspco.com</div>
                </div>
              </div>
            </section>

            {sections.map((section) => (
              <section key={section.id} className="glass sectionCard">
                <h2 id={section.id} className="sectionTitle">
                  {section.title}
                </h2>

                {section.paragraphs?.length ? (
                  <div className="paragraphStack">
                    {section.paragraphs.map((paragraph, index) => {
                      if (section.id === "canales" && index === 0) {
                        return (
                          <p key={`${section.id}-${index}`} className="paragraph">
                            El canal oficial para solicitudes relacionadas con privacidad,
                            protección de datos y ejercicio de derechos es{" "}
                            <a href="mailto:DIRECTOR@JUSPCO.COM" className="inlineLink">
                              DIRECTOR@JUSPCO.COM
                            </a>
                            .
                          </p>
                        );
                      }

                      return (
                        <p key={`${section.id}-${index}`} className="paragraph">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="bulletsList">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="bulletItem">
                        <span className="bulletDot" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.cards?.length ? (
                  <div className="cardsGrid">
                    {section.cards.map((card) => (
                      <div key={card.title} className="miniCard">
                        <div className="miniCardTitle">{card.title}</div>
                        <div className="miniCardText">{card.description}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.id === "datos" ? (
                  <div className="noteBox">
                    <div className="noteTitle">Nota importante</div>
                    <p className="noteText">
                      JUSP no solicita datos sensibles salvo que sea estrictamente necesario y cuente
                      con la autorización expresa del titular, cuando legalmente aplique.
                    </p>
                  </div>
                ) : null}

                {section.id === "derechos" ? (
                  <div className="noteBox">
                    <div className="noteTitle">Cómo ejercer tus derechos</div>
                    <p className="noteText">
                      Envía tu solicitud a{" "}
                      <a href="mailto:DIRECTOR@JUSPCO.COM" className="inlineLink">
                        DIRECTOR@JUSPCO.COM
                      </a>{" "}
                      indicando: nombre completo, documento, descripción de la solicitud y medio de
                      respuesta.
                    </p>
                  </div>
                ) : null}
              </section>
            ))}

            <section className="glass ctaCard">
              <div className="ctaEyebrow">Transparencia real</div>
              <h3 className="ctaTitle">Tus datos son tuyos. Tú mandas.</h3>
              <p className="ctaText">
                Si necesitas consultar, actualizar, rectificar o solicitar la gestión de tus datos
                personales, usa el canal oficial de privacidad de JUSP.
              </p>

              <div className="actions">
                <a href="mailto:DIRECTOR@JUSPCO.COM" className="primaryBtn">
                  Solicitar gestión de datos
                </a>
                <Link href="/terms" className="secondaryBtn">
                  Términos
                </Link>
                <Link href="/help" className="secondaryBtn">
                  Centro de ayuda
                </Link>
              </div>
            </section>
          </div>

          <aside className="sidebar">
            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Contenido</div>
              <div className="tocList">
                <a href="#responsable" className="tocItem">
                  1. Responsable
                </a>
                <a href="#datos" className="tocItem">
                  2. Datos que recolectamos
                </a>
                <a href="#finalidades" className="tocItem">
                  3. Finalidades
                </a>
                <a href="#derechos" className="tocItem">
                  4. Derechos del titular
                </a>
                <a href="#canales" className="tocItem">
                  5. Canales y tiempos
                </a>
                <a href="#seguridad" className="tocItem">
                  6. Seguridad
                </a>
                <a href="#cookies" className="tocItem">
                  7. Cookies
                </a>
                <a href="#vigencia" className="tocItem">
                  8. Vigencia
                </a>
              </div>
            </section>

            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Empresa</div>
              <div className="companyName">JUSP CLUB INTERNACIONAL S.A.S.</div>
              <div className="companyMeta">Nombre comercial: JUSP S.A.S.</div>
              <div className="companyMeta">NIT: 902044152</div>
              <div className="companyMeta">País: Colombia</div>
              <a href="mailto:DIRECTOR@JUSPCO.COM" className="mailLink">
                DIRECTOR@JUSPCO.COM
              </a>
            </section>

            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Relación con términos</div>
              <p className="noteText">
                Esta política complementa los{" "}
                <Link href="/terms" className="inlineLink">
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