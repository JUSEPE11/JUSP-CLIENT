"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { Product } from "../../lib/products";

type CartItem = {
  id: string;
  qty: number;
  name: string;
  price: number;
  image?: string;
  color?: string | null;
  size?: string | null;
};

type FavoriteItem = {
  id: string;
  title: string;
  price: number | null;
  image?: string | null;
  href: string;
  createdAt: string;
};

type FavoriteStored = string | FavoriteItem;

type State = {
  cart: CartItem[];
  favorites: FavoriteStored[];
  ui: {
    panel: "none" | "cart" | "favorites";
  };
};

type StoreShape = {
  state: State;

  cartCount: number;
  cartTotal: number;

  isFav: (id: string) => boolean;
  toggleFav: (id: string, product?: Product) => void;

  openCart: () => void;
  openFavs: () => void;
  closePanel: () => void;

  addToCart: (product: Product, opts?: { color?: string | null; size?: string | null; qty?: number }) => void;
  incQty: (id: string, color?: string | null, size?: string | null) => void;
  decQty: (id: string, color?: string | null, size?: string | null) => void;
  removeFromCart: (id: string, color?: string | null, size?: string | null) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "jusp_store_v1";
const FAVORITES_LEGACY_KEY = "jusp_favorites";

const initialState: State = {
  cart: [],
  favorites: [],
  ui: { panel: "none" },
};

function keyOf(item: { id: string; color?: string | null; size?: string | null }) {
  return `${item.id}__c:${item.color ?? ""}__s:${item.size ?? ""}`;
}

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function calcCount(cart: CartItem[]) {
  return cart.reduce((a, it) => a + (it.qty || 0), 0);
}

function calcTotal(cart: CartItem[]) {
  return cart.reduce((a, it) => a + (it.qty || 0) * (it.price || 0), 0);
}

function normalizeImageFromProduct(product?: Product): string | null {
  if (!product) return null;

  const anyProduct = product as any;
  const direct =
    anyProduct?.images?.[0] ??
    anyProduct?.image ??
    anyProduct?.imageUrl ??
    anyProduct?.image_url ??
    null;

  return typeof direct === "string" && direct.trim() ? direct.trim() : null;
}

function normalizePriceFromProduct(product?: Product): number | null {
  if (!product) return null;
  const raw = (product as any)?.price;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function normalizeTitleFromProduct(product?: Product, id?: string): string {
  const title = (product as any)?.name;
  if (typeof title === "string" && title.trim()) return title.trim();
  return id || "Producto";
}

function normalizeHrefFromProduct(product?: Product, id?: string): string {
  const rawId =
    ((product as any)?.id && String((product as any).id).trim()) ||
    (id ? String(id).trim() : "") ||
    "";

  return rawId ? `/product/${encodeURIComponent(rawId)}` : "/products";
}

function favoriteIdOf(fav: FavoriteStored): string {
  if (typeof fav === "string") return fav;
  return fav?.id || "";
}

function isFavoriteObject(value: FavoriteStored): value is FavoriteItem {
  return typeof value === "object" && value !== null && typeof (value as any).id === "string";
}

function buildFavorite(id: string, product?: Product): FavoriteItem {
  return {
    id,
    title: normalizeTitleFromProduct(product, id),
    price: normalizePriceFromProduct(product),
    image: normalizeImageFromProduct(product),
    href: normalizeHrefFromProduct(product, id),
    createdAt: new Date().toISOString(),
  };
}

function normalizeFavoritesArray(input: unknown): FavoriteStored[] {
  if (!Array.isArray(input)) return [];

  const out: FavoriteStored[] = [];

  for (const item of input) {
    if (typeof item === "string" && item.trim()) {
      const id = item.trim();
      if (!out.some((x) => favoriteIdOf(x) === id)) out.push(id);
      continue;
    }

    if (item && typeof item === "object") {
      const id = typeof (item as any).id === "string" ? (item as any).id.trim() : "";
      if (!id) continue;

      const normalized: FavoriteItem = {
        id,
        title:
          typeof (item as any).title === "string" && (item as any).title.trim()
            ? (item as any).title.trim()
            : id,
        price:
          typeof (item as any).price === "number" && Number.isFinite((item as any).price)
            ? (item as any).price
            : null,
        image:
          typeof (item as any).image === "string" && (item as any).image.trim()
            ? (item as any).image.trim()
            : null,
        href:
          typeof (item as any).href === "string" && (item as any).href.trim()
            ? (item as any).href.trim()
            : `/product/${encodeURIComponent(id)}`,
        createdAt:
          typeof (item as any).createdAt === "string" && (item as any).createdAt.trim()
            ? (item as any).createdAt.trim()
            : new Date().toISOString(),
      };

      if (!out.some((x) => favoriteIdOf(x) === id)) out.push(normalized);
    }
  }

  return out;
}

function mergeFavoritesWithLegacy(storeFavorites: FavoriteStored[], legacyFavorites: unknown): FavoriteStored[] {
  const normalizedStore = normalizeFavoritesArray(storeFavorites);
  const normalizedLegacy = normalizeFavoritesArray(legacyFavorites);

  const out: FavoriteStored[] = [];

  for (const item of [...normalizedStore, ...normalizedLegacy]) {
    const id = favoriteIdOf(item);
    if (!id) continue;

    const existingIndex = out.findIndex((x) => favoriteIdOf(x) === id);
    if (existingIndex === -1) {
      out.push(item);
      continue;
    }

    const existing = out[existingIndex];

    if (typeof existing === "string" && isFavoriteObject(item)) {
      out[existingIndex] = item;
      continue;
    }

    if (isFavoriteObject(existing) && isFavoriteObject(item)) {
      out[existingIndex] = {
        ...existing,
        ...item,
        title: item.title || existing.title,
        price: item.price ?? existing.price ?? null,
        image: item.image ?? existing.image ?? null,
        href: item.href || existing.href,
        createdAt: existing.createdAt || item.createdAt,
      };
    }
  }

  return out;
}

function writeLegacyFavorites(favorites: FavoriteStored[]) {
  try {
    const payload = favorites.map((fav) => {
      if (typeof fav === "string") {
        return {
          id: fav,
          title: fav,
          price: null,
          image: null,
          href: `/product/${encodeURIComponent(fav)}`,
          createdAt: new Date().toISOString(),
        };
      }

      return {
        id: fav.id,
        title: fav.title,
        price: fav.price ?? null,
        image: fav.image ?? null,
        href: fav.href,
        createdAt: fav.createdAt,
      };
    });

    localStorage.setItem(FAVORITES_LEGACY_KEY, JSON.stringify(payload));
  } catch {}
}

export const useStore = create<StoreShape>((set, get) => ({
  state: initialState,
  cartCount: 0,
  cartTotal: 0,

  isFav: (id) => get().state.favorites.some((fav) => favoriteIdOf(fav) === id),

  toggleFav: (id, product) => {
    const s = get().state;
    const exists = s.favorites.some((fav) => favoriteIdOf(fav) === id);

    const favorites = exists
      ? s.favorites.filter((fav) => favoriteIdOf(fav) !== id)
      : [...s.favorites.filter((fav) => favoriteIdOf(fav) !== id), buildFavorite(id, product)];

    set({ state: { ...s, favorites } });
  },

  openCart: () => {
    const s = get().state;
    set({ state: { ...s, ui: { panel: "cart" } } });
  },

  openFavs: () => {
    const s = get().state;
    set({ state: { ...s, ui: { panel: "favorites" } } });
  },

  closePanel: () => {
    const s = get().state;
    set({ state: { ...s, ui: { panel: "none" } } });
  },

  addToCart: (product, opts) => {
    const s = get().state;

    const qty = opts?.qty ?? 1;
    const id = product.id;
    const color = opts?.color ?? null;
    const size = opts?.size ?? null;

    const newItem: CartItem = {
      id,
      qty,
      name: product.name ?? "Producto",
      price: product.price,
      image: (product as any).images?.[0] ?? (product as any).image ?? undefined,
      color,
      size,
    };

    const k = keyOf(newItem);
    const idx = s.cart.findIndex((it) => keyOf(it) === k);

    const cart =
      idx >= 0
        ? s.cart.map((it, i) => (i === idx ? { ...it, qty: it.qty + qty } : it))
        : [...s.cart, newItem];

    set({
      state: { ...s, cart, ui: { panel: "cart" } },
      cartCount: calcCount(cart),
      cartTotal: calcTotal(cart),
    });
  },

  incQty: (id, color, size) => {
    const s = get().state;
    const k = keyOf({ id, color: color ?? null, size: size ?? null });
    const cart = s.cart.map((it) => (keyOf(it) === k ? { ...it, qty: it.qty + 1 } : it));
    set({ state: { ...s, cart }, cartCount: calcCount(cart), cartTotal: calcTotal(cart) });
  },

  decQty: (id, color, size) => {
    const s = get().state;
    const k = keyOf({ id, color: color ?? null, size: size ?? null });
    const cart = s.cart
      .map((it) => (keyOf(it) === k ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
      .filter((it) => it.qty > 0);
    set({ state: { ...s, cart }, cartCount: calcCount(cart), cartTotal: calcTotal(cart) });
  },

  removeFromCart: (id, color, size) => {
    const s = get().state;
    const k = keyOf({ id, color: color ?? null, size: size ?? null });
    const cart = s.cart.filter((it) => keyOf(it) !== k);
    set({ state: { ...s, cart }, cartCount: calcCount(cart), cartTotal: calcTotal(cart) });
  },

  clearCart: () => {
    const s = get().state;
    const cart: CartItem[] = [];
    set({ state: { ...s, cart }, cartCount: 0, cartTotal: 0 });
  },
}));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const data = safeParse(localStorage.getItem(STORAGE_KEY));
    const legacyFavorites = safeParse(localStorage.getItem(FAVORITES_LEGACY_KEY));

    if (data && typeof data === "object") {
      const cart = Array.isArray((data as any).cart) ? (data as any).cart : [];
      const favoritesFromStore = Array.isArray((data as any).favorites) ? (data as any).favorites : [];
      const favorites = mergeFavoritesWithLegacy(favoritesFromStore, legacyFavorites);

      const uiPanel =
        (data as any)?.ui?.panel === "cart" || (data as any)?.ui?.panel === "favorites"
          ? (data as any).ui.panel
          : "none";

      useStore.setState({
        state: { cart, favorites, ui: { panel: uiPanel } },
        cartCount: calcCount(cart),
        cartTotal: calcTotal(cart),
      });

      writeLegacyFavorites(favorites);
      return;
    }

    const favoritesOnly = normalizeFavoritesArray(legacyFavorites);

    useStore.setState({
      state: { cart: [], favorites: favoritesOnly, ui: { panel: "none" } },
      cartCount: 0,
      cartTotal: 0,
    });

    writeLegacyFavorites(favoritesOnly);
  }, []);

  useEffect(() => {
    const unsub = useStore.subscribe((snap) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            cart: snap.state.cart,
            favorites: snap.state.favorites,
            ui: snap.state.ui,
          })
        );
      } catch {}

      writeLegacyFavorites(snap.state.favorites);
    });

    return () => unsub();
  }, []);

  return <>{children}</>;
}