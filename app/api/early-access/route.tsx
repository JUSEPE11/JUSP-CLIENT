// app/api/early-access/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  const v = (email || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
}

function json(data: any, status = 200) {
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
    const email = String(body?.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return json({ ok: false, error: "INVALID_EMAIL" }, 400);
    }

    // Anti-abuso básico (barato y efectivo):
    // Bloquea cosas obvias y limita payload.
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

    const webhook = process.env.EARLY_ACCESS_WEBHOOK_URL;

    if (webhook) {
      // Envío a webhook (Make/Zapier/n8n/tu backend)
      const r = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        // No rompemos UX; devolvemos OK pero marcamos que falló el forward
        // (en prod tú lo verás en logs)
        console.error("[early-access] webhook failed", r.status);
        return json({ ok: true, forwarded: false });
      }

      return json({ ok: true, forwarded: true });
    }

    // Sin webhook: igual OK (y log en dev)
    console.log("[early-access] lead", payload);
    return json({ ok: true, forwarded: false });
  } catch (err) {
    console.error("[early-access] error", err);
    return json({ ok: false, error: "SERVER_ERROR" }, 500);
  }
}