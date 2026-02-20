"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/app/components/store";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

// COP -> cents (Wompi pide amount-in-cents)
function centsCOP(cop: number) {
  return Math.round(cop) * 100;
}

const ORDERS_KEY = "jusp_orders_v1";

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state, cartTotal, cartCount } = useStore();

  const [step, setStep] = useState<"envio" | "pago">("envio");
  const [busy, setBusy] = useState(false);

  const items = state.cart;
  const canContinue = cartCount > 0;

  // ✅ Hooks SIEMPRE arriba
  const summary = useMemo(() => {
    return {
      subtotal: cartTotal,
      shipping: cartCount > 0 ? 0 : 0,
      total: cartTotal,
    };
  }, [cartTotal, cartCount]);

  // ✅ Referencia estable por visita (1 intento)
  const orderRef = useMemo(() => `JUSP-${Date.now()}`, []);

  function createOrderLocal(status: string) {
    const now = Date.now();
    const order = {
      id: orderRef,
      createdAt: now,
      status,
      currency: "COP",
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        qty: it.qty,
        price: it.price,
        color: it.color ?? null,
        size: it.size ?? null,
        image: it.image ?? null,
      })),
      totals: summary,
    };

    const prev = safeParse(localStorage.getItem(ORDERS_KEY));
    const list = Array.isArray(prev) ? prev : [];
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...list]));
    return order;
  }

  async function payWithWompiRedirect() {
    if (busy) return;
    setBusy(true);
    try {
      const amountInCents = centsCOP(summary.total);

      // ✅ Guardamos orden local como pendiente (NO vaciamos carrito aquí)
      createOrderLocal("pending_payment");

      const res = await fetch("/api/wompi/checkout-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountInCents,
          currency: "COP",
          reference: orderRef,
          // redirectUrl opcional: si no lo mandas, el API lo calcula con origin/NEXT_PUBLIC_APP_URL
          redirectPath: `/checkout/success?orderId=${encodeURIComponent(orderRef)}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.checkoutUrl) {
        alert(data?.error || "No se pudo generar el link de pago.");
        return;
      }

      window.location.href = data.checkoutUrl;
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <main className="root">
        <div className="wrap">
          <div className="top">
            <div>
              <div className="brand">JUSP</div>
              <h1 className="h1">Checkout</h1>
              <p className="sub">Resumen del pedido y datos de envío.</p>
            </div>
            <Link className="back" href="/products">
              ← Volver a productos
            </Link>
          </div>

          <div className="empty">
            <div className="eT">Tu carrito está vacío</div>
            <div className="eS">Agrega productos para continuar al checkout.</div>
            <Link className="go" href="/products">
              Ir a productos
            </Link>
          </div>
        </div>

        <style jsx>{baseCss}</style>
      </main>
    );
  }

  return (
    <main className="root">
      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand">JUSP</div>
            <h1 className="h1">Checkout</h1>
            <p className="sub">Resumen del pedido y datos de envío.</p>
          </div>
          <Link className="back" href="/products">
            ← Volver a productos
          </Link>
        </div>

        <div className="steps">
          <button className={`st ${step === "envio" ? "on" : ""}`} type="button" onClick={() => setStep("envio")}>
            1. Envío
          </button>
          <button className={`st ${step === "pago" ? "on" : ""}`} type="button" onClick={() => setStep("pago")}>
            2. Pago
          </button>
        </div>

        <div className="grid">
          <section className="left">
            {step === "envio" ? (
              <div className="card">
                <div className="cT">Datos de envío (placeholder PRO)</div>
                <div className="cS">Aquí irá tu formulario final (nombre, dirección, ciudad, teléfono, etc.).</div>

                <div className="ph">
                  <div className="line" />
                  <div className="line" />
                  <div className="line sm" />
                </div>

                <button className="cta" type="button" onClick={() => setStep("pago")} disabled={!canContinue}>
                  Continuar a pago
                </button>
              </div>
            ) : (
              <div className="card">
                <div className="cT">Pago (Wompi) — Opción B</div>
                <div className="cS">
                  Te llevamos a Wompi para completar el pago. Al finalizar, vuelves a JUSP con el <b>id</b> de la
                  transacción.
                </div>

                <div className="payBox">
                  <div className="pRow">
                    <span>Método</span>
                    <b>Wompi Checkout (redirect)</b>
                  </div>
                  <div className="pRow">
                    <span>Total a pagar</span>
                    <b>${moneyCOP(summary.total)}</b>
                  </div>
                </div>

                <button className="cta dark" type="button" disabled={busy} onClick={payWithWompiRedirect}>
                  {busy ? "Abriendo Wompi…" : "Paga con Wompi"}
                </button>

                <button className="ghost" type="button" onClick={() => setStep("envio")} disabled={busy}>
                  Volver a envío
                </button>
              </div>
            )}
          </section>

          <aside className="right">
            <div className="card">
              <div className="cT">Resumen</div>

              <div className="rows">
                {items.map((it) => (
                  <div key={`${it.id}__${it.color ?? ""}__${it.size ?? ""}`} className="it">
                    <div className="itL">
                      <div className="itN">{it.name}</div>
                      <div className="itS">
                        x{it.qty} {it.size ? `· Talla ${it.size}` : ""} {it.color ? `· ${it.color}` : ""}
                      </div>
                    </div>
                    <div className="itP">${moneyCOP(it.price * it.qty)}</div>
                  </div>
                ))}
              </div>

              <div className="sum">
                <div className="r">
                  <span>Subtotal</span>
                  <b>${moneyCOP(summary.subtotal)}</b>
                </div>
                <div className="r">
                  <span>Envío</span>
                  <b>${moneyCOP(summary.shipping)}</b>
                </div>
                <div className="r tot">
                  <span>Total</span>
                  <b>${moneyCOP(summary.total)}</b>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{baseCss}</style>
    </main>
  );
}

const baseCss = `
  .root{
    padding-top: calc(var(--jusp-header-h, 64px) + 18px);
    padding: 18px 16px 34px;
    background: #fff;
    min-height: 100vh;
  }
  .wrap{ max-width: 1160px; margin: 0 auto; }

  .top{
    display:flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .brand{
    font-weight: 950;
    letter-spacing: 0.12em;
    font-size: 12px;
    color: rgba(0,0,0,0.55);
  }
  .h1{
    margin: 8px 0 0;
    font-size: 44px;
    font-weight: 950;
    letter-spacing: -0.04em;
    color:#111;
    line-height: 1.02;
  }
  .sub{
    margin: 8px 0 0;
    font-weight: 900;
    color: rgba(0,0,0,0.62);
  }
  .back{
    text-decoration:none;
    font-weight: 950;
    border-radius: 999px;
    padding: 12px 14px;
    border: 1px solid rgba(0,0,0,0.14);
    color:#111;
    background:#fff;
    white-space: nowrap;
    height: fit-content;
  }

  .steps{
    margin-top: 18px;
    display:flex;
    gap: 10px;
    align-items:center;
  }
  .st{
    border-radius: 999px;
    padding: 10px 12px;
    font-weight: 950;
    border: 1px solid rgba(0,0,0,0.14);
    background:#fff;
    cursor:pointer;
    color: rgba(0,0,0,0.75);
  }
  .st.on{
    background: rgba(17,17,17,0.92);
    color: rgba(255,255,255,0.95);
    border-color: rgba(0,0,0,0.2);
  }

  .grid{
    margin-top: 16px;
    display:grid;
    grid-template-columns: 1fr 420px;
    gap: 18px;
    align-items:start;
  }

  .card{
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 22px;
    padding: 16px;
    background:#fff;
  }
  .cT{
    font-weight: 950;
    color:#111;
    font-size: 16px;
  }
  .cS{
    margin-top: 6px;
    font-weight: 900;
    color: rgba(0,0,0,0.62);
    font-size: 13px;
    line-height: 1.35;
  }

  .ph{ margin-top: 14px; display:grid; gap: 10px; }
  .line{
    height: 14px;
    border-radius: 999px;
    background: rgba(0,0,0,0.06);
  }
  .line.sm{ width: 55%; }

  .cta{
    margin-top: 16px;
    width: 100%;
    border-radius: 999px;
    padding: 14px 16px;
    font-weight: 950;
    border: 1px solid rgba(0,0,0,0.14);
    background: #fff;
    color:#111;
    cursor:pointer;
  }
  .cta.dark{
    background: rgba(17,17,17,0.92);
    color: rgba(255,255,255,0.95);
  }
  .cta:disabled{ opacity: 0.6; cursor:not-allowed; }

  .ghost{
    margin-top: 10px;
    width: 100%;
    border-radius: 999px;
    padding: 14px 16px;
    font-weight: 950;
    border: 1px solid rgba(0,0,0,0.14);
    background: rgba(0,0,0,0.02);
    cursor:pointer;
  }

  .rows{ margin-top: 14px; display:grid; gap: 12px; }
  .it{ display:flex; justify-content: space-between; gap: 12px; }
  .itN{ font-weight: 950; color:#111; font-size: 13px; line-height: 1.2; }
  .itS{ margin-top: 5px; font-weight: 900; color: rgba(0,0,0,0.6); font-size: 12px; }
  .itP{ font-weight: 950; color:#111; }

  .sum{
    margin-top: 16px;
    border-top: 1px solid rgba(0,0,0,0.08);
    padding-top: 14px;
    display:grid;
    gap: 10px;
  }
  .r{ display:flex; justify-content: space-between; font-weight: 900; color: rgba(0,0,0,0.7); }
  .r b{ color:#111; font-weight: 950; }
  .tot{ font-size: 15px; }
  .tot b{ font-size: 16px; }

  .payBox{
    margin-top: 14px;
    border-radius: 18px;
    background: rgba(0,0,0,0.02);
    border: 1px solid rgba(0,0,0,0.08);
    padding: 12px;
    display:grid;
    gap: 10px;
  }
  .pRow{ display:flex; justify-content: space-between; gap: 10px; font-weight: 900; color: rgba(0,0,0,0.7); }
  .pRow b{ color:#111; font-weight: 950; text-align:right; }

  .empty{
    margin-top: 18px;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 22px;
    padding: 16px;
    background: rgba(0,0,0,0.015);
    max-width: 680px;
  }
  .eT{ font-weight: 950; color:#111; font-size: 15px; }
  .eS{ margin-top: 6px; font-weight: 900; color: rgba(0,0,0,0.62); font-size: 13px; }
  .go{
    margin-top: 12px;
    display:inline-flex;
    text-decoration:none;
    font-weight: 950;
    border-radius: 999px;
    padding: 12px 14px;
    border: 1px solid rgba(0,0,0,0.14);
    color:#111;
    background:#fff;
  }

  @media (max-width: 980px){
    .grid{ grid-template-columns: 1fr; }
  }
  @media (max-width: 520px){
    .h1{ font-size: 32px; }
    .top{ flex-direction: column; align-items:flex-start; }
  }
`;