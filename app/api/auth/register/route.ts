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
function normalizeEmail(v: string) {
  return clean(v).toLowerCase();
}
function isEmailLike(v: string) {
  const s = clean(v);
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const DISPOSABLE_BLOCKLIST = new Set([
  // yopmail family
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.fr.nf",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  // common temp mail
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "mailinator.com",
  "maildrop.cc",
  "getnada.com",
  "dropmail.me",
  "dispostable.com",
  "trashmail.com",
  "sharklasers.com",
]);

function getEmailDomain(email: string) {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf("@");
  if (at < 0) return "";
  return e.slice(at + 1);
}
function isDisposableEmail(email: string) {
  const d = getEmailDomain(email);
  if (!d) return false;
  if (DISPOSABLE_BLOCKLIST.has(d)) return true;

  if (d.endsWith(".mailinator.com")) return true;
  if (d.includes("tempmail")) return true;
  if (d.includes("temp-mail")) return true;
  if (d.includes("10minutemail")) return true;

  return false;
}

function passwordRules(pw: string) {
  const s = pw || "";
  return {
    len: s.length >= 12,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    num: /[0-9]/.test(s),
    sym: /[^A-Za-z0-9]/.test(s),
  };
}
function isCommonPassword(pw: string) {
  const p = (pw || "").toLowerCase();
  const bad = [
    "123456",
    "1234567",
    "12345678",
    "123456789",
    "password",
    "qwerty",
    "111111",
    "000000",
    "abc123",
    "admin",
    "iloveyou",
    "letmein",
  ];
  if (bad.includes(p)) return true;
  if (p.includes("password")) return true;
  if (p.includes("qwerty")) return true;
  return false;
}
function passwordStrong(pw: string) {
  const r = passwordRules(pw);
  if (!(r.len && r.upper && r.lower && r.num && r.sym)) return false;
  if (isCommonPassword(pw)) return false;
  return true;
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
    const email = normalizeEmail(body?.email);
    const emailConfirm = normalizeEmail(body?.emailConfirm);
    const password = String(body?.password || "");

    if (!name) return NextResponse.json({ ok: false, error: "Escribe tu nombre." }, { status: 400 });

    if (!email) return NextResponse.json({ ok: false, error: "Escribe tu correo." }, { status: 400 });
    if (!isEmailLike(email)) return NextResponse.json({ ok: false, error: "Ese correo no parece válido." }, { status: 400 });

    if (!emailConfirm) return NextResponse.json({ ok: false, error: "Confirma tu correo." }, { status: 400 });
    if (!isEmailLike(emailConfirm))
      return NextResponse.json({ ok: false, error: "El correo de confirmación no parece válido." }, { status: 400 });

    if (email !== emailConfirm) return NextResponse.json({ ok: false, error: "Los correos no coinciden." }, { status: 400 });

    if (isDisposableEmail(email))
      return NextResponse.json(
        { ok: false, error: "No se permiten correos temporales. Usa un correo real (Gmail/Outlook/etc)." },
        { status: 400 }
      );

    if (!password) return NextResponse.json({ ok: false, error: "Escribe tu contraseña." }, { status: 400 });

    if (!passwordStrong(password)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contraseña débil: usa 12+ caracteres con mayúscula, minúscula, número y símbolo (y evita contraseñas comunes).",
        },
        { status: 400 }
      );
    }

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
      // rollback
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
      await supabase.from("email_otps").delete().eq("email", email);
      return NextResponse.json(
        { ok: false, error: "No se pudo enviar el correo. Revisa RESEND_API_KEY / RESEND_FROM_EMAIL." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "REGISTER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}