import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ForgotPasswordBody = {
  email?: string;
};

function isEmailLike(v: string) {
  const s = String(v || "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ForgotPasswordBody;
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "El correo es obligatorio." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!isEmailLike(email)) {
      return NextResponse.json(
        { ok: false, error: "El correo no es válido." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = await createSupabaseServerClient();

    const redirectTo = `${appUrl()}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "No se pudo enviar el correo de recuperación." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          "Si existe una cuenta con ese correo, enviaremos un enlace para recuperar la contraseña.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo procesar la solicitud." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}