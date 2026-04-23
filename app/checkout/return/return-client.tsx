"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/components/store";

type TxStatus = "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING" | "UNKNOWN";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function mapTxTitle(status: TxStatus) {
  if (status === "APPROVED") return "Pago aprobado";
  if (status === "PENDING") return "Pago en validación";
  if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") return "Pago no aprobado";
  return "Resultado del pago";
}

function mapLead(status: TxStatus) {
  if (status === "APPROVED") {
    return "Wompi confirmó el cobro y JUSP ya puede sincronizar la orden final.";
  }
  if (status === "PENDING") {
    return "El pago sigue en proceso o pasó por autenticación adicional. En cuanto Wompi cierre el resultado, la orden se actualiza.";
  }
  if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
    return "El pago no quedó aprobado. Puedes volver al checkout y probar otra vez.";
  }
  return "Estamos verificando el estado real de la transacción en Wompi.";
}

export default function ReturnClient() {
  const sp = useSearchParams();
  const { clearCart } = useStore();
  const clearedRef = useRef(false);

  const txId = (sp.get("id") || "").trim();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TxStatus>("UNKNOWN");
  const [amount, setAmount] = useState<number | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!txId) return;

    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const res = await fetch(`https://production.wompi.co/v1/transactions/${encodeURIComponent(txId)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error?.reason || "No se pudo consultar la transacción en Wompi.");
        }

        const rawStatus = String(data?.data?.status || "UNKNOWN").toUpperCase();
        const txStatus = ["APPROVED", "DECLINED", "VOIDED", "ERROR", "PENDING"].includes(rawStatus)
          ? (rawStatus as TxStatus)
          : "UNKNOWN";
        const reference = data?.data?.reference ? String(data.data.reference) : null;
        const amountInCents = Number(data?.data?.amount_in_cents);
        const extra = data?.data?.payment_method?.extra || {};
        const authUrl =
          String(data?.data?.redirect_url || extra?.async_payment_url || extra?.redirect_url || "").trim() || null;

        if (cancelled) return;

        setStatus(txStatus);
        setRef(reference);
        setAmount(Number.isFinite(amountInCents) ? amountInCents / 100 : null);
        setNextUrl(authUrl);

        if (txStatus === "APPROVED" && !clearedRef.current) {
          clearCart();
          clearedRef.current = true;
        }
      } catch (error: any) {
        if (!cancelled) {
          setErr(error?.message || "Error consultando el estado de la transacción.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [txId, clearCart]);

  const tone =
    status === "APPROVED" ? "ok" : status === "PENDING" || loading ? "mid" : "bad";
  const title = mapTxTitle(status);
  const lead = mapLead(status);

  return (
    <main className="root">
      <div className="wrap">
        <div className="brand">JUSP</div>
        <h1 className="h1">{title}</h1>
        <p className="sub">{lead}</p>

        <section className="card">
          <div className={`st ${tone}`}>
            {loading ? "Consultando Wompi…" : `Estado reportado por Wompi: ${status}`}
          </div>

          <div className="rows">
            {ref ? (
              <div className="r">
                <span>Referencia</span>
                <b>{ref}</b>
              </div>
            ) : null}
            {amount != null ? (
              <div className="r">
                <span>Monto</span>
                <b>${moneyCOP(amount)} COP</b>
              </div>
            ) : null}
            {txId ? (
              <div className="r">
                <span>Transacción</span>
                <b>{txId}</b>
              </div>
            ) : null}
          </div>

          {status === "PENDING" ? (
            <div className="hint">
              Si este cargo pasó por validación 3DS o confirmación bancaria, Wompi puede tardar un poco más en cerrar
              el resultado final.
            </div>
          ) : null}

          {nextUrl ? (
            <a className="cta" href={nextUrl} target="_self" rel="noreferrer">
              Continuar validación segura en Wompi
            </a>
          ) : null}

          {err ? <div className="err">{err}</div> : null}

          <div className="btns">
            <Link className="btn" href="/mis-pedidos">
              Ver mis pedidos
            </Link>
            <Link className="btn ghost" href={status === "APPROVED" ? "/products" : "/checkout"}>
              {status === "APPROVED" ? "Seguir comprando" : "Volver al checkout"}
            </Link>
          </div>
        </section>
      </div>

      <style jsx>{`
        .root { padding-top: calc(var(--jusp-header-h, 64px) + 18px); padding: 18px 16px 34px; background: #fff; min-height: 100vh; }
        .wrap { max-width: 980px; margin: 0 auto; }
        .brand { font-weight: 950; letter-spacing: 0.12em; font-size: 12px; color: rgba(0,0,0,.55); }
        .h1 { margin: 10px 0 0; font-size: 40px; font-weight: 950; letter-spacing: -0.04em; color: #111; line-height: 1.02; }
        .sub { margin: 10px 0 0; font-weight: 900; color: rgba(0,0,0,.62); }
        .card { margin-top: 16px; border: 1px solid rgba(0,0,0,.08); border-radius: 22px; padding: 16px; background: #fff; }
        .st { border-radius: 16px; padding: 10px 12px; font-weight: 950; border: 1px solid rgba(0,0,0,.08); background: rgba(0,0,0,.02); color: rgba(0,0,0,.8); }
        .st.ok { background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.25); }
        .st.mid { background: rgba(250,204,21,.16); border-color: rgba(250,204,21,.28); }
        .st.bad { background: rgba(239,68,68,.10); border-color: rgba(239,68,68,.25); }
        .rows { margin-top: 12px; display: grid; gap: 10px; }
        .r { display: flex; justify-content: space-between; gap: 10px; font-weight: 900; color: rgba(0,0,0,.7); }
        .r b { color: #111; font-weight: 950; text-align: right; }
        .hint { margin-top: 14px; border-radius: 16px; padding: 12px 14px; background: rgba(250,204,21,.12); border: 1px solid rgba(250,204,21,.28); font-weight: 800; color: rgba(0,0,0,.74); line-height: 1.6; }
        .cta { margin-top: 14px; display: inline-flex; text-decoration: none; align-items: center; justify-content: center; min-height: 48px; border-radius: 999px; padding: 0 18px; background: linear-gradient(135deg,#121212 0%,#1b1612 100%); color: #fff; font-size: 14px; font-weight: 950; }
        .err { margin-top: 12px; border-radius: 16px; padding: 10px 12px; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); font-weight: 900; color: rgba(0,0,0,.75); font-size: 13px; }
        .btns { margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { text-decoration: none; font-weight: 950; border-radius: 999px; padding: 12px 14px; border: 1px solid rgba(0,0,0,.14); color: #111; background: #fff; }
        .btn.ghost { background: rgba(0,0,0,.02); }
        @media (max-width: 520px) { .h1 { font-size: 30px; } }
      `}</style>
    </main>
  );
}
