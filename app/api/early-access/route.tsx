import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

type WaitlistStatus = "waiting" | "activated" | "rejected";

type WaitlistRow = {
  id: string;
  email: string;
  source: string;
  ip: string | null;
  user_agent: string | null;
  status: WaitlistStatus;
  created_at: string;
  activated_at: string | null;
  notes: string | null;
};

function isValidEmail(email: string) {
  const v = (email || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function getExistingLead(email: string) {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("early_access_waitlist")
    .select("*")
    .eq("email", email)
    .maybeSingle<WaitlistRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function getWaitingQueueStats(email: string) {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("early_access_waitlist")
    .select("id,email,status,created_at")
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = data || [];
  const total = rows.length;

  const index = rows.findIndex((row) => String(row.email).toLowerCase() === email);
  const position = index >= 0 ? index + 1 : null;

  return { total, position };
}

function buildSuccessMessage(status: WaitlistStatus, alreadyJoined: boolean, position: number | null) {
  if (status === "activated") {
    return "Tu acceso ya fue activado.";
  }

  if (status === "rejected") {
    return "Tu solicitud fue revisada. Si necesitas ayuda, escríbenos.";
  }

  if (alreadyJoined) {
    return position
      ? `Ya estabas en lista. Tu posición actual es #${position}.`
      : "Ya estabas en la lista de espera.";
  }

  return position
    ? `Listo. Entraste a la lista en la posición #${position}.`
    : "Listo. Entraste a la lista de espera.";
}

async function sendEarlyAccessEmail(payload: {
  email: string;
  source: string;
  ts: string;
  ip: string;
  ua: string;
  status: WaitlistStatus;
  position: number | null;
  total: number;
  alreadyJoined: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "JUSP <no-reply@jusp.com>";
  const to = process.env.EARLY_ACCESS_TO_EMAIL || "contacto@juspco.com";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY_MISSING");
  }

  const safe = (value: string) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const subject = payload.alreadyJoined
    ? "JUSP Early Access — Email ya existente en waitlist"
    : "JUSP Early Access — Nueva solicitud";

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5; color:#111">
      <h2 style="margin:0 0 12px 0">${
        payload.alreadyJoined ? "Early Access ya existente" : "Nueva solicitud de Early Access"
      }</h2>

      <p style="margin:0 0 8px 0"><strong>Email:</strong> ${safe(payload.email)}</p>
      <p style="margin:0 0 8px 0"><strong>Estado:</strong> ${safe(payload.status)}</p>
      <p style="margin:0 0 8px 0"><strong>Posición:</strong> ${
        payload.position ?? "N/A"
      }</p>
      <p style="margin:0 0 8px 0"><strong>Total waiting:</strong> ${payload.total}</p>
      <p style="margin:0 0 8px 0"><strong>Source:</strong> ${safe(payload.source)}</p>
      <p style="margin:0 0 8px 0"><strong>Timestamp:</strong> ${safe(payload.ts)}</p>
      <p style="margin:0 0 8px 0"><strong>IP:</strong> ${safe(payload.ip)}</p>
      <p style="margin:0 0 8px 0"><strong>User-Agent:</strong> ${safe(payload.ua)}</p>

      <p style="margin:16px 0 0 0; color:#555; font-size:12px">
        Solicitud enviada automáticamente desde /early-access.
      </p>
    </div>
  `;

  const text = [
    payload.alreadyJoined
      ? "Early Access ya existente"
      : "Nueva solicitud de Early Access",
    "",
    `Email: ${payload.email}`,
    `Estado: ${payload.status}`,
    `Posición: ${payload.position ?? "N/A"}`,
    `Total waiting: ${payload.total}`,
    `Source: ${payload.source}`,
    `Timestamp: ${payload.ts}`,
    `IP: ${payload.ip}`,
    `User-Agent: ${payload.ua}`,
    "",
    "Solicitud enviada automáticamente desde /early-access.",
  ].join("\n");

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject,
      html,
      text,
    }),
  });

  if (!resendRes.ok) {
    const txt = await resendRes.text().catch(() => "");
    throw new Error(`RESEND_FAILED_${resendRes.status}: ${txt}`);
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return json({ ok: false, error: "INVALID_CONTENT_TYPE" }, 415);
    }

    const body = await req.json().catch(() => null);
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!isValidEmail(email)) {
      return json({ ok: false, error: "INVALID_EMAIL" }, 400);
    }

    if (email.length > 180) {
      return json({ ok: false, error: "EMAIL_TOO_LONG" }, 400);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const payload = {
      email,
      source: String(body?.source || "early-access"),
      ts: new Date().toISOString(),
      ip,
      ua: String(req.headers.get("user-agent") || ""),
    };

    let existing = await getExistingLead(email);
    let alreadyJoined = false;

    if (!existing) {
      const sb = supabaseAdmin();

      const { error: insertError } = await sb.from("early_access_waitlist").insert({
        email: payload.email,
        source: payload.source,
        ip: payload.ip,
        user_agent: payload.ua,
        status: "waiting",
      });

      if (insertError) {
        if (String(insertError.message || "").toLowerCase().includes("duplicate")) {
          existing = await getExistingLead(email);
          alreadyJoined = true;
        } else {
          console.error("[early-access] insert error", insertError);
          return json({ ok: false, error: "DB_INSERT_FAILED" }, 500);
        }
      } else {
        existing = await getExistingLead(email);
      }
    } else {
      alreadyJoined = true;
    }

    if (!existing) {
      return json({ ok: false, error: "WAITLIST_LOOKUP_FAILED" }, 500);
    }

    const stats =
      existing.status === "waiting"
        ? await getWaitingQueueStats(email)
        : { total: 0, position: null };

    await sendEarlyAccessEmail({
      email: payload.email,
      source: payload.source,
      ts: payload.ts,
      ip: payload.ip,
      ua: payload.ua,
      status: existing.status,
      position: stats.position,
      total: stats.total,
      alreadyJoined,
    });

    return json({
      ok: true,
      alreadyJoined,
      status: existing.status,
      position: stats.position,
      total: stats.total,
      message: buildSuccessMessage(existing.status, alreadyJoined, stats.position),
    });
  } catch (err) {
    console.error("[early-access] error", err);
    return json({ ok: false, error: "SERVER_ERROR" }, 500);
  }
}