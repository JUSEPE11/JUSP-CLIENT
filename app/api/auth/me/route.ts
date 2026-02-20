// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  COOKIE_AT,
  COOKIE_PROFILE,
  verifyAccessToken,
  profileCookie,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

async function fetchProfileByUserId(userId: string) {
  const admin = supabaseAdmin();
  const tables = ["profiles", "user_profiles", "customer_profiles", "user_profile", "users_profile"];

  for (const table of tables) {
    try {
      const { data, error } = await admin.from(table).select("*").eq("id", userId).maybeSingle();
      if (!error && data) return data;
    } catch {
      // ignore
    }
  }

  return null;
}

export async function GET() {
  try {
    const store = await cookies();

    const at = store.get(COOKIE_AT)?.value;
    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // ✅ Verificamos token y obtenemos payload
    let payload: any;
    try {
      payload = await verifyAccessToken(at);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const userId = String(payload?.sub || "").trim();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // 1) Intentamos leer cookie profile
    const rawProfile = store.get(COOKIE_PROFILE)?.value || "";
    let sessionUser: any = null;

    if (rawProfile) {
      try {
        sessionUser = JSON.parse(safeDecode(rawProfile));
      } catch {
        sessionUser = null;
      }
    }

    // 2) Base mínima si cookie está vacía/dañada
    if (!sessionUser || typeof sessionUser !== "object") {
      sessionUser = {
        id: userId,
        email: typeof payload?.email === "string" ? payload.email : null,
        name: null,
        profile: null,
      };
    }

    // 3) ✅ Auto-curación: si profile está null, buscamos en DB y actualizamos cookie
    if (sessionUser?.profile == null) {
      const dbProfile = await fetchProfileByUserId(userId);
      if (dbProfile) {
        sessionUser = {
          ...sessionUser,
          id: sessionUser?.id || userId,
          email: sessionUser?.email ?? (typeof payload?.email === "string" ? payload.email : null),
          profile: dbProfile,
        };

        const res = NextResponse.json({ ok: true, user: sessionUser }, { status: 200, headers: { "Cache-Control": "no-store" } });
        res.cookies.set(profileCookie(encodeURIComponent(JSON.stringify(sessionUser))));
        return res;
      }
    }

    return NextResponse.json({ ok: true, user: sessionUser }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}