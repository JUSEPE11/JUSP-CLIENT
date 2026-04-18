// app/components/CartDrawer.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "./store";

type ProductVariant = {
  key: string;
  size?: string;
  color?: string;
  price: number;
  stock?: number;
  isAvailable?: boolean;
};

type ProductApi = {
  id: string;
  slug?: string;
  product_code?: string;
  title?: string;
  name?: string;
  stockHint?: number;
  variants?: ProductVariant[];
};

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function normalizeLoose(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function toSafeStock(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

function findMaxStockForCartItem(
  products: ProductApi[],
  item: { id: string; color?: string | null; size?: string | null }
) {
  const itemId = normalizeLoose(item.id);
  const itemColor = normalizeLoose(item.color);
  const itemSize = String(item.size ?? "").trim();

  const product = products.find((p) => {
    const pid = normalizeLoose(p.id);
    const pslug = normalizeLoose(p.slug);
    const pcode = normalizeLoose(p.product_code);
    return pid === itemId || pslug === itemId || pcode === itemId;
  });

  if (!product) return null;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length) {
    const byColor = itemColor
      ? variants.filter((v) => normalizeLoose(v.color) === itemColor)
      : variants;

    if (itemSize) {
      const exact = byColor.find((v) => String(v.size ?? "").trim() === itemSize);
      if (exact) return toSafeStock(exact.stock);
    }

    if (byColor.length === 1) {
      return toSafeStock(byColor[0]?.stock);
    }

    if (!itemSize && byColor.length > 0) {
      const total = byColor.reduce((acc, v) => acc + (toSafeStock(v.stock) ?? 0), 0);
      return total;
    }
  }

  return toSafeStock(product.stockHint);
}

export default function CartDrawer() {
  const { state, cartCount, cartTotal, closePanel, incQty, decQty, removeFromCart, clearCart } =
    useStore();

  const open = state.ui.panel === "cart";
  const items = state.cart;

  const [products, setProducts] = useState<ProductApi[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchMovedRef = useRef(false);
  const lastTapRef = useRef(0);

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

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (!open || !items.length) return;

      try {
        setLoadingStock(true);
        const res = await fetch("/api/products", {
          cache: "no-store",
          headers: { "cache-control": "no-store" },
        });
        const data = await res.json().catch(() => []);
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setProducts([]);
      } finally {
        if (cancelled) return;
        setLoadingStock(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [open, items.length]);

  const empty = useMemo(() => items.length === 0, [items.length]);

  const handleGestureTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    touchMovedRef.current = false;
  };

  const handleGestureTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(touch.clientX - touchStartXRef.current);

    if (Math.abs(deltaY) > 8 || deltaX > 8) {
      touchMovedRef.current = true;
    }
  };

  const handleGestureTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(touch.clientX - touchStartXRef.current);
    const now = Date.now();

    if (deltaY > 72 && deltaX < 48) {
      closePanel();
      lastTapRef.current = 0;
      return;
    }

    const isTap = !touchMovedRef.current && Math.abs(deltaY) < 10 && deltaX < 10;
    if (isTap) {
      if (now - lastTapRef.current < 280) {
        closePanel();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    }
  };

  const itemStocks = useMemo(() => {
    const out = new Map<string, number | null>();

    for (const it of items) {
      const key = `${it.id}__${it.color ?? ""}__${it.size ?? ""}`;
      out.set(
        key,
        findMaxStockForCartItem(products, {
          id: it.id,
          color: it.color ?? null,
          size: it.size ?? null,
        })
      );
    }

    return out;
  }, [items, products]);

  if (!open) return null;

  return (
    <>
      <div className="ov" onClick={closePanel} aria-hidden="true" />

      <aside className="dw" role="dialog" aria-modal="true" aria-label="Carrito">
        <button className="floatingClose" type="button" onClick={closePanel} aria-label="Cerrar carrito">
          <span aria-hidden="true">×</span>
        </button>

        <div
          className="top"
          onTouchStart={handleGestureTouchStart}
          onTouchMove={handleGestureTouchMove}
          onTouchEnd={handleGestureTouchEnd}
        >
          <div className="grab" aria-hidden="true" />
          <div className="ttl">Carrito</div>
        </div>

        <div className="sub">
          <div className="cnt">
            {cartCount} producto{cartCount === 1 ? "" : "s"}
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
              {items.map((it) => {
                const rowKey = `${it.id}__${it.color ?? ""}__${it.size ?? ""}`;
                const maxStock = itemStocks.get(rowKey) ?? null;
                const soldOut = maxStock === 0;
                const atLimit = maxStock !== null && it.qty >= maxStock;

                return (
                  <div key={rowKey} className="row">
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

                      {soldOut ? (
                        <div className="stock soldOut">Agotado</div>
                      ) : maxStock !== null ? (
                        <div className="stock">
                          {maxStock <= 1
                            ? "Última unidad disponible"
                            : atLimit
                              ? "Llegaste al máximo disponible"
                              : `Disponibles: ${maxStock}`}
                        </div>
                      ) : loadingStock ? (
                        <div className="stock">Validando stock…</div>
                      ) : null}

                      <div className="bot">
                        <div className="qty">
                          <button
                            type="button"
                            className="q"
                            onClick={() => decQty(it.id, it.color ?? null, it.size ?? null)}
                            aria-label="Disminuir"
                          >
                            −
                          </button>
                          <div className="qv">{it.qty}</div>
                          <button
                            type="button"
                            className="q"
                            onClick={() => incQty(it.id, it.color ?? null, it.size ?? null, maxStock)}
                            aria-label="Aumentar"
                            disabled={soldOut || atLimit}
                            title={soldOut ? "Producto agotado" : atLimit ? "Ya llegaste al stock máximo" : ""}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="rm"
                          onClick={() => removeFromCart(it.id, it.color ?? null, it.size ?? null)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>

                    <div className="pr">${moneyCOP(it.price * it.qty)}</div>
                  </div>
                );
              })}
            </div>

            <div className="foot">
              <div className="sumrow">
                <span>Producto</span>
                <strong>{cartCount}</strong>
              </div>

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
          overflow: hidden;
        }

        .floatingClose {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 9999;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.98);
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.12),
            0 1px 0 rgba(255, 255, 255, 0.9) inset;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        .floatingClose span {
          font-size: 28px;
          line-height: 1;
          color: #111;
          transform: translateY(-1px);
        }

        .top {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 64px 10px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          min-height: 74px;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
        }

        .grab {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 44px;
          height: 5px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        .ttl {
          font-weight: 950;
          font-size: 18px;
          color: #111;
          letter-spacing: -0.02em;
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

        .stock {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.62);
        }

        .stock.soldOut {
          color: #b3261e;
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

        .q:disabled {
          opacity: 0.45;
          cursor: not-allowed;
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

        .sumrow {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.7);
        }

        .sumrow strong {
          color: #111;
          font-weight: 950;
          font-size: 16px;
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

        @media (max-width: 640px) {
          .floatingClose {
            top: 12px;
            right: 12px;
            width: 40px;
            height: 40px;
          }

          .floatingClose span {
            font-size: 26px;
          }

          .top {
            padding-right: 60px;
            padding-top: 24px;
          }
        }
      `}</style>
    </>
  );
}