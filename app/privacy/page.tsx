export const metadata = {
  title: "Política de Privacidad | JUSP",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto w-full max-w-4xl px-6 py-14">
        <a href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Volver a JUSP
        </a>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Última actualización: 12/02/2026 · Contacto: 
          <a className="underline" href="mailto:contacto@juspco.com">
            contacto@juspco.com
          </a>
           · Operación: Colombia (persona natural, por ahora)
        </p>

        <div className="prose prose-zinc mt-8 max-w-none">
          <p>Esta Política describe cómo recolectamos, usamos y protegemos tus datos personales cuando visitas JUSP o realizas una compra.</p>
          <h2>1. Datos que recolectamos</h2>
          <ul><li>Identificación y contacto: nombre, correo, teléfono (si aplica).</li><li>Datos de entrega: dirección, ciudad y referencias.</li><li>Información de compra: productos, montos, estado del pedido.</li><li>Datos técnicos: IP aproximada, dispositivo/navegador, cookies (para seguridad y experiencia).</li></ul>
          <h2>2. Finalidades</h2>
          <ul><li>Procesar pedidos, pagos y envíos.</li><li>Atención al cliente y gestión de garantías por defectos.</li><li>Prevención de fraude/abuso y seguridad del sitio.</li><li>Envío de notificaciones (por ejemplo, drops/restocks) cuando tú lo solicitas.</li></ul>
          <h2>3. Base legal y cumplimiento</h2>
          <p>En Colombia aplican, entre otras, la Ley 1581 de 2012 y normas relacionadas sobre protección de datos. Tratamos tu información con confidencialidad y bajo principios de seguridad, finalidad y acceso restringido.</p>
          <h2>4. Compartición de datos</h2>
          <ul><li>Couriers y operadores logísticos (solo lo necesario para entregar).</li><li>Proveedores de pagos (solo lo necesario para procesar transacciones).</li><li>Proveedores tecnológicos (hosting/analítica/seguridad) bajo acuerdos de confidencialidad.</li></ul>
          <h2>5. Cookies</h2>
          <p>Usamos cookies para funcionamiento, seguridad y mejora de la experiencia. Puedes controlar cookies desde tu navegador; algunas son necesarias para que el sitio funcione correctamente.</p>
          <h2>6. Derechos del titular</h2>
          <ul><li>Conocer, actualizar y rectificar tus datos.</li><li>Solicitar prueba de la autorización otorgada (cuando aplique).</li><li>Revocar autorización y/o solicitar supresión cuando proceda.</li><li>Presentar quejas ante la SIC (Colombia) si consideras vulnerados tus derechos.</li></ul>
          <h2>7. Cómo contactarnos</h2>
          <p>Para solicitudes de datos personales escribe a contacto@juspco.com con el asunto “Datos personales” e incluye tu correo y detalle de la solicitud.</p>
        </div>

        <div className="mt-12 border-t pt-6 text-xs text-zinc-500">
          Este documento es informativo y no constituye asesoría legal. Si necesitas una revisión
          específica para tu caso, consulta un abogado en Colombia.
        </div>
      </div>
    </main>
  );
}
