"use client";

import React, { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { useStore } from "@/app/components/store";

function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
}

export default function AddToCart({ product }: { product: Product }) {
  const { addToCart, openCart } = useStore();

  const colors = useMemo(() => safeArr((product as any).colors), [product]);
  const sizes = useMemo(() => safeArr((product as any).sizes), [product]);

  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [qty, setQty] = useState<number>(1);

  const needsSize = sizes.length > 0;
  const needsColor = colors.length > 0;

  const canAdd = (!needsSize || !!size) && (!needsColor || !!color) && qty >= 1;

  return (
    <>
      <div className="box">
        {needsSize ? (
          <div className="row">
            <div className="lbl">Talla</div>
            <div className="grid">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`opt ${size === s ? "on" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {needsColor ? (
          <div className="row">
            <div className="lbl">Color</div>
            <div className="grid">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`opt ${color === c ? "on" : ""}`}
                  onClick={() => setColor(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="row">
          <div className="lbl">Cantidad</div>
          <div className="qty">
            <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((n) => n + 1)}>
              +
            </button>
          </div>
        </div>

        <button
          className="cta"
          type="button"
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd) return;
            addToCart(product, { color, size, qty });
            openCart();
          }}
        >
          Agregar al carrito
        </button>
      </div>

      <style jsx>{`
        .box{
          margin-top: 14px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 18px;
          padding: 14px;
          background: #fff;
        }
        .row{ margin-top: 12px; }
        .row:first-child{ margin-top: 0; }

        .lbl{
          font-weight: 950;
          color:#111;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .grid{
          display:flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .opt{
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 950;
          border: 1px solid rgba(0,0,0,0.14);
          background:#fff;
          cursor:pointer;
          color: rgba(0,0,0,0.78);
        }
        .opt.on{
          background: rgba(17,17,17,0.92);
          color: rgba(255,255,255,0.95);
          border-color: rgba(0,0,0,0.2);
        }

        .qty{
          display:flex;
          align-items:center;
          gap: 10px;
          border: 1px solid rgba(0,0,0,0.14);
          border-radius: 999px;
          padding: 10px 12px;
          width: fit-content;
        }
        .qty button{
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 0;
          background: rgba(0,0,0,0.06);
          cursor:pointer;
          font-weight: 950;
        }
        .qty span{
          min-width: 18px;
          text-align:center;
          font-weight: 950;
        }

        .cta{
          margin-top: 14px;
          width: 100%;
          border-radius: 999px;
          padding: 14px 16px;
          font-weight: 950;
          border: 1px solid rgba(0,0,0,0.14);
          background: rgba(17,17,17,0.92);
          color: rgba(255,255,255,0.95);
          cursor:pointer;
        }
        .cta:disabled{
          opacity: 0.5;
          cursor:not-allowed;
        }
      `}</style>
    </>
  );
}