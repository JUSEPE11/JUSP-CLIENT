// app/help/[topic]/page.tsx
import Link from "next/link";

const TOPIC_MAP: Record<string, { title: string; bullets: string[] }> = {
  envio: {
    title: "Envío y entrega",
    bullets: [
      "Te mostramos el estado real del pedido (no promesas).",
      "En cross‑border, el tracking puede actualizar por etapas.",
      "Si tu pedido está dentro del plazo informado, está en curso normal.",
    ],
  },
  estado: {
    title: "Estado de mi pedido",
    bullets: [
      "Revisa el email de confirmación y el código del pedido.",
      "Estados típicos: Confirmado → En preparación → En tránsito → Entregado.",
      "Si un estado no cambia, suele ser ventana de actualización del courier.",
    ],
  },
  cambios: {
    title: "Cambios",
    bullets: [
      "Los cambios dependen de disponibilidad de tallas/stock.",
      "Te guiamos por el canal oficial para dejar evidencia.",
      "Si aplica, te diremos el paso exacto a seguir.",
    ],
  },
  devoluciones: {
    title: "Devoluciones",
    bullets: [
      "Por la naturaleza cross‑border, pueden aplicar excepciones.",
      "Si el producto llega con defecto, lo resolvemos por garantía.",
      "Inicia el proceso por PQR para documentar el caso.",
    ],
  },
  pagos: {
    title: "Pagos",
    bullets: [
      "Te confirmamos el pago por email cuando entra el registro.",
      "Si tu banco retiene, puede tomar un tiempo en reflejar.",
      "Nunca pedimos datos sensibles por chat.",
    ],
  },
  pqr: {
    title: "PQR / Reclamos",
    bullets: [
      "Este es el canal oficial para solicitudes y reclamos.",
      "Describe el caso con tu email y código de pedido si lo tienes.",
      "Te respondemos con pasos claros y tiempos estimados.",
    ],
  },
  autenticidad: {
    title: "Autenticidad",
    bullets: [
      "Priorizamos originalidad verificada y control de calidad.",
      "Si algo no cumple, lo resolvemos por garantía.",
      "La confianza del cliente es parte del producto.",
    ],
  },
  crossborder: {
    title: "Cross‑border (Colombia)",
    bullets: [
      "Envíos B2C individuales; el tracking se actualiza por etapas.",
      "Puede haber ventanas sin eventos mientras el paquete cambia de operador.",
      "Te avisamos si hay una excepción real, no te dejamos solo.",
    ],
  },
};

export default async function HelpTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const key = (topic || "").toLowerCase();
  const data = TOPIC_MAP[key] ?? {
    title: "Centro de ayuda",
    bullets: ["Este tema aún no está publicado.", "Vuelve al centro de ayuda y elige una categoría."],
  };

  return (
    <main style={{ background: "#0b0b10", minHeight: "100vh", color: "white" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 18px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 18 }}>
          <Link
            href="/help"
            style={{
              textDecoration: "none",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              padding: "10px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            ← Volver al Centro de ayuda
          </Link>

          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              padding: "10px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            Inicio
          </Link>
        </div>

        <div
          style={{
            borderRadius: 26,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#f7c600", boxShadow: "0 0 0 6px rgba(247,198,0,0.15)" }} />
            <span style={{ fontSize: 12, letterSpacing: 0.6, color: "rgba(255,255,255,0.72)" }}>AYUDA</span>
          </div>

          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, fontWeight: 950, letterSpacing: -0.4 }}>{data.title}</h1>
          <p style={{ marginTop: 10, marginBottom: 18, color: "rgba(255,255,255,0.72)", maxWidth: 760 }}>
            Respuesta rápida. Si tu caso requiere revisión, entra a{" "}
            <Link href="/help/pqr" style={{ color: "#f7c600", textDecoration: "none", fontWeight: 900 }}>
              PQR / Reclamos
            </Link>
            .
          </p>

          <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>
            {data.bullets.map((b) => (
              <li key={b} style={{ marginBottom: 8 }}>
                {b}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/terms"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Términos
            </Link>
            <Link
              href="/privacy"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
