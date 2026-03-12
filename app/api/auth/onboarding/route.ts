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
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
    }

    const decoded: any = await verifyAccessToken(at);
    const userId = decoded?.sub ? String(decoded.sub) : null;
    const email = decoded?.email ? String(decoded.email).toLowerCase() : null;

    if (!userId || !email) {
      return NextResponse.json({ ok: false, error: "Invalid session payload" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const incomingProfile = body?.profile ?? body ?? {};

    const admin = supabaseAdmin();

    const nameFromBody =
      typeof incomingProfile?.name === "string" ? incomingProfile.name.trim() : "";
    const safeName = nameFromBody || safeEmailName(email);

    // 1) Buscar primero por user_id (fuente real de identidad)
    const { data: existingByUserId, error: findErr } = await admin
      .from("user_registry")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json(
        { ok: false, error: findErr.message || "DB read error" },
        { status: 500 }
      );
    }

    if (existingByUserId) {
      // 2) Si existe ese user_id, actualizar SOLO campos mutables
      const { error: updateErr } = await admin
        .from("user_registry")
        .update({
          email,
          name: safeName,
          profile: incomingProfile,
        })
        .eq("user_id", userId);

      if (updateErr) {
        return NextResponse.json(
          { ok: false, error: updateErr.message || "DB update error" },
          { status: 500 }
        );
      }
    } else {
      // 3) Si no existe ese user_id, insertar nuevo registro
      const { error: insertErr } = await admin
        .from("user_registry")
        .insert({
          user_id: userId,
          email,
          name: safeName,
          profile: incomingProfile,
        });

      if (insertErr) {
        return NextResponse.json(
          { ok: false, error: insertErr.message || "DB insert error" },
          { status: 500 }
        );
      }
    }

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