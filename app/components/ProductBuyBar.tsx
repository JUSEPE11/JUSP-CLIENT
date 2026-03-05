// app/components/ProductBuyBar.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "./store";
import type { Product, ProductVariant } from "@/lib/products";

function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
}

function uniq(arr: string[]) {
  const out: string[] = [];
  for (const a of arr) {
    const v = (a || "").trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

function pickImg(p: any, idx: number): string | null {
  const imgs = Array.isArray(p?.images) ? p.images : [];
  const img = imgs[idx] || (idx === 0 ? (typeof p?.image === "string" ? p.image : "") : "");
  const s = String(img || "").trim();
  return s ? s : null;
}

function deriveColorsSizes(product: Product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return { colors: safeArr((product as any).colors), sizes: safeArr((product as any).sizes) };
  const colors = uniq(variants.map((v) => String(v.color ?? "").trim()).filter(Boolean));
  const sizes = uniq(variants.map((v) => String(v.size ?? "").trim()).filter(Boolean));
  return { colors, sizes };
}

function findVariant(product: Product, color: string | null, size: string | null): ProductVariant | null {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return null;

  const c = (color ?? "").trim();
  const s = (size ?? "").trim();

  if (c && s) {
    const exact = variants.find((v) => String(v.color ?? "").trim() === c && String(v.size ?? "").trim() === s);
    if (exact) return exact;
  }
  if (s) {
    const bySize = variants.find((v) => String(v.size ?? "").trim() === s);
    if (bySize) return bySize;
  }
  if (c) {
    const byColor = variants.find((v) => String(v.color ?? "").trim() === c);
    if (byColor) return byColor;
  }
  return variants[0] ?? null;
}

export default function ProductBuyBar({ product }: { product: Product }) {
  const { addToCart, openCart } = useStore();

  const { colors, sizes } = useMemo(() => deriveColorsSizes(product), [product]);

  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [qty, setQty] = useState<number>(1);

  const img1 = pickImg(product as any, 0);
  const img2 = pickImg(product as any, 1);

  const selectedVariant = useMemo(() => findVariant(product, color, size), [product, color, size]);
  const price = selectedVariant?.price ?? product.price;

  return (
    <div className="wrap">
      <div className="card">
        <div className="left">
          <div className="img">
            <div className="box">
              {img1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="i1" src={img1} alt={product.name} />
              ) : (
                <div className="ph" />
              )}
              {img2 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="i2" src={img2} alt={product.name} />
              ) : null}
            </div>
          </div>

          <div className="info">
            <div className="name">{product.name}</div>
            <div className="meta">
              {color ? <span>Color: {color}</span> : null}
              {size ? <span>Talla: {size}</span> : null}
              <span className="p">Precio: ${Math.round(price).toLocaleString("es-CO")}</span>
            </div>
            <div className="note">Recuerda: los precios pueden variar según disponibilidad y condiciones del proveedor internacional.</div>
          </div>
        </div>

        <div className="mid">
          {colors.length ? (
            <div className="sel">
              <div className="lbl">Color</div>
              <select value={color ?? ""} onChange={(e) => setColor(e.target.value || null)}>
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {sizes.length ? (
            <div className="sel">
              <div className="lbl">Talla</div>
              <select value={size ?? ""} onChange={(e) => setSize(e.target.value || null)}>
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="qty">
            <button type="button" className="q" onClick={() => setQty((v) => Math.max(1, v - 1))}>
              –
            </button>
            <div className="qv">{qty}</div>
            <button type="button" className="q" onClick={() => setQty((v) => v + 1)}>
              +
            </button>
          </div>
        </div>

        <div className="right">
          <button
            className="add"
            type="button"
            onClick={() => {
              const cloned: any = { ...product, price }; // ✅ precio variante
              addToCart(cloned, { color, size, qty });
              openCart();
            }}
          >
            Agregar al carrito
          </button>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          margin-top: 16px;
        }
        .card {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          padding: 12px;
          background: #fff;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.06);
          display: grid;
          grid-template-columns: 1.2fr 1fr 0.8fr;
          gap: 12px;
          align-items: center;
        }

        .left {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .img .box {
          width: 86px;
          height: 72px;
          border-radius: 14px;
          overflow: hidden;
          background: #f5f5f5;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
          position: relative;
        }
        .ph {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.16);
          position: absolute;
          inset: 0;
          margin: auto;
        }
        .i1,
        .i2 {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 10px;
          position: absolute;
          inset: 0;
          transition: opacity 160ms ease;
        }
        .i2 {
          opacity: 0;
        }
        .box:hover .i2 {
          opacity: 1;
        }
        .box:hover .i1 {
          opacity: 0;
        }

        .name {
          font-weight: 950;
          color: #111;
          line-height: 1.15;
        }
        .meta {
          margin-top: 6px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
        }
        .p {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.78);
        }
        .note {
          margin-top: 6px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.6);
          font-size: 12px;
          line-height: 1.3;
        }

        .mid {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
        }
        .sel {
          display: grid;
          gap: 6px;
        }
        .lbl {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.62);
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        select {
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 950;
          cursor: pointer;
          outline: none;
          min-width: 150px;
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .q {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          cursor: pointer;
          font-weight: 950;
        }
        .qv {
          min-width: 18px;
          text-align: center;
          font-weight: 950;
          color: #111;
        }

        .add {
          width: 100%;
          border-radius: 999px;
          padding: 14px 16px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          cursor: pointer;
        }

        @media (max-width: 980px) {
          .card {
            grid-template-columns: 1fr;
          }
          .mid {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}