import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireSession(req: NextRequest) {
  const at = req.cookies.get(COOKIE_AT)?.value;

  if (!at) {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: "No session" }, { status: 401 }),
    };
  }

  try {
    const payload = await verifyAccessToken(at);
    return { ok: true as const, payload };
  } catch {
    return {
      ok: false as const,
      res: NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 }),
    };
  }
}

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function pickUserId(payload: any): string {
  return String(
    payload?.sub ||
      payload?.userId ||
      payload?.id ||
      ""
  ).trim();
}

function pickEmail(payload: any): string {
  return String(
    payload?.email ||
      payload?.user?.email ||
      ""
  )
    .trim()
    .toLowerCase();
}

export async function GET(req: NextRequest) {
  const gate = await requireSession(req);
  if (!gate.ok) return gate.res;

  try {
    const payload = gate.payload;
    const userId = pickUserId(payload);
    const email = pickEmail(payload);

    if (!userId && !email) {
      return NextResponse.json(
        { ok: false, error: "Missing user identity in session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseIntSafe(searchParams.get("page"), 1));
    const limit = Math.max(1, parseIntSafe(searchParams.get("limit"), 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = supabaseAdmin();

    // 1) Intento principal: por user_id
    if (userId) {
      const byUser = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (byUser.error) {
        return NextResponse.json({ ok: false, error: byUser.error.message }, { status: 500 });
      }

      if ((byUser.data?.length || 0) > 0) {
        return NextResponse.json(
          {
            ok: true,
            orders: byUser.data ?? [],
            count: byUser.count ?? 0,
            page,
            limit,
            matched_by: "user_id",
          },
          { status: 200, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    // 2) Fallback: por customer_email
    if (email) {
      const byEmail = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("customer_email", email)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (byEmail.error) {
        return NextResponse.json({ ok: false, error: byEmail.error.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          ok: true,
          orders: byEmail.data ?? [],
          count: byEmail.count ?? 0,
          page,
          limit,
          matched_by: "customer_email",
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        orders: [],
        count: 0,
        page,
        limit,
        matched_by: "none",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}