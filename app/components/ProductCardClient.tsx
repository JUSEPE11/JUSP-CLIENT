"use client";

import Link from "next/link";
import type { Product } from "../../lib/products";
import { useStore } from "./store";

type BadgeInfo = {
  isNew: boolean;
  discountPct: number;
};

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function deriveBadges(product: Product): BadgeInfo {
  const id = product.id || "";
  const h = hashString(id);

  const isNew =
    id.includes("new") ||
    id.includes("nuevo") ||
    id.includes("2026") ||
    h % 100 < 28;

  const discountOptions = [0, 0, 0, 10, 20, 30];
  const discountPct = discountOptions[h % discountOptions.length];

  return { isNew, discountPct };
}

function parsePriceLike(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;

    const cleaned = raw
      .replace(/[^\d.,-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", ".")
      .trim();

    if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;

    const n = Number(cleaned);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  return null;
}

function firstValidPrice(...values: unknown[]): number | null {
  for (const value of values) {
    if (value == null) continue;

    if (typeof value === "number" || typeof value === "string") {
      const parsed = parsePriceLike(value);
      if (parsed !== null) return parsed;
      continue;
    }

    if (typeof value === "object") {
      const v = value as any;

      const directCandidates = [
        v?.price,
        v?.amount,
        v?.value,
        v?.sale_price,
        v?.salePrice,
        v?.retail_price,
        v?.retailPrice,
        v?.current,
        v?.min,
        v?.max,
        v?.unit_amount,
      ];

      for (const candidate of directCandidates) {
        const parsed = parsePriceLike(candidate);
        if (parsed !== null) return parsed;
      }

      const deep = firstValidPrice(
        v?.pricing,
        v?.money,
        v?.priceRange,
        v?.price_range,
        v?.selectedPrice,
        v?.selected_price
      );

      if (deep !== null) return deep;
    }
  }

  return null;
}

function resolveProductPrice(product: Product): number | null {
  const p = product as any;

  return firstValidPrice(
    p?.price,
    p?.salePrice,
    p?.sale_price,
    p?.amount,
    p?.value,
    p?.pricing,
    p?.money,
    p?.priceRange,
    p?.price_range,
    p?.selectedPrice,
    p?.selected_price,
    Array.isArray(p?.variants) ? p.variants[0]?.price : null,
    Array.isArray(p?.variants) ? p.variants[0]?.salePrice : null,
    Array.isArray(p?.variants) ? p.variants[0]?.sale_price : null,
    Array.isArray(p?.sizes) ? p.sizes[0]?.price : null,
    Array.isArray(p?.sizes) ? p.sizes[0]?.salePrice : null,
    Array.isArray(p?.sizes) ? p.sizes[0]?.sale_price : null
  );
}

export default function ProductCardClient({
  product,
  variant = "grid",
  isBestSeller = false,
}: {
  product: Product;
  variant?: "grid" | "compact";
  isBestSeller?: boolean;
}) {
  const { isFav, toggleFav, addToCart, openCart } = useStore();

  const fav = isFav(product.id);
  const img = product.images?.[0];
  const { isNew, discountPct } = deriveBadges(product);
  const cardHeight = variant === "compact" ? 220 : 300;
  const resolvedPrice = resolveProductPrice(product);

  return (
    <article className="jusp-card jusp-hover" style={{ overflow: "hidden", position: "relative" }}>
      <div className="jusp-badges">
        {isBestSeller ? <span className="jusp-badge-pill jusp-badge-dark">Lo más vendido</span> : null}
        {isNew ? <span className="jusp-badge-pill">Nuevo</span> : null}
        {discountPct > 0 ? <span className="jusp-badge-pill jusp-badge-sale">-{discountPct}% OFF</span> : null}
      </div>

      <button
        className="jusp-iconbtn"
        style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}
        onClick={() =>
          toggleFav(product.id, {
            ...(product as any),
            price: resolvedPrice,
          } as Product)
        }
        aria-label="Favorito"
        title="Favorito"
        type="button"
      >
        {fav ? "❤" : "♡"}
      </button>

      <Link href={`/product/${product.id}`} style={{ display: "block" }}>
        <div
          style={{
            width: "100%",
            height: cardHeight,
            background: "#fafafa",
            display: "grid",
            placeItems: "center",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {img ? (
            <img
              src={img}
              alt={product.name}
              className="jusp-img-zoom"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span className="jusp-muted" style={{ fontSize: 13 }}>
              Sin imagen
            </span>
          )}
        </div>

        <div className="jusp-card-pad">
          <h3
            style={{
              margin: "6px 0 8px",
              fontSize: 17,
              fontWeight: 1000,
              letterSpacing: -0.2,
              lineHeight: 1.25,
            }}
          >
            {product.name}
          </h3>

          <div style={{ fontSize: 15, fontWeight: 900 }}>
            ${Number(resolvedPrice || 0).toLocaleString("es-CO")}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="jusp-btn" style={{ padding: "10px 14px", fontSize: 13 }}>
              Ver producto
            </span>

            <button
              className="jusp-btn jusp-btn-primary"
              onClick={(e) => {
                e.preventDefault();
                addToCart(
                  {
                    ...(product as any),
                    price: resolvedPrice ?? 0,
                  } as Product,
                  { qty: 1 }
                );
                openCart();
              }}
              type="button"
            >
              Añadir
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}