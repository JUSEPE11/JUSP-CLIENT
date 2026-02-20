// app/product/[slug]/page.tsx
"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PRODUCTS, type Product } from "@/lib/products";
import { useStore } from "../../components/store";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}
function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
}
function pickImgs(p: Product): string[] {
  const imgs = Array.isArray((p as any).images) ? ((p as any).images as string[]) : [];
  const main = (imgs?.[0] || (typeof (p as any).image === "string" ? (p as any).image : "") || "").trim();
  const alt = (imgs?.[1] || "").trim();
  const out = [main, alt].filter(Boolean) as string[];
  return out.length ? out : [];
}

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { addToCart, openCart } = useStore();

  const slug = decodeURIComponent(String(params?.slug || ""));
  const product = useMemo(() => (PRODUCTS ?? []).find((p: any) => String(p.id) === slug) as any, [slug]);

  const imgs = useMemo(() => (product ? pickImgs(product) : []), [product]);
  const colors = useMemo(() => (product ? safeArr((product as any).colors) : []), [product]);
  const sizes = useMemo(() => (product ? safeArr((product as any).sizes) : []), [product]);

  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [qty, setQty] = useState<number>(1);
  const [toast, setToast] = useState<string | null>(null);

  if (!product) {
    return (
      <main style={{ padding: 24 }}>
        <Link href="/products">← Volver</Link>
        <h1 style={{ marginTop: 12 }}>Producto no encontrado</h1>
      </main>
    );
  }

  function onAdd() {
    addToCart(product as any, { color, size, qty });
    setToast("Agregado al carrito");
    openCart();
    setTimeout(() => setToast(null), 1600);
  }

  return (
    <main className="root">
      <div className="wrap">
        <div className="top">
          <Link className="back" href="/products">
            ← Volver a productos
          </Link>
          <button className="go" type="button" onClick={() => router.push("/checkout")}>
            Ir al checkout
          </button>
        </div>

        <div className="grid">
          <section className="media">
            <div className="imgBox">
              {imgs[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgs[0]} alt={(product as any).title || (product as any).name || "Producto"} />
              ) : (
                <div className="ph" />
              )}
            </div>

            {imgs[1] ? (
              <div className="thumbs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="th" src={imgs[0]} alt="" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="th" src={imgs[1]} alt="" aria-hidden="true" />
              </div>
            ) : null}
          </section>

          <section className="info">
            <div className="title">{(product as any).title || (product as any).name || "Producto"}</div>
            <div className="price">${moneyCOP((product as any).price ?? 0)}</div>

            {colors.length ? (
              <div className="blk">
                <div className="lbl">Color</div>
                <div className="row">
                  {colors.map((c) => (
                    <button key={c} className={`pill ${color === c ? "on" : ""}`} type="button" onClick={() => setColor(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {sizes.length ? (
              <div className="blk">
                <div className="lbl">Talla</div>
                <div className="row">
                  {sizes.map((s) => (
                    <button key={s} className={`pill ${size === s ? "on" : ""}`} type="button" onClick={() => setSize(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="blk">
              <div className="lbl">Cantidad</div>
              <div className="qty">
                <button type="button" className="qbtn" onClick={() => setQty((v) => Math.max(1, v - 1))}>
                  −
                </button>
                <div className="qval">{qty}</div>
                <button type="button" className="qbtn" onClick={() => setQty((v) => v + 1)}>
                  +
                </button>
              </div>
            </div>

            <button className="cta" type="button" onClick={onAdd}>
              Agregar al carrito
            </button>
          </section>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <style jsx>{`
        .root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding: 18px 16px 34px;
          background: #fff;
          min-height: 100vh;
        }
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .back {
          text-decoration: none;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.75);
        }
        .go {
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
        }

        .grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          align-items: start;
        }

        .imgBox {
          border-radius: 22px;
          background: #f5f5f5;
          overflow: hidden;
          aspect-ratio: 4/3;
          display: grid;
          place-items: center;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
        }
        .imgBox img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 24px;
          display: block;
        }
        .ph {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        .thumbs {
          margin-top: 10px;
          display: flex;
          gap: 10px;
        }
        .th {
          width: 84px;
          height: 84px;
          border-radius: 16px;
          background: #f5f5f5;
          object-fit: contain;
          padding: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .title {
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #111;
          line-height: 1.12;
        }
        .price {
          margin-top: 10px;
          font-size: 18px;
          font-weight: 950;
          color: #111;
        }

        .blk {
          margin-top: 16px;
        }
        .lbl {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.65);
          font-size: 12px;
          margin-bottom: 8px;
        }
        .row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pill {
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 950;
          font-size: 12px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          cursor: pointer;
        }
        .pill.on {
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .qty {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .qbtn {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          cursor: pointer;
          font-weight: 950;
        }
        .qval {
          min-width: 34px;
          text-align: center;
          font-weight: 950;
          color: #111;
        }

        .cta {
          width: 100%;
          margin-top: 18px;
          border: 0;
          border-radius: 16px;
          padding: 14px 14px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          cursor: pointer;
        }

        .toast {
          position: fixed;
          right: 16px;
          bottom: 16px;
          border-radius: 999px;
          padding: 10px 12px;
          background: rgba(17, 17, 17, 0.92);
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.25);
          z-index: 90;
        }

        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}