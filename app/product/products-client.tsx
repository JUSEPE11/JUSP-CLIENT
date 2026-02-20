// app/product/products-client.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRODUCTS, type Product } from "@/lib/products";
import { isFavorite, toggleFavorite } from "@/lib/toggleFavorite";
import { useStore } from "../components/store";

/** =========================
 * Utils
 * ========================= */
function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function computeSale(price: number, discountPercent?: number) {
  const d = typeof discountPercent === "number" ? clamp(discountPercent, 0, 90) : 0;
  if (!d) return { has: false, was: price, now: price, d: 0 };
  const now = Math.round(price * (1 - d / 100));
  return { has: true, was: price, now, d };
}
function pickImgs(p: Product): { main: string | null; alt: string | null } {
  const imgs = Array.isArray((p as any).images) ? ((p as any).images as string[]) : [];
  const main = (imgs?.[0] || (typeof (p as any).image === "string" ? (p as any).image : "") || "").trim();
  const alt = (imgs?.[1] || "").trim();
  return { main: main || null, alt: alt || null };
}
function safeArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim())
    : [];
}
function uniq(arr: string[]) {
  const out: string[] = [];
  for (const a of arr) if (a && !out.includes(a)) out.push(a);
  return out;
}
function genderLabel(g?: Product["gender"]) {
  if (g === "men") return "Hombre";
  if (g === "women") return "Mujer";
  if (g === "kids") return "Niños";
  if (g === "unisex") return "Hombre";
  return "Hombre";
}
function typeLabel(category?: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("sandal")) return "Sandalias";
  if (c.includes("slides")) return "Sandalias";
  if (c.includes("access")) return "Accesorios";
  if (c.includes("clothing")) return "Ropa";
  return "Zapatillas";
}
function emitFavEvent() {
  try {
    window.dispatchEvent(new Event("jusp:favorites"));
  } catch {}
}

/** Color swatch: nombre -> color real (fallback robusto) */
function colorToCss(name: string) {
  const n = (name || "").trim().toLowerCase();
  const map: Record<string, string> = {
    black: "#111111",
    negro: "#111111",
    white: "#ffffff",
    blanco: "#ffffff",
    grey: "#9ca3af",
    gray: "#9ca3af",
    gris: "#9ca3af",
    red: "#ef4444",
    rojo: "#ef4444",
    blue: "#3b82f6",
    azul: "#3b82f6",
    green: "#22c55e",
    verde: "#22c55e",
    yellow: "#facc15",
    amarillo: "#facc15",
    orange: "#fb923c",
    naranja: "#fb923c",
    purple: "#a855f7",
    morado: "#a855f7",
    pink: "#fb7185",
    rosado: "#fb7185",
    brown: "#92400e",
    cafe: "#92400e",
    café: "#92400e",
    beige: "#e7d3b1",
    cream: "#f5f5dc",
    gold: "#d4af37",
    silver: "#c0c0c0",
  };
  if (map[n]) return map[n];

  const cssCandidate = name.trim();
  if (!cssCandidate) return "rgba(0,0,0,0.22)";

  try {
    const el = document.createElement("span");
    el.style.color = "";
    el.style.color = cssCandidate;
    if (el.style.color) return cssCandidate;
  } catch {}

  return "rgba(0,0,0,0.22)";
}

/** =========================
 * Tiny UI
 * ========================= */
function Chevron({ open }: { open: boolean }) {
  return (
    <span className={`ch ${open ? "on" : ""}`} aria-hidden="true">
      ▾
      <style jsx>{`
        .ch {
          display: inline-block;
          transition: transform 160ms ease;
          transform: rotate(-90deg);
          font-weight: 950;
          color: rgba(0, 0, 0, 0.65);
          line-height: 1;
        }
        .ch.on {
          transform: rotate(0deg);
        }
      `}</style>
    </span>
  );
}

function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sec">
      <button className="secTop" type="button" onClick={onToggle} aria-expanded={open}>
        <span className="secT">{title}</span>
        <Chevron open={open} />
      </button>
      {open ? <div className="secBody">{children}</div> : null}

      <style jsx>{`
        .sec {
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          padding: 12px 0;
        }
        .secTop {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }
        .secT {
          font-weight: 950;
          color: #111;
          font-size: 14px;
        }
        .secBody {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Page
 * ========================= */
type SortKey = "launch" | "price_asc" | "price_desc" | "title_asc";
type DiscountCap = 0 | 20 | 30 | 40 | 50 | 60;

/** URL keys (fuente de verdad para persistencia) */
const Q = {
  sort: "sort",
  d: "d",
  type: "type",
  brand: "brand",
  color: "color",
  size: "size",
  side: "side",
} as const;

function parseDiscountCap(v: string | null): DiscountCap {
  const n = Number(v);
  if (n === 20 || n === 30 || n === 40 || n === 50 || n === 60) return n;
  return 0;
}
function parseSort(v: string | null): SortKey {
  if (v === "price_desc" || v === "price_asc" || v === "title_asc" || v === "launch") return v;
  return "launch";
}
function normStr(v: string | null) {
  const s = (v || "").trim();
  return s ? s : null;
}

function ProductsInner({ initialProducts }: { initialProducts: Product[] }) {
  const all = useMemo(() => (initialProducts?.length ? initialProducts : PRODUCTS ?? []), [initialProducts]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ ya no usamos addToCart aquí (solo en detalle)
  const { state } = useStore();

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [secDiscount, setSecDiscount] = useState(true);
  const [secType, setSecType] = useState(true);
  const [secBrand, setSecBrand] = useState(true);
  const [secColor, setSecColor] = useState(true);
  const [secSize, setSecSize] = useState(true);

  const sort = useMemo(() => parseSort(searchParams.get(Q.sort)), [searchParams]);
  const dCap = useMemo(() => parseDiscountCap(searchParams.get(Q.d)), [searchParams]);
  const type = useMemo(() => normStr(searchParams.get(Q.type)), [searchParams]);
  const brand = useMemo(() => normStr(searchParams.get(Q.brand)), [searchParams]);
  const color = useMemo(() => normStr(searchParams.get(Q.color)), [searchParams]);
  const size = useMemo(() => normStr(searchParams.get(Q.size)), [searchParams]);

  const sideRef = useRef<HTMLElement | null>(null);
  const [sideScrolled, setSideScrolled] = useState(false);

  // ✅ Evita hydration mismatch por favoritos (localStorage) + fuerza re-render al togglear
  const [mounted, setMounted] = useState(false);
  const [favTick, setFavTick] = useState(0);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = sideRef.current;
    if (!el) return;
    const onScroll = () => setSideScrolled(el.scrollTop > 10);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [filtersOpen]);

  // opciones
  const types = useMemo(() => uniq(all.map((p) => typeLabel((p as any).category))).sort(), [all]);
  const brands = useMemo(() => uniq(all.map((p) => String((p as any).brand || "Nike"))).sort(), [all]);
  const colors = useMemo(() => uniq(all.flatMap((p) => safeArr((p as any).colors))).sort(), [all]);
  const sizes = useMemo(() => uniq(all.flatMap((p) => safeArr((p as any).sizes))).sort(), [all]);

  function setParam(key: string, value: string | null) {
    const sp = new URLSearchParams(searchParams.toString());
    if (!value) sp.delete(key);
    else sp.set(key, value);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function resetFilters() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete(Q.d);
    sp.delete(Q.type);
    sp.delete(Q.brand);
    sp.delete(Q.color);
    sp.delete(Q.size);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    let list = [...all];

    // Discount
    if (dCap) {
      list = list.filter((p) => {
        const disc = Number((p as any).discountPercent ?? (p as any).discount ?? 0);
        return Number.isFinite(disc) && disc >= dCap;
      });
    }
    // Type
    if (type) list = list.filter((p) => typeLabel((p as any).category) === type);
    // Brand
    if (brand) list = list.filter((p) => String((p as any).brand || "Nike") === brand);
    // Color
    if (color) list = list.filter((p) => safeArr((p as any).colors).includes(color));
    // Size
    if (size) list = list.filter((p) => safeArr((p as any).sizes).includes(size));

    // Sorting
    if (sort === "launch") {
      const isNewProduct = (p: Product) => {
        const v = Number((p as any).isNew ?? 0);
        const disc = Number((p as any).discountPercent ?? 0);
        return Boolean(v || disc >= 40);
      };
      list.sort((a, b) => Number(isNewProduct(b)) - Number(isNewProduct(a)));
    } else if (sort === "price_asc") {
      list.sort((a, b) => Number((a as any).price ?? 0) - Number((b as any).price ?? 0));
    } else if (sort === "price_desc") {
      list.sort((a, b) => Number((b as any).price ?? 0) - Number((a as any).price ?? 0));
    } else if (sort === "title_asc") {
      list.sort((a, b) => String((a as any).name ?? "").localeCompare(String((b as any).name ?? "")));
    }

    return list;
  }, [all, dCap, type, brand, color, size, sort]);

  const favCount = useMemo(() => {
    try {
      return (state as any)?.favorites?.length ? (state as any).favorites.length : 0;
    } catch {
      return 0;
    }
  }, [state]);

  return (
    <main className="root">
      <div className="topbar">
        <div className="brand">
          <Link href="/" className="logo">
            JUSP
          </Link>
          <div className="pill">{filtered.length} productos</div>
        </div>

        <div className="actions">
          <button className="btn" type="button" onClick={() => setFiltersOpen((v) => !v)}>
            Filtros
          </button>
          <Link className="btn ghost" href="/favorites">
            Favoritos <span className="b">{favCount}</span>
          </Link>
        </div>
      </div>

      <div className={`layout ${filtersOpen ? "" : "noSide"}`}>
        <aside className={`sideWrap ${filtersOpen ? "open" : "closed"}`} aria-hidden={!filtersOpen}>
          <aside
            ref={(n) => {
              sideRef.current = n;
            }}
            className="side"
            aria-label="Filtros"
          >
            <div className="fadeTop" aria-hidden="true" />
            <div className="fadeBottom" aria-hidden="true" />

            <div className="sideInner">
              <div className={`sideTop ${sideScrolled ? "sc" : ""}`}>
                <div className="sideTitle">Filtros</div>
                <button className="sideReset" type="button" onClick={resetFilters}>
                  Limpiar
                </button>
              </div>

              <FilterSection
                title="Descuento"
                open={secDiscount}
                onToggle={() => setSecDiscount((v) => !v)}
              >
                <div className="row3">
                  {[0, 20, 30, 40, 50, 60].map((n) => {
                    const v = n === 0 ? null : String(n);
                    const on = dCap === (n as any);
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`chip ${on ? "on" : ""}`}
                        onClick={() => setParam(Q.d, v)}
                      >
                        {n === 0 ? "Todos" : `${n}%+`}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection title="Tipo" open={secType} onToggle={() => setSecType((v) => !v)}>
                <div className="row2">
                  <button
                    type="button"
                    className={`chip ${!type ? "on" : ""}`}
                    onClick={() => setParam(Q.type, null)}
                  >
                    Todos
                  </button>
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`chip ${type === t ? "on" : ""}`}
                      onClick={() => setParam(Q.type, t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Marca" open={secBrand} onToggle={() => setSecBrand((v) => !v)}>
                <div className="row2">
                  <button
                    type="button"
                    className={`chip ${!brand ? "on" : ""}`}
                    onClick={() => setParam(Q.brand, null)}
                  >
                    Todas
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`chip ${brand === b ? "on" : ""}`}
                      onClick={() => setParam(Q.brand, b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Color" open={secColor} onToggle={() => setSecColor((v) => !v)}>
                <div className="row2">
                  <button
                    type="button"
                    className={`chip ${!color ? "on" : ""}`}
                    onClick={() => setParam(Q.color, null)}
                  >
                    Todos
                  </button>
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`chip ${color === c ? "on" : ""}`}
                      onClick={() => setParam(Q.color, c)}
                    >
                      <span className="sw" style={{ background: colorToCss(c) }} aria-hidden="true" />
                      {c}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Talla" open={secSize} onToggle={() => setSecSize((v) => !v)}>
                <div className="row3">
                  <button
                    type="button"
                    className={`chip ${!size ? "on" : ""}`}
                    onClick={() => setParam(Q.size, null)}
                  >
                    Todas
                  </button>
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`chip ${size === s ? "on" : ""}`}
                      onClick={() => setParam(Q.size, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <div className="sideFoot" />
            </div>
          </aside>
        </aside>

        <section className="main">
          <div className="toolbar">
            <div className="sort">
              <span className="t">Ordenar</span>
              <div className="sortBtns">
                <button
                  type="button"
                  className={`pillBtn ${sort === "launch" ? "on" : ""}`}
                  onClick={() => setParam(Q.sort, "launch")}
                >
                  Novedad
                </button>
                <button
                  type="button"
                  className={`pillBtn ${sort === "price_asc" ? "on" : ""}`}
                  onClick={() => setParam(Q.sort, "price_asc")}
                >
                  $ ↑
                </button>
                <button
                  type="button"
                  className={`pillBtn ${sort === "price_desc" ? "on" : ""}`}
                  onClick={() => setParam(Q.sort, "price_desc")}
                >
                  $ ↓
                </button>
                <button
                  type="button"
                  className={`pillBtn ${sort === "title_asc" ? "on" : ""}`}
                  onClick={() => setParam(Q.sort, "title_asc")}
                >
                  A–Z
                </button>
              </div>
            </div>
          </div>

          <div className="grid">
            {filtered.map((p) => {
              const { main } = pickImgs(p);
              const price = Number((p as any).price ?? 0) || 0;
              const disc = Number((p as any).discountPercent ?? (p as any).discount ?? 0);
              const sale = computeSale(price, disc);

              const favKey = String((p as any).id || (p as any).slug || (p as any).name || "");
              const fav = mounted ? isFavorite(favKey) : false; // ✅ server+1er paint: false

              return (
                <article key={favKey} className="card">
                  <Link className="img" href={`/product?id=${encodeURIComponent(String((p as any).id || ""))}`}>
                    {main ? <img src={main} alt={String((p as any).name || "Producto")} /> : <div className="ph" />}
                    {sale.has ? <div className="badge">-{sale.d}%</div> : null}
                  </Link>

                  <div className="meta">
                    <div className="name">{String((p as any).name || "Producto")}</div>
                    <div className="sub">
                      {genderLabel((p as any).gender)} · {typeLabel((p as any).category)}
                    </div>

                    <div className="row">
                      <div className="price">
                        {sale.has ? (
                          <>
                            <span className="was">${moneyCOP(sale.was)}</span>
                            <b>${moneyCOP(sale.now)}</b>
                          </>
                        ) : (
                          <b>${moneyCOP(price)}</b>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`fav ${fav ? "on" : ""}`}
                        onClick={() => {
                          toggleFavorite({ id: favKey });
                          setFavTick((t) => t + 1); // ✅ re-render inmediato
                          emitFavEvent();
                        }}
                        aria-label="Favorito"
                        suppressHydrationWarning
                      >
                        ♥
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <style jsx>{`
        .root {
          padding-top: calc(var(--jusp-header-h, 64px) + 14px);
          padding: 14px 14px 40px;
          background: #fff;
          min-height: 100vh;
        }
        .topbar {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo {
          text-decoration: none;
          font-weight: 950;
          letter-spacing: 0.12em;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.65);
        }
        .pill {
          font-weight: 950;
          font-size: 12px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.7);
          background: rgba(0, 0, 0, 0.02);
        }
        .actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn {
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          color: rgba(0, 0, 0, 0.8);
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 950;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn.ghost {
          background: rgba(0, 0, 0, 0.02);
        }
        .b {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
        }

        .layout {
          max-width: 1200px;
          margin: 14px auto 0;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 14px;
          align-items: start;
        }
        .layout.noSide {
          grid-template-columns: 1fr;
        }

        .sideWrap {
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 14px);
        }
        .sideWrap.closed {
          display: none;
        }
        .side {
          max-height: calc(100vh - (var(--jusp-header-h, 64px) + 28px));
          overflow: auto;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          background: #fff;
          position: relative;
        }
        .fadeTop,
        .fadeBottom {
          position: sticky;
          left: 0;
          right: 0;
          height: 12px;
          z-index: 2;
          pointer-events: none;
        }
        .fadeTop {
          top: 0;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
        }
        .fadeBottom {
          bottom: 0;
          background: linear-gradient(to top, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
        }
        .sideInner {
          padding: 12px 12px 2px;
        }
        .sideTop {
          position: sticky;
          top: 0;
          z-index: 3;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .sideTop.sc {
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
        }
        .sideTitle {
          font-weight: 950;
          color: #111;
        }
        .sideReset {
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.02);
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 950;
          cursor: pointer;
        }
        .sideFoot {
          height: 10px;
        }

        .row2 {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .row3 {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          border-radius: 999px;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .chip.on {
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.2);
        }
        .sw {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.18);
        }

        .main {
          min-width: 0;
        }
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.02);
        }
        .sort {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .t {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.7);
          font-size: 12px;
        }
        .sortBtns {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pillBtn {
          border-radius: 999px;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          font-weight: 950;
          cursor: pointer;
        }
        .pillBtn.on {
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .card {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.06);
        }
        .img {
          position: relative;
          display: block;
          aspect-ratio: 1/1;
          background: rgba(0, 0, 0, 0.02);
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ph {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0.06), rgba(0,0,0,0.02));
        }
        .badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
        }
        .meta {
          padding: 12px;
        }
        .name {
          font-weight: 950;
          color: #111;
          line-height: 1.2;
        }
        .sub {
          margin-top: 6px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.6);
          font-size: 12px;
        }
        .row {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .price {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .was {
          text-decoration: line-through;
          color: rgba(0, 0, 0, 0.45);
          font-weight: 900;
          font-size: 12px;
        }
        .price b {
          color: #111;
          font-weight: 950;
        }
        .fav {
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          border-radius: 999px;
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 950;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.55);
        }
        .fav.on {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.25);
          color: rgba(239, 68, 68, 0.95);
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .sideWrap {
            position: relative;
            top: 0;
          }
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 520px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  return <ProductsInner initialProducts={initialProducts} />;
}
