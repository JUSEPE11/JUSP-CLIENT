"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/products";
import ProductCardClient from "../components/ProductCardClient";
import SkeletonCard from "../components/SkeletonCard";

type AnyProduct = Product & { slug?: string | null };

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// “Score” determinístico para destacados/trending sin tocar tu modelo.
function featuredScore(p: AnyProduct) {
  const h = hashString(String(p.id || ""));
  const price = typeof (p as any).price === "number" ? (p as any).price : 0;
  return (h % 1000) + (price % 113);
}

function productHref(p: AnyProduct) {
  // ✅ intenta slug primero, si no usa id
  // Ajusta SOLO si tu PDP usa otra ruta.
  const key = p.slug ? String(p.slug) : String(p.id);
  return `/products/${encodeURIComponent(key)}`;
}

function VideoCard(props: {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  src: string;
  poster?: string;
}) {
  return (
    <a
      href={props.href}
      className="jusp-card"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        display: "block",
        minHeight: 340,
      }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={props.poster}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          filter: "contrast(1.05) saturate(1.05)",
        }}
      >
        <source src={props.src} type="video/mp4" />
      </video>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.20) 55%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 18,
          right: 18,
          display: "grid",
          gap: 10,
          color: "white",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 0.6, opacity: 0.9 }}>{props.subtitle}</div>
        <div style={{ fontSize: 34, fontWeight: 1000, lineHeight: 1 }}>{props.title}</div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span
            className="jusp-btn"
            style={{
              background: "white",
              color: "black",
              border: "1px solid rgba(255,255,255,.65)",
              fontWeight: 1000,
              padding: "10px 14px",
              borderRadius: 999,
            }}
          >
            {props.cta}
          </span>
          <span style={{ fontSize: 12, opacity: 0.85 }}>
            Productos destacados + drops seleccionados.
          </span>
        </div>
      </div>
    </a>
  );
}

function ImageTile(props: {
  title: string;
  badge?: string;
  href: string;
  img?: string;
}) {
  return (
    <a
      href={props.href}
      className="jusp-card"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        minHeight: 220,
        display: "block",
        background: props.img
          ? `url(${props.img}) center/cover no-repeat`
          : "linear-gradient(135deg, rgba(0,0,0,.08), rgba(0,0,0,.02))",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.25) 65%, rgba(0,0,0,.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          right: 16,
          display: "grid",
          gap: 8,
          color: "white",
        }}
      >
        {props.badge ? (
          <span
            style={{
              width: "fit-content",
              padding: "7px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,.92)",
              color: "black",
              fontSize: 12,
              fontWeight: 1000,
            }}
          >
            {props.badge}
          </span>
        ) : null}

        <div style={{ fontSize: 18, fontWeight: 1000, lineHeight: 1.1 }}>{props.title}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>Ver producto →</div>
      </div>
    </a>
  );
}

export default function HomeClient({ products }: { products: Product[] }) {
  const list = products as AnyProduct[];

  // Destacados (top 8)
  const featured = useMemo(() => {
    const sorted = [...list].sort((a, b) => featuredScore(b) - featuredScore(a));
    return sorted.slice(0, 8);
  }, [list]);

  // “Novedades” (infinite)
  const BATCH = 12;
  const [visibleCount, setVisibleCount] = useState(Math.min(BATCH, list.length));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const visible = useMemo(() => list.slice(0, visibleCount), [list, visibleCount]);
  const hasMore = visibleCount < list.length;

  useEffect(() => {
    if (!hasMore) return;

    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        if (isLoadingMore) return;

        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((c) => Math.min(c + BATCH, list.length));
          setIsLoadingMore(false);
        }, 350);
      },
      { root: null, threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isLoadingMore, list.length]);

  // Tiles (click → PDP)
  const tiles = useMemo(() => {
    const base = featured.slice(0, 6);
    return base.map((p, idx) => {
      const title =
        (p as any).name ||
        (p as any).title ||
        (p as any).brand
          ? `${(p as any).brand ?? ""} ${(p as any).name ?? (p as any).title ?? ""}`.trim()
          : `Producto destacado #${idx + 1}`;

      const img =
        (p as any).image ||
        (p as any).imageUrl ||
        (p as any).thumbnail ||
        (p as any).cover ||
        undefined;

      const badge = idx === 0 ? "⭐ DESTACADO" : idx === 1 ? "🔥 HOT" : "Premium";
      return { title, img, badge, href: productHref(p) };
    });
  }, [featured]);

  return (
    <div className="jusp-container" style={{ paddingTop: 18 }}>
      {/* ====== BLOQUE “EDITORIAL” (2 VIDEOS) ====== */}
      <section style={{ marginTop: 14 }}>
        <div className="jusp-row" style={{ marginBottom: 10 }}>
          <h2 className="jusp-h2">Destacados (Editorial)</h2>
          <a href="/products?tab=destacados" className="jusp-link" style={{ fontWeight: 1000 }}>
            Ver todo
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <VideoCard
            title="DESTACADOS"
            subtitle="Drops • Premium • Originales"
            cta="Explorar"
            href="/products?tab=destacados"
            // ✅ pon aquí tus videos (public/videos/...)
            src="/videos/featured-1.mp4"
            poster="/images/featured-1.jpg"
          />

          <VideoCard
            title="NUEVA COLECCIÓN"
            subtitle="Lo más pedido hoy"
            cta="Ver ahora"
            href="/products"
            src="/videos/featured-2.mp4"
            poster="/images/featured-2.jpg"
          />
        </div>

        {/* Nota: si no tienes los mp4 aún, no rompe la app; luego solo subes los archivos. */}
      </section>

      {/* ====== GRID IMÁGENES CLICABLES (redirige a producto) ====== */}
      <section style={{ marginTop: 18 }}>
        <div className="jusp-row" style={{ marginBottom: 10 }}>
          <h2 className="jusp-h2">Colecciones destacadas</h2>
          <div className="jusp-muted" style={{ fontSize: 13, fontWeight: 1000 }}>
            Click → va al producto
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {tiles.map((t, i) => (
            <ImageTile key={i} title={t.title} badge={t.badge} href={t.href} img={t.img} />
          ))}
        </div>
      </section>

      {/* ====== PRODUCTOS DESTACADOS (TOP) ====== */}
      <section style={{ marginTop: 22 }}>
        <div className="jusp-row" style={{ marginBottom: 10 }}>
          <h2 className="jusp-h2">Productos más destacados</h2>
          <a href="/products?tab=destacados" className="jusp-link" style={{ fontWeight: 1000 }}>
            Ver todo
          </a>
        </div>

        <div className="jusp-grid">
          {featured.map((p) => (
            <ProductCardClient key={String(p.id)} product={p as any} />
          ))}
        </div>
      </section>

      {/* ====== Trending ahora (scroll horizontal) ====== */}
      <section style={{ marginTop: 22 }}>
        <div className="jusp-row" style={{ marginBottom: 10 }}>
          <h2 className="jusp-h2">Trending ahora</h2>
          <a href="/products?tab=trending" className="jusp-link" style={{ fontWeight: 1000 }}>
            Ver todo
          </a>
        </div>

        <div className="jusp-hscroll">
          {featured.slice(0, 8).map((p) => (
            <div key={String(p.id)} className="jusp-hscroll-item">
              <ProductCardClient product={p as any} variant="compact" isBestSeller />
            </div>
          ))}
        </div>
      </section>

      {/* ====== Grid “Novedades” (infinite) ====== */}
      <section style={{ marginTop: 22 }}>
        <div className="jusp-row" style={{ marginBottom: 10 }}>
          <h2 className="jusp-h2">Novedades</h2>
          <div className="jusp-muted" style={{ fontSize: 13, fontWeight: 1000 }}>
            {visible.length} / {list.length}
          </div>
        </div>

        <div className="jusp-grid">
          {visible.map((p) => (
            <ProductCardClient key={String(p.id)} product={p as any} />
          ))}

          {isLoadingMore ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk_${i}`} />) : null}
        </div>

        {hasMore ? <div ref={sentinelRef} style={{ height: 1 }} /> : null}

        {hasMore ? (
          <div style={{ display: "grid", placeItems: "center", marginTop: 18 }}>
            <button
              className="jusp-btn"
              onClick={() => {
                if (isLoadingMore) return;
                setIsLoadingMore(true);
                setTimeout(() => {
                  setVisibleCount((c) => Math.min(c + BATCH, list.length));
                  setIsLoadingMore(false);
                }, 350);
              }}
              style={{ minWidth: 220 }}
            >
              {isLoadingMore ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        ) : (
          <div className="jusp-muted" style={{ fontSize: 13, marginTop: 18, textAlign: "center" }}>
            No hay más productos.
          </div>
        )}
      </section>

      {/* Responsive sin tocar CSS global: */}
      <style jsx>{`
        @media (max-width: 980px) {
          section :global(.jusp-row) {
            gap: 10px;
          }
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          section > div[style*="repeat(3"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 560px) {
          section > div[style*="repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}