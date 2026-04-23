"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/components/store";

type UiStatus = "loading" | "approved" | "pending" | "declined" | "error" | "not_found";

type OrderRow = {
  id: string;
  status?: string | null;
  order_code?: string | null;
  total_cop?: number | null;
  total_amount?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  payment_id?: string | null;
};

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function mapOrderStatus(raw: string | null | undefined): UiStatus {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "paid") return "approved";
  if (s === "pending" || s === "created" || s === "processing" || s === "shipped") return "pending";
  if (s === "cancelled" || s === "declined" || s === "refunded") return "declined";
  if (!s) return "not_found";
  return "pending";
}

function getSupabaseEnv() {
  return {
    url: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim(),
    anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim(),
  };
}

async function fetchOrderByReference(reference: string): Promise<OrderRow | null> {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const base = `${url.replace(/\/+$/, "")}/rest/v1/orders`;
  const select =
    "id,order_code,status,total_cop,total_amount,currency,customer_email,phone,created_at,updated_at,payment_id";
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

export default function SuccessClient() {
  const params = useSearchParams();
  const { clearCart } = useStore();
  const [status, setStatus] = useState<UiStatus>("loading");
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [message, setMessage] = useState("Estamos validando el resultado final del pago…");
  const cleared = useRef(false);

  const reference = useMemo(() => (params.get("reference") || "").trim(), [params]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      if (!reference) {
        setStatus("error");
        setMessage("No encontramos la referencia del pago para verificar la orden.");
        return;
      }

      for (let attempt = 1; attempt <= 10; attempt += 1) {
        try {
          const row = await fetchOrderByReference(reference);
          if (cancelled) return;

          if (!row) {
            if (attempt < 10) {
              setStatus("loading");
              setMessage("Esperando la sincronización final de tu orden…");
              await new Promise<void>((resolve) => {
                timer = setTimeout(() => resolve(), 2200);
              });
              continue;
            }

            setStatus("not_found");
            setMessage("Todavía no encontramos la orden. Puede tardar unos segundos más.");
            return;
          }

          setOrder(row);
          const next = mapOrderStatus(row.status);
          setStatus(next);

          if (next === "approved") {
            setMessage("Tu pago fue aprobado y la orden quedó confirmada.");
            if (!cleared.current) {
              clearCart();
              cleared.current = true;
            }
            return;
          }

          if (next === "pending") {
            setMessage(
              "Tu pago sigue en validación o pasó por autenticación adicional. Wompi y JUSP aún están sincronizando el resultado."
            );
            if (attempt < 10) {
              await new Promise<void>((resolve) => {
                timer = setTimeout(() => resolve(), 2200);
              });
              continue;
            }
            return;
          }

          if (next === "declined") {
            setMessage("El pago no quedó aprobado. Tus productos permanecen protegidos para que puedas intentarlo otra vez.");
            return;
          }

          setMessage("No pudimos confirmar todavía el resultado final.");
          return;
        } catch (error: any) {
          if (cancelled) return;
          if (attempt < 10) {
            setStatus("loading");
            setMessage("Volviendo a consultar la orden para confirmar el estado…");
            await new Promise<void>((resolve) => {
              timer = setTimeout(() => resolve(), 2200);
            });
            continue;
          }

          setStatus("error");
          setMessage(error?.message || "No pudimos consultar el estado final de la orden.");
          return;
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, clearCart]);

  const total = Number(order?.total_cop ?? order?.total_amount ?? 0);
  const tone = status === "approved" ? "ok" : status === "pending" || status === "loading" ? "mid" : "bad";

  return (
    <main className="root">
      <div className="wrap">
        <div className="brand">JUSP</div>
        <h1 className="h1">
          {status === "approved"
            ? "Pago aprobado"
            : status === "pending" || status === "loading"
              ? "Pago en revisión"
              : status === "declined"
                ? "Pago no aprobado"
                : "Validación del pago"}
        </h1>
        <p className="sub">{message}</p>

        <section className="card">
          <div className={`st ${tone}`}>
            {status === "loading" ? "Verificando…" : `Estado actual: ${String(status).toUpperCase()}`}
          </div>

          <div className="rows">
            <div className="r">
              <span>Referencia</span>
              <b>{reference || "—"}</b>
            </div>
            {order?.payment_id ? (
              <div className="r">
                <span>Transacción Wompi</span>
                <b>{order.payment_id}</b>
              </div>
            ) : null}
            {total > 0 ? (
              <div className="r">
                <span>Total</span>
                <b>${moneyCOP(total)} COP</b>
              </div>
            ) : null}
            <div className="r">
              <span>Última actualización</span>
              <b>{formatDateTime(order?.updated_at || order?.created_at)}</b>
            </div>
          </div>

          <div className="hint">
            {status === "approved"
              ? "La compra quedó cerrada correctamente. Ya puedes seguir comprando o revisar tus pedidos."
              : status === "pending" || status === "loading"
                ? "Si tu banco pidió validación extra o Wompi sigue procesando el cargo, esta pantalla se estabiliza en cuanto la orden cambie a aprobada o no aprobada."
                : "Si el pago no pasó, puedes volver al checkout y probar con otra tarjeta o repetir el flujo de Wompi."}
          </div>

          <div className="btns">
            <Link className="btn" href="/mis-pedidos">
              Ver mis pedidos
            </Link>
            <Link className="btn ghost" href={status === "approved" ? "/products" : "/checkout"}>
              {status === "approved" ? "Seguir comprando" : "Volver al checkout"}
            </Link>
          </div>
        </section>
      </div>

      <style jsx>{`
        .root { padding-top: calc(var(--jusp-header-h, 64px) + 18px); padding: 18px 16px 40px; background:#fff; min-height:100vh; }
        .wrap { max-width: 980px; margin: 0 auto; }
        .brand { font-weight:950; letter-spacing:.12em; font-size:12px; color:rgba(0,0,0,.55); }
        .h1 { margin:10px 0 0; font-size:44px; font-weight:950; letter-spacing:-.04em; color:#111; line-height:1.02; }
        .sub { margin:10px 0 0; font-weight:900; color:rgba(0,0,0,.62); }
        .card { margin-top:16px; border:1px solid rgba(0,0,0,.08); border-radius:22px; padding:16px; background:#fff; }
        .st { border-radius:16px; padding:10px 12px; font-weight:950; border:1px solid rgba(0,0,0,.08); background:rgba(0,0,0,.02); color:rgba(0,0,0,.8); }
        .st.ok { background:rgba(34,197,94,.12); border-color:rgba(34,197,94,.25); }
        .st.mid { background:rgba(250,204,21,.16); border-color:rgba(250,204,21,.28); }
        .st.bad { background:rgba(239,68,68,.10); border-color:rgba(239,68,68,.25); }
        .rows { margin-top:12px; display:grid; gap:10px; }
        .r { display:flex; justify-content:space-between; gap:10px; font-weight:900; color:rgba(0,0,0,.7); }
        .r b { color:#111; font-weight:950; text-align:right; }
        .hint { margin-top:14px; border-radius:16px; padding:12px 14px; background:rgba(0,0,0,.03); border:1px solid rgba(0,0,0,.06); font-weight:800; color:rgba(0,0,0,.72); line-height:1.6; }
        .btns { margin-top:14px; display:flex; gap:10px; flex-wrap:wrap; }
        .btn { text-decoration:none; font-weight:950; border-radius:999px; padding:12px 14px; border:1px solid rgba(0,0,0,.14); color:#111; background:#fff; }
        .btn.ghost { background:rgba(0,0,0,.02); }
        @media (max-width: 520px) { .h1 { font-size:32px; } }
      `}</style>
    </main>
  );
}
