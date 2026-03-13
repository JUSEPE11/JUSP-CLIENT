"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/components/store";

type OrderRow = {
  id: string;
  status?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  payment_id?: string | null;
};

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

export default function SuccessClient() {
  const params = useSearchParams();
  const { clearCart } = useStore();

  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState<OrderRow | null>(null);

  const cleared = useRef(false);

  const reference = useMemo(() => {
    return params.get("reference") || "";
  }, [params]);

  async function fetchOrder() {
    if (!reference) return;

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?id=eq.${reference}&select=*`;

    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    const data = await res.json();

    if (!data?.length) {
      setStatus("pending");
      return;
    }

    const row = data[0];
    setOrder(row);

    if (row.status === "paid") {
      setStatus("approved");

      if (!cleared.current) {
        clearCart();
        cleared.current = true;
      }
    } else if (row.status === "pending") {
      setStatus("pending");
    } else {
      setStatus("declined");
    }
  }

  useEffect(() => {
    fetchOrder();
  }, []);

  return (
    <main style={{padding:40}}>

      {status === "loading" && <h1>Verificando pago...</h1>}

      {status === "approved" && (
        <>
          <h1>Pago aprobado</h1>
          <p>Total: ${moneyCOP(order?.total_amount || 0)}</p>
          <Link href="/products">Seguir comprando</Link>
        </>
      )}

      {status === "pending" && (
        <>
          <h1>Pago pendiente</h1>
          <p>Tu carrito sigue intacto.</p>
          <Link href="/checkout">Volver al checkout</Link>
        </>
      )}

      {status === "declined" && (
        <>
          <h1>Pago no aprobado</h1>
          <p>Los productos siguen en tu carrito.</p>
          <Link href="/checkout">Intentar nuevamente</Link>
        </>
      )}

    </main>
  );
}