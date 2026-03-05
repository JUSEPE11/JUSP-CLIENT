// app/product/[slug]/AddToCart.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/products";
import { useStore } from "@/app/components/store";
import { useSearchParams } from "next/navigation";

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

/** =========================
 * Gender scope (AddToCart)
 * 1) ?g=men|women|kids
 * 2) localStorage jusp:genderScope
 * 3) product.gender fallback
 * ========================= */
type GenderScope = "men" | "women" | "kids";

function normalizeGenderScope(v: unknown): GenderScope | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s || s === "undefined" || s === "null") return null;
  if (s === "men" || s === "hombre") return "men";
  if (s === "women" || s === "mujer") return "women";
  if (s === "kids" || s === "kid" || s === "niños" || s === "ninos") return "kids";
  return null;
}

function readStoredScope(): GenderScope | null {
  try {
    return normalizeGenderScope(window.localStorage.getItem("jusp:genderScope"));
  } catch {
    return null;
  }
}

function storeScope(scope: GenderScope) {
  try {
    window.localStorage.setItem("jusp:genderScope", scope);
  } catch {}
}

function convertMenToWomenUS(size: string) {
  const raw = (size || "").trim();
  if (!raw || /[a-zA-Z]/.test(raw)) return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const w = n + 1.5;
  const rounded = Math.round(w * 2) / 2;
  return Number.isInteger(rounded) ? String(Math.trunc(rounded)) : String(rounded);
}

function convertWomenToMenUS(size: string) {
  const raw = (size || "").trim();
  if (!raw || /[a-zA-Z]/.test(raw)) return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const m = n - 1.5;
  const rounded = Math.round(m * 2) / 2;
  return Number.isInteger(rounded) ? String(Math.trunc(rounded)) : String(rounded);
}

function applyScopeToSizes(rawSizes: string[], scope: GenderScope) {
  if (!Array.isArray(rawSizes)) return [];
  if (scope === "women") return rawSizes.map(convertMenToWomenUS);
  return rawSizes;
}

function deriveColorsSizes(product: Product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) {
    return { colors: safeArr((product as any).colors), sizes: safeArr((product as any).sizes) };
  }
  const colors = uniq(variants.map((v) => String((v as any).color ?? "").trim()).filter(Boolean));
  const sizes = uniq(variants.map((v) => String((v as any).size ?? "").trim()).filter(Boolean));
  return { colors, sizes };
}

function findVariant(
  product: Product,
  scope: GenderScope,
  color: string | null,
  displayedSize: string | null
): ProductVariant | null {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return null;

  const c = (color ?? "").trim();

  // ✅ si estamos en WOMEN, el usuario ve talla WOMEN pero las variantes suelen venir en MEN
  const size = (displayedSize ?? "").trim();
  const s = scope === "women" ? convertWomenToMenUS(size) : size;

  if (c && s) {
    const exact = variants.find((v: any) => String(v.color ?? "").trim() === c && String(v.size ?? "").trim() === s);
    if (exact) return exact as any;
  }
  if (s) {
    const bySize = variants.find((v: any) => String(v.size ?? "").trim() === s);
    if (bySize) return bySize as any;
  }
  if (c) {
    const byColor = variants.find((v: any) => String(v.color ?? "").trim() === c);
    if (byColor) return byColor as any;
  }
  return (variants[0] as any) ?? null;
}

export default function AddToCart({ product }: { product: Product }) {
  const { addToCart, openCart } = useStore();
  const searchParams = useSearchParams();
  const gParam = searchParams?.get("g");

  const scope = useMemo<GenderScope>(() => {
    const g = normalizeGenderScope(gParam);
    if (g) return g;

    const stored = typeof window !== "undefined" ? readStoredScope() : null;
    if (stored) return stored;

    const fromProduct = normalizeGenderScope((product as any).gender);
    return fromProduct || "men";
  }, [gParam, product]);

  useEffect(() => {
    storeScope(scope);
  }, [scope]);

  const derived = useMemo(() => deriveColorsSizes(product), [product]);
  const colors = derived.colors;

  // ✅ mostrar tallas según scope (women convierte)
  const rawSizes = derived.sizes;
  const displaySizes = useMemo(() => applyScopeToSizes(rawSizes, scope), [rawSizes, scope]);

  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(displaySizes[0] ?? null);
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    // cuando cambian tallas (por scope/product) resetea selección si quedó fuera
    if (displaySizes.length && (!size || !displaySizes.includes(size))) setSize(displaySizes[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySizes.join("|")]);

  const needsSize = displaySizes.length > 0;
  const needsColor = colors.length > 0;

  const selectedVariant = useMemo(() => findVariant(product, scope, color, size), [product, scope, color, size]);
  const price = (selectedVariant as any)?.price ?? (product as any).price;

  const canAdd = (!needsSize || !!size) && (!needsColor || !!color) && qty >= 1;

  return (
    <>
      <div className="box">
        <div className="note">
          Recuerda: los precios pueden variar según disponibilidad y condiciones del proveedor internacional.
        </div>

        {needsSize ? (
          <div className="row">
            <div className="lbl">Talla</div>
            <div className="grid">
              {displaySizes.map((s) => (
                <button key={s} type="button" className={`opt ${size === s ? "on" : ""}`} onClick={() => setSize(s)}>
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
                <button key={c} type="button" className={`opt ${color === c ? "on" : ""}`} onClick={() => setColor(c)}>
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

            // ✅ precio variante + guardamos size visible (women) para UX
            const cloned: any = { ...(product as any), price };
            addToCart(cloned, { color, size, qty });
            openCart();
          }}
        >
          Agregar al carrito
        </button>
      </div>

      <style jsx>{`
        .box {
          margin-top: 14px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          padding: 14px;
          background: #fff;
        }

        .note {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
          line-height: 1.35;
        }

        .row {
          margin-top: 12px;
        }
        .row:first-child {
          margin-top: 0;
        }

        .lbl {
          font-weight: 950;
          color: #111;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .opt {
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.78);
        }
        .opt.on {
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          border-radius: 999px;
          padding: 10px 12px;
          width: fit-content;
        }
        .qty button {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 0;
          background: rgba(0, 0, 0, 0.06);
          cursor: pointer;
          font-weight: 950;
        }
        .qty span {
          min-width: 18px;
          text-align: center;
          font-weight: 950;
        }

        .cta {
          margin-top: 14px;
          width: 100%;
          border-radius: 999px;
          padding: 14px 16px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          cursor: pointer;
        }
        .cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
