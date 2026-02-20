// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars (URL / KEY)");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** ✅ Gate duro: requiere cookie HttpOnly + JWT válido */
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

/**
 * ✅ Next 16: en algunos builds, ctx.params viene como Promise
 * (por eso tu error: params: Promise<...>)
 */
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const gate = await requireSession(req);
  if (!gate.ok) return gate.res;

  try {
    const { id } = await ctx.params;
    const cleanId = String(id || "").trim();

    if (!cleanId) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", cleanId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const res = NextResponse.json(
      { ok: true, order: data },
      { status: 200 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireSession(req);
  if (!gate.ok) return gate.res;

  try {
    const { id } = await ctx.params;
    const cleanId = String(id || "").trim();

    if (!cleanId) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // 🔒 Whitelist de campos editables (evita que te dañen columnas)
    const patch: Record<string, any> = {};
    const ALLOWED = ["status", "tracking_code", "notes", "updated_at"];

    for (const k of ALLOWED) {
      if (k in body) patch[k] = (body as any)[k];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No allowed fields to update" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", cleanId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const res = NextResponse.json(
      { ok: true, order: data },
      { status: 200 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}