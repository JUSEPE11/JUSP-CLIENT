// app/api/auth/onboarding/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { COOKIE_AT, verifyAccessToken, profileCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJson(v: any) {
  try {
    return JSON.parse(typeof v === "string" ? v : JSON.stringify(v));
  } catch {
    return null;
  }
}

function encodeProfileCookieShape(opts: { id?: string; email?: string; name?: string; profile: any }) {
  // ✅ La UI espera: me.user.profile
  const payload = {
    id: opts.id ?? null,
    email: opts.email ?? null,
    name: opts.name ?? null,
    profile: opts.profile ?? null,
  };
  return encodeURIComponent(JSON.stringify(payload));
}

function normalizeName(input: any, fallbackEmail: string) {
  const raw = String(input ?? "").trim();
  if (raw) return raw;

  // ✅ fallback NO-NULL: usa la parte antes del @
  const left = String(fallbackEmail || "").split("@")[0]?.trim();
  return left ? left : "Usuario";
}

export async function POST(req: Request) {
  try {
    // ✅ Gate: requiere sesión (cookie HttpOnly)
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // ✅ Valida token y extrae sub/email
    const decoded: any = await verifyAccessToken(at);
    const userId = decoded?.sub ? String(decoded.sub) : null;
    const email = decoded?.email ? String(decoded.email).toLowerCase() : null;

    if (!userId || !email) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const body = await req.json().catch(() => ({}));
    const incomingProfile = body?.profile ?? body ?? {};
    const normalizedProfile = safeJson(incomingProfile) ?? {};

    // ✅ name: primero intenta venir del profile, si no existe usa fallback (email local-part)
    const incomingName =
      normalizedProfile?.name ??
      normalizedProfile?.full_name ??
      normalizedProfile?.display_name ??
      null;

    const safeName = normalizeName(incomingName, email);

    // ✅ Persistir en DB: user_registry.profile (JSONB) + name NOT NULL
    try {
      const admin = supabaseAdmin();

      const { error: upsertErr } = await admin
        .from("user_registry")
        .upsert(
          {
            user_id: userId,
            email,
            name: safeName, // ✅ nunca null
            profile: normalizedProfile,
          },
          { onConflict: "email" }
        );

      if (upsertErr) {
        return NextResponse.json({ ok: false, error: upsertErr.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
      }
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message || "DB error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    // ✅ También actualizar cookie de profile con el shape correcto
    const res = NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });

    const cookieValue = encodeProfileCookieShape({
      id: userId,
      email,
      name: safeName,
      profile: normalizedProfile,
    });

    res.cookies.set(profileCookie(cookieValue));
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Onboarding error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}