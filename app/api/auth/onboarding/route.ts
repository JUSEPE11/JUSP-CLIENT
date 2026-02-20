// app/api/auth/onboarding/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { COOKIE_AT, verifyAccessToken, profileCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeProfileCookie(sessionUser: any) {
  return encodeURIComponent(JSON.stringify(sessionUser ?? {}));
}

export async function POST(req: Request) {
  try {
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json(
        { ok: false, error: "No session" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload: any = await verifyAccessToken(at);
    const userId = String(payload?.sub || "").trim();
    const email = payload?.email ?? null;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Invalid session" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const incomingProfile = body?.profile ?? {};

    const admin = supabaseAdmin();

    // ✅ Guardar onboarding REAL en DB
    const { error } = await admin
      .from("user_registry")
      .update({ profile: incomingProfile })
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    // ✅ Actualizar cookie para que Header lo detecte inmediato
    const sessionUser = {
      id: userId,
      email,
      name: null,
      profile: incomingProfile,
    };

    const res = NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    res.cookies.set(profileCookie(encodeProfileCookie(sessionUser)));

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Onboarding error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}