import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
      ts: String(body?.ts || new Date().toISOString()),
      ip,
      ua: String(body?.ua || req.headers.get("user-agent") || ""),
    };

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "JUSP <no-reply@jusp.com>";
    const to = process.env.EARLY_ACCESS_TO_EMAIL || "contacto@juspco.com";

    if (!apiKey) {
      console.error("[early-access] RESEND_API_KEY missing");
      return json({ ok: false, error: "RESEND_API_KEY_MISSING" }, 500);
    }

    const subject = "JUSP Early Access — Nueva solicitud";

    const safeEmail = payload.email
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const safeSource = payload.source
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const safeTs = payload.ts
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const safeIp = payload.ip
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const safeUa = payload.ua
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5; color:#111">
        <h2 style="margin:0 0 12px 0">Nueva solicitud de Early Access</h2>
        <p style="margin:0 0 8px 0"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0 0 8px 0"><strong>Source:</strong> ${safeSource}</p>
        <p style="margin:0 0 8px 0"><strong>Timestamp:</strong> ${safeTs}</p>
        <p style="margin:0 0 8px 0"><strong>IP:</strong> ${safeIp}</p>
        <p style="margin:0 0 8px 0"><strong>User-Agent:</strong> ${safeUa}</p>

        <p style="margin:16px 0 0 0; color:#555; font-size:12px">
          Solicitud enviada automáticamente desde /early-access.
        </p>
      </div>
    `;

    const text = [
      "Nueva solicitud de Early Access",
      "",
      `Email: ${payload.email}`,
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
      console.error("[early-access] resend failed", resendRes.status, txt);
      return json(
        {
          ok: false,
          error: `RESEND_FAILED_${resendRes.status}`,
        },
        500
      );
    }

    return json({ ok: true, forwarded: true });
  } catch (err) {
    console.error("[early-access] error", err);
    return json({ ok: false, error: "SERVER_ERROR" }, 500);
  }
}