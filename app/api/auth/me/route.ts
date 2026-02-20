// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_AT,
  COOKIE_PROFILE,
  verifyAccessToken,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function GET() {
  try {
    const store = await cookies();

    const at = store.get(COOKIE_AT)?.value;
    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
    }

    // ✅ Si el token está vencido/invalid => 401
    try {
      await verifyAccessToken(at);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }

    const rawProfile = store.get(COOKIE_PROFILE)?.value;
    if (!rawProfile) {
      return NextResponse.json({ ok: false, error: "No profile" }, { status: 401 });
    }

    let profile: any = null;
    try {
      profile = JSON.parse(safeDecode(rawProfile));
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid profile" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: profile }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}