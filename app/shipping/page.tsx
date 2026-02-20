export const metadata = {
  title: "Política de Envíos | JUSP",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto w-full max-w-4xl px-6 py-14">
        <a href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Volver a JUSP
        </a>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Política de Envíos</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Última actualización: 12/02/2026 · Contacto: 
          <a className="underline" href="mailto:contacto@juspco.com">
            contacto@juspco.com
          </a>
           · Operación: Colombia (persona natural, por ahora)
        </p>

        <div className="prose prose-zinc mt-8 max-w-none">
          <p>Esta Política de Envíos explica cómo despachamos pedidos y qué puedes esperar en tiempos, seguimiento y posibles costos.</p>
          <h2>1. Cobertura</h2>
          <p>Operamos principalmente para entregas en Colombia. Algunos productos se envían cross‑border según disponibilidad.</p>
          <h2>2. Tiempos estimados</h2>
          <ul><li>Los tiempos son estimados y pueden variar por temporada, disponibilidad, courier y aduanas.</li><li>Cuando el producto es cross‑border, el tiempo suele ser mayor (ej. 10–20 días hábiles, dependiendo del carril logístico).</li></ul>
          <h2>3. Tracking</h2>
          <p>Al despachar, compartimos el número de guía por correo o en tu cuenta (si aplica). Puede tardar algunas horas en activarse en el sistema del courier.</p>
          <h2>4. Dirección y entrega</h2>
          <ul><li>Es responsabilidad del cliente ingresar una dirección completa y correcta.</li><li>Si el courier no logra entregar por datos incompletos o ausencia reiterada, pueden aplicarse re‑envíos o devoluciones, con costos asociados.</li></ul>
          <h2>5. Aduanas e impuestos</h2>
          <p>En envíos internacionales pueden existir inspecciones y/o cobros aduaneros según normatividad. Informamos con transparencia lo que aplique en tu compra; aun así, decisiones de autoridad aduanera están fuera de nuestro control.</p>
        </div>

        <div className="mt-12 border-t pt-6 text-xs text-zinc-500">
          Este documento es informativo y no constituye asesoría legal. Si necesitas una revisión
          específica para tu caso, consulta un abogado en Colombia.
        </div>
      </div>
    </main>
  );
}
