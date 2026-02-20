"use client";

import React from "react";
import { useStore } from "./store";

export default function MiniCartButton() {
  const { cartCount, openCart } = useStore();

  return (
    <>
      <button type="button" className="btn" onClick={openCart} aria-label="Abrir carrito">
        <span className="ico" aria-hidden="true">
          🛍️
        </span>
        {cartCount > 0 ? <span className="badge">{cartCount}</span> : null}
      </button>

      <style jsx>{`
        .btn {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 140ms ease, background 140ms ease;
        }
        .btn:hover {
          background: rgba(0, 0, 0, 0.06);
        }
        .btn:active {
          transform: scale(0.96);
        }
        .ico {
          font-size: 18px;
          transform: translateY(-1px);
        }
        .badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          font-size: 12px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </>
  );
}