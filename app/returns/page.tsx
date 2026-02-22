/**
 * JUSP — Legal Pages (PRO MAX)
 * Brand tone: premium, minimal, high-contrast, trustworthy.
 * Company: JUSP S.A.S. — NIT: En trámite ante la DIAN — Domicilio: Cali, Colombia
 * Contacto: contacto@juspco.com — Dominio: juspco.com
 * Última actualización: 21 feb 2026
 */
export const metadata = {
  title: "Devoluciones y Garantías | JUSP",
  description: "Política de devoluciones, retracto y garantías para compras internacionales gestionadas por intermediación.",
};

const SECTIONS = [
  { id: "principios", title: "Principios" },
  { id: "plazos", title: "Plazos y reporte" },
  { id: "casos", title: "Casos cubiertos" },
  { id: "proceso", title: "Proceso" },
  { id: "costos", title: "Costos" },
  { id: "garantias", title: "Garantías" },
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

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-[-10rem] h-[40rem] w-[40rem] rounded-full bg-zinc-200/60 blur-3xl dark:bg-white/10" />
        <div className="absolute -bottom-40 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-zinc-100 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-12 md:py-16">
        <div className="mb-8 md:mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Devoluciones</Badge>
            <Badge>Garantías</Badge>
            <Badge>Últ. actualización: 21 feb 2026</Badge>
          </div>

          <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
            Devoluciones y Garantías
          </h1>

          <p className="mt-4 max-w-3xl text-base md:text-lg leading-7 text-zinc-700 dark:text-zinc-300">
            Esta política aplica a compras internacionales gestionadas por JUSP S.A.S. como intermediario. Por la naturaleza transfronteriza,
            algunas condiciones dependen del proveedor/fabricante y del operador logístico.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          <div className="space-y-6">
            <Card>
              <SectionTitle id="principios">1. Principios</SectionTitle>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />Transparencia: te decimos lo que aplica y lo que no.</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />Acompañamiento: gestionamos el caso contigo.</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />Evidencia: fotos y detalles aceleran la solución.</li>
              </ul>
            </Card>

            <Card>
              <SectionTitle id="plazos">2. Plazos y reporte</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Debes reportar novedades dentro de <span className="font-semibold">3 días calendario</span> posteriores a la entrega a{" "}
                <span className="font-semibold">contacto@juspco.com</span>, indicando número de pedido y evidencia.
              </p>
              <div className="mt-4 rounded-xl border border-zinc-200/70 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-4">
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">Tip PRO</div>
                <p className="mt-1 text-xs leading-6 text-zinc-700 dark:text-zinc-300">
                  Si el paquete llega con señales de apertura/daño, toma fotos antes de abrirlo y conserva empaque y etiquetas.
                </p>
              </div>
            </Card>

            <Card>
              <SectionTitle id="casos">3. Casos cubiertos</SectionTitle>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { t: "Producto defectuoso", d: "Fallas de fabricación evidentes o no funcionalidad." },
                  { t: "Daño en transporte", d: "Daños visibles atribuibles al transporte (con evidencia)." },
                  { t: "Error de referencia", d: "Talla o modelo diferente al solicitado." },
                  { t: "Faltantes", d: "Accesorios o componentes faltantes reportados con evidencia." },
                ].map((x) => (
                  <div key={x.t} className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
                    <div className="text-sm font-bold text-zinc-950 dark:text-white">{x.t}</div>
                    <div className="mt-1 text-xs leading-6 text-zinc-700 dark:text-zinc-300">{x.d}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle id="proceso">4. Proceso</SectionTitle>
              <ol className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal pl-5">
                <li>Escribe a <span className="font-semibold">contacto@juspco.com</span> con número de pedido y evidencia.</li>
                <li>Revisamos el caso y definimos el camino (reposición, nota crédito, devolución logística o soporte de fabricante).</li>
                <li>Si se requiere devolución, te indicaremos instrucciones y condiciones según el operador/proveedor.</li>
              </ol>
            </Card>

            <Card>
              <SectionTitle id="costos">5. Costos</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Los costos logísticos pueden variar según causa y decisión del proveedor/courier. Cuando aplique, te lo informaremos antes de ejecutar el proceso.
              </p>
            </Card>

            <Card>
              <SectionTitle id="garantias">6. Garantías</SectionTitle>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                Las garantías se rigen por las condiciones del fabricante y/o proveedor, considerando la naturaleza internacional. JUSP S.A.S. acompaña la gestión,
                pero no sustituye los términos del fabricante.
              </p>
            </Card>

            <div className="pb-8">
              <div className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-zinc-950 text-white px-6 py-6 md:px-8 md:py-7 shadow-sm">
                <div className="text-sm font-semibold">Soporte real</div>
                <div className="mt-1 text-lg md:text-xl font-black tracking-tight">Si algo pasa, lo enfrentamos contigo.</div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a href="mailto:contacto@juspco.com" className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-bold hover:bg-zinc-100 transition">
                    Abrir caso
                  </a>
                  <a href="/shipping" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition">
                    Ver envíos
                  </a>
                  <a href="/terms" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition">
                    Ver términos
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

                <div className="mt-5 rounded-xl border border-zinc-200/70 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-4">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Reporte</div>
                  <div className="mt-1 text-sm font-bold text-zinc-950 dark:text-white">Dentro de 3 días</div>
                  <div className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">contacto@juspco.com</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
