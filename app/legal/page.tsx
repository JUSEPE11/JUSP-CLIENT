export const metadata = {
  title: "Aviso legal | JUSP",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto w-full max-w-4xl px-6 py-14">
        <a href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Volver a JUSP
        </a>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Aviso legal</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Última actualización: 12/02/2026 · Contacto: 
          <a className="underline" href="mailto:contacto@juspco.com">
            contacto@juspco.com
          </a>
           · Operación: Colombia (persona natural, por ahora)
        </p>

        <div className="prose prose-zinc mt-8 max-w-none">
          <p>Este Aviso Legal contiene información general sobre el sitio web, limitaciones de responsabilidad y comunicaciones oficiales.</p>
          <h2>1. Identificación</h2>
          <p>Sitio: JUSP (juspco.com). Operación en Colombia como persona natural (por ahora). Contacto oficial: contacto@juspco.com.</p>
          <h2>2. Exactitud de la información</h2>
          <p>Trabajamos para mantener la información actualizada. Sin embargo, puede haber errores tipográficos, cambios de disponibilidad o ajustes de contenido sin previo aviso.</p>
          <h2>3. Enlaces externos</h2>
          <p>El sitio puede contener enlaces a terceros. JUSP no controla ni es responsable por contenidos o políticas de esos sitios.</p>
          <h2>4. Seguridad</h2>
          <p>Implementamos medidas razonables de seguridad; aun así, ningún sistema es 100% infalible. Reporta cualquier vulnerabilidad a contacto@juspco.com.</p>
          <h2>5. Comunicaciones</h2>
          <p>Las comunicaciones oficiales de JUSP se realizan desde el dominio @juspco.com. Desconfía de mensajes de otros dominios o que soliciten información sensible de forma inusual.</p>
        </div>

        <div className="mt-12 border-t pt-6 text-xs text-zinc-500">
          Este documento es informativo y no constituye asesoría legal. Si necesitas una revisión
          específica para tu caso, consulta un abogado en Colombia.
        </div>
      </div>
    </main>
  );
}
