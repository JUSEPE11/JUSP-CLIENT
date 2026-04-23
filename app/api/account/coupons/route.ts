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
  const status = String(row?.status || meta?.status || meta?.estado || "").trim().toLowerCase();
  return {
    id: String(row?.id || meta?.coupon_id || "").trim(),
    code: String(row?.code || meta?.code || "").trim(),
    title: String(row?.title || meta?.title || "").trim(),
    description: String(row?.description || meta?.description || "").trim(),
    discount_type: String(row?.discount_type || meta?.discount_type || "fixed").trim().toLowerCase(),
    discount_value: Number(row?.discount_value ?? meta?.discount_value ?? 0),
    expires_at: row?.expires_at || meta?.expires_at ? String(row?.expires_at || meta.expires_at) : null,
    is_active:
      row?.is_active !== false &&
      meta?.is_active !== false &&
      meta?.deleted !== true &&
      meta?.used !== true &&
      meta?.redeemed !== true &&
      !meta?.used_at &&
      !meta?.redeemed_at &&
      !["inactive", "disabled", "deleted", "used", "redeemed", "expired", "no disponible"].includes(status),
  };
}

function isCouponAvailable(row: ReturnType<typeof normalizeCoupon>) {
  return Boolean(row.code) && row.is_active !== false;
}

function isMissingCouponsTable(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("user_coupons") && (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

async function getCouponsFromLogs(admin: ReturnType<typeof supabaseAdmin>, userId: string, email: string) {
  const logsResult = await admin
    .from("logs")
    .select("id,user_email,meta,created_at")
    .eq("scope", "customer_coupon")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (logsResult.error) {
    return { coupons: [], error: logsResult.error };
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

  return { coupons, error: null };
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

    const admin = supabaseAdmin();
    let query = admin
      .from("user_coupons")
      .select("id,code,title,description,discount_type,discount_value,expires_at,is_active,email,user_id")
      .order("expires_at", { ascending: true });

    if (userId && email) query = query.or(`user_id.eq.${userId},email.eq.${email}`);
    else if (userId) query = query.eq("user_id", userId);
    else query = query.eq("email", email);

    const tableResult = await query;
    if (tableResult.error) {
      if (!isMissingCouponsTable(tableResult.error)) {
        return NextResponse.json({ ok: false, error: tableResult.error.message }, { status: 500 });
      }

      const { coupons, error } = await getCouponsFromLogs(admin, userId, email);
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          ok: true,
          coupons,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const tableRows = Array.isArray(tableResult.data) ? tableResult.data : [];
    const coupons = tableRows
      .map(normalizeCoupon)
      .filter(isCouponAvailable);

    if (!tableRows.length) {
      const logsResult = await getCouponsFromLogs(admin, userId, email);
      if (logsResult.error) {
        return NextResponse.json({ ok: false, error: logsResult.error.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          ok: true,
          coupons: logsResult.coupons,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

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
