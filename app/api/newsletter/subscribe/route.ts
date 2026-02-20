// app/api/newsletter/subscribe/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(status: number, body: any) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function isValidEmail(email: string) {
  const e = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const source = String(body?.source || "unknown").slice(0, 80);

    if (!isValidEmail(email)) return json(400, { ok: false, error: "Email inválido" });

    // ✅ Brevo (Sendinblue) Contacts API
    const apiKey = (process.env.BREVO_API_KEY || "").trim();
    const listId = Number(process.env.BREVO_LIST_ID || 0);

    if (!apiKey || !listId) {
      // modo seguro: no fallar feo en prod sin configuración
      return json(200, {
        ok: true,
        mode: "noop",
        message: "Suscripción OK (modo sin mailer configurado).",
      });
    }

    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-key": apiKey,
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
        attributes: {
          SOURCE: source,
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      // Brevo devuelve 400 si ya existe en algunos casos; con updateEnabled suele ir OK
      return json(500, { ok: false, error: `Mailer error: ${txt || res.status}` });
    }

    return json(200, { ok: true });
  } catch (e: any) {
    return json(500, { ok: false, error: e?.message || "Error" });
  }
}