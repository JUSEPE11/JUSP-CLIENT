"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
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

type Action =
  | { type: "INIT"; payload: Pick<State, "cart" | "favorites"> }
  | { type: "OPEN_PANEL"; panel: State["ui"]["panel"] }
  | { type: "CLOSE_PANEL" }
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "ADD_TO_CART"; product: Product; color?: string | null; size?: string | null; qty?: number }
  | { type: "INC_QTY"; id: string; color?: string | null; size?: string | null }
  | { type: "DEC_QTY"; id: string; color?: string | null; size?: string | null }
  | { type: "REMOVE_FROM_CART"; id: string; color?: string | null; size?: string | null }
  | { type: "CLEAR_CART" };

const STORAGE_KEY = "jusp_store_v1";

const initialState: State = {
  cart: [],
  favorites: [],
  ui: { panel: "none" },
};

function keyOf(item: { id: string; color?: string | null; size?: string | null }) {
  return `${item.id}__c:${item.color ?? ""}__s:${item.size ?? ""}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        cart: action.payload.cart ?? [],
        favorites: action.payload.favorites ?? [],
      };

    case "OPEN_PANEL":
      return { ...state, ui: { panel: action.panel } };

    case "CLOSE_PANEL":
      return { ...state, ui: { panel: "none" } };

    case "TOGGLE_FAVORITE": {
      const exists = state.favorites.includes(action.id);
      const favorites = exists ? state.favorites.filter((x) => x !== action.id) : [...state.favorites, action.id];
      return { ...state, favorites };
    }

    case "ADD_TO_CART": {
      const qty = action.qty ?? 1;
      const id = action.product.id;
      const color = action.color ?? null;
      const size = action.size ?? null;

      const newItem: CartItem = {
        id,
        qty,
        // ✅ FIX DEFINITIVO: Product.name puede venir string | undefined
        name: action.product.name ?? "Producto",
        price: action.product.price,
        image: (action.product as any).images?.[0] ?? (action.product as any).image ?? undefined,
        color,
        size,
      };

      const k = keyOf(newItem);
      const idx = state.cart.findIndex((it) => keyOf(it) === k);

      const cart =
        idx >= 0 ? state.cart.map((it, i) => (i === idx ? { ...it, qty: it.qty + qty } : it)) : [...state.cart, newItem];

      return { ...state, cart, ui: { panel: "cart" } };
    }

    case "INC_QTY": {
      const k = keyOf(action);
      const cart = state.cart.map((it) => (keyOf(it) === k ? { ...it, qty: it.qty + 1 } : it));
      return { ...state, cart };
    }

    case "DEC_QTY": {
      const k = keyOf(action);
      const cart = state.cart
        .map((it) => (keyOf(it) === k ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
        .filter((it) => it.qty > 0);
      return { ...state, cart };
    }

    case "REMOVE_FROM_CART": {
      const k = keyOf(action);
      const cart = state.cart.filter((it) => keyOf(it) !== k);
      return { ...state, cart };
    }

    case "CLEAR_CART":
      return { ...state, cart: [] };

    default:
      return state;
  }
}

type Store = {
  state: State;
  cartCount: number;
  cartTotal: number;

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

const StoreContext = createContext<Store | null>(null);

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const data = safeParse(localStorage.getItem(STORAGE_KEY));
    if (data && typeof data === "object") {
      dispatch({
        type: "INIT",
        payload: {
          cart: Array.isArray((data as any).cart) ? (data as any).cart : [],
          favorites: Array.isArray((data as any).favorites) ? (data as any).favorites : [],
        },
      });
    }
  }, []);

  useEffect(() => {
    const payload = { cart: state.cart, favorites: state.favorites };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [state.cart, state.favorites]);

  const cartCount = useMemo(() => state.cart.reduce((a, it) => a + it.qty, 0), [state.cart]);
  const cartTotal = useMemo(() => state.cart.reduce((a, it) => a + it.qty * it.price, 0), [state.cart]);

  const api: Store = useMemo(
    () => ({
      state,
      cartCount,
      cartTotal,

      isFav: (id) => state.favorites.includes(id),
      toggleFav: (id) => dispatch({ type: "TOGGLE_FAVORITE", id }),

      openCart: () => dispatch({ type: "OPEN_PANEL", panel: "cart" }),
      openFavs: () => dispatch({ type: "OPEN_PANEL", panel: "favorites" }),
      closePanel: () => dispatch({ type: "CLOSE_PANEL" }),

      addToCart: (product, opts) =>
        dispatch({
          type: "ADD_TO_CART",
          product,
          color: opts?.color ?? null,
          size: opts?.size ?? null,
          qty: opts?.qty ?? 1,
        }),

      incQty: (id, color, size) => dispatch({ type: "INC_QTY", id, color: color ?? null, size: size ?? null }),
      decQty: (id, color, size) => dispatch({ type: "DEC_QTY", id, color: color ?? null, size: size ?? null }),
      removeFromCart: (id, color, size) =>
        dispatch({ type: "REMOVE_FROM_CART", id, color: color ?? null, size: size ?? null }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
    }),
    [state, cartCount, cartTotal]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}