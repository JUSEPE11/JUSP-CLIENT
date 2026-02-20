"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

type OrderItem = {
  id: string;
  title: string;
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
  created_at: string;
  status?: string | null;
  payment_status?: string | null;
  payment_intent_id?: string | null;
  tracking_code?: string | null;
  carrier?: string | null;
  items?: OrderItem[] | null;
  shipping_address?: ShippingAddress | null;
  paid_at?: string | null;
};

type ApiOkOne = { ok: true; order: OrderRow };
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
  if (v.includes("paid") || v.includes("succeeded") || v.includes("ok")) return "good";
  if (v.includes("pending") || v.includes("processing")) return "warn";
  if (v.includes("failed") || v.includes("canceled") || v.includes("cancelled")) return "bad";
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
  return String(s);
}

function payLabel(s?: string | null) {
  const v = String(s || "").toLowerCase();
  if (!v) return "—";
  if (v === "none") return "Sin pago";
  if (v === "pending") return "Pendiente";
  if (v === "paid") return "Pagado";
  if (v === "failed") return "Fallido";
  if (v === "refunded") return "Reembolsado";
  return String(s);
}

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function compactId(id: string) {
  const s = String(id || "");
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function normalizeParamId(raw: unknown) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = String(v || "").trim();
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Reorder PRO MAX (sin DB):
 * - Detecta un key de carrito existente si lo hay
 * - Si no hay, usa "jusp_cart"
 * - Guarda { items: [...], updatedAt }
 */
function detectCartKey(): string {
  try {
    const candidates = ["jusp_cart", "cart", "cart_v1", "jusp:cart", "jusp_cart_v1"];
    for (const k of candidates) {
      const v = localStorage.getItem(k);
      if (typeof v === "string" && v.trim()) return k;
    }
  } catch {}
  return "jusp_cart";
}

function normalizeCartItems(items: OrderItem[]) {
  const out: Array<{
    id: string;
    title: string;
    brand?: string | null;
    price: number;
    image?: string | null;
    size?: string | null;
    color?: string | null;
    qty: number;
  }> = [];

  for (const raw of items) {
    if (!raw) continue;
    const id = String(raw.id || "").trim();
    const title = String(raw.title || "").trim();
    const price = Number(raw.price);
    const qty = Number(raw.qty);

    if (!id || !title) continue;
    if (!Number.isFinite(price) || price < 0) continue;
    if (!Number.isFinite(qty) || qty <= 0 || qty > 99) continue;

    out.push({
      id,
      title,
      brand: raw.brand ?? null,
      price,
      image: raw.image ?? null,
      size: raw.size ?? null,
      color: raw.color ?? null,
      qty,
    });
  }

  return out;
}

function writeCart(items: OrderItem[]) {
  const normalized = normalizeCartItems(items);
  const key = detectCartKey();

  const payload = {
    items: normalized,
    updatedAt: new Date().toISOString(),
    source: "reorder",
  };

  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Si storage está lleno o bloqueado, al menos no crashea
  }

  return { key, count: normalized.reduce((a, it) => a + (Number(it.qty) || 0), 0) };
}

/** ✅ Tracking PRO MAX: normaliza carrier + genera URL real cuando se puede */
function normalizeCarrier(raw: string) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  const clean = s
    .replace(/\s+/g, " ")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim();

  // aliases
  if (clean.includes("dhl")) return "dhl";
  if (clean.includes("fedex") || clean.includes("fed ex")) return "fedex";
  if (clean === "ups" || clean.includes("united parcel")) return "ups";
  if (clean.includes("usps")) return "usps";
  if (clean.includes("4 72") || clean.includes("472") || clean.includes("4-72")) return "4-72";
  if (clean.includes("servientrega")) return "servientrega";
  if (clean.includes("coordinadora")) return "coordinadora";
  if (clean.includes("interrapidisimo") || clean.includes("inter rapidisimo")) return "interrapidisimo";
  return clean;
}

function carrierLabel(c: string) {
  const k = normalizeCarrier(c);
  if (!k) return "—";
  if (k === "dhl") return "DHL";
  if (k === "fedex") return "FedEx";
  if (k === "ups") return "UPS";
  if (k === "usps") return "USPS";
  if (k === "4-72") return "4-72";
  if (k === "servientrega") return "Servientrega";
  if (k === "coordinadora") return "Coordinadora";
  if (k === "interrapidisimo") return "Interrapidísimo";
  // title-ish
  return k
    .split(" ")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildTrackingUrl(carrierRaw: string, trackingRaw: string) {
  const code = String(trackingRaw || "").trim();
  if (!code) return null;

  const carrier = normalizeCarrier(carrierRaw);

  // URLs (sin prometer disponibilidad; si carrier no cuadra, fallback Google)
  if (carrier === "dhl") return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(code)}`;
  if (carrier === "fedex") return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(code)}`;
  if (carrier === "ups") return `https://www.ups.com/track?tracknum=${encodeURIComponent(code)}`;
  if (carrier === "usps") return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(code)}`;
  // Algunos couriers LATAM cambian URLs; dejamos fallback más robusto
  if (carrier === "servientrega") return `https://www.servientrega.com/wps/portal/Colombia/rastreo-envio/?guia=${encodeURIComponent(code)}`;
  if (carrier === "coordinadora") return `https://www.coordinadora.com/rastrear/?guia=${encodeURIComponent(code)}`;
  if (carrier === "interrapidisimo") return `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${encodeURIComponent(code)}`;

  return null;
}

function buildTrackingSearchUrl(carrierRaw: string, trackingRaw: string) {
  const code = String(trackingRaw || "").trim();
  if (!code) return null;
  const car = carrierRaw ? `${carrierLabel(carrierRaw)} ` : "";
  const q = `${car}${code} tracking`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export default function PedidoDetallePage() {
  const r = useRouter();
  const params = useParams();

  const id = useMemo(() => normalizeParamId((params as any)?.id), [params]);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const mounted = useRef(true);
  const toastTimer = useRef<any>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
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

    if (!id) {
      setOrder(null);
      setErr("ID inválido.");
      setLoading(false);
      return;
    }

    try {
      const url = `/api/orders/${encodeURIComponent(id)}`;

      const res = await fetch(url, {
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

      if (res.status === 404) {
        setOrder(null);
        setErr(null);
        return;
      }

      const json = (await safeJson(res)) as ApiOkOne | ApiErr | null;

      if (!res.ok || !json || (json as any).ok !== true) {
        const msg =
          (json && (json as any).error) ||
          (res.status >= 500 ? "Error del servidor al cargar el pedido." : "No se pudo cargar el pedido.");
        if (mounted.current) setErr(String(msg));
        return;
      }

      const o = (json as ApiOkOne).order;
      if (mounted.current) setOrder(o ?? null);
    } catch {
      if (mounted.current) setErr("Error de red. Revisa tu conexión.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const view = useMemo(() => {
    const o = order;
    const items = Array.isArray(o?.items) ? (o!.items as OrderItem[]) : [];
    const total = calcTotal(items);
    const countItems = items.reduce((acc, it) => acc + (Number(it?.qty) || 0), 0);

    const addr = (o?.shipping_address || {}) as ShippingAddress;
    const line1 = [addr?.address1, addr?.address2].filter(Boolean).join(" · ");
    const line2 = [addr?.city, addr?.country].filter(Boolean).join(" · ");
    const postal = addr?.postalCode ? String(addr.postalCode) : "";
    const notes = addr?.notes ? String(addr.notes) : "";

    const statusTone = pillTone(o?.status);
    const payTone = pillTone(o?.payment_status);

    const createdAt = o?.created_at ? fmtDate(o.created_at) : "—";
    const paidAt = o?.paid_at ? fmtDate(o.paid_at) : null;

    const tracking = o?.tracking_code ? String(o.tracking_code) : "";
    const carrier = o?.carrier ? String(o.carrier) : "";

    const trackingUrl = tracking ? buildTrackingUrl(carrier, tracking) : null;
    const trackingSearchUrl = tracking ? buildTrackingSearchUrl(carrier, tracking) : null;

    const pi = o?.payment_intent_id ? String(o.payment_intent_id) : "";

    const t: Array<{ label: string; when: string; done: boolean; tone: "neutral" | "good" | "warn" }> = [];
    t.push({ label: "Pedido creado", when: createdAt, done: !!o?.created_at, tone: "good" });

    const pay = String(o?.payment_status || "").toLowerCase();
    if (pay === "paid") t.push({ label: "Pago confirmado", when: paidAt || "—", done: true, tone: "good" });
    else if (pay === "pending") t.push({ label: "Pago pendiente", when: "—", done: true, tone: "warn" });
    else t.push({ label: "Pago", when: "—", done: false, tone: "neutral" });

    const st = String(o?.status || "").toLowerCase();
    t.push({ label: "Preparación", when: "—", done: st === "packed" || st === "shipped" || st === "delivered", tone: "neutral" });
    t.push({
      label: "Envío",
      when: tracking ? "Tracking asignado" : "—",
      done: st === "shipped" || st === "delivered",
      tone: tracking ? "good" : "neutral",
    });
    t.push({ label: "Entregado", when: "—", done: st === "delivered", tone: st === "delivered" ? "good" : "neutral" });

    return {
      items,
      total,
      countItems,
      line1,
      line2,
      postal,
      notes,
      statusTone,
      payTone,
      createdAt,
      paidAt,
      tracking,
      carrier,
      carrierPretty: carrierLabel(carrier),
      trackingUrl,
      trackingSearchUrl,
      pi,
      timeline: t,
    };
  }, [order]);

  const notFound = !loading && !err && id && order === null;

  return (
    <main className="pd-root">
      <div className="pd-wrap">
        <div className="pd-top">
          <div className="pd-left">
            <div className="pd-kicker">CUENTA</div>
            <h1 className="pd-title">Detalle del pedido</h1>
            <p className="pd-sub">
              Vista PRO MAX: estado, pago, tracking, envío y productos. Todo sale de tu API real <b>/api/orders/[id]</b>.
            </p>

            <div className="pd-badges">
              <span className="badge">
                ID: <span className="mono">{compactId(id || "—")}</span>
              </span>
              <span className="badge">
                Creado: <span className="mono">{loading ? "—" : view.createdAt}</span>
              </span>
            </div>
          </div>

          <div className="pd-actions">
            <Link className="btn ghost" href="/mis-pedidos">
              Volver
            </Link>

            <button className="btn" onClick={() => void load()} disabled={loading} aria-busy={loading}>
              {loading ? "Actualizando…" : "Actualizar"}
            </button>
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

        {notFound ? (
          <div className="empty">
            <div className="empty-card">
              <div className="empty-badge">Pedido no encontrado</div>
              <div className="empty-h">No existe o no pertenece a tu usuario</div>
              <div className="empty-p">
                Este ID no apareció en <b>/api/orders/[id]</b>. Puede ser un pedido viejo o de otro usuario.
              </div>
              <div className="empty-actions">
                <Link className="btn" href="/mis-pedidos">
                  Ver lista
                </Link>
                <Link className="btn ghost" href="/products">
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="sk-wrap">
            <div className="sk-card">
              <div className="sk-line w35" />
              <div className="sk-line w55" />
              <div className="sk-line w25" />
            </div>
            <div className="sk-grid">
              <div className="sk-card">
                <div className="sk-line w40" />
                <div className="sk-line w70" />
                <div className="sk-line w55" />
              </div>
              <div className="sk-card">
                <div className="sk-line w40" />
                <div className="sk-line w70" />
                <div className="sk-line w55" />
              </div>
            </div>
            <div className="sk-card">
              <div className="sk-line w40" />
              <div className="sk-line w70" />
              <div className="sk-line w55" />
              <div className="sk-line w60" />
            </div>
          </div>
        ) : order ? (
          <>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-kicker">RESUMEN</div>
                  <div className="panel-h">Pedido {compactId(String(order.id))}</div>
                  <div className="panel-p">
                    <span className={`pill ${view.statusTone}`}>{statusLabel(order.status)}</span>
                    <span className={`pill ${view.payTone}`}>{payLabel(order.payment_status)}</span>
                  </div>
                </div>

                <div className="panel-cta">
                  <button
                    className="btn small ghost"
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(String(order.id));
                        showToast("ID copiado");
                      } catch {
                        showToast("No se pudo copiar");
                      }
                    }}
                  >
                    Copiar ID
                  </button>

                  <button
                    className="btn small ghost"
                    type="button"
                    onClick={() => {
                      const pi = safeStr(order.payment_intent_id);
                      if (!pi) return showToast("No hay payment_intent_id");
                      try {
                        navigator.clipboard.writeText(pi);
                        showToast("Payment Intent copiado");
                      } catch {
                        showToast("No se pudo copiar");
                      }
                    }}
                  >
                    Copiar Payment Intent
                  </button>

                  <button
                    className="btn small ghost"
                    type="button"
                    onClick={() => {
                      const t = safeStr(order.tracking_code);
                      if (!t) return showToast("No hay tracking");
                      try {
                        navigator.clipboard.writeText(t);
                        showToast("Tracking copiado");
                      } catch {
                        showToast("No se pudo copiar");
                      }
                    }}
                  >
                    Copiar Tracking
                  </button>

                  {/* ✅ REORDER PRO MAX */}
                  <button
                    className="btn small"
                    type="button"
                    onClick={() => {
                      const items = Array.isArray(order.items) ? order.items : [];
                      if (!items.length) return showToast("Este pedido no tiene items");
                      const { count } = writeCart(items);
                      showToast(`Carrito listo (${count} items)`);
                      r.push("/products");
                    }}
                  >
                    Volver a comprar
                  </button>
                </div>
              </div>

              <div className="stats">
                <div className="stat">
                  <div className="stat-l">Total</div>
                  <div className="stat-v">${safeMoney(view.total)}</div>
                </div>
                <div className="stat">
                  <div className="stat-l">Items</div>
                  <div className="stat-v">{view.countItems}</div>
                </div>
                <div className="stat">
                  <div className="stat-l">Creado</div>
                  <div className="stat-v">{view.createdAt}</div>
                </div>
                <div className="stat">
                  <div className="stat-l">Pagado</div>
                  <div className="stat-v">{view.paidAt || "—"}</div>
                </div>
              </div>
            </div>

            <div className="grid2">
              <div className="panel">
                <div className="panel-head2">
                  <div>
                    <div className="panel-kicker">ENVÍO</div>
                    <div className="panel-h">Dirección</div>
                  </div>
                  <div className="mini">
                    <span className="mini-dot" />
                    <span>Cross-border</span>
                  </div>
                </div>

                <div className="addr">
                  <div className="addr-row">
                    <div className="addr-l">Dirección</div>
                    <div className="addr-v">{view.line1 || "—"}</div>
                  </div>
                  <div className="addr-row">
                    <div className="addr-l">Ciudad / País</div>
                    <div className="addr-v">{view.line2 || "—"}</div>
                  </div>
                  <div className="addr-row">
                    <div className="addr-l">Postal</div>
                    <div className="addr-v">{view.postal || "—"}</div>
                  </div>
                  <div className="addr-row">
                    <div className="addr-l">Notas</div>
                    <div className="addr-v">{view.notes || "—"}</div>
                  </div>
                </div>

                <div className="sep" />

                {/* ✅ Tracking PRO MAX */}
                <div className="trackbox">
                  <div className="track-top">
                    <div>
                      <div className="track-h">Tracking</div>
                      <div className="track-v">{view.tracking || "—"}</div>
                      <div className="track-s">Carrier: {view.carrierPretty}</div>
                    </div>

                    <div className="track-actions">
                      <button
                        className="btn tiny ghost"
                        type="button"
                        onClick={() => {
                          const t = safeStr(order.tracking_code);
                          if (!t) return showToast("No hay tracking");
                          try {
                            navigator.clipboard.writeText(t);
                            showToast("Tracking copiado");
                          } catch {
                            showToast("No se pudo copiar");
                          }
                        }}
                        disabled={!view.tracking}
                      >
                        Copiar
                      </button>

                      {view.trackingUrl ? (
                        <a className="btn tiny" href={view.trackingUrl} target="_blank" rel="noreferrer">
                          Ver tracking
                        </a>
                      ) : view.trackingSearchUrl ? (
                        <a className="btn tiny" href={view.trackingSearchUrl} target="_blank" rel="noreferrer">
                          Buscar tracking
                        </a>
                      ) : (
                        <button className="btn tiny" type="button" disabled>
                          Ver tracking
                        </button>
                      )}
                    </div>
                  </div>

                  {!view.tracking ? (
                    <div className="track-empty">
                      <div className="track-empty-h">Aún no asignamos el tracking</div>
                      <div className="track-empty-p">
                        Cuando tu pedido pase a <b>Enviado</b>, verás aquí el código y el link directo al courier.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="panel">
                <div className="panel-head2">
                  <div>
                    <div className="panel-kicker">PROGRESO</div>
                    <div className="panel-h">Timeline</div>
                  </div>
                  <div className="mini">
                    <span className="mini-dot" />
                    <span>Sin inventar</span>
                  </div>
                </div>

                <div className="tl">
                  {view.timeline.map((t, i) => (
                    <div key={i} className={`tl-row ${t.done ? "done" : ""}`}>
                      <div className={`tl-dot ${t.tone}`} />
                      <div className="tl-mid">
                        <div className="tl-l">{t.label}</div>
                        <div className="tl-s">{t.when}</div>
                      </div>
                      <div className="tl-r">{t.done ? "OK" : "—"}</div>
                    </div>
                  ))}
                </div>

                <div className="sep" />

                <div className="help">
                  <div className="help-h">Acciones rápidas</div>
                  <div className="help-p">
                    Si el tracking está en “—”, es porque aún no se ha asignado <b>tracking_code</b> en tu orden.
                  </div>
                  <div className="help-actions">
                    <Link className="btn small ghost" href="/account">
                      Ir a mi cuenta
                    </Link>
                    <Link className="btn small" href="/products">
                      Ver productos
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head2">
                <div>
                  <div className="panel-kicker">PRODUCTOS</div>
                  <div className="panel-h">Items del pedido</div>
                </div>
                <div className="mini">
                  <span className="mini-dot" />
                  <span>{view.items.length} líneas</span>
                </div>
              </div>

              {view.items.length ? (
                <div className="items">
                  {view.items.map((it, idx) => {
                    const title = String(it?.title || "Item");
                    const brand = it?.brand ? String(it.brand) : "";
                    const size = it?.size ? String(it.size) : "";
                    const color = it?.color ? String(it.color) : "";
                    const qty = Number(it?.qty) || 0;
                    const price = Number(it?.price) || 0;
                    const line = price * qty;

                    return (
                      <div key={(it?.id || "x") + "-" + idx} className="it">
                        <div className="it-img">
                          {it?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={String(it.image)} alt={title} loading="lazy" />
                          ) : (
                            <div className="it-noimg">—</div>
                          )}
                        </div>

                        <div className="it-mid">
                          <div className="it-t">{title}</div>
                          <div className="it-s">
                            {brand ? <span className="chip">{brand}</span> : null}
                            {size ? <span className="chip">Talla {size}</span> : null}
                            {color ? <span className="chip">{color}</span> : null}
                          </div>
                        </div>

                        <div className="it-right">
                          <div className="it-q">x{qty}</div>
                          <div className="it-p">${safeMoney(line)}</div>
                          <div className="it-u">${safeMoney(price)} c/u</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty2">
                  <div className="empty2-h">Sin items</div>
                  <div className="empty2-p">Esta orden no trae items. Revisa que tu backend esté guardando `items`.</div>
                </div>
              )}

              <div className="sep" />

              <div className="sum">
                <div className="sum-l">
                  <div className="sum-k">Subtotal (calculado)</div>
                  <div className="sum-v">${safeMoney(view.total)}</div>
                  <div className="sum-s">Nota: este total se calcula desde `items[]` (price * qty). No inventa cargos extra.</div>
                </div>

                <div className="sum-r">
                  <div className="sum-row">
                    <span>Estado</span>
                    <span className="mono">{safeStr(order.status) || "—"}</span>
                  </div>
                  <div className="sum-row">
                    <span>Pago</span>
                    <span className="mono">{safeStr(order.payment_status) || "—"}</span>
                  </div>
                  <div className="sum-row">
                    <span>Payment Intent</span>
                    <span className="mono">{compactId(view.pi || "—")}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>

      <style jsx>{`
        .pd-root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 34px;
          background: radial-gradient(1200px 600px at 20% 0%, rgba(0, 0, 0, 0.06), transparent 55%),
            radial-gradient(900px 520px at 90% 15%, rgba(0, 0, 0, 0.04), transparent 60%),
            #f7f7f7;
          min-height: 100vh;
        }
        .pd-wrap {
          max-width: 1100px;
          margin: 0 auto;
        }
        .pd-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .pd-kicker {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
        }
        .pd-title {
          margin: 6px 0 6px;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111;
        }
        .pd-sub {
          margin: 0;
          max-width: 760px;
          color: rgba(0, 0, 0, 0.72);
          font-size: 13px;
          line-height: 1.6;
        }
        .pd-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .pd-badges {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.78);
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-weight: 900;
          color: #111;
        }

        .panel {
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          margin-top: 12px;
        }
        .panel-head {
          padding: 14px 14px 10px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .panel-head2 {
          padding: 14px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .panel-kicker {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
        }
        .panel-h {
          margin-top: 6px;
          font-size: 18px;
          font-weight: 950;
          color: #111;
        }
        .panel-p {
          margin-top: 8px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .pill {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
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
        .pill.neutral {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.78);
        }

        .panel-cta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .stats {
          padding: 0 14px 14px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .stat {
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 12px;
        }
        .stat-l {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }
        .stat-v {
          margin-top: 6px;
          font-size: 16px;
          font-weight: 950;
          color: #111;
          word-break: break-word;
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }

        .mini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
          font-weight: 900;
        }
        .mini-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        .addr {
          padding: 0 14px 14px;
          display: grid;
          gap: 10px;
        }
        .addr-row {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 12px;
          align-items: baseline;
        }
        .addr-l {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }
        .addr-v {
          font-size: 13px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.78);
          word-break: break-word;
        }

        .sep {
          height: 1px;
          background: rgba(0, 0, 0, 0.06);
          margin: 0 14px;
        }

        .trackbox {
          padding: 14px;
        }
        .track-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .track-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .track-h {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }
        .track-v {
          margin-top: 8px;
          font-size: 18px;
          font-weight: 950;
          color: #111;
          word-break: break-word;
        }
        .track-s {
          margin-top: 6px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.62);
          font-weight: 900;
        }
        .track-empty {
          margin-top: 10px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.02);
          padding: 12px;
        }
        .track-empty-h {
          font-weight: 950;
          color: #111;
          font-size: 13px;
        }
        .track-empty-p {
          margin-top: 6px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.7);
          font-size: 12px;
          line-height: 1.55;
        }

        .tl {
          padding: 0 14px 14px;
          display: grid;
          gap: 10px;
        }
        .tl-row {
          display: grid;
          grid-template-columns: 10px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.02);
        }
        .tl-row.done {
          background: rgba(255, 255, 255, 0.75);
        }
        .tl-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.12);
        }
        .tl-dot.good {
          background: rgba(16, 185, 129, 0.55);
          border-color: rgba(16, 185, 129, 0.35);
        }
        .tl-dot.warn {
          background: rgba(245, 158, 11, 0.55);
          border-color: rgba(245, 158, 11, 0.35);
        }
        .tl-dot.neutral {
          background: rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 0, 0, 0.12);
        }
        .tl-mid {
          display: grid;
          gap: 3px;
        }
        .tl-l {
          font-size: 13px;
          font-weight: 950;
          color: #111;
        }
        .tl-s {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.62);
          font-weight: 900;
        }
        .tl-r {
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
        }

        .help {
          padding: 14px;
        }
        .help-h {
          font-size: 13px;
          font-weight: 950;
          color: #111;
        }
        .help-p {
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(0, 0, 0, 0.7);
        }
        .help-actions {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .items {
          padding: 0 14px 14px;
          display: grid;
          gap: 10px;
        }
        .it {
          display: grid;
          grid-template-columns: 64px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.02);
        }
        .it-img {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(255, 255, 255, 0.85);
          display: grid;
          place-items: center;
        }
        .it-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .it-noimg {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.35);
        }
        .it-mid {
          display: grid;
          gap: 6px;
        }
        .it-t {
          font-size: 14px;
          font-weight: 950;
          color: #111;
          line-height: 1.25;
        }
        .it-s {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chip {
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.85);
          color: rgba(0, 0, 0, 0.72);
        }
        .it-right {
          text-align: right;
          display: grid;
          gap: 4px;
        }
        .it-q {
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.6);
        }
        .it-p {
          font-size: 14px;
          font-weight: 950;
          color: #111;
        }
        .it-u {
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
        }

        .sum {
          padding: 14px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 12px;
          align-items: start;
        }
        .sum-k {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }
        .sum-v {
          margin-top: 6px;
          font-size: 22px;
          font-weight: 950;
          color: #111;
        }
        .sum-s {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.55;
          color: rgba(0, 0, 0, 0.65);
          font-weight: 900;
        }
        .sum-r {
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.02);
          padding: 12px;
          display: grid;
          gap: 10px;
        }
        .sum-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.7);
          font-weight: 900;
        }

        .btn {
          border: 0;
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          background: #111;
          color: #fff;
          font-size: 13px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
        }
        .btn.ghost:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .btn.small {
          padding: 10px 12px;
          font-size: 12px;
        }
        .btn.tiny {
          padding: 9px 10px;
          font-size: 12px;
        }

        .alert {
          margin-top: 12px;
          border-radius: 16px;
          padding: 12px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: rgba(127, 29, 29, 1);
        }
        .alert-ico {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(239, 68, 68, 0.18);
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

        .empty,
        .sk-wrap {
          margin-top: 12px;
        }
        .empty {
          display: grid;
          place-items: center;
          min-height: 50vh;
        }
        .empty-card {
          max-width: 560px;
          width: 100%;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
          padding: 18px;
        }
        .empty-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 214, 0, 0.55);
          color: #111;
        }
        .empty-h {
          margin-top: 10px;
          font-size: 18px;
          font-weight: 950;
          color: #111;
        }
        .empty-p {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.7);
          line-height: 1.6;
        }
        .empty-actions {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .empty2 {
          padding: 14px;
        }
        .empty2-h {
          font-size: 14px;
          font-weight: 950;
          color: #111;
        }
        .empty2-p {
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(0, 0, 0, 0.7);
        }

        .sk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }
        .sk-card {
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .sk-line {
          height: 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.06);
          overflow: hidden;
          position: relative;
        }
        .sk-line::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
          animation: shimmer 1.2s infinite;
        }
        .w25 {
          width: 25%;
        }
        .w35 {
          width: 35%;
        }
        .w40 {
          width: 40%;
        }
        .w55 {
          width: 55%;
        }
        .w60 {
          width: 60%;
        }
        .w70 {
          width: 70%;
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

        @media (max-width: 980px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
          .stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .addr-row {
            grid-template-columns: 1fr;
          }
          .sk-grid {
            grid-template-columns: 1fr;
          }
          .sum {
            grid-template-columns: 1fr;
          }
          .it {
            grid-template-columns: 64px 1fr;
          }
          .it-right {
            grid-column: 1 / -1;
            text-align: left;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: baseline;
          }
        }
      `}</style>
    </main>
  );
}