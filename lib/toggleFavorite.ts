// lib/toggleFavorite.ts
// PRO MAX: Fuente de verdad única para favoritos en localStorage
// Key estable: "jusp_favorites" (coincide con tu pantalla /favorites)

export const JUSP_FAV_KEY = "jusp_favorites";

export type JuspFavorite = {
  id: string;
  title: string;
  price: number | null;
  image: string | null;
  brand: string | null;
  size: string | null;
  color: string | null;
  href: string | null;
  createdAt: string; // ISO
};

type FavoriteVariantLike = {
  price?: number | string | null;
  color?: string | null;
  size?: string | null;
};

function safeStr(v: unknown, max = 1400) {
  const s = typeof v === "string" ? v : "";
  return s.length > max ? s.slice(0, max) : s;
}

function safeNum(v: unknown) {
  if (v == null) return null;

  if (typeof v === "number") {
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  if (typeof v === "string") {
    const raw = v.trim();
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

function normalizeId(raw: unknown) {
  const s = safeStr(raw, 200).trim();
  return s;
}

function safeFirstString(arr: unknown, maxLen: number) {
  if (!Array.isArray(arr)) return null;
  for (const x of arr) {
    const s = safeStr(x, maxLen).trim();
    if (s) return s;
  }
  return null;
}

function safeFirstImage(arr: unknown, maxLen = 1400) {
  if (!Array.isArray(arr)) return null;
  for (const x of arr) {
    const s = safeStr(x, maxLen).trim();
    if (s) return s;
  }
  return null;
}

function minPriceFromVariants(variants: unknown): number | null {
  if (!Array.isArray(variants) || !variants.length) return null;

  const prices = variants
    .map((v) => safeNum((v as FavoriteVariantLike)?.price))
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);

  if (!prices.length) return null;
  return Math.min(...prices);
}

function firstColorFromVariants(variants: unknown): string | null {
  if (!Array.isArray(variants)) return null;

  for (const v of variants) {
    const color = safeStr((v as FavoriteVariantLike)?.color ?? "", 60).trim();
    if (color) return color;
  }

  return null;
}

function firstSizeFromVariants(variants: unknown): string | null {
  if (!Array.isArray(variants)) return null;

  for (const v of variants) {
    const size = safeStr((v as FavoriteVariantLike)?.size ?? "", 60).trim();
    if (size) return size;
  }

  return null;
}

function resolveFavoritePrice(input: {
  price?: number | string | null;
  variants?: Array<{ price?: number | string | null }> | null;
}) {
  return safeNum(input.price) ?? minPriceFromVariants(input.variants) ?? null;
}

function readRaw(): unknown {
  try {
    const raw = window.localStorage.getItem(JUSP_FAV_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function readFavorites(): JuspFavorite[] {
  if (typeof window === "undefined") return [];
  const parsed = readRaw();
  if (!Array.isArray(parsed)) return [];

  const out: JuspFavorite[] = [];
  for (const it of parsed) {
    if (!it || typeof it !== "object") continue;
    const r = it as any;

    const id = normalizeId(r.id);
    if (!id) continue;

    out.push({
      id,
      title: safeStr(r.title ?? "Producto", 220).trim() || "Producto",
      price: resolveFavoritePrice({
        price: r.price,
        variants: r.variants,
      }),
      image:
        safeStr(r.image ?? "", 1400).trim() ||
        safeFirstImage(r.images, 1400) ||
        null,
      brand: safeStr(r.brand ?? "", 120).trim() || null,
      size:
        safeStr(r.size ?? "", 60).trim() ||
        safeFirstString(r.sizes, 60) ||
        firstSizeFromVariants(r.variants) ||
        null,
      color:
        safeStr(r.color ?? "", 60).trim() ||
        safeFirstString(r.colors, 60) ||
        firstColorFromVariants(r.variants) ||
        null,
      href: safeStr(r.href ?? "", 600).trim() || `/product/${encodeURIComponent(id)}`,
      createdAt: safeStr(r.createdAt ?? "", 80).trim() || new Date().toISOString(),
    });
  }
  return out;
}

export function writeFavorites(list: JuspFavorite[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(JUSP_FAV_KEY, JSON.stringify(list));
  } catch {}

  try {
    window.dispatchEvent(new Event("jusp:favorites"));
  } catch {}
}

export function isFavorite(id: string) {
  if (typeof window === "undefined") return false;
  const sid = normalizeId(id);
  if (!sid) return false;
  return readFavorites().some((x) => String(x.id) === sid);
}

export function clearFavorites() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(JUSP_FAV_KEY);
  } catch {}

  try {
    window.dispatchEvent(new Event("jusp:favorites"));
  } catch {}
}

export function toggleFavorite(input: {
  id: string;
  title?: string | null;
  price?: number | string | null;
  image?: string | null;
  images?: string[] | null;
  brand?: string | null;

  size?: string | null;
  color?: string | null;

  sizes?: string[] | null;
  colors?: string[] | null;

  variants?: Array<{
    price?: number | string | null;
    color?: string | null;
    size?: string | null;
  }> | null;

  href?: string | null;
}): { ok: boolean; added: boolean; count: number } {
  if (typeof window === "undefined") return { ok: false, added: false, count: 0 };

  const id = normalizeId(input.id);
  if (!id) return { ok: false, added: false, count: 0 };

  const list = readFavorites();
  const exists = list.some((x) => String(x.id) === id);

  if (exists) {
    const next = list.filter((x) => String(x.id) !== id);
    writeFavorites(next);
    return { ok: true, added: false, count: next.length };
  }

  const pickedSize =
    safeStr(input.size ?? "", 60).trim() ||
    safeFirstString(input.sizes, 60) ||
    firstSizeFromVariants(input.variants) ||
    null;

  const pickedColor =
    safeStr(input.color ?? "", 60).trim() ||
    safeFirstString(input.colors, 60) ||
    firstColorFromVariants(input.variants) ||
    null;

  const resolvedPrice = resolveFavoritePrice({
    price: input.price,
    variants: input.variants,
  });

  const resolvedImage =
    safeStr(input.image ?? "", 1400).trim() ||
    safeFirstImage(input.images, 1400) ||
    null;

  const fav: JuspFavorite = {
    id,
    title: safeStr(input.title ?? "Producto", 220).trim() || "Producto",
    price: resolvedPrice,
    image: resolvedImage,
    brand: safeStr(input.brand ?? "", 120).trim() || null,
    size: pickedSize,
    color: pickedColor,
    href: safeStr(input.href ?? "", 600).trim() || `/product/${encodeURIComponent(id)}`,
    createdAt: new Date().toISOString(),
  };

  const next = [fav, ...list];
  writeFavorites(next);
  return { ok: true, added: true, count: next.length };
}

export function updateFavorite(
  id: string,
  patch: Partial<
    Pick<JuspFavorite, "title" | "price" | "image" | "brand" | "size" | "color" | "href">
  > & {
    images?: string[] | null;
    sizes?: string[] | null;
    colors?: string[] | null;
    variants?: Array<{
      price?: number | string | null;
      color?: string | null;
      size?: string | null;
    }> | null;
  }
): { ok: boolean; updated: boolean } {
  if (typeof window === "undefined") return { ok: false, updated: false };
  const sid = normalizeId(id);
  if (!sid) return { ok: false, updated: false };

  const list = readFavorites();
  const idx = list.findIndex((x) => String(x.id) === sid);
  if (idx < 0) return { ok: true, updated: false };

  const cur = list[idx];

  const resolvedPrice =
    patch.price !== undefined || patch.variants !== undefined
      ? resolveFavoritePrice({
          price: patch.price,
          variants: patch.variants,
        })
      : cur.price;

  const resolvedImage =
    patch.image !== undefined || patch.images !== undefined
      ? safeStr(patch.image ?? "", 1400).trim() || safeFirstImage(patch.images, 1400) || null
      : cur.image;

  const resolvedSize =
    patch.size !== undefined || patch.sizes !== undefined || patch.variants !== undefined
      ? safeStr(patch.size ?? "", 60).trim() ||
        safeFirstString(patch.sizes, 60) ||
        firstSizeFromVariants(patch.variants) ||
        null
      : cur.size;

  const resolvedColor =
    patch.color !== undefined || patch.colors !== undefined || patch.variants !== undefined
      ? safeStr(patch.color ?? "", 60).trim() ||
        safeFirstString(patch.colors, 60) ||
        firstColorFromVariants(patch.variants) ||
        null
      : cur.color;

  const nextItem: JuspFavorite = {
    ...cur,
    title: patch.title !== undefined ? safeStr(patch.title ?? "", 220).trim() || "Producto" : cur.title,
    price: resolvedPrice,
    image: resolvedImage,
    brand: patch.brand !== undefined ? safeStr(patch.brand ?? "", 120).trim() || null : cur.brand,
    size: resolvedSize,
    color: resolvedColor,
    href: patch.href !== undefined ? safeStr(patch.href ?? "", 600).trim() || cur.href : cur.href,
  };

  const changed =
    nextItem.title !== cur.title ||
    nextItem.price !== cur.price ||
    nextItem.image !== cur.image ||
    nextItem.brand !== cur.brand ||
    nextItem.size !== cur.size ||
    nextItem.color !== cur.color ||
    nextItem.href !== cur.href;

  if (!changed) return { ok: true, updated: false };

  const next = [...list];
  next[idx] = nextItem;
  writeFavorites(next);
  return { ok: true, updated: true };
}