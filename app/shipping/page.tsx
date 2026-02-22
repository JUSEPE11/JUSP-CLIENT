/**
 * JUSP — Legal Pages (PRO MAX)
 * Brand tone: premium, minimal, high-contrast, trustworthy.
 * Company: JUSP S.A.S. — NIT: En trámite ante la DIAN — Domicilio: Cali, Colombia
 * Contacto: contacto@juspco.com — Dominio: juspco.com
 * Última actualización: 21 feb 2026
 */
export const metadata = {
  title: "Política de Envíos | JUSP",
  description: "Política de envíos y tiempos estimados para compras internacionales gestionadas por intermediación.",
};

const SECTIONS = [
  { id: "resumen", title: "Resumen" },
  { id: "tiempos", title: "Tiempos" },
  { id: "seguimiento", title: "Seguimiento" },
  { id: "direccion", title: "Dirección" },
  { id: "eventos", title: "Eventos externos" },
  { id: "incidencias", title: "Incidencias" },
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

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 right-[-8rem] h-[40rem] w-[40rem] rounded-full bg-zinc-200/60 blur-3xl dark:bg-white/10" />
        <div className="absolute -bottom-40 left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-zinc-100 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-12 md:py-16">
        <div className="mb-8 md:mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Envíos</Badge>
            <Badge>Intermediación</Badge>
            <Badge>Últ. actualización: 21 feb 2026</Badge>
          </div>

          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
            Política de Envíos
          </h1>

          <p className="mt-4 max-w-3xl text-base md:text-lg leading-7 text-zinc-700 dark:text-zinc-300">
            Así operan los envíos de compras internacionales gestionadas por JUSP S.A.S. para Colombia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          <div className="space-y-6">
            <Card>
              <SectionTitle id="resumen">1. Resumen</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Los pedidos se gestionan mediante operadores logísticos (courier). El flujo incluye alistamiento, transporte internacional y entrega en Colombia.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tiempo estimado</div>
                  <div className="mt-1 text-base font-bold text-zinc-950 dark:text-white">15 a 20 días hábiles</div>
                </div>
                <div className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Destino</div>
                  <div className="mt-1 text-base font-bold text-zinc-950 dark:text-white">Colombia</div>
                </div>
                <div className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Soporte</div>
                  <div className="mt-1 text-base font-bold text-zinc-950 dark:text-white">contacto@juspco.com</div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle id="tiempos">2. Tiempos</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                El tiempo estimado de entrega es de <span className="font-semibold">15 a 20 días hábiles</span>, contado desde la confirmación del pago y validación del pedido.
                Es un estimado (no promesa fija) por variables externas.
              </p>
            </Card>

            <Card>
              <SectionTitle id="seguimiento">3. Seguimiento</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Cuando haya número de seguimiento disponible, se compartirá por los canales definidos en la plataforma. El tracking puede tardar en activarse según el operador.
              </p>
            </Card>

            <Card>
              <SectionTitle id="direccion">4. Dirección</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                El usuario debe suministrar una dirección correcta y completa. Errores u omisiones pueden generar devoluciones, retrasos o costos adicionales.
              </p>
            </Card>

            <Card>
              <SectionTitle id="eventos">5. Eventos externos</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Pueden presentarse demoras por inspecciones aduaneras, restricciones logísticas, clima, alta demanda o fuerza mayor. JUSP S.A.S. acompaña la gestión,
                pero no controla decisiones de terceros.
              </p>
            </Card>

            <Card>
              <SectionTitle id="incidencias">6. Incidencias</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Si detectas una incidencia (estado detenido, entrega fallida, daño), repórtalo dentro de 48 horas a <span className="font-semibold">contacto@juspco.com</span>
                con número de pedido y evidencia (fotos si aplica).
              </p>
            </Card>

            <div className="pb-8">
              <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-zinc-950 text-white px-6 py-6 md:px-8 md:py-7 shadow-sm">
                <div className="text-sm font-semibold">Seguimiento y soporte</div>
                <div className="mt-1 text-lg md:text-xl font-black tracking-tight">Tu pedido no va solo. Nosotros lo acompañamos.</div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a href="mailto:contacto@juspco.com" className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-bold hover:bg-zinc-100 transition">
                    Reportar incidencia
                  </a>
                  <a href="/returns" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition">
                    Ver devoluciones
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
