import { NextRequest, NextResponse } from "next/server";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pickUserId(payload: any): string {
  return String(payload?.sub || payload?.userId || payload?.id || "").trim();
}

function pickEmail(payload: any): string {
  return String(payload?.email || payload?.user?.email || "")
    .trim()
    .toLowerCase();
}

function normalizeCoupon(row: any) {
  const meta = row?.meta && typeof row.meta === "object" ? row.meta : row || {};
  return {
    id: String(row?.id || meta?.coupon_id || "").trim(),
    code: String(meta?.code || "").trim(),
    title: String(meta?.title || "").trim(),
    description: String(meta?.description || "").trim(),
    discount_type: String(meta?.discount_type || "fixed").trim().toLowerCase(),
    discount_value: Number(meta?.discount_value || 0),
    expires_at: meta?.expires_at ? String(meta.expires_at) : null,
    is_active: meta?.is_active !== false && meta?.deleted !== true,
  };
}

function isCouponAvailable(row: ReturnType<typeof normalizeCoupon>) {
  if (!row.code || row.is_active === false) return false;
  if (!row.expires_at) return true;

  const expiresAt = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expiresAt)) return true;
  return expiresAt >= Date.now();
}

function isMissingCouponsTable(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("user_coupons") && (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_AT)?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
  }

  try {
    const payload = await verifyAccessToken(token);
    const userId = pickUserId(payload);
    const email = pickEmail(payload);

    if (!userId && !email) {
      return NextResponse.json({ ok: false, error: "No identity" }, { status: 401 });
    }

    let query = supabaseAdmin()
      .from("user_coupons")
      .select("id,code,title,description,discount_type,discount_value,expires_at,is_active,email,user_id")
      .order("expires_at", { ascending: true });

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("email", email);
    }

    const tableResult = await query;
    if (tableResult.error) {
      if (!isMissingCouponsTable(tableResult.error)) {
        return NextResponse.json({ ok: false, error: tableResult.error.message }, { status: 500 });
      }

      const logsResult = await supabaseAdmin()
        .from("logs")
        .select("id,user_email,meta,created_at")
        .eq("scope", "customer_coupon")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (logsResult.error) {
        return NextResponse.json({ ok: false, error: logsResult.error.message }, { status: 500 });
      }

      const coupons = (Array.isArray(logsResult.data) ? logsResult.data : [])
        .filter((row: any) => {
          const meta = row?.meta && typeof row.meta === "object" ? row.meta : {};
          const rowUserId = String(meta?.user_id || "").trim();
          const rowEmail = String(meta?.email || row?.user_email || "").trim().toLowerCase();
          if (rowUserId && userId) return rowUserId === userId;
          return Boolean(email) && rowEmail === email;
        })
        .map(normalizeCoupon)
        .filter(isCouponAvailable);

      return NextResponse.json(
        {
          ok: true,
          coupons,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const coupons = (Array.isArray(tableResult.data) ? tableResult.data : [])
      .map(normalizeCoupon)
      .filter(isCouponAvailable);

    return NextResponse.json(
      {
        ok: true,
        coupons,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
