// app/checkout/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "@/app/components/store";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

// COP -> cents (Wompi pide amount-in-cents)
function centsCOP(cop: number) {
  return Math.round(cop) * 100;
}

const ORDERS_KEY = "jusp_orders_v1";
const SHIPPING_KEY = "jusp_checkout_shipping_v1";

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

type Shipping = {
  fullName: string;
  phone: string;
  city: string;
  region: string;
  addressLine1: string;
  notes: string;
};

function emptyShipping(): Shipping {
  return {
    fullName: "",
    phone: "",
    city: "",
    region: "",
    addressLine1: "",
    notes: "",
  };
}

export default function CheckoutPage() {
  const { state, cartTotal, cartCount, clearCart } = useStore();

  const [step, setStep] = useState<"envio" | "pago">("envio");
  const [busy, setBusy] = useState(false);

  // ✅ Envío (mínimo PRO MAX)
  const [ship, setShip] = useState<Shipping>(emptyShipping());

  const items = state.cart;
  const canContinue = cartCount > 0;

  // ✅ Hooks arriba
  const summary = useMemo(() => {
    return {
      subtotal: cartTotal,
      shipping: cartCount > 0 ? 0 : 0,
      total: cartTotal,
    };
  }, [cartTotal, cartCount]);

  const orderRef = useMemo(() => `JUSP-${Date.now()}`, []);

  // Load shipping draft
  useEffect(() => {
    const prev = safeParse(localStorage.getItem(SHIPPING_KEY));
    if (prev && typeof prev === "object") {
      setShip({
        fullName: String((prev as any).fullName || ""),
        phone: String((prev as any).phone || ""),
        city: String((prev as any).city || ""),
        region: String((prev as any).region || ""),
        addressLine1: String((prev as any).addressLine1 || ""),
        notes: String((prev as any).notes || ""),
      });
    }
  }, []);

  // Save shipping draft
  useEffect(() => {
    try {
      localStorage.setItem(SHIPPING_KEY, JSON.stringify(ship));
    } catch {}
  }, [ship]);

  const shipOk = useMemo(() => {
    const fullName = ship.fullName.trim();
    const phone = ship.phone.trim();
    const city = ship.city.trim();
    const address = ship.addressLine1.trim();
    return Boolean(fullName && phone && city && address);
  }, [ship]);

  function createOrderLocal(status: string) {
    const now = Date.now();
    const order = {
      id: orderRef,
      createdAt: now,
      status,
      currency: "COP",
      shipping: {
        fullName: ship.fullName.trim(),
        phone: ship.phone.trim(),
        city: ship.city.trim(),
        region: ship.region.trim() || null,
        addressLine1: ship.addressLine1.trim(),
        notes: ship.notes.trim() || null,
      },
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

    if (!shipOk) {
      alert("Completa los datos de envío antes de pagar (nombre, teléfono, ciudad y dirección).");
      setStep("envio");
      return;
    }

    setBusy(true);
    try {
      const amountInCents = centsCOP(summary.total);

      const res = await fetch("/api/wompi/checkout-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountInCents,
          currency: "COP",
          reference: orderRef,
          shipping: {
            fullName: ship.fullName.trim(),
            phone: ship.phone.trim(),
            city: ship.city.trim(),
            region: ship.region.trim(),
            addressLine1: ship.addressLine1.trim(),
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data?.checkoutUrl) {
        alert(data?.error || "No se pudo generar el link de pago.");
        return;
      }

      // ✅ Creamos la orden local como "pending_payment" antes de redirigir
      createOrderLocal("pending_payment");

      // ✅ (Opcional) limpia el carrito cuando ya vas a pagar
      clearCart();

      // ✅ Redirección a Wompi Hosted Checkout
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
                <div className="cT">Datos de envío</div>
                <div className="cS">Esto es obligatorio para continuar al pago.</div>

                <div className="form">
                  <label className="f">
                    <span>Nombre completo *</span>
                    <input
                      value={ship.fullName}
                      onChange={(e) => setShip((s) => ({ ...s, fullName: e.target.value }))}
                      placeholder="Ej: Breiner Paz"
                    />
                  </label>

                  <label className="f">
                    <span>Teléfono *</span>
                    <input
                      value={ship.phone}
                      onChange={(e) => setShip((s) => ({ ...s, phone: e.target.value }))}
                      placeholder="Ej: 3001234567"
                      inputMode="tel"
                    />
                  </label>

                  <div className="two">
                    <label className="f">
                      <span>Ciudad *</span>
                      <input
                        value={ship.city}
                        onChange={(e) => setShip((s) => ({ ...s, city: e.target.value }))}
                        placeholder="Ej: Bogotá"
                      />
                    </label>

                    <label className="f">
                      <span>Departamento</span>
                      <input
                        value={ship.region}
                        onChange={(e) => setShip((s) => ({ ...s, region: e.target.value }))}
                        placeholder="Ej: Cundinamarca"
                      />
                    </label>
                  </div>

                  <label className="f">
                    <span>Dirección *</span>
                    <input
                      value={ship.addressLine1}
                      onChange={(e) => setShip((s) => ({ ...s, addressLine1: e.target.value }))}
                      placeholder="Calle / Carrera, número, barrio…"
                    />
                  </label>

                  <label className="f">
                    <span>Notas (opcional)</span>
                    <textarea
                      value={ship.notes}
                      onChange={(e) => setShip((s) => ({ ...s, notes: e.target.value }))}
                      placeholder="Apto / torre / instrucciones de entrega…"
                    />
                  </label>
                </div>

                <button
                  className="cta"
                  type="button"
                  onClick={() => setStep("pago")}
                  disabled={!canContinue || !shipOk}
                  title={!shipOk ? "Completa el envío para continuar" : ""}
                >
                  Continuar a pago
                </button>
              </div>
            ) : (
              <div className="card">
                <div className="cT">Pago (Wompi) — Opción B</div>
                <div className="cS">
                  Te llevamos a Wompi para completar el pago. Al finalizar, vuelves a JUSP con el <b>id</b> de la transacción.
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
                  {busy ? "Abriendo Wompi…" : "Pagar ahora"}
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

  .form{ margin-top: 14px; display: grid; gap: 10px; }
  .f{ display:grid; gap: 6px; }
  .f span{ font-weight: 950; font-size: 12px; color: rgba(0,0,0,0.72); }
  .f input, .f textarea{
    border: 1px solid rgba(0,0,0,0.14);
    border-radius: 14px;
    padding: 12px 12px;
    font-weight: 900;
    outline: none;
  }
  .f textarea{ min-height: 92px; resize: vertical; }
  .two{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }

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
    .two{ grid-template-columns: 1fr; }
  }
`;