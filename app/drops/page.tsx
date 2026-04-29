// app/drops/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import DropsGate from "./DropsGate";
import { getProducts, type Product } from "@/lib/products";
import { isFridayInSantiago } from "@/lib/flash";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Drop-Hype | JUSP",
  description: "Productos Drop-Hype disponibles solo los viernes.",
};

function firstMediaImage(product: Product) {
  const mediaImage = Array.isArray(product.media)
    ? product.media.find((item) => item?.type === "image" && item?.src)?.src
    : "";
  const images = Array.isArray(product.images) ? product.images : [];
  const image = String(product.image ?? "").trim();
  return mediaImage || images[0] || image || "";
}

function hasAvailableStock(product: Product) {
  if (product.isActive === false) return false;

  const stockHint = Number(product.stockHint);
  if (Number.isFinite(stockHint)) return stockHint > 0;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const stockValues = variants
    .map((variant) => Number(variant?.stock))
    .filter((stock) => Number.isFinite(stock));

  if (stockValues.length > 0) {
    return stockValues.some((stock) => stock > 0);
  }

  return true;
}

function buildCompareAt(price: number, discountPercent?: number) {
  const d = Number(discountPercent ?? 0);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(d) || d <= 0) return 0;
  return Math.round(price / (1 - Math.min(90, Math.max(0, d)) / 100));
}

function moneyCOP(value: number) {
  return Math.round(value).toLocaleString("es-CO");
}

function productHref(product: Product) {
  const slug = String(product.slug || product.id || "").trim();
  const gender = String(product.gender || "unisex").trim().toLowerCase();
  const g = gender === "men" || gender === "women" || gender === "kids" ? gender : "men";
  return `/product/${encodeURIComponent(slug)}?g=${encodeURIComponent(g)}&drop=1`;
}

export default async function DropsPage() {
  const isFriday = isFridayInSantiago();
  const products = await getProducts({ includeFlash24h: true });
  const dropProducts = isFriday
    ? products.filter((product) => Boolean(product.isFlash24h && product.flashActive && hasAvailableStock(product)))
    : [];

  return (
    <DropsGate>
      <main className="dropsRoot">
        <style>{`
          .dropsRoot {
            min-height: 100vh;
            background:
              radial-gradient(900px 520px at 10% 0%, rgba(250,204,21,0.18), transparent 58%),
              radial-gradient(900px 520px at 90% 8%, rgba(255,255,255,0.09), transparent 56%),
              linear-gradient(180deg, #09090b 0%, #050506 100%);
            color: #fff;
          }
          .dropsWrap {
            width: min(1240px, calc(100% - 40px));
            margin: 0 auto;
            padding: 40px 0 78px;
          }
          .dropsTop {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 18px;
            flex-wrap: wrap;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.07);
            color: rgba(255,255,255,0.74);
            border-radius: 999px;
            padding: 9px 12px;
            font-size: 12px;
            font-weight: 950;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }
          .liveDot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #facc15;
            box-shadow: 0 0 0 5px rgba(250,204,21,0.14), 0 0 20px rgba(250,204,21,0.55);
          }
          .title {
            margin: 18px 0 0;
            font-size: clamp(42px, 7vw, 86px);
            line-height: 0.96;
            letter-spacing: -0.06em;
            font-weight: 1000;
          }
          .sub {
            margin: 16px 0 0;
            max-width: 740px;
            color: rgba(255,255,255,0.68);
            font-size: 16px;
            line-height: 1.65;
            font-weight: 750;
          }
          .actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .btn {
            display: inline-flex;
            min-height: 44px;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.07);
            color: #fff;
            padding: 0 16px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 950;
          }
          .btnPrimary {
            background: #fff;
            color: #050506;
            border-color: #fff;
          }
          .status {
            margin-top: 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
            border-radius: 24px;
            padding: 16px;
          }
          .statusTitle {
            font-size: 15px;
            font-weight: 1000;
          }
          .statusText {
            margin-top: 4px;
            color: rgba(255,255,255,0.58);
            font-size: 13px;
            line-height: 1.45;
          }
          .pill {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 9px 12px;
            background: rgba(250,204,21,0.12);
            border: 1px solid rgba(250,204,21,0.24);
            color: #ffe27a;
            font-size: 12px;
            font-weight: 1000;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .grid {
            margin-top: 22px;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
          }
          .card {
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
            text-decoration: none;
            color: #fff;
            border-radius: 26px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
            box-shadow: 0 26px 90px rgba(0,0,0,0.34);
          }
          .media {
            position: relative;
            aspect-ratio: 1 / 1;
            background: #f7f7f7;
          }
          .media img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            padding: 16px;
          }
          .mediaFallback {
            height: 100%;
            display: grid;
            place-items: center;
            color: #111;
            font-size: 13px;
            font-weight: 1000;
            letter-spacing: 0.12em;
          }
          .tag {
            position: absolute;
            top: 12px;
            left: 12px;
            border-radius: 999px;
            background: #111;
            color: #fff;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 1000;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .body {
            display: grid;
            gap: 9px;
            padding: 16px;
          }
          .brand {
            color: rgba(255,255,255,0.52);
            font-size: 11px;
            font-weight: 1000;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .name {
            min-height: 44px;
            font-size: 18px;
            line-height: 1.08;
            font-weight: 1000;
            letter-spacing: -0.02em;
          }
          .priceRow {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .price {
            font-size: 22px;
            font-weight: 1000;
          }
          .compare {
            color: rgba(255,255,255,0.42);
            font-size: 13px;
            text-decoration: line-through;
          }
          .discount {
            border-radius: 999px;
            background: rgba(250,204,21,0.14);
            color: #ffe27a;
            padding: 5px 8px;
            font-size: 11px;
            font-weight: 1000;
          }
          .empty {
            margin-top: 22px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
            border-radius: 26px;
            padding: 28px;
            color: rgba(255,255,255,0.7);
            font-size: 15px;
            line-height: 1.65;
          }
          @media (max-width: 1100px) {
            .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          @media (max-width: 780px) {
            .dropsWrap { width: calc(100% - 28px); padding-top: 30px; }
            .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .name { min-height: 58px; font-size: 16px; }
          }
          @media (max-width: 480px) {
            .grid { grid-template-columns: 1fr; }
            .title { font-size: 42px; }
          }
        `}</style>

        <div className="dropsWrap">
          <div className="dropsTop">
            <div>
              <div className="eyebrow">
                <span className="liveDot" aria-hidden="true" />
                Drop-Hype
              </div>
              <h1 className="title">Productos del viernes</h1>
              <p className="sub">
                Esta vitrina solo abre los viernes y muestra unicamente productos Drop-Hype
                disponibles. Cuando cierra, no mostramos el catalogo informativo ni productos fuera
                del drop.
              </p>
            </div>

            <div className="actions">
              <Link className="btn btnPrimary" href="/products">
                Ver catalogo
              </Link>
              <Link className="btn" href="/help">
                Ayuda
              </Link>
            </div>
          </div>

          <section className="status" aria-label="Estado del Drop-Hype">
            <div>
              <div className="statusTitle">
                {isFriday ? "Drop-Hype activo hoy" : "Drop-Hype cerrado"}
              </div>
              <div className="statusText">
                {isFriday
                  ? `${dropProducts.length} producto${dropProducts.length === 1 ? "" : "s"} disponible${dropProducts.length === 1 ? "" : "s"} en este momento.`
                  : "Vuelve el viernes para ver los productos disponibles del Drop-Hype."}
              </div>
            </div>
            <span className="pill">{isFriday ? "Viernes activo" : "Solo viernes"}</span>
          </section>

          {isFriday && dropProducts.length > 0 ? (
            <section className="grid" aria-label="Productos Drop-Hype disponibles">
              {dropProducts.map((product) => {
                const image = firstMediaImage(product);
                const price = Number(product.price || 0);
                const compareAt = buildCompareAt(price, product.discountPercent);
                const discount = Number(product.discountPercent || 0);

                return (
                  <Link key={product.id} className="card" href={productHref(product)}>
                    <div className="media">
                      <span className="tag">Drop-Hype</span>
                      {image ? (
                        <img src={image} alt={product.title || product.name || "Producto Drop-Hype"} />
                      ) : (
                        <div className="mediaFallback">JUSP</div>
                      )}
                    </div>
                    <div className="body">
                      <div className="brand">{product.brand || "JUSP"}</div>
                      <div className="name">{product.title || product.name || "Producto"}</div>
                      <div className="priceRow">
                        <span className="price">${moneyCOP(price)}</span>
                        {compareAt > 0 ? <span className="compare">${moneyCOP(compareAt)}</span> : null}
                        {discount > 0 ? <span className="discount">-{Math.round(discount)}%</span> : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          ) : (
            <section className="empty" aria-label="Drop-Hype sin productos">
              {isFriday
                ? "Hoy es viernes, pero no hay productos Drop-Hype activos con disponibilidad en este momento."
                : "El Drop-Hype solo muestra productos disponibles los viernes. Fuera de ese dia esta pagina permanece cerrada."}
            </section>
          )}
        </div>
      </main>
    </DropsGate>
  );
}
