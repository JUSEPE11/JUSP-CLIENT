import { NextResponse } from "next/server";
import crypto from "crypto";

type ForgotPasswordBody = {
  email?: string;
};

function isEmailLike(v: string) {
  const s = v.trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ForgotPasswordBody;
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "El correo es obligatorio." },
        { status: 400 }
      );
    }

    if (!isEmailLike(email)) {
      return NextResponse.json(
        { success: false, error: "El correo no es válido." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 1000 * 60 * 15; // 15 min

    console.log("[forgot-password] email:", email);
    console.log("[forgot-password] token:", token);
    console.log("[forgot-password] expiresAt:", new Date(expiresAt).toISOString());

    // TODO REAL:
    // 1) buscar usuario por email
    // 2) guardar token hash + expiresAt en DB
    // 3) enviar email con:
    //    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

    return NextResponse.json({
      success: true,
      message:
        "Si existe una cuenta con ese correo, enviaremos un enlace para recuperar la contraseña.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}