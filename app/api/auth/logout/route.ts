// app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import {
  clearCookie,
  COOKIE_AT,
  COOKIE_RT,
  COOKIE_PROFILE,
  COOKIE_CSRF,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });

  res.cookies.set(clearCookie(COOKIE_AT));
  res.cookies.set(clearCookie(COOKIE_RT));
  res.cookies.set(clearCookie(COOKIE_PROFILE));
  res.cookies.set(clearCookie(COOKIE_CSRF));

  return res;
}