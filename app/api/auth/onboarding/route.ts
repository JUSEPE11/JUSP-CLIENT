// app/api/auth/onboarding/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  COOKIE_AT,
  verifyAccessToken,
  profileCookie,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeProfile(profile: any) {
  return encodeURIComponent(JSON.stringify(profile ?? {}));
}

function safeEmailName(email: string) {
  const base = String(email || "").split("@")[0] || "Usuario";
  return base.slice(0, 40);
}

export async function POST(req: Request) {
  try {
    // ✅ Gate: requiere sesión (cookie HttpOnly)
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
    }

    // ✅ Valida token y extrae identidad
    const decoded: any = await verifyAccessToken(at);
    const userId = decoded?.sub ? String(decoded.sub) : null;
    const email = decoded?.email ? String(decoded.email).toLowerCase() : null;

    if (!userId || !email) {
      return NextResponse.json({ ok: false, error: "Invalid session payload" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const incomingProfile = body?.profile ?? body ?? {};

    // ✅ Persistir en DB (user_registry.profile) + name NOT NULL
    // Si ya existe row, lo actualiza. Si no existe, lo crea.
    const admin = supabaseAdmin();

    // name fallback: si no viene en profile, usa parte del email
    const nameFromBody =
      typeof incomingProfile?.name === "string" ? incomingProfile.name.trim() : "";
    const safeName = nameFromBody || safeEmailName(email);

    // Upsert robusto
    const { error: upsertErr } = await admin
      .from("user_registry")
      .upsert(
        {
          user_id: userId,
          email,
          name: safeName,          // ✅ evita NOT NULL
          profile: incomingProfile // ✅ jsonb
        },
        { onConflict: "email" }
      );

    if (upsertErr) {
      return NextResponse.json(
        { ok: false, error: upsertErr.message || "DB error" },
        { status: 500 }
      );
    }

    // ✅ Cookie de perfil (lo que tu UI lee por /api/auth/me)
    const value = encodeProfile(incomingProfile);

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(profileCookie(value));
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Onboarding error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}