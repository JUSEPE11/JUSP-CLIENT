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
  total_amount?: number | null;
  currency?: string | null;
  payment_id?: string | null;
  customer_name?: string | null;
  city?: string | null;
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

  const endpoint =
    `${url.replace(/\/+$/, "")}/rest/v1/orders` +
    `?select=id,status,total_amount,currency,payment_id,customer_name,city,created_at,updated_at` +
    `&id=eq.${encodeURIComponent(reference)}` +
    `&limit=1`;

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

  if (!Array.isArray(json) || json.length === 0) {
    return null;
  }

  return (json[0] as OrderRow) ?? null;
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
      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand">JUSP</div>
            <h1 className="h1">Resultado del pago</h1>
            <p className="sub">Validación real de tu compra contra la orden guardada.</p>
          </div>

          <Link className="back" href="/products">
            ← Volver a productos
          </Link>
        </div>

        <section className={`card hero ${statusTone}`}>
          <div className="pill">
            {uiStatus === "loading" && "Verificando"}
            {uiStatus === "approved" && "Aprobado"}
            {uiStatus === "pending" && "Pendiente"}
            {uiStatus === "declined" && "No aprobado"}
            {uiStatus === "error" && "Error"}
            {uiStatus === "not_found" && "Sin confirmación"}
          </div>

          <h2 className="heroTitle">
            {uiStatus === "approved" && "Tu compra fue aprobada"}
            {uiStatus === "pending" && "Tu compra sigue pendiente"}
            {uiStatus === "declined" && "Tu pago no fue aprobado"}
            {uiStatus === "loading" && "Estamos validando tu pago"}
            {uiStatus === "error" && "No pudimos validar el pago"}
            {uiStatus === "not_found" && "Aún no encontramos la orden"}
          </h2>

          <p className="heroText">{message}</p>

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
        </section>

        <section className="grid">
          <div className="card">
            <div className="cT">Detalle de verificación</div>

            <div className="kv">
              <div className="row">
                <span>Referencia</span>
                <b>{reference || "—"}</b>
              </div>

              <div className="row">
                <span>Estado</span>
                <b>{order?.status || "—"}</b>
              </div>

              <div className="row">
                <span>Intentos de verificación</span>
                <b>{pollCount}</b>
              </div>

              <div className="row">
                <span>ID de pago Wompi</span>
                <b>{order?.payment_id || "—"}</b>
              </div>

              <div className="row">
                <span>Total</span>
                <b>
                  {typeof order?.total_amount === "number"
                    ? `$${moneyCOP(order.total_amount)}`
                    : "—"}
                </b>
              </div>

              <div className="row">
                <span>Moneda</span>
                <b>{order?.currency || "COP"}</b>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cT">Qué hace JUSP aquí</div>

            <div className="list">
              <div className="li">
                <strong>Pago aprobado:</strong> vaciamos el carrito automáticamente.
              </div>
              <div className="li">
                <strong>Pago pendiente:</strong> no tocamos el carrito.
              </div>
              <div className="li">
                <strong>Pago rechazado o error:</strong> tus productos se mantienen en el carrito.
              </div>
              <div className="li">
                <strong>Fuente de verdad:</strong> el estado guardado de la orden, no solo el redirect.
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

            <section className="card hero neutral">
              <div className="pill">Verificando</div>
              <h2 className="heroTitle">Estamos validando tu pago</h2>
              <p className="heroText">
                Espera un momento mientras consultamos el estado real de tu orden.
              </p>
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
    padding-top: calc(var(--jusp-header-h, 64px) + 18px);
    padding: 18px 16px 34px;
    background:#fff;
    min-height:100vh;
  }
  .wrap{
    max-width: 1160px;
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
    letter-spacing:0.12em;
    font-size:12px;
    color:rgba(0,0,0,0.55);
  }
  .h1{
    margin:8px 0 0;
    font-size:44px;
    font-weight:950;
    letter-spacing:-0.04em;
    color:#111;
    line-height:1.02;
  }
  .sub{
    margin:8px 0 0;
    font-weight:900;
    color:rgba(0,0,0,0.62);
  }
  .back{
    text-decoration:none;
    font-weight:950;
    border-radius:999px;
    padding:12px 14px;
    border:1px solid rgba(0,0,0,0.14);
    color:#111;
    background:#fff;
    white-space:nowrap;
    height:fit-content;
  }

  .card{
    border:1px solid rgba(0,0,0,0.08);
    border-radius:22px;
    padding:16px;
    background:#fff;
  }

  .hero{
    margin-top:18px;
  }
  .hero.ok{
    border-color:rgba(0,0,0,0.12);
    background:rgba(0,0,0,0.015);
  }
  .hero.bad{
    border-color:rgba(0,0,0,0.12);
    background:rgba(0,0,0,0.02);
  }
  .hero.neutral{
    border-color:rgba(0,0,0,0.08);
    background:#fff;
  }

  .pill{
    display:inline-flex;
    align-items:center;
    border-radius:999px;
    padding:8px 12px;
    font-weight:950;
    font-size:12px;
    border:1px solid rgba(0,0,0,0.12);
    color:#111;
    background:#fff;
  }
  .heroTitle{
    margin:14px 0 0;
    font-size:34px;
    line-height:1.04;
    letter-spacing:-0.04em;
    font-weight:950;
    color:#111;
  }
  .heroText{
    margin:10px 0 0;
    font-size:14px;
    line-height:1.45;
    font-weight:900;
    color:rgba(0,0,0,0.66);
    max-width:760px;
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
    padding:14px 16px;
    font-weight:950;
    border:1px solid rgba(0,0,0,0.14);
    background:#fff;
    color:#111;
  }
  .cta.dark{
    background:rgba(17,17,17,0.92);
    color:rgba(255,255,255,0.95);
  }

  .grid{
    margin-top:18px;
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:18px;
    align-items:start;
  }

  .cT{
    font-weight:950;
    color:#111;
    font-size:16px;
  }

  .kv{
    margin-top:14px;
    display:grid;
    gap:10px;
  }
  .row{
    display:flex;
    justify-content:space-between;
    gap:12px;
    font-weight:900;
    color:rgba(0,0,0,0.7);
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
    gap:10px;
  }
  .li{
    font-weight:900;
    color:rgba(0,0,0,0.72);
    line-height:1.4;
  }
  .li strong{
    color:#111;
    font-weight:950;
  }

  @media (max-width: 980px){
    .grid{
      grid-template-columns:1fr;
    }
  }

  @media (max-width: 520px){
    .h1{
      font-size:32px;
    }
    .heroTitle{
      font-size:28px;
    }
    .top{
      flex-direction:column;
      align-items:flex-start;
    }
    .row{
      flex-direction:column;
    }
    .row b{
      text-align:left;
    }
  }
`;