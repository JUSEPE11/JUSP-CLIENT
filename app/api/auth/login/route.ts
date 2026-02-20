// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  signAccessToken,
  signRefreshToken,
  accessCookie,
  refreshCookie,
  profileCookie,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: any) {
  return String(v || "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body?.email).toLowerCase();
    const password = clean(body?.password);

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email y password requeridos" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 0) Bloqueo por verificación (tu tabla real usa email)
    try {
      const admin = supabaseAdmin();
      const { data: reg } = await admin
        .from("user_registry")
        .select("email_verified")
        .eq("email", email)
        .maybeSingle();

      if (reg && reg.email_verified === false) {
        return NextResponse.json(
          { ok: false, error: "Debes verificar tu correo primero." },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch {
      // no tumbar login por un lookup fallido
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Invalid login credentials" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const user = data.user;

    // ✅ Tokens propios (compat /api/auth/me)
    const at = await signAccessToken({ sub: user.id, email: user.email });
    const rt = await signRefreshToken({ sub: user.id, email: user.email });

    // ✅ Traer profile real desde DB (user_registry usa user_id)
    let dbProfile: any = null;
    let dbName: string | null = null;

    try {
      const admin = supabaseAdmin();
      const { data: reg } = await admin
        .from("user_registry")
        .select("profile,name")
        .eq("user_id", user.id)
        .maybeSingle();

      dbProfile = reg?.profile ?? null;
      dbName = (reg?.name ?? null) as any;
    } catch {
      // si falla, seguimos igual (pero NO bloquea login)
    }

    // ✅ Cookie profile: AHORA sí puede venir completo
    const profile = {
      id: user.id,
      email: user.email,
      name: dbName || (user.user_metadata as any)?.name || null,
      profile: dbProfile, // <- clave: ya no queda null si ya completó onboarding
    };

    const res = NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    res.cookies.set(accessCookie(at));
    res.cookies.set(refreshCookie(rt));
    res.cookies.set(profileCookie(encodeURIComponent(JSON.stringify(profile))));

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Login error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}