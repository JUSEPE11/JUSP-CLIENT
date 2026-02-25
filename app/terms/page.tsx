/**
 * JUSP — Términos y Condiciones (PRO MAX REAL)
 * Company: JUSP S.A.S. — NIT: En trámite ante la DIAN
 * Domicilio: Cali, Colombia — Contacto: contacto@juspco.com — Dominio: juspco.com
 * Última actualización: 21 feb 2026
 */

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | JUSP",
  description:
    "Términos y condiciones de comercialización de JUSP S.A.S. para compras internacionales gestionadas con recepción logística en EE. UU. y envío a Colombia.",
};

const SECTIONS = [
  { id: "identificacion", title: "1. Identificación del comerciante" },
  { id: "objeto", title: "2. Objeto y aceptación" },
  { id: "naturaleza", title: "3. Naturaleza de la actividad" },
  { id: "proceso", title: "4. Proceso de compra" },
  { id: "precios", title: "5. Precios, pagos y validaciones" },
  { id: "envios", title: "6. Envíos, plazos y entrega" },
  { id: "aduana", title: "7. Aduana, inspecciones y retenciones" },
  { id: "retracto", title: "8. Retracto y devoluciones" },
  { id: "cambios", title: "9. Cambios por talla y defectos" },
  { id: "garantias", title: "10. Garantías" },
  { id: "responsabilidad", title: "11. Limitación de responsabilidad" },
  { id: "contracargos", title: "12. Contracargos, fraude y uso indebido" },
  { id: "propiedad", title: "13. Propiedad intelectual y marcas" },
  { id: "datos", title: "14. Protección de datos personales" },
  { id: "pqrs", title: "15. PQRS y soporte" },
  { id: "ley", title: "16. Ley aplicable y jurisdicción" },
];

function BgHelpLike() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-[#070709]" />

      {/* Warm top band like /help */}
      <div className="absolute left-0 right-0 top-[72px] h-[520px] bg-[radial-gradient(1200px_420px_at_20%_30%,rgba(250,204,21,0.22),transparent_62%),radial-gradient(900px_360px_at_72%_28%,rgba(255,255,255,0.08),transparent_64%),linear-gradient(to_bottom,rgba(0,0,0,0.0),rgba(0,0,0,0.72))]" />

      {/* Glows */}
      <div className="absolute -top-44 -left-48 h-[900px] w-[900px] rounded-full bg-yellow-300/14 blur-[180px]" />
      <div className="absolute -top-24 left-[18%] h-[760px] w-[760px] rounded-full bg-yellow-200/10 blur-[220px]" />
      <div className="absolute -bottom-72 -right-72 h-[980px] w-[980px] rounded-full bg-blue-500/10 blur-[240px]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.78))]" />
      <div className="absolute inset-0 shadow-[inset_0_0_260px_rgba(0,0,0,0.92)]" />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.09] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75 backdrop-blur-2xl">
      {children}
    </span>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-white/14 to-transparent" />;
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 text-xl md:text-2xl font-extrabold tracking-tight text-white/95"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm md:text-[15px] leading-7 text-white/70">{children}</p>;
}

function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-3 space-y-2 text-sm md:text-[15px] text-white/70">{children}</ul>;
}

function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.7)]" />
      <span>{children}</span>
    </li>
  );
}

function CTAButton({
  href,
  children,
  variant,
}: {
  href: string;
  children: ReactNode;
  variant: "primary" | "ghost";
}) {
  if (variant === "primary") {
    return (
      <a
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black hover:scale-[1.02] active:scale-[0.98] transition"
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur-2xl hover:bg-white/10 hover:border-white/25 transition"
    >
      {children}
    </a>
  );
}

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <BgHelpLike />

      <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge>
            <span className="h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.75)]" />
            JUSP · Legal
          </Badge>
          <Badge>Colombia</Badge>
          <Badge>Últ. actualización: 21 feb 2026</Badge>
        </div>

        {/* Hero */}
        <h1 className="mt-8 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
          Términos y Condiciones
          <span className="block mt-2 text-white/70">
            Claros. Serios. Sin letra pequeña.
          </span>
        </h1>

        <p className="mt-5 max-w-3xl text-base md:text-lg leading-relaxed text-white/70">
          Este documento regula el uso de <span className="font-semibold text-white/90">juspco.com</span> y las compras
          gestionadas por <span className="font-semibold text-white/90">JUSP S.A.S.</span> (en adelante, “JUSP”).
        </p>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap gap-3">
          <CTAButton href="javascript:window.print()" variant="ghost">
            Imprimir / Guardar PDF
          </CTAButton>
          <CTAButton href="mailto:contacto@juspco.com" variant="primary">
            Contactar soporte
          </CTAButton>
          <Link
            href="/help"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur-2xl hover:bg-white/10 hover:border-white/25 transition"
          >
            Centro de ayuda →
          </Link>
        </div>

        <div className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          {/* Main */}
          <div className="space-y-6">
            {/* Summary card */}
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-[11px] text-yellow-100">
                  Operación cross-border
                </span>
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-white/70">
                  Wompi
                </span>
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-white/70">
                  Recepción en EE. UU. → Colombia
                </span>
              </div>

              <p className="mt-4 text-sm md:text-[15px] leading-7 text-white/70">
                <span className="font-semibold text-white/90">JUSP S.A.S.</span> (NIT: En trámite ante la DIAN),
                con domicilio en <span className="font-semibold text-white/90">Cali, Colombia</span>, canal oficial{" "}
                <span className="font-semibold text-white/90">contacto@juspco.com</span>.
              </p>

              <Divider />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-2xl p-5">
                  <div className="text-xs font-semibold text-white/60">Logística</div>
                  <div className="mt-1 text-base font-extrabold text-white/90">Recepción en EE. UU.</div>
                  <div className="mt-1 text-xs text-white/60">Consolidación y reenvío a Colombia.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-2xl p-5">
                  <div className="text-xs font-semibold text-white/60">Plazo estimado</div>
                  <div className="mt-1 text-base font-extrabold text-white/90">15 a 20 días hábiles</div>
                  <div className="mt-1 text-xs text-white/60">Sujeto a aduana, inspecciones y fuerza mayor.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-2xl p-5">
                  <div className="text-xs font-semibold text-white/60">Pago</div>
                  <div className="mt-1 text-base font-extrabold text-white/90">Wompi</div>
                  <div className="mt-1 text-xs text-white/60">El pedido inicia con pago aprobado.</div>
                </div>
              </div>
            </Card>

            {/* Sections */}
            <Card>
              <SectionTitle id="identificacion">1. Identificación del comerciante</SectionTitle>
              <P>
                JUSP S.A.S. es una sociedad comercial constituida conforme a las leyes de la República de Colombia, con
                domicilio en Cali, Colombia, identificada con NIT en trámite ante la Dirección de Impuestos y Aduanas
                Nacionales (DIAN), titular del sitio <span className="font-semibold text-white/90">juspco.com</span> y
                responsable de la comercialización de los productos ofrecidos en el sitio.
              </P>
            </Card>

            <Card>
              <SectionTitle id="objeto">2. Objeto y aceptación</SectionTitle>
              <P>
                Estos términos regulan el acceso, navegación y uso del sitio, así como las condiciones aplicables a la compra
                de productos ofrecidos por JUSP. Al acceder, navegar, registrarse o realizar una compra, el usuario declara
                haber leído, entendido y aceptado íntegramente estos términos.
              </P>
              <P>
                Si el usuario no está de acuerdo con el contenido de este documento, deberá abstenerse de utilizar el sitio y/o
                realizar compras a través del mismo.
              </P>
            </Card>

            <Card>
              <SectionTitle id="naturaleza">3. Naturaleza de la actividad</SectionTitle>
              <P>
                JUSP comercializa bienes adquiridos en el exterior. Para la ejecución del servicio, los productos pueden ser
                recibidos y gestionados en un centro logístico internacional (EE. UU.) y posteriormente enviados a Colombia.
              </P>
              <P>
                JUSP no actúa como distribuidor oficial, representante, franquiciado, licenciatario ni afiliado de las marcas
                exhibidas en el sitio, salvo que se indique expresamente lo contrario.
              </P>
            </Card>

            <Card>
              <SectionTitle id="proceso">4. Proceso de compra</SectionTitle>
              <P>
                El proceso de compra se entiende perfeccionado cuando el pago ha sido aprobado por la pasarela de pagos y JUSP
                confirma el pedido. El usuario se obliga a suministrar información veraz, completa y actualizada para la
                correcta ejecución del pedido (incluyendo, sin limitarse a, nombre, documento, dirección y datos de contacto).
              </P>
              <UL>
                <LI>
                  La disponibilidad final puede depender del proveedor en el exterior y/o inventario real al momento de la adquisición.
                </LI>
                <LI>
                  En caso de indisponibilidad, JUSP podrá ofrecer alternativas equivalentes o proceder con la devolución del dinero, según corresponda.
                </LI>
              </UL>
            </Card>

            <Card>
              <SectionTitle id="precios">5. Precios, pagos y validaciones</SectionTitle>
              <P>
                Los precios publicados corresponden al valor total estimado a pagar por el usuario e incluyen los componentes
                aplicables al producto, gestión y logística. El pago se procesa a través de{" "}
                <span className="font-semibold text-white/90">Wompi</span>.
              </P>
              <P>
                El pedido inicia únicamente una vez el pago sea aprobado. JUSP podrá implementar validaciones antifraude y de seguridad.
                En caso de indicios razonables de fraude, uso no autorizado, inconsistencias o riesgos de contracargo, JUSP podrá:
              </P>
              <UL>
                <LI>Solicitar verificación adicional.</LI>
                <LI>Suspender temporalmente el procesamiento.</LI>
                <LI>Cancelar el pedido y proceder con la devolución según validación del caso.</LI>
              </UL>
              <P>
                Considerando que actualmente JUSP no emite factura electrónica DIAN, JUSP podrá entregar al usuario el soporte de pago
                o documento equivalente conforme aplique a su operación.
              </P>
            </Card>

            <Card>
              <SectionTitle id="envios">6. Envíos, plazos y entrega</SectionTitle>
              <P>
                El plazo estimado de entrega es de <span className="font-semibold text-white/90">15 a 20 días hábiles</span> contados desde la confirmación del pago,
                sin perjuicio de eventos ajenos al control razonable de JUSP.
              </P>
              <P>
                El usuario es responsable de suministrar una dirección completa y correcta. Errores u omisiones pueden generar retrasos o costos adicionales.
              </P>
            </Card>

            <Card>
              <SectionTitle id="aduana">7. Aduana, inspecciones y retenciones</SectionTitle>
              <P>
                Los envíos internacionales pueden ser objeto de inspección, retención temporal o requerimientos por parte de autoridades aduaneras u otras
                entidades competentes. Dichas actuaciones son ajenas al control de JUSP y pueden afectar los tiempos estimados.
              </P>
              <P>
                En caso de <span className="font-semibold text-white/90">retención definitiva</span> por autoridad competente que impida la entrega del producto, JUSP
                procederá a gestionar la <span className="font-semibold text-white/90">devolución del dinero pagado</span>, una vez se cuente con la confirmación de la
                imposibilidad de entrega conforme a la información disponible.
              </P>
            </Card>

            <Card>
              <SectionTitle id="retracto">8. Retracto y devoluciones</SectionTitle>
              <P>
                El derecho de retracto se regirá por lo previsto en la Ley 1480 de 2011 y demás normas aplicables. En particular, podrá ejercerse dentro
                de los cinco (5) días hábiles siguientes a la entrega del bien, cuando resulte procedente y sin perjuicio de las excepciones legales.
              </P>
              <P>
                Para el trámite, el usuario deberá contactar a JUSP a través de{" "}
                <span className="font-semibold text-white/90">contacto@juspco.com</span>, identificando el pedido
                y aportando la información necesaria para la evaluación del caso.
              </P>
              <P>
                El usuario deberá conservar el producto en adecuadas condiciones. La procedencia del retracto y/o devolución podrá depender del estado del producto,
                empaque, accesorios, y demás condiciones verificables.
              </P>
            </Card>

            <Card>
              <SectionTitle id="cambios">9. Cambios por talla y defectos</SectionTitle>
              <P>JUSP gestionará cambios en los siguientes supuestos:</P>
              <UL>
                <LI>
                  <span className="font-semibold text-white/90">Defecto de fábrica comprobable</span>, sujeto a evidencia y validación.
                </LI>
                <LI>
                  <span className="font-semibold text-white/90">Cambio por talla</span>, el cual podrá requerir un tiempo de gestión estimado de hasta{" "}
                  <span className="font-semibold text-white/90">cuarenta y cinco (45) días</span>, sujeto a disponibilidad del proveedor y logística internacional.
                </LI>
              </UL>
              <P>El cambio por talla está sujeto a disponibilidad y condiciones del proveedor; JUSP no garantiza disponibilidad inmediata.</P>
            </Card>

            <Card>
              <SectionTitle id="garantias">10. Garantías</SectionTitle>
              <P>
                Las garantías sobre los productos serán canalizadas ante el proveedor o fabricante correspondiente, de acuerdo con las políticas aplicables y
                la naturaleza del producto. JUSP actuará como canal de gestión y soporte para la tramitación, sin asumir obligaciones adicionales a las previstas
                por el proveedor/fabricante y por la ley.
              </P>
            </Card>

            <Card>
              <SectionTitle id="responsabilidad">11. Limitación de responsabilidad</SectionTitle>
              <P>
                En la medida permitida por la ley, JUSP no será responsable por retrasos, pérdidas o afectaciones derivadas de eventos fuera de su control razonable,
                incluyendo, sin limitarse a, actuaciones de autoridades, aduana, inspecciones, clima, fuerza mayor, restricciones logísticas, o decisiones de terceros
                intervinientes en el transporte.
              </P>
            </Card>

            <Card>
              <SectionTitle id="contracargos">12. Contracargos, fraude y uso indebido</SectionTitle>
              <P>
                El usuario se obliga a no realizar conductas fraudulentas, suplantación de identidad, uso no autorizado de medios de pago o contracargos indebidos.
                JUSP podrá suspender cuentas, cancelar pedidos y adelantar las acciones legales correspondientes cuando identifique indicios razonables de fraude o abuso.
              </P>
              <UL>
                <LI>La activación de contracargos sin fundamento podrá generar bloqueo de cuenta y restricciones operativas.</LI>
                <LI>JUSP podrá conservar evidencia de transacciones y comunicaciones para soportar disputas ante entidades financieras.</LI>
              </UL>
            </Card>

            <Card>
              <SectionTitle id="propiedad">13. Propiedad intelectual y marcas</SectionTitle>
              <P>
                Las marcas, nombres comerciales, logotipos y demás signos distintivos de terceros pertenecen a sus respectivos titulares. Su mención o exhibición
                en el sitio no implica relación de afiliación, representación o distribución oficial con JUSP.
              </P>
            </Card>

            <Card>
              <SectionTitle id="datos">14. Protección de datos personales</SectionTitle>
              <P>
                El tratamiento de datos personales se regirá por la Política de Privacidad de JUSP y por la normativa aplicable en Colombia. Para más información,
                consulte{" "}
                <Link className="underline font-semibold text-white/90 hover:text-white transition" href="/privacy">
                  Política de Privacidad
                </Link>
                .
              </P>
            </Card>

            <Card>
              <SectionTitle id="pqrs">15. PQRS y soporte</SectionTitle>
              <P>
                Para peticiones, quejas, reclamos y solicitudes (PQRS), el usuario podrá comunicarse al correo{" "}
                <span className="font-semibold text-white/90">contacto@juspco.com</span>. El tiempo objetivo de respuesta es de 1 a 2 días hábiles, sin perjuicio de la complejidad del caso.
              </P>
            </Card>

            <Card>
              <SectionTitle id="ley">16. Ley aplicable y jurisdicción</SectionTitle>
              <P>
                Estos términos se rigen por la legislación colombiana. Cualquier controversia será sometida a las autoridades competentes de la República de Colombia.
              </P>
            </Card>

            {/* Help CTA */}
            <div className="pb-4">
              <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-2xl px-7 py-7 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
                <div className="text-sm font-semibold text-white/85">Canal oficial</div>
                <div className="mt-1 text-lg md:text-xl font-black tracking-tight text-white/95">
                  PQRS y soporte por escrito
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="mailto:contacto@juspco.com"
                    className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:scale-[1.02] active:scale-[0.98] transition"
                  >
                    contacto@juspco.com
                  </a>
                  <Link
                    href="/help"
                    className="rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-2xl hover:bg-white/10 hover:border-white/25 transition"
                  >
                    Centro de ayuda →
                  </Link>
                  <Link
                    href="/privacy"
                    className="rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-2xl hover:bg-white/10 hover:border-white/25 transition"
                  >
                    Privacidad →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar TOC */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-white/90">Contenido</div>
                  <span className="text-xs text-white/55">JUSP</span>
                </div>

                <div className="mt-4 space-y-1.5">
                  {SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-2xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-2xl p-5">
                  <div className="text-xs font-semibold text-white/60">Empresa</div>
                  <div className="mt-1 text-sm font-extrabold text-white/90">JUSP S.A.S.</div>
                  <div className="mt-1 text-xs text-white/65">NIT: En trámite ante la DIAN</div>
                  <div className="mt-1 text-xs text-white/65">Cali, Colombia</div>
                  <div className="mt-2 text-xs text-white/60">
                    Contacto: <span className="font-semibold text-white/85">contacto@juspco.com</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5">
                  <div className="text-xs font-semibold text-white/60">Nota</div>
                  <div className="mt-1 text-xs leading-6 text-white/65">
                    Este documento puede actualizarse. La versión vigente se publica en esta URL. Se recomienda conservar copia.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}