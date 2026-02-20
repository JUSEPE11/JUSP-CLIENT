export const metadata = {
  title: "Política de Devoluciones | JUSP",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto w-full max-w-4xl px-6 py-14">
        <a href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Volver a JUSP
        </a>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Política de Devoluciones</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Última actualización: 12/02/2026 · Contacto: 
          <a className="underline" href="mailto:contacto@juspco.com">
            contacto@juspco.com
          </a>
           · Operación: Colombia (persona natural, por ahora)
        </p>

        <div className="prose prose-zinc mt-8 max-w-none">
          <p>Por el momento, JUSP acepta devoluciones únicamente por defectos de fábrica comprobables (no por gusto, talla o cambio de opinión).</p>
          <h2>1. Qué se considera “defecto”</h2>
          <ul><li>Fallas de fabricación (costuras rotas, pegado defectuoso, daños estructurales no atribuibles al uso).</li><li>Producto diferente al comprado (error de referencia), sujeto a verificación.</li></ul>
          <h2>2. Plazo para reportar</h2>
          <p>Debes reportar el defecto dentro de 48 horas después de recibir el producto, adjuntando fotos y descripción del problema.</p>
          <h2>3. Proceso</h2>
          <ol><li>Escríbenos a contacto@juspco.com con asunto “Garantía/Defecto” e incluye número de pedido y evidencia (fotos/video).</li><li>Validamos el caso y te indicamos pasos de devolución/inspección (si aplica).</li><li>Si se confirma el defecto, gestionamos: (a) reemplazo sujeto a stock, o (b) reembolso, según corresponda.</li></ol>
          <h2>4. Exclusiones</h2>
          <ul><li>Daños por uso inadecuado, lavado incorrecto o desgaste normal.</li><li>Detalles estéticos menores propios de producción/terminación sin afectar funcionamiento/uso.</li><li>Caja/embalaje con abolladuras menores por transporte (si el producto está intacto).</li></ul>
        </div>

        <div className="mt-12 border-t pt-6 text-xs text-zinc-500">
          Este documento es informativo y no constituye asesoría legal. Si necesitas una revisión
          específica para tu caso, consulta un abogado en Colombia.
        </div>
      </div>
    </main>
  );
}
