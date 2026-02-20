"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/components/store";

const ORDERS_KEY = "jusp_orders_v1";

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

type TxStatus =
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR"
  | "PENDING"
  | "UNKNOWN";

export default function ReturnClient() {
  const sp = useSearchParams();
  const { clearCart } = useStore();

  const txId = (sp.get("id") || "").trim(); // Wompi manda ?id=TRANSACTION_ID
  const local = sp.get("local") === "1";
  const localRef = (sp.get("ref") || "").trim();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TxStatus>("UNKNOWN");
  const [amount, setAmount] = useState<number | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => {
    if (local) return "Orden creada (local)";
    return "Resultado del pago (Wompi)";
  }, [local]);

  useEffect(() => {
    if (local) {
      setStatus("APPROVED");
      setRef(localRef || null);
      return;
    }

    if (!txId) return;

    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const res = await fetch(
          `https://production.wompi.co/v1/transactions/${encodeURIComponent(txId)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error?.reason || "No se pudo consultar la transacción"
          );
        }

        const s = String(data?.data?.status || "UNKNOWN").toUpperCase();
        const reference = data?.data?.reference
          ? String(data.data.reference)
          : null;
        const amountInCents = Number(data?.data?.amount_in_cents);
        const amountCOP = Number.isFinite(amountInCents)
          ? amountInCents / 100
          : null;

        if (!cancelled) {
          setStatus(
            ["APPROVED", "DECLINED", "VOIDED", "ERROR", "PENDING"].includes(s)
              ? (s as TxStatus)
              : "UNKNOWN"
          );
          setRef(reference);
          setAmount(amountCOP);
        }

        if (!cancelled && s === "APPROVED") {
          clearCart();
        }

        if (reference) {
          const prev = safeParse(localStorage.getItem(ORDERS_KEY));
          const list = Array.isArray(prev) ? prev : [];
          const next = list.map((o: any) => {
            if (o?.id === reference) {
              return {
                ...o,
                wompiTransactionId: txId,
                status:
                  s === "APPROVED"
                    ? "paid"
                    : s === "DECLINED"
                    ? "declined"
                    : s === "ERROR"
                    ? "error"
                    : "pending_payment",
              };
            }
            return o;
          });
          localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
        }
      } catch (e: any) {
        if (!cancelled)
          setErr(e?.message || "Error consultando estado de la transacción");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [txId, local, localRef, clearCart]);

  return (
    <main className="root">
      <div className="wrap">
        <div className="top">
          <div className="brand">JUSP</div>
          <h1 className="h1">{title}</h1>
          <p className="sub">
            {local
              ? "Pago simulado. (Solo para pruebas internas.)"
              : "Wompi te devuelve aquí con el id de transacción. Consultamos y mostramos el estado real."}
          </p>
        </div>

        <div className="card">
          {!local && !txId ? (
            <>
              <div className="st bad">
                No encontramos el ID de la transacción.
              </div>
              <div className="muted">Vuelve al checkout y genera un pago nuevo.</div>
            </>
          ) : (
            <>
              <div
                className={`st ${
                  status === "APPROVED"
                    ? "ok"
                    : status === "PENDING"
                    ? "mid"
                    : "bad"
                }`}
              >
                {loading ? "Consultando…" : `Estado: ${status}`}
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

                {!local && txId ? (
                  <div className="r">
                    <span>Transacción</span>
                    <b>{txId}</b>
                  </div>
                ) : null}
              </div>

              {err ? <div className="err">{err}</div> : null}
            </>
          )}

          <div className="btns">
            <Link className="btn" href="/products">
              Seguir comprando
            </Link>
            <Link className="btn ghost" href="/checkout">
              Volver al checkout
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding: 18px 16px 34px;
          background: #fff;
          min-height: 100vh;
        }
        .wrap {
          max-width: 980px;
          margin: 0 auto;
        }
        .brand {
          font-weight: 950;
          letter-spacing: 0.12em;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
        }
        .h1 {
          margin: 10px 0 0;
          font-size: 40px;
          font-weight: 950;
          letter-spacing: -0.04em;
          color: #111;
          line-height: 1.02;
        }
        .sub {
          margin: 10px 0 0;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
        }
        .card {
          margin-top: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 22px;
          padding: 16px;
          background: #fff;
        }
        .st {
          border-radius: 16px;
          padding: 10px 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.8);
        }
        .st.ok {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.25);
        }
        .st.mid {
          background: rgba(250, 204, 21, 0.16);
          border-color: rgba(250, 204, 21, 0.28);
        }
        .st.bad {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.25);
        }
        .muted {
          margin-top: 10px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
        }
        .rows {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }
        .r {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.7);
        }
        .r b {
          color: #111;
          font-weight: 950;
          text-align: right;
        }
        .err {
          margin-top: 12px;
          border-radius: 16px;
          padding: 10px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          font-weight: 900;
          color: rgba(0, 0, 0, 0.75);
          font-size: 13px;
        }
        .btns {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn {
          text-decoration: none;
          font-weight: 950;
          border-radius: 999px;
          padding: 12px 14px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          color: #111;
          background: #fff;
        }
        .btn.ghost {
          background: rgba(0, 0, 0, 0.02);
        }
        @media (max-width: 520px) {
          .h1 {
            font-size: 30px;
          }
        }
      `}</style>
    </main>
  );
}
