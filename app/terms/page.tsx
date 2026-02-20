export const metadata = {
  title: "Términos y Condiciones | JUSP",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto w-full max-w-4xl px-6 py-14">
        <a href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Volver a JUSP
        </a>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Términos y Condiciones</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Última actualización: 12/02/2026 · Contacto: 
          <a className="underline" href="mailto:contacto@juspco.com">
            contacto@juspco.com
          </a>
           · Operación: Colombia (persona natural, por ahora)
        </p>

        <div className="prose prose-zinc mt-8 max-w-none">
          <p>Estos Términos y Condiciones regulan el acceso y uso del sitio web y servicios de JUSP (en adelante, “JUSP”, “nosotros”). Al navegar o realizar una compra, aceptas estos términos.</p>
          <h2>1. Quiénes somos</h2>
          <p>JUSP opera en Colombia como persona natural (por ahora). Ofrecemos curaduría y venta de ropa y calzado, incluyendo envíos cross‑border según disponibilidad.</p>
          <h2>2. Productos, stock y precios</h2>
          <ul><li>Los productos pueden ser de stock limitado (drops/restocks).</li><li>Las imágenes y descripciones buscan ser fieles; pueden existir variaciones menores de color o acabados.</li><li>Los precios pueden cambiar sin previo aviso; el precio válido es el confirmado en el checkout/orden.</li></ul>
          <h2>3. Pedidos y confirmación</h2>
          <ul><li>Al completar el pago (o pre‑pago si aplica), recibirás confirmación por correo.</li><li>Nos reservamos el derecho de rechazar/cancelar un pedido por sospecha de fraude, error evidente de precio o falta de stock. En ese caso, se reembolsa lo pagado.</li></ul>
          <h2>4. Envíos y entrega</h2>
          <p>Los tiempos de entrega son estimados y dependen del courier, aduanas y dirección del cliente. Consulta la Política de Envíos para detalles.</p>
          <h2>5. Cambios, devoluciones y garantía</h2>
          <p>Por ahora, aceptamos devoluciones únicamente por defectos de fábrica comprobables. Consulta la Política de Devoluciones para el procedimiento.</p>
          <h2>6. Responsabilidad</h2>
          <ul><li>JUSP no es responsable por demoras atribuibles a terceros (courier/aduana) ni por datos incorrectos suministrados por el cliente.</li><li>En ningún caso nuestra responsabilidad excederá el valor pagado por el pedido afectado, salvo normas obligatorias en Colombia.</li></ul>
          <h2>7. Propiedad intelectual</h2>
          <p>El contenido del sitio (marca, textos, diseño) pertenece a JUSP o a sus respectivos titulares. No está permitido su uso sin autorización.</p>
          <h2>8. Privacidad</h2>
          <p>El tratamiento de datos personales se rige por la Política de Privacidad.</p>
          <h2>9. Ley aplicable</h2>
          <p>Estos términos se interpretan conforme a las leyes de Colombia. Cualquier controversia se tramitará ante las autoridades competentes en Colombia.</p>
        </div>

        <div className="mt-12 border-t pt-6 text-xs text-zinc-500">
          Este documento es informativo y no constituye asesoría legal. Si necesitas una revisión
          específica para tu caso, consulta un abogado en Colombia.
        </div>
      </div>
    </main>
  );
}
