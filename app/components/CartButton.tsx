"use client";

import React from "react";
import { useStore } from "./store";

export default function CartButton() {
  const { cartCount, openCart } = useStore();

  return (
    <>
      <button className="bag" type="button" onClick={openCart} aria-label="Abrir carrito">
        <span className="ico" aria-hidden="true">👜</span>
        {cartCount > 0 ? <span className="badge">{cartCount}</span> : null}
      </button>

      <style jsx>{`
        .bag {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.12);
          background: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 140ms ease, background 140ms ease;
        }
        .bag:hover { background: rgba(0,0,0,0.02); }
        .bag:active { transform: scale(0.98); }

        .ico {
          font-size: 18px;
          transform: translateY(-1px);
        }

        .badge{
          position:absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(17,17,17,0.92);
          color: rgba(255,255,255,0.95);
          font-weight: 950;
          font-size: 11px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        }
      `}</style>
    </>
  );
}