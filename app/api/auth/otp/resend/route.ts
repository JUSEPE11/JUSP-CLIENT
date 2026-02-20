// app/api/auth/otp/resend/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string) {
  return (v || "").trim();
}

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function genCode6() {
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body?.email).toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Email requerido." }, { status: 400 });

    const supabase = supabaseAdmin();

    // Debe existir un usuario (ya creado en register)
    const { data: users, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) return NextResponse.json({ ok: false, error: "No se pudo validar usuario." }, { status: 500 });
    const u = users?.users?.find((x) => (x.email || "").toLowerCase() === email);
    if (!u) return NextResponse.json({ ok: false, error: "Usuario no encontrado. Regístrate primero." }, { status: 404 });

    const code = genCode6();
    const pepper = clean(process.env.OTP_PEPPER || "dev_pepper");
    const codeHash = sha256(`${email}:${code}:${pepper}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpErr } = await supabase
      .from("email_otps")
      .upsert({ email, user_id: u.id, code_hash: codeHash, expires_at: expiresAt, attempts: 0 }, { onConflict: "email" });

    if (otpErr) return NextResponse.json({ ok: false, error: "No se pudo regenerar OTP." }, { status: 500 });

    await sendOtpEmail({ to: email, code });

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "RESEND_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
