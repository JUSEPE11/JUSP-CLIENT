// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_DEV, ADMIN_COOKIE_PROD } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cookieName() {
  return process.env.NODE_ENV === "production" ? ADMIN_COOKIE_PROD : ADMIN_COOKIE_DEV;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const expected = String(process.env.JUSP_ADMIN_TOKEN || "").trim();

    if (!expected) return NextResponse.json({ ok: false, error: "MISSING_ADMIN_TOKEN" }, { status: 500 });
    if (!token) return NextResponse.json({ ok: false, error: "TOKEN_REQUIRED" }, { status: 400 });
    if (token !== expected) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 401 });

    const res = NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });

    res.cookies.set({
      name: cookieName(),
      value: expected,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "ADMIN_LOGIN_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
