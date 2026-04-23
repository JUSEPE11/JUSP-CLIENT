import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sendCouponCreatedEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CouponStatus = "active" | "used" | "expired" | "deleted";

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function safeEmail(value: unknown) {
  return safeText(value).toLowerCase();
}

function safeNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function normalizeStatus(value: unknown): CouponStatus {
  const raw = safeText(value).toLowerCase();
  if (raw === "usado" || raw === "used" || raw === "redeemed") return "used";
  if (raw === "vencido" || raw === "expired") return "expired";
  if (raw === "eliminado" || raw === "deleted" || raw === "removed") return "deleted";
  return "active";
}

function statusPayload(status: CouponStatus) {
  const now = new Date().toISOString();
  if (status === "active") {
    return {
      is_active: true,
      status: "active",
      used_at: null,
      redeemed_at: null,
      deleted_at: null,
      expired_at: null,
    };
  }

  return {
    is_active: false,
    status,
    ...(status === "used" ? { used_at: now, redeemed_at: now } : {}),
    ...(status === "deleted" ? { deleted_at: now } : {}),
    ...(status === "expired" ? { expired_at: now } : {}),
  };
}

async function insertLog(meta: Record<string, unknown>, email?: string | null) {
  await supabaseAdmin()
    .from("logs")
    .insert({
      level: "info",
      scope: "customer_coupon",
      message: "Coupon event",
      user_email: email || null,
      meta,
    })
    .then(() => null, () => null);
}

function couponSelect() {
  return "id,code,title,description,discount_type,discount_value,expires_at,is_active,email,user_id";
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const q = safeText(req.nextUrl.searchParams.get("q")).toLowerCase();

  let query = admin
    .from("user_coupons")
    .select(couponSelect())
    .order("expires_at", { ascending: true });

  if (q) {
    query = query.or(`code.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query.limit(300);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, coupons: Array.isArray(data) ? data : [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = safeEmail(body?.email || body?.customer_email || body?.client_email);
  const code = safeText(body?.code).toUpperCase();
  const title = safeText(body?.title) || "Beneficio disponible";
  const description = safeText(body?.description);
  const discountType = safeText(body?.discount_type || body?.discountType || "fixed").toLowerCase();
  const discountValue = safeNumber(body?.discount_value ?? body?.discountValue);
  const expiresAt = safeText(body?.expires_at || body?.expiresAt) || null;
  const userId = safeText(body?.user_id || body?.userId) || null;

  if (!email) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ ok: false, error: "CODE_REQUIRED" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const payload = {
    code,
    title,
    description,
    email,
    user_id: userId,
    discount_type: discountType === "percentage" ? "percentage" : "fixed",
    discount_value: discountValue,
    expires_at: expiresAt,
    is_active: true,
  };

  const { data, error } = await admin
    .from("user_coupons")
    .insert(payload)
    .select(couponSelect())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const createdCoupon = data as any;

  await insertLog(
    {
      event: "created",
      ...payload,
      coupon_id: createdCoupon?.id || null,
      status: "active",
      created_at: new Date().toISOString(),
    },
    email
  );

  let emailSent = false;
  try {
    await sendCouponCreatedEmail({
      to: email,
      code,
      title,
      description,
      discountType: payload.discount_type,
      discountValue,
      expiresAt,
    });
    emailSent = true;
  } catch (error: any) {
    await insertLog(
      {
        event: "email_failed",
        code,
        coupon_id: createdCoupon?.id || null,
        error: error?.message || "EMAIL_FAILED",
      },
      email
    );
  }

  return NextResponse.json(
    { ok: true, coupon: createdCoupon, emailSent },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = safeText(body?.id);
  const code = safeText(body?.code).toUpperCase();
  const email = safeEmail(body?.email);
  const status = normalizeStatus(body?.status || body?.action);

  if (!id && !code) {
    return NextResponse.json({ ok: false, error: "ID_OR_CODE_REQUIRED" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  let updateQuery = admin.from("user_coupons").update(statusPayload(status));
  if (id) updateQuery = updateQuery.eq("id", id);
  else updateQuery = updateQuery.eq("code", code);
  if (email) updateQuery = updateQuery.eq("email", email);

  let result = await updateQuery.select(couponSelect()).maybeSingle();

  if (result.error) {
    let fallbackQuery = admin.from("user_coupons").update({ is_active: status === "active" });
    if (id) fallbackQuery = fallbackQuery.eq("id", id);
    else fallbackQuery = fallbackQuery.eq("code", code);
    if (email) fallbackQuery = fallbackQuery.eq("email", email);
    result = await fallbackQuery.select(couponSelect()).maybeSingle();
  }

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }

  const updatedCoupon = result.data as any;

  await insertLog(
    {
      event: "status_changed",
      coupon_id: id || updatedCoupon?.id || null,
      code: code || updatedCoupon?.code || null,
      status,
      is_active: status === "active",
      updated_at: new Date().toISOString(),
    },
    email || updatedCoupon?.email || null
  );

  return NextResponse.json(
    { ok: true, coupon: updatedCoupon, status },
    { headers: { "Cache-Control": "no-store" } }
  );
}
