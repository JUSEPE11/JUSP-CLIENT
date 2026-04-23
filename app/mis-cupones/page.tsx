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
  if (!raw) return "Sin fecha de vencimiento";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function couponDiscount(coupon: CouponRow) {
  const value = Number(coupon?.discount_value || 0);
  if (String(coupon?.discount_type || "").toLowerCase() === "percentage") {
    return `${value}% OFF`;
  }
  return `$${Math.round(value).toLocaleString("es-CO")} OFF`;
}

function normalizeCoupon(row: any): CouponRow {
  const meta = row?.meta && typeof row.meta === "object" ? row.meta : {};
  const status = String(row?.status || meta?.status || meta?.estado || "").trim().toLowerCase();
  return {
    id: String(row?.id || meta?.coupon_id || "").trim(),
    code: String(row?.code || meta?.code || "").trim(),
    title: String(row?.title || meta?.title || "Beneficio disponible").trim(),
    description: String(row?.description || meta?.description || "").trim(),
    discount_type: String(row?.discount_type || meta?.discount_type || "fixed").trim().toLowerCase(),
    discount_value: row?.discount_value ?? meta?.discount_value ?? 0,
    expires_at: row?.expires_at || meta?.expires_at ? String(row?.expires_at || meta?.expires_at) : null,
    is_active:
      row?.is_active !== false &&
      meta?.is_active !== false &&
      meta?.deleted !== true &&
      meta?.used !== true &&
      meta?.redeemed !== true &&
      !meta?.used_at &&
      !meta?.redeemed_at &&
      !["inactive", "disabled", "deleted", "used", "redeemed", "expired", "no disponible"].includes(status),
    email: String(row?.email || meta?.email || row?.user_email || "").trim().toLowerCase(),
    user_id: String(row?.user_id || meta?.user_id || "").trim(),
  };
}

function isCouponAvailable(coupon: CouponRow) {
  return Boolean(String(coupon?.code || "").trim()) && coupon?.is_active !== false;
}

function isMissingCouponsTable(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("user_coupons") &&
    (message.includes("schema cache") || message.includes("does not exist") || message.includes("relation"))
  );
}

async function getCouponsFromLogs(admin: ReturnType<typeof supabaseAdmin>, userId: string, email: string) {
  const logsResult = await admin
    .from("logs")
    .select("id,user_email,meta,created_at")
    .eq("scope", "customer_coupon")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (logsResult.error) return [];

  return (Array.isArray(logsResult.data) ? logsResult.data : [])
    .map(normalizeCoupon)
    .filter((coupon) => {
      const couponUserId = String(coupon?.user_id || "").trim();
      const couponEmail = String(coupon?.email || "").trim().toLowerCase();
      if (couponUserId && userId) return couponUserId === userId;
      return Boolean(email) && couponEmail === email;
    })
    .filter(isCouponAvailable);
}

async function getCoupons(userId: string, email: string): Promise<CouponRow[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("user_coupons")
    .select("id,code,title,description,discount_type,discount_value,expires_at,is_active,email,user_id")
    .order("expires_at", { ascending: true });

  if (userId && email) query = query.or(`user_id.eq.${userId},email.eq.${email}`);
  else if (userId) query = query.eq("user_id", userId);
  else query = query.eq("email", email);

  const tableResult = await query;
  if (!tableResult.error) {
    const tableRows = Array.isArray(tableResult.data) ? tableResult.data : [];
    const coupons = tableRows
      .map(normalizeCoupon)
      .filter(isCouponAvailable);

    return tableRows.length ? coupons : getCouponsFromLogs(admin, userId, email);
  }

  if (!isMissingCouponsTable(tableResult.error)) return [];
  return getCouponsFromLogs(admin, userId, email);
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

  const coupons = await getCoupons(userId, email);

  return (
    <main className="couponPage">
      <section className="couponHero">
        <div>
          <div className="couponKicker">Mi cuenta</div>
          <h1>Mis cupones</h1>
          <p>Revisa tus beneficios activos, copia el codigo y aplicalo mas rapido cuando compres.</p>
        </div>

        <Link href="/account" className="couponBack">
          Volver a mi cuenta
        </Link>
      </section>

      <section className="couponGrid" aria-label="Cupones disponibles">
        {coupons.length ? (
          coupons.map((coupon) => (
            <article key={String(coupon?.id || coupon?.code)} className="couponTicket">
              <div className="ticketLeft">
                <div className="ticketLabel">Cupon activo</div>
                <div className="ticketCode">{String(coupon?.code || "JUSP")}</div>
                <div className="ticketTitle">{String(coupon?.title || "Beneficio disponible")}</div>
                {coupon?.description ? <p>{String(coupon.description)}</p> : null}
              </div>

              <div className="ticketCut" aria-hidden="true" />

              <div className="ticketRight">
                <div className="ticketDiscount">{couponDiscount(coupon)}</div>
                <div className="ticketDate">Vence: {formatDate(coupon?.expires_at)}</div>
                <div className="ticketStatus">Disponible</div>
              </div>
            </article>
          ))
        ) : (
          <div className="couponEmptyState">
            <div className="emptyIcon" aria-hidden="true">
              %
            </div>
            <div>
              <h2>Todavia no tienes cupones activos.</h2>
              <p>Cuando tengas beneficios disponibles, apareceran aqui con su codigo y vencimiento.</p>
            </div>
          </div>
        )}
      </section>

      <style>{`
        .couponPage{
          min-height:100vh;
          padding:calc(var(--jusp-header-h, 64px) + 28px) 16px 72px;
          background:
            radial-gradient(800px 320px at 12% 12%, rgba(17,17,17,.07), transparent 65%),
            linear-gradient(180deg, #f7f7f4 0%, #ffffff 60%);
        }
        .couponHero{
          max-width:1100px;
          margin:0 auto;
          display:flex;
          justify-content:space-between;
          gap:18px;
          flex-wrap:wrap;
          align-items:flex-start;
        }
        .couponKicker{
          font-size:12px;
          font-weight:1000;
          letter-spacing:.16em;
          text-transform:uppercase;
          color:rgba(0,0,0,.52);
        }
        .couponHero h1{
          margin:10px 0 0;
          font-size:clamp(42px, 6vw, 70px);
          line-height:.92;
          letter-spacing:-.06em;
          font-weight:1000;
        }
        .couponHero p{
          margin:18px 0 0;
          max-width:670px;
          font-size:16px;
          line-height:1.7;
          color:rgba(0,0,0,.66);
        }
        .couponBack{
          align-self:flex-start;
          text-decoration:none;
          color:#111;
          font-weight:950;
          border-radius:999px;
          border:1px solid rgba(0,0,0,.10);
          padding:14px 22px;
          background:rgba(255,255,255,.88);
          box-shadow:0 12px 30px rgba(0,0,0,.06);
        }
        .couponGrid{
          max-width:1100px;
          margin:34px auto 0;
          display:grid;
          gap:18px;
        }
        .couponTicket{
          position:relative;
          overflow:hidden;
          display:grid;
          grid-template-columns:minmax(0, 1fr) 32px minmax(210px, .34fr);
          align-items:stretch;
          border-radius:30px;
          background:#111;
          color:#fff;
          box-shadow:0 24px 70px rgba(0,0,0,.14);
        }
        .couponTicket:before,
        .couponTicket:after{
          content:"";
          position:absolute;
          top:50%;
          width:34px;
          height:34px;
          border-radius:999px;
          background:#f7f7f4;
          transform:translateY(-50%);
          z-index:2;
        }
        .couponTicket:before{ left:-17px; }
        .couponTicket:after{ right:-17px; }
        .ticketLeft{
          min-width:0;
          padding:28px 30px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.12), transparent 48%),
            #111;
        }
        .ticketLabel{
          font-size:12px;
          font-weight:1000;
          letter-spacing:.16em;
          text-transform:uppercase;
          color:rgba(255,255,255,.62);
        }
        .ticketCode{
          margin-top:12px;
          font-size:clamp(30px, 5vw, 58px);
          line-height:.95;
          letter-spacing:-.05em;
          font-weight:1000;
          overflow-wrap:anywhere;
        }
        .ticketTitle{
          margin-top:12px;
          font-size:18px;
          font-weight:950;
        }
        .ticketLeft p{
          margin:8px 0 0;
          max-width:620px;
          color:rgba(255,255,255,.72);
          line-height:1.7;
        }
        .ticketCut{
          background-image:linear-gradient(to bottom, rgba(255,255,255,.28) 45%, transparent 45%);
          background-size:2px 16px;
          background-repeat:repeat-y;
          background-position:center;
        }
        .ticketRight{
          display:grid;
          align-content:center;
          justify-items:start;
          gap:10px;
          padding:26px;
          background:#fff;
          color:#111;
        }
        .ticketDiscount{
          font-size:30px;
          line-height:1;
          letter-spacing:-.04em;
          font-weight:1000;
        }
        .ticketDate{
          color:rgba(0,0,0,.62);
          font-size:13px;
          font-weight:800;
        }
        .ticketStatus{
          width:max-content;
          border-radius:999px;
          background:#dcfce7;
          color:#166534;
          padding:7px 11px;
          font-size:12px;
          font-weight:1000;
        }
        .couponEmptyState{
          border-radius:30px;
          background:#fff;
          border:1px solid rgba(0,0,0,.08);
          padding:30px;
          display:flex;
          align-items:center;
          gap:18px;
          box-shadow:0 22px 60px rgba(0,0,0,.07);
        }
        .emptyIcon{
          width:64px;
          height:64px;
          border-radius:22px;
          display:grid;
          place-items:center;
          background:#111;
          color:#fff;
          font-size:30px;
          font-weight:1000;
          flex:0 0 auto;
        }
        .couponEmptyState h2{
          margin:0;
          font-size:26px;
          letter-spacing:-.03em;
          font-weight:1000;
        }
        .couponEmptyState p{
          margin:10px 0 0;
          color:rgba(0,0,0,.66);
          line-height:1.7;
        }
        @media (max-width:760px){
          .couponTicket{
            grid-template-columns:1fr;
          }
          .ticketCut{
            height:28px;
            background-image:linear-gradient(to right, rgba(255,255,255,.28) 45%, transparent 45%);
            background-size:16px 2px;
            background-repeat:repeat-x;
            background-position:center;
          }
          .ticketRight{
            justify-items:stretch;
          }
          .couponEmptyState{
            align-items:flex-start;
            flex-direction:column;
          }
        }
      `}</style>
    </main>
  );
}
