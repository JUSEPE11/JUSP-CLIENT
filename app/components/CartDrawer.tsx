// app/components/CartDrawer.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useStore } from "./store";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

export default function CartDrawer() {
  const { state, cartCount, cartTotal, closePanel, incQty, decQty, removeFromCart, clearCart } = useStore();

  const open = state.ui.panel === "cart";
  const items = state.cart;

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closePanel]);

  const empty = useMemo(() => items.length === 0, [items.length]);

  if (!open) return null;

  return (
    <>
      <div className="ov" onClick={closePanel} aria-hidden="true" />

      <aside className="dw" role="dialog" aria-modal="true" aria-label="Carrito">
        <div className="top">
          <div className="ttl">Carrito</div>
          <button className="x" type="button" onClick={closePanel} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="sub">
          <div className="cnt">
            {cartCount} item{cartCount === 1 ? "" : "s"}
          </div>
          {!empty ? (
            <button className="lnk" type="button" onClick={clearCart}>
              Vaciar
            </button>
          ) : null}
        </div>

        {empty ? (
          <div className="emp">
            <div className="empT">Tu carrito está vacío</div>
            <div className="empS">Agrega productos para continuar.</div>
            <Link className="btn" href="/products" onClick={closePanel}>
              Ir a productos
            </Link>
          </div>
        ) : (
          <>
            <div className="list">
              {items.map((it) => (
                <div key={`${it.id}__${it.color ?? ""}__${it.size ?? ""}`} className="row">
                  <div className="img">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt={it.name} />
                    ) : (
                      <div className="ph" />
                    )}
                  </div>

                  <div className="mid">
                    <div className="nm">{it.name}</div>

                    <div className="meta">
                      {it.color ? <span className="tag">{it.color}</span> : null}
                      {it.size ? <span className="tag">Talla {it.size}</span> : null}
                    </div>

                    <div className="bot">
                      <div className="qty">
                        <button type="button" className="q" onClick={() => decQty(it.id, it.color ?? null, it.size ?? null)} aria-label="Disminuir">
                          −
                        </button>
                        <div className="qv">{it.qty}</div>
                        <button type="button" className="q" onClick={() => incQty(it.id, it.color ?? null, it.size ?? null)} aria-label="Aumentar">
                          +
                        </button>
                      </div>

                      <button type="button" className="rm" onClick={() => removeFromCart(it.id, it.color ?? null, it.size ?? null)}>
                        Quitar
                      </button>
                    </div>
                  </div>

                  <div className="pr">${moneyCOP(it.price * it.qty)}</div>
                </div>
              ))}
            </div>

            <div className="foot">
              <div className="tot">
                <span>Total</span>
                <strong>${moneyCOP(cartTotal)}</strong>
              </div>

              <Link className="pay" href="/checkout" onClick={closePanel}>
                Pagar ahora
              </Link>

              <button className="keep" type="button" onClick={closePanel}>
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>

      <style jsx>{`
        .ov {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(4px);
          z-index: 80;
        }
        .dw {
          position: fixed;
          top: 0;
          right: 0;
          width: min(420px, 92vw);
          height: 100vh;
          background: #fff;
          z-index: 81;
          box-shadow: -30px 0 80px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .ttl {
          font-weight: 950;
          font-size: 18px;
          color: #111;
          letter-spacing: -0.02em;
        }
        .x {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          cursor: pointer;
          font-weight: 950;
        }

        .sub {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          color: rgba(0, 0, 0, 0.65);
          font-weight: 900;
          font-size: 12px;
        }
        .lnk {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.7);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .emp {
          padding: 18px 16px;
          display: grid;
          gap: 8px;
        }
        .empT {
          font-weight: 950;
          font-size: 16px;
          color: #111;
        }
        .empS {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.65);
        }
        .btn {
          margin-top: 8px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          border-radius: 14px;
          padding: 12px 12px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
        }

        .list {
          padding: 6px 16px 10px;
          overflow: auto;
          flex: 1;
        }

        .row {
          display: grid;
          grid-template-columns: 64px 1fr auto;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .img {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          background: #f5f5f5;
          overflow: hidden;
          display: grid;
          place-items: center;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
        }
        .img :global(img) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 8px;
          display: block;
        }
        .ph {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        .nm {
          font-weight: 950;
          color: #111;
          font-size: 13px;
          line-height: 1.2;
        }
        .meta {
          margin-top: 6px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tag {
          font-size: 11px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 999px;
          padding: 6px 8px;
          background: #fff;
        }

        .bot {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .qty {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 999px;
          padding: 6px 8px;
        }
        .q {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 0;
          background: rgba(0, 0, 0, 0.06);
          cursor: pointer;
          font-weight: 950;
        }
        .qv {
          min-width: 20px;
          text-align: center;
          font-weight: 950;
          color: #111;
          font-size: 12px;
        }

        .rm {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.65);
          text-decoration: underline;
          text-underline-offset: 3px;
          font-size: 12px;
        }

        .pr {
          font-weight: 950;
          color: #111;
          font-size: 13px;
          white-space: nowrap;
          padding-top: 2px;
        }

        .foot {
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          padding: 14px 16px 16px;
          display: grid;
          gap: 10px;
        }
        .tot {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.7);
        }
        .tot strong {
          color: #111;
          font-weight: 950;
          font-size: 16px;
        }

        .pay {
          text-decoration: none;
          border-radius: 14px;
          padding: 12px 12px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          text-align: center;
        }
        .keep {
          border-radius: 14px;
          padding: 12px 12px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.14);
          font-weight: 950;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}