"use client";

import Link from "next/link";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PRODUCTS, type Product } from "@/lib/products";
import { isFavorite, toggleFavorite } from "@/lib/toggleFavorite";

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
function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
}
function uniq(arr: string[]) {
  const out: string[] = [];
  for (const a of arr) if (a && !out.includes(a)) out.push(a);
  return out;
}
function pickImgs(p: Product): { main: string | null; alt: string | null } {
  const imgs = Array.isArray((p as any).images) ? ((p as any).images as string[]) : [];
  const main = (imgs?.[0] || (typeof (p as any).image === "string" ? (p as any).image : "") || "").trim();
  const alt = (imgs?.[1] || "").trim();
  return { main: main || null, alt: alt || null };
}
function genderLabel(g?: Product["gender"]) {
  if (g === "men") return "Men's Shoes";
  if (g === "women") return "Women's Shoes";
  if (g === "kids") return "Kids";
  if (g === "unisex") return "Men's Shoes";
  return "Men's Shoes";
}
function typeLabel(category?: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("sandal")) return "Sandals";
  if (c.includes("slides")) return "Slides";
  if (c.includes("access")) return "Accessories";
  if (c.includes("clothing")) return "Clothing";
  return "Shoes";
}
function emitFavEvent() {
  try {
    window.dispatchEvent(new Event("jusp:favorites"));
  } catch {}
}
function normKey(v: string) {
  return (v || "").trim().toLowerCase();
}
function includesLoose(haystack: string, needle: string) {
  const h = normKey(haystack);
  const n = normKey(needle);
  if (!n) return true;
  return h.includes(n);
}

/** =========================
 * Gender scope (MEN / WOMEN / KIDS)
 * Esto controla qué marcas/tallas aparecen
 * ========================= */
type GenderScope = "men" | "women" | "kids";
type GenderScopeParam = GenderScope | "all";

function genderScopeFromPathname(pathname: string): GenderScopeParam {
  const p = (pathname || "").toLowerCase();

  // ✅ Ajusta aquí si tus rutas son distintas (ej: /hombre, /mujer, /ninos)
  if (p.includes("/kids") || p.includes("/kid") || p.includes("kids") || p.includes("ninos") || p.includes("niños"))
    return "kids";
  if (p.includes("/women") || p.includes("women") || p.includes("mujer")) return "women";
  if (p.includes("/men") || p.includes("men") || p.includes("hombre")) return "men";

  return "all";
}

function matchesGenderScope(productGender: any, scope: GenderScopeParam) {
  const g = String(productGender || "").toLowerCase(); // "men" | "women" | "kids" | "unisex" | ""

  if (scope === "all") return true;

  // ✅ Unisex aparece tanto en men como women (NO en kids)
  if (g === "unisex") return scope === "men" || scope === "women";

  if (scope === "men") return g === "men";
  if (scope === "women") return g === "women";
  if (scope === "kids") return g === "kids";

  return true;
}

/** ✅ Fallback de tallas completas por género (fuente de verdad del filtro) */
const MEN_SIZES_FALLBACK = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14"];
const WOMEN_SIZES_FALLBACK = ["5.5","6","6.5","7","7.5","8","8.5","9","9.5"];
const KIDS_SIZES_FALLBACK = ["10C", "10.5C", "11C", "11.5C", "12C", "12.5C", "13C", "13.5C", "1Y", "1.5Y", "2Y", "2.5Y", "3Y", "3.5Y", "4Y", "4.5Y", "5Y", "5.5Y", "6Y", "6.5Y", "7Y"];

/** ✅ Marcas completas (se mezclan con las marcas reales del catálogo por sección) */
const ALL_BRANDS = [
  "Nike",
  "Jordan",
  "Adidas",
  "Puma",
  "New Balance",
  "Reebok",
  "Vans",
  "Converse",
  "ASICS",
  "Under Armour",
  "Skechers",
  "Salomon",
  "Hoka",
  "On",
  "Mizuno",
  "Brooks",
  "Saucony",
  "Fila",
  "Champion",
  "Timberland",
  "Dr. Martens",
  "Crocs",
  "Birkenstock",
  "The North Face",
  "Lacoste",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Yeezy",
  "Gucci",
  "Prada",
  "Balenciaga",
  "Louis Vuitton",
];

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
    "café": "#92400e",
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
 * Types / Query keys
 * ========================= */
type SortKey = "launch" | "price_asc" | "price_desc" | "title_asc";
type DiscountCap = 0 | 20 | 30 | 40 | 50 | 60;

const Q = {
  sort: "sort",
  d: "d",
  type: "type",
  brand: "brand",
  color: "color",
  size: "size",
  price: "p",
  isNew: "new",
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
function sortLabel(sort: SortKey) {
  if (sort === "price_asc") return "Price: Low-High";
  if (sort === "price_desc") return "Price: High-Low";
  if (sort === "title_asc") return "Name: A–Z";
  return "Featured";
}
function parsePriceBucket(v: string | null) {
  const s = (v || "").trim();
  return s ? s : null;
}
function inBucket(price: number, bucket: string | null) {
  if (!bucket) return true;
  const b = bucket.trim();
  if (!b) return true;

  if (b.endsWith("+")) {
    const min = Number(b.slice(0, -1));
    if (!Number.isFinite(min)) return true;
    return price >= min;
  }

  const parts = b.split("-");
  if (parts.length !== 2) return true;
  const min = Number(parts[0]);
  const max = Number(parts[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
  return price >= min && price <= max;
}
function parseBool01(v: string | null) {
  return v === "1" || v === "true" || v === "yes";
}

/** =========================
 * Favorites signal (no hydration mismatch)
 * ========================= */
function useFavoritesSignal() {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const on = () => setTick((t) => t + 1);
    window.addEventListener("jusp:favorites", on);
    return () => window.removeEventListener("jusp:favorites", on);
  }, []);

  return { mounted, tick };
}

/** =========================
 * Icons (Nike-like)
 * ========================= */
function SlidersIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 18h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2" fill="currentColor" />
      <circle cx="10" cy="12" r="2" fill="currentColor" />
      <circle cx="20" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}
function ArrowUpIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M12 5l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** =========================
 * Nike Chips (rect) + Disabled
 * ========================= */
function Chip({
  on,
  children,
  onClick,
  leading,
  disabled,
}: {
  on: boolean;
  children: React.ReactNode;
  onClick: () => void;
  leading?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`chip ${on ? "on" : ""} ${disabled ? "dis" : ""}`} onClick={onClick} disabled={disabled}>
      {leading ? <span className="lead">{leading}</span> : null}
      <span className="txt">{children}</span>
      <style jsx>{`
        .chip {
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          transition: background 140ms ease, transform 120ms ease, border-color 140ms ease, opacity 140ms ease;
          height: 40px;
          outline: none;
          max-width: 100%;
        }
        .chip:hover {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .chip:active {
          transform: scale(0.99);
        }
        .chip.on {
          background: rgba(17, 17, 17, 0.92);
          border-color: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
        }
        .chip.dis {
          opacity: 0.38;
          cursor: default;
          pointer-events: none;
        }
        .chip:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .lead :global(*) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .txt {
          font-size: 13px;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
}

/** =========================
 * Filter Section (Nike accordion)
 * ========================= */
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
    <section className="fs">
      <button type="button" className="head" onClick={onToggle} aria-expanded={open}>
        <span className="t">{title}</span>
        <span className={`c ${open ? "on" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? <div className="body">{children}</div> : null}
      <style jsx>{`
        .fs {
          padding: 14px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .head {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0;
          outline: none;
        }
        .head:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
          border-radius: 10px;
        }
        .t {
          font-weight: 950;
          color: #111;
          font-size: 14px;
          letter-spacing: -0.01em;
        }
        .c {
          opacity: 0.6;
          transition: transform 160ms ease;
        }
        .c.on {
          transform: rotate(180deg);
        }
        .body {
          padding-top: 12px;
        }
      `}</style>
    </section>
  );
}

/** =========================
 * Search input (Filter Search)
 * ========================= */
function FilterSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="fs">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="inp" type="search" aria-label={placeholder} />
      <style jsx>{`
        .fs {
          margin-bottom: 10px;
        }
        .inp {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 900;
          outline: none;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.82);
        }
        .inp:focus {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
          border-color: rgba(0, 0, 0, 0.22);
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Outside close helper
 * ========================= */
function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return ref;
}

/** =========================
 * Sort Dropdown (Nike real)
 * ========================= */
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClose(open, close);

  const items: { key: SortKey; label: string }[] = useMemo(
    () => [
      { key: "launch", label: "Featured" },
      { key: "price_asc", label: "Price: Low-High" },
      { key: "price_desc", label: "Price: High-Low" },
      { key: "title_asc", label: "Name: A–Z" },
    ],
    []
  );

  return (
    <div className="wrap" ref={ref}>
      <button type="button" className="btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="k">Sort By</span>
        <span className="v">{sortLabel(value)}</span>
        <span className={`c ${open ? "on" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className="menu" role="menu" aria-label="Sort options">
          {items.map((it) => {
            const on = it.key === value;
            return (
              <button
                key={it.key}
                type="button"
                className={`mi ${on ? "on" : ""}`}
                onClick={() => {
                  onChange(it.key);
                  setOpen(false);
                }}
                role="menuitem"
              >
                <span className="lab">{it.label}</span>
                {on ? <span className="check">✓</span> : <span className="ghost" />}
              </button>
            );
          })}
        </div>
      ) : null}

      <style jsx>{`
        .wrap {
          position: relative;
        }
        .btn {
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 10px 10px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: background 140ms ease;
          color: rgba(0, 0, 0, 0.85);
          font-weight: 950;
          outline: none;
        }
        .btn:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        .btn:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .k {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
        }
        .v {
          font-size: 13px;
          letter-spacing: -0.01em;
        }
        .c {
          opacity: 0.6;
          transition: transform 160ms ease;
        }
        .c.on {
          transform: rotate(180deg);
        }

        .menu {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          width: 260px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 14px;
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.14);
          overflow: hidden;
          z-index: 80;
        }
        .mi {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px 12px;
          border: 0;
          background: #fff;
          cursor: pointer;
          text-align: left;
          transition: background 140ms ease;
          outline: none;
        }
        .mi:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        .mi:focus-visible {
          box-shadow: inset 0 0 0 2px rgba(17, 17, 17, 0.18);
        }
        .mi.on {
          background: rgba(0, 0, 0, 0.03);
        }
        .lab {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          font-size: 13px;
        }
        .check {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.7);
        }
        .ghost {
          width: 12px;
          height: 12px;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Top loading bar (Nike vibe)
 * ========================= */
function TopLoadingBar({ active }: { active: boolean }) {
  return (
    <div className={`tl ${active ? "on" : ""}`} aria-hidden="true">
      <div className="bar" />
      <style jsx>{`
        .tl {
          position: fixed;
          top: calc(var(--jusp-header-h, 64px));
          left: 0;
          right: 0;
          height: 3px;
          z-index: 120;
          pointer-events: none;
          opacity: 0;
          transition: opacity 140ms ease;
        }
        .tl.on {
          opacity: 1;
        }
        .bar {
          width: 40%;
          height: 100%;
          background: rgba(17, 17, 17, 0.92);
          animation: run 520ms ease-in-out infinite;
        }
        @keyframes run {
          0% {
            transform: translateX(-10%);
          }
          50% {
            transform: translateX(80%);
          }
          100% {
            transform: translateX(210%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bar {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Active filter pills (Nike)
 * ========================= */
function ActiveFilters({
  items,
  onClearAll,
}: {
  items: Array<{ key: string; label: string; onRemove: () => void }>;
  onClearAll: () => void;
}) {
  if (!items.length) return null;

  return (
    <div className="af" aria-label="Active filters">
      <div className="row">
        {items.map((it) => (
          <button key={it.key} type="button" className="pill" onClick={it.onRemove} aria-label={`Remove ${it.label}`}>
            <span className="lab">{it.label}</span>
            <span className="x" aria-hidden="true">
              ✕
            </span>
          </button>
        ))}
        <button type="button" className="clearAll" onClick={onClearAll}>
          Clear all
        </button>
      </div>

      <style jsx>{`
        .af {
          max-width: 1440px;
          margin: 0 auto 8px;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .pill {
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 999px;
          padding: 10px 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          transition: background 140ms ease, transform 120ms ease, border-color 140ms ease;
          height: 40px;
          max-width: 100%;
          outline: none;
        }
        .pill:hover {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .pill:active {
          transform: scale(0.99);
        }
        .pill:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .lab {
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          letter-spacing: -0.01em;
        }
        .x {
          opacity: 0.6;
          font-weight: 950;
        }
        .clearAll {
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          font-weight: 950;
          padding: 10px 12px;
          border-radius: 999px;
          color: rgba(0, 0, 0, 0.74);
          height: 40px;
          transition: background 140ms ease, color 140ms ease;
          outline: none;
        }
        .clearAll:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #111;
        }
        .clearAll:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Quick Filters row (Nike)
 * ========================= */
function QuickFiltersRow({
  featuredOn,
  saleOn,
  underOn,
  newOn,
  onFeatured,
  onSale,
  onUnder,
  onNew,
}: {
  featuredOn: boolean;
  saleOn: boolean;
  underOn: boolean;
  newOn: boolean;
  onFeatured: () => void;
  onSale: () => void;
  onUnder: () => void;
  onNew: () => void;
}) {
  return (
    <div className="qf" aria-label="Quick filters">
      <div className="row">
        <button type="button" className={`q ${featuredOn ? "on" : ""}`} onClick={onFeatured}>
          Featured
        </button>
        <button type="button" className={`q ${saleOn ? "on" : ""}`} onClick={onSale}>
          Sale
        </button>
        <button type="button" className={`q ${underOn ? "on" : ""}`} onClick={onUnder}>
          Under $200k
        </button>
        <button type="button" className={`q ${newOn ? "on" : ""}`} onClick={onNew}>
          New
        </button>
      </div>
      <style jsx>{`
        .qf {
          max-width: 1440px;
          margin: 0 auto 10px;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .q {
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 999px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          height: 40px;
          outline: none;
          transition: background 140ms ease, border-color 140ms ease, transform 120ms ease;
        }
        .q:hover {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .q:active {
          transform: scale(0.99);
        }
        .q.on {
          background: rgba(17, 17, 17, 0.92);
          border-color: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
        }
        .q:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Empty State PRO (Nike)
 * ========================= */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="es" role="status" aria-live="polite">
      <div className="box">
        <div className="t">No results found</div>
        <div className="s">Try adjusting your filters or clear them to see everything.</div>
        <div className="row">
          <button type="button" className="cta" onClick={onClear}>
            Clear filters
          </button>
          <Link className="ghost" href="/">
            Go home
          </Link>
        </div>
      </div>
      <style jsx>{`
        .es {
          padding: 40px 0;
        }
        .box {
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.02);
          padding: 22px;
          max-width: 720px;
        }
        .t {
          font-weight: 950;
          color: #111;
          font-size: 18px;
          letter-spacing: -0.02em;
        }
        .s {
          margin-top: 10px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.6);
          font-size: 13px;
        }
        .row {
          margin-top: 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cta {
          border: 0;
          cursor: pointer;
          font-weight: 950;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
          outline: none;
        }
        .cta:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.16);
        }
        .ghost {
          text-decoration: none;
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          font-weight: 950;
          padding: 10px 14px;
          border-radius: 999px;
          color: rgba(0, 0, 0, 0.75);
          outline: none;
          display: inline-flex;
          align-items: center;
        }
        .ghost:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #111;
        }
        .ghost:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Back-to-top (Nike)
 * ========================= */
function BackToTop({ show }: { show: boolean }) {
  return (
    <button
      type="button"
      className={`btt ${show ? "on" : ""}`}
      onClick={() => {
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          window.scrollTo(0, 0);
        }
      }}
      aria-label="Back to top"
    >
      <ArrowUpIcon size={18} />
      <span className="t">Top</span>
      <style jsx>{`
        .btt {
          position: fixed;
          right: 16px;
          bottom: 92px;
          z-index: 1600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          cursor: pointer;
          font-weight: 950;
          padding: 10px 12px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
          outline: none;
          transform: translateY(16px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .btt.on {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .btt:focus-visible {
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22), 0 0 0 3px rgba(17, 17, 17, 0.16);
        }
        .t {
          font-size: 13px;
          letter-spacing: -0.01em;
        }
      `}</style>
    </button>
  );
}

/** =========================
 * Skeleton (Nike grid)
 * ========================= */
function GridSkeleton({ count }: { count: number }) {
  const n = clamp(count, 6, 16);
  const items = Array.from({ length: n }, (_, i) => i);

  return (
    <div className="sk" aria-hidden="true">
      {items.map((i) => (
        <div key={i} className="card">
          <div className="img" />
          <div className="m">
            <div className="l1" />
            <div className="l2" />
            <div className="l3" />
          </div>
        </div>
      ))}
      <style jsx>{`
        .sk {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 26px 18px;
          padding-top: 8px;
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .card {
          border-radius: 10px;
          overflow: hidden;
        }
        .img {
          aspect-ratio: 1 / 1;
          border-radius: 10px;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
          background-size: 220% 100%;
          animation: shimmer 1200ms ease-in-out infinite;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.06);
        }
        .m {
          padding: 14px 2px 2px;
        }
        .l1,
        .l2,
        .l3 {
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
          background-size: 220% 100%;
          animation: shimmer 1200ms ease-in-out infinite;
        }
        .l1 {
          width: 86%;
        }
        .l2 {
          width: 68%;
          margin-top: 10px;
          opacity: 0.9;
        }
        .l3 {
          width: 42%;
          margin-top: 12px;
          height: 14px;
        }

        @keyframes shimmer {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 0%;
          }
          100% {
            background-position: 0% 0%;
          }
        }

        @media (max-width: 1320px) {
          .sk {
            grid-template-columns: repeat(3, 1fr);
            gap: 22px 16px;
          }
        }
        @media (max-width: 980px) {
          .sk {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px 12px;
          }
        }
        @media (max-width: 520px) {
          .sk {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .img,
          .l1,
          .l2,
          .l3 {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Sticky Desktop Controls (Nike)
 * ========================= */
function DesktopStickyControls({
  show,
  activeCount,
  resultsCount,
  showSide,
  onToggleFilters,
  sort,
  onChangeSort,
}: {
  show: boolean;
  activeCount: number;
  resultsCount: number;
  showSide: boolean;
  onToggleFilters: () => void;
  sort: SortKey;
  onChangeSort: (v: SortKey) => void;
}) {
  return (
    <div className={`ds ${show ? "on" : ""}`} aria-hidden={!show}>
      <div className="in">
        <button type="button" className="f" onClick={onToggleFilters} aria-pressed={showSide}>
          {showSide ? "Hide Filters" : "Show Filters"}
          {activeCount ? <span className="b">{activeCount}</span> : null}
        </button>
        <div className="right">
          <div className="count">{resultsCount} Results</div>
          <SortDropdown value={sort} onChange={onChangeSort} />
        </div>
      </div>
      <style jsx>{`
        .ds {
          position: sticky;
          top: calc(var(--jusp-header-h, 64px));
          z-index: 70;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          margin: 0 -18px 8px;
          padding: 10px 18px;
          transform: translateY(-10px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .ds.on {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .in {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .f {
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 999px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          outline: none;
        }
        .f:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #111;
        }
        .f:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .b {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
          font-size: 11px;
          font-weight: 950;
          line-height: 1;
        }
        .right {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .count {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
          white-space: nowrap;
        }
        @media (max-width: 980px) {
          .ds {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Compare Modal (Nike clean)
 * ========================= */
function CompareModal({
  open,
  onClose,
  a,
  b,
}: {
  open: boolean;
  onClose: () => void;
  a: Product | null;
  b: Product | null;
}) {
  const ref = useOutsideClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const rows = [
    { k: "Price", a: a ? `$${moneyCOP(Number((a as any).price ?? 0) || 0)}` : "—", b: b ? `$${moneyCOP(Number((b as any).price ?? 0) || 0)}` : "—" },
    { k: "Sale", a: a ? `${Number((a as any).discountPercent ?? (a as any).discount ?? 0) || 0}%` : "—", b: b ? `${Number((b as any).discountPercent ?? (b as any).discount ?? 0) || 0}%` : "—" },
    { k: "Brand", a: a ? String((a as any).brand || "Nike") : "—", b: b ? String((b as any).brand || "Nike") : "—" },
    { k: "Type", a: a ? typeLabel((a as any).category) : "—", b: b ? typeLabel((b as any).category) : "—" },
    { k: "Gender", a: a ? genderLabel((a as any).gender) : "—", b: b ? genderLabel((b as any).gender) : "—" },
    { k: "Colors", a: a ? String(safeArr((a as any).colors).length || 0) : "—", b: b ? String(safeArr((b as any).colors).length || 0) : "—" },
    { k: "Sizes", a: a ? String(safeArr((a as any).sizes).length || 0) : "—", b: b ? String(safeArr((b as any).sizes).length || 0) : "—" },
  ];

  const imgA = a ? pickImgs(a).main : null;
  const imgB = b ? pickImgs(b).main : null;

  return (
    <div
      className="cmBack"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cm" ref={ref}>
        <div className="cmTop">
          <div className="cmTitle">Compare</div>
          <button className="cmX" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="cmHead">
          <div className="col">
            <div className="pimg">{imgA ? <img src={imgA} alt="" /> : null}</div>
            <div className="pn">{a ? String((a as any).name || "Product") : "—"}</div>
          </div>
          <div className="col">
            <div className="pimg">{imgB ? <img src={imgB} alt="" /> : null}</div>
            <div className="pn">{b ? String((b as any).name || "Product") : "—"}</div>
          </div>
        </div>

        <div className="cmTable" role="table" aria-label="Comparison table">
          {rows.map((r) => (
            <div key={r.k} className="r" role="row">
              <div className="k" role="cell">
                {r.k}
              </div>
              <div className="v" role="cell">
                {r.a}
              </div>
              <div className="v" role="cell">
                {r.b}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .cmBack {
          position: fixed;
          inset: 0;
          z-index: 2600;
          background: rgba(0, 0, 0, 0.42);
          display: grid;
          place-items: center;
          padding: 16px;
        }
        .cm {
          width: min(980px, 96vw);
          max-height: min(760px, 92vh);
          overflow: auto;
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.22);
        }
        .cmTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .cmTitle {
          font-weight: 950;
          color: #111;
          font-size: 14px;
          letter-spacing: -0.01em;
        }
        .cmX {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 950;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.7);
          outline: none;
        }
        .cmX:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
          border-radius: 10px;
        }

        .cmHead {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .col {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.02);
        }
        .pimg {
          aspect-ratio: 1/1;
          border-radius: 12px;
          background: #f4f4f4;
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .pimg img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 18px;
          display: block;
        }
        .pn {
          margin-top: 10px;
          font-weight: 950;
          color: #111;
          letter-spacing: -0.02em;
          font-size: 14px;
          line-height: 1.18;
        }

        .cmTable {
          padding: 10px 16px 18px;
        }
        .r {
          display: grid;
          grid-template-columns: 160px 1fr 1fr;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .k {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
        }
        .v {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          font-size: 13px;
        }

        @media (max-width: 700px) {
          .cmHead {
            grid-template-columns: 1fr;
          }
          .r {
            grid-template-columns: 120px 1fr;
            grid-auto-rows: auto;
          }
          .r .v:nth-child(3) {
            grid-column: 2 / 3;
          }
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Compare Bar (Nike)
 * ========================= */
function CompareBar({
  count,
  aName,
  bName,
  onOpen,
  onClear,
}: {
  count: number;
  aName: string | null;
  bName: string | null;
  onOpen: () => void;
  onClear: () => void;
}) {
  if (!count) return null;

  return (
    <div className="cb" role="region" aria-label="Compare bar">
      <div className="in">
        <div>
          <div className="t">Compare</div>
          {count === 1 ? (
            <div className="s">Selected: {aName || "1 item"}</div>
          ) : (
            <div className="s">
              Selected: {aName || "A"} <span className="dot">·</span> {bName || "B"}
            </div>
          )}
        </div>

        <div className="right">
          <button type="button" className="ghost" onClick={onClear}>
            Clear
          </button>
          <button type="button" className="cta" onClick={onOpen} disabled={count < 2} aria-disabled={count < 2}>
            Compare
          </button>
        </div>
      </div>

      <style jsx>{`
        .cb {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .in {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .t {
          font-weight: 950;
          color: #111;
          font-size: 13px;
          letter-spacing: -0.01em;
        }
        .s {
          margin-top: 2px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
          letter-spacing: -0.01em;
          max-width: 64vw;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dot {
          opacity: 0.55;
        }
        .right {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex: 0 0 auto;
        }
        .ghost {
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          font-weight: 950;
          padding: 10px 12px;
          border-radius: 999px;
          color: rgba(0, 0, 0, 0.75);
          outline: none;
        }
        .ghost:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #111;
        }
        .ghost:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .cta {
          border: 0;
          cursor: pointer;
          font-weight: 950;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
          outline: none;
          transition: transform 120ms ease, opacity 140ms ease;
        }
        .cta:active {
          transform: scale(0.99);
        }
        .cta:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.16);
        }
        .cta:disabled {
          opacity: 0.45;
          cursor: default;
        }
      `}</style>
    </div>
  );
}

/** =========================
 * Card PRO MAX (Nike 1:1) + Compare
 * ========================= */
const ProductCard = memo(function ProductCard({
  p,
  mounted,
  favTick,
  onToggleFav,
  onPrefetch,
  compareOn,
  onToggleCompare,
}: {
  p: Product;
  mounted: boolean;
  favTick: number;
  onToggleFav: (favKey: string) => void;
  onPrefetch: (href: string) => void;
  compareOn: boolean;
  onToggleCompare: (id: string) => void;
}) {
  const { main } = pickImgs(p);
  const price = Number((p as any).price ?? 0) || 0;
  const disc = Number((p as any).discountPercent ?? (p as any).discount ?? 0);
  const sale = computeSale(price, disc);

  const favKey = String((p as any).id || (p as any).slug || (p as any).name || "");
  const href = `/product?id=${encodeURIComponent(String((p as any).id || ""))}`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = favTick;

  const fav = mounted ? isFavorite(favKey) : false;

  const colors = safeArr((p as any).colors);
  const colorDots = colors.slice(0, 3);
  const moreColors = Math.max(0, colors.length - colorDots.length);

  const [imgReady, setImgReady] = useState(false);

  return (
    <article className={`card ${imgReady ? "ready" : ""}`} style={{ contentVisibility: "auto", containIntrinsicSize: "360px 560px" as any }}>
      <div className="imgWrap">
        <Link className="img" href={href} prefetch={false} onMouseEnter={() => onPrefetch(href)} onFocus={() => onPrefetch(href)}>
          {main ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={main}
              alt={String((p as any).name || "Producto")}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              onLoad={() => setImgReady(true)}
            />
          ) : (
            <div className="ph" />
          )}
          <span className="imgBg" aria-hidden="true" />
        </Link>

        {sale.has ? <div className="sale">-{sale.d}%</div> : null}

        <button type="button" className={`cmp ${compareOn ? "on" : ""}`} onClick={() => onToggleCompare(favKey)} aria-pressed={compareOn} aria-label="Toggle compare">
          Compare
        </button>

        <div className="dotsRow" aria-label="Available colors">
          <div className="dots" aria-hidden="true">
            {colorDots.map((c) => (
              <span key={c} className="dot" style={{ background: colorToCss(c) }} title={c} />
            ))}
            {moreColors ? <span className="more">+{moreColors}</span> : null}
          </div>
          <div className="colorsTxt">{colors.length ? `${colors.length} Colors` : ""}</div>
        </div>

        <button type="button" className={`heart ${fav ? "on" : ""}`} onClick={() => onToggleFav(favKey)} aria-label="Favorite" suppressHydrationWarning>
          ♥
        </button>

        <div className="qs" aria-hidden="true">
          <Link href={href} prefetch={false} className="qsBtn" onMouseEnter={() => onPrefetch(href)} onFocus={() => onPrefetch(href)}>
            Quick Shop
          </Link>
        </div>
      </div>

      <div className="meta">
        <div className="name">{String((p as any).name || "Producto")}</div>
        <div className="sub">
          {genderLabel((p as any).gender)} · {typeLabel((p as any).category)}
        </div>

        <div className="priceRow">
          {sale.has ? (
            <>
              <div className="was">${moneyCOP(sale.was)}</div>
              <div className="now">${moneyCOP(sale.now)}</div>
            </>
          ) : (
            <div className="now">${moneyCOP(price)}</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .card {
          background: transparent;
          opacity: 0.985;
          transform: translateY(6px);
          transition: transform 220ms ease, opacity 220ms ease;
          will-change: transform;
        }
        .card.ready {
          opacity: 1;
          transform: translateY(0);
        }

        .imgWrap {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          background: #f4f4f4;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.06);
        }

        .img {
          display: block;
          aspect-ratio: 1 / 1;
          position: relative;
          background: #f4f4f4;
        }

        .imgBg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 35%, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0) 60%);
          pointer-events: none;
        }

        .img :global(img) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          padding: 26px;
          transform: translateZ(0);
          transition: transform 240ms ease, filter 240ms ease;
          filter: saturate(1.02) contrast(1.02);
        }
        article:hover .img :global(img) {
          transform: scale(1.035);
        }

        .ph {
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.03));
        }

        .sale {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          letter-spacing: -0.01em;
          z-index: 3;
        }

        .cmp {
          position: absolute;
          top: 12px;
          left: 12px;
          transform: translateY(44px);
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 999px;
          padding: 8px 10px;
          height: 34px;
          cursor: pointer;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
          z-index: 4;
          opacity: 0;
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease, background 140ms ease, color 140ms ease;
          outline: none;
          font-size: 12px;
          letter-spacing: -0.01em;
        }
        .cmp.on {
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
          border-color: rgba(0, 0, 0, 0.24);
          opacity: 1;
          pointer-events: auto;
        }
        .cmp:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        @media (hover: hover) and (pointer: fine) {
          article:hover .cmp {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(44px);
          }
        }
        @media (max-width: 980px) {
          .cmp {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(44px);
          }
        }

        .dotsRow {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          z-index: 3;
          pointer-events: none;
        }
        .dots {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.18);
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
          pointer-events: auto;
        }
        .more {
          font-weight: 950;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.58);
          margin-left: 2px;
        }
        .colorsTxt {
          color: rgba(0, 0, 0, 0.55);
          font-weight: 900;
          font-size: 12px;
          pointer-events: none;
        }

        .heart {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.9);
          display: grid;
          place-items: center;
          cursor: pointer;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform 140ms ease, background 140ms ease;
          z-index: 4;
          outline: none;
        }
        .heart:active {
          transform: scale(0.98);
        }
        .heart.on {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.25);
          color: rgba(239, 68, 68, 0.95);
        }
        .heart:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.16);
        }

        .qs {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 46px;
          display: grid;
          place-items: center;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 160ms ease, transform 160ms ease;
          z-index: 4;
          pointer-events: none;
        }
        .qsBtn {
          pointer-events: auto;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.14);
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.16);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          outline: none;
        }
        .qsBtn:hover {
          background: #fff;
          color: #111;
        }
        .qsBtn:focus-visible {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.16), 0 0 0 3px rgba(17, 17, 17, 0.14);
        }

        @media (hover: hover) and (pointer: fine) {
          article:hover .qs {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 980px) {
          .qs {
            display: none;
          }
        }

        .meta {
          padding: 14px 2px 2px;
        }
        .name {
          font-weight: 950;
          color: #111;
          letter-spacing: -0.02em;
          line-height: 1.15;
          font-size: 14px;
        }
        .sub {
          margin-top: 6px;
          color: rgba(0, 0, 0, 0.55);
          font-weight: 900;
          font-size: 12px;
        }
        .priceRow {
          margin-top: 10px;
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .was {
          color: rgba(0, 0, 0, 0.42);
          text-decoration: line-through;
          font-weight: 900;
          font-size: 12px;
        }
        .now {
          color: #111;
          font-weight: 950;
          font-size: 14px;
          letter-spacing: -0.01em;
        }
      `}</style>
    </article>
  );
});

/** =========================
 * Main
 * ========================= */
function ProductsInner({ initialProducts }: { initialProducts: Product[] }) {
  const allRaw = useMemo(() => (initialProducts?.length ? initialProducts : PRODUCTS ?? []), [initialProducts]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ Detecta si estás en MEN / WOMEN / KIDS
  const catParam = searchParams?.get("cat");

  // ✅ Scope estable (sin hooks condicionales) y SIN permitir "all" en el tipo.
  const scope = useMemo((): "men" | "women" | "kids" => {
    const cp = (catParam || "").toLowerCase();

    if (cp === "hombre") return "men";
    if (cp === "mujer") return "women";
    if (cp === "niños" || cp === "ninos") return "kids";

    const fromPath = genderScopeFromPathname(pathname || "");
    return fromPath === "women" || fromPath === "kids" ? fromPath : "men";
  }, [catParam, pathname]);

// ✅ Base list por sección: SOLO men/women/kids (+ unisex en men/women)
  const all = useMemo(() => allRaw.filter((p) => matchesGenderScope((p as any).gender, scope)), [allRaw, scope]);

  const { mounted, tick: favTick } = useFavoritesSignal();

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [secPickup, setSecPickup] = useState(true);
  const [secDiscount, setSecDiscount] = useState(true);
  const [secType, setSecType] = useState(true);
  const [secBrand, setSecBrand] = useState(true);
  const [secColor, setSecColor] = useState(true);
  const [secSize, setSecSize] = useState(true);
  const [secPrice, setSecPrice] = useState(true);

  // ✅ Size UX PRO MAX: colapsado por defecto (desktop + mobile)

  // ✅ Filter search (desktop) — SOLO Brand (sin buscar en colores / tallas)
  const [brandSearch, setBrandSearch] = useState("");

  // ✅ Filter search (mobile drawer) — SOLO Brand
  const [mBrandSearch, setMBrandSearch] = useState("");

  const [pickupToday, setPickupToday] = useState(false);

  const sort = useMemo(() => parseSort(searchParams.get(Q.sort)), [searchParams]);
  const dCap = useMemo(() => parseDiscountCap(searchParams.get(Q.d)), [searchParams]);
  const type = useMemo(() => normStr(searchParams.get(Q.type)), [searchParams]);
  const brand = useMemo(() => normStr(searchParams.get(Q.brand)), [searchParams]);
  const color = useMemo(() => normStr(searchParams.get(Q.color)), [searchParams]);
  const size = useMemo(() => normStr(searchParams.get(Q.size)), [searchParams]);
  const priceBucket = useMemo(() => parsePriceBucket(searchParams.get(Q.price)), [searchParams]);
  const newOnly = useMemo(() => parseBool01(searchParams.get(Q.isNew)), [searchParams]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (!value) sp.delete(key);
      else sp.set(key, value);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : `${pathname}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const resetFilters = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete(Q.d);
    sp.delete(Q.type);
    sp.delete(Q.brand);
    sp.delete(Q.color);
    sp.delete(Q.size);
    sp.delete(Q.price);
    sp.delete(Q.isNew);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (newOnly) items.push({ key: "new", label: "New", onRemove: () => setParam(Q.isNew, null) });
    if (dCap) items.push({ key: "d", label: `Sale ${dCap}%+`, onRemove: () => setParam(Q.d, null) });

    if (priceBucket) {
      const label = priceBucket.endsWith("+")
        ? `Price: $${moneyCOP(Number(priceBucket.slice(0, -1)))}+`
        : `Price: ${priceBucket
            .split("-")
            .map((x) => `$${moneyCOP(Number(x))}`)
            .join(" – ")}`;
      items.push({ key: "p", label, onRemove: () => setParam(Q.price, null) });
    }

    if (type) items.push({ key: "type", label: `Type: ${type}`, onRemove: () => setParam(Q.type, null) });
    if (brand) items.push({ key: "brand", label: `Brand: ${brand}`, onRemove: () => setParam(Q.brand, null) });
    if (color) items.push({ key: "color", label: `Color: ${color}`, onRemove: () => setParam(Q.color, null) });
    if (size) items.push({ key: "size", label: `Size: ${size}`, onRemove: () => setParam(Q.size, null) });

    return items;
  }, [dCap, priceBucket, type, brand, color, size, newOnly, setParam]);

  const activeCount = activeFilters.length;
  const hasActive = activeCount > 0;

  useEffect(() => {
    try {
      const mq = window.matchMedia("(max-width: 980px)");
      const apply = () => {
        if (mq.matches) {
          setFiltersOpen(false);
          setMobileOpen(false);
        } else {
          setFiltersOpen(true);
          setMobileOpen(false);
        }
      };
      apply();
      mq.addEventListener?.("change", apply);
      return () => mq.removeEventListener?.("change", apply);
    } catch {}
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      try {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      } catch {}
      return;
    }
    try {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } catch {}
    return () => {
      try {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      } catch {}
    };
  }, [mobileOpen]);

  const sideRef = useRef<HTMLElement | null>(null);
  const [sideScrolled, setSideScrolled] = useState(false);

  useEffect(() => {
    const el = sideRef.current;
    if (!el) return;
    const onScroll = () => setSideScrolled(el.scrollTop > 10);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [filtersOpen, mobileOpen]);

  // ✅ Listas por sección (men/women/kids)
  const types = useMemo(() => uniq(all.map((p) => typeLabel((p as any).category))).sort(), [all]);

  const brands = useMemo(() => {
    // Solo marcas del catálogo de ESA sección + lista completa global
    const fromProducts = uniq(all.map((p) => String((p as any).brand || "Nike"))).filter(Boolean);
    const merged = uniq([...ALL_BRANDS, ...fromProducts]).filter(Boolean);
    return merged.sort((a, b) => a.localeCompare(b));
  }, [all]);

  const colors = useMemo(() => uniq(all.flatMap((p) => safeArr((p as any).colors))).sort(), [all]);

  // ✅ FIX PRO MAX REAL: tallas SIEMPRE dependen del scope (no del dataset mezclado)
  const sizes = useMemo(() => {
    if (scope === "men") return MEN_SIZES_FALLBACK;
    if (scope === "women") return WOMEN_SIZES_FALLBACK;
    if (scope === "kids") return KIDS_SIZES_FALLBACK;

    // scope === "all": mezcla
    const fromProducts = uniq(allRaw.flatMap((p) => safeArr((p as any).sizes))).filter(Boolean);
    const merged = uniq([...fromProducts, ...MEN_SIZES_FALLBACK, ...WOMEN_SIZES_FALLBACK, ...KIDS_SIZES_FALLBACK]);

    const parseKid = (s: string) => {
      const m = String(s).trim().toUpperCase().match(/^(\d+(?:\.\d+)?)(C|Y)$/);
      if (!m) return null;
      return { n: Number(m[1]), suf: m[2] as "C" | "Y" };
    };

    merged.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      const fa = Number.isFinite(na);
      const fb = Number.isFinite(nb);

      if (fa && fb) return na - nb;
      if (fa && !fb) return -1;
      if (!fa && fb) return 1;

      const ka = parseKid(a);
      const kb = parseKid(b);
      if (ka && kb) {
        if (ka.suf !== kb.suf) return ka.suf === "C" ? -1 : 1;
        return ka.n - kb.n;
      }
      if (ka && !kb) return 1;
      if (!ka && kb) return -1;

      return String(a).localeCompare(String(b));
    });

    return merged;
  }, [scope, allRaw]);

  // ✅ PRO MAX: “Popular sizes” por sección (chips arriba)
  // ✅ PRO MAX REAL: availability por dataset de la sección
  const availableSizesSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of all) {
      const ps = safeArr((p as any).sizes);
      for (const s of ps) set.add(s);
    }
    return set;
  }, [all]);

  const hasAnyAvailabilityData = useMemo(() => availableSizesSet.size > 0, [availableSizesSet.size]);

  const isSizeAvailable = useCallback(
    (s: string) => {
      // Si el dataset no trae sizes en ninguna referencia, NO deshabilitamos nada
      if (!hasAnyAvailabilityData) return true;
      return availableSizesSet.has(s);
    },
    [availableSizesSet, hasAnyAvailabilityData]
  );

  // ✅ PRO MAX: lista colapsada/expandida (All sizes)

  // ✅ Sizes visibles: SOLO tallas disponibles (en orden), sin "Popular"
  const sizesAvailableOrdered = useMemo(() => {
    // ✅ Show full size scale; we only *disable* unavailable sizes.
    return sizes;
  }, [sizes]);

  const sizesKey = useMemo(() => sizes.map(String).join("|"), [sizes]);

// ✅ Auto-fix: si tu talla seleccionada deja de existir bajo los filtros actuales, se limpia sola.
  useEffect(() => {
    if (!size) return;
    if (!hasAnyAvailabilityData) return;
    if (!availableSizesSet.has(size)) {
      setParam(Q.size, null);
    }
  }, [size, sizesKey, hasAnyAvailabilityData, availableSizesSet, setParam]);
const brandsFiltered = useMemo(() => brands.filter((b) => includesLoose(b, brandSearch)), [brands, brandSearch]);
  const mBrandsFiltered = useMemo(() => brands.filter((b) => includesLoose(b, mBrandSearch)), [brands, mBrandSearch]);

  const priceRanges = useMemo(() => {
    const prices = all.map((p) => Number((p as any).price ?? 0)).filter((n) => Number.isFinite(n) && n > 0);
    if (!prices.length) {
      return [
        { key: null as string | null, label: "All" },
        { key: "0-200000", label: "Under $200k" },
        { key: "200000-400000", label: "$200k - $400k" },
        { key: "400000+", label: "Over $400k" },
      ];
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = Math.max(1, max - min);
    const step = Math.max(1, Math.round(span / 4));

    const a = Math.round(min / 1000) * 1000;
    const b = a + step;
    const c = b + step;
    const d = c + step;

    const fmt = (n: number) => `$${moneyCOP(n)}`;

    return [
      { key: null as string | null, label: "All" },
      { key: `${a}-${b}`, label: `${fmt(a)} – ${fmt(b)}` },
      { key: `${b}-${c}`, label: `${fmt(b)} – ${fmt(c)}` },
      { key: `${c}-${d}`, label: `${fmt(c)} – ${fmt(d)}` },
      { key: `${d}+`, label: `${fmt(d)}+` },
    ];
  }, [all]);

  const filtered = useMemo(() => {
    let list = [...all];

    if (newOnly) list = list.filter((p) => Boolean((p as any).isNew));

    if (dCap) {
      list = list.filter((p) => {
        const disc = Number((p as any).discountPercent ?? (p as any).discount ?? 0);
        return Number.isFinite(disc) && disc >= dCap;
      });
    }

    if (type) list = list.filter((p) => typeLabel((p as any).category) === type);
    if (brand) list = list.filter((p) => String((p as any).brand || "Nike") === brand);
    if (color) list = list.filter((p) => safeArr((p as any).colors).includes(color));

    if (size) {
      // ✅ Si el producto no trae sizes, no lo elimina por error
      list = list.filter((p) => {
        const ps = safeArr((p as any).sizes);
        if (!ps.length) return true;
        return ps.includes(size);
      });
    }

    if (priceBucket) {
      list = list.filter((p) => {
        const price = Number((p as any).price ?? 0) || 0;
        return inBucket(price, priceBucket);
      });
    }

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

    // pickupToday placeholder (sin data real): no filtra, solo mantiene UX
    void pickupToday;

    return list;
  }, [all, dCap, type, brand, color, size, sort, priceBucket, newOnly, pickupToday]);

  const prefetchRef = useRef<Record<string, number>>({});
  const onPrefetch = useCallback(
    (href: string) => {
      const now = Date.now();
      const last = prefetchRef.current[href] || 0;
      if (now - last < 1200) return;
      prefetchRef.current[href] = now;
      try {
        router.prefetch(href);
      } catch {}
    },
    [router]
  );

  const onToggleFav = useCallback((favKey: string) => {
    toggleFavorite({ id: favKey } as any);
    emitFavEvent();
  }, []);

  const [uiLoading, setUiLoading] = useState(false);
  const lastQsRef = useRef("");
  useEffect(() => {
    const qs = searchParams.toString();
    if (!lastQsRef.current) {
      lastQsRef.current = qs;
      return;
    }
    if (qs !== lastQsRef.current) {
      lastQsRef.current = qs;
      setUiLoading(true);
      const t = window.setTimeout(() => setUiLoading(false), 520);
      return () => window.clearTimeout(t);
    }
  }, [searchParams]);

  const [showTop, setShowTop] = useState(false);
  const [showDeskSticky, setShowDeskSticky] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    try {
      const mq = window.matchMedia("(min-width: 981px)");
      const apply = () => setIsDesktop(Boolean(mq.matches));
      apply();
      mq.addEventListener?.("change", apply);
      return () => mq.removeEventListener?.("change", apply);
    } catch {
      setIsDesktop(false);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setShowTop(y > 520);
      setShowDeskSticky(y > 180);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => window.removeEventListener("scroll", onScroll as any);
  }, []);

  const featuredOn = sort === "launch";
  const saleOn = dCap >= 30;
  const underOn = priceBucket === "0-200000";
  const newOn = newOnly;

  const showSide = filtersOpen;

  const onToggleFilters = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches) {
      setMobileOpen(true);
    } else {
      setFiltersOpen((v) => !v);
    }
  }, []);

  const skeletonCount = useMemo(() => {
    if (!filtered.length) return 8;
    return filtered.length >= 12 ? 12 : filtered.length >= 8 ? 8 : 6;
  }, [filtered.length]);

  /** ✅ Compare state */
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const compareSet = useMemo(() => new Set(compareIds), [compareIds]);
  const onToggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);
  const clearCompare = useCallback(() => setCompareIds([]), []);
  const openCompare = useCallback(() => setCompareOpen(true), []);
  const closeCompare = useCallback(() => setCompareOpen(false), []);

  const compareA = useMemo(
    () =>
      compareIds[0]
        ? all.find((p) => String((p as any).id || (p as any).slug || (p as any).name || "") === compareIds[0]) || null
        : null,
    [all, compareIds]
  );
  const compareB = useMemo(
    () =>
      compareIds[1]
        ? all.find((p) => String((p as any).id || (p as any).slug || (p as any).name || "") === compareIds[1]) || null
        : null,
    [all, compareIds]
  );

  const aName = compareA ? String((compareA as any).name || "A") : null;
  const bName = compareB ? String((compareB as any).name || "B") : null;

  return (
    <main className="root">
      <TopLoadingBar active={uiLoading} />

      <DesktopStickyControls
        show={isDesktop && showDeskSticky}
        activeCount={activeCount}
        resultsCount={filtered.length}
        showSide={showSide}
        onToggleFilters={onToggleFilters}
        sort={sort}
        onChangeSort={(v) => setParam(Q.sort, v)}
      />

      <div className="mSticky" aria-label="Mobile controls">
        <button
          type="button"
          className="mFiltersBtn"
          onClick={() => {
            setMobileOpen(true);
            setMBrandSearch("");
          }}
          aria-label="Open filters"
        >
          <span className="mFtxt">Filters</span>
          {activeCount ? <span className="mBadge">{activeCount}</span> : null}
          <span className="mFic" aria-hidden="true">
            <SlidersIcon size={18} />
          </span>
        </button>

        <div className="mRight">
          <div className="mCount">{filtered.length} Results</div>
          <SortDropdown value={sort} onChange={(v) => setParam(Q.sort, v)} />
        </div>
      </div>

      <header className="hero">
        <div className="heroLeft">
          <div className="crumbs">
            <Link href="/" className="crumb">
              JUSP
            </Link>
            <span className="sep">/</span>
            <span className="crumb dim">Products</span>
          </div>

          <div className="hRow">
            <h1 className="title">Products</h1>
            <div className="metaCount">{filtered.length} Results</div>
          </div>
        </div>

        <div className="heroRight">
          <button type="button" className="filtersBtn" onClick={onToggleFilters} aria-pressed={showSide}>
            <span className="lbl">{showSide ? "Hide Filters" : "Show Filters"}</span>
            {activeCount ? <span className="badge">{activeCount}</span> : null}
            <span className="ic" aria-hidden="true">
              <SlidersIcon size={18} />
            </span>
          </button>

          <SortDropdown value={sort} onChange={(v) => setParam(Q.sort, v)} />
        </div>
      </header>

      <QuickFiltersRow
        featuredOn={featuredOn}
        saleOn={saleOn}
        underOn={underOn}
        newOn={newOn}
        onFeatured={() => setParam(Q.sort, featuredOn ? null : "launch")}
        onSale={() => setParam(Q.d, saleOn ? null : "30")}
        onUnder={() => setParam(Q.price, underOn ? null : "0-200000")}
        onNew={() => setParam(Q.isNew, newOn ? null : "1")}
      />

      <ActiveFilters items={activeFilters} onClearAll={resetFilters} />

      <div className={`layout ${showSide ? "sideOn" : "sideOff"}`}>
        <aside className={`sideWrap ${showSide ? "on" : "off"}`} aria-label="Filters">
          <div
            ref={(n) => {
              sideRef.current = n as any;
            }}
            className={`side ${sideScrolled ? "rail" : ""}`}
          >
            <div className={`sideTop ${sideScrolled ? "sc" : ""}`}>
              <div className="sideTitle">
                Filters <span className="sel">· Selected ({activeCount})</span>
              </div>
              <button className="sideReset" type="button" onClick={resetFilters} disabled={!hasActive} aria-disabled={!hasActive}>
                Clear
              </button>
            </div>

            <div className="sideInner">
              <FilterSection title="Pick Up Today" open={secPickup} onToggle={() => setSecPickup((v) => !v)}>
                <div className="pickupRow">
                  <span className="pickupTxt">Pick Up Today</span>
                  <button type="button" className={`toggle ${pickupToday ? "on" : ""}`} onClick={() => setPickupToday((v) => !v)} aria-pressed={pickupToday}>
                    <span className="knob" />
                  </button>
                </div>
              </FilterSection>

              <FilterSection title="Sale & Offers" open={secDiscount} onToggle={() => setSecDiscount((v) => !v)}>
                <div className="chipsGrid">
                  {[0, 20, 30, 40, 50, 60].map((n) => {
                    const v = n === 0 ? null : String(n);
                    const on = dCap === (n as any);
                    return (
                      <Chip key={n} on={on} onClick={() => setParam(Q.d, v)}>
                        {n === 0 ? "All" : `${n}%+`}
                      </Chip>
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection title="Shop by Price" open={secPrice} onToggle={() => setSecPrice((v) => !v)}>
                <div className="chipsGrid">
                  {priceRanges.map((r) => (
                    <Chip key={`p-${String(r.key)}`} on={priceBucket === r.key} onClick={() => setParam(Q.price, r.key)}>
                      {r.label}
                    </Chip>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Type" open={secType} onToggle={() => setSecType((v) => !v)}>
                <div className="chipsGrid">
                  <Chip on={!type} onClick={() => setParam(Q.type, null)}>
                    All
                  </Chip>
                  {types.map((t) => (
                    <Chip key={t} on={type === t} onClick={() => setParam(Q.type, t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Brand" open={secBrand} onToggle={() => setSecBrand((v) => !v)}>
                <FilterSearch value={brandSearch} onChange={setBrandSearch} placeholder="Search brand…" />
                <div className="chipsGrid">
                  <Chip on={!brand} onClick={() => setParam(Q.brand, null)}>
                    All
                  </Chip>
                  {brandsFiltered.map((b) => (
                    <Chip key={b} on={brand === b} onClick={() => setParam(Q.brand, b)}>
                      {b}
                    </Chip>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Color" open={secColor} onToggle={() => setSecColor((v) => !v)}>
                {/* ✅ SIN buscador: todos los colores directos */}
                <div className="chipsGrid">
                  <Chip on={!color} onClick={() => setParam(Q.color, null)}>
                    All
                  </Chip>
                  {colors.map((c) => (
                    <Chip
                      key={c}
                      on={color === c}
                      onClick={() => setParam(Q.color, c)}
                      leading={<span className="sw" style={{ background: colorToCss(c) }} aria-hidden="true" />}
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title={size ? `Size · ${size}` : "Size"} open={secSize} onToggle={() => setSecSize((v) => !v)}>
                <div className="chipsGrid">
                  <Chip on={!size} onClick={() => setParam(Q.size, null)}>
                    All
                  </Chip>
                  {sizesAvailableOrdered.map((s) => (
                    <Chip key={s} on={size === s} onClick={() => setParam(Q.size, s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </FilterSection>

              <div className="sideFoot" />
            </div>
          </div>
        </aside>

        <section className="main" aria-label="Products grid">
          {filtered.length === 0 ? (
            <EmptyState
              onClear={() => {
                resetFilters();
                try {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } catch {
                  window.scrollTo(0, 0);
                }
              }}
            />
          ) : (
            <div className="gridWrap">
              {uiLoading ? <GridSkeleton count={skeletonCount} /> : null}

              <div className={`grid ${uiLoading ? "fade" : ""}`} aria-busy={uiLoading}>
                {filtered.map((p) => {
                  const key = String((p as any).id || (p as any).slug || (p as any).name || "");
                  return (
                    <ProductCard
                      key={key}
                      p={p}
                      mounted={mounted}
                      favTick={favTick}
                      onToggleFav={onToggleFav}
                      onPrefetch={onPrefetch}
                      compareOn={compareSet.has(key)}
                      onToggleCompare={onToggleCompare}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <CompareBar count={compareIds.length} aName={aName} bName={bName} onOpen={openCompare} onClear={clearCompare} />
      <CompareModal open={compareOpen} onClose={closeCompare} a={compareA} b={compareB} />

      <BackToTop show={showTop} />

      {mobileOpen ? (
        <div
          className="mBackdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileOpen(false);
          }}
        >
          <aside className="mDrawer" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="mTop">
              <div className="mTitle">Filters</div>
              <button className="mX" type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mBody">
              <div className="mRow">
                <button className="mClear" type="button" onClick={resetFilters} disabled={!hasActive} aria-disabled={!hasActive}>
                  Clear
                </button>
              </div>

              <div className="mSec">
                <div className="mSecHead">Pick Up Today</div>
                <div className="pickupRow">
                  <span className="pickupTxt">Pick Up Today</span>
                  <button type="button" className={`toggle ${pickupToday ? "on" : ""}`} onClick={() => setPickupToday((v) => !v)} aria-pressed={pickupToday}>
                    <span className="knob" />
                  </button>
                </div>
              </div>

              <div className="mSec">
                <div className="mSecHead">Sale & Offers</div>
                <div className="chipsGrid">
                  {[0, 20, 30, 40, 50, 60].map((n) => {
                    const v = n === 0 ? null : String(n);
                    const on = dCap === (n as any);
                    return (
                      <Chip key={n} on={on} onClick={() => setParam(Q.d, v)}>
                        {n === 0 ? "All" : `${n}%+`}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              <div className="mSec">
                <div className="mSecHead">Shop by Price</div>
                <div className="chipsGrid">
                  {priceRanges.map((r) => (
                    <Chip key={`mp-${String(r.key)}`} on={priceBucket === r.key} onClick={() => setParam(Q.price, r.key)}>
                      {r.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mSec">
                <div className="mSecHead">Type</div>
                <div className="chipsGrid">
                  <Chip on={!type} onClick={() => setParam(Q.type, null)}>
                    All
                  </Chip>
                  {types.map((t) => (
                    <Chip key={t} on={type === t} onClick={() => setParam(Q.type, t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mSec">
                <div className="mSecHead">Brand</div>
                <FilterSearch value={mBrandSearch} onChange={setMBrandSearch} placeholder="Search brand…" />
                <div className="chipsGrid">
                  <Chip on={!brand} onClick={() => setParam(Q.brand, null)}>
                    All
                  </Chip>
                  {mBrandsFiltered.map((b) => (
                    <Chip key={b} on={brand === b} onClick={() => setParam(Q.brand, b)}>
                      {b}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mSec">
                <div className="mSecHead">Color</div>
                {/* ✅ SIN buscador */}
                <div className="chipsGrid">
                  <Chip on={!color} onClick={() => setParam(Q.color, null)}>
                    All
                  </Chip>
                  {colors.map((c) => (
                    <Chip
                      key={c}
                      on={color === c}
                      onClick={() => setParam(Q.color, c)}
                      leading={<span className="sw" style={{ background: colorToCss(c) }} aria-hidden="true" />}
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mSec">
                <div className="mTitleRow">
                  <div className="mTitle">Size</div>
                  {size ? (
                    <button className="mClear" onClick={() => setParam(Q.size, null)}>
                      Clear
                    </button>
                  ) : null}
                </div>

                <div className="chipsGrid">
                  <Chip on={!size} onClick={() => setParam(Q.size, null)}>
                    All
                  </Chip>
                  {sizesAvailableOrdered.map((s) => (
                    <Chip key={`m-${s}`} on={size === s} onClick={() => setParam(Q.size, s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>

              <div style={{ height: 18 }} />
            </div>
          </aside>
        </div>
      ) : null}

      <style jsx>{`
        .root {
          background: #fff;
          min-height: 100vh;
          padding-top: calc(var(--jusp-header-h, 64px) + 10px);
          padding-left: 18px;
          padding-right: 18px;
          padding-bottom: 88px;
          overflow-x: clip;
        }
        @supports not (overflow: clip) {
          .root {
            overflow-x: hidden;
          }
        }

        .mSticky {
          display: none;
        }

        .hero {
          max-width: 1440px;
          margin: 0 auto;
          padding: 10px 0 10px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
        }

        .crumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
        }
        .crumb {
          text-decoration: none;
          color: rgba(0, 0, 0, 0.62);
        }
        .crumb:hover {
          color: #111;
        }
        .sep {
          opacity: 0.5;
        }
        .dim {
          opacity: 0.85;
        }

        .hRow {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .title {
          margin: 0;
          font-weight: 950;
          letter-spacing: -0.045em;
          color: #111;
          font-size: 36px;
          line-height: 1.02;
        }
        .metaCount {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
          font-size: 13px;
          letter-spacing: -0.01em;
        }

        .heroRight {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .filtersBtn {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 12px;
          transition: background 140ms ease, color 140ms ease;
          outline: none;
        }
        .filtersBtn:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #111;
        }
        .filtersBtn:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .lbl {
          font-size: 13px;
          letter-spacing: -0.01em;
        }
        .ic {
          opacity: 0.8;
          display: inline-flex;
          align-items: center;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
          font-size: 11px;
          font-weight: 950;
          line-height: 1;
        }

        .layout {
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          align-items: start;
        }
        .layout.sideOn {
          grid-template-columns: 320px 1fr;
          gap: 18px;
        }
        .layout.sideOff {
          grid-template-columns: 1fr;
          gap: 0;
        }

        .sideWrap {
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 12px);
          overflow: hidden;
        }
        .sideWrap.off {
          display: none;
        }

        .side {
          max-height: calc(100vh - (var(--jusp-header-h, 64px) + 20px));
          overflow: auto;
          border-right: 1px solid rgba(0, 0, 0, 0.14);
          padding-right: 18px;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;

          background: #fff;
          border-radius: 14px;
          padding-top: 0;
        }
        .side.rail {
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.06);
          border-right-color: rgba(0, 0, 0, 0.1);
        }

        .sideTop {
          position: sticky;
          top: 0;
          z-index: 2;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 12px 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .sideTop.sc {
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
        }
        .sideTitle {
          font-weight: 950;
          color: #111;
          font-size: 14px;
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
        }
        .sel {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
          letter-spacing: -0.01em;
        }
        .sideReset {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.6);
          padding: 8px 10px;
          border-radius: 12px;
          transition: background 140ms ease, color 140ms ease, opacity 140ms ease;
          outline: none;
        }
        .sideReset:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #111;
        }
        .sideReset:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .sideReset:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .sideInner {
          padding: 2px 0 6px;
        }
        .sideFoot {
          height: 12px;
        }

        .chipsGrid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sw {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.18);
          display: inline-block;
        }

        .pickupRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .pickupTxt {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.7);
          font-size: 13px;
        }
        .toggle {
          width: 44px;
          height: 26px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(0, 0, 0, 0.06);
          padding: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          transition: background 160ms ease;
          outline: none;
        }
        .toggle:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .toggle.on {
          background: rgba(17, 17, 17, 0.92);
          justify-content: flex-end;
        }
        .knob {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
        }

        .miniHead {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
          letter-spacing: -0.01em;
          margin-bottom: 10px;
        }
        .sizeRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .moreBtn {
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          font-weight: 950;
          padding: 8px 10px;
          border-radius: 999px;
          color: rgba(0, 0, 0, 0.75);
          outline: none;
        }
        .moreBtn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #111;
        }
        .moreBtn:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }

        .main {
          min-width: 0;
        }

        .gridWrap {
          position: relative;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 26px 18px;
          padding-top: 8px;
          transition: opacity 180ms ease, filter 180ms ease;
        }
        .grid.fade {
          opacity: 0.2;
          filter: saturate(0.98);
          pointer-events: none;
          user-select: none;
        }

        @media (max-width: 1320px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 22px 16px;
          }
          .title {
            font-size: 32px;
          }
        }

        @media (max-width: 980px) {
          .root {
            padding-left: 14px;
            padding-right: 14px;
          }

          .mSticky {
            display: flex;
            position: sticky;
            top: calc(var(--jusp-header-h, 64px) + 3px);
            z-index: 45;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            margin-left: -14px;
            margin-right: -14px;
            padding: 10px 14px;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .mFiltersBtn {
            border: 0;
            background: rgba(0, 0, 0, 0.04);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 999px;
            font-weight: 950;
            color: rgba(0, 0, 0, 0.82);
            flex: 0 0 auto;
            outline: none;
          }
          .mFiltersBtn:focus-visible {
            box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
          }
          .mFtxt {
            font-size: 13px;
            letter-spacing: -0.01em;
          }
          .mBadge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 6px;
            border-radius: 999px;
            background: rgba(17, 17, 17, 0.92);
            color: rgba(255, 255, 255, 0.96);
            font-size: 11px;
            font-weight: 950;
            line-height: 1;
          }
          .mFic {
            opacity: 0.75;
            display: inline-flex;
            align-items: center;
          }
          .mRight {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }
          .mCount {
            font-weight: 950;
            color: rgba(0, 0, 0, 0.55);
            font-size: 12px;
            white-space: nowrap;
          }

          .title {
            font-size: 26px;
          }
          .layout {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .sideWrap {
            display: none;
          }
          .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px 12px;
          }
        }

        @media (max-width: 520px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        .mBackdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.42);
          z-index: 2200;
          display: flex;
          justify-content: flex-end;
        }
        .mDrawer {
          width: min(420px, 92vw);
          height: 100%;
          background: #fff;
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }
        .mTop {
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .mTitle {
          font-weight: 950;
          color: #111;
          font-size: 14px;
        }
        .mX {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 950;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.7);
          outline: none;
        }
        .mX:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
          border-radius: 10px;
        }
        .mBody {
          padding: 10px 16px 18px;
          overflow: auto;
        }
        .mRow {
          display: flex;
          justify-content: flex-end;
          padding: 6px 0 10px;
        }
        .mClear {
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          font-weight: 950;
          padding: 10px 12px;
          border-radius: 12px;
          color: rgba(0, 0, 0, 0.75);
          transition: opacity 140ms ease;
          outline: none;
        }
        .mClear:focus-visible {
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.14);
        }
        .mClear:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .mSec {
          padding: 14px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .mSecHead {
          font-weight: 950;
          color: #111;
          font-size: 14px;
          margin-bottom: 12px;
        }
      `}</style>
    </main>
  );
}

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  return <ProductsInner initialProducts={initialProducts} />;
}