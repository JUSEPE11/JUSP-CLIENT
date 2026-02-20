// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { signAccessToken, signRefreshToken, accessCookie, refreshCookie, profileCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: any) {
  return String(v || "").trim();
}

function encodeProfileForCookie(payload: any) {
  return encodeURIComponent(JSON.stringify(payload ?? {}));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body?.email).toLowerCase();
    const password = clean(body?.password);

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email y password requeridos" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    // 0) Bloqueo por verificación (tu lógica actual)
    try {
      const admin = supabaseAdmin();
      const { data: reg } = await admin.from("user_registry").select("email_verified").eq("email", email).maybeSingle();
      if (reg && reg.email_verified === false) {
        return NextResponse.json({ ok: false, error: "Debes verificar tu correo primero." }, { status: 403, headers: { "Cache-Control": "no-store" } });
      }
    } catch {
      // no tumbamos login si falla lookup
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

    // ✅ Tokens propios HttpOnly (como ya haces)
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
      // si falla, seguimos sin romper login
    }

    // ✅ Shape que tu UI espera en /api/auth/me => me.user.profile
    const profilePayload = {
      id: user.id,
      email: user.email,
      name: (user.user_metadata as any)?.name || dbName || null,
      profile: dbProfile || null,
    };

    const res = NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
    res.cookies.set(accessCookie(at));
    res.cookies.set(refreshCookie(rt));
    res.cookies.set(profileCookie(encodeProfileForCookie(profilePayload)));

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Login error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}