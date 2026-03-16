import Link from "next/link";

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

const pageCss = `
.helpTopicPage {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 10%, rgba(255,215,0,0.14), transparent 24%),
    radial-gradient(circle at 88% 18%, rgba(255,255,255,0.07), transparent 22%),
    linear-gradient(180deg, #050506 0%, #0a0b0e 34%, #0d1014 100%);
  color: #ffffff;
}

.bgGlow {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  z-index: 0;
}

.bgGlowA {
  top: 90px;
  left: -140px;
  width: 420px;
  height: 420px;
  background: rgba(255, 208, 0, 0.12);
  filter: blur(110px);
}

.bgGlowB {
  top: 150px;
  right: -160px;
  width: 460px;
  height: 460px;
  background: rgba(255,255,255,0.08);
  filter: blur(120px);
}

.bgGlowC {
  bottom: -180px;
  left: 24%;
  width: 520px;
  height: 520px;
  background: rgba(59,130,246,0.10);
  filter: blur(130px);
}

.vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 240px rgba(0,0,0,0.92);
  pointer-events: none;
  z-index: 0;
}

.shell {
  position: relative;
  z-index: 1;
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 16px 72px;
}

.topBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.navGroup {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.glass {
  border: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  box-shadow: 0 30px 120px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.smallBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 9999px;
  text-decoration: none;
  color: rgba(255,255,255,0.88);
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.02em;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.smallBtn:hover,
.primaryBtn:hover,
.secondaryBtn:hover,
.tocItem:hover,
.relatedLink:hover {
  transform: translateY(-1px);
}

.heroCard {
  border-radius: 34px;
  padding: 28px;
  overflow: hidden;
}

.pillsRow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}

.pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.pillAccent {
  border: 1px solid rgba(250,204,21,0.28);
  background: rgba(250,204,21,0.12);
  color: #fff4bf;
}

.heroGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 24px;
  align-items: stretch;
}

.eyebrow,
.summaryEyebrow,
.ctaEyebrow,
.sidebarEyebrow {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 900;
}

.eyebrow {
  letter-spacing: 0.22em;
  color: #f5dc78;
}

.heroTitle {
  margin: 12px 0 0;
  font-size: clamp(2.5rem, 5vw, 5rem);
  line-height: 0.96;
  letter-spacing: -0.06em;
  font-weight: 1000;
  color: #ffffff;
}

.heroSubtitle {
  display: block;
  margin-top: 14px;
  font-size: clamp(1rem, 2vw, 1.35rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 800;
  color: rgba(255,255,255,0.58);
}

.heroText,
.paragraph,
.summaryText,
.ctaText,
.noteText,
.bulletItem {
  color: rgba(255,255,255,0.74);
  font-size: 15px;
  line-height: 1.9;
  font-weight: 600;
}

.heroText {
  margin-top: 24px;
  max-width: 860px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.primaryBtn,
.secondaryBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 16px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 900;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.primaryBtn {
  color: #111111;
  background: #ffffff;
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: 0 14px 34px rgba(255,255,255,0.08);
}

.secondaryBtn {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.summaryCard {
  border-radius: 28px;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)),
    linear-gradient(180deg, rgba(255,214,10,0.05), transparent 45%);
}

.summaryEyebrow {
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.48);
}

.summaryTitle {
  margin-top: 12px;
  font-size: 28px;
  line-height: 1.06;
  letter-spacing: -0.05em;
  font-weight: 1000;
  color: #ffffff;
  word-break: break-word;
}

.chipsRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
  font-size: 12px;
  font-weight: 800;
}

.summaryText {
  margin-top: 18px;
  font-size: 14px;
  line-height: 1.85;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  margin-top: 24px;
}

.mainCol {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.sectionCard {
  border-radius: 28px;
  padding: 26px;
}

.sectionTitle {
  margin: 0;
  font-size: 28px;
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: #ffffff;
  font-weight: 1000;
  word-break: break-word;
}

.paragraphStack {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.paragraph {
  margin: 0;
}

.bulletsList {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: grid;
  gap: 10px;
}

.bulletItem {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  line-height: 1.85;
}

.bulletDot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  margin-top: 10px;
  flex: 0 0 auto;
  background: linear-gradient(180deg, #ffe36a, #ffcf24);
  box-shadow: 0 0 18px rgba(255,214,10,0.65);
}

.ctaCard {
  border-radius: 32px;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(255,214,10,0.08), transparent 28%),
    linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
}

.ctaEyebrow {
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.50);
}

.ctaTitle {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.04;
  letter-spacing: -0.05em;
  color: #ffffff;
  font-weight: 1000;
  word-break: break-word;
}

.ctaText {
  margin-top: 16px;
  max-width: 760px;
  line-height: 1.85;
}

.sidebar {
  display: grid;
  gap: 18px;
  align-content: start;
  height: fit-content;
  position: sticky;
  top: 88px;
}

.sidebarCard {
  border-radius: 26px;
  padding: 20px;
}

.sidebarEyebrow {
  letter-spacing: 0.16em;
  color: rgba(255,255,255,0.48);
}

.tocList,
.relatedLinks {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.tocItem,
.relatedLink {
  display: block;
  padding: 11px 12px;
  border-radius: 14px;
  color: rgba(255,255,255,0.80);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.noteText {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.8;
}

.inlineLink {
  color: #ffffff;
  font-weight: 800;
  text-decoration: none;
  border-bottom: 1px solid rgba(255,255,255,0.30);
  padding-bottom: 1px;
}

@media (max-width: 1180px) {
  .heroGrid {
    grid-template-columns: 1fr;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    top: auto;
  }
}

@media (max-width: 767px) {
  .shell {
    padding: 16px 12px 56px;
  }

  .topBar {
    margin-bottom: 14px;
  }

  .navGroup {
    width: 100%;
  }

  .smallBtn {
    min-height: 40px;
    padding: 0 12px;
    font-size: 11px;
  }

  .heroCard,
  .summaryCard,
  .sectionCard,
  .ctaCard,
  .sidebarCard {
    border-radius: 24px;
  }

  .heroCard {
    padding: 18px;
  }

  .summaryCard,
  .sectionCard,
  .ctaCard,
  .sidebarCard {
    padding: 18px;
  }

  .pillsRow {
    gap: 8px;
    margin-bottom: 18px;
  }

  .pill,
  .pillAccent,
  .chip {
    font-size: 11px;
  }

  .heroTitle {
    font-size: clamp(2.2rem, 11vw, 3.4rem);
    line-height: 0.94;
    letter-spacing: -0.06em;
    word-break: break-word;
  }

  .heroSubtitle {
    margin-top: 12px;
    font-size: 1rem;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }

  .heroText,
  .paragraph,
  .summaryText,
  .ctaText,
  .noteText,
  .bulletItem {
    font-size: 14px;
    line-height: 1.75;
  }

  .summaryTitle,
  .sectionTitle,
  .ctaTitle {
    line-height: 1.04;
    letter-spacing: -0.04em;
  }

  .summaryTitle {
    font-size: 24px;
  }

  .sectionTitle {
    font-size: 24px;
  }

  .ctaTitle {
    font-size: 28px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .primaryBtn,
  .secondaryBtn {
    width: 100%;
    min-height: 46px;
    padding: 0 16px;
  }

  .tocItem,
  .relatedLink {
    font-size: 12px;
    line-height: 1.35;
  }

  .bgGlowA {
    top: 60px;
    left: -180px;
    width: 320px;
    height: 320px;
    filter: blur(95px);
  }

  .bgGlowB {
    top: 120px;
    right: -170px;
    width: 300px;
    height: 300px;
    filter: blur(95px);
  }

  .bgGlowC {
    bottom: -160px;
    left: 10%;
    width: 320px;
    height: 320px;
    filter: blur(100px);
  }

  .vignette {
    box-shadow: inset 0 0 140px rgba(0, 0, 0, 0.88);
  }
}

@media (max-width: 420px) {
  .heroCard,
  .summaryCard,
  .sectionCard,
  .ctaCard,
  .sidebarCard {
    padding: 16px;
    border-radius: 22px;
  }

  .heroTitle {
    font-size: clamp(2rem, 12vw, 2.7rem);
  }

  .summaryTitle,
  .sectionTitle {
    font-size: 22px;
  }

  .ctaTitle {
    font-size: 25px;
  }

  .pillsRow {
    gap: 7px;
  }

  .pill,
  .pillAccent {
    min-height: 32px;
    padding: 7px 12px;
  }

  .chipsRow {
    gap: 7px;
  }

  .smallBtn {
    width: 100%;
  }
}

@media print {
  .bgGlow,
  .vignette,
  .sidebar,
  .topBar,
  .actions {
    display: none !important;
  }

  .helpTopicPage {
    background: #ffffff !important;
    color: #111111 !important;
  }

  .shell {
    max-width: none;
    padding: 0;
  }

  .glass,
  .heroCard,
  .summaryCard,
  .sectionCard,
  .ctaCard {
    background: #ffffff !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: 1px solid #e5e7eb !important;
    color: #111111 !important;
  }

  .heroGrid,
  .layout {
    grid-template-columns: 1fr !important;
  }

  .heroTitle,
  .summaryTitle,
  .sectionTitle,
  .ctaTitle,
  .paragraph,
  .heroText,
  .summaryText,
  .ctaText,
  .noteText,
  .bulletItem,
  .eyebrow,
  .summaryEyebrow,
  .ctaEyebrow,
  .sidebarEyebrow,
  .pill,
  .pillAccent,
  .chip,
  .inlineLink,
  .smallBtn,
  .tocItem,
  .relatedLink {
    color: #111111 !important;
  }
}
`;

export default async function HelpTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const key = (topic || "").toLowerCase();
  const data = TOPIC_MAP[key] ?? fallbackTopic;

  return (
    <main className="helpTopicPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="bgGlow bgGlowA" />
      <div className="bgGlow bgGlowB" />
      <div className="bgGlow bgGlowC" />
      <div className="vignette" />

      <div className="shell">
        <div className="topBar">
          <div className="navGroup">
            <Link href="/help" className="smallBtn">
              ← Volver al Centro de ayuda
            </Link>
            <Link href="/" className="smallBtn">
              Inicio
            </Link>
          </div>
        </div>

        <section className="glass heroCard">
          <div className="pillsRow">
            <span className="pill">{data.badge}</span>
            <span className="pill">JUSP</span>
            <span className="pill pillAccent">Soporte claro</span>
          </div>

          <div className="heroGrid">
            <div>
              <div className="eyebrow">Centro de ayuda</div>

              <h1 className="heroTitle">
                {data.title}
                <span className="heroSubtitle">{data.subtitle}</span>
              </h1>

              <p className="heroText">{data.intro}</p>

              <div className="actions">
                <Link href="/help/pqr" className="primaryBtn">
                  Ir a PQR / Reclamos
                </Link>
                <Link href="/help" className="secondaryBtn">
                  Volver al centro de ayuda
                </Link>
                <Link href="/" className="secondaryBtn">
                  Inicio
                </Link>
              </div>
            </div>

            <div className="glass summaryCard">
              <div className="summaryEyebrow">Resumen rápido</div>
              <h2 className="summaryTitle">{data.title}</h2>

              <div className="chipsRow">
                {data.keyPoints.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>

              <p className="summaryText">{data.summary}</p>
            </div>
          </div>
        </section>

        <div className="layout">
          <div className="mainCol">
            {data.sections.map((section) => (
              <section key={section.title} className="glass sectionCard">
                <h2 className="sectionTitle">{section.title}</h2>

                {section.paragraphs?.length ? (
                  <div className="paragraphStack">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="paragraph">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="bulletsList">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="bulletItem">
                        <span className="bulletDot" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="glass ctaCard">
              <div className="ctaEyebrow">Canal formal</div>
              <h3 className="ctaTitle">Si el caso requiere revisión, se documenta bien.</h3>
              <p className="ctaText">
                Cuando una duda rápida ya no es suficiente, el camino correcto es usar PQR para
                dejar trazabilidad, contexto y evidencia del caso.
              </p>

              <div className="actions">
                <Link href="/help/pqr" className="primaryBtn">
                  Abrir PQR / Reclamo
                </Link>
                <Link href="/terms" className="secondaryBtn">
                  Términos
                </Link>
                <Link href="/privacy" className="secondaryBtn">
                  Privacidad
                </Link>
              </div>
            </section>
          </div>

          <aside className="sidebar">
            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Accesos rápidos</div>
              <div className="tocList">
                <Link href="/help" className="tocItem">
                  Centro de ayuda
                </Link>
                <Link href="/help/pqr" className="tocItem">
                  PQR / Reclamos
                </Link>
                <Link href="/shipping" className="tocItem">
                  Política de Envíos
                </Link>
                <Link href="/returns" className="tocItem">
                  Devoluciones y garantías
                </Link>
              </div>
            </section>

            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Relacionado</div>
              <div className="relatedLinks">
                {data.related.map((item) => (
                  <Link key={item.href} href={item.href} className="relatedLink">
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="glass sidebarCard">
              <div className="sidebarEyebrow">Nota</div>
              <p className="noteText">
                Esta página resume orientación práctica. Para condiciones formales, prevalecen los{" "}
                <Link href="/terms" className="inlineLink">
                  Términos
                </Link>
                , la{" "}
                <Link href="/privacy" className="inlineLink">
                  Política de Privacidad
                </Link>
                , la política de{" "}
                <Link href="/shipping" className="inlineLink">
                  Envíos
                </Link>{" "}
                y la de{" "}
                <Link href="/returns" className="inlineLink">
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