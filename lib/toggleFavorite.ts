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

function safeStr(v: unknown, max = 1400) {
  const s = typeof v === "string" ? v : "";
  return s.length > max ? s.slice(0, max) : s;
}

function safeNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
      price: safeNum(r.price),
      image: safeStr(r.image ?? "", 1400).trim() || null,
      brand: safeStr(r.brand ?? "", 120).trim() || null,
      size: safeStr(r.size ?? "", 60).trim() || null,
      color: safeStr(r.color ?? "", 60).trim() || null,
      href: safeStr(r.href ?? "", 600).trim() || `/products/${encodeURIComponent(id)}`,
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

  // ✅ Micro-pulido #1: evento en la MISMA pestaña (storage no dispara en same-tab)
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

  // ✅ Micro-pulido #1: avisar a la UI
  try {
    window.dispatchEvent(new Event("jusp:favorites"));
  } catch {}
}

/**
 * ✅ toggleFavorite PRO MAX
 * - Si existe => elimina
 * - Si no existe => guarda el objeto completo (price/image/brand/size/color/href)
 * - Devuelve { ok, added, count }
 *
 * ✅ Micro-pulido #2:
 * - Si NO llega size/color pero llega sizes[]/colors[] => toma la primera opción
 */
export function toggleFavorite(input: {
  id: string;
  title?: string | null;
  price?: number | string | null;
  image?: string | null;
  brand?: string | null;

  // preferidos (si ya los tienes)
  size?: string | null;
  color?: string | null;

  // ✅ fallback PRO (si aún no hay selector real)
  sizes?: string[] | null;
  colors?: string[] | null;

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

  const pickedSize = safeStr(input.size ?? "", 60).trim() || safeFirstString(input.sizes, 60);
  const pickedColor = safeStr(input.color ?? "", 60).trim() || safeFirstString(input.colors, 60);

  const fav: JuspFavorite = {
    id,
    title: safeStr(input.title ?? "Producto", 220).trim() || "Producto",
    price: safeNum(input.price),
    image: safeStr(input.image ?? "", 1400).trim() || null,
    brand: safeStr(input.brand ?? "", 120).trim() || null,
    size: pickedSize || null,
    color: pickedColor || null,
    href: safeStr(input.href ?? "", 600).trim() || `/products/${encodeURIComponent(id)}`,
    createdAt: new Date().toISOString(),
  };

  const next = [fav, ...list];
  writeFavorites(next);
  return { ok: true, added: true, count: next.length };
}

// ✅ updateFavorite PRO MAX
// - Actualiza un favorito existente (sin toggle)
// - Ideal para: si el usuario cambia talla/color y ya está guardado
export function updateFavorite(
  id: string,
  patch: Partial<Pick<JuspFavorite, "title" | "price" | "image" | "brand" | "size" | "color" | "href">>
): { ok: boolean; updated: boolean } {
  if (typeof window === "undefined") return { ok: false, updated: false };
  const sid = normalizeId(id);
  if (!sid) return { ok: false, updated: false };

  const list = readFavorites();
  const idx = list.findIndex((x) => String(x.id) === sid);
  if (idx < 0) return { ok: true, updated: false };

  const cur = list[idx];

  const nextItem: JuspFavorite = {
    ...cur,
    title: patch.title !== undefined ? safeStr(patch.title ?? "", 220).trim() || "Producto" : cur.title,
    price: patch.price !== undefined ? safeNum(patch.price) : cur.price,
    image: patch.image !== undefined ? safeStr(patch.image ?? "", 1400).trim() || null : cur.image,
    brand: patch.brand !== undefined ? safeStr(patch.brand ?? "", 120).trim() || null : cur.brand,
    size: patch.size !== undefined ? safeStr(patch.size ?? "", 60).trim() || null : cur.size,
    color: patch.color !== undefined ? safeStr(patch.color ?? "", 60).trim() || null : cur.color,
    href: patch.href !== undefined ? safeStr(patch.href ?? "", 600).trim() || cur.href : cur.href,
    // createdAt se conserva (no lo tocamos)
  };

  // Evitar write si no cambió nada real
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