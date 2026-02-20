// app/api/auth/onboarding/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

export async function POST(req: Request) {
  try {
    // ✅ Gate: requiere sesión (cookie HttpOnly)
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
    }

    // ✅ Valida token
    await verifyAccessToken(at);

    const body = await req.json().catch(() => ({}));
    const incomingProfile = body?.profile ?? body ?? {};
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