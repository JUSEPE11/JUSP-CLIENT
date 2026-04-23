import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim();
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload = await verifyAccessToken(accessToken).catch(() => null);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const userId = clean((payload as any)?.sub || (payload as any)?.id);
    const email = clean((payload as any)?.email).toLowerCase();

    if (!userId || !email) {
      return NextResponse.json(
        { ok: false, error: "Invalid token payload" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    let dbProfile: any = null;
    let dbName: string | null = null;

    try {
      const admin = supabaseAdmin();
      const { data: reg } = await admin
        .from("user_registry")
        .select("profile,name,email")
        .eq("user_id", userId)
        .maybeSingle();

      if (reg?.profile) dbProfile = reg.profile;
      if (typeof reg?.name === "string") dbName = reg.name;
    } catch {}

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: userId,
          email,
          name: dbName || null,
          profile: dbProfile || null,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Me error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}