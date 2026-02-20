// app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { COOKIE_AT, COOKIE_RT, COOKIE_PROFILE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isProd() {
  return process.env.NODE_ENV === "production";
}

function clearCookie(res: NextResponse, name: string) {
  res.cookies.set({
    name,
    value: "",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function doLogout() {
  // 1) Best effort: Supabase signOut
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // No bloqueamos: lo importante es borrar cookies
  }

  // 2) Borrar cookies propias (HttpOnly)
  const res = NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );

  clearCookie(res, COOKIE_AT);
  clearCookie(res, COOKIE_RT);
  clearCookie(res, COOKIE_PROFILE);

  return res;
}

// ✅ Tu UI puede llamar POST
export async function POST() {
  return doLogout();
}

// ✅ Si alguien entra por URL en el browser, también funciona
export async function GET() {
  return doLogout();
}