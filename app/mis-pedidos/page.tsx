"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type OrderItem = {
  id: string;
  slug?: string | null;
  product_slug?: string | null;
  title: string;
  name?: string | null;
  brand?: string | null;
  price: number;
  image?: string | null;
  size?: string | null;
  color?: string | null;
  qty: number;
};

type ShippingAddress = {
  country?: string;
  city?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  notes?: string;
};

type OrderRow = {
  id: string;
  order_code?: string | null;
  created_at: string;
  status?: string | null;
  payment_status?: string | null;
  customer_email?: string | null;
  payment_intent_id?: string | null;
  tracking_code?: string | null;
  carrier?: string | null;
  items?: OrderItem[] | null;
  shipping_address?: ShippingAddress | null;
  paid_at?: string | null;
};

type ReviewPromptState = {
  dismissed: string[];
  submitted: string[];
};

const REVIEW_PROMPT_KEY = "jusp_order_review_prompt_v1";

function normalizeReviewState(input: unknown): ReviewPromptState {
  const source = input && typeof input === "object" ? (input as any) : {};
  const dismissed = Array.isArray(source.dismissed) ? source.dismissed.filter((v: unknown) => typeof v === "string") : [];
  const submitted = Array.isArray(source.submitted) ? source.submitted.filter((v: unknown) => typeof v === "string") : [];
  return { dismissed, submitted };
}

function loadReviewPromptState(): ReviewPromptState {
  if (typeof window === "undefined") return { dismissed: [], submitted: [] };
  try {
    return normalizeReviewState(JSON.parse(localStorage.getItem(REVIEW_PROMPT_KEY) || "{}"));
  } catch {
    return { dismissed: [], submitted: [] };
  }
}

function saveReviewPromptState(state: ReviewPromptState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REVIEW_PROMPT_KEY, JSON.stringify(state));
  } catch {}
}

function reviewItemKey(orderId: string, item: OrderItem) {
  const raw = String(item.slug || item.product_slug || item.id || item.title || item.name || "").trim();
  return `${orderId}:${raw.toLowerCase()}`;
}

type ApiOk = { ok: true; orders: OrderRow[] };
type ApiErr = { ok: false; error?: string };

function safeMoney(n: number) {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n);
  return rounded.toLocaleString("es-CO");
}

function calcTotal(items: OrderItem[] | null | undefined) {
  const arr = Array.isArray(items) ? items : [];
  let total = 0;
  for (const it of arr) {
    const price = Number(it?.price);
    const qty = Number(it?.qty);
    if (!Number.isFinite(price) || !Number.isFinite(qty)) continue;
    total += price * qty;
  }
  return total;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pillTone(s?: string | null) {
  const v = String(s || "").toLowerCase();
  if (v.includes("paid") || v.includes("approved") || v.includes("succeeded") || v.includes("ok")) return "good";
  if (v.includes("pending") || v.includes("processing") || v.includes("in_progress")) return "warn";
  if (
    v.includes("failed") ||
    v.includes("declined") ||
    v.includes("rejected") ||
    v.includes("voided") ||
    v.includes("error") ||
    v.includes("canceled") ||
    v.includes("cancelled")
  ) {
    return "bad";
  }
  return "neutral";
}

function statusLabel(s?: string | null) {
  const v = String(s || "").toLowerCase();
  if (!v) return "—";
  if (v === "created") return "Creada";
  if (v === "confirmed") return "Confirmada";
  if (v === "packed") return "Empacada";
  if (v === "shipped") return "Enviada";
  if (v === "delivered") return "Entregada";
  if (v === "cancelled" || v === "canceled") return "Cancelada";
  if (v === "refunded") return "Reembolsada";
  if (v === "paid") return "Pagada";
  return String(s);
}

function payLabel(s?: string | null) {
  const v = String(s || "").toLowerCase();
  if (!v) return "—";
  if (v === "none") return "Sin pago";
  if (v === "pending") return "Pendiente";
  if (v === "in_progress") return "En proceso";
  if (v === "paid" || v === "approved") return "Pagado";
  if (v === "failed") return "Fallido";
  if (v === "declined") return "Rechazado";
  if (v === "refunded") return "Reembolsado";
  return String(s);
}

function compactId(id: string) {
  const s = String(id || "");
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function progressForStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (s === "created") return 20;
  if (s === "confirmed") return 35;
  if (s === "packed") return 55;
  if (s === "shipped") return 75;
  if (s === "delivered") return 100;
  if (s === "paid") return 30;
  if (s === "refunded") return 100;
  if (s === "cancelled" || s === "canceled") return 100;
  return 15;
}

function isCancelled(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return s === "cancelled" || s === "canceled";
}

function isCustomerVisibleOrder(order: OrderRow) {
  const payment = String(order?.payment_status || "").trim().toLowerCase();
  const status = String(order?.status || "").trim().toLowerCase();

  const paymentApproved =
    payment === "paid" ||
    payment === "approved" ||
    payment === "refunded";

  const hiddenByPayment =
    payment === "failed" ||
    payment === "declined" ||
    payment === "rejected" ||
    payment === "voided" ||
    payment === "error" ||
    payment === "none" ||
    payment === "pending" ||
    payment === "in_progress";

  const hiddenByStatus =
    status === "failed" ||
    status === "declined" ||
    status === "rejected" ||
    status === "error";

  if (hiddenByPayment || hiddenByStatus) return false;

  if (status === "cancelled" || status === "canceled" || status === "refunded") return true;

  return paymentApproved;
}

function uniqNonEmpty(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const s = String(raw || "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function buildOrderSummary(items: OrderItem[]) {
  const countLines = items.length;
  const countItems = items.reduce((acc, it) => acc + (Number(it?.qty) || 0), 0);

  const leadTitle = items[0]?.title ? String(items[0].title) : "Pedido";
  const rest = Math.max(0, countLines - 1);

  const sizes = uniqNonEmpty(items.map((it) => (it?.size ? String(it.size) : ""))).slice(0, 3);
  const colors = uniqNonEmpty(items.map((it) => (it?.color ? String(it.color) : ""))).slice(0, 3);

  const titleLine = rest > 0 ? `${leadTitle} +${rest}` : leadTitle;
  const metaLine = `Compra ${countLines}/${countItems} items`;

  return { titleLine, metaLine, sizes, colors };
}

function Icon({ name }: { name: "refresh" | "bag" | "copy" | "truck" | "check" | "search" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "refresh") {
    return (
      <svg {...common}>
        <path {...stroke} d="M21 12a9 9 0 0 1-15.7 6.3" />
        <path {...stroke} d="M3 12a9 9 0 0 1 15.7-6.3" />
        <path {...stroke} d="M3 18v-5h5" />
        <path {...stroke} d="M21 6v5h-5" />
      </svg>
    );
  }
  if (name === "bag") {
    return (
      <svg {...common}>
        <path {...stroke} d="M6 8h12l-1 13H7L6 8z" />
        <path {...stroke} d="M9 8a3 3 0 0 1 6 0" />
      </svg>
    );
  }
  if (name === "copy") {
    return (
      <svg {...common}>
        <path {...stroke} d="M9 9h10v10H9z" />
        <path {...stroke} d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
      </svg>
    );
  }
  if (name === "truck") {
    return (
      <svg {...common}>
        <path {...stroke} d="M3 7h11v10H3z" />
        <path {...stroke} d="M14 10h4l3 3v4h-7" />
        <path {...stroke} d="M7 17a2 2 0 1 0 0 4a2 2 0 0 0 0-4z" />
        <path {...stroke} d="M18 17a2 2 0 1 0 0 4a2 2 0 0 0 0-4z" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...common}>
        <path {...stroke} d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path {...stroke} d="M21 21l-4.3-4.3" />
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

type FilterKey = "all" | "paid" | "shipped" | "delivered";

function MisPedidosContent() {
  const r = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<ReviewPromptState>({ dismissed: [], submitted: [] });
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewItemToken, setReviewItemToken] = useState<string>("");
  const [reviewRating, setReviewRating] = useState(5);
  const [experienceRating, setExperienceRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);

  const mounted = useRef(true);
  const toastTimer = useRef<any>(null);
  const redirectedRef = useRef(false);
  const [entered, setEntered] = useState(false);
  const reviewBootedRef = useRef(false);

  const highlight = useMemo(() => {
    return String(searchParams.get("highlight") || "")
      .trim()
      .toLowerCase();
  }, [searchParams]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setReviewState(loadReviewPromptState());
  }, []);

  function showToast(msg: string) {
    if (!mounted.current) return;
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 2200);
  }

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "cache-control": "no-store" },
      });

      if (res.status === 401) {
        r.replace("/login");
        window.location.assign("/login");
        return;
      }

      const json = (await res.json().catch(() => null)) as ApiOk | ApiErr | null;

      if (!res.ok || !json || (json as any).ok !== true) {
        const msg =
          (json && (json as any).error) ||
          (res.status >= 500 ? "Error del servidor al cargar pedidos." : "No se pudieron cargar tus pedidos.");
        if (mounted.current) setErr(String(msg));
        return;
      }

      const list = Array.isArray((json as ApiOk).orders) ? (json as ApiOk).orders : [];
      const visible = list.filter(isCustomerVisibleOrder);

      if (mounted.current) setOrders(visible);
    } catch {
      if (mounted.current) setErr("Error de red. Revisa tu conexión.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!highlight) return;
    if (redirectedRef.current) return;
    if (!orders.length) return;

    const match = orders.find((o) => {
      const id = String(o.id || "").trim().toLowerCase();
      const code = String(o.order_code || "").trim().toLowerCase();
      return id === highlight || code === highlight;
    });

    if (match?.id) {
      redirectedRef.current = true;
      r.replace(`/mis-pedidos/${encodeURIComponent(String(match.id))}?highlight=${encodeURIComponent(highlight)}`);
      return;
    }

    showToast("No encontramos ese pedido en tu cuenta.");
  }, [loading, highlight, orders, r]);

  const kpis = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => {
      const payment = String(o.payment_status || "").toLowerCase();
      return payment === "paid" || payment === "approved";
    }).length;
    const shipped = orders.filter((o) => String(o.status || "").toLowerCase() === "shipped").length;
    const delivered = orders.filter((o) => String(o.status || "").toLowerCase() === "delivered").length;
    return { total, paid, shipped, delivered };
  }, [orders]);

  const view = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let list = orders.slice();

    if (filter === "paid") {
      list = list.filter((o) => {
        const payment = String(o.payment_status || "").toLowerCase();
        return payment === "paid" || payment === "approved";
      });
    } else if (filter === "shipped") {
      list = list.filter((o) => String(o.status || "").toLowerCase() === "shipped");
    } else if (filter === "delivered") {
      list = list.filter((o) => String(o.status || "").toLowerCase() === "delivered");
    }

    if (qq) {
      list = list.filter((o) => {
        const id = String(o.id || "").toLowerCase();
        const code = String(o.order_code || "").toLowerCase();
        return id.includes(qq) || code.includes(qq);
      });
    }

    return list;
  }, [orders, filter, q]);

  const reviewOrder = useMemo(
    () => orders.find((order) => String(order.id) === String(reviewOrderId || "")) || null,
    [orders, reviewOrderId]
  );

  const reviewItems = useMemo(() => {
    const items = Array.isArray(reviewOrder?.items) ? reviewOrder.items : [];
    return items.filter((item) => String(item?.id || item?.slug || item?.product_slug || item?.title || item?.name || "").trim());
  }, [reviewOrder]);

  const selectedReviewItem = useMemo(() => {
    if (!reviewOrder || !reviewItems.length) return null;
    return reviewItems.find((item) => reviewItemKey(reviewOrder.id, item) === reviewItemToken) || reviewItems[0] || null;
  }, [reviewItems, reviewItemToken, reviewOrder]);

  function openReview(order: OrderRow, preferredItem?: OrderItem | null) {
    const items = Array.isArray(order.items) ? order.items : [];
    const item = preferredItem || items[0] || null;
    if (!item) return;

    setReviewOrderId(order.id);
    setReviewItemToken(reviewItemKey(order.id, item));
    setReviewRating(5);
    setExperienceRating(5);
    setReviewComment("");
    setReviewErr(null);
  }

  function closeReview(markDismissed = false) {
    if (markDismissed && reviewOrder && selectedReviewItem) {
      const token = reviewItemKey(reviewOrder.id, selectedReviewItem);
      const next = {
        ...reviewState,
        dismissed: Array.from(new Set([...reviewState.dismissed, token])),
      };
      setReviewState(next);
      saveReviewPromptState(next);
    }

    setReviewOrderId(null);
    setReviewItemToken("");
    setExperienceRating(5);
    setReviewComment("");
    setReviewErr(null);
    setReviewBusy(false);
  }

  useEffect(() => {
    if (loading || reviewBootedRef.current) return;
    if (!orders.length) return;

    const delivered = orders.find((order) => {
      if (String(order.status || "").toLowerCase() !== "delivered") return false;
      const items = Array.isArray(order.items) ? order.items : [];
      return items.some((item) => {
        const token = reviewItemKey(order.id, item);
        return !reviewState.dismissed.includes(token) && !reviewState.submitted.includes(token);
      });
    });

    if (!delivered) {
      reviewBootedRef.current = true;
      return;
    }

    const firstPendingItem = (delivered.items || []).find((item) => {
      const token = reviewItemKey(delivered.id, item);
      return !reviewState.dismissed.includes(token) && !reviewState.submitted.includes(token);
    });

    if (firstPendingItem) {
      reviewBootedRef.current = true;
      openReview(delivered, firstPendingItem);
    }
  }, [loading, orders, reviewState]);

  async function submitDeliveredReview() {
    if (!reviewOrder || !selectedReviewItem) return;
    if (reviewComment.trim().length < 12) {
      setReviewErr("Cuéntanos un poco más sobre tu experiencia. Mínimo 12 caracteres.");
      return;
    }

    const productId = String(selectedReviewItem.id || "").trim();
    const productSlug = String(selectedReviewItem.slug || selectedReviewItem.product_slug || "").trim();
    const productTitle = String(selectedReviewItem.title || selectedReviewItem.name || "Producto").trim();

    setReviewBusy(true);
    setReviewErr(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          productSlug,
          productTitle,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setReviewErr(json?.error || "No se pudo guardar tu reseña.");
        return;
      }

      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "experience",
          rating: experienceRating,
          email: reviewOrder.customer_email || "",
          message:
            `Pedido ${reviewOrder.order_code || reviewOrder.id} · ${productTitle}\n` +
            `Experiencia de compra: ${experienceRating}/5\n` +
            `Calificación del producto: ${reviewRating}/5\n\n` +
            `${reviewComment.trim()}`,
          meta: {
            order_id: reviewOrder.id,
            order_code: reviewOrder.order_code || null,
            product_id: productId || null,
            product_slug: productSlug || null,
            product_title: productTitle,
            product_rating: reviewRating,
          },
        }),
      }).catch(() => null);

      const token = reviewItemKey(reviewOrder.id, selectedReviewItem);
      const next = {
        dismissed: reviewState.dismissed.filter((entry) => entry !== token),
        submitted: Array.from(new Set([...reviewState.submitted, token])),
      };
      setReviewState(next);
      saveReviewPromptState(next);
      showToast("Reseña enviada correctamente.");
      closeReview(false);
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <main className={`mp-root ${entered ? "entered" : ""}`}>
      <div className="mp-wrap">
        <div className="hero">
          <div className="hero-left">
            <div className="crumbs">
              <Link className="crumb" href="/account">
                Cuenta
              </Link>
              <span className="crumb-sep">/</span>
              <span className="crumb current">Mis pedidos</span>
            </div>

            <h1 className="hero-title">Mis pedidos</h1>

            <p className="hero-sub">
              Aquí ves pedidos válidos para cliente, incluyendo órdenes canceladas por falta de stock y órdenes reembolsadas.
            </p>

            <div className="kpis">
              <div className="kpi">
                <div className="kpi-l">Total</div>
                <div className="kpi-v">{loading ? "—" : kpis.total}</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Pagados</div>
                <div className="kpi-v">{loading ? "—" : kpis.paid}</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Enviados</div>
                <div className="kpi-v">{loading ? "—" : kpis.shipped}</div>
              </div>
              <div className="kpi">
                <div className="kpi-l">Entregados</div>
                <div className="kpi-v">{loading ? "—" : kpis.delivered}</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-actions">
              <Link className="btn ghost" href="/products">
                <span className="btn-ico">
                  <Icon name="bag" />
                </span>
                Seguir comprando
              </Link>

              <button className="btn" onClick={load} disabled={loading} aria-busy={loading}>
                <span className="btn-ico">
                  <Icon name="refresh" />
                </span>
                {loading ? "Actualizando…" : "Actualizar"}
              </button>
            </div>

            <div className="toolbar">
              <div className="chips" role="tablist" aria-label="Filtros">
                <button className={`chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")} type="button">
                  Todos
                </button>
                <button className={`chip ${filter === "paid" ? "on" : ""}`} onClick={() => setFilter("paid")} type="button">
                  Pagados
                </button>
                <button
                  className={`chip ${filter === "shipped" ? "on" : ""}`}
                  onClick={() => setFilter("shipped")}
                  type="button"
                >
                  Enviados
                </button>
                <button
                  className={`chip ${filter === "delivered" ? "on" : ""}`}
                  onClick={() => setFilter("delivered")}
                  type="button"
                >
                  Entregados
                </button>
              </div>

              <div className="search">
                <span className="search-ico" aria-hidden="true">
                  <Icon name="search" />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por ID o código…"
                  className="search-in"
                  inputMode="text"
                />
                {q ? (
                  <button className="search-x" type="button" onClick={() => setQ("")} aria-label="Limpiar búsqueda">
                    ×
                  </button>
                ) : null}
              </div>
            </div>

            <div className="hero-note">
              <span className="hero-dot" />
              <span>Tip: entra al detalle para copiar tracking / payment intent.</span>
            </div>
          </div>
        </div>

        {err ? (
          <div className="alert" role="alert">
            <div className="alert-ico">!</div>
            <div>
              <div className="alert-t">Ups</div>
              <div className="alert-p">{err}</div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card sk" style={{ ["--i" as any]: i }}>
                <div className="sk-head">
                  <div className="sk-line w45" />
                  <div className="sk-line w30" />
                </div>
                <div className="sk-bar" />
                <div className="sk-row">
                  <div className="sk-line w35" />
                  <div className="sk-line w25" />
                  <div className="sk-line w40" />
                </div>
                <div className="sk-items">
                  <div className="sk-img" />
                  <div className="sk-img" />
                  <div className="sk-img" />
                </div>
              </div>
            ))}
          </div>
        ) : view.length === 0 ? (
          <div className="empty">
            <div className="empty-card">
              <div className="empty-top">
                <div className="empty-badge">Sin pedidos visibles</div>
                <div className="empty-art" aria-hidden="true">
                  <div className="art-dot" />
                  <div className="art-line" />
                  <div className="art-dot" />
                  <div className="art-line" />
                  <div className="art-dot" />
                </div>
              </div>

              <div className="empty-h">Aquí aparecen tus pedidos válidos y sus cambios.</div>
              <div className="empty-p">
                Las órdenes pagadas, enviadas, entregadas, canceladas por falta de stock o reembolsadas se muestran aquí. Las fallidas, rechazadas o pendientes siguen ocultas.
              </div>

              <div className="empty-actions">
                <Link className="btn" href="/products">
                  <span className="btn-ico">
                    <Icon name="bag" />
                  </span>
                  Ver productos
                </Link>
                <Link className="btn ghost" href="/account">
                  Ir a mi cuenta
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid">
            {view.map((o, idx) => {
              const items = Array.isArray(o.items) ? o.items : [];
              const total = calcTotal(items);
              const addr = o.shipping_address || {};
              const addrLine = [addr?.city, addr?.country].filter(Boolean).join(" · ");
              const payTone = pillTone(o.payment_status);
              const stTone = pillTone(o.status);

              const statusProg = clamp(progressForStatus(o.status), 0, 100);
              const canceled = isCancelled(o.status);
              const isHighlighted =
                !!highlight &&
                (String(o.id || "").trim().toLowerCase() === highlight ||
                  String(o.order_code || "").trim().toLowerCase() === highlight);

              const topImgs = items.slice(0, 3).map((it) => it.image).filter(Boolean) as string[];
              const sum = buildOrderSummary(items);

              return (
                <div
                  key={o.id}
                  className={`card ${isHighlighted ? "hl" : ""}`}
                  style={{ ["--i" as any]: idx }}
                >
                  <div className="summary">
                    <div className="summary-left">
                      <div className="summary-meta">{sum.metaLine}</div>
                      <div className="summary-title">{sum.titleLine}</div>
                    </div>

                    <div className="summary-chips">
                      {sum.sizes.slice(0, 2).map((s) => (
                        <span key={"s" + s} className="chip2">
                          Talla {s}
                        </span>
                      ))}
                      {sum.colors.slice(0, 2).map((c) => (
                        <span key={"c" + c} className="chip2 ghost">
                          {c}
                        </span>
                      ))}
                      {!sum.sizes.length && !sum.colors.length ? <span className="chip2 ghost">Sin variaciones</span> : null}
                    </div>
                  </div>

                  <div className="card-head">
                    <div className="card-left">
                      <div className="card-kicker">PEDIDO</div>
                      <div className="card-id">
                        <span className="mono">{compactId(String(o.id))}</span>
                        {o.order_code ? (
                          <>
                            <span className="dot">•</span>
                            <span className="mono code">{String(o.order_code)}</span>
                          </>
                        ) : null}
                        <span className="dot">•</span>
                        <span className="muted">{fmtDate(o.created_at)}</span>
                      </div>
                    </div>

                    <div className="pills">
                      <span className={`pill ${stTone}`}>{statusLabel(o.status)}</span>
                      <span className={`pill ${payTone}`}>{payLabel(o.payment_status)}</span>
                    </div>
                  </div>

                  <div className="bar">
                    <div className={`bar-fill ${canceled ? "bad" : ""}`} style={{ width: `${statusProg}%` }} />
                  </div>

                  <div className="card-body">
                    <div className="row">
                      <div className="meta">
                        <div className="meta-l">Total</div>
                        <div className="meta-v">${safeMoney(total)}</div>
                        <div className="meta-s">Líneas: {items.length || 0}</div>
                      </div>

                      <div className="meta">
                        <div className="meta-l">Envío</div>
                        <div className="meta-v">{addrLine || "—"}</div>
                        <div className="meta-s">
                          <span className="mini-ico">
                            <Icon name="truck" />
                          </span>
                          {o.tracking_code ? "Tracking asignado" : "Aún sin tracking"}
                        </div>
                      </div>

                      <div className="meta">
                        <div className="meta-l">Tracking</div>
                        <div className="meta-v mono">{o.tracking_code ? String(o.tracking_code) : "—"}</div>
                        <div className="meta-s">{o.carrier ? `Carrier: ${String(o.carrier)}` : "Carrier: —"}</div>
                      </div>
                    </div>

                    <div className="items">
                      {topImgs.length ? (
                        topImgs.map((src, i) => (
                          <div key={src + i} className="img">
                            <img src={src} alt="item" loading="lazy" />
                          </div>
                        ))
                      ) : (
                        <div className="noimg">Sin imágenes</div>
                      )}

                      <div className="items-note">
                        <div className="items-note-h">Vista rápida</div>
                        <div className="items-note-p">
                          {items[0]?.title ? String(items[0].title) : "Pedido sin items visibles"}{" "}
                          {items.length > 1 ? `+${items.length - 1} más` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="foot">
                      <div className="hint">
                        <span className="hint-dot" />
                        {(() => {
                          const payment = String(o.payment_status || "").toLowerCase();
                          if (payment === "paid" || payment === "approved") {
                            return (
                              <span className="hint-t">
                                <span className="hint-ico">
                                  <Icon name="check" />
                                </span>
                                Pago confirmado
                              </span>
                            );
                          }
                          return <span className="hint-t">Pago: {payLabel(o.payment_status)}</span>;
                        })()}
                      </div>

                      <div className="cta">
                        {String(o.status || "").toLowerCase() === "delivered" && items.length ? (
                          <button
                            className="btn small"
                            type="button"
                            onClick={() => openReview(o, items[0])}
                          >
                            Calificar compra
                          </button>
                        ) : null}

                        <button
                          className="btn small ghost"
                          type="button"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(String(o.id));
                              showToast("ID copiado");
                            } catch {
                              showToast("No se pudo copiar");
                            }
                          }}
                        >
                          <span className="btn-ico">
                            <Icon name="copy" />
                          </span>
                          Copiar ID
                        </button>

                        <Link
                          className="btn small"
                          href={`/mis-pedidos/${encodeURIComponent(String(o.id))}${o.order_code ? `?highlight=${encodeURIComponent(String(o.order_code))}` : ""}`}
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {reviewOrder && selectedReviewItem ? (
          <div className="reviewOverlay" role="presentation" onClick={() => closeReview(true)}>
            <div className="reviewModal" role="dialog" aria-modal="true" aria-labelledby="reviewTitle" onClick={(e) => e.stopPropagation()}>
              <div className="reviewTop">
                <div>
                  <div className="reviewKicker">Pedido entregado</div>
                  <h2 id="reviewTitle" className="reviewTitle">Califica tu compra</h2>
                  <p className="reviewSub">
                    Valora la experiencia de compra y el producto recibido. La reseña del producto también aparecerá en su ficha.
                  </p>
                </div>

                <button className="reviewClose" type="button" onClick={() => closeReview(true)} aria-label="Cerrar">
                  ×
                </button>
              </div>

              {reviewItems.length > 1 ? (
                <div className="reviewProducts">
                  {reviewItems.map((item) => {
                    const token = reviewOrder ? reviewItemKey(reviewOrder.id, item) : "";
                    const active = token === reviewItemToken;
                    return (
                      <button
                        key={token}
                        type="button"
                        className={`reviewProductChip ${active ? "on" : ""}`}
                        onClick={() => setReviewItemToken(token)}
                      >
                        {item.title || item.name || "Producto"}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="reviewItemName">{selectedReviewItem.title || selectedReviewItem.name || "Producto"}</div>

              <div className="reviewLabel">Experiencia de compra</div>
              <div className="reviewStars" role="radiogroup" aria-label="Calificación de la experiencia de compra">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`experience-${star}`}
                    type="button"
                    className={`reviewStar ${experienceRating >= star ? "on" : ""}`}
                    onClick={() => setExperienceRating(star)}
                    aria-label={`${star} estrellas para la experiencia`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="reviewLabel">Producto recibido</div>
              <div className="reviewStars" role="radiogroup" aria-label="Calificación del producto">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`reviewStar ${reviewRating >= star ? "on" : ""}`}
                    onClick={() => setReviewRating(star)}
                    aria-label={`${star} estrellas`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                className="reviewTextarea"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Cuéntanos cómo te fue con la compra y con el producto..."
              />

              {reviewErr ? <div className="reviewErr">{reviewErr}</div> : null}

              <div className="reviewActions">
                <button className="btn small ghost" type="button" onClick={() => closeReview(true)} disabled={reviewBusy}>
                  Ahora no
                </button>
                <button className="btn small" type="button" onClick={submitDeliveredReview} disabled={reviewBusy}>
                  {reviewBusy ? "Enviando..." : "Enviar reseña"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>

      <style jsx>{`
        .mp-root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 34px;
          background: radial-gradient(1200px 680px at 18% 0%, rgba(255, 214, 0, 0.14), transparent 55%),
            radial-gradient(900px 520px at 92% 15%, rgba(0, 0, 0, 0.06), transparent 60%),
            radial-gradient(800px 560px at 40% 90%, rgba(0, 0, 0, 0.04), transparent 62%),
            #f7f7f7;
          min-height: 100vh;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 260ms ease, transform 260ms ease;
        }
        .mp-root.entered {
          opacity: 1;
          transform: translateY(0);
        }
        .mp-wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 14px;
          margin-bottom: 14px;
          align-items: start;
        }
        .hero-left,
        .hero-right {
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          padding: 16px;
        }

        .crumbs {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.6);
          font-weight: 900;
        }
        .crumb {
          text-decoration: none;
          color: rgba(0, 0, 0, 0.7);
        }
        .crumb:hover {
          text-decoration: underline;
        }
        .crumb.current {
          color: rgba(0, 0, 0, 0.85);
        }
        .crumb-sep {
          opacity: 0.5;
        }

        .hero-title {
          margin: 10px 0 6px;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #111;
        }
        .hero-sub {
          margin: 0;
          max-width: 760px;
          color: rgba(0, 0, 0, 0.72);
          font-size: 13px;
          line-height: 1.65;
        }

        .kpis {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .kpi {
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.74));
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 16px 46px rgba(0, 0, 0, 0.06);
          padding: 12px;
        }
        .kpi-l {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }
        .kpi-v {
          margin-top: 6px;
          font-size: 18px;
          font-weight: 950;
          color: #111;
        }

        .hero-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .toolbar {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chip {
          border-radius: 999px;
          padding: 9px 11px;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.78);
          cursor: pointer;
          transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        .chip:hover {
          transform: translateY(-1px);
          background: rgba(0, 0, 0, 0.05);
        }
        .chip.on {
          background: rgba(255, 214, 0, 0.55);
          border-color: rgba(255, 214, 0, 0.85);
          color: #111;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.92);
          padding: 10px 12px;
        }
        .search-ico {
          color: rgba(0, 0, 0, 0.55);
          display: inline-flex;
        }
        .search-in {
          border: 0;
          outline: none;
          width: 100%;
          font-size: 13px;
          font-weight: 900;
          color: #111;
          background: transparent;
        }
        .search-x {
          border: 0;
          background: rgba(0, 0, 0, 0.06);
          width: 28px;
          height: 28px;
          border-radius: 999px;
          font-size: 18px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.65);
          cursor: pointer;
        }

        .hero-note {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.6);
        }
        .hero-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .card {
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, opacity 280ms ease,
            filter 280ms ease;
          opacity: 0;
          transform: translateY(8px);
          filter: blur(2px);
          animation: cardIn 360ms ease forwards;
          animation-delay: calc(var(--i, 0) * 40ms);
        }
        .card.hl {
          border-color: rgba(255, 214, 0, 0.85);
          box-shadow: 0 28px 80px rgba(255, 214, 0, 0.18);
        }
        @keyframes cardIn {
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 30px 84px rgba(0, 0, 0, 0.11);
          border-color: rgba(0, 0, 0, 0.12);
        }

        .summary {
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.78));
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .summary-left {
          min-width: 0;
          display: grid;
          gap: 4px;
        }
        .summary-meta {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.55);
        }
        .summary-title {
          font-size: 13px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          max-width: 560px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .summary-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
        }
        .chip2 {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.78);
          white-space: nowrap;
        }
        .chip2.ghost {
          background: rgba(255, 255, 255, 0.9);
        }

        .card-head {
          padding: 14px 14px 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .card-kicker {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
        }
        .card-id {
          margin-top: 7px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.72);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-weight: 950;
          color: #111;
        }
        .mono.code {
          color: rgba(0, 0, 0, 0.72);
        }
        .dot {
          opacity: 0.5;
        }
        .muted {
          opacity: 0.85;
        }

        .pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .pill {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.78);
          white-space: nowrap;
        }
        .pill.good {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.22);
          color: rgba(6, 95, 70, 1);
        }
        .pill.warn {
          background: rgba(245, 158, 11, 0.14);
          border-color: rgba(245, 158, 11, 0.24);
          color: rgba(120, 53, 15, 1);
        }
        .pill.bad {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.22);
          color: rgba(127, 29, 29, 1);
        }

        .bar {
          height: 6px;
          background: rgba(0, 0, 0, 0.06);
        }
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(255, 214, 0, 0.95), rgba(0, 0, 0, 0.88));
          width: 40%;
        }
        .bar-fill.bad {
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.95), rgba(0, 0, 0, 0.85));
        }

        .card-body {
          padding: 12px 14px 14px;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .meta {
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 12px;
        }
        .meta-l {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }
        .meta-v {
          margin-top: 6px;
          font-size: 14px;
          font-weight: 950;
          color: #111;
          word-break: break-word;
        }
        .meta-s {
          margin-top: 6px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.62);
          font-weight: 900;
          display: inline-flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .mini-ico {
          display: inline-flex;
          opacity: 0.75;
        }

        .items {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: center;
          margin-bottom: 10px;
        }
        .img {
          width: 66px;
          height: 66px;
          border-radius: 18px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .noimg {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.55);
          grid-column: 1 / -1;
        }
        .items-note {
          min-width: 0;
          border-radius: 18px;
          border: 1px dashed rgba(0, 0, 0, 0.12);
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.6);
        }
        .items-note-h {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }
        .items-note-p {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.74);
          font-weight: 900;
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .foot {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .hint {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.62);
          font-weight: 950;
        }
        .hint-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }
        .hint-t {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .hint-ico {
          display: inline-flex;
          opacity: 0.85;
        }

        .cta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 16px;
          min-height: 46px;
          padding: 0 16px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #111;
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease, background 120ms ease;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
        }
        .btn:hover {
          transform: translateY(-1px);
          opacity: 0.96;
        }
        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          transform: none;
        }
        .btn.small {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 14px;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          box-shadow: none;
        }
        .btn-ico {
          display: inline-flex;
        }

        .reviewOverlay {
          position: fixed;
          inset: 0;
          z-index: 2600;
          background: rgba(0, 0, 0, 0.48);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: grid;
          place-items: center;
          padding: 18px;
        }
        .reviewModal {
          width: min(640px, calc(100vw - 24px));
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.97);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.24);
          padding: 22px;
          display: grid;
          gap: 16px;
        }
        .reviewTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .reviewKicker {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.46);
        }
        .reviewTitle {
          margin: 8px 0 0;
          font-size: 30px;
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 1000;
          color: #111;
        }
        .reviewSub {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 850;
          color: rgba(0, 0, 0, 0.62);
        }
        .reviewClose {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.62);
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
          flex: 0 0 auto;
        }
        .reviewProducts {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .reviewProductChip {
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.96);
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
          cursor: pointer;
        }
        .reviewProductChip.on {
          background: rgba(255, 214, 0, 0.55);
          border-color: rgba(255, 214, 0, 0.8);
          color: #111;
        }
        .reviewItemName {
          font-size: 16px;
          font-weight: 950;
          color: #111;
        }
        .reviewLabel {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.58);
        }
        .reviewStars {
          display: flex;
          gap: 8px;
        }
        .reviewStar {
          border: 0;
          background: transparent;
          font-size: 36px;
          line-height: 1;
          color: rgba(0, 0, 0, 0.16);
          cursor: pointer;
          padding: 0;
        }
        .reviewStar.on {
          color: rgba(255, 187, 0, 1);
        }
        .reviewTextarea {
          width: 100%;
          min-height: 140px;
          resize: vertical;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.98);
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.55;
          color: #111;
          outline: none;
        }
        .reviewErr {
          border-radius: 16px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: rgba(127, 29, 29, 0.94);
          font-size: 13px;
          font-weight: 900;
        }
        .reviewActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .alert {
          margin-top: 12px;
          border-radius: 18px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.22);
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: rgba(127, 29, 29, 1);
        }
        .alert-ico {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          flex: 0 0 auto;
        }
        .alert-t {
          font-weight: 950;
          margin-bottom: 2px;
        }
        .alert-p {
          font-size: 13px;
          color: rgba(127, 29, 29, 0.9);
        }

        .empty {
          margin-top: 12px;
          display: grid;
          place-items: center;
          min-height: 52vh;
        }
        .empty-card {
          max-width: 620px;
          width: 100%;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 26px 78px rgba(0, 0, 0, 0.1);
          padding: 18px;
        }
        .empty-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .empty-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 214, 0, 0.55);
          color: #111;
        }
        .empty-art {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          opacity: 0.65;
        }
        .art-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: 2px solid rgba(0, 0, 0, 0.35);
        }
        .art-line {
          width: 28px;
          height: 2px;
          background: rgba(0, 0, 0, 0.18);
          border-radius: 999px;
        }
        .empty-h {
          margin-top: 12px;
          font-size: 20px;
          font-weight: 950;
          color: #111;
        }
        .empty-p {
          margin-top: 8px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.7);
          line-height: 1.6;
        }
        .empty-actions {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sk {
          opacity: 1;
          transform: translateY(0);
          filter: none;
          animation: none;
        }
        .sk .sk-head {
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .sk-row {
          padding: 0 14px 14px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        .sk-items {
          padding: 0 14px 14px;
          display: flex;
          gap: 10px;
        }
        .sk-line {
          height: 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.06);
          overflow: hidden;
          position: relative;
        }
        .sk-line::after,
        .sk-img::after,
        .sk-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
          animation: shimmer 1.2s infinite;
        }
        .sk-img {
          width: 66px;
          height: 66px;
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
        }
        .sk-bar {
          height: 6px;
          background: rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
        }
        .w30 {
          width: 30%;
        }
        .w45 {
          width: 45%;
        }
        .w40 {
          width: 40%;
        }
        .w55 {
          width: 55%;
        }
        @keyframes shimmer {
          to {
            transform: translateX(100%);
          }
        }

        .toast {
          position: fixed;
          right: 16px;
          bottom: 16px;
          border-radius: 999px;
          padding: 10px 12px;
          background: rgba(17, 17, 17, 0.92);
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.25);
          z-index: 50;
        }

        @media (max-width: 1100px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .row {
            grid-template-columns: 1fr;
          }
          .kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .sk-row {
            grid-template-columns: 1fr;
          }
          .items {
            grid-template-columns: 1fr;
          }
          .img {
            width: 72px;
            height: 72px;
          }
          .summary-title {
            max-width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

export default function MisPedidosPage() {
  return (
    <Suspense fallback={null}>
      <MisPedidosContent />
    </Suspense>
  );
}
