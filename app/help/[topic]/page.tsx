// app/help/[topic]/page.tsx
import Link from "next/link";
import type { CSSProperties } from "react";

type TopicSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type TopicData = {
  title: string;
  subtitle: string;
  intro: string;
  badge: string;
  summary: string;
  keyPoints: string[];
  sections: TopicSection[];
  related: Array<{ label: string; href: string }>;
};

const TOPIC_MAP: Record<string, TopicData> = {
  envio: {
    title: "Envío y entrega",
    subtitle: "claridad logística, sin humo ni promesas vacías",
    badge: "Ayuda · Envíos",
    intro:
      "Aquí te explicamos cómo se mueve tu pedido, qué esperar del proceso logístico y cuándo una demora sigue siendo normal dentro de una operación cross-border.",
    summary:
      "JUSP acompaña la gestión del pedido de principio a fin. Los tiempos y eventos pueden cambiar por etapas logísticas, operadores y validaciones externas.",
    keyPoints: ["Tracking por etapas", "Courier / operador", "Cross-border a Colombia"],
    sections: [
      {
        title: "Qué debes saber primero",
        bullets: [
          "Te mostramos el estado real del pedido, no una promesa artificial.",
          "En operaciones cross-border el tracking puede actualizarse por etapas y no de forma continua.",
          "Si tu pedido está dentro del plazo informado, normalmente sigue en curso regular.",
        ],
      },
      {
        title: "Cómo funciona el flujo",
        paragraphs: [
          "El pedido puede pasar por alistamiento, consolidación, tránsito internacional, validaciones intermedias y entrega final.",
          "Durante algunos tramos no siempre aparecen eventos nuevos, especialmente cuando el paquete cambia de operador o entra en una nueva fase logística.",
        ],
      },
      {
        title: "Cuándo sí debes preocuparte",
        bullets: [
          "Si el plazo informado ya fue superado ampliamente.",
          "Si existe una novedad confirmada por el operador.",
          "Si recibiste una alerta directa del equipo de soporte o del courier.",
        ],
      },
    ],
    related: [
      { label: "Política de Envíos", href: "/shipping" },
      { label: "Estado de mi pedido", href: "/help/estado" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
    ],
  },

  estado: {
    title: "Estado de mi pedido",
    subtitle: "seguimiento claro, sin adivinar qué está pasando",
    badge: "Ayuda · Tracking",
    intro:
      "Aquí te explicamos cómo leer el estado de tu pedido, qué significa cada etapa y cuándo una falta de movimiento visible sigue siendo normal dentro del flujo logístico.",
    summary:
      "El tracking no siempre se actualiza en tiempo real. En operaciones internacionales puede haber pausas visibles, cambios de operador y ventanas donde no aparecen eventos nuevos aunque el pedido siga avanzando.",
    keyPoints: ["Tracking real", "Estados del pedido", "Actualización por etapas"],
    sections: [
      {
        title: "Estados habituales del pedido",
        bullets: [
          "Confirmado: el pedido fue recibido y validado correctamente.",
          "En preparación: se está organizando, alistando o consolidando para el siguiente tramo.",
          "En tránsito: ya entró en movimiento logístico y puede cambiar de operador según la etapa.",
          "Entregado: el operador marcó la entrega final como completada.",
        ],
      },
      {
        title: "Qué significa si no ves movimiento",
        paragraphs: [
          "No siempre significa un problema. En muchos casos es simplemente una ventana de actualización del courier o un tramo donde el paquete sigue avanzando sin reflejar eventos públicos inmediatos.",
          "Esto pasa con frecuencia cuando el envío cambia de país, cambia de operador o entra a validaciones intermedias propias del flujo internacional.",
        ],
      },
      {
        title: "Cuándo un estado todavía es normal",
        bullets: [
          "Cuando el pedido sigue dentro del plazo estimado informado.",
          "Cuando el último evento visible coincide con una etapa logística razonable.",
          "Cuando no existe una alerta formal de incidencia o excepción real.",
        ],
      },
      {
        title: "Cuándo sí vale la pena abrir un caso",
        bullets: [
          "Si el pedido ya superó claramente el plazo informado sin explicación razonable.",
          "Si ves una incidencia explícita del operador como entrega fallida, dirección inválida o novedad de seguridad.",
          "Si la trazabilidad se contradice con la situación real del pedido y necesitas revisión formal.",
        ],
      },
      {
        title: "Qué tener a la mano antes de consultar",
        bullets: [
          "Correo con la confirmación del pedido.",
          "Código, referencia o número de guía si ya fue asignado.",
          "Capturas del estado visible si el caso requiere revisión formal.",
        ],
      },
    ],
    related: [
      { label: "Envío y entrega", href: "/help/envio" },
      { label: "Política de Envíos", href: "/shipping" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
    ],
  },

  cambios: {
    title: "Cambios",
    subtitle: "proceso claro, sujeto a disponibilidad real",
    badge: "Ayuda · Cambios",
    intro:
      "Aquí te explicamos cuándo puede aplicar un cambio, cómo se solicita y qué esperar del proceso dentro del modelo de intermediación de JUSP.",
    summary:
      "Los cambios no dependen solo de la intención del cliente, sino también de disponibilidad real, validación del caso y condiciones del proveedor.",
    keyPoints: ["Disponibilidad real", "Validación del caso", "Gestión acompañada"],
    sections: [
      {
        title: "Qué influye en un cambio",
        bullets: [
          "Disponibilidad actual del proveedor o de la referencia.",
          "Estado del producto y evidencia aportada.",
          "Naturaleza del caso: talla, referencia o condición especial.",
        ],
      },
      {
        title: "Cómo iniciar",
        paragraphs: [
          "Debes iniciar la solicitud por el canal oficial para que el caso quede documentado correctamente.",
          "Mientras más clara sea la evidencia, más rápido se puede orientar una respuesta útil.",
        ],
      },
      {
        title: "Importante",
        bullets: [
          "No todos los casos aplican automáticamente.",
          "El equipo te dirá el paso exacto según tu situación.",
          "Nunca improvises el envío del producto sin instrucciones oficiales.",
        ],
      },
    ],
    related: [
      { label: "Devoluciones y Garantías", href: "/returns" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
      { label: "Términos", href: "/terms" },
    ],
  },

  devoluciones: {
    title: "Devoluciones",
    subtitle: "sin enredos, pero con reglas reales",
    badge: "Ayuda · Devoluciones",
    intro:
      "Aquí te explicamos cuándo una devolución puede aplicar, qué excepciones existen y cómo documentar correctamente un caso.",
    summary:
      "Por la naturaleza cross-border, no todo funciona como una devolución local tradicional. La evaluación depende del caso, la evidencia y la política aplicable.",
    keyPoints: ["Cross-border", "Excepciones reales", "Proceso documentado"],
    sections: [
      {
        title: "Qué debes tener claro",
        bullets: [
          "No todos los productos o situaciones aplican para devolución automática.",
          "Las compras internacionales pueden tener condiciones distintas a una operación local.",
          "La evidencia del caso es clave para cualquier revisión seria.",
        ],
      },
      {
        title: "Cuándo sí vale la pena reportar",
        bullets: [
          "Producto con defecto visible o funcional.",
          "Error claro de referencia o contenido recibido.",
          "Incidencia documentada desde la entrega o apertura del paquete.",
        ],
      },
      {
        title: "Cómo se inicia",
        paragraphs: [
          "La forma correcta es abrir el caso por PQR para dejar trazabilidad, evidencia y contexto desde el principio.",
          "A partir de ahí, JUSP te guía sobre el camino aplicable según la política correspondiente.",
        ],
      },
    ],
    related: [
      { label: "Devoluciones y Garantías", href: "/returns" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
      { label: "Política de Envíos", href: "/shipping" },
    ],
  },

  pagos: {
    title: "Pagos",
    subtitle: "confirmación, seguridad y lectura correcta del cobro",
    badge: "Ayuda · Pagos",
    intro:
      "Aquí te explicamos cómo entender el estado de un pago, qué puede pasar entre la pasarela y el banco, y cuándo una novedad financiera requiere revisión real.",
    summary:
      "Un pago puede verse aprobado, en validación, retenido temporalmente o tardar en reflejarse según la pasarela, el banco emisor, los controles antifraude y los tiempos de conciliación.",
    keyPoints: ["Confirmación", "Seguridad", "Validación bancaria"],
    sections: [
      {
        title: "Qué significa que un pago esté confirmado",
        bullets: [
          "El registro entró correctamente al flujo y el pedido puede continuar según validaciones internas.",
          "La confirmación operativa no siempre ocurre exactamente al mismo segundo del débito bancario.",
          "La pasarela y el banco pueden tardar unos minutos o más en sincronizar el estado final.",
        ],
      },
      {
        title: "Qué puede pasar entre banco y pasarela",
        paragraphs: [
          "En algunos casos el banco deja una retención temporal, una validación antifraude o una revisión de seguridad antes de consolidar el resultado definitivo del pago.",
          "Eso significa que puedes ver un movimiento bancario mientras la confirmación operativa aún no aparece reflejada de inmediato en el flujo del pedido.",
        ],
      },
      {
        title: "Cuándo una demora todavía es normal",
        bullets: [
          "Cuando el banco está validando la transacción.",
          "Cuando la pasarela aún está conciliando el resultado.",
          "Cuando el cobro aparece, pero la confirmación del pedido no ha terminado de procesarse.",
        ],
      },
      {
        title: "Señales que sí requieren revisión",
        bullets: [
          "Cobro reflejado sin actualización razonable después de un tiempo prudente.",
          "Doble intento de cobro o percepción de duplicidad.",
          "Error visible entre lo pagado y lo mostrado en el pedido.",
          "Mensajes sospechosos o solicitudes de datos sensibles fuera de canales oficiales.",
        ],
      },
      {
        title: "Regla de seguridad",
        bullets: [
          "JUSP nunca te pedirá contraseñas, códigos OTP ni datos sensibles por chat improvisado.",
          "Si algo financiero te genera duda, valida primero por un canal formal.",
          "No compartas capturas con datos sensibles completos sin necesidad.",
        ],
      },
    ],
    related: [
      { label: "Política de Privacidad", href: "/privacy" },
      { label: "Términos", href: "/terms" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
    ],
  },

  pqr: {
    title: "PQR / Reclamos",
    subtitle: "el canal formal cuando toca resolver de verdad",
    badge: "Ayuda · PQR",
    intro:
      "Este es el canal correcto cuando tu caso necesita revisión formal, trazabilidad y una respuesta estructurada. No es un buzón decorativo: es el camino serio para documentar y resolver.",
    summary:
      "PQR sirve para dejar evidencia, contexto y seguimiento cuando una duda rápida ya no alcanza. Es la vía correcta para incidencias, reclamos, solicitudes formales y casos que requieren revisión real.",
    keyPoints: ["Canal oficial", "Trazabilidad", "Respuesta formal"],
    sections: [
      {
        title: "Cuándo usar PQR de verdad",
        bullets: [
          "Cuando existe una incidencia real con pedido, pago, entrega, producto o soporte.",
          "Cuando necesitas que el caso quede formalmente documentado.",
          "Cuando la situación requiere evidencia, seguimiento y una respuesta estructurada.",
        ],
      },
      {
        title: "Qué debes enviar para acelerar la gestión",
        bullets: [
          "Correo o medio de contacto usado en el pedido.",
          "Número, código o referencia si ya la tienes.",
          "Descripción clara de lo ocurrido, sin omitir contexto importante.",
          "Fotos, capturas, videos o evidencia cuando aplique.",
        ],
      },
      {
        title: "Qué puedes esperar después de abrirlo",
        paragraphs: [
          "Una respuesta con pasos claros, contexto y el camino aplicable según el tipo de caso. Si intervienen terceros, proveedores u operadores logísticos, se te informará con transparencia en lugar de dejarte en silencio.",
          "PQR no significa respuesta automática. Significa que tu caso entra a revisión formal y debe tener trazabilidad real dentro del sistema de soporte.",
        ],
      },
      {
        title: "Qué no conviene hacer",
        bullets: [
          "Enviar mensajes incompletos sin referencia ni contexto.",
          "Abrir varios casos iguales por diferentes canales al mismo tiempo.",
          "Mandar el producto o tomar acciones logísticas sin instrucciones oficiales.",
        ],
      },
      {
        title: "Regla práctica",
        bullets: [
          "Si el caso puede afectar dinero, entrega, garantía o confianza, usa PQR.",
          "Si solo es una duda rápida, primero revisa ayuda.",
          "Si después de ayuda sigues sin respuesta suficiente, PQR es el paso correcto.",
        ],
      },
    ],
    related: [
      { label: "Devoluciones", href: "/help/devoluciones" },
      { label: "Envío y entrega", href: "/help/envio" },
      { label: "Pagos", href: "/help/pagos" },
    ],
  },

  autenticidad: {
    title: "Autenticidad",
    subtitle: "confianza, control y criterio sobre el producto",
    badge: "Ayuda · Autenticidad",
    intro:
      "Aquí te explicamos cómo JUSP aborda la validación de originalidad, consistencia y control de calidad dentro de su operación. La confianza del cliente no se trata como un detalle menor.",
    summary:
      "La autenticidad no se resume a una sola frase. En JUSP implica criterio, revisión, consistencia del producto y una postura clara frente a la confianza del cliente.",
    keyPoints: ["Originalidad", "Control de calidad", "Confianza del cliente"],
    sections: [
      {
        title: "Qué priorizamos",
        bullets: [
          "Originalidad verificada según el contexto del producto y la operación.",
          "Consistencia entre lo ofrecido, lo gestionado y lo entregado.",
          "Control de calidad suficiente para reducir errores evitables y experiencias débiles.",
        ],
      },
      {
        title: "Qué significa control real",
        paragraphs: [
          "No basta con mostrar un producto bonito. La autenticidad y la calidad también se sostienen en detalles de consistencia, revisión y criterio operativo antes de considerar aceptable una entrega.",
          "La confianza del cliente se construye cuando el producto, la información y la experiencia postventa se comportan de manera coherente entre sí.",
        ],
      },
      {
        title: "Si algo no te convence",
        bullets: [
          "Debes reportarlo por el canal formal para que exista trazabilidad y revisión documentada.",
          "Mientras más clara sea la evidencia, más seria y precisa puede ser la evaluación.",
          "No se revisa con respuestas genéricas, sino con contexto y criterio.",
        ],
      },
      {
        title: "Nuestra postura",
        bullets: [
          "La confianza del cliente es parte del producto, no un extra.",
          "Una experiencia seria no termina cuando se paga.",
          "Si algo no cumple, se revisa por el camino correcto y con responsabilidad.",
        ],
      },
      {
        title: "Cuándo escalarlo",
        bullets: [
          "Cuando veas una inconsistencia real entre lo esperado y lo recibido.",
          "Cuando detectes un problema de calidad que comprometa la experiencia.",
          "Cuando necesites revisión formal con evidencia y seguimiento.",
        ],
      },
    ],
    related: [
      { label: "Devoluciones y Garantías", href: "/returns" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
      { label: "Términos", href: "/terms" },
    ],
  },

  crossborder: {
    title: "Cross-border (Colombia)",
    subtitle: "compras internacionales explicadas sin humo",
    badge: "Ayuda · Cross-border",
    intro:
      "Aquí te explicamos cómo funciona una operación cross-border B2C, por qué el tracking puede ir por etapas y qué variables externas pueden aparecer.",
    summary:
      "En compras internacionales hay cambios de operador, ventanas sin eventos y validaciones que no dependen siempre de una sola empresa. Lo importante es entender el flujo real.",
    keyPoints: ["B2C internacional", "Cambios de operador", "Tracking por etapas"],
    sections: [
      {
        title: "Qué es normal en cross-border",
        bullets: [
          "Ventanas sin movimiento visible en tracking.",
          "Actualizaciones agrupadas en lugar de eventos continuos.",
          "Cambios de operador entre tramos logísticos.",
        ],
      },
      {
        title: "Qué puede generar demora",
        bullets: [
          "Procesos aduaneros o validaciones intermedias.",
          "Alta demanda logística o congestión del operador.",
          "Eventos externos fuera del control directo del canal de venta.",
        ],
      },
      {
        title: "Lo importante",
        paragraphs: [
          "Que haya silencio temporal en tracking no significa automáticamente pérdida o problema crítico.",
          "JUSP debe acompañar con claridad real, no con promesas falsas ni respuestas vacías.",
        ],
      },
    ],
    related: [
      { label: "Política de Envíos", href: "/shipping" },
      { label: "Envío y entrega", href: "/help/envio" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
    ],
  },
};

const fallbackTopic: TopicData = {
  title: "Centro de ayuda",
  subtitle: "tema aún no publicado",
  badge: "Ayuda",
  intro:
    "Este tema todavía no está publicado. Vuelve al centro de ayuda y entra por una categoría disponible.",
  summary:
    "Si necesitas soporte inmediato, usa el canal oficial de PQR para dejar trazabilidad del caso.",
  keyPoints: ["Centro de ayuda", "Tema pendiente", "Soporte formal"],
  sections: [
    {
      title: "Qué puedes hacer ahora",
      bullets: [
        "Volver al centro de ayuda.",
        "Buscar una categoría publicada.",
        "Abrir un caso por PQR si se trata de una incidencia real.",
      ],
    },
  ],
  related: [
    { label: "Centro de ayuda", href: "/help" },
    { label: "PQR / Reclamos", href: "/help/pqr" },
    { label: "Términos", href: "/terms" },
  ],
};

const glass: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
  boxShadow: "0 30px 120px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const styles: Record<string, CSSProperties> = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 12% 10%, rgba(255,215,0,0.14), transparent 24%), radial-gradient(circle at 88% 18%, rgba(255,255,255,0.07), transparent 22%), linear-gradient(180deg, #050506 0%, #0a0b0e 34%, #0d1014 100%)",
    color: "#ffffff",
  },
  bgGlowA: {
    position: "absolute",
    top: 90,
    left: -140,
    width: 420,
    height: 420,
    borderRadius: 9999,
    background: "rgba(255, 208, 0, 0.12)",
    filter: "blur(110px)",
    pointerEvents: "none",
  },
  bgGlowB: {
    position: "absolute",
    top: 150,
    right: -160,
    width: 460,
    height: 460,
    borderRadius: 9999,
    background: "rgba(255,255,255,0.08)",
    filter: "blur(120px)",
    pointerEvents: "none",
  },
  bgGlowC: {
    position: "absolute",
    bottom: -180,
    left: "24%",
    width: 520,
    height: 520,
    borderRadius: 9999,
    background: "rgba(59,130,246,0.10)",
    filter: "blur(130px)",
    pointerEvents: "none",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    boxShadow: "inset 0 0 240px rgba(0,0,0,0.92)",
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1320,
    margin: "0 auto",
    padding: "24px 16px 72px",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  navGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  smallBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 9999,
    textDecoration: "none",
    color: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.02em",
  },
  heroCard: {
    ...glass,
    borderRadius: 34,
    padding: 28,
    overflow: "hidden",
  },
  pillsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "8px 14px",
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  pillAccent: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "8px 14px",
    borderRadius: 9999,
    border: "1px solid rgba(250,204,21,0.28)",
    background: "rgba(250,204,21,0.12)",
    color: "#fff4bf",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
    gap: 24,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    color: "#f5dc78",
    fontWeight: 900,
  },
  heroTitle: {
    margin: "12px 0 0",
    fontSize: "clamp(2.5rem, 5vw, 5rem)",
    lineHeight: 0.96,
    letterSpacing: "-0.06em",
    fontWeight: 1000,
    color: "#ffffff",
  },
  heroSubtitle: {
    display: "block",
    marginTop: 14,
    fontSize: "clamp(1rem, 2vw, 1.35rem)",
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    fontWeight: 800,
    color: "rgba(255,255,255,0.58)",
  },
  heroText: {
    marginTop: 24,
    maxWidth: 860,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.9,
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 26,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 16,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 900,
    color: "#111111",
    background: "#ffffff",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 14px 34px rgba(255,255,255,0.08)",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 16,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  summaryCard: {
    ...glass,
    borderRadius: 28,
    padding: 24,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)), linear-gradient(180deg, rgba(255,214,10,0.05), transparent 45%)",
  },
  summaryEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "rgba(255,255,255,0.48)",
    fontWeight: 900,
  },
  summaryTitle: {
    marginTop: 12,
    fontSize: 28,
    lineHeight: 1.06,
    letterSpacing: "-0.05em",
    fontWeight: 1000,
    color: "#ffffff",
  },
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "6px 12px",
    borderRadius: 9999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: 800,
  },
  summaryText: {
    marginTop: 18,
    color: "rgba(255,255,255,0.74)",
    fontSize: 14,
    lineHeight: 1.85,
    fontWeight: 600,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 340px",
    gap: 24,
    marginTop: 24,
  },
  mainCol: {
    display: "grid",
    gap: 18,
  },
  sectionCard: {
    ...glass,
    borderRadius: 28,
    padding: 26,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.08,
    letterSpacing: "-0.04em",
    color: "#ffffff",
    fontWeight: 1000,
  },
  paragraphStack: {
    display: "grid",
    gap: 14,
    marginTop: 16,
  },
  paragraph: {
    margin: 0,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.9,
    fontWeight: 600,
  },
  bulletsList: {
    listStyle: "none",
    padding: 0,
    margin: "18px 0 0",
    display: "grid",
    gap: 10,
  },
  bulletItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.85,
    fontWeight: 600,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    marginTop: 10,
    flex: "0 0 auto",
    background: "linear-gradient(180deg, #ffe36a, #ffcf24)",
    boxShadow: "0 0 18px rgba(255,214,10,0.65)",
  },
  ctaCard: {
    ...glass,
    borderRadius: 32,
    padding: 28,
    background:
      "radial-gradient(circle at top left, rgba(255,214,10,0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04))",
  },
  ctaEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "rgba(255,255,255,0.50)",
    fontWeight: 900,
  },
  ctaTitle: {
    margin: "10px 0 0",
    fontSize: 34,
    lineHeight: 1.04,
    letterSpacing: "-0.05em",
    color: "#ffffff",
    fontWeight: 1000,
  },
  ctaText: {
    marginTop: 16,
    maxWidth: 760,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 1.85,
    fontWeight: 600,
  },
  sidebar: {
    display: "grid",
    gap: 18,
    alignContent: "start",
    height: "fit-content",
    position: "sticky",
    top: 88,
  },
  sidebarCard: {
    ...glass,
    borderRadius: 26,
    padding: 20,
  },
  sidebarEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.48)",
    fontWeight: 900,
  },
  tocList: {
    display: "grid",
    gap: 8,
    marginTop: 14,
  },
  tocItem: {
    display: "block",
    padding: "11px 12px",
    borderRadius: 14,
    color: "rgba(255,255,255,0.80)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.03)",
  },
  noteText: {
    margin: "12px 0 0",
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 1.8,
    fontWeight: 600,
  },
  relatedLinks: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },
  relatedLink: {
    display: "block",
    padding: "12px 14px",
    borderRadius: 14,
    color: "rgba(255,255,255,0.88)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
  },
  inlineLink: {
    color: "#ffffff",
    fontWeight: 800,
    textDecoration: "none",
    borderBottom: "1px solid rgba(255,255,255,0.30)",
    paddingBottom: 1,
  },
};

export default async function HelpTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const key = (topic || "").toLowerCase();
  const data = TOPIC_MAP[key] ?? fallbackTopic;

  return (
    <main style={styles.page}>
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.bgGlowC} />
      <div style={styles.vignette} />

      <div style={styles.shell}>
        <div style={styles.topBar}>
          <div style={styles.navGroup}>
            <Link href="/help" style={styles.smallBtn}>
              ← Volver al Centro de ayuda
            </Link>
            <Link href="/" style={styles.smallBtn}>
              Inicio
            </Link>
          </div>
        </div>

        <section style={styles.heroCard}>
          <div style={styles.pillsRow}>
            <span style={styles.pill}>{data.badge}</span>
            <span style={styles.pill}>JUSP</span>
            <span style={styles.pillAccent}>Soporte claro</span>
          </div>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.eyebrow}>Centro de ayuda</div>

              <h1 style={styles.heroTitle}>
                {data.title}
                <span style={styles.heroSubtitle}>{data.subtitle}</span>
              </h1>

              <p style={styles.heroText}>{data.intro}</p>

              <div style={styles.actions}>
                <Link href="/help/pqr" style={styles.primaryBtn}>
                  Ir a PQR / Reclamos
                </Link>
                <Link href="/help" style={styles.secondaryBtn}>
                  Volver al centro de ayuda
                </Link>
                <Link href="/" style={styles.secondaryBtn}>
                  Inicio
                </Link>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryEyebrow}>Resumen rápido</div>
              <h2 style={styles.summaryTitle}>{data.title}</h2>

              <div style={styles.chipsRow}>
                {data.keyPoints.map((item) => (
                  <span key={item} style={styles.chip}>
                    {item}
                  </span>
                ))}
              </div>

              <p style={styles.summaryText}>{data.summary}</p>
            </div>
          </div>
        </section>

        <div style={styles.layout}>
          <div style={styles.mainCol}>
            {data.sections.map((section) => (
              <section key={section.title} style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>{section.title}</h2>

                {section.paragraphs?.length ? (
                  <div style={styles.paragraphStack}>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} style={styles.paragraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}

                {section.bullets?.length ? (
                  <ul style={styles.bulletsList}>
                    {section.bullets.map((bullet) => (
                      <li key={bullet} style={styles.bulletItem}>
                        <span style={styles.bulletDot} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section style={styles.ctaCard}>
              <div style={styles.ctaEyebrow}>Canal formal</div>
              <h3 style={styles.ctaTitle}>Si el caso requiere revisión, se documenta bien.</h3>
              <p style={styles.ctaText}>
                Cuando una duda rápida ya no es suficiente, el camino correcto es usar PQR para
                dejar trazabilidad, contexto y evidencia del caso.
              </p>

              <div style={styles.actions}>
                <Link href="/help/pqr" style={styles.primaryBtn}>
                  Abrir PQR / Reclamo
                </Link>
                <Link href="/terms" style={styles.secondaryBtn}>
                  Términos
                </Link>
                <Link href="/privacy" style={styles.secondaryBtn}>
                  Privacidad
                </Link>
              </div>
            </section>
          </div>

          <aside style={styles.sidebar}>
            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Accesos rápidos</div>
              <div style={styles.tocList}>
                <Link href="/help" style={styles.tocItem}>
                  Centro de ayuda
                </Link>
                <Link href="/help/pqr" style={styles.tocItem}>
                  PQR / Reclamos
                </Link>
                <Link href="/shipping" style={styles.tocItem}>
                  Política de Envíos
                </Link>
                <Link href="/returns" style={styles.tocItem}>
                  Devoluciones y garantías
                </Link>
              </div>
            </section>

            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Relacionado</div>
              <div style={styles.relatedLinks}>
                {data.related.map((item) => (
                  <Link key={item.href} href={item.href} style={styles.relatedLink}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>

            <section style={styles.sidebarCard}>
              <div style={styles.sidebarEyebrow}>Nota</div>
              <p style={styles.noteText}>
                Esta página resume orientación práctica. Para condiciones formales, prevalecen los{" "}
                <Link href="/terms" style={styles.inlineLink}>
                  Términos
                </Link>
                , la{" "}
                <Link href="/privacy" style={styles.inlineLink}>
                  Política de Privacidad
                </Link>
                , la política de{" "}
                <Link href="/shipping" style={styles.inlineLink}>
                  Envíos
                </Link>{" "}
                y la de{" "}
                <Link href="/returns" style={styles.inlineLink}>
                  Devoluciones y Garantías
                </Link>
                .
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}