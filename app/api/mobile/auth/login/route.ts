import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: any) {
  return String(v || "").trim();
}

function isEmailConfirmed(user: any): boolean {
  return !!(user?.email_confirmed_at || user?.confirmed_at);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body?.email).toLowerCase();
    const password = clean(body?.password);

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email y password requeridos" },
        { status: 400 }
      );
    }

    // 🔹 Autenticación real (MISMA que web)
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const user = data.user;

    if (!isEmailConfirmed(user)) {
      return NextResponse.json(
        { ok: false, error: "Debes verificar tu correo primero." },
        { status: 403 }
      );
    }

    // 🔹 Sync DB (MISMO que web)
    try {
      const admin = supabaseAdmin();

      await admin.from("user_registry").upsert(
        {
          user_id: user.id,
          email,
          email_verified: true,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    } catch {}

    // 🔥 CLAVE: tokens en JSON (NO cookies)
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = await signRefreshToken({
      sub: user.id,
      email: user.email,
    });

    // 🔹 Traer perfil real
    let dbProfile: any = null;
    let dbName: string | null = null;

    try {
      const admin = supabaseAdmin();
      const { data: reg } = await admin
        .from("user_registry")
        .select("profile,name")
        .eq("email", email)
        .maybeSingle();

      if (reg?.profile) dbProfile = reg.profile;
      if (typeof reg?.name === "string") dbName = reg.name;
    } catch {}

    return NextResponse.json({
      ok: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: (user.user_metadata as any)?.name || dbName || null,
        profile: dbProfile || null,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Login error" },
      { status: 500 }
    );
  }
}