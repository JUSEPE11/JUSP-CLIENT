// app/ClientLayout.tsx
"use client";

import type { ReactNode } from "react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Header from "./components/Header";
import { useStore } from "./components/store";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function keyOf(item: { id: string; color?: string | null; size?: string | null }) {
  return `${item.id}__c:${item.color ?? ""}__s:${item.size ?? ""}`;
}

type MegaTopic = { label: string; href: string };
type MegaCol = { title: string; items: MegaTopic[] };

const MEGA_COLS: MegaCol[] = [
  {
    title: "Ayuda",
    items: [
      { label: "Centro de ayuda", href: "/help" },
      { label: "Términos y Condiciones", href: "/terms" },
      { label: "Política de Privacidad", href: "/privacy" },
      { label: "PQR / Reclamos", href: "/help/pqr" },
    ],
  },
  {
    title: "Recursos",
    items: [
      { label: "Buscar tienda", href: "/stores" },
      { label: "Hacerse miembro", href: "/membership" },
      { label: "JUSP News", href: "/news" },
      { label: "Envíanos tus comentarios", href: "/feedback" },
    ],
  },
  {
    title: "Acerca de JUSP",
    items: [
      { label: "Noticias", href: "/news" },
      { label: "Empleo", href: "/careers" },
      { label: "Sustentabilidad", href: "/sustainability" },
      { label: "Accesibilidad", href: "/accessibility" },
    ],
  },
  {
    title: "Beneficios JUSP",
    items: [
      { label: "Drops exclusivos (stock limitado)", href: "/drops" },
      { label: "Acceso anticipado (Early Access)", href: "/early-access" },
      { label: "Originalidad verificada", href: "/originalidad" },
      { label: "Tracking y trazabilidad", href: "/help/estado" },
      { label: "Cross-border sin sorpresas", href: "/help/crossborder" },
    ],
  },
];

function currentYear() {
  try {
    return new Date().getFullYear();
  } catch {
    return 2026;
  }
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { state, cartCount, cartTotal, openCart, closePanel, incQty, decQty, removeFromCart, clearCart } = useStore();

  // Si luego quieres ocultar header en rutas específicas, lo activas aquí:
  // const hideHeader = pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const hideHeader = false;

  const isCartOpen = state.ui.panel === "cart";

  // =========================
  // ✅ PRO MAX: Toast + Auto-open (solo producto)
  // =========================
  const [toast, setToast] = useState<{ open: boolean; title: string; sub?: string; canUndo?: boolean }>({
    open: false,
    title: "",
    sub: "",
    canUndo: false,
  });

  const prevCartCountRef = useRef<number>(cartCount);
  const prevCartKeysRef = useRef<Record<string, number>>({});
  const lastAddedRef = useRef<{ id: string; color?: string | null; size?: string | null } | null>(null);
  const suppressNextRef = useRef<"none" | "undo" | "init">("init");
  const openTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const isProductDetail = useMemo(() => {
    const p = pathname || "";
    if (p === "/products") return false;
    if (p.startsWith("/products/")) return true;
    if (p === "/product") return true;
    if (p.startsWith("/product/")) return true;
    return false;
  }, [pathname]);

  const isCheckoutFlow = useMemo(() => {
    const p = pathname || "";
    return p.startsWith("/checkout");
  }, [pathname]);

  const isSafeToAutoOpen = useMemo(() => {
    return isProductDetail && !isCheckoutFlow && !hideHeader;
  }, [isProductDetail, isCheckoutFlow, hideHeader]);

  function cancelOpenTimer() {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }

  function cancelToastTimer() {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }

  function showToast(next: { title: string; sub?: string; canUndo?: boolean }) {
    cancelToastTimer();
    setToast({ open: true, title: next.title, sub: next.sub, canUndo: !!next.canUndo });

    toastTimerRef.current = window.setTimeout(() => {
      setToast((t) => ({ ...t, open: false }));
    }, 2600);
  }

  useEffect(() => {
    const map: Record<string, number> = {};
    for (const it of state.cart) map[keyOf(it)] = it.qty;
    prevCartKeysRef.current = map;
    prevCartCountRef.current = cartCount;
    suppressNextRef.current = "none";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (suppressNextRef.current === "init") {
      suppressNextRef.current = "none";
      prevCartCountRef.current = cartCount;
      return;
    }

    const prevCount = prevCartCountRef.current;
    const nextCount = cartCount;

    if (suppressNextRef.current === "undo") {
      suppressNextRef.current = "none";
      prevCartCountRef.current = nextCount;
      const map: Record<string, number> = {};
      for (const it of state.cart) map[keyOf(it)] = it.qty;
      prevCartKeysRef.current = map;
      return;
    }

    if (nextCount > prevCount) {
      const prevMap = prevCartKeysRef.current || {};
      const nextMap: Record<string, number> = {};
      for (const it of state.cart) nextMap[keyOf(it)] = it.qty;

      let changedKey: string | null = null;

      for (const k of Object.keys(nextMap)) {
        if (!(k in prevMap)) {
          changedKey = k;
          break;
        }
      }
      if (!changedKey) {
        for (const k of Object.keys(nextMap)) {
          if ((prevMap[k] ?? 0) < nextMap[k]) {
            changedKey = k;
            break;
          }
        }
      }

      if (changedKey) {
        const found = state.cart.find((it) => keyOf(it) === changedKey) || null;
        if (found) {
          lastAddedRef.current = { id: found.id, color: found.color ?? null, size: found.size ?? null };
          showToast({
            title: "Agregado al carrito",
            sub: found.size || found.color ? `• ${found.size ? `Talla ${found.size}` : ""}${found.size && found.color ? " · " : ""}${found.color ? found.color : ""}` : undefined,
            canUndo: true,
          });
        } else {
          lastAddedRef.current = null;
          showToast({ title: "Agregado al carrito", canUndo: false });
        }
      } else {
        lastAddedRef.current = null;
        showToast({ title: "Agregado al carrito", canUndo: false });
      }

      if (isSafeToAutoOpen && !isCartOpen) {
        cancelOpenTimer();
        openTimerRef.current = window.setTimeout(() => {
          if (!isCartOpen && isSafeToAutoOpen) openCart();
        }, 600);
      }
    }

    prevCartCountRef.current = nextCount;
    const map: Record<string, number> = {};
    for (const it of state.cart) map[keyOf(it)] = it.qty;
    prevCartKeysRef.current = map;

    return () => {};
  }, [cartCount, state.cart, isSafeToAutoOpen, isCartOpen, openCart]);

  useEffect(() => {
    cancelOpenTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartOpen, pathname]);

  function undoLastAdd() {
    const last = lastAddedRef.current;
    if (!last) return;
    suppressNextRef.current = "undo";
    try {
      decQty(last.id, last.color ?? null, last.size ?? null);
      setToast((t) => ({ ...t, open: false }));
    } catch {
      suppressNextRef.current = "none";
    }
  }

  useEffect(() => {
    if (!isCartOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCartOpen, closePanel]);

  // =========================
  // ✅ Mega footer (NO fijo): siempre al final
  // =========================
  const [megaOpen, setMegaOpen] = useState(true);

  return (
    <>
      {!hideHeader && <Header />}

      {!hideHeader ? (
        <button type="button" className="bag" aria-label="Abrir carrito" onClick={() => openCart()} title="Carrito">
          <span className="ico" aria-hidden="true">
            🛍️
          </span>
          {cartCount > 0 ? <span className="badge">{cartCount}</span> : null}
        </button>
      ) : null}

      {/* ✅ Layout que empuja footer al final */}
      <div className="pageWrap" style={{ paddingTop: "var(--jusp-header-h)" }}>
        <main className="pageMain">{children}</main>

        {/* ✅ Mega footer: AL FINAL (no fijo) */}
        <footer className="mega" aria-label="Footer">
          <div className="megaInner">
            <div className="megaTop">
              <div className="megaBrand">
                <span className="dot" aria-hidden="true" />
                <span className="megaKicker">JUSP</span>
              </div>

              <button type="button" className="megaToggle" onClick={() => setMegaOpen((v) => !v)} aria-expanded={megaOpen}>
                {megaOpen ? "Ocultar" : "Mostrar"} ▾
              </button>
            </div>

            {megaOpen ? (
              <div className="megaGrid">
                {MEGA_COLS.map((col) => (
                  <div key={col.title} className="col">
                    <div className="colT">{col.title}</div>
                    <div className="colL">
                      {col.items.map((it) => (
                        <Link key={`${col.title}-${it.href}`} href={it.href} className="a">
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="megaBar">
              <div className="copy">© {currentYear()} JUSP. Todos los derechos reservados.</div>
              <div className="legal">
                <Link href="/help" className="l">
                  Centro de ayuda
                </Link>
                <Link href="/terms" className="l">
                  Términos
                </Link>
                <Link href="/privacy" className="l">
                  Privacidad
                </Link>
                <Link href="/help/pqr" className="l">
                  PQR
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {toast.open ? (
        <div className="toast" role="status" aria-live="polite">
          <div className="toastL">
            <div className="toastT">{toast.title}</div>
            {toast.sub ? <div className="toastS">{toast.sub}</div> : null}
          </div>

          <div className="toastR">
            {toast.canUndo ? (
              <button type="button" className="toastUndo" onClick={undoLastAdd}>
                Deshacer
              </button>
            ) : null}
            <button type="button" className="toastX" aria-label="Cerrar" onClick={() => setToast((t) => ({ ...t, open: false }))}>
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {isCartOpen ? (
        <div
          className="backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
        >
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Carrito">
            <div className="dTop">
              <div className="dTitle">Carrito</div>
              <button className="x" type="button" onClick={closePanel} aria-label="Cerrar">
                ✕
              </button>
            </div>

            {state.cart.length === 0 ? (
              <div className="empty">
                <div className="eTitle">Tu carrito está vacío</div>
                <div className="eSub">Agrega productos desde la página del producto.</div>
                <button
                  type="button"
                  className="btnGhost"
                  onClick={() => {
                    closePanel();
                    router.push("/products");
                  }}
                >
                  Ver productos
                </button>
              </div>
            ) : (
              <>
                <div className="list">
                  {state.cart.map((it) => {
                    const key = `${it.id}__${it.color ?? ""}__${it.size ?? ""}`;
                    return (
                      <div key={key} className="row">
                        <div className="thumb">
                          {it.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt={it.name} />
                          ) : (
                            <div className="ph" />
                          )}
                        </div>

                        <div className="meta">
                          <div className="name">{it.name}</div>
                          <div className="opts">
                            {it.color ? <span className="opt">Color: {it.color}</span> : null}
                            {it.size ? <span className="opt">Talla: {it.size}</span> : null}
                          </div>

                          <div className="bottom">
                            <div className="price">${moneyCOP(it.price)}</div>

                            <div className="qty">
                              <button type="button" className="q" onClick={() => decQty(it.id, it.color ?? null, it.size ?? null)}>
                                −
                              </button>
                              <div className="qv">{it.qty}</div>
                              <button type="button" className="q" onClick={() => incQty(it.id, it.color ?? null, it.size ?? null)}>
                                +
                              </button>
                            </div>
                          </div>

                          <button type="button" className="rm" onClick={() => removeFromCart(it.id, it.color ?? null, it.size ?? null)}>
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="sum">
                  <div className="line">
                    <span>Items</span>
                    <span>{cartCount}</span>
                  </div>
                  <div className="line total">
                    <span>Total</span>
                    <span>${moneyCOP(cartTotal)}</span>
                  </div>

                  <div className="actions">
                    <button type="button" className="btnGhost" onClick={clearCart}>
                      Vaciar
                    </button>
                    <button
                      type="button"
                      className="btnMain"
                      onClick={() => {
                        closePanel();
                        router.push("/checkout");
                      }}
                    >
                      Pagar ahora
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}

      <style jsx>{`
        /* ✅ Footer al final (aunque la página sea corta) */
        .pageWrap {
          min-height: calc(100vh - var(--jusp-header-h, 64px));
          display: flex;
          flex-direction: column;
        }
        .pageMain {
          flex: 1;
        }

        .bag {
          position: fixed;
          top: calc((var(--jusp-header-h, 64px) - 44px) / 2);
          right: 14px;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
          display: grid;
          place-items: center;
          z-index: 999;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
          transition: transform 140ms ease;
        }
        .bag:active {
          transform: scale(0.98);
        }
        .ico {
          font-size: 18px;
          transform: translateY(-1px);
        }
        .badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          font-size: 11px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        /* ✅ Mega footer: igual, pero NO fijo */
        .mega {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 -14px 40px rgba(0, 0, 0, 0.08);
        }
        .megaInner {
          width: min(1220px, calc(100vw - 24px));
          margin: 0 auto;
          padding: 14px 0 12px;
        }
        .megaTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 2px 0 10px;
        }
        .megaBrand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255, 214, 10, 0.95);
          box-shadow: 0 0 0 6px rgba(255, 214, 10, 0.16);
        }
        .megaKicker {
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.74);
          font-size: 12px;
        }
        .megaToggle {
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.02);
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 950;
          cursor: pointer;
          color: #111;
        }
        .megaToggle:active {
          transform: scale(0.99);
        }

        .megaGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1.1fr;
          gap: 26px;
          padding: 12px 0 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .colT {
          font-weight: 950;
          color: #111;
          font-size: 12px;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .colL {
          display: grid;
          gap: 10px;
        }
        .a {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.64);
          text-decoration: none;
          font-size: 12px;
          line-height: 1.2;
        }
        .a:hover {
          color: #111;
        }

        .megaBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .copy {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
        }
        .legal {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .l {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.6);
          text-decoration: none;
          font-size: 12px;
        }
        .l:hover {
          color: #111;
        }

        @media (max-width: 980px) {
          .megaGrid {
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }
        }
        @media (max-width: 640px) {
          .megaInner {
            width: calc(100vw - 18px);
          }
          .megaGrid {
            grid-template-columns: 1fr;
          }
          .legal {
            gap: 10px;
          }
        }

        .toast {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          top: calc(var(--jusp-header-h, 64px) + 14px);
          width: min(560px, calc(100vw - 22px));
          z-index: 2100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-radius: 16px;
          padding: 12px 12px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.16);
        }
        .toastL {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .toastT {
          font-weight: 950;
          color: #111;
          letter-spacing: -0.02em;
          font-size: 13px;
        }
        .toastS {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 360px;
        }
        .toastR {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .toastUndo {
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(0, 0, 0, 0.02);
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 950;
          cursor: pointer;
          color: #111;
        }
        .toastUndo:active {
          transform: scale(0.99);
        }
        .toastX {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          cursor: pointer;
          font-weight: 950;
        }

        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.42);
          z-index: 1200;
          display: flex;
          justify-content: flex-end;
        }
        .drawer {
          width: min(420px, 92vw);
          height: 100%;
          background: #fff;
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }

        .dTop {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .dTitle {
          font-weight: 950;
          font-size: 16px;
          color: #111;
        }
        .x {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 950;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.7);
        }

        .empty {
          padding: 18px 16px;
        }
        .eTitle {
          font-weight: 950;
          font-size: 15px;
          color: #111;
        }
        .eSub {
          margin-top: 6px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.6);
          font-size: 12px;
        }

        .list {
          padding: 12px 16px;
          overflow: auto;
          flex: 1;
        }
        .row {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .thumb {
          width: 88px;
          height: 88px;
          border-radius: 16px;
          background: #f5f5f5;
          overflow: hidden;
          display: grid;
          place-items: center;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 10px;
          display: block;
        }
        .ph {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
        }

        .name {
          font-weight: 950;
          color: #111;
          font-size: 13px;
          line-height: 1.2;
        }
        .opts {
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .opt {
          font-weight: 900;
          font-size: 11px;
          color: rgba(0, 0, 0, 0.62);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 999px;
          padding: 6px 8px;
        }

        .bottom {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .price {
          font-weight: 950;
          color: #111;
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .q {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
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

        .rm {
          margin-top: 10px;
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          padding: 0;
        }
        .rm:hover {
          color: #111;
        }

        .sum {
          padding: 14px 16px 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }
        .line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.65);
          font-size: 12px;
          padding: 6px 0;
        }
        .line.total {
          font-weight: 950;
          color: #111;
          font-size: 13px;
          padding-top: 10px;
        }

        .actions {
          margin-top: 12px;
          display: flex;
          gap: 10px;
        }
        .btnGhost {
          flex: 1;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 14px;
          padding: 12px 12px;
          font-weight: 950;
          cursor: pointer;
        }
        .btnMain {
          flex: 1.2;
          border: 0;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          border-radius: 14px;
          padding: 12px 12px;
          font-weight: 950;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}