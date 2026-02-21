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

type State = {
  cart: CartItem[];
  favorites: string[];
  ui: {
    panel: "none" | "cart" | "favorites";
  };
};

type StoreShape = {
  // ✅ Backward compatible: tu app vieja usa `state.*`
  state: State;

  // ✅ Derivados (tu Header los usa)
  cartCount: number;
  cartTotal: number;

  // ✅ API igual a la anterior
  isFav: (id: string) => boolean;
  toggleFav: (id: string) => void;

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

export const useStore = create<StoreShape>((set, get) => ({
  state: initialState,
  cartCount: 0,
  cartTotal: 0,

  isFav: (id) => get().state.favorites.includes(id),

  toggleFav: (id) => {
    const s = get().state;
    const exists = s.favorites.includes(id);
    const favorites = exists ? s.favorites.filter((x) => x !== id) : [...s.favorites, id];
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

/**
 * ✅ StoreProvider “compat”:
 * Tu app vieja probablemente envuelve con <StoreProvider>.
 * En Zustand NO es necesario, pero lo dejamos para no romper nada.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  // ✅ Hydrate 1 sola vez desde localStorage (solo client)
  useEffect(() => {
    const data = safeParse(localStorage.getItem(STORAGE_KEY));
    if (data && typeof data === "object") {
      const cart = Array.isArray((data as any).cart) ? (data as any).cart : [];
      const favorites = Array.isArray((data as any).favorites) ? (data as any).favorites : [];
      const uiPanel =
        (data as any)?.ui?.panel === "cart" || (data as any)?.ui?.panel === "favorites"
          ? (data as any).ui.panel
          : "none";

      useStore.setState({
        state: { cart, favorites, ui: { panel: uiPanel } },
        cartCount: calcCount(cart),
        cartTotal: calcTotal(cart),
      });
    }
  }, []);

  // ✅ Persist automático: guarda SOLO lo necesario
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
    });
    return () => unsub();
  }, []);

  return <>{children}</>;
}