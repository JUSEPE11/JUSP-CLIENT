import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionPayload = {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
};

type CouponRow = {
  id?: string | null;
  code?: string | null;
  title?: string | null;
  description?: string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  email?: string | null;
  user_id?: string | null;
};

function formatDate(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "Sin fecha";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MisCuponesPage() {
  const store = await cookies();
  const token = store.get(COOKIE_AT)?.value;

  if (!token) redirect("/login");

  let decoded: SessionPayload;
  try {
    decoded = await verifyAccessToken(token);
  } catch {
    redirect("/login");
  }

  const userId = String(decoded?.sub || decoded?.userId || decoded?.id || "").trim();
  const email = String(decoded?.email || "").trim().toLowerCase();
  if (!userId && !email) redirect("/login");

  const admin = supabaseAdmin();
  let coupons: CouponRow[] = [];

  try {
    let query = admin
      .from("user_coupons")
      .select("id,code,title,description,discount_type,discount_value,expires_at,is_active,email,user_id")
      .order("expires_at", { ascending: true });

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("email", email);
    }

    const { data } = await query;
    coupons = Array.isArray(data) ? (data as CouponRow[]) : [];
  } catch {
    coupons = [];
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "calc(var(--jusp-header-h, 64px) + 28px) 16px 72px",
        background: "#f6f6f3",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 1000,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.52)",
              }}
            >
              Mi cuenta
            </div>
            <h1 style={{ margin: "10px 0 0", fontSize: 38, lineHeight: 1, fontWeight: 1000 }}>
              Mis cupones
            </h1>
            <p style={{ marginTop: 12, maxWidth: 620, fontSize: 15, lineHeight: 1.7, color: "rgba(0,0,0,0.66)" }}>
              Revisa aquí tus beneficios activos para aplicarlos más rápido cuando compres.
            </p>
          </div>

          <Link
            href="/account"
            style={{
              alignSelf: "start",
              textDecoration: "none",
              color: "#111",
              fontWeight: 900,
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.10)",
              padding: "12px 18px",
              background: "#fff",
            }}
          >
            Volver a mi cuenta
          </Link>
        </div>

        <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
          {coupons.length ? (
            coupons.map((coupon) => (
              <article
                key={String(coupon?.id || coupon?.code)}
                style={{
                  borderRadius: 24,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  padding: 20,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,0,0,0.48)" }}>
                      Cupón
                    </div>
                    <div style={{ marginTop: 8, fontSize: 28, fontWeight: 1000 }}>
                      {String(coupon?.code || "JUSP")}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 15, fontWeight: 900 }}>
                      {String(coupon?.title || "Beneficio disponible")}
                    </div>
                    {coupon?.description ? (
                      <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "rgba(0,0,0,0.66)" }}>
                        {String(coupon.description)}
                      </p>
                    ) : null}
                  </div>

                  <div style={{ minWidth: 220, display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#166534" }}>
                      {coupon?.discount_type === "percentage"
                        ? `${Number(coupon?.discount_value || 0)}% OFF`
                        : `$${Number(coupon?.discount_value || 0).toLocaleString("es-CO")} OFF`}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(0,0,0,0.64)" }}>
                      Vence: {formatDate(coupon?.expires_at)}
                    </div>
                    <div style={{ fontSize: 13, color: coupon?.is_active === false ? "#991b1b" : "#166534", fontWeight: 800 }}>
                      {coupon?.is_active === false ? "No disponible" : "Disponible"}
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div
              style={{
                borderRadius: 24,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                padding: 24,
                boxShadow: "0 16px 40px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 1000 }}>Todavía no tienes cupones activos.</div>
              <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "rgba(0,0,0,0.66)" }}>
                Cuando tengas beneficios disponibles, aparecerán aquí con su código y vencimiento.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
