"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/toggleFavorite";

type PdpProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  description: string;
  price: number;
  currency?: string;
  category?: string;
  gender?: string;

  images: string[];
  sizes?: string[];
  colors?: string[];

  discountPercent?: number;
  isNew?: boolean;
  bestSeller?: boolean;
  stockHint?: number | null;
};

type CrossSellItem = {
  id: string;
  title: string;
  brand?: string;
  price: number;
  currency?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  discountPercent?: number;
  isNew?: boolean;
  bestSeller?: boolean;
  stockHint?: number | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
}

function computeSale(price: number, discountPercent?: number) {
  const d = typeof discountPercent === "number" ? clamp(discountPercent, 0, 90) : 0;
  if (!d) return { has: false, was: price, now: price, d: 0 };
  const now = Math.round(price * (1 - d / 100));
  return { has: true, was: price, now, d };
}

function pickImg(images?: string[]) {
  const arr = Array.isArray(images) ? images : [];
  return (arr[0] || "").trim() || null;
}

function emitFavEvent() {
  try {
    window.dispatchEvent(new Event("jusp:favorites"));
  } catch {}
}

export default function PdpClient({
  product,
  crossSell,
}: {
  product: PdpProduct;
  crossSell: CrossSellItem[];
}) {
  const imgs = useMemo(() => (Array.isArray(product.images) && product.images.length ? product.images : []), [product.images]);
  const sizes = useMemo(() => safeArr(product.sizes), [product.sizes]);
  const colors = useMemo(() => safeArr(product.colors), [product.colors]);

  const [ready, setReady] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const [size, setSize] = useState<string | null>(sizes[0] || null);
  const [color, setColor] = useState<string | null>(colors[0] || null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<any>(null);

  const [fav, setFav] = useState(false);
  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<any>(null);

  // ✅ Micro-animación SOLO para badge "GUARDADO"
  const [savedPop, setSavedPop] = useState(false);
  const savedPopTimer = useRef<any>(null);

  function syncFav() {
    setFav(isFavorite(product.id));
  }

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);

    syncFav();

    const onFav = () => syncFav();
    window.addEventListener("jusp:favorites", onFav);

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      syncFav();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearTimeout(t);
      window.removeEventListener("jusp:favorites", onFav);
      window.removeEventListener("storage", onStorage);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      if (savedPopTimer.current) clearTimeout(savedPopTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    setImgIdx(0);
    setSize(sizes[0] || null);
    setColor(colors[0] || null);
  }, [product.id, sizes, colors]);

  // 🔥 dispara pop cuando pasa a favorito (y solo ahí)
  useEffect(() => {
    if (!fav) return;
    setSavedPop(true);
    if (savedPopTimer.current) clearTimeout(savedPopTimer.current);
    savedPopTimer.current = setTimeout(() => setSavedPop(false), 520);
  }, [fav]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function pulseHeart() {
    setPulse(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse(false), 260);
  }

  const sale = useMemo(() => computeSale(product.price, product.discountPercent), [product.price, product.discountPercent]);

  const badges = useMemo(() => {
    const out: Array<{ label: string; tone: "dark" | "soft" | "warn" | "saved" }> = [];
    if (product.isNew) out.push({ label: "NEW", tone: "soft" });
    if (product.bestSeller) out.push({ label: "BEST SELLER", tone: "dark" });
    if (sale.has) out.push({ label: `-${sale.d}%`, tone: "warn" });

    const stockHint = typeof product.stockHint === "number" ? product.stockHint : null;
    if (stockHint !== null && stockHint > 0 && stockHint <= 10) out.push({ label: `QUEDAN ${stockHint}`, tone: "warn" });

    if (fav) out.push({ label: "GUARDADO", tone: "saved" });

    return out.slice(0, 4);
  }, [product.isNew, product.bestSeller, product.stockHint, sale.has, sale.d, fav]);

  const heroLine = useMemo(() => {
    const parts: string[] = [];
    if (product.brand) parts.push(product.brand);
    if (product.category) parts.push(product.category);
    if (product.gender) parts.push(String(product.gender).toUpperCase());
    return parts.filter(Boolean).join(" · ");
  }, [product.brand, product.category, product.gender]);

  const href = `/product/${encodeURIComponent(product.slug || product.id)}`;

  function onToggleFavorite() {
    const mainImg = pickImg(imgs) || null;

    const res = toggleFavorite({
      id: product.id,
      title: product.title,
      price: product.price,
      image: mainImg,
      brand: product.brand || null,
      size: size || null,
      color: color || null,
      href,
    });

    setFav(res.added);
    emitFavEvent();

    pulseHeart();
    showToast(res.added ? "Guardado en favoritos" : "Quitado de favoritos");
  }

  function copyText(label: string, value: string) {
    if (!value) return showToast("Nada para copiar");
    try {
      navigator.clipboard.writeText(value);
      showToast(`${label} copiado`);
    } catch {
      showToast("No se pudo copiar");
    }
  }

  return (
    <div className="pdp-root">
      <div className={`wrap ${ready ? "in" : ""}`}>
        {/* Top bar */}
        <div className="top">
          <Link className="btn ghost" href="/products">
            ← Volver
          </Link>
          <div className="topRight">
            <Link className="btn ghost" href="/favorites">
              Favoritos
            </Link>
            <button
              className={`btn heart ${fav ? "on" : ""} ${pulse ? "pulse" : ""}`}
              onClick={onToggleFavorite}
              type="button"
            >
              <span className="hi">{fav ? "♥" : "♡"}</span>
              <span className="ht">{fav ? "Guardado" : "Guardar"}</span>
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          {/* Gallery */}
          <div className="gallery">
            <div className="stage">
              {imgs.length ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={imgs[imgIdx]} className="stageImg" src={imgs[imgIdx]} alt={product.title} />
              ) : (
                <div className="stageEmpty">
                  <span className="dot" />
                  <span>Sin imágenes</span>
                </div>
              )}

              <div className="stageTop">
                <div className="badges">
                  {badges.map((b) => (
                    <span
                      key={b.label}
                      className={`badge ${b.tone} ${b.tone === "saved" && savedPop ? "pop" : ""}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>

                <div className="pricePill">
                  {sale.has ? (
                    <>
                      <span className="was">${moneyCOP(sale.was)}</span>
                      <span className="now">${moneyCOP(sale.now)}</span>
                    </>
                  ) : (
                    <span className="now">${moneyCOP(product.price)}</span>
                  )}
                </div>
              </div>
            </div>

            {imgs.length > 1 ? (
              <div className="thumbs" role="list">
                {imgs.slice(0, 8).map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className={`th ${i === imgIdx ? "on" : ""}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="thumb" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info */}
          <div className="info">
            <div className="kicker">PRODUCTO</div>
            <h1 className="title">{product.title}</h1>
            {heroLine ? <div className="metaLine">{heroLine}</div> : null}

            <p className="desc">{product.description}</p>

            {/* Selectors */}
            <div className="selectors">
              <div className="sel">
                <div className="selTop">
                  <div className="selLabel">Talla</div>
                  <div className="selHint">
                    {sizes.length ? (
                      <span>
                        Seleccionada: <span className="mono">{size || "—"}</span>
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>

                {sizes.length ? (
                  <div className="chips" role="list">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`chip ${size === s ? "on" : ""}`}
                        onClick={() => setSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="emptyLine">Este producto no tiene tallas configuradas aún.</div>
                )}
              </div>

              <div className="sel">
                <div className="selTop">
                  <div className="selLabel">Color</div>
                  <div className="selHint">
                    {colors.length ? (
                      <span>
                        Seleccionado: <span className="mono">{color || "—"}</span>
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>

                {colors.length ? (
                  <div className="chips" role="list">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`chip ${color === c ? "on" : ""}`}
                        onClick={() => setColor(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="emptyLine">Este producto no tiene colores configurados aún.</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="cta">
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  const payload = {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    size: size || null,
                    color: color || null,
                  };
                  copyText("Selección", JSON.stringify(payload));
                }}
              >
                Copiar selección
              </button>

              <button className="btn ghost" type="button" onClick={() => copyText("ID", product.id)}>
                Copiar ID
              </button>

              <button className="btn ghost" type="button" onClick={() => copyText("Link", window.location.href)}>
                Copiar link
              </button>
            </div>

            <div className="note">
              <b>Pro tip:</b> el corazón guarda <span className="mono">price/image/brand/size/color</span> y tu página{" "}
              <b>/favorites</b> ya lo renderiza premium.
            </div>
          </div>
        </div>

        {/* Cross-sell */}
        {Array.isArray(crossSell) && crossSell.length ? (
          <div className="xs">
            <div className="xsTop">
              <div>
                <div className="kicker">RECOMENDADOS</div>
                <div className="xsTitle">También te puede gustar</div>
              </div>
              <Link className="btn ghost" href="/products">
                Ver todo
              </Link>
            </div>

            <div className="grid">
              {crossSell.map((p, idx) => {
                const cimgs = Array.isArray(p.images) ? p.images : [];
                const cimg = pickImg(cimgs);
                const csale = computeSale(p.price, p.discountPercent);

                const cBadges: Array<{ label: string; tone: "dark" | "soft" | "warn" }> = [];
                if (p.isNew) cBadges.push({ label: "NEW", tone: "soft" });
                if (p.bestSeller) cBadges.push({ label: "BEST SELLER", tone: "dark" });
                if (csale.has) cBadges.push({ label: `-${csale.d}%`, tone: "warn" });
                if (typeof p.stockHint === "number" && p.stockHint > 0 && p.stockHint <= 10) cBadges.push({ label: `QUEDAN ${p.stockHint}`, tone: "warn" });

                const chHref = `/product/${encodeURIComponent(p.id)}`;

                return (
                  <div key={p.id} className="card" style={{ animationDelay: `${Math.min(idx * 14, 160)}ms` }}>
                    <Link href={chHref} className="cardLink">
                      <div className="cImg">
                        {cimg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cimg} alt={p.title} loading="lazy" />
                        ) : (
                          <div className="cNoimg">
                            <span className="dot" />
                            <span>Sin imagen</span>
                          </div>
                        )}

                        <div className="cTop">
                          <div className="badges">
                            {cBadges.slice(0, 2).map((b) => (
                              <span key={b.label} className={`badge ${b.tone}`}>
                                {b.label}
                              </span>
                            ))}
                          </div>

                          <div className="pricePill">
                            {csale.has ? (
                              <>
                                <span className="was">${moneyCOP(csale.was)}</span>
                                <span className="now">${moneyCOP(csale.now)}</span>
                              </>
                            ) : (
                              <span className="now">${moneyCOP(p.price)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="cBody">
                        <div className="cTitle">{p.title}</div>
                        <div className="cFoot">
                          <span>Ver</span>
                          <span className="arrow">→</span>
                        </div>
                      </div>
                    </Link>

                    <button
                      className="miniHeart"
                      type="button"
                      aria-label="Guardar favorito"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const res = toggleFavorite({
                          id: p.id,
                          title: p.title,
                          price: p.price,
                          image: cimg,
                          brand: p.brand || null,
                          size: safeArr(p.sizes)[0] || null,
                          color: safeArr(p.colors)[0] || null,
                          href: chHref,
                        });

                        emitFavEvent();
                        showToast(res.added ? "Guardado en favoritos" : "Quitado de favoritos");
                      }}
                    >
                      <span className="mh">♥</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>

      <style jsx>{`
        .pdp-root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding: 18px 16px 34px;
          background:
            radial-gradient(1200px 600px at 20% 0%, rgba(0,0,0,0.06), transparent 55%),
            radial-gradient(900px 520px at 90% 15%, rgba(0,0,0,0.04), transparent 60%),
            #f7f7f7;
          min-height: 100vh;
        }
        .wrap {
          max-width: 1180px;
          margin: 0 auto;
          transform: translateY(10px);
          opacity: 0;
          transition: transform 420ms ease, opacity 420ms ease;
        }
        .wrap.in { transform: translateY(0); opacity: 1; }

        .top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }
        .topRight {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn {
          border: 0;
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          background: #111;
          color: #fff;
          font-size: 13px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          line-height: 1;
          transition: transform 140ms ease, opacity 140ms ease, background 140ms ease;
        }
        .btn:active { transform: scale(0.98); }
        .btn.ghost {
          background: rgba(255,255,255,0.92);
          color: #111;
          border: 1px solid rgba(0,0,0,0.14);
        }
        .btn.ghost:hover { background: rgba(0,0,0,0.03); }

        .btn.heart {
          background: rgba(255,255,255,0.92);
          color: #111;
          border: 1px solid rgba(0,0,0,0.14);
        }
        .btn.heart.on {
          background: rgba(17,17,17,0.92);
          color: rgba(255,255,255,0.95);
          border-color: rgba(255,255,255,0.16);
        }
        .btn.heart.pulse { animation: pulse 260ms ease; }
        @keyframes pulse {
          0% { transform: scale(1); }
          35% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .hi { font-size: 16px; transform: translateY(-1px); }
        .ht { font-size: 12px; }

        .main {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 14px;
          align-items: start;
        }

        .gallery {
          border-radius: 28px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 26px 70px rgba(0,0,0,0.10);
          overflow: hidden;
        }
        .stage {
          position: relative;
          height: 520px;
          background: rgba(0,0,0,0.03);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .stageImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          animation: fadeIn 240ms ease both;
        }
        @keyframes fadeIn { from { opacity: 0.35; transform: scale(1.01);} to { opacity: 1; transform: scale(1);} }

        .stageEmpty {
          height: 100%;
          display: grid;
          place-items: center;
          gap: 8px;
          color: rgba(0,0,0,0.55);
          font-weight: 900;
        }

        .stageTop {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          pointer-events: none;
        }
        .badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          max-width: 70%;
        }
        .badge {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 950;
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(0,0,0,0.10);
          color: rgba(0,0,0,0.78);
          backdrop-filter: blur(8px);
          white-space: nowrap;
        }
        .badge.dark {
          background: rgba(17,17,17,0.90);
          border-color: rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.92);
        }
        .badge.soft {
          background: rgba(255,214,0,0.55);
          border-color: rgba(0,0,0,0.12);
          color: #111;
        }
        .badge.warn {
          background: rgba(239, 68, 68, 0.92);
          border-color: rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.95);
        }
        .badge.saved {
          background: rgba(17,17,17,0.92);
          border-color: rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.95);
        }

        /* ✅ Micro-pop SOLO para GUARDADO (barato y limpio) */
        .badge.pop {
          animation: badgePop 520ms cubic-bezier(0.18, 0.9, 0.2, 1) both;
        }
        @keyframes badgePop {
          0%   { transform: translateY(-2px) scale(0.96); filter: drop-shadow(0 0 0 rgba(255,214,0,0)); }
          45%  { transform: translateY(0) scale(1.06);  filter: drop-shadow(0 10px 18px rgba(0,0,0,0.10)); }
          100% { transform: translateY(0) scale(1.00);  filter: drop-shadow(0 6px 14px rgba(0,0,0,0.06)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .badge.pop { animation: none; }
          .btn.heart.pulse { animation: none; }
          .stageImg { animation: none; }
        }

        .pricePill {
          border-radius: 999px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(0,0,0,0.10);
          backdrop-filter: blur(8px);
          display: flex;
          gap: 8px;
          align-items: baseline;
          white-space: nowrap;
        }
        .was {
          font-size: 11px;
          font-weight: 950;
          opacity: 0.55;
          text-decoration: line-through;
        }
        .now {
          font-size: 12px;
          font-weight: 950;
          color: rgba(0,0,0,0.86);
        }

        .thumbs {
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
          background: rgba(255,255,255,0.92);
        }
        .th {
          border: 1px solid rgba(0,0,0,0.10);
          border-radius: 18px;
          overflow: hidden;
          background: rgba(0,0,0,0.03);
          cursor: pointer;
          padding: 0;
          height: 72px;
          transition: transform 140ms ease, border-color 140ms ease;
        }
        .th:active { transform: scale(0.98); }
        .th.on { border-color: rgba(0,0,0,0.35); }
        .th img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .info {
          border-radius: 28px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 26px 70px rgba(0,0,0,0.10);
          padding: 16px;
        }
        .kicker {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: rgba(0,0,0,0.55);
        }
        .title {
          margin: 8px 0 6px;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #111;
          line-height: 1.1;
        }
        .metaLine {
          font-size: 12px;
          font-weight: 950;
          color: rgba(0,0,0,0.62);
        }
        .desc {
          margin: 12px 0 0;
          font-size: 13px;
          line-height: 1.7;
          color: rgba(0,0,0,0.72);
          font-weight: 900;
        }

        .selectors {
          margin-top: 14px;
          display: grid;
          gap: 12px;
        }
        .sel {
          border-radius: 22px;
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(0,0,0,0.02);
          padding: 12px;
        }
        .selTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          align-items: baseline;
        }
        .selLabel {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.12em;
          color: rgba(0,0,0,0.55);
          text-transform: uppercase;
        }
        .selHint {
          font-size: 12px;
          font-weight: 900;
          color: rgba(0,0,0,0.62);
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
          font-weight: 950;
          color: #111;
        }
        .chips {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chip {
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(0,0,0,0.10);
          background: rgba(255,255,255,0.80);
          color: rgba(0,0,0,0.78);
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease;
        }
        .chip:active { transform: scale(0.98); }
        .chip.on {
          background: rgba(17,17,17,0.92);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.95);
        }
        .emptyLine {
          margin-top: 10px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(0,0,0,0.55);
        }

        .cta {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn.primary { background: rgba(17,17,17,0.92); }

        .note {
          margin-top: 12px;
          border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(255,214,0,0.16);
          padding: 12px;
          color: rgba(0,0,0,0.72);
          font-size: 12px;
          font-weight: 900;
          line-height: 1.6;
        }

        .xs { margin-top: 16px; }
        .xsTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .xsTitle {
          margin-top: 6px;
          font-size: 18px;
          font-weight: 950;
          color: #111;
        }

        .grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .card {
          position: relative;
          border-radius: 26px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 22px 60px rgba(0,0,0,0.08);
          overflow: hidden;
          animation: in 360ms ease forwards;
          transform: translateY(10px);
          opacity: 0;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 28px 78px rgba(0,0,0,0.12);
        }
        @keyframes in { to { transform: translateY(0); opacity: 1; } }
        .cardLink { display: block; text-decoration: none; color: inherit; }

        .cImg {
          height: 190px;
          background: rgba(0,0,0,0.03);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
        }
        .cImg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.02);
          transition: transform 260ms ease;
        }
        .card:hover .cImg img { transform: scale(1.06); }

        .cNoimg {
          height: 100%;
          display: grid;
          place-items: center;
          gap: 8px;
          color: rgba(0,0,0,0.55);
          font-weight: 900;
        }

        .cTop {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          pointer-events: none;
        }

        .cBody { padding: 12px; display: grid; gap: 10px; }
        .cTitle {
          font-weight: 950;
          color: #111;
          font-size: 14px;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cFoot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.06);
          font-size: 12px;
          font-weight: 950;
          color: rgba(0,0,0,0.62);
        }
        .arrow { font-weight: 950; color: rgba(0,0,0,0.55); }

        .miniHeart {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.12);
          background: rgba(255,255,255,0.92);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 140ms ease, background 140ms ease;
          z-index: 4;
        }
        .miniHeart:active { transform: scale(0.96); }
        .mh { font-size: 16px; font-weight: 950; transform: translateY(-1px); }

        .toast {
          position: fixed;
          right: 16px;
          bottom: 16px;
          border-radius: 999px;
          padding: 10px 12px;
          background: rgba(17,17,17,0.92);
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 18px 44px rgba(0,0,0,0.25);
          z-index: 90;
        }

        @media (max-width: 1100px) {
          .main { grid-template-columns: 1fr; }
          .stage { height: 420px; }
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .thumbs { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
        @media (max-width: 520px) {
          .stage { height: 360px; }
          .thumbs { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}