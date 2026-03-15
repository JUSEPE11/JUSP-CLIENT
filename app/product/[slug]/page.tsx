"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "../../components/store";

type ProductVariant = {
  key: string;
  color?: string;
  size?: string;
  price: number;
  supplierPrice?: number;
  stock?: number;
};

type Product = {
  id: string;
  slug?: string;
  product_code?: string;
  title: string;
  name?: string;
  price: number;
  currency?: string;
  description?: string;
  image?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  category?: string;
  brand?: string;
  gender?: "men" | "women" | "kids" | "unisex";
  productType?: "shoes" | "clothing" | "accessory";
  kind?: string;
  sport?: string[];
  models?: string[];
  tags?: string[];
  isExclusive?: boolean;
  isCollection?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  discountPercent?: number;
  bestSeller?: boolean;
  stockHint?: number;
  variants?: ProductVariant[];
};

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function uniqueStringsCaseInsensitive(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of arr) {
    const value = String(item || "").trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(value);
  }

  return out;
}

function buildImageCandidates(p: Product, pageSlug?: string): string[] {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const main = (typeof p.image === "string" ? p.image : "").trim();

  const raw = [main, ...imgs].map((x) => String(x || "").trim()).filter(Boolean);

  const isAbs = (s: string) => /^https?:\/\//i.test(s);
  const hasExt = (s: string) => /\.(png|jpe?g|webp|gif|avif)$/i.test(s);

  const normalizeOne = (s: string) => {
    const v = String(s || "").trim();
    if (!v) return "";
    if (isAbs(v)) return v;
    if (v.startsWith("/")) return v;
    if (v.startsWith("products/")) return `/${v}`;
    if (hasExt(v)) return `/products/${v}`;
    return "";
  };

  const candidateSlugs = uniqueStringsCaseInsensitive(
    [
      String(pageSlug || "").trim(),
      String(p.slug || "").trim(),
      String(p.id || "").trim(),
      String(p.product_code || "").trim(),
    ].filter(Boolean)
  ).map((x) => x.toLowerCase());

  const localCandidates = candidateSlugs.flatMap((s) =>
    [1, 2, 3, 4, 5].map((i) => `/products/${s}/${i}.jpg`)
  );

  return uniqueStringsCaseInsensitive([...raw.map(normalizeOne).filter(Boolean), ...localCandidates]);
}

function loadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

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

function safeArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim())
    : [];
}

function uniq(arr: string[]) {
  const out: string[] = [];
  for (const a of arr) {
    const v = (a || "").trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

type SizingMode = "shoe" | "apparel";

const WOMEN_SHOE_FULL_US = ["5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5"];
const APPAREL_SIZES = ["S", "M", "L", "XL"];
const MEN_DEFAULT = ["7", "7.5", "8", "8.5", "9", "10"];
const KIDS_DEFAULT = ["3Y", "3.5Y", "4Y", "4.5Y", "5Y", "5.5Y", "6Y"];

function normalizeVariants(product: Product): ProductVariant[] {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const out: ProductVariant[] = [];

  for (const v of variants) {
    const size = String(v.size ?? "").trim();
    const price = typeof v.price === "number" ? v.price : Number(v.price);
    if (!size) continue;
    if (!Number.isFinite(price)) continue;
    out.push({ ...v, size, price });
  }

  return out;
}

function looksLikeApparelSize(s: string) {
  const x = String(s || "").trim().toLowerCase();
  return x === "xs" || x === "s" || x === "m" || x === "l" || x === "xl" || x === "xxl";
}

function inferSizingMode(product: Product, variants: ProductVariant[]): SizingMode {
  const vSizes = uniq(variants.map((v) => String(v?.size ?? "").trim()).filter(Boolean));

  if (vSizes.some((s) => looksLikeApparelSize(s))) return "apparel";

  const ps = safeArr(product.sizes);
  if (ps.some((s) => looksLikeApparelSize(s))) return "apparel";

  const haystack =
    `${String(product.category ?? "")} ${String((product as any)?.type ?? "")} ${String(
      (product as any)?.collection ?? ""
    )} ${String(product.title ?? "")} ${String(product.name ?? "")}`.toLowerCase();

  const apparelWords = [
    "shirt",
    "tee",
    "t-shirt",
    "camisa",
    "polo",
    "hoodie",
    "sudadera",
    "sweater",
    "jacket",
    "chaqueta",
    "pants",
    "pantalon",
    "jean",
    "jeans",
    "short",
    "shorts",
    "bermuda",
    "ropa",
    "apparel",
    "tank",
    "top",
    "bra",
  ];

  if (apparelWords.some((w) => haystack.includes(w))) return "apparel";

  return "shoe";
}

function findVariantBySize(
  product: Product,
  scope: GenderScope,
  displayedSize: string | null
): ProductVariant | null {
  const variants = normalizeVariants(product);
  if (!variants.length) return null;

  const ds = (displayedSize ?? "").trim();

  if (ds) {
    const exact = variants.filter((v) => String(v.size ?? "").trim() === ds);
    if (exact.length) {
      let best = exact[0];
      for (const v of exact) {
        const p = Number(v.price ?? 0);
        if (p < Number(best.price ?? 0)) best = v;
      }
      return best;
    }
  }

  const normalizedDs = ds;
  const maybeConverted =
    scope === "women" && normalizedDs && !/[a-zA-Z/]/.test(normalizedDs)
      ? convertWomenToMenUS(normalizedDs)
      : normalizedDs;

  if (maybeConverted && maybeConverted !== normalizedDs) {
    const converted = variants.filter((v) => String(v.size ?? "").trim() === maybeConverted);
    if (converted.length) {
      let best = converted[0];
      for (const v of converted) {
        const p = Number(v.price ?? 0);
        if (p < Number(best.price ?? 0)) best = v;
      }
      return best;
    }
  }

  let best = variants[0];
  for (const v of variants) {
    const p = Number(v.price ?? 0);
    if (p < Number(best.price ?? 0)) best = v;
  }

  return best ?? null;
}

function minVariantPrice(product: Product): number {
  const variants = normalizeVariants(product);
  if (!variants.length) return Number(product.price || 0);

  let m = Number.POSITIVE_INFINITY;
  for (const v of variants) {
    const p = typeof v.price === "number" ? v.price : Number.POSITIVE_INFINITY;
    if (p < m) m = p;
  }

  return Number.isFinite(m) ? m : Number(product.price || 0);
}

function maxVariantPrice(product: Product): number {
  const variants = normalizeVariants(product);
  if (!variants.length) return Number(product.price || 0);

  let m = 0;
  for (const v of variants) {
    const p = typeof v.price === "number" ? v.price : 0;
    if (p > m) m = p;
  }

  return Number.isFinite(m) ? m : Number(product.price || 0);
}

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gParam = searchParams?.get("g");

  const slug = decodeURIComponent(String(params?.slug || "")).trim().toLowerCase();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoadingProduct(true);

        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();

        const list = Array.isArray(data) ? data : [];
        const s = String(slug || "").trim().toLowerCase();

        const found = list.find((p: any) => {
          const pid = String(p?.id ?? "").trim().toLowerCase();
          const pslug = String(p?.slug ?? "").trim().toLowerCase();
          const pcode = String(p?.product_code ?? "").trim().toLowerCase();
          return pid === s || pslug === s || pcode === s;
        }) as Product | undefined;

        if (!cancelled) {
          setProduct(found);
        }
      } catch {
        if (!cancelled) {
          setProduct(undefined);
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const initialScope = useMemo<GenderScope>(() => {
    const fromProduct = normalizeGenderScope(product?.gender);
    if (fromProduct) return fromProduct;

    const fromQuery = normalizeGenderScope(gParam);
    if (fromQuery) return fromQuery;

    return "men";
  }, [gParam, product]);

  const [scope, setScope] = useState<GenderScope>(initialScope);
  const [imgs, setImgs] = useState<string[]>([]);

  useEffect(() => {
    setScope(initialScope);
  }, [initialScope]);

  useEffect(() => {
    if (gParam) return;
    const stored = readStoredScope();
    if (!stored) return;
    setScope((prev) => (prev === stored ? prev : stored));
  }, [gParam]);

  useEffect(() => {
    storeScope(scope);
  }, [scope]);

  const title = useMemo(
    () => (product ? product.title || product.name || "Producto" : "Producto"),
    [product]
  );

  const imageCandidates = useMemo(
    () => (product ? buildImageCandidates(product, slug) : []),
    [product, slug]
  );

  const variants = useMemo(() => (product ? normalizeVariants(product) : []), [product]);

  useEffect(() => {
    let cancelled = false;

    async function resolveImgs() {
      if (!imageCandidates.length) {
        if (!cancelled) setImgs([]);
        return;
      }

      const checks = await Promise.all(
        imageCandidates.map(async (src) => ({
          src,
          ok: await loadImage(src),
        }))
      );

      const valid = checks.filter((x) => x.ok).map((x) => x.src);

      if (!cancelled) {
        setImgs(uniqueStringsCaseInsensitive(valid));
      }
    }

    resolveImgs();

    return () => {
      cancelled = true;
    };
  }, [imageCandidates]);

  const sizingMode = useMemo<SizingMode>(() => {
    if (!product) return "shoe";
    return inferSizingMode(product, variants);
  }, [product, variants]);

  const rawSizes = useMemo(() => {
    if (!product) return [];

    if (variants.length) {
      return uniq(variants.map((v) => String(v?.size ?? "").trim()).filter(Boolean));
    }

    const ps = safeArr(product.sizes);
    if (ps.length) return uniq(ps);

    if (sizingMode === "apparel") return APPAREL_SIZES;
    if (scope === "women") return WOMEN_SHOE_FULL_US.map(convertWomenToMenUS);
    if (scope === "kids") return KIDS_DEFAULT;
    return MEN_DEFAULT;
  }, [product, variants, scope, sizingMode]);

  const sizes = useMemo(() => {
    if (variants.length) return rawSizes;
    if (sizingMode === "apparel") return rawSizes;
    if (scope === "women") return applyScopeToSizes(rawSizes, scope);
    return rawSizes;
  }, [rawSizes, scope, sizingMode, variants]);

  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [toast, setToast] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState<number>(0);
  const [attemptedBuy, setAttemptedBuy] = useState(false);

  useEffect(() => {
    setActiveImg(0);
    setAttemptedBuy(false);

    if (sizes.length) {
      setSize((prev) => {
        if (prev && sizes.includes(prev)) return prev;
        return sizes[0] ?? null;
      });
    } else {
      setSize(null);
    }
  }, [slug, sizes]);

  useEffect(() => {
    if (!imgs.length) {
      setActiveImg(0);
      return;
    }

    setActiveImg((prev) => (prev >= imgs.length ? 0 : prev));
  }, [imgs]);

  const hasRealVariants = useMemo(() => variants.length > 0, [variants]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return findVariantBySize(product, scope, size);
  }, [product, scope, size]);

  const displayPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant && typeof selectedVariant.price === "number") return selectedVariant.price;
    return Number(product.price ?? 0);
  }, [product, selectedVariant]);

  const fromPrice = useMemo(() => (product ? minVariantPrice(product) : 0), [product]);
  const toPrice = useMemo(() => (product ? maxVariantPrice(product) : 0), [product]);

  const discountPct = useMemo(() => {
    const d = Number(product?.discountPercent ?? 0);
    if (!Number.isFinite(d)) return 0;
    return Math.max(0, Math.min(90, Math.round(d)));
  }, [product]);

  const priceBefore = useMemo(() => {
    if (!displayPrice) return 0;
    if (!discountPct) return 0;
    return Math.round(displayPrice / (1 - discountPct / 100));
  }, [displayPrice, discountPct]);

  const urgencyText = useMemo(() => {
    const hint = Number(product?.stockHint ?? 0);
    if (hint > 0 && hint <= 2) return "Quedan muy pocas";
    if (hint > 0 && hint <= 8) return "Stock limitado";
    return "Disponible";
  }, [product]);

  const selectionMissing = useMemo(() => {
    if (!hasRealVariants) return false;
    const okSize = !!(size && size.trim());
    return !okSize;
  }, [hasRealVariants, size]);

  const selectionHint = useMemo(() => {
    if (!hasRealVariants) return null;
    if (!attemptedBuy) return "Selecciona talla para ver el precio exacto.";
    if (selectionMissing) return "Falta seleccionar talla para continuar.";
    return null;
  }, [hasRealVariants, attemptedBuy, selectionMissing]);

  const { addToCart, openCart } = useStore();

  function onBuyReal(mode: "add" | "now") {
    setAttemptedBuy(true);

    if (selectionMissing || !product) {
      setToast("Selecciona talla para continuar");
      window.setTimeout(() => setToast(null), 1600);
      return;
    }

    const cloned: any = { ...product, price: displayPrice };
    addToCart(cloned, { color: null, size, qty });

    setToast("Añadido al carrito");
    openCart();
    window.setTimeout(() => setToast(null), 1600);

    if (mode === "now") {
      window.setTimeout(() => router.push("/checkout"), 350);
    }
  }

  if (loadingProduct) {
    return (
      <main style={{ padding: 24 }}>
        <Link href="/products">← Volver</Link>
        <h1 style={{ marginTop: 12 }}>Cargando producto...</h1>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ padding: 24 }}>
        <Link href="/products">← Volver</Link>
        <h1 style={{ marginTop: 12 }}>Producto no encontrado</h1>
      </main>
    );
  }

  return (
    <main className="root">
      <div className="wrap">
        <div className="top">
          <Link className="back" href="/products">
            ← Volver
          </Link>

          <div className="topR">
            <Link className="link" href="/size-guide">
              Guía de tallas
            </Link>
            <button className="go" type="button" onClick={() => router.push("/checkout")}>
              Ir al checkout
            </button>
          </div>
        </div>

        <div className="grid">
          <section className="media">
            <div className="mediaCard">
              <div className="gallery">
                {imgs.length > 1 ? (
                  <div className="thumbCol" aria-label="Miniaturas">
                    {imgs.slice(0, 10).map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        className={`thBtn ${activeImg === i ? "on" : ""}`}
                        onClick={() => setActiveImg(i)}
                        aria-label={`Ver imagen ${i + 1}`}
                      >
                        <img className="th" src={src} alt="" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="imgBox">
                  {imgs[activeImg] ? <img src={imgs[activeImg]} alt={title} /> : <div className="ph" />}

                  <div className="imgBadge">
                    <span className="b1">JUSP</span>
                    <span className="bDot" aria-hidden="true" />
                    <span className="b2">{urgencyText}</span>
                  </div>

                  <div className="imgGlow" aria-hidden="true" />
                </div>
              </div>
            </div>
          </section>

          <section className="info">
            <div className="card">
              <div className="head">
                <div className="title">{title}</div>
                <div className="sub">
                  <span className="chip">Originales</span>
                  <span className="chip">Cross-border</span>
                  <span className="chip">Soporte</span>
                </div>
              </div>

              <div className="priceBox">
                <div className="priceNow">
                  <span className="cur">$</span>
                  <span className="num">{moneyCOP(displayPrice)}</span>
                </div>

                <div className="priceMeta">
                  {hasRealVariants && fromPrice > 0 && toPrice > 0 && fromPrice !== toPrice ? (
                    <div className="range">
                      Rango: <b>${moneyCOP(fromPrice)}</b> – <b>${moneyCOP(toPrice)}</b> (según talla)
                    </div>
                  ) : (
                    <div className="range">Precio según talla y disponibilidad</div>
                  )}

                  <div className="coupon">
                    Descuento <span className="pillGold">-{discountPct || 0}%</span>
                  </div>

                  {priceBefore ? (
                    <div className="before">
                      Antes <span className="strike">${moneyCOP(priceBefore)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectionHint ? (
                <div className={`hint ${attemptedBuy && selectionMissing ? "err" : ""}`}>{selectionHint}</div>
              ) : null}

              <div className="blk">
                <div className="lbl">Talla</div>
                <div className="gridOps">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      className={`op ${size === s ? "on" : ""} ${
                        attemptedBuy && selectionMissing && !size ? "shake" : ""
                      }`}
                      type="button"
                      onClick={() => {
                        setSize(s);
                        setAttemptedBuy(false);
                      }}
                    >
                      <span className="opT">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="blk">
                <div className="lbl">Cantidad</div>
                <div className="qty">
                  <button type="button" className="qbtn" onClick={() => setQty((v) => Math.max(1, v - 1))}>
                    −
                  </button>
                  <div className="qval">{qty}</div>
                  <button type="button" className="qbtn" onClick={() => setQty((v) => v + 1)}>
                    +
                  </button>
                </div>
              </div>

              <div className="ctaRow">
                <button className="ctaAlt" type="button" onClick={() => onBuyReal("add")}>
                  Añadir al carrito
                </button>
                <button className="ctaBlack" type="button" onClick={() => onBuyReal("now")}>
                  Comprar ahora
                </button>
              </div>

              <div className="footNote">
                <span className="dot" aria-hidden="true" />
                <span>Entrega internacional gestionada por JUSP.</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mobileBar" role="presentation">
        <div className="mLeft">
          <div className="mTop">
            <div className="mLabel">Total</div>
            <div className="mVal">${moneyCOP(displayPrice * Math.max(1, qty))}</div>
          </div>
          {hasRealVariants ? (
            <div className={`mHint ${attemptedBuy && selectionMissing ? "mErr" : ""}`}>
              {selectionMissing ? "Selecciona talla" : "Listo para comprar"}
            </div>
          ) : (
            <div className="mHint">Listo para comprar</div>
          )}
        </div>

        <div className="mBtns">
          <button className="mBtnAlt" type="button" onClick={() => onBuyReal("add")}>
            Añadir
          </button>
          <button className="mBtnBlack" type="button" onClick={() => onBuyReal("now")}>
            Ahora
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <style jsx>{`
        :root {
          --jusp-gold: #d4af37;
          --jusp-gold-2: #f5c400;
          --jusp-gold-soft: rgba(212, 175, 55, 0.14);
          --jusp-gold-mid: rgba(212, 175, 55, 0.42);
          --jusp-gold-strong: rgba(212, 175, 55, 0.95);

          --ink: rgba(0, 0, 0, 0.9);
          --ink2: rgba(0, 0, 0, 0.72);
          --ink3: rgba(0, 0, 0, 0.56);

          --b: rgba(0, 0, 0, 0.1);
          --b2: rgba(0, 0, 0, 0.08);

          --shadow: 0 18px 60px rgba(0, 0, 0, 0.08);
          --shadow2: 0 22px 80px rgba(0, 0, 0, 0.12);
        }

        .root {
          padding-top: 8px;
          padding-bottom: 124px;
          padding-left: 16px;
          padding-right: 16px;
          min-height: 100vh;
          background: radial-gradient(1200px 500px at 20% 0%, rgba(212, 175, 55, 0.08), transparent 60%),
            radial-gradient(900px 500px at 90% 10%, rgba(0, 0, 0, 0.04), transparent 55%), #ffffff;
        }

        .wrap {
          max-width: 1160px;
          margin: 0 auto;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .back {
          text-decoration: none;
          font-weight: 950;
          color: var(--ink2);
          letter-spacing: -0.01em;
        }
        .back:hover {
          color: var(--ink);
        }

        .topR {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .link {
          text-decoration: none;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.68);
          border: 1px solid var(--b);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 999px;
          padding: 12px 14px;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .link:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
          color: var(--ink);
        }

        .go {
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          color: #111;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .go:hover {
          background: #fff;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        .go:active {
          transform: translateY(0);
        }

        .grid {
          display: grid;
          grid-template-columns: 1.18fr 0.82fr;
          gap: 18px;
          align-items: start;
        }

        .mediaCard {
          border-radius: 22px;
          border: 1px solid var(--b2);
          background: rgba(255, 255, 255, 0.86);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .gallery {
          display: grid;
          grid-template-columns: 98px 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px;
        }

        .thumbCol {
          display: grid;
          gap: 10px;
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 16px);
        }

        .thBtn {
          border: 1px solid var(--b);
          background: #fff;
          border-radius: 14px;
          padding: 6px;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }
        .thBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.07);
        }
        .thBtn.on {
          border-color: var(--jusp-gold-mid);
          box-shadow: 0 0 0 3px var(--jusp-gold-soft), 0 14px 34px rgba(0, 0, 0, 0.08);
        }

        .th {
          width: 86px;
          height: 86px;
          border-radius: 12px;
          object-fit: contain;
          display: block;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.01));
        }

        .imgBox {
          position: relative;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: radial-gradient(500px 240px at 40% 20%, rgba(212, 175, 55, 0.12), transparent 60%), #fafafa;
          overflow: hidden;
          aspect-ratio: 3 / 4;
          min-height: 520px;
          display: grid;
          place-items: center;
          box-shadow: var(--shadow2);
        }

        .imgBox img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 12px;
          display: block;
          user-select: none;
          -webkit-user-select: none;
          transform: translateZ(0);
        }

        .imgGlow {
          position: absolute;
          inset: -40px;
          background: radial-gradient(420px 240px at 20% 10%, rgba(245, 196, 0, 0.14), transparent 60%);
          pointer-events: none;
          mix-blend-mode: multiply;
        }

        .ph {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.16);
        }

        .imgBadge {
          position: absolute;
          left: 12px;
          bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .b1 {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
          font-size: 12px;
          letter-spacing: 0.02em;
        }
        .bDot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
        }
        .b2 {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
        }

        .card {
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: var(--shadow2);
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 16px);
          overflow: hidden;
        }
        .card::before {
          content: "";
          position: absolute;
          inset: -2px;
          background: radial-gradient(520px 260px at 30% 0%, rgba(212, 175, 55, 0.14), transparent 60%);
          pointer-events: none;
        }

        .head {
          position: relative;
          display: grid;
          gap: 10px;
        }

        .title {
          font-weight: 950;
          color: #111;
          font-size: 24px;
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .sub {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chip {
          font-weight: 900;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.64);
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
          padding: 10px 12px;
          border-radius: 999px;
        }

        .priceBox {
          position: relative;
          margin-top: 12px;
          display: grid;
          gap: 10px;
          padding: 12px 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.8);
          border-radius: 18px;
        }

        .priceNow {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .cur {
          font-weight: 950;
          color: var(--jusp-gold-strong);
          font-size: 16px;
        }
        .num {
          font-weight: 950;
          color: var(--jusp-gold-strong);
          font-size: 30px;
          letter-spacing: -0.02em;
        }

        .priceMeta {
          display: grid;
          gap: 6px;
        }
        .range {
          font-weight: 900;
          color: var(--ink2);
          font-size: 12px;
        }
        .coupon {
          font-weight: 900;
          color: var(--ink2);
          font-size: 12px;
        }
        .pillGold {
          display: inline-block;
          margin-left: 8px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.9);
          background: linear-gradient(90deg, var(--jusp-gold), var(--jusp-gold-2));
          border-radius: 999px;
          padding: 6px 10px;
          box-shadow: 0 14px 34px rgba(212, 175, 55, 0.18);
        }
        .before {
          font-weight: 900;
          color: var(--ink3);
          font-size: 12px;
        }
        .strike {
          text-decoration: line-through;
          color: rgba(0, 0, 0, 0.45);
          margin-left: 6px;
          font-weight: 900;
        }

        .hint {
          position: relative;
          margin-top: 10px;
          border-radius: 16px;
          border: 1px dashed rgba(0, 0, 0, 0.14);
          background: rgba(0, 0, 0, 0.02);
          padding: 11px 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
          font-size: 12px;
        }
        .hint.err {
          border-color: rgba(255, 40, 0, 0.25);
          background: rgba(255, 40, 0, 0.04);
          color: rgba(255, 40, 0, 0.9);
        }

        .blk {
          position: relative;
          margin-top: 14px;
        }
        .lbl {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .gridOps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .op {
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 16px;
          padding: 12px 12px;
          cursor: pointer;
          display: grid;
          gap: 6px;
          text-align: left;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;
        }
        .op:hover {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
        }
        .op.on {
          border-color: var(--jusp-gold-mid);
          box-shadow: 0 0 0 3px var(--jusp-gold-soft), 0 18px 44px rgba(0, 0, 0, 0.1);
        }
        .opT {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
          font-size: 14px;
          letter-spacing: -0.01em;
        }

        .shake {
          animation: shake 220ms ease-in-out 1;
        }
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          50% {
            transform: translateX(2px);
          }
          75% {
            transform: translateX(-2px);
          }
          100% {
            transform: translateX(0);
          }
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.86);
          width: fit-content;
        }
        .qbtn {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          cursor: pointer;
          font-weight: 950;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.86);
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .qbtn:hover {
          background: rgba(0, 0, 0, 0.02);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        .qbtn:active {
          transform: translateY(0);
        }
        .qval {
          min-width: 34px;
          text-align: center;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
        }

        .ctaRow {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: center;
        }

        .ctaAlt {
          width: 100%;
          border-radius: 16px;
          padding: 14px 14px;
          font-weight: 950;
          border: 0;
          cursor: pointer;
          background: linear-gradient(90deg, var(--jusp-gold), var(--jusp-gold-2));
          color: rgba(0, 0, 0, 0.92);
          box-shadow: 0 20px 54px rgba(212, 175, 55, 0.22);
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
        }
        .ctaAlt:hover {
          filter: saturate(1.06);
          transform: translateY(-1px);
          box-shadow: 0 26px 70px rgba(212, 175, 55, 0.28);
        }
        .ctaAlt:active {
          transform: translateY(0);
        }

        .ctaBlack {
          width: 100%;
          border-radius: 16px;
          padding: 14px 14px;
          font-weight: 950;
          border: 0;
          cursor: pointer;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.84));
          color: rgba(255, 255, 255, 0.96);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
        }
        .ctaBlack:hover {
          transform: translateY(-1px);
          box-shadow: 0 28px 78px rgba(0, 0, 0, 0.28);
          filter: contrast(1.02);
        }
        .ctaBlack:active {
          transform: translateY(0);
        }

        .footNote {
          position: relative;
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.6);
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(212, 175, 55, 0.9);
        }

        .toast {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          top: calc(var(--jusp-header-h, 64px) + 14px);
          width: min(520px, calc(100vw - 22px));
          z-index: 2100;
          border-radius: 18px;
          padding: 12px 12px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.16);
          font-weight: 950;
          color: #111;
          text-align: center;
          user-select: none;
          -webkit-user-select: none;
        }

        .mobileBar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2400;
          display: none;
          padding: 10px 12px 12px;
          background: rgba(255, 255, 255, 0.94);
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .mLeft {
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .mTop {
          display: grid;
          gap: 2px;
        }
        .mLabel {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.6);
          font-size: 11px;
        }
        .mVal {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.9);
          font-size: 14px;
        }
        .mHint {
          font-weight: 950;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.62);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mErr {
          color: rgba(255, 40, 0, 0.88);
        }
        .mBtns {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: nowrap;
        }

        .mBtnAlt {
          border: 0;
          border-radius: 16px;
          padding: 14px 16px;
          font-weight: 950;
          cursor: pointer;
          background: linear-gradient(90deg, var(--jusp-gold), var(--jusp-gold-2));
          color: rgba(0, 0, 0, 0.92);
          box-shadow: 0 18px 50px rgba(212, 175, 55, 0.18);
          min-width: 120px;
        }
        .mBtnBlack {
          border: 0;
          border-radius: 16px;
          padding: 14px 16px;
          font-weight: 950;
          cursor: pointer;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.84));
          color: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 56px rgba(0, 0, 0, 0.22);
          min-width: 120px;
        }

        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .gallery {
            grid-template-columns: 1fr;
          }
          .thumbCol {
            position: relative;
            top: auto;
            display: flex;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
            gap: 10px;
          }
          .th {
            width: 78px;
            height: 78px;
          }
          .card {
            position: relative;
            top: auto;
          }
          .imgBox {
            min-height: 440px;
          }
        }

        @media (max-width: 720px) {
          .mobileBar {
            display: flex;
          }
          .gridOps {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 721px) {
          .mobileBar {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}