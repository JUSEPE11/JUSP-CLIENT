import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ForgotPasswordBody = {
  email?: string;
};

type CanRequestRow = {
  allowed: boolean;
  reason: string;
  email_attempts_15m: number;
  ip_attempts_15m: number;
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

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return null;
}

function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent")?.trim() || null;
}

function genericOk() {
  return NextResponse.json(
    {
      ok: true,
      message:
        "Si existe una cuenta con ese correo, enviaremos un enlace para recuperar la contraseña.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

async function logSecurityEvent(params: {
  email: string;
  eventType: string;
  ip: string | null;
  userAgent: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    const admin = supabaseAdmin();
    await admin.rpc("log_auth_security_event", {
      p_user_id: null,
      p_email: params.email,
      p_event_type: params.eventType,
      p_ip: params.ip,
      p_user_agent: params.userAgent,
      p_meta: params.meta ?? {},
    });
  } catch {
    // No rompemos el flujo por auditoría
  }
}

async function recordResetAttempt(params: {
  email: string;
  ip: string | null;
  userAgent: string | null;
  outcome: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const admin = supabaseAdmin();
    await admin.rpc("record_password_reset_attempt", {
      p_email: params.email,
      p_ip: params.ip,
      p_user_agent: params.userAgent,
      p_outcome: params.outcome,
      p_meta: params.meta ?? {},
    });
  } catch {
    // No rompemos el flujo por auditoría
  }
}

async function canRequestPasswordReset(email: string, ip: string | null) {
  try {
    const admin = supabaseAdmin();

    const { data, error } = await admin.rpc("can_request_password_reset", {
      p_email: email,
      p_ip: ip,
    });

    if (error) {
      return {
        allowed: true,
        reason: "rpc_fallback_allow",
        email_attempts_15m: 0,
        ip_attempts_15m: 0,
      } satisfies CanRequestRow;
    }

    const row = Array.isArray(data) ? (data[0] as CanRequestRow | undefined) : undefined;

    if (!row) {
      return {
        allowed: true,
        reason: "rpc_empty_fallback_allow",
        email_attempts_15m: 0,
        ip_attempts_15m: 0,
      } satisfies CanRequestRow;
    }

    return row;
  } catch {
    return {
      allowed: true,
      reason: "rpc_exception_fallback_allow",
      email_attempts_15m: 0,
      ip_attempts_15m: 0,
    } satisfies CanRequestRow;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ForgotPasswordBody;
    const email = String(body?.email ?? "").trim().toLowerCase();
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

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

    const gate = await canRequestPasswordReset(email, ip);

    if (!gate.allowed) {
      await Promise.allSettled([
        recordResetAttempt({
          email,
          ip,
          userAgent,
          outcome: "rate_limited",
          meta: {
            reason: gate.reason,
            email_attempts_15m: gate.email_attempts_15m,
            ip_attempts_15m: gate.ip_attempts_15m,
          },
        }),
        logSecurityEvent({
          email,
          eventType: "password_reset_rate_limited",
          ip,
          userAgent,
          meta: {
            reason: gate.reason,
            email_attempts_15m: gate.email_attempts_15m,
            ip_attempts_15m: gate.ip_attempts_15m,
          },
        }),
      ]);

      return NextResponse.json(
        {
          ok: false,
          error: "Demasiados intentos. Intenta de nuevo más tarde.",
        },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = await createSupabaseServerClient();
    const redirectTo = `${appUrl()}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      await Promise.allSettled([
        recordResetAttempt({
          email,
          ip,
          userAgent,
          outcome: "supabase_error",
          meta: {
            message: error.message || "unknown_error",
            redirectTo,
          },
        }),
        logSecurityEvent({
          email,
          eventType: "password_reset_request_failed",
          ip,
          userAgent,
          meta: {
            message: error.message || "unknown_error",
            redirectTo,
          },
        }),
      ]);

      return NextResponse.json(
        {
          ok: false,
          error: error.message || "No se pudo enviar el correo de recuperación.",
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    await Promise.allSettled([
      recordResetAttempt({
        email,
        ip,
        userAgent,
        outcome: "accepted",
        meta: {
          redirectTo,
        },
      }),
      logSecurityEvent({
        email,
        eventType: "password_reset_requested",
        ip,
        userAgent,
        meta: {
          redirectTo,
        },
      }),
    ]);

    return genericOk();
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo procesar la solicitud." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}