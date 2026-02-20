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

function encodeProfileForCookie(payload: any) {
  return encodeURIComponent(JSON.stringify(payload ?? {}));
}

function isEmailConfirmed(user: any): boolean {
  // Supabase suele exponer email_confirmed_at (v2)
  // y algunos proyectos antiguos usan confirmed_at
  const a = user?.email_confirmed_at;
  const b = user?.confirmed_at;
  return !!(a || b);
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

    // ✅ 1) Primero autenticamos con Supabase
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Invalid login credentials" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const user = data.user;

    // ✅ 2) Gate REAL: si Supabase NO confirma correo => bloqueamos
    const confirmed = isEmailConfirmed(user);
    if (!confirmed) {
      return NextResponse.json(
        { ok: false, error: "Debes verificar tu correo primero." },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    // ✅ 3) Si Supabase SÍ confirma, sincronizamos user_registry.email_verified = true
    try {
      const admin = supabaseAdmin();

      // upsert para asegurar row; NO rompe si ya existe
      await admin
        .from("user_registry")
        .upsert(
          {
            user_id: user.id,
            email,
            email_verified: true,
            verified_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
    } catch {
      // si falla sync, no tumbamos el login
    }

    // ✅ Tokens propios HttpOnly
    const at = await signAccessToken({ sub: user.id, email: user.email });
    const rt = await signRefreshToken({ sub: user.id, email: user.email });

    // ✅ Leer perfil persistido en DB (user_registry.profile)
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
    } catch {
      // seguimos sin romper login
    }

    // ✅ Shape que tu UI espera en /api/auth/me => me.user.profile
    const profilePayload = {
      id: user.id,
      email: user.email,
      name: (user.user_metadata as any)?.name || dbName || null,
      profile: dbProfile || null,
    };

    const res = NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    res.cookies.set(accessCookie(at));
    res.cookies.set(refreshCookie(rt));
    res.cookies.set(profileCookie(encodeProfileForCookie(profilePayload)));

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Login error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}