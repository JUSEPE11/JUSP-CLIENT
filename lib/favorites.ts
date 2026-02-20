// lib/favorites.ts
"use client";

export type FavoriteItem = {
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

const KEYS_CANDIDATES = ["jusp_favorites", "favorites", "wishlist", "jusp_wishlist"] as const;
const DEFAULT_KEY = "jusp_favorites";
const FAVORITES_EVENT = "jusp:favorites";

/** -------------------------
 * Safe helpers
 * ------------------------ */
function safeStr(v: unknown, max = 2000): string {
  const s = typeof v === "string" ? v : "";
  return s.length > max ? s.slice(0, max) : s;
}

function safeNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function tryParseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function nowISO() {
  try {
    return new Date().toISOString();
  } catch {
    return null;
  }
}

function normalizeOne(input: any): FavoriteItem | null {
  if (!input) return null;

  const id =
    safeStr(input.id, 160).trim() ||
    safeStr(input.product_id, 160).trim() ||
    safeStr(input.sku, 160).trim() ||
    safeStr(input.slug, 160).trim();

  if (!id) return null;

  const title =
    safeStr(input.title, 220).trim() ||
    safeStr(input.name, 220).trim() ||
    safeStr(input.product_title, 220).trim() ||
    "Producto";

  const price =
    safeNum(input.price) ??
    safeNum(input.amount) ??
    safeNum(input.sale_price) ??
    safeNum(input.retail_price) ??
    safeNum(input.value) ??
    null;

  const image =
    safeStr(input.image, 1400).trim() ||
    safeStr(input.img, 1400).trim() ||
    safeStr(input.thumbnail, 1400).trim() ||
    safeStr(input.cover, 1400).trim() ||
    null;

  const brand = safeStr(input.brand, 120).trim() || safeStr(input.marca, 120).trim() || null;

  const size =
    safeStr(input.size, 60).trim() ||
    safeStr(input.talla, 60).trim() ||
    (Array.isArray(input.sizes) && input.sizes[0] ? safeStr(input.sizes[0], 60).trim() : "") ||
    null;

  const color =
    safeStr(input.color, 60).trim() ||
    safeStr(input.colour, 60).trim() ||
    safeStr(input.colorway, 60).trim() ||
    (Array.isArray(input.colors) && input.colors[0] ? safeStr(input.colors[0], 60).trim() : "") ||
    null;

  const href =
    safeStr(input.href, 600).trim() ||
    safeStr(input.url, 600).trim() ||
    safeStr(input.link, 600).trim() ||
    (id ? `/products/${encodeURIComponent(id)}` : "/products");

  const createdAt =
    safeStr(input.createdAt, 60).trim() ||
    safeStr(input.created_at, 60).trim() ||
    safeStr(input.savedAt, 60).trim() ||
    null;

  return {
    id,
    title,
    price,
    image,
    brand,
    size: size || null,
    color: color || null,
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
      null;
    if (arr) return normalizeList(arr);
  }

  if (!Array.isArray(input)) {
    const one = normalizeOne(input as any);
    return one ? [one] : [];
  }

  for (const raw of input as any[]) {
    const one = normalizeOne(raw);
    if (!one) continue;
    if (!out.some((x) => x.id === one.id)) out.push(one);
  }

  return out;
}

function pickExistingKey(): string {
  if (typeof window === "undefined") return DEFAULT_KEY;

  for (const k of KEYS_CANDIDATES) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    // Si existe y parsea o tiene algo, lo usamos para no fragmentar
    const parsed = tryParseJSON<any>(raw);
    if (parsed !== null) return k;
    if (raw.trim()) return k;
  }

  return DEFAULT_KEY;
}

function readAllFromKey(key: string): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];

  const parsed = tryParseJSON<any>(raw);
  if (parsed !== null) return normalizeList(parsed);

  const trimmed = raw.trim();
  if (trimmed.includes(",")) {
    const arr = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    return normalizeList(arr);
  }

  return normalizeList(trimmed);
}

function writeAllToKey(key: string, items: FavoriteItem[]) {
  if (typeof window === "undefined") return;

  const payload = items.map((x) => ({
    id: x.id,
    title: x.title,
    price: x.price ?? null,
    image: x.image ?? null,
    brand: x.brand ?? null,
    size: x.size ?? null,
    color: x.color ?? null,
    href: x.href ?? null,
    createdAt: x.createdAt ?? null,
  }));

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {}

  // ✅ actualiza UI misma pestaña (tu /favorites ya lo escucha)
  try {
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {}
}

/** -------------------------
 * Public API
 * ------------------------ */
export function getFavorites(): FavoriteItem[] {
  const key = pickExistingKey();
  return readAllFromKey(key);
}

export function isFavorite(id: string): boolean {
  const key = pickExistingKey();
  const list = readAllFromKey(key);
  return list.some((x) => String(x.id) === String(id));
}

/**
 * toggleFavorite(product)
 * - Si existe -> lo quita
 * - Si no existe -> lo agrega con snapshot FULL (price,image,brand,size,color,href)
 * - Si existe y llega info nueva -> se puede usar updateFavorite(...) (ver abajo)
 */
export function toggleFavorite(input: Partial<FavoriteItem> & { id: string; title?: string }): {
  ok: true;
  key: string;
  added: boolean;
  removed: boolean;
  items: FavoriteItem[];
} {
  const key = pickExistingKey();

  const list = readAllFromKey(key);

  const normalized = normalizeOne({
    ...input,
    id: safeStr(input.id, 160).trim(),
    title: safeStr(input.title ?? "", 220).trim() || "Producto",
    createdAt: (input as any)?.createdAt ?? nowISO(),
  });

  if (!normalized) {
    // no rompemos el flujo
    return { ok: true, key, added: false, removed: false, items: list };
  }

  const idx = list.findIndex((x) => String(x.id) === String(normalized.id));

  if (idx >= 0) {
    // remove
    const next = list.filter((x) => String(x.id) !== String(normalized.id));
    writeAllToKey(key, next);
    return { ok: true, key, added: false, removed: true, items: next };
  }

  // add (FULL)
  const next = [normalized, ...list];
  writeAllToKey(key, next);
  return { ok: true, key, added: true, removed: false, items: next };
}

/**
 * updateFavorite(product)
 * - No toggles
 * - Solo "enriquece" campos si ya existe (o lo crea si no existe)
 * - Útil cuando abres detalle y ahora sí tienes image/price/brand/size/color real
 */
export function upsertFavorite(input: Partial<FavoriteItem> & { id: string; title?: string }): {
  ok: true;
  key: string;
  items: FavoriteItem[];
} {
  const key = pickExistingKey();
  const list = readAllFromKey(key);

  const normalized = normalizeOne({
    ...input,
    id: safeStr(input.id, 160).trim(),
    title: safeStr(input.title ?? "", 220).trim() || "Producto",
    createdAt: (input as any)?.createdAt ?? nowISO(),
  });

  if (!normalized) return { ok: true, key, items: list };

  const idx = list.findIndex((x) => String(x.id) === String(normalized.id));

  if (idx >= 0) {
    const prev = list[idx];
    // merge: lo nuevo gana si trae valor, pero no borra lo viejo con null
    const merged: FavoriteItem = {
      ...prev,
      title: normalized.title || prev.title,
      price: normalized.price ?? prev.price ?? null,
      image: normalized.image ?? prev.image ?? null,
      brand: normalized.brand ?? prev.brand ?? null,
      size: normalized.size ?? prev.size ?? null,
      color: normalized.color ?? prev.color ?? null,
      href: normalized.href ?? prev.href ?? null,
      createdAt: prev.createdAt ?? normalized.createdAt ?? null,
    };

    const next = [...list];
    next[idx] = merged;
    writeAllToKey(key, next);
    return { ok: true, key, items: next };
  }

  const next = [normalized, ...list];
  writeAllToKey(key, next);
  return { ok: true, key, items: next };
}