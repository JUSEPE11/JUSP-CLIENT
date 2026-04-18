// app/components/CartDrawer.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "./store";

type ProductVariant = {
  key: string;
  size?: string;
  color?: string;
  price: number;
  stock?: number;
  isAvailable?: boolean;
};

type ProductApi = {
  id: string;
  slug?: string;
  product_code?: string;
  title?: string;
  name?: string;
  stockHint?: number;
  variants?: ProductVariant[];
};

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function normalizeLoose(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function toSafeStock(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

function findMaxStockForCartItem(
  products: ProductApi[],
  item: { id: string; color?: string | null; size?: string | null }
) {
  const itemId = normalizeLoose(item.id);
  const itemColor = normalizeLoose(item.color);
  const itemSize = String(item.size ?? "").trim();

  const product = products.find((p) => {
    const pid = normalizeLoose(p.id);
    const pslug = normalizeLoose(p.slug);
    const pcode = normalizeLoose(p.product_code);
    return pid === itemId || pslug === itemId || pcode === itemId;
  });

  if (!product) return null;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length) {
    const byColor = itemColor
      ? variants.filter((v) => normalizeLoose(v.color) === itemColor)
      : variants;

    if (itemSize) {
      const exact = byColor.find((v) => String(v.size ?? "").trim() === itemSize);
      if (exact) return toSafeStock(exact.stock);
    }

    if (byColor.length === 1) {
      return toSafeStock(byColor[0]?.stock);
    }

    if (!itemSize && byColor.length > 0) {
      const total = byColor.reduce((acc, v) => acc + (toSafeStock(v.stock) ?? 0), 0);
      return total;
    }
  }

  return toSafeStock(product.stockHint);
}

export default function CartDrawer() {
  const { state, cartCount, cartTotal, closePanel, incQty, decQty, removeFromCart, clearCart } =
    useStore();

  const open = state.ui.panel === "cart";
  const items = state.cart;

  const [products, setProducts] = useState<ProductApi[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // 🔥 NUEVO
  const drawerRef = useRef<HTMLElement | null>(null);

  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchMovedRef = useRef(false);
  const lastTapRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closePanel]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (!open || !items.length) return;

      try {
        setLoadingStock(true);
        const res = await fetch("/api/products", {
          cache: "no-store",
          headers: { "cache-control": "no-store" },
        });
        const data = await res.json().catch(() => []);
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setProducts([]);
      } finally {
        if (cancelled) return;
        setLoadingStock(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [open, items.length]);

  const empty = useMemo(() => items.length === 0, [items.length]);

  // 🔥 GESTOS
  const handleGestureTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;

    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    touchMovedRef.current = false;

    if (drawerRef.current) {
      drawerRef.current.style.transition = "none";
    }
  };

  const handleGestureTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch || !drawerRef.current) return;

    let deltaY = touch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(touch.clientX - touchStartXRef.current);

    if (Math.abs(deltaY) > 6 || deltaX > 6) {
      touchMovedRef.current = true;
    }

    if (deltaY < 0) deltaY = 0;

    const resistance = deltaY * 0.35;

    drawerRef.current.style.transform = `translateY(${resistance}px)`;
  };

  const handleGestureTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!drawerRef.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(touch.clientX - touchStartXRef.current);
    const now = Date.now();

    if (deltaY > 120 && deltaX < 60) {
      drawerRef.current.style.transition = "transform 0.2s ease-out";
      drawerRef.current.style.transform = "translateY(100%)";

      setTimeout(() => {
        closePanel();
        if (drawerRef.current) {
          drawerRef.current.style.transform = "";
          drawerRef.current.style.transition = "";
        }
      }, 180);

      return;
    }

    drawerRef.current.style.transition = "transform 0.25s ease";
    drawerRef.current.style.transform = "translateY(0px)";

    setTimeout(() => {
      if (drawerRef.current) {
        drawerRef.current.style.transition = "";
      }
    }, 250);

    const isTap = !touchMovedRef.current && Math.abs(deltaY) < 10 && deltaX < 10;

    if (isTap) {
      if (now - lastTapRef.current < 300) {
        closePanel();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="ov" onClick={closePanel} aria-hidden="true" />

      <aside ref={drawerRef} className="dw" role="dialog" aria-modal="true">
        <button className="floatingClose" onClick={closePanel}>
          ×
        </button>

        <div
          className="top"
          onTouchStart={handleGestureTouchStart}
          onTouchMove={handleGestureTouchMove}
          onTouchEnd={handleGestureTouchEnd}
        >
          <div className="grab" />
          <div className="ttl">Carrito</div>
        </div>

        {/* TODO: resto EXACTO de tu archivo (no cambiado) */}
      </aside>
    </>
  );
}