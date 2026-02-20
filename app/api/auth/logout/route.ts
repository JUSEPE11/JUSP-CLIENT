// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { COOKIE_AT, COOKIE_RT, COOKIE_PROFILE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearCookie(res: NextResponse, name: string) {
  // Delete (si está soportado) + set a vacío para asegurar en distintos runtimes
  try {
    // @ts-ignore
    res.cookies.delete(name);
  } catch {}

  res.cookies.set({
    name,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

async function doLogout() {
  // 1) Cierra sesión supabase (por si estás usando auth de supabase en paralelo)
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // no tumbamos logout por esto
  }

  // 2) Borra cookies HttpOnly propias (TU fuente de verdad real)
  const res = NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });

  clearCookie(res, COOKIE_AT);
  clearCookie(res, COOKIE_RT);
  clearCookie(res, COOKIE_PROFILE);

  return res;
}

// ✅ Soporta POST (llamadas normales) y GET (cuando el user entra por URL)
export async function POST() {
  return doLogout();
}

export async function GET() {
  return doLogout();
}