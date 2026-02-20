// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_DEV, ADMIN_COOKIE_PROD, clearCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cookieNames() {
  return [ADMIN_COOKIE_DEV, ADMIN_COOKIE_PROD];
}

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });

  for (const name of cookieNames()) {
    res.cookies.set(clearCookie(name));
  }

  return res;
}
