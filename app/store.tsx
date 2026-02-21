// app/store.ts
"use client";

import { useEffect, useState } from "react";

type StoreState = {
  cartCount: number;
  openCart: () => void;
  setCartCount: (n: number) => void;
  addToCart: (qty?: number) => void;
  clearCart: () => void;
};

let _cartCount = 0;
const _subs = new Set<() => void>();

function emit() {
  for (const fn of _subs) fn();
}

function setCount(n: number) {
  _cartCount = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  emit();
}

// Evento global para abrir el carrito (no rompe nada si nadie lo escucha)
function openCart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("jusp:cart:open"));
}

export function useStore(): StoreState {
  const [cartCount, setCartCountState] = useState<number>(_cartCount);

  useEffect(() => {
    const sub = () => setCartCountState(_cartCount);
    _subs.add(sub);
    sub();
    return () => {
      _subs.delete(sub);
    };
  }, []);

  return {
    cartCount,
    openCart,
    setCartCount: setCount,
    addToCart: (qty = 1) => setCount(_cartCount + Math.max(1, Math.floor(qty))),
    clearCart: () => setCount(0),
  };
}