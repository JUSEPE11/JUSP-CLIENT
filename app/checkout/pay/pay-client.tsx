"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "../../components/store";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

const DRAFT_KEY = "jusp_checkout_draft_v1";
const CREATE_ORDER_ENDPOINT = "/api/orders/create";

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function PayClient() {
  const router = useRouter();
  const { state, cartTotal, clearCart } = useStore();

  const [method, setMethod] = useState<"card" | "pse" | "cash">("card");
  const [loading, setLoading] = useState(false);

  const [draft, setDraft] = useState<any>(null);

  // ✅ localStorage solo después de montar (evita "localStorage is not defined" en build)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      setDraft(safeParse(raw));
    } catch {
      setDraft(null);
    }
  }, []);

  const itemsCount = useMemo(
    () => state.cart.reduce((a, it) => a + it.qty, 0),
    [state.cart]
  );

  const total = useMemo(() => {
    const t = (draft?.totals?.total ?? cartTotal) || 0;
    return Number(t) || 0;
  }, [draft, cartTotal]);

  async function createRealOrder() {
    const now = Date.now();
    const reference = `JUSP-${now.toString(36).toUpperCase()}`;

    const customer = draft?.customer ?? {};
    const shipping = draft?.shipping ?? customer ?? {};

    const res = await fetch(CREATE_ORDER_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({
        reference,
        currency: "COP",
        customer: {
          fullName: String(customer?.fullName ?? shipping?.fullName ?? ""),
          email: String(customer?.email ?? shipping?.email ?? ""),
          documentType: String(customer?.documentType ?? shipping?.documentType ?? ""),
          documentNumber: String(customer?.documentNumber ?? shipping?.documentNumber ?? ""),
          phone: String(customer?.phone ?? shipping?.phone ?? ""),
        },
        shipping: {
          fullName: String(shipping?.fullName ?? customer?.fullName ?? ""),
          email: String(shipping?.email ?? customer?.email ?? ""),
          documentType: String(shipping?.documentType ?? customer?.documentType ?? ""),
          documentNumber: String(shipping?.documentNumber ?? customer?.documentNumber ?? ""),
          phone: String(shipping?.phone ?? customer?.phone ?? ""),
          city: String(shipping?.city ?? ""),
          region: String(shipping?.region ?? ""),
          addressLine1: String(shipping?.addressLine1 ?? ""),
          notes: String(shipping?.notes ?? ""),
          country: "CO",
        },
        items: draft?.items ?? state.cart,
        totals: draft?.totals ?? { subtotal: cartTotal, shipping: 0, total },
        payment: {
          method,
          status: "pending_placeholder",
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      throw new Error("Debes iniciar sesión para confirmar tu pedido.");
    }

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "No se pudo crear la orden real.");
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}

    clearCart();
    router.push(`/checkout/success?reference=${encodeURIComponent(data.order?.order_code || reference)}`);
  }

  return (
    <main className="root">
      <div className="wrap">
        <header className="head">
          <div>
            <div className="brand">JUSP</div>
            <h1 className="h1">Pago</h1>
            <p className="sub">Confirma tu pedido y lo creamos en el backend real.</p>
          </div>
          <div className="right">
            <Link className="back" href="/checkout">
              ← Volver
            </Link>
          </div>
        </header>

        <div className="grid">
          <section className="card">
            <div className="ct">Método de pago</div>

            <div className="opts">
              <button
                className={`opt ${method === "card" ? "on" : ""}`}
                onClick={() => setMethod("card")}
                type="button"
              >
                Tarjeta (placeholder)
              </button>
              <button
                className={`opt ${method === "pse" ? "on" : ""}`}
                onClick={() => setMethod("pse")}
                type="button"
              >
                PSE (placeholder)
              </button>
              <button
                className={`opt ${method === "cash" ? "on" : ""}`}
                onClick={() => setMethod("cash")}
                type="button"
              >
                Contraentrega (placeholder)
              </button>
            </div>

            <div className="box">
              <div className="b1">Esto es un paso PRO de prueba</div>
              <div className="b2">
                Este paso crea la orden real en tu backend, guarda el teléfono del cliente y deja lista la referencia para seguimiento.
              </div>
            </div>

            <button
              className={`pay ${loading ? "dis" : ""}`}
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  createRealOrder()
                    .catch((e: any) => {
                      alert(e?.message || "No se pudo confirmar el pedido.");
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }, 550);
              }}
              type="button"
            >
              Confirmar pedido
            </button>

            <div className="fine">
              {itemsCount} ítem{itemsCount === 1 ? "" : "s"} · Total{" "}
              <b>${moneyCOP(total)}</b>
            </div>
          </section>

          <aside className="card sticky">
            <div className="ct">Resumen</div>
            <div className="line">
              <span>Total</span>
              <b>${moneyCOP(total)}</b>
            </div>

            <div className="hr" />

            <div className="mini">
              <span className="dot" />
              Siguiente: conectamos pago real + creación de Order en tu backend (cuando tú digas).
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding: 18px 16px 44px;
          background: #fff;
          min-height: 100vh;
        }
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
        }
        .brand {
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
        }
        .h1 {
          margin: 10px 0 0;
          font-size: 56px;
          font-weight: 950;
          letter-spacing: -0.05em;
          line-height: 1.02;
          color: #111;
        }
        .sub {
          margin: 8px 0 0;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.6);
        }
        .back {
          text-decoration: none;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 999px;
          padding: 12px 14px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }

        .grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 18px;
          align-items: start;
        }

        .card {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          padding: 16px;
          background: #fff;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.06);
        }
        .sticky {
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 18px);
        }
        .ct {
          font-weight: 950;
          color: #111;
          font-size: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .opts {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }
        .opt {
          border-radius: 14px;
          padding: 12px 12px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          font-weight: 950;
          cursor: pointer;
          text-align: left;
        }
        .opt.on {
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .box {
          margin-top: 12px;
          border-radius: 16px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .b1 {
          font-weight: 950;
          color: #111;
        }
        .b2 {
          margin-top: 8px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          line-height: 1.35;
        }

        .pay {
          margin-top: 14px;
          width: 100%;
          border-radius: 999px;
          padding: 14px 14px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          cursor: pointer;
        }
        .pay.dis {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .fine {
          margin-top: 10px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
        }

        .line {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.72);
        }
        .line b {
          font-weight: 950;
          color: #111;
        }
        .hr {
          margin-top: 12px;
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
        }
        .mini {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          align-items: center;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.58);
          font-size: 12px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .sticky {
            position: relative;
            top: 0;
          }
          .h1 {
            font-size: 44px;
          }
        }
      `}</style>
    </main>
  );
}
