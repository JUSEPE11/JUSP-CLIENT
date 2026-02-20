"use client";

import Link from "next/link";
import type { Product } from "../../lib/products";
import { useStore } from "./store";

type BadgeInfo = {
  isNew: boolean;
  discountPct: number; // 0 = none
};

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Badge placeholder PRO (determinístico) sin tocar el modelo.
 * Cuando luego agregues campos reales (isNew, discountPct, etc.), solo cambiamos esta función.
 */
function deriveBadges(product: Product): BadgeInfo {
  const id = product.id || "";
  const h = hashString(id);

  const isNew =
    id.includes("new") ||
    id.includes("nuevo") ||
    id.includes("2026") ||
    (h % 100) < 28; // ~28% nuevos

  // Descuento determinístico: 0 / 10 / 20 / 30
  const discountOptions = [0, 0, 0, 10, 20, 30];
  const discountPct = discountOptions[h % discountOptions.length];

  return { isNew, discountPct };
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

  return (
    <article className="jusp-card jusp-hover" style={{ overflow: "hidden", position: "relative" }}>
      {/* Badges */}
      <div className="jusp-badges">
        {isBestSeller ? <span className="jusp-badge-pill jusp-badge-dark">Lo más vendido</span> : null}
        {isNew ? <span className="jusp-badge-pill">Nuevo</span> : null}
        {discountPct > 0 ? <span className="jusp-badge-pill jusp-badge-sale">-{discountPct}% OFF</span> : null}
      </div>

      {/* Favorito */}
      <button
        className="jusp-iconbtn"
        style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}
        onClick={() => toggleFav(product.id)}
        aria-label="Favorito"
        title="Favorito"
      >
        {fav ? "❤" : "♡"}
      </button>

      <Link href={`/product/${product.id}`} style={{ display: "block" }}>
        {/* Imagen */}
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

        {/* Info */}
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

          <div style={{ fontSize: 15, fontWeight: 900 }}>${product.price.toLocaleString()}</div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="jusp-btn" style={{ padding: "10px 14px", fontSize: 13 }}>
              Ver producto
            </span>

            <button
              className="jusp-btn jusp-btn-primary"
              onClick={(e) => {
                e.preventDefault();
                addToCart(product, { qty: 1 });
                openCart();
              }}
            >
              Añadir
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}