// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { COOKIE_AT, COOKIE_PROFILE, verifyAccessToken, profileCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function safeJsonParse(v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const store = await cookies();

    const at = store.get(COOKIE_AT)?.value;
    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // ✅ Verifica token y saca sub/email
    let tokenPayload: any = null;
    try {
      tokenPayload = await verifyAccessToken(at);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const userId = tokenPayload?.sub ?? null;
    const email = tokenPayload?.email ?? null;

    // 1) Intenta cookie profile
    const rawProfile = store.get(COOKIE_PROFILE)?.value || null;
    let profileObj: any = null;

    if (rawProfile) {
      profileObj = safeJsonParse(safeDecode(rawProfile));
    }

    // ✅ Si cookie no existe o viene vieja (profile null), autocura desde DB
    const needsDb =
      !profileObj ||
      typeof profileObj !== "object" ||
      profileObj?.id !== userId ||
      profileObj?.profile == null;

    if (needsDb && userId) {
      try {
        const admin = supabaseAdmin();
        const { data: reg } = await admin
          .from("user_registry")
          .select("profile,name,email")
          .eq("user_id", userId)
          .maybeSingle();

        const dbProfile = reg?.profile ?? null;
        const dbName = (reg?.name ?? null) as any;

        profileObj = {
          id: userId,
          email: reg?.email ?? email ?? null,
          name: dbName ?? null,
          profile: dbProfile,
        };

        // ✅ re-set cookie profile actualizado
        const res = NextResponse.json({ ok: true, user: profileObj }, { status: 200, headers: { "Cache-Control": "no-store" } });
        res.cookies.set(profileCookie(encodeURIComponent(JSON.stringify(profileObj))));
        return res;
      } catch {
        // si falla DB, seguimos con lo que había
      }
    }

    if (!profileObj) {
      return NextResponse.json({ ok: false, error: "No profile" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true, user: profileObj }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}