// app/api/auth/onboarding/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { COOKIE_AT, verifyAccessToken, profileCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeProfile(profile: any) {
  return encodeURIComponent(JSON.stringify(profile ?? {}));
}

export async function POST(req: Request) {
  try {
    // ✅ Gate: requiere sesión (cookie HttpOnly)
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json(
        { ok: false, error: "No session" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // ✅ Valida token y extrae identidad
    const payload: any = await verifyAccessToken(at);
    const userId = payload?.sub || null;
    const email = payload?.email || null;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Invalid session" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const incomingProfile = body?.profile ?? body ?? {};

    // ✅ 1) Persistir en BD: user_registry.profile (jsonb)
    // Tu tabla real: user_registry(user_id uuid, email text, profile jsonb, ...)
    try {
      const admin = supabaseAdmin();

      // Intento #1: update por user_id
      const { data: updated, error: updErr } = await admin
        .from("user_registry")
        .update({ profile: incomingProfile })
        .eq("user_id", userId)
        .select("user_id")
        .maybeSingle();

      // Si no existe fila (o update no afectó nada), insertamos
      if (updErr || !updated?.user_id) {
        await admin.from("user_registry").insert({
          user_id: userId,
          email: email,
          profile: incomingProfile,
        });
      }
    } catch {
      // Si falla BD, NO bloqueamos el onboarding (pero lo normal es que funcione)
      // Igual dejamos cookie para que el usuario no quede bloqueado
    }

    // ✅ 2) Setear cookie profile para que /api/auth/me lo vea ya
    const value = encodeProfile({
      id: userId,
      email: email ?? null,
      // name no es crítico aquí (si quieres, luego lo rellenamos)
      name: null,
      profile: incomingProfile,
    });

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(profileCookie(value));
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Onboarding error";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}