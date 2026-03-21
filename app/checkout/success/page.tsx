"use client";

import Link from "next/link";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/components/store";

type UiStatus =
  | "loading"
  | "approved"
  | "pending"
  | "declined"
  | "error"
  | "not_found";

type OrderRow = {
  id: string;
  status?: string | null;
  order_code?: string | null;
  total_cop?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function mapOrderStatus(raw: string | null | undefined): UiStatus {
  const s = String(raw || "").trim().toLowerCase();

  if (s === "paid") return "approved";
  if (s === "pending" || s === "created" || s === "processing") return "pending";
  if (s === "cancelled" || s === "declined" || s === "refunded") return "declined";
  if (!s) return "not_found";

  return "pending";
}

function getSupabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  return { url, anonKey };
}

async function fetchOrderByReference(reference: string): Promise<OrderRow | null> {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const base = `${url.replace(/\/+$/, "")}/rest/v1/orders`;
  const select =
    "id,order_code,status,total_cop,currency,customer_email,phone,created_at,updated_at";

  const endpoints = [
    `${base}?select=${select}&order_code=eq.${encodeURIComponent(reference)}&limit=1`,
    `${base}?select=${select}&id=eq.${encodeURIComponent(reference)}&limit=1`,
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const raw = await res.text();
    if (!res.ok) {
      throw new Error(raw || `Error consultando la orden (${res.status})`);
    }

    let json: unknown = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (Array.isArray(json) && json.length > 0) {
      return (json[0] as OrderRow) ?? null;
    }
  }

  return null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: UiStatus) {
  if (status === "approved") return "Aprobado";
  if (status === "pending") return "Pendiente";
  if (status === "declined") return "No aprobado";
  if (status === "loading") return "Verificando";
  if (status === "error") return "Error";
  return "Sin confirmación";
}

function statusTitle(status: UiStatus) {
  if (status === "approved") return "Compra confirmada";
  if (status === "pending") return "Pago en revisión";
  if (status === "declined") return "Pago no aprobado";
  if (status === "loading") return "Validando pago";
  if (status === "error") return "No pudimos validar el pago";
  return "Orden aún no visible";
}

function statusLead(status: UiStatus) {
  if (status === "approved") return "Tu pago fue aprobado y la orden quedó registrada correctamente en JUSP.";
  if (status === "pending") return "Wompi todavía no ha confirmado el resultado final. Tu carrito no se vacía hasta ver aprobación real.";
  if (status === "declined") return "El pago no fue aprobado. Tus productos siguen protegidos en el carrito para que puedas intentarlo otra vez.";
  if (status === "loading") return "Estamos contrastando el retorno del pago contra la orden real guardada en backend.";
  if (status === "error") return "Ocurrió un problema consultando el estado final. No estamos asumiendo nada sin evidencia real.";
  return "La orden aún puede estar propagándose. Normalmente esto tarda pocos segundos.";
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useStore();

  const [uiStatus, setUiStatus] = useState<UiStatus>("loading");
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [message, setMessage] = useState("Estamos verificando tu pago…");
  const [pollCount, setPollCount] = useState(0);

  const clearedRef = useRef(false);

  const reference = useMemo(() => {
    return (
      searchParams.get("reference") ||
      searchParams.get("orderId") ||
      searchParams.get("id") ||
      ""
    ).trim();
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      if (!reference) {
        setUiStatus("error");
        setMessage("No encontramos la referencia de la compra en el retorno de Wompi.");
        return;
      }

      for (let attempt = 1; attempt <= 12; attempt += 1) {
        if (cancelled) return;

        setPollCount(attempt);

        try {
          const row = await fetchOrderByReference(reference);

          if (cancelled) return;

          if (!row) {
            if (attempt < 12) {
              setUiStatus("loading");
              setMessage("Estamos esperando la confirmación de tu compra…");
              await new Promise<void>((resolve) => {
                timer = setTimeout(() => resolve(), 2500);
              });
              continue;
            }

            setUiStatus("not_found");
            setMessage("Todavía no encontramos la orden. Puede tardar unos segundos en reflejarse.");
            return;
          }

          setOrder(row);

          const nextStatus = mapOrderStatus(row.status);

          if (nextStatus === "approved") {
            setUiStatus("approved");
            setMessage("Pago aprobado. Tu orden ya fue confirmada.");
            if (!clearedRef.current) {
              clearCart();
              clearedRef.current = true;
            }
            return;
          }

          if (nextStatus === "declined") {
            setUiStatus("declined");
            setMessage("El pago no fue aprobado. Tus productos siguen en el carrito.");
            return;
          }

          if (nextStatus === "pending") {
            if (attempt < 12) {
              setUiStatus("pending");
              setMessage("Tu pago aún está pendiente de confirmación. Estamos revisando…");
              await new Promise<void>((resolve) => {
                timer = setTimeout(() => resolve(), 2500);
              });
              continue;
            }

            setUiStatus("pending");
            setMessage("Tu pago sigue pendiente. No vaciamos el carrito hasta que Wompi lo apruebe.");
            return;
          }

          setUiStatus("not_found");
          setMessage("No pudimos determinar el estado final de tu compra todavía.");
          return;
        } catch (e: any) {
          if (cancelled) return;

          if (attempt < 12) {
            setUiStatus("loading");
            setMessage("Verificando el estado final del pago…");
            await new Promise<void>((resolve) => {
              timer = setTimeout(() => resolve(), 2500);
            });
            continue;
          }

          setUiStatus("error");
          setMessage(e?.message || "Ocurrió un error verificando el pago. Tus productos siguen en el carrito.");
          return;
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, clearCart]);

  const statusTone = useMemo(() => {
    if (uiStatus === "approved") return "ok";
    if (uiStatus === "declined" || uiStatus === "error") return "bad";
    return "neutral";
  }, [uiStatus]);

  return (
    <main className="root">
      <div className="bgGlow bgGlowA" />
      <div className="bgGlow bgGlowB" />

      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand">JUSP</div>
            <h1 className="h1">Resultado del pago</h1>
            <p className="sub">Validación real contra tu orden guardada en backend.</p>
          </div>

          <Link className="back" href="/products">
            ← Volver a productos
          </Link>
        </div>

        <section className={`hero ${statusTone}`}>
          <div className="heroTop">
            <div className="heroBadge">
              <span className="heroDot" />
              {statusLabel(uiStatus)}
            </div>

            <div className="heroRef">
              {reference ? (
                <>
                  <span>Referencia</span>
                  <b>{reference}</b>
                </>
              ) : (
                <>
                  <span>Referencia</span>
                  <b>—</b>
                </>
              )}
            </div>
          </div>

          <div className="heroGrid">
            <div className="heroMain">
              <h2 className="heroTitle">{statusTitle(uiStatus)}</h2>
              <p className="heroLead">{statusLead(uiStatus)}</p>
              <p className="heroText">{message}</p>

              <div className="heroMetaWrap">
                <div className="heroMetaCard">
                  <span>Pedido JUSP</span>
                  <b>{order?.order_code || "—"}</b>
                </div>

                <div className="heroMetaCard">
                  <span>Correo</span>
                  <b>{order?.customer_email || "—"}</b>
                </div>

                <div className="heroMetaCard">
                  <span>Total</span>
                  <b>{typeof order?.total_cop === "number" ? `$${moneyCOP(order.total_cop)}` : "—"}</b>
                </div>

                <div className="heroMetaCard">
                  <span>Actualizado</span>
                  <b>{formatDateTime(order?.updated_at || order?.created_at)}</b>
                </div>
              </div>

              <div className="actions">
                <Link className="cta dark" href="/products">
                  Seguir comprando
                </Link>

                {uiStatus === "approved" ? (
                  <Link className="cta" href="/orders">
                    Ver mis pedidos
                  </Link>
                ) : (
                  <Link className="cta" href="/checkout">
                    Volver al checkout
                  </Link>
                )}
              </div>
            </div>

            <div className="heroSide">
              <div className="signalCard">
                <div className="signalKicker">Señal actual</div>
                <div className="signalValue">{statusLabel(uiStatus)}</div>
                <div className="signalSub">
                  {uiStatus === "approved" && "Orden confirmada correctamente."}
                  {uiStatus === "pending" && "Seguimiento en espera de confirmación real."}
                  {uiStatus === "declined" && "Pago no aprobado por el procesador."}
                  {uiStatus === "loading" && "Comparando retorno vs backend."}
                  {uiStatus === "error" && "No hay validación concluyente todavía."}
                  {uiStatus === "not_found" && "La orden aún no es visible."}
                </div>
              </div>

              <div className="signalMiniGrid">
                <div className="mini">
                  <span>Intentos</span>
                  <b>{pollCount}</b>
                </div>
                <div className="mini">
                  <span>Estado DB</span>
                  <b>{order?.status || "—"}</b>
                </div>
                <div className="mini">
                  <span>Moneda</span>
                  <b>{order?.currency || "COP"}</b>
                </div>
                <div className="mini">
                  <span>Teléfono</span>
                  <b>{order?.phone || "—"}</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="detailGrid">
          <div className="card glass">
            <div className="cT">Detalle de verificación</div>

            <div className="kv">
              <div className="row">
                <span>Referencia</span>
                <b>{reference || "—"}</b>
              </div>

              <div className="row">
                <span>Estado guardado</span>
                <b>{order?.status || "—"}</b>
              </div>

              <div className="row">
                <span>Pedido JUSP</span>
                <b>{order?.order_code || "—"}</b>
              </div>

              <div className="row">
                <span>Total</span>
                <b>{typeof order?.total_cop === "number" ? `$${moneyCOP(order.total_cop)}` : "—"}</b>
              </div>

              <div className="row">
                <span>Moneda</span>
                <b>{order?.currency || "COP"}</b>
              </div>

              <div className="row">
                <span>Creado</span>
                <b>{formatDateTime(order?.created_at)}</b>
              </div>

              <div className="row">
                <span>Última actualización</span>
                <b>{formatDateTime(order?.updated_at)}</b>
              </div>
            </div>
          </div>

          <div className="card glass">
            <div className="cT">Qué hace JUSP aquí</div>

            <div className="list">
              <div className="li">
                <strong>Pago aprobado:</strong> vaciamos el carrito automáticamente y dejamos la orden lista para seguimiento.
              </div>
              <div className="li">
                <strong>Pago pendiente:</strong> mantenemos el carrito intacto hasta ver aprobación real, no por apariencia.
              </div>
              <div className="li">
                <strong>Pago rechazado o error:</strong> no destruimos tu carrito y te dejamos volver a intentar.
              </div>
              <div className="li">
                <strong>Fuente de verdad:</strong> manda la orden en base de datos, no solo el redirect del procesador.
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{baseCss}</style>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="root">
          <div className="bgGlow bgGlowA" />
          <div className="bgGlow bgGlowB" />

          <div className="wrap">
            <div className="top">
              <div>
                <div className="brand">JUSP</div>
                <h1 className="h1">Resultado del pago</h1>
                <p className="sub">Estamos verificando tu compra…</p>
              </div>

              <Link className="back" href="/products">
                ← Volver a productos
              </Link>
            </div>

            <section className="hero neutral">
              <div className="heroTop">
                <div className="heroBadge">
                  <span className="heroDot" />
                  Verificando
                </div>
              </div>

              <div className="heroGrid">
                <div className="heroMain">
                  <h2 className="heroTitle">Estamos validando tu pago</h2>
                  <p className="heroLead">Consultando el estado real de la orden en backend.</p>
                  <p className="heroText">Espera un momento mientras contrastamos la compra contra la orden guardada.</p>
                </div>

                <div className="heroSide">
                  <div className="signalCard">
                    <div className="signalKicker">Señal actual</div>
                    <div className="signalValue">Verificando</div>
                    <div className="signalSub">Esto puede tardar unos segundos.</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <style jsx>{baseCss}</style>
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

const baseCss = `
  .root{
    position:relative;
    overflow:hidden;
    padding-top: calc(var(--jusp-header-h, 64px) + 18px);
    padding: 18px 16px 40px;
    background:
      radial-gradient(circle at top left, rgba(255,214,10,0.08), transparent 28%),
      radial-gradient(circle at top right, rgba(0,0,0,0.05), transparent 34%),
      linear-gradient(180deg, #ffffff 0%, #f7f7f8 100%);
    min-height:100vh;
  }
  .bgGlow{
    position:absolute;
    border-radius:999px;
    filter: blur(70px);
    pointer-events:none;
    opacity:0.5;
  }
  .bgGlowA{
    width:260px;
    height:260px;
    top:110px;
    left:-70px;
    background: rgba(255,214,10,0.16);
  }
  .bgGlowB{
    width:280px;
    height:280px;
    right:-90px;
    top:180px;
    background: rgba(17,17,17,0.06);
  }

  .wrap{
    position:relative;
    z-index:1;
    max-width: 1180px;
    margin: 0 auto;
  }
  .top{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
  }
  .brand{
    font-weight:950;
    letter-spacing:0.16em;
    font-size:12px;
    color:rgba(0,0,0,0.5);
  }
  .h1{
    margin:8px 0 0;
    font-size:52px;
    font-weight:1000;
    letter-spacing:-0.05em;
    color:#0f0f10;
    line-height:0.98;
  }
  .sub{
    margin:10px 0 0;
    font-weight:900;
    color:rgba(0,0,0,0.62);
    font-size:15px;
  }
  .back{
    text-decoration:none;
    font-weight:950;
    border-radius:999px;
    padding:12px 16px;
    border:1px solid rgba(0,0,0,0.1);
    color:#111;
    background:rgba(255,255,255,0.82);
    backdrop-filter: blur(14px);
    white-space:nowrap;
    height:fit-content;
    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  }

  .hero{
    margin-top:20px;
    border-radius:30px;
    padding:24px;
    border:1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.76);
    backdrop-filter: blur(18px);
    box-shadow:
      0 20px 60px rgba(0,0,0,0.08),
      inset 0 1px 0 rgba(255,255,255,0.7);
  }
  .hero.ok{
    background:
      linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,248,248,0.82)),
      radial-gradient(circle at top left, rgba(255,214,10,0.14), transparent 30%);
    border-color: rgba(0,0,0,0.08);
  }
  .hero.bad{
    background:
      linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,248,248,0.84)),
      radial-gradient(circle at top left, rgba(0,0,0,0.05), transparent 28%);
    border-color: rgba(0,0,0,0.1);
  }
  .hero.neutral{
    background:
      linear-gradient(135deg, rgba(255,255,255,0.92), rgba(249,249,250,0.84)),
      radial-gradient(circle at top left, rgba(255,214,10,0.1), transparent 28%);
  }

  .heroTop{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
    flex-wrap:wrap;
  }
  .heroBadge{
    display:inline-flex;
    align-items:center;
    gap:10px;
    border-radius:999px;
    padding:10px 14px;
    font-weight:950;
    font-size:12px;
    letter-spacing:0.04em;
    text-transform:uppercase;
    border:1px solid rgba(0,0,0,0.1);
    color:#111;
    background:rgba(255,255,255,0.9);
    box-shadow: 0 8px 22px rgba(0,0,0,0.05);
  }
  .heroDot{
    width:10px;
    height:10px;
    border-radius:999px;
    background:#111;
    box-shadow: 0 0 0 6px rgba(17,17,17,0.08);
  }
  .heroRef{
    display:grid;
    gap:3px;
    text-align:right;
  }
  .heroRef span{
    font-size:11px;
    font-weight:900;
    letter-spacing:0.08em;
    text-transform:uppercase;
    color:rgba(0,0,0,0.45);
  }
  .heroRef b{
    font-size:14px;
    font-weight:950;
    color:#111;
    word-break:break-word;
  }

  .heroGrid{
    margin-top:18px;
    display:grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
    gap:18px;
    align-items:stretch;
  }
  .heroMain{
    min-width:0;
  }
  .heroTitle{
    margin:0;
    font-size:48px;
    line-height:0.98;
    letter-spacing:-0.05em;
    font-weight:1000;
    color:#0f0f10;
    max-width:760px;
  }
  .heroLead{
    margin:14px 0 0;
    font-size:18px;
    line-height:1.35;
    font-weight:950;
    color:#18181a;
    max-width:820px;
  }
  .heroText{
    margin:10px 0 0;
    font-size:14px;
    line-height:1.6;
    font-weight:900;
    color:rgba(0,0,0,0.62);
    max-width:760px;
  }

  .heroMetaWrap{
    margin-top:18px;
    display:grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap:12px;
  }
  .heroMetaCard{
    border-radius:18px;
    padding:14px 14px;
    border:1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.8);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
    min-width:0;
  }
  .heroMetaCard span{
    display:block;
    font-size:11px;
    font-weight:900;
    letter-spacing:0.08em;
    text-transform:uppercase;
    color:rgba(0,0,0,0.46);
  }
  .heroMetaCard b{
    display:block;
    margin-top:8px;
    font-size:14px;
    line-height:1.35;
    font-weight:950;
    color:#111;
    word-break:break-word;
  }

  .actions{
    margin-top:18px;
    display:flex;
    flex-wrap:wrap;
    gap:10px;
  }
  .cta{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    text-decoration:none;
    border-radius:999px;
    padding:14px 18px;
    font-weight:950;
    border:1px solid rgba(0,0,0,0.12);
    background:rgba(255,255,255,0.84);
    color:#111;
    box-shadow: 0 12px 30px rgba(0,0,0,0.06);
  }
  .cta.dark{
    background:rgba(17,17,17,0.94);
    color:rgba(255,255,255,0.96);
    border-color: rgba(17,17,17,0.94);
  }

  .heroSide{
    display:grid;
    gap:12px;
    align-content:start;
  }
  .signalCard{
    border-radius:24px;
    padding:18px;
    border:1px solid rgba(0,0,0,0.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,250,0.82));
    box-shadow:
      0 14px 36px rgba(0,0,0,0.06),
      inset 0 1px 0 rgba(255,255,255,0.72);
  }
  .signalKicker{
    font-size:11px;
    font-weight:900;
    letter-spacing:0.08em;
    text-transform:uppercase;
    color:rgba(0,0,0,0.46);
  }
  .signalValue{
    margin-top:8px;
    font-size:28px;
    line-height:1;
    letter-spacing:-0.04em;
    font-weight:1000;
    color:#111;
  }
  .signalSub{
    margin-top:10px;
    font-size:13px;
    line-height:1.55;
    font-weight:900;
    color:rgba(0,0,0,0.62);
  }

  .signalMiniGrid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:12px;
  }
  .mini{
    border-radius:18px;
    padding:14px;
    border:1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.8);
  }
  .mini span{
    display:block;
    font-size:11px;
    font-weight:900;
    letter-spacing:0.08em;
    text-transform:uppercase;
    color:rgba(0,0,0,0.46);
  }
  .mini b{
    display:block;
    margin-top:8px;
    font-size:14px;
    line-height:1.35;
    font-weight:950;
    color:#111;
    word-break:break-word;
  }

  .detailGrid{
    margin-top:18px;
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:18px;
    align-items:start;
  }
  .card.glass{
    border-radius:24px;
    padding:18px;
    border:1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.78);
    backdrop-filter: blur(16px);
    box-shadow:
      0 18px 42px rgba(0,0,0,0.05),
      inset 0 1px 0 rgba(255,255,255,0.72);
  }

  .cT{
    font-weight:950;
    color:#111;
    font-size:18px;
    letter-spacing:-0.02em;
  }

  .kv{
    margin-top:14px;
    display:grid;
    gap:12px;
  }
  .row{
    display:flex;
    justify-content:space-between;
    gap:12px;
    font-weight:900;
    color:rgba(0,0,0,0.68);
    padding-bottom:12px;
    border-bottom:1px solid rgba(0,0,0,0.06);
  }
  .row:last-child{
    border-bottom:0;
    padding-bottom:0;
  }
  .row b{
    color:#111;
    font-weight:950;
    text-align:right;
    word-break:break-word;
  }

  .list{
    margin-top:14px;
    display:grid;
    gap:12px;
  }
  .li{
    padding:14px 14px;
    border-radius:16px;
    background: rgba(0,0,0,0.025);
    border:1px solid rgba(0,0,0,0.06);
    font-weight:900;
    color:rgba(0,0,0,0.72);
    line-height:1.55;
  }
  .li strong{
    color:#111;
    font-weight:950;
  }

  @media (max-width: 980px){
    .heroGrid,
    .detailGrid{
      grid-template-columns:1fr;
    }
  }

  @media (max-width: 720px){
    .h1{
      font-size:38px;
    }
    .heroTitle{
      font-size:34px;
    }
    .heroMetaWrap{
      grid-template-columns:1fr;
    }
  }

  @media (max-width: 520px){
    .top{
      flex-direction:column;
      align-items:flex-start;
    }
    .hero{
      padding:18px;
      border-radius:24px;
    }
    .heroTop{
      flex-direction:column;
      align-items:flex-start;
    }
    .heroRef{
      text-align:left;
    }
    .signalMiniGrid{
      grid-template-columns:1fr;
    }
    .row{
      flex-direction:column;
    }
    .row b{
      text-align:left;
    }
  }
`;