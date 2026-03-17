// app/orders/[id]/page.tsx
import type { CSSProperties } from "react";
import Link from "next/link";
import { cookies, headers } from "next/headers";

export const dynamic = "force-dynamic";

type StopStatus = "done" | "current" | "upcoming";

type OrderTrackingStop = {
  key: string;
  label: string;
  location: string;
  description?: string;
  date?: string | null;
  status: StopStatus;
};

type OrderData = {
  id: string;
  orderCode: string;
  status: string;
  statusLabel?: string;
  customerName: string;
  customerEmail: string;
  trackingCode: string;
  trackingUrl: string;
  courierName: string;
  etaLabel: string;
  shippingOrigin: "DALLAS" | "MIAMI";
  destinationCountry: string;
  destinationCity: string;
  destinationAddress: string;
  productTitle: string;
  productImage: string;
  progressPercent: number;
  healthLabel: string;
  healthTone: "green" | "yellow" | "red";
  lastUpdateLabel: string;
  timeline: OrderTrackingStop[];
};

type ApiPayload = {
  ok?: boolean;
  order?: Partial<OrderData> | null;
  raw?: Record<string, unknown> | null;
  error?: string;
};

function toStr(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatDateLabel(input?: string | null): string {
  if (!input) return "Actualizado recientemente";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Actualizado recientemente";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getOriginLabel(origin: "DALLAS" | "MIAMI"): string {
  return origin === "MIAMI" ? "Miami, Florida 🇺🇸" : "Dallas, Texas 🇺🇸";
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "ORDER_CONFIRMED":
      return "Pedido confirmado";
    case "PREPARING_ORDER":
      return "Preparando tu pedido";
    case "ARRIVED_DALLAS":
      return "En hub logístico (Dallas)";
    case "ARRIVED_MIAMI":
      return "En hub logístico (Miami)";
    case "HUB_RECEIVED":
      return "Recibido en hub logístico";
    case "INTERNATIONAL_TRANSIT":
      return "En camino a tu país";
    case "ARRIVED_COUNTRY":
      return "Llegó a tu país";
    case "CUSTOMS_CLEARANCE":
      return "En proceso aduanero";
    case "LOCAL_COURIER":
      return "En courier local";
    case "OUT_FOR_DELIVERY":
      return "En camino a tu dirección";
    case "DELIVERED":
      return "Entregado";
    case "DELAYED":
      return "Demora logística";
    default:
      return "Estado actualizado";
  }
}

function getProgressPercent(status: string): number {
  switch (status) {
    case "ORDER_CONFIRMED":
      return 10;
    case "PREPARING_ORDER":
      return 20;
    case "ARRIVED_DALLAS":
    case "ARRIVED_MIAMI":
    case "HUB_RECEIVED":
      return 38;
    case "INTERNATIONAL_TRANSIT":
      return 58;
    case "ARRIVED_COUNTRY":
    case "CUSTOMS_CLEARANCE":
    case "LOCAL_COURIER":
      return 76;
    case "OUT_FOR_DELIVERY":
      return 92;
    case "DELIVERED":
      return 100;
    case "DELAYED":
      return 64;
    default:
      return 18;
  }
}

function getHealthToneFromStatus(status: string): "green" | "yellow" | "red" {
  if (status === "DELAYED") return "yellow";
  return "green";
}

function getHealthLabelFromStatus(status: string): string {
  if (status === "DELAYED") return "Demora logística";
  if (status === "DELIVERED") return "Entregado correctamente";
  return "Normal";
}

function buildTimelineFromStatus(
  status: string,
  origin: "DALLAS" | "MIAMI",
  destinationCountry: string,
  destinationCity: string,
  destinationAddress: string
): OrderTrackingStop[] {
  const originLabel = origin === "MIAMI" ? "Miami, Florida 🇺🇸" : "Dallas, Texas 🇺🇸";

  const allStops: Array<Omit<OrderTrackingStop, "status"> & { activeFor: string[] }> = [
    {
      key: "confirmed",
      label: "Pedido confirmado",
      location: "JUSP",
      description: "Recibimos tu orden y comenzamos validación.",
      date: null,
      activeFor: [
        "ORDER_CONFIRMED",
        "PREPARING_ORDER",
        "ARRIVED_DALLAS",
        "ARRIVED_MIAMI",
        "HUB_RECEIVED",
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "preparing",
      label: "Preparando tu pedido",
      location: "Centro de procesamiento JUSP",
      description: "Confirmamos producto, compra y salida hacia hub.",
      date: null,
      activeFor: [
        "PREPARING_ORDER",
        "ARRIVED_DALLAS",
        "ARRIVED_MIAMI",
        "HUB_RECEIVED",
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "hub",
      label: origin === "MIAMI" ? "Recibido en hub JUSP Miami" : "Recibido en hub JUSP Dallas",
      location: originLabel,
      description: "Tu pedido ya está en el punto real de salida internacional.",
      date: null,
      activeFor: [
        "ARRIVED_DALLAS",
        "ARRIVED_MIAMI",
        "HUB_RECEIVED",
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "international",
      label: "En camino a tu país",
      location: `Ruta internacional → ${destinationCountry}`,
      description: "En tránsito desde el hub logístico hacia destino.",
      date: null,
      activeFor: [
        "INTERNATIONAL_TRANSIT",
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "country",
      label: "Llegó a tu país",
      location: destinationCountry,
      description: "Ingreso confirmado al país de destino.",
      date: null,
      activeFor: [
        "ARRIVED_COUNTRY",
        "CUSTOMS_CLEARANCE",
        "LOCAL_COURIER",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELAYED",
      ],
    },
    {
      key: "city",
      label: "En courier local",
      location: destinationCity || "Ciudad destino",
      description: "Última milla en preparación.",
      date: null,
      activeFor: ["LOCAL_COURIER", "OUT_FOR_DELIVERY", "DELIVERED", "DELAYED"],
    },
    {
      key: "address",
      label: "En camino a tu dirección",
      location: destinationAddress || "Dirección del cliente",
      description: "Entrega final hacia la dirección registrada.",
      date: null,
      activeFor: ["OUT_FOR_DELIVERY", "DELIVERED", "DELAYED"],
    },
    {
      key: "delivered",
      label: "Entregado",
      location: destinationAddress || "Dirección del cliente",
      description: "Pedido entregado correctamente.",
      date: null,
      activeFor: ["DELIVERED"],
    },
  ];

  const currentIndex = allStops.findIndex((stop) => stop.activeFor.includes(status));
  const normalizedCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  return allStops.map((stop, index) => {
    let mappedStatus: StopStatus = "upcoming";

    if (status === "DELIVERED") {
      mappedStatus = "done";
    } else if (index < normalizedCurrentIndex) {
      mappedStatus = "done";
    } else if (index === normalizedCurrentIndex) {
      mappedStatus = "current";
    }

    return {
      key: stop.key,
      label: stop.label,
      location: stop.location,
      description: stop.description,
      date: stop.date,
      status: mappedStatus,
    };
  });
}

function normalizeOrder(input?: Partial<OrderData> | null, orderId = ""): OrderData {
  const status = toStr(input?.status, "ORDER_CONFIRMED");
  const shippingOrigin = input?.shippingOrigin === "MIAMI" ? "MIAMI" : "DALLAS";
  const destinationCountry = toStr(input?.destinationCountry, "País destino");
  const destinationCity = toStr(input?.destinationCity, "Ciudad destino");
  const destinationAddress = toStr(input?.destinationAddress, "Dirección del cliente");
  const progressPercent =
    typeof input?.progressPercent === "number"
      ? clamp(input.progressPercent, 0, 100)
      : getProgressPercent(status);

  const timeline =
    Array.isArray(input?.timeline) && input.timeline.length > 0
      ? input.timeline.map((step) => ({
          key: toStr(step.key, "step"),
          label: toStr(step.label, "Paso"),
          location: toStr(step.location, ""),
          description: toStr(step.description, ""),
          date: step.date ?? null,
          status:
            step.status === "done" || step.status === "current" || step.status === "upcoming"
              ? step.status
              : "upcoming",
        }))
      : buildTimelineFromStatus(
          status,
          shippingOrigin,
          destinationCountry,
          destinationCity,
          destinationAddress
        );

  return {
    id: toStr(input?.id, orderId),
    orderCode: toStr(input?.orderCode, orderId ? `JUSP-${orderId}` : "JUSP"),
    status,
    statusLabel: toStr(input?.statusLabel, getStatusLabel(status)),
    customerName: toStr(input?.customerName, "Cliente JUSP"),
    customerEmail: toStr(input?.customerEmail, ""),
    trackingCode: toStr(input?.trackingCode, "Pendiente"),
    trackingUrl: toStr(input?.trackingUrl, ""),
    courierName: toStr(input?.courierName, "Courier internacional"),
    etaLabel: toStr(input?.etaLabel, "3-7 días hábiles"),
    shippingOrigin,
    destinationCountry,
    destinationCity,
    destinationAddress,
    productTitle: toStr(input?.productTitle, "Tu pedido JUSP"),
    productImage: toStr(input?.productImage, ""),
    progressPercent,
    healthLabel: toStr(input?.healthLabel, getHealthLabelFromStatus(status)),
    healthTone:
      input?.healthTone === "yellow" || input?.healthTone === "red" || input?.healthTone === "green"
        ? input.healthTone
        : getHealthToneFromStatus(status),
    lastUpdateLabel: formatDateLabel(toStr(input?.lastUpdateLabel, "")),
    timeline,
  };
}

function getStatusPillStyles(status: string): { bg: string; border: string; text: string } {
  if (status === "DELAYED") {
    return { bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.32)", text: "#FBBF24" };
  }
  if (status === "DELIVERED") {
    return { bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.32)", text: "#86EFAC" };
  }
  return { bg: "rgba(59, 130, 246, 0.14)", border: "rgba(59, 130, 246, 0.32)", text: "#93C5FD" };
}

function getHealthPillStyles(tone: "green" | "yellow" | "red") {
  if (tone === "yellow") {
    return { bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.28)", text: "#FBBF24" };
  }
  if (tone === "red") {
    return { bg: "rgba(239, 68, 68, 0.14)", border: "rgba(239, 68, 68, 0.28)", text: "#FCA5A5" };
  }
  return { bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.28)", text: "#86EFAC" };
}

async function getOrder(orderId: string): Promise<{ order: OrderData; warning: string }> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;
  const cookieHeader = cookieStore
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  try {
    const res = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`No se pudo cargar el pedido (${res.status})`);
    }

    const json = (await res.json()) as ApiPayload;
    const order = normalizeOrder(json.order, orderId);
    return { order, warning: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el tracking.";
    const fallback = normalizeOrder(
      {
        id: orderId,
        orderCode: `JUSP-${orderId}`,
        status: "INTERNATIONAL_TRANSIT",
        shippingOrigin: "DALLAS",
        destinationCountry: "Chile",
        destinationCity: "Santiago",
        destinationAddress: "Dirección del cliente",
        productTitle: "Tu pedido JUSP",
        courierName: "Courier internacional",
        trackingCode: "Pendiente",
        etaLabel: "3-7 días hábiles",
        lastUpdateLabel: new Date().toISOString(),
      },
      orderId
    );

    return { order: fallback, warning: message };
  }
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = String(id || "").trim();
  const { order, warning } = await getOrder(orderId);

  const statusPill = getStatusPillStyles(order.status);
  const healthPill = getHealthPillStyles(order.healthTone);
  const originLabel = getOriginLabel(order.shippingOrigin);

  return (
    <main style={styles.page}>
      <div style={styles.bg} />

      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/mis-pedidos" style={styles.backLink}>
            ← Volver a mis pedidos
          </Link>

          <div style={styles.topBarRight}>
            <span style={styles.juspBadge}>JUSP · Seguimiento</span>
          </div>
        </div>

        <div style={styles.heroGrid}>
          <div style={styles.heroCard}>
            <div style={styles.heroMediaWrap}>
              {order.productImage ? (
                <img src={order.productImage} alt={order.productTitle} style={styles.heroImage} />
              ) : (
                <div style={styles.heroFallback}>
                  <span style={styles.heroFallbackText}>JUSP</span>
                </div>
              )}
              <div style={styles.heroOverlay} />
            </div>

            <div style={styles.heroContent}>
              <div style={styles.heroPills}>
                <span
                  style={{
                    ...styles.pill,
                    background: statusPill.bg,
                    borderColor: statusPill.border,
                    color: statusPill.text,
                  }}
                >
                  {order.statusLabel || getStatusLabel(order.status)}
                </span>

                <span
                  style={{
                    ...styles.pill,
                    background: healthPill.bg,
                    borderColor: healthPill.border,
                    color: healthPill.text,
                  }}
                >
                  Salud del pedido: {order.healthLabel}
                </span>
              </div>

              <h1 style={styles.heroTitle}>Seguimiento de tu pedido</h1>

              <div style={styles.heroMeta}>
                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Orden</span>
                  <strong style={styles.metaValue}>{order.orderCode}</strong>
                </div>

                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Courier</span>
                  <strong style={styles.metaValue}>{order.courierName}</strong>
                </div>

                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Tracking</span>
                  <strong style={styles.metaValue}>{order.trackingCode}</strong>
                </div>

                <div style={styles.metaBox}>
                  <span style={styles.metaLabel}>Última actualización</span>
                  <strong style={styles.metaValue}>{order.lastUpdateLabel}</strong>
                </div>
              </div>

              <div style={styles.progressCard}>
                <div style={styles.progressTop}>
                  <span style={styles.progressLabel}>Progreso logístico</span>
                  <strong style={styles.progressPercent}>{clamp(order.progressPercent, 0, 100)}%</strong>
                </div>

                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${clamp(order.progressPercent, 0, 100)}%`,
                    }}
                  />
                </div>

                <div style={styles.progressBottom}>
                  <span>Origen: {originLabel}</span>
                  <span>ETA: {order.etaLabel}</span>
                </div>
              </div>

              {order.trackingUrl ? (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={styles.primaryButton}>
                  Ver tracking del courier
                </a>
              ) : (
                <div style={styles.secondaryNote}>
                  El enlace oficial del courier estará disponible cuando el transporte confirme el escaneo final.
                </div>
              )}

              {warning ? <div style={styles.warningNote}>Mostrando vista segura: {warning}</div> : null}
            </div>
          </div>

          <div style={styles.sideStack}>
            <div style={styles.infoCard}>
              <div style={styles.infoCardHeader}>
                <span style={styles.cardEyebrow}>Mapa de seguimiento</span>
                <h2 style={styles.cardTitle}>Ruta hasta tu dirección</h2>
              </div>

              <div style={styles.mapCard}>
                <div style={styles.mapPath} />

                <div style={styles.mapStop}>
                  <div style={{ ...styles.mapDot, ...styles.mapDotDone }} />
                  <div>
                    <strong style={styles.mapStopTitle}>Hub JUSP</strong>
                    <p style={styles.mapStopText}>{originLabel}</p>
                  </div>
                </div>

                <div style={styles.mapStop}>
                  <div
                    style={{
                      ...styles.mapDot,
                      ...(order.progressPercent >= 58 ? styles.mapDotDone : styles.mapDotUpcoming),
                    }}
                  />
                  <div>
                    <strong style={styles.mapStopTitle}>Tránsito internacional</strong>
                    <p style={styles.mapStopText}>Ruta hacia {order.destinationCountry}</p>
                  </div>
                </div>

                <div style={styles.mapStop}>
                  <div
                    style={{
                      ...styles.mapDot,
                      ...(order.progressPercent >= 76 ? styles.mapDotDone : styles.mapDotUpcoming),
                    }}
                  />
                  <div>
                    <strong style={styles.mapStopTitle}>Ciudad de destino</strong>
                    <p style={styles.mapStopText}>{order.destinationCity || "Ciudad destino"}</p>
                  </div>
                </div>

                <div style={styles.mapStop}>
                  <div
                    style={{
                      ...styles.mapDot,
                      ...(order.progressPercent >= 92 ? styles.mapDotCurrent : styles.mapDotUpcoming),
                    }}
                  />
                  <div>
                    <strong style={styles.mapStopTitle}>Dirección del cliente</strong>
                    <p style={styles.mapStopText}>{order.destinationAddress}</p>
                  </div>
                </div>
              </div>

              <div style={styles.addressPanel}>
                <div style={styles.addressRow}>
                  <span style={styles.addressLabel}>Cliente</span>
                  <span style={styles.addressValue}>{order.customerName}</span>
                </div>

                <div style={styles.addressRow}>
                  <span style={styles.addressLabel}>Correo</span>
                  <span style={styles.addressValue}>{order.customerEmail || "No disponible"}</span>
                </div>

                <div style={styles.addressRow}>
                  <span style={styles.addressLabel}>Destino final</span>
                  <span style={styles.addressValue}>{order.destinationAddress}</span>
                </div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.infoCardHeader}>
                <span style={styles.cardEyebrow}>Estado actual</span>
                <h2 style={styles.cardTitle}>Resumen ejecutivo</h2>
              </div>

              <div style={styles.miniStats}>
                <div style={styles.miniStat}>
                  <span style={styles.miniStatLabel}>Origen</span>
                  <strong style={styles.miniStatValue}>{order.shippingOrigin}</strong>
                </div>
                <div style={styles.miniStat}>
                  <span style={styles.miniStatLabel}>País destino</span>
                  <strong style={styles.miniStatValue}>{order.destinationCountry}</strong>
                </div>
                <div style={styles.miniStat}>
                  <span style={styles.miniStatLabel}>Ciudad</span>
                  <strong style={styles.miniStatValue}>{order.destinationCity}</strong>
                </div>
                <div style={styles.miniStat}>
                  <span style={styles.miniStatLabel}>ETA</span>
                  <strong style={styles.miniStatValue}>{order.etaLabel}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.bottomGrid}>
          <div style={styles.timelineCard}>
            <div style={styles.infoCardHeader}>
              <span style={styles.cardEyebrow}>Timeline</span>
              <h2 style={styles.cardTitle}>Seguimiento detallado</h2>
            </div>

            <div style={styles.timelineList}>
              {order.timeline.map((step, index) => {
                const isDone = step.status === "done";
                const isCurrent = step.status === "current";

                return (
                  <div key={step.key} style={styles.timelineItem}>
                    <div style={styles.timelineRail}>
                      <div
                        style={{
                          ...styles.timelineDot,
                          ...(isDone
                            ? styles.timelineDotDone
                            : isCurrent
                            ? styles.timelineDotCurrent
                            : styles.timelineDotUpcoming),
                        }}
                      />
                      {index < order.timeline.length - 1 ? <div style={styles.timelineLine} /> : null}
                    </div>

                    <div
                      style={{
                        ...styles.timelineContent,
                        ...(isCurrent ? styles.timelineContentCurrent : {}),
                      }}
                    >
                      <div style={styles.timelineTop}>
                        <h3 style={styles.timelineTitle}>{step.label}</h3>
                        <span style={styles.timelineDate}>{step.date ? formatDateLabel(step.date) : "Pendiente"}</span>
                      </div>

                      <div style={styles.timelineLocation}>{step.location}</div>

                      {step.description ? (
                        <p style={styles.timelineDescription}>{step.description}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.helpCard}>
            <div style={styles.infoCardHeader}>
              <span style={styles.cardEyebrow}>Confianza JUSP</span>
              <h2 style={styles.cardTitle}>Lo que significa este tracking</h2>
            </div>

            <div style={styles.helpList}>
              <div style={styles.helpItem}>
                <strong style={styles.helpItemTitle}>Visible desde Dallas o Miami</strong>
                <p style={styles.helpItemText}>
                  El cliente ve el tracking desde el hub JUSP en {originLabel}, no desde China.
                </p>
              </div>

              <div style={styles.helpItem}>
                <strong style={styles.helpItemTitle}>Mapa realista y premium</strong>
                <p style={styles.helpItemText}>
                  La ruta se muestra hasta la dirección final sin vender humo ni depender de APIs externas.
                </p>
              </div>

              <div style={styles.helpItem}>
                <strong style={styles.helpItemTitle}>Escalable para producción</strong>
                <p style={styles.helpItemText}>
                  Cuando integres API real de última milla, esta vista ya está lista para crecer sin romper la experiencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top, rgba(199,166,106,0.16), transparent 22%), linear-gradient(180deg, #050505 0%, #090909 35%, #101010 100%)",
    color: "#F5F5F5",
  },
  bg: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.05), transparent 18%), radial-gradient(circle at 80% 0%, rgba(199,166,106,0.10), transparent 20%)",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1440,
    margin: "0 auto",
    padding: "32px 20px 80px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  backLink: {
    color: "#D4D4D8",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  juspBadge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#F5F5F5",
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    backdropFilter: "blur(14px)",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.7fr 1fr",
    gap: 20,
    alignItems: "stretch",
  },
  heroCard: {
    minHeight: 540,
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    overflow: "hidden",
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  },
  heroMediaWrap: {
    position: "relative",
    minHeight: 340,
    background: "#0E0E0E",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  heroFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #111111 0%, #1A1A1A 100%)",
  },
  heroFallbackText: {
    fontSize: 52,
    fontWeight: 900,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.08)",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.34))",
  },
  heroContent: {
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    justifyContent: "center",
  },
  heroPills: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid",
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  heroTitle: {
    margin: 0,
    fontSize: 40,
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: -1.4,
  },
  heroMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  metaBox: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  metaLabel: {
    display: "block",
    fontSize: 12,
    color: "#A1A1AA",
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 15,
    color: "#FAFAFA",
  },
  progressCard: {
    padding: 16,
    borderRadius: 20,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 13,
    color: "#D4D4D8",
    fontWeight: 700,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: 900,
    color: "#F8E7B7",
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #A67C2E 0%, #E4C37A 100%)",
    boxShadow: "0 0 30px rgba(228,195,122,0.35)",
  },
  progressBottom: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 12,
    color: "#A1A1AA",
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    padding: "0 18px",
    borderRadius: 16,
    background: "linear-gradient(180deg, #E8CF97 0%, #B89243 100%)",
    color: "#111111",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 14,
    border: "none",
    boxShadow: "0 18px 40px rgba(184,146,67,0.28)",
  },
  secondaryNote: {
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "#D4D4D8",
    fontSize: 13,
    lineHeight: 1.55,
  },
  warningNote: {
    padding: 14,
    borderRadius: 16,
    background: "rgba(245, 158, 11, 0.12)",
    border: "1px solid rgba(245, 158, 11, 0.22)",
    color: "#FCD34D",
    fontSize: 13,
    lineHeight: 1.55,
  },
  sideStack: {
    display: "grid",
    gap: 20,
  },
  infoCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    padding: 22,
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.30)",
  },
  infoCardHeader: {
    marginBottom: 18,
  },
  cardEyebrow: {
    display: "block",
    color: "#C9A96A",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  cardTitle: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: -0.6,
  },
  mapCard: {
    position: "relative",
    display: "grid",
    gap: 18,
    padding: "12px 0 8px",
  },
  mapPath: {
    position: "absolute",
    left: 9,
    top: 16,
    bottom: 22,
    width: 2,
    background: "linear-gradient(180deg, rgba(228,195,122,0.95), rgba(255,255,255,0.08))",
  },
  mapStop: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "20px 1fr",
    gap: 14,
    alignItems: "start",
  },
  mapDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    marginTop: 3,
    border: "2px solid rgba(255,255,255,0.22)",
    background: "#121212",
  },
  mapDotDone: {
    background: "linear-gradient(180deg, #E4C37A 0%, #A67C2E 100%)",
    border: "2px solid rgba(228,195,122,0.55)",
    boxShadow: "0 0 20px rgba(228,195,122,0.35)",
  },
  mapDotCurrent: {
    background: "#F8E7B7",
    border: "2px solid rgba(248,231,183,0.85)",
    boxShadow: "0 0 20px rgba(248,231,183,0.35)",
  },
  mapDotUpcoming: {
    background: "#1A1A1A",
    border: "2px solid rgba(255,255,255,0.14)",
  },
  mapStopTitle: {
    display: "block",
    fontSize: 14,
    color: "#FAFAFA",
    marginBottom: 4,
  },
  mapStopText: {
    margin: 0,
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 1.5,
  },
  addressPanel: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    display: "grid",
    gap: 12,
  },
  addressRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  addressLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    minWidth: 100,
  },
  addressValue: {
    color: "#FAFAFA",
    fontSize: 13,
    textAlign: "right",
    lineHeight: 1.5,
  },
  miniStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  miniStat: {
    padding: 16,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  miniStatLabel: {
    display: "block",
    fontSize: 12,
    color: "#A1A1AA",
    marginBottom: 8,
  },
  miniStatValue: {
    display: "block",
    fontSize: 16,
    color: "#FAFAFA",
    fontWeight: 800,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.9fr",
    gap: 20,
    marginTop: 20,
    alignItems: "start",
  },
  timelineCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    padding: 22,
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.30)",
  },
  timelineList: {
    display: "grid",
    gap: 16,
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    gap: 14,
    alignItems: "stretch",
  },
  timelineRail: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    marginTop: 6,
    flexShrink: 0,
  },
  timelineDotDone: {
    background: "linear-gradient(180deg, #E4C37A 0%, #A67C2E 100%)",
    boxShadow: "0 0 16px rgba(228,195,122,0.30)",
  },
  timelineDotCurrent: {
    background: "#F8E7B7",
    boxShadow: "0 0 16px rgba(248,231,183,0.32)",
  },
  timelineDotUpcoming: {
    background: "rgba(255,255,255,0.12)",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 36,
    marginTop: 8,
    background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
  },
  timelineContent: {
    borderRadius: 20,
    padding: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  timelineContentCurrent: {
    background: "rgba(228,195,122,0.08)",
    border: "1px solid rgba(228,195,122,0.22)",
  },
  timelineTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  timelineTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: "#FAFAFA",
  },
  timelineDate: {
    fontSize: 12,
    color: "#C9A96A",
    fontWeight: 700,
  },
  timelineLocation: {
    marginTop: 6,
    fontSize: 13,
    color: "#D4D4D8",
    fontWeight: 700,
  },
  timelineDescription: {
    margin: "8px 0 0",
    fontSize: 13,
    color: "#A1A1AA",
    lineHeight: 1.6,
  },
  helpCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    padding: 22,
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.30)",
  },
  helpList: {
    display: "grid",
    gap: 14,
  },
  helpItem: {
    padding: 16,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  helpItemTitle: {
    display: "block",
    color: "#FAFAFA",
    fontSize: 15,
    marginBottom: 8,
  },
  helpItemText: {
    margin: 0,
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 1.65,
  },
};