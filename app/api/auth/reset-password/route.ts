import { NextResponse } from "next/server";

type ResetPasswordBody = {
  token?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ResetPasswordBody;

    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "El token es obligatorio." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña es obligatoria." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    console.log("[reset-password] token:", token);
    console.log("[reset-password] password length:", password.length);

    // TODO REAL:
    // 1) buscar token en DB
    // 2) validar que exista
    // 3) validar expiración
    // 4) obtener usuario asociado
    // 5) hashear password nueva
    // 6) actualizar password del usuario
    // 7) invalidar/eliminar token usado

    return NextResponse.json({
      success: true,
      message: "Tu contraseña fue actualizada correctamente.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo restablecer la contraseña." },
      { status: 500 }
    );
  }
}