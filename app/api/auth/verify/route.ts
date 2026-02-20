// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string) {
  return (v || "").trim();
}

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function onlyDigits6(s: string) {
  return clean(s).replace(/\D/g, "").slice(0, 6);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body?.email).toLowerCase();
    const code = onlyDigits6(body?.code);

    if (!email) return NextResponse.json({ ok: false, error: "Email requerido." }, { status: 400 });
    if (code.length !== 6) return NextResponse.json({ ok: false, error: "Código inválido." }, { status: 400 });

    const supabase = supabaseAdmin();

    const { data, error } = await supabase.from("email_otps").select("*").eq("email", email).maybeSingle();

    if (error || !data) return NextResponse.json({ ok: false, error: "OTP no encontrado. Reenvía el código." }, { status: 404 });

    const expiresAt = new Date(data.expires_at).getTime();
    if (!expiresAt || Date.now() > expiresAt) {
      await supabase.from("email_otps").delete().eq("email", email);
      return NextResponse.json({ ok: false, error: "Código expirado. Reenvía el código." }, { status: 410 });
    }

    const attempts = Number(data.attempts || 0);
    if (attempts >= 8) {
      await supabase.from("email_otps").delete().eq("email", email);
      return NextResponse.json({ ok: false, error: "Demasiados intentos. Reenvía el código." }, { status: 429 });
    }

    const pepper = clean(process.env.OTP_PEPPER || "dev_pepper");
    const expected = String(data.code_hash || "");
    const got = sha256(`${email}:${code}:${pepper}`);

    if (got !== expected) {
      await supabase.from("email_otps").update({ attempts: attempts + 1 }).eq("email", email);
      return NextResponse.json({ ok: false, error: "Código incorrecto." }, { status: 401 });
    }

    // ✅ Confirmar email en Supabase Auth
    const userId = String(data.user_id || "");
    if (!userId) return NextResponse.json({ ok: false, error: "OTP corrupto (sin user_id)." }, { status: 500 });

    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
    if (updErr) {
      return NextResponse.json({ ok: false, error: "No se pudo confirmar el correo (admin)." }, { status: 500 });
    }

    // ✅ limpiar OTP
    await supabase.from("email_otps").delete().eq("email", email);

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "VERIFY_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
