// app/api/auth/resend-code/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: any) {
  return String(v || "").trim();
}
function isEmailLike(v: string) {
  const s = clean(v);
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function randomCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function hashCode(code: string) {
  const secret = process.env.EMAIL_CODE_SECRET || "dev_email_code_secret";
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

async function sendEmailCode(opts: { to: string; code: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "JUSP <no-reply@juspco.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY missing");
    return { provider: "dev", sent: false };
  }

  const subject = "Tu nuevo código de verificación JUSP";
  const text = `Tu nuevo código de verificación es: ${opts.code}\n\nExpira en 10 minutos.`;
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5;color:#111">
    <h2 style="margin:0 0 10px 0;">Tu nuevo código</h2>
    <p style="margin:0 0 14px 0;">Usa este código para activar tu cuenta JUSP:</p>
    <div style="display:inline-block;padding:14px 18px;border-radius:14px;background:#111;color:#fff;font-weight:900;letter-spacing:0.22em;font-size:18px;">
      ${opts.code}
    </div>
    <p style="margin:14px 0 0 0;color:#555;">Expira en 10 minutos.</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [opts.to], subject, text, html }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${t}`);
  }
  return { provider: "resend", sent: true };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body?.email).toLowerCase();

    if (!email || !isEmailLike(email)) {
      return NextResponse.json({ ok: false, error: "Correo inválido." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const admin = supabaseAdmin();

    const { data: reg, error: regErr } = await admin.from("user_registry").select("user_id, email_verified").eq("email", email).maybeSingle();
    if (regErr || !reg?.user_id) {
      return NextResponse.json({ ok: false, error: "Ese correo no está registrado." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    if (reg.email_verified) {
      return NextResponse.json({ ok: true, message: "Ya verificado." }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    const code = randomCode6();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: upErr } = await admin.from("email_verification_codes").upsert(
      {
        email,
        user_id: reg.user_id,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
        consumed_at: null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (upErr) {
      return NextResponse.json({ ok: false, error: "DB error (code upsert)." }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    try {
      await sendEmailCode({ to: email, code });
    } catch {
      return NextResponse.json({ ok: false, error: "No se pudo enviar el correo. Intenta más tarde." }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}