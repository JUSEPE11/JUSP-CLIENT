import { NextRequest, NextResponse } from "next/server";
import { signAccessToken, verifyRefreshToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refreshToken = clean(body?.refreshToken);

    if (!refreshToken) {
      return NextResponse.json(
        { ok: false, error: "refreshToken requerido" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload = await verifyRefreshToken(refreshToken).catch(() => null);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Refresh token inválido o expirado" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const userId = clean((payload as any)?.sub || (payload as any)?.id);
    const emailFromToken = clean((payload as any)?.email).toLowerCase();

    if (!userId || !emailFromToken) {
      return NextResponse.json(
        { ok: false, error: "Refresh token inválido" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    let resolvedEmail = emailFromToken;

    try {
      const admin = supabaseAdmin();
      const { data: reg } = await admin
        .from("user_registry")
        .select("email")
        .eq("user_id", userId)
        .maybeSingle();

      if (reg?.email) {
        resolvedEmail = clean(reg.email).toLowerCase() || resolvedEmail;
      }
    } catch {}

    const accessToken = await signAccessToken({
      sub: userId,
      email: resolvedEmail,
    });

    return NextResponse.json(
      {
        ok: true,
        accessToken,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Refresh error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}