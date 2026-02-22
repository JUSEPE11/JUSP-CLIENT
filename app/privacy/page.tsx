/**
 * JUSP — Legal Pages (PRO MAX)
 * Brand tone: premium, minimal, high-contrast, trustworthy.
 * Company: JUSP S.A.S. — NIT: En trámite ante la DIAN — Domicilio: Cali, Colombia
 * Contacto: contacto@juspco.com — Dominio: juspco.com
 * Última actualización: 21 feb 2026
 */
export const metadata = {
  title: "Política de Privacidad | JUSP",
  description: "Política de tratamiento de datos personales de JUSP S.A.S. (Ley 1581 de 2012 - Colombia).",
};

const SECTIONS = [
  { id: "responsable", title: "Responsable" },
  { id: "datos", title: "Datos que recolectamos" },
  { id: "finalidades", title: "Finalidades" },
  { id: "derechos", title: "Derechos del titular" },
  { id: "canales", title: "Canales para solicitudes" },
  { id: "seguridad", title: "Seguridad" },
  { id: "cookies", title: "Cookies" },
  { id: "vigencia", title: "Vigencia" },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-sm">
      <div className="p-5 md:p-7">{children}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
      {children}
    </span>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28 text-xl md:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
      {children}
    </h2>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-zinc-200/60 blur-3xl dark:bg-white/10" />
        <div className="absolute -bottom-40 left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-zinc-100 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-12 md:py-16">
        <div className="mb-8 md:mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Privacidad</Badge>
            <Badge>Ley 1581/2012</Badge>
            <Badge>Últ. actualización: 21 feb 2026</Badge>
          </div>

          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
            Política de Tratamiento de Datos
          </h1>

          <p className="mt-4 max-w-3xl text-base md:text-lg leading-7 text-zinc-700 dark:text-zinc-300">
            Esta política describe cómo JUSP S.A.S. recolecta, usa y protege tus datos personales al usar juspco.com, de acuerdo con la normatividad colombiana aplicable.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          <div className="space-y-6">
            <Card>
              <SectionTitle id="responsable">1. Responsable del tratamiento</SectionTitle>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Razón social</div>
                  <div className="mt-1 text-base font-bold text-zinc-950 dark:text-white">JUSP S.A.S.</div>
                  <div className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">NIT: En trámite ante la DIAN</div>
                </div>
                <div className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Contacto</div>
                  <div className="mt-1 text-base font-bold text-zinc-950 dark:text-white">contacto@juspco.com</div>
                  <div className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">Cali, Colombia</div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle id="datos">2. Datos que recolectamos</SectionTitle>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />Identificación y contacto: nombre, documento, correo, teléfono.</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />Datos de envío: dirección, ciudad, referencias de entrega.</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />Datos transaccionales: historial de pedidos, estados y soporte.</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />Datos técnicos: IP, dispositivo, cookies y eventos para seguridad/antifraude.</li>
              </ul>
              <p className="mt-4 text-xs leading-6 text-zinc-600 dark:text-zinc-400">
                No solicitamos datos sensibles salvo que sea estrictamente necesario y con autorización expresa.
              </p>
            </Card>

            <Card>
              <SectionTitle id="finalidades">3. Finalidades</SectionTitle>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { t: "Gestión de pedidos", d: "Crear, procesar, enviar y dar seguimiento a compras gestionadas por intermediación." },
                  { t: "Atención al cliente", d: "Soporte, PQRS, garantías y comunicaciones sobre tu pedido." },
                  { t: "Seguridad", d: "Prevención de fraude, abuso, accesos no autorizados y mejoras de protección." },
                  { t: "Mejora de servicio", d: "Analítica interna para mejorar experiencia y desempeño de la plataforma." },
                ].map((x) => (
                  <div key={x.t} className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                    <div className="text-sm font-bold text-zinc-950 dark:text-white">{x.t}</div>
                    <div className="mt-1 text-xs leading-6 text-zinc-700 dark:text-zinc-300">{x.d}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle id="derechos">4. Derechos del titular</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Puedes ejercer tus derechos de conocer, actualizar, rectificar y solicitar supresión de tus datos, así como revocar la autorización, en los términos de la ley.
              </p>
              <div className="mt-4 rounded-xl border border-zinc-200/70 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-4">
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">Cómo solicitar</div>
                <p className="mt-1 text-xs leading-6 text-zinc-700 dark:text-zinc-300">
                  Envía tu solicitud a <span className="font-semibold">contacto@juspco.com</span> con: (i) nombre completo, (ii) documento, (iii) descripción de la solicitud y (iv) medio de respuesta.
                </p>
              </div>
            </Card>

            <Card>
              <SectionTitle id="canales">5. Canales y tiempos</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Canal oficial: <span className="font-semibold">contacto@juspco.com</span>. Tiempo objetivo de respuesta: <span className="font-semibold">1 a 2 días hábiles</span>.
              </p>
            </Card>

            <Card>
              <SectionTitle id="seguridad">6. Seguridad</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Aplicamos medidas técnicas y administrativas razonables para proteger la información contra acceso no autorizado, alteración, pérdida o uso indebido.
              </p>
            </Card>

            <Card>
              <SectionTitle id="cookies">7. Cookies</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Usamos cookies y tecnologías similares para autenticación, seguridad, preferencia de usuario y analítica interna.
                Puedes gestionar cookies desde tu navegador. Algunas cookies son necesarias para el funcionamiento.
              </p>
            </Card>

            <Card>
              <SectionTitle id="vigencia">8. Vigencia</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Esta política rige desde su publicación y podrá actualizarse. Cualquier cambio material será informado en la plataforma.
              </p>
            </Card>

            <div className="pb-8">
              <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-zinc-950 text-white px-6 py-6 md:px-8 md:py-7 shadow-sm">
                <div className="text-sm font-semibold">Transparencia real</div>
                <div className="mt-1 text-lg md:text-xl font-black tracking-tight">Tus datos son tuyos. Tú mandas.</div>
                <div className="mt-3">
                  <a href="mailto:contacto@juspco.com" className="inline-flex rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-bold hover:bg-zinc-100 transition">
                    Solicitar gestión de datos
                  </a>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-sm">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-zinc-950 dark:text-white">Contenido</div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">JUSP</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  {SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-white/10 transition"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
