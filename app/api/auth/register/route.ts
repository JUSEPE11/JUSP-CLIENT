// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string) {
  return (v || "").trim();
}

function isEmailLike(v: string) {
  const s = clean(v);
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function genCode6() {
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = clean(body?.name);
    const email = clean(body?.email).toLowerCase();
    const password = String(body?.password || "");

    if (!name) return NextResponse.json({ ok: false, error: "Escribe tu nombre." }, { status: 400 });
    if (!email) return NextResponse.json({ ok: false, error: "Escribe tu correo." }, { status: 400 });
    if (!isEmailLike(email)) return NextResponse.json({ ok: false, error: "Ese correo no parece válido." }, { status: 400 });
    if (!password || password.length < 8)
      return NextResponse.json({ ok: false, error: "Tu contraseña debe tener mínimo 8 caracteres." }, { status: 400 });

    const supabase = supabaseAdmin();

    // 1) Crear usuario en Supabase Auth (sin confirmar email todavía)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name },
    });

    if (createErr) {
      const msg = createErr.message || "No se pudo crear la cuenta.";
      // Duplicado típico
      if (/already\s*registered|already\s*exists|duplicate/i.test(msg)) {
        return NextResponse.json({ ok: false, error: "Ese correo ya está registrado." }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const userId = created?.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: "No se pudo crear el usuario." }, { status: 500 });

    // 2) Crear OTP y guardarlo hasheado en DB
    const code = genCode6();
    const pepper = clean(process.env.OTP_PEPPER || "dev_pepper");
    const codeHash = sha256(`${email}:${code}:${pepper}`);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { error: otpErr } = await supabase
      .from("email_otps")
      .upsert(
        {
          email,
          user_id: userId,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
        },
        { onConflict: "email" }
      );

    if (otpErr) {
      // ⚠️ Si falló el OTP, rollback del usuario para no dejar cuentas huérfanas
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {}

      return NextResponse.json(
        {
          ok: false,
          error: "OTP_FAILED",
          message: "No se pudo generar OTP. Revisa la tabla email_otps (migración) y SUPABASE_SERVICE_ROLE_KEY.",
          detail: otpErr.message,
        },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3) Enviar email real
    try {
      await sendOtpEmail({ to: email, code });
    } catch (e: any) {
      // Limpieza: borrar OTP para no dejar basura
      await supabase.from("email_otps").delete().eq("email", email);
      return NextResponse.json(
        { ok: false, error: "No se pudo enviar el correo. Revisa RESEND_API_KEY / RESEND_FROM_EMAIL." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "REGISTER_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
