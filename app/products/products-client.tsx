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
  return s ? s : null; // "min-max" or "min+"
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
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6 21a1 1 0 0 1-1-1v-6a1 1 0 1 1 2 0v6a1 1 0 0 1-1 1Zm0-12a1 1 0 0 1-1-1V4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1Zm6 12a1 1 0 0 1-1-1v-9a1 1 0 1 1 2 0v9a1 1 0 0 1-1 1Zm0-15a1 1 0 0 1-1-1V4a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm6 15a1 1 0 0 1-1-1v-3a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1Zm0-9a1 1 0 0 1-1-1V4a1 1 0 1 1 2 0v7a1 1 0 0 1-1 1Z"
        fill="currentColor"
      />
      <path d="M4 13h4M10 9h4M16 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function ArrowUpIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 5l6.2 6.2a1 1 0 0 1-1.4 1.4L13 8.8V19a1 1 0 1 1-2 0V8.8l-3.8 3.8A1 1 0 1 1 5.8 11.2L12 5z"
        fill="currentColor"
      />
    </svg>
  );
}

/** =========================
 * Nike Chips (rect)
 * ========================= */
function Chip({
  on,
  children,
  onClick,
  leading,
}: {
  on: boolean;
  children: React.ReactNode;
  onClick: () => void;
  leading?: React.ReactNode;
}) {
  return (
    <button type="button" className={`chip ${on ? "on" : ""}`} onClick={onClick}>
      {leading ? <span className="lead">{leading}</span> : null}
      <span className="txt">{children}</span>

      <style jsx>{`
        .chip {
          border-radius: 10px;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: rgba(0, 0, 0, 0.82);
          transition: background 140ms ease, transform 120ms ease, border-color 140ms ease, color 140ms ease;
          height: 40px;
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
          color: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.24);
        }
        .lead {
          display: inline-flex;
          align-items: center;
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
    <div className="sec">
      <button type="button" className="head" onClick={onToggle} aria-expanded={open}>
        <span className="t">{title}</span>
        <span className={`c ${open ? "on" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? <div className="body">{children}</div> : null}

      <style jsx>{`
        .sec {
          padding: 16px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .head {
          width: 100%;
          border: 0;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0;
        }
        .t {
          font-weight: 950;
          color: #111;
          font-size: 14px;
        }
        .c {
          opacity: 0.55;
          transition: transform 160ms ease;
          font-weight: 950;
        }
        .c.on {
          transform: rotate(180deg);
        }
        .body {
          margin-top: 12px;
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
        }
        .btn:hover {
          background: rgba(0, 0, 0, 0.04);
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
          z-index: 50;
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
        }
        .mi:hover {
          background: rgba(0, 0, 0, 0.04);
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
    <div className={`bar ${active ? "on" : ""}`} aria-hidden="true">
      <div className="fill" />
      <style jsx>{`
        .bar {
          position: sticky;
          top: var(--jusp-header-h, 64px);
          z-index: 40;
          height: 3px;
          background: rgba(0, 0, 0, 0.06);
          opacity: 0;
          transform: translateY(-2px);
          transition: opacity 140ms ease, transform 140ms ease;
        }
        .bar.on {
          opacity: 1;
          transform: translateY(0);
        }
        .fill {
          height: 100%;
          width: 42%;
          background: rgba(17, 17, 17, 0.92);
          transform-origin: left;
          animation: run 800ms ease-in-out infinite;
        }
        @keyframes run {
          0% {
            transform: translateX(-20%) scaleX(0.2);
            opacity: 0.5;
          }
          50% {
            transform: translateX(80%) scaleX(1);
            opacity: 1;
          }
          100% {
            transform: translateX(220%) scaleX(0.3);
            opacity: 0.6;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fill {
            animation: none;
            width: 28%;
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
          <button key={it.key} type="button" className="pill" onClick={it.onRemove} title="Remove filter">
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
        }
        .pill:hover {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .pill:active {
          transform: scale(0.99);
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
        }
        .clearAll:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #111;
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
        <div className="h">No results found</div>
        <div className="p">Try adjusting your filters or clear them to see everything.</div>
        <div className="actions">
          <button type="button" className="btn" onClick={onClear}>
            Clear filters
          </button>
          <Link className="link" href="/" prefetch={false}>
            Go home
          </Link>
        </div>
      </div>

      <style jsx>{`
        .es {
          padding: 36px 0 10px;
        }
        .box {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.06);
          padding: 22px 18px;
          max-width: 560px;
        }
        .h {
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111;
          font-size: 18px;
        }
        .p {
          margin-top: 8px;
          color: rgba(0, 0, 0, 0.6);
          font-weight: 900;
          font-size: 13px;
          line-height: 1.45;
        }
        .actions {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn {
          border: 0;
          cursor: pointer;
          border-radius: 999px;
          padding: 12px 14px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.96);
          font-weight: 950;
          letter-spacing: -0.01em;
        }
        .btn:active {
          transform: scale(0.99);
        }
        .link {
          text-decoration: none;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.65);
          padding: 10px 0;
        }
        .link:hover {
          color: #111;
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
      <span className="ic" aria-hidden="true">
        <ArrowUpIcon size={18} />
      </span>
      <span className="tx">Top</span>

      <style jsx>{`
        .btt {
          position: fixed;
          right: 16px;
          bottom: 18px;
          z-index: 1200;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.16);
          border-radius: 999px;
          padding: 12px 12px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.84);
          font-weight: 950;
          opacity: 0;
          transform: translateY(12px);
          pointer-events: none;
          transition: opacity 180ms ease, transform 220ms ease, background 140ms ease;
        }
        .btt:hover {
          background: #fff;
        }
        .btt.on {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .ic {
          display: inline-flex;
          align-items: center;
          opacity: 0.8;
        }
        .tx {
          font-size: 13px;
          letter-spacing: -0.01em;
        }
        @media (max-width: 980px) {
          .btt {
            right: 12px;
            bottom: 14px;
          }
        }
      `}</style>
    </button>
  );
}

/** =========================
 * Card PRO MAX (Nike 1:1)
 * ========================= */
const ProductCard = memo(function ProductCard({
  p,
  mounted,
  favTick,
  onToggleFav,
  onPrefetch,
}: {
  p: Product;
  mounted: boolean;
  favTick: number;
  onToggleFav: (favKey: string) => void;
  onPrefetch: (href: string) => void;
}) {
  const { main } = pickImgs(p);
  const price = Number((p as any).price ?? 0) || 0;
  const disc = Number((p as any).discountPercent ?? (p as any).discount ?? 0);
  const sale = computeSale(price, disc);

  const favKey = String((p as any).id || (p as any).slug || (p as any).name || "");
  const href = `/product?id=${encodeURIComponent(String((p as any).id || ""))}`;

  // keep tick dependency so component updates when favorites change
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = favTick;

  const fav = mounted ? isFavorite(favKey) : false;

  const colors = safeArr((p as any).colors);
  const colorDots = colors.slice(0, 3);
  const moreColors = Math.max(0, colors.length - colorDots.length);

  const [imgReady, setImgReady] = useState(false);

  return (
    <article className={`card ${imgReady ? "ready" : ""}`} style={{ contentVisibility: "auto", containIntrinsicSize: "360px 560px" }}>
      <div className="imgWrap">
        <Link className="img" href={href} prefetch={false} onMouseEnter={() => onPrefetch(href)} onFocus={() => onPrefetch(href)}>
          <div className="imgBg" aria-hidden="true" />
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
          {sale.has ? <div className="sale">-{sale.d}%</div> : null}
        </Link>

        <div className="dotsRow" aria-label="Available colors">
          <div className="dots" aria-hidden="true">
            {colorDots.map((c) => (
              <span key={c} className="dot" style={{ background: colorToCss(c) }} title={c} />
            ))}
            {moreColors ? <span className="more">+{moreColors}</span> : null}
          </div>
          <div className="colorsTxt">{colors.length ? `${colors.length} Colors` : ""}</div>
        </div>

        <button
          type="button"
          className={`heart ${fav ? "on" : ""}`}
          onClick={() => onToggleFav(favKey)}
          aria-label="Favorite"
          suppressHydrationWarning
        >
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

        .img img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          padding: 26px;
          transform: translateZ(0);
          transition: transform 240ms ease, filter 240ms ease;
          filter: saturate(1.02) contrast(1.02);
        }
        article:hover .img img {
          transform: scale(1.035);
        }

        .ph {
          width: 100%;
          height: 100%;
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
        }
        .heart:active {
          transform: scale(0.98);
        }
        .heart.on {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.25);
          color: rgba(239, 68, 68, 0.95);
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
        }
        .qsBtn:hover {
          background: #fff;
          color: #111;
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
  const all = useMemo(() => (initialProducts?.length ? initialProducts : PRODUCTS ?? []), [initialProducts]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const [pickupToday, setPickupToday] = useState(false);

  const sort = useMemo(() => parseSort(searchParams.get(Q.sort)), [searchParams]);
  const dCap = useMemo(() => parseDiscountCap(searchParams.get(Q.d)), [searchParams]);
  const type = useMemo(() => normStr(searchParams.get(Q.type)), [searchParams]);
  const brand = useMemo(() => normStr(searchParams.get(Q.brand)), [searchParams]);
  const color = useMemo(() => normStr(searchParams.get(Q.color)), [searchParams]);
  const size = useMemo(() => normStr(searchParams.get(Q.size)), [searchParams]);
  const priceBucket = useMemo(() => parsePriceBucket(searchParams.get(Q.price)), [searchParams]);

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
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onRemove: () => void }> = [];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dCap, priceBucket, type, brand, color, size, searchParams]);

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
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [filtersOpen, mobileOpen]);

  const types = useMemo(() => uniq(all.map((p) => typeLabel((p as any).category))).sort(), [all]);
  const brands = useMemo(() => uniq(all.map((p) => String((p as any).brand || "Nike"))).sort(), [all]);
  const colors = useMemo(() => uniq(all.flatMap((p) => safeArr((p as any).colors))).sort(), [all]);
  const sizes = useMemo(() => uniq(all.flatMap((p) => safeArr((p as any).sizes))).sort(), [all]);

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

    if (dCap) {
      list = list.filter((p) => {
        const disc = Number((p as any).discountPercent ?? (p as any).discount ?? 0);
        return Number.isFinite(disc) && disc >= dCap;
      });
    }
    if (type) list = list.filter((p) => typeLabel((p as any).category) === type);
    if (brand) list = list.filter((p) => String((p as any).brand || "Nike") === brand);
    if (color) list = list.filter((p) => safeArr((p as any).colors).includes(color));
    if (size) list = list.filter((p) => safeArr((p as any).sizes).includes(size));

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

    return list;
  }, [all, dCap, type, brand, color, size, sort, priceBucket]);

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
    toggleFavorite({ id: favKey });
    emitFavEvent();
  }, []);

  const [uiLoading, setUiLoading] = useState(false);
  const lastQsRef = useRef<string>("");
  useEffect(() => {
    const qs = searchParams.toString();
    if (!lastQsRef.current) {
      lastQsRef.current = qs;
      return;
    }
    if (qs !== lastQsRef.current) {
      lastQsRef.current = qs;
      setUiLoading(true);
      const t = window.setTimeout(() => setUiLoading(false), 420);
      return () => window.clearTimeout(t);
    }
  }, [searchParams]);

  // ✅ Back-to-top show logic
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setShowTop(y > 520);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll as any);
  }, []);

  const showSide = filtersOpen;

  return (
    <main className="root">
      <TopLoadingBar active={uiLoading} />
      <BackToTop show={showTop} />

      {/* ✅ Sticky mini bar (mobile only) */}
      <div className="mSticky" aria-label="Mobile controls">
        <button type="button" className="mFiltersBtn" onClick={() => setMobileOpen(true)} aria-label="Open filters">
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

          <h1 className="title">
            Products <span className="count">({filtered.length})</span>
          </h1>
        </div>

        <div className="heroRight">
          <button
            type="button"
            className="filtersBtn"
            onClick={() => {
              if (typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches) {
                setMobileOpen(true);
              } else {
                setFiltersOpen((v) => !v);
              }
            }}
            aria-pressed={showSide}
          >
            <span className="lbl">{showSide ? "Hide Filters" : "Show Filters"}</span>
            {activeCount ? <span className="badge">{activeCount}</span> : null}
            <span className="ic" aria-hidden="true">
              <SlidersIcon size={18} />
            </span>
          </button>

          <SortDropdown value={sort} onChange={(v) => setParam(Q.sort, v)} />
        </div>
      </header>

      <ActiveFilters items={activeFilters} onClearAll={resetFilters} />

      <div className={`layout ${showSide ? "sideOn" : "sideOff"}`}>
        <aside className={`sideWrap ${showSide ? "on" : "off"}`} aria-label="Filters">
          <div
            ref={(n) => {
              sideRef.current = n;
            }}
            className="side"
          >
            <div className={`sideTop ${sideScrolled ? "sc" : ""}`}>
              <div className="sideTitle">Filters</div>
              <button className="sideReset" type="button" onClick={resetFilters} disabled={!hasActive} aria-disabled={!hasActive}>
                Clear
              </button>
            </div>

            <div className="sideInner">
              <FilterSection title="Pick Up Today" open={secPickup} onToggle={() => setSecPickup((v) => !v)}>
                <div className="pickupRow">
                  <span className="pickupTxt">Pick Up Today</span>
                  <button
                    type="button"
                    className={`toggle ${pickupToday ? "on" : ""}`}
                    onClick={() => setPickupToday((v) => !v)}
                    aria-pressed={pickupToday}
                  >
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
                <div className="chipsGrid">
                  <Chip on={!brand} onClick={() => setParam(Q.brand, null)}>
                    All
                  </Chip>
                  {brands.map((b) => (
                    <Chip key={b} on={brand === b} onClick={() => setParam(Q.brand, b)}>
                      {b}
                    </Chip>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Color" open={secColor} onToggle={() => setSecColor((v) => !v)}>
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

              <FilterSection title="Size" open={secSize} onToggle={() => setSecSize((v) => !v)}>
                <div className="chipsGrid">
                  <Chip on={!size} onClick={() => setParam(Q.size, null)}>
                    All
                  </Chip>
                  {sizes.map((s) => (
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
            <div className={`grid ${uiLoading ? "fade" : ""}`}>
              {filtered.map((p) => {
                const key = String((p as any).id || (p as any).slug || (p as any).name || "");
                return (
                  <ProductCard key={key} p={p} mounted={mounted} favTick={favTick} onToggleFav={onToggleFav} onPrefetch={onPrefetch} />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Mobile filters drawer */}
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
                  <button
                    type="button"
                    className={`toggle ${pickupToday ? "on" : ""}`}
                    onClick={() => setPickupToday((v) => !v)}
                    aria-pressed={pickupToday}
                  >
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
                <div className="chipsGrid">
                  <Chip on={!brand} onClick={() => setParam(Q.brand, null)}>
                    All
                  </Chip>
                  {brands.map((b) => (
                    <Chip key={b} on={brand === b} onClick={() => setParam(Q.brand, b)}>
                      {b}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mSec">
                <div className="mSecHead">Color</div>
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
                <div className="mSecHead">Size</div>
                <div className="chipsGrid">
                  <Chip on={!size} onClick={() => setParam(Q.size, null)}>
                    All
                  </Chip>
                  {sizes.map((s) => (
                    <Chip key={s} on={size === s} onClick={() => setParam(Q.size, s)}>
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
        /* ✅ FIX barra abajo (scroll horizontal) */
        .root {
          background: #fff;
          min-height: 100vh;
          padding-top: calc(var(--jusp-header-h, 64px) + 10px);
          padding-left: 18px;
          padding-right: 18px;
          padding-bottom: 44px;

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
          padding: 10px 0 12px;
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

        .title {
          margin: 10px 0 0;
          font-weight: 950;
          letter-spacing: -0.04em;
          color: #111;
          font-size: 40px;
          line-height: 1.02;
        }
        .count {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          font-size: 22px;
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
        }
        .filtersBtn:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #111;
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
          transition: opacity 180ms ease, transform 220ms ease;
          will-change: opacity, transform;
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
        }

        .sideTop {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #fff;
          padding: 10px 0 12px;
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
        }
        .sideReset:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #111;
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

        .main {
          min-width: 0;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 26px 18px;
          padding-top: 8px;
          transition: opacity 180ms ease, filter 180ms ease;
        }
        .grid.fade {
          opacity: 0.85;
          filter: saturate(0.98);
        }

        @media (max-width: 1320px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 22px 16px;
          }
          .title {
            font-size: 34px;
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
            font-size: 28px;
          }
          .count {
            font-size: 18px;
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

        @media (prefers-reduced-motion: reduce) {
          .layout {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  return <ProductsInner initialProducts={initialProducts} />;
}