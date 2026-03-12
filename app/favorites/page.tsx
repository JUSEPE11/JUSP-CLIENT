"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

/** =========================
 *  Types
 *  ========================= */
type FavAny = any;

type FavoriteItem = {
  id: string;
  title: string;
  price?: number | null;
  image?: string | null;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  href?: string | null;
  createdAt?: string | null;
};

type SortKey = "recommended" | "price_desc" | "price_asc" | "title_asc";

/** =========================
 *  Storage keys candidates
 *  ========================= */
const KEYS_CANDIDATES = ["jusp_favorites", "favorites", "wishlist", "jusp_wishlist"];

/** =========================
 *  Helpers (SAFE)
 *  ========================= */
function safeNum(v: unknown): number | null {
  if (typeof v === "string") {
    const cleaned = v
      .replace(/[^\d.,-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeMoneyCOP(n: number): string {
  const rounded = Math.round(n);
  return rounded.toLocaleString("es-CO");
}

function compactId(id: string): string {
  const s = String(id || "");
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function tryParseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function titleFromSlug(slugLike: string): string {
  const raw = String(slugLike || "").trim();
  if (!raw) return "Producto guardado";

  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(input: string): string {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return "";

  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['".,()[\]{}]+/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProductPath(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const path = `${url.pathname}${url.search}${url.hash}`;
      return normalizeProductPath(path);
    } catch {
      return raw;
    }
  }

  if (raw.startsWith("/product/")) return raw;

  if (raw.startsWith("/products/")) {
    return `/product/${raw.slice("/products/".length)}`;
  }

  if (!raw.startsWith("/")) {
    return `/product/${encodeURIComponent(raw)}`;
  }

  return raw;
}

function normalizeImageUrl(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;

  if (/^[a-z0-9_\-/]+\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(raw)) {
    return `/${raw.replace(/^\/+/, "")}`;
  }

  return raw;
}

function objectValuesSafe(obj: Record<string, unknown>): unknown[] {
  try {
    return Object.values(obj);
  } catch {
    return [];
  }
}

function firstImageDeep(value: unknown, depth = 0, seen = new WeakSet<object>()): string | null {
  if (depth > 6 || value == null) return null;

  if (typeof value === "string") {
    const normalized = normalizeImageUrl(value);
    return normalized || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstImageDeep(item, depth + 1, seen);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;
  if (seen.has(obj)) return null;
  seen.add(obj);

  const direct = firstNonEmptyString(
    obj.url,
    obj.src,
    obj.href,
    obj.path,
    obj.secure_url,
    obj.secureUrl,
    obj.original,
    obj.original_url,
    obj.originalUrl,
    obj.thumbnail,
    obj.thumbnail_url,
    obj.thumbnailUrl,
    obj.image,
    obj.image_url,
    obj.imageUrl,
    obj.cover,
    obj.cover_url,
    obj.coverUrl,
    obj.photo,
    obj.photo_url,
    obj.photoUrl,
    obj.preview,
    obj.preview_url,
    obj.previewUrl,
    obj.small,
    obj.medium,
    obj.large,
  );

  if (direct) {
    const normalized = normalizeImageUrl(direct);
    if (normalized) return normalized;
  }

  const priorityNestedKeys = [
    "node",
    "nodes",
    "edge",
    "edges",
    "image",
    "images",
    "gallery",
    "media",
    "assets",
    "featuredImage",
    "featured_image",
    "featuredMedia",
    "featured_media",
    "featuredAsset",
    "featured_asset",
    "thumbnail",
    "cover",
    "photo",
    "photos",
    "previewImage",
    "preview_image",
  ];

  for (const key of priorityNestedKeys) {
    if (key in obj) {
      const found = firstImageDeep(obj[key], depth + 1, seen);
      if (found) return found;
    }
  }

  for (const v of objectValuesSafe(obj)) {
    const found = firstImageDeep(v, depth + 1, seen);
    if (found) return found;
  }

  return null;
}

function firstImageFromUnknown(...values: unknown[]): string | null {
  for (const value of values) {
    const found = firstImageDeep(value);
    if (found) return found;
  }
  return null;
}

function firstPriceFromUnknown(...values: unknown[]): number | null {
  for (const value of values) {
    if (value == null) continue;

    if (typeof value === "number" || typeof value === "string") {
      const n = safeNum(value);
      if (n !== null) return n;
      continue;
    }

    if (typeof value === "object") {
      const v = value as any;

      const nested =
        safeNum(v.value) ??
        safeNum(v.amount) ??
        safeNum(v.price) ??
        safeNum(v.sale_price) ??
        safeNum(v.salePrice) ??
        safeNum(v.retail_price) ??
        safeNum(v.retailPrice) ??
        safeNum(v.min) ??
        safeNum(v.max) ??
        safeNum(v.current) ??
        safeNum(v.unit_amount);

      if (nested !== null) return nested;

      const deepNested = firstPriceFromUnknown(
        v.price,
        v.sale_price,
        v.salePrice,
        v.amount,
        v.min,
        v.max,
      );

      if (deepNested !== null) return deepNested;
    }
  }

  return null;
}

function normalizeHrefCandidate(raw: any, id: string): string {
  const direct =
    firstNonEmptyString(
      raw?.href,
      raw?.url,
      raw?.link,
      raw?.permalink,
      raw?.productUrl,
      raw?.product_url,
      raw?.pathname,
      raw?.product?.href,
      raw?.product?.url,
      raw?.product?.link,
      raw?.product?.permalink,
    ) || "";

  if (direct) return normalizeProductPath(direct);

  const slug =
    firstNonEmptyString(
      raw?.slug,
      raw?.handle,
      raw?.product?.slug,
      raw?.product?.handle,
      raw?.product_id,
      raw?.id,
    ) || id;

  return `/product/${encodeURIComponent(slug)}`;
}

function slugFromHrefOrId(href?: string | null, id?: string | null): string {
  const rawHref = String(href || "").trim();
  const rawId = String(id || "").trim();

  const tryDecode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  if (rawHref) {
    const normalized = normalizeProductPath(rawHref);
    const match = normalized.match(/^\/product\/([^/?#]+)/i);
    if (match?.[1]) return tryDecode(match[1]).trim();
  }

  if (rawId) return tryDecode(rawId).trim();

  return "";
}

function slugCandidatesFromItem(item: FavoriteItem): string[] {
  const raw: string[] = [];

  const fromHrefOrId = slugFromHrefOrId(item.href, item.id);
  if (fromHrefOrId) raw.push(fromHrefOrId);

  const idClean = String(item.id || "").trim();
  if (idClean) {
    raw.push(idClean);
    raw.push(slugify(idClean));
  }

  const titleClean = String(item.title || "").trim();
  if (titleClean) raw.push(slugify(titleClean));

  const out: string[] = [];
  for (const value of raw) {
    const s = String(value || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");
    if (s && !out.includes(s)) out.push(s);
  }

  return out;
}

function productFolderImageCandidates(item: FavoriteItem): string[] {
  const slugs = slugCandidatesFromItem(item);

  const direct = item.image ? [normalizeImageUrl(item.image)] : [];

  const derived: string[] = [];
  for (const slug of slugs) {
    derived.push(
      `/products/${slug}/1.jpg`,
      `/products/${slug}/1.jpeg`,
      `/products/${slug}/1.png`,
      `/products/${slug}/1.webp`,
      `/products/${slug}/cover.jpg`,
      `/products/${slug}/cover.jpeg`,
      `/products/${slug}/cover.png`,
      `/products/${slug}/cover.webp`,
      `/products/${slug}/main.jpg`,
      `/products/${slug}/main.jpeg`,
      `/products/${slug}/main.png`,
      `/products/${slug}/main.webp`,
    );
  }

  const out: string[] = [];
  for (const value of [...direct, ...derived]) {
    const s = String(value || "").trim();
    if (s && !out.includes(s)) out.push(s);
  }

  return out;
}

function normalizeOne(raw: FavAny): FavoriteItem | null {
  if (typeof raw === "string") {
    const id = raw.trim();
    if (!id) return null;
    return {
      id,
      title: titleFromSlug(id),
      href: `/product/${encodeURIComponent(id)}`,
    };
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    const id = String(raw);
    return {
      id,
      title: titleFromSlug(id),
      href: `/product/${encodeURIComponent(id)}`,
    };
  }

  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;

  const id =
    firstNonEmptyString(
      r.id,
      r.product_id,
      r.productId,
      r.sku,
      r.slug,
      r.handle,
      r.product?.id,
      r.product?.slug,
      r.product?.handle,
    ) || "";

  if (!id) return null;

  const rawTitle =
    firstNonEmptyString(
      r.title,
      r.name,
      r.product_title,
      r.label,
      r.product?.title,
      r.product?.name,
    ) || "";

  const slugForTitle =
    firstNonEmptyString(r.slug, r.handle, r.product?.slug, r.product?.handle, id) || id;

  const title = rawTitle || titleFromSlug(slugForTitle);

  const price = firstPriceFromUnknown(
    r.price,
    r.amount,
    r.sale_price,
    r.salePrice,
    r.retail_price,
    r.retailPrice,
    r.value,
    r.pricing,
    r.money,
    r.selectedPrice,
    r.selected_price,
    r.variantPrice,
    r.variant_price,
    Array.isArray(r.variants) ? r.variants[0]?.price : null,
    Array.isArray(r.sizes) ? r.sizes[0]?.price : null,
    r.product?.price,
    r.product?.sale_price,
    r.product?.amount,
    r.product?.pricing,
  );

  const image = firstImageFromUnknown(
    r.image,
    r.img,
    r.thumbnail,
    r.cover,
    r.image_url,
    r.imageUrl,
    r.featuredImage,
    r.featured_image,
    r.featuredMedia,
    r.featured_media,
    r.featuredAsset,
    r.featured_asset,
    r.previewImage,
    r.preview_image,
    r.images,
    r.gallery,
    r.media,
    r.assets,
    r.photo,
    r.photos,
    Array.isArray(r.variants) ? r.variants[0]?.image : null,
    Array.isArray(r.variants) ? r.variants[0]?.images : null,
    r.product?.image,
    r.product?.img,
    r.product?.thumbnail,
    r.product?.featuredImage,
    r.product?.featured_image,
    r.product?.featuredMedia,
    r.product?.featured_media,
    r.product?.featuredAsset,
    r.product?.featured_asset,
    r.product?.images,
    r.product?.gallery,
    r.product?.media,
    r.product?.assets,
  );

  const brand =
    firstNonEmptyString(
      r.brand,
      r.marca,
      r.vendor,
      r.manufacturer,
      r.product?.brand,
      r.product?.vendor,
    ) || null;

  const size =
    firstNonEmptyString(
      r.size,
      r.talla,
      Array.isArray(r.sizes) ? r.sizes[0] : "",
      Array.isArray(r.variants) ? r.variants[0]?.size : "",
      r.product?.size,
    ) || null;

  const color =
    firstNonEmptyString(
      r.color,
      r.colour,
      r.colorway,
      Array.isArray(r.colors) ? r.colors[0] : "",
      Array.isArray(r.variants) ? r.variants[0]?.color : "",
      r.product?.color,
      r.product?.colour,
    ) || null;

  const href = normalizeHrefCandidate(r, slugForTitle);

  const createdAt =
    firstNonEmptyString(
      r.createdAt,
      r.created_at,
      r.savedAt,
      r.saved_at,
      r.updatedAt,
      r.updated_at,
    ) || null;

  return {
    id,
    title,
    price,
    image,
    brand,
    size,
    color,
    href: href || null,
    createdAt,
  };
}

function normalizeList(input: unknown): FavoriteItem[] {
  const out: FavoriteItem[] = [];
  if (!input) return out;

  const maybeObj = input as any;
  if (typeof maybeObj === "object" && !Array.isArray(maybeObj)) {
    const arr =
      (Array.isArray(maybeObj.items) && maybeObj.items) ||
      (Array.isArray(maybeObj.favorites) && maybeObj.favorites) ||
      (Array.isArray(maybeObj.list) && maybeObj.list) ||
      (Array.isArray(maybeObj.data) && maybeObj.data) ||
      null;

    if (arr) return normalizeList(arr);
  }

  if (!Array.isArray(input)) {
    const one = normalizeOne(input as any);
    return one ? [one] : [];
  }

  for (const raw of input) {
    const one = normalizeOne(raw);
    if (!one) continue;
    if (!out.some((x) => x.id === one.id)) out.push(one);
  }

  return out;
}

function readFavoritesRaw(): { key: string | null; value: unknown } {
  if (typeof window === "undefined") return { key: null, value: null };

  for (const k of KEYS_CANDIDATES) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;

    const parsed = tryParseJSON<any>(raw);
    if (parsed !== null) return { key: k, value: parsed };

    const trimmed = raw.trim();
    if (trimmed.includes(",")) {
      const arr = trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return { key: k, value: arr };
    }

    return { key: k, value: trimmed };
  }

  return { key: null, value: null };
}

function uniq(arr: string[]): string[] {
  const out: string[] = [];
  for (const a of arr) if (a && !out.includes(a)) out.push(a);
  return out;
}

/** =========================
 *  UI helpers
 *  ========================= */
function FavoriteCardImage({ item, title }: { item: FavoriteItem; title: string }) {
  const candidates = useMemo(() => productFolderImageCandidates(item), [item]);
  const [index, setIndex] = useState(0);
  const [failedAll, setFailedAll] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailedAll(false);
  }, [candidates.join("|")]);

  const currentSrc = candidates[index] || "";

  if (!currentSrc || failedAll) {
    return (
      <div className="noimg">
        <span className="noimg-dot" />
        <span>Sin imagen</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={title}
      loading="lazy"
      onError={() => {
        setIndex((prev) => {
          const next = prev + 1;
          if (next >= candidates.length) {
            setFailedAll(true);
            return prev;
          }
          return next;
        });
      }}
    />
  );
}

/** =========================
 *  Page
 *  ========================= */
export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [storeKey, setStoreKey] = useState<string>("jusp_favorites");
  const [items, setItems] = useState<FavoriteItem[]>([]);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [chip, setChip] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const mounted = useRef(true);
  const toastTimer = useRef<any>(null);

  function showToast(msg: string): void {
    if (!mounted.current) return;
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 2200);
  }

  function reload(): void {
    setLoading(true);
    try {
      const { key, value } = readFavoritesRaw();
      const normalized = normalizeList(value);
      setStoreKey(key || "jusp_favorites");
      setItems(normalized);
    } finally {
      setTimeout(() => setLoading(false), 180);
    }
  }

  useEffect(() => {
    mounted.current = true;
    reload();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (KEYS_CANDIDATES.includes(e.key)) reload();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      mounted.current = false;
      window.removeEventListener("storage", onStorage);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const kpis = useMemo(() => {
    const total = items.length;
    const withPrice = items.filter((x) => typeof x.price === "number" && Number.isFinite(x.price)).length;
    const sum = items.reduce((acc, x) => acc + (typeof x.price === "number" ? x.price : 0), 0);
    return { total, withPrice, sum };
  }, [items]);

  const chips = useMemo(() => {
    const c: string[] = [];
    for (const it of items) {
      if (it.brand) c.push(it.brand);
      if (it.size) c.push(`Talla ${it.size}`);
      if (it.color) c.push(it.color);
    }
    return uniq(c).slice(0, 12);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...items];

    if (chip) {
      const cl = chip.toLowerCase();
      list = list.filter((x) => {
        const all = [
          x.brand ? String(x.brand) : "",
          x.size ? `Talla ${x.size}` : "",
          x.color ? String(x.color) : "",
        ]
          .join(" · ")
          .toLowerCase();

        return all.includes(cl);
      });
    }

    if (q) {
      list = list.filter((x) => {
        const hay = `${x.title} ${x.brand || ""} ${x.size || ""} ${x.color || ""} ${x.id}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sort === "price_desc") {
      list.sort((a, b) => (Number(b.price ?? -1) || -1) - (Number(a.price ?? -1) || -1));
    } else if (sort === "price_asc") {
      list.sort((a, b) => (Number(a.price ?? 1e18) || 1e18) - (Number(b.price ?? 1e18) || 1e18));
    } else if (sort === "title_asc") {
      list.sort((a, b) => String(a.title).localeCompare(String(b.title), "es"));
    } else {
      list.sort((a, b) => {
        const ap = typeof a.price === "number" ? 1 : 0;
        const bp = typeof b.price === "number" ? 1 : 0;
        const ai = productFolderImageCandidates(a).length ? 1 : 0;
        const bi = productFolderImageCandidates(b).length ? 1 : 0;
        const scoreA = ai * 2 + ap;
        const scoreB = bi * 2 + bp;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return String(a.title).localeCompare(String(b.title), "es");
      });
    }

    return list;
  }, [items, query, sort, chip]);

  function clearAll(): void {
    setItems([]);
    try {
      window.localStorage.setItem(storeKey, JSON.stringify([]));
    } catch {}
    showToast("Favoritos vacíos");
  }

  function productHrefFrom(item: FavoriteItem): string {
    const h = normalizeProductPath(item.href || "");
    if (h) return h;
    return `/product/${encodeURIComponent(item.id)}`;
  }

  const emptyByFilter = !loading && items.length > 0 && filtered.length === 0;

  return (
    <main className="fv-root">
      <div className="fv-wrap">
        <section className={`hero ${loading ? "isLoading" : "ready"}`}>
          <div className="hero-copy">
            <div className="kicker">CUENTA</div>
            <h1 className="title">Favoritos</h1>
            <p className="sub">
              Tu selección guardada en JUSP. Limpia, elegante y lista para volver a lo que más te
              gustó.
            </p>

            <div className="stats">
              <div className="stat stat-main">
                <div className="stat-l">Guardados</div>
                <div className="stat-v">{loading ? "—" : kpis.total}</div>
              </div>

              <div className="stat">
                <div className="stat-l">Con precio</div>
                <div className="stat-v">{loading ? "—" : kpis.withPrice}</div>
              </div>

              <div className="stat">
                <div className="stat-l">Total visible</div>
                <div className="stat-v">{loading ? "—" : `$${safeMoneyCOP(kpis.sum)}`}</div>
              </div>
            </div>
          </div>

          <div className="hero-side">
            <div className="actions">
              <Link className="btn ghost" href="/products">
                Seguir comprando
              </Link>

              <button className="btn ghost" onClick={reload} disabled={loading} aria-busy={loading}>
                {loading ? "Cargando…" : "Actualizar"}
              </button>

              <button className="btn danger" onClick={clearAll} disabled={loading || items.length === 0}>
                Vaciar
              </button>
            </div>

            <div className="controls">
              <div className="search">
                <span className="search-ico">⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en tus favoritos…"
                  spellCheck={false}
                />
                {query ? (
                  <button className="x" onClick={() => setQuery("")} type="button" aria-label="Limpiar">
                    ×
                  </button>
                ) : null}
              </div>

              <div className="sort">
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Ordenar">
                  <option value="recommended">Recomendado</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="title_asc">Nombre: A → Z</option>
                </select>
              </div>
            </div>

            {chips.length ? (
              <div className="chipbar" role="list">
                <button className={`chip ${chip === null ? "on" : ""}`} onClick={() => setChip(null)} type="button">
                  Todo
                </button>

                {chips.map((c) => (
                  <button
                    key={c}
                    className={`chip ${chip === c ? "on" : ""}`}
                    onClick={() => setChip(chip === c ? null : c)}
                    type="button"
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <div className="hero-note">
                {loading ? "Preparando tu colección…" : "Guarda productos para empezar tu selección."}
              </div>
            )}
          </div>

          <div className="hero-glow" />
        </section>

        {loading ? (
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card sk">
                <div className="sk-img" />
                <div className="sk-body">
                  <div className="sk-line w70" />
                  <div className="sk-line w55" />
                  <div className="sk-row">
                    <div className="sk-pill w25" />
                    <div className="sk-pill w35" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="empty-card">
              <div className="empty-badge">Tu selección está vacía</div>
              <div className="empty-h">Empieza a guardar lo mejor de JUSP</div>
              <div className="empty-p">
                Marca tus productos favoritos y vuelve aquí para verlos en una colección más limpia,
                rápida y premium.
              </div>

              <div className="empty-actions">
                <Link className="btn" href="/products">
                  Ver productos
                </Link>

                <Link className="btn ghost" href="/account">
                  Ir a mi cuenta
                </Link>
              </div>
            </div>
          </div>
        ) : emptyByFilter ? (
          <div className="empty small">
            <div className="empty-card small">
              <div className="empty-badge">Sin resultados</div>
              <div className="empty-h">No hay coincidencias con ese filtro</div>
              <div className="empty-p">Prueba otra búsqueda o vuelve a mostrar toda tu colección.</div>

              <div className="empty-actions">
                <button className="btn" onClick={() => setQuery("")} type="button">
                  Limpiar búsqueda
                </button>

                <button className="btn ghost" onClick={() => setChip(null)} type="button">
                  Mostrar todo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid enter">
            {filtered.map((p, idx) => {
              const title = p.title || "Producto";
              const price = typeof p.price === "number" ? p.price : null;
              const chipsLocal: string[] = [];
              if (p.brand) chipsLocal.push(String(p.brand));
              if (p.size) chipsLocal.push(`Talla ${p.size}`);
              if (p.color) chipsLocal.push(String(p.color));

              return (
                <Link
                  key={p.id}
                  href={productHrefFrom(p)}
                  className="card card-link"
                  style={{ animationDelay: `${Math.min(idx * 16, 180)}ms` }}
                >
                  <div className="img">
                    <FavoriteCardImage item={p} title={title} />

                    <div className="topline">
                      {price !== null ? (
                        <span className="tag price">${safeMoneyCOP(price)}</span>
                      ) : (
                        <span className="tag soft">Favorito</span>
                      )}

                      <span className="tag mono">{compactId(p.id)}</span>
                    </div>
                  </div>

                  <div className="body">
                    <div className="t">{title}</div>

                    <div className="chips">
                      {chipsLocal.length ? (
                        chipsLocal.slice(0, 3).map((c) => (
                          <span key={c} className="chip static">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="chip soft static">Guardado</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>

      <style jsx>{`
        :global(html) {
          scroll-behavior: smooth;
        }

        .fv-root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 38px;
          background:
            radial-gradient(920px 380px at 12% 0%, rgba(255, 214, 0, 0.11), transparent 58%),
            radial-gradient(980px 520px at 100% 10%, rgba(0, 0, 0, 0.04), transparent 60%),
            linear-gradient(180deg, #f7f7f7 0%, #f0f0f0 100%);
          min-height: 100vh;
        }

        .fv-wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(247, 247, 247, 0.95));
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.09);
          padding: 24px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
          gap: 18px;
          transform: translateY(10px);
          opacity: 0;
          animation: heroIn 420ms ease forwards;
        }

        .hero.isLoading {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes heroIn {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .hero-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(720px 320px at 0% 0%, rgba(255, 214, 0, 0.2), transparent 58%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent 40%);
          opacity: 0.8;
        }

        .hero-copy,
        .hero-side {
          position: relative;
          z-index: 1;
        }

        .kicker {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.16em;
          color: rgba(0, 0, 0, 0.52);
        }

        .title {
          margin: 8px 0 8px;
          font-size: 40px;
          line-height: 0.95;
          font-weight: 1000;
          letter-spacing: -0.045em;
          color: #111;
        }

        .sub {
          margin: 0;
          max-width: 640px;
          font-size: 14px;
          line-height: 1.72;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.7);
        }

        .stats {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .stat {
          border-radius: 22px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        .stat-main {
          background: linear-gradient(180deg, rgba(255, 245, 196, 0.76), rgba(255, 255, 255, 0.88));
        }

        .stat-l {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.52);
        }

        .stat-v {
          margin-top: 8px;
          font-size: 24px;
          line-height: 1;
          font-weight: 1000;
          letter-spacing: -0.04em;
          color: #111;
          word-break: break-word;
        }

        .hero-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 14px;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .controls {
          display: grid;
          grid-template-columns: 1fr 230px;
          gap: 10px;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 48px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.9);
          padding: 0 14px;
        }

        .search-ico {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.45);
        }

        .search input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: #111;
          font-size: 13px;
          font-weight: 900;
        }

        .x {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          border: 0;
          background: rgba(0, 0, 0, 0.06);
          color: #111;
          cursor: pointer;
          font-weight: 950;
        }

        .sort select {
          width: 100%;
          min-height: 48px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.9);
          padding: 0 14px;
          outline: none;
          color: #111;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .chipbar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .hero-note {
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.58);
          text-align: right;
        }

        .grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .card {
          text-align: left;
          padding: 0;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(246, 246, 246, 0.95));
          box-shadow: 0 22px 64px rgba(0, 0, 0, 0.08);
          transform: translateY(10px);
          opacity: 0;
          animation: pop 360ms ease forwards;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .card-link {
          display: block;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 84px rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 0, 0, 0.12);
        }

        @keyframes pop {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .img {
          position: relative;
          overflow: hidden;
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.035), rgba(0, 0, 0, 0.02));
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .img img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
          display: block;
          transition: transform 240ms ease;
        }

        .card:hover .img img {
          transform: scale(1.03);
        }

        .topline {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          border-radius: 999px;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.9);
          color: rgba(0, 0, 0, 0.78);
          border: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(8px);
        }

        .tag.price {
          background: rgba(17, 17, 17, 0.92);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.12);
        }

        .tag.soft {
          background: rgba(255, 214, 0, 0.62);
          color: #111;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
            monospace;
          font-weight: 950;
        }

        .noimg {
          height: 100%;
          width: 100%;
          display: grid;
          place-items: center;
          gap: 8px;
          color: rgba(0, 0, 0, 0.56);
          font-weight: 900;
        }

        .noimg-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        .body {
          display: grid;
          gap: 10px;
          padding: 14px;
        }

        .t {
          font-size: 15px;
          line-height: 1.3;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          border-radius: 999px;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.78);
          white-space: nowrap;
          cursor: pointer;
          transition: transform 120ms ease;
        }

        .chip:active {
          transform: scale(0.98);
        }

        .chip.static {
          cursor: default;
        }

        .chip.soft {
          background: rgba(255, 214, 0, 0.45);
          color: #111;
        }

        .chip.on {
          background: rgba(17, 17, 17, 0.94);
          border-color: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 16px;
          border-radius: 999px;
          border: 0;
          cursor: pointer;
          text-decoration: none;
          line-height: 1;
          font-size: 13px;
          font-weight: 950;
          background: #111;
          color: #fff;
          transition: transform 140ms ease, opacity 140ms ease, background 140ms ease;
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .btn.ghost {
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.12);
        }

        .btn.ghost:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .btn.danger {
          background: rgba(17, 17, 17, 0.94);
        }

        .btn.danger:hover {
          background: rgba(239, 68, 68, 0.94);
        }

        .empty {
          margin-top: 18px;
          min-height: 52vh;
          display: grid;
          place-items: center;
        }

        .empty.small {
          min-height: 42vh;
        }

        .empty-card {
          width: 100%;
          max-width: 700px;
          border-radius: 30px;
          padding: 26px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 246, 246, 0.96));
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.1);
        }

        .empty-card.small {
          max-width: 620px;
        }

        .empty-badge {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          border-radius: 999px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 950;
          background: rgba(255, 214, 0, 0.58);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.12);
        }

        .empty-h {
          margin-top: 14px;
          font-size: 30px;
          line-height: 1.04;
          font-weight: 1000;
          letter-spacing: -0.045em;
          color: #111;
        }

        .empty-p {
          margin-top: 10px;
          max-width: 560px;
          font-size: 14px;
          line-height: 1.72;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.7);
        }

        .empty-actions {
          margin-top: 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .toast {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 90;
          border-radius: 999px;
          padding: 10px 12px;
          background: rgba(17, 17, 17, 0.94);
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.25);
        }

        .sk {
          opacity: 1;
          transform: none;
          animation: none;
          cursor: default;
        }

        .sk-img {
          height: 250px;
          background: rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
        }

        .sk-body {
          padding: 14px;
          display: grid;
          gap: 10px;
        }

        .sk-line,
        .sk-pill {
          position: relative;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 999px;
        }

        .sk-line {
          height: 12px;
        }

        .sk-pill {
          height: 26px;
        }

        .sk-row {
          display: flex;
          gap: 10px;
        }

        .sk-img::after,
        .sk-line::after,
        .sk-pill::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
          animation: shimmer 1.2s infinite;
        }

        @keyframes shimmer {
          to {
            transform: translateX(100%);
          }
        }

        .w25 {
          width: 25%;
        }

        .w35 {
          width: 35%;
        }

        .w55 {
          width: 55%;
        }

        .w70 {
          width: 70%;
        }

        @media (max-width: 1100px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .actions,
          .chipbar,
          .hero-note {
            justify-content: flex-start;
            text-align: left;
          }

          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .controls {
            grid-template-columns: 1fr;
          }

          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .title {
            font-size: 34px;
          }
        }

        @media (max-width: 560px) {
          .stats {
            grid-template-columns: 1fr;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .hero,
          .empty-card {
            border-radius: 24px;
          }

          .title {
            font-size: 30px;
          }

          .empty-h {
            font-size: 24px;
          }

          .img,
          .sk-img {
            height: 230px;
            padding: 14px;
          }
        }
      `}</style>
    </main>
  );
}