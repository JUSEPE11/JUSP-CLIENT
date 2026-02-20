// app/api/marketing/subscribe/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isEmailLike(v: string) {
  const s = (v || "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ ok: false, error: "Server not configured." }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();

    if (!isEmailLike(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
    }

    const source = body?.source ? String(body.source).slice(0, 80) : null;

    // UTM opcionales
    const utm_source = body?.utm_source ? String(body.utm_source).slice(0, 120) : null;
    const utm_medium = body?.utm_medium ? String(body.utm_medium).slice(0, 120) : null;
    const utm_campaign = body?.utm_campaign ? String(body.utm_campaign).slice(0, 120) : null;
    const utm_content = body?.utm_content ? String(body.utm_content).slice(0, 120) : null;
    const utm_term = body?.utm_term ? String(body.utm_term).slice(0, 120) : null;

    const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { error } = await sb
      .from("newsletter_subscribers")
      .upsert(
        [
          {
            email,
            status: "subscribed",
            unsubscribed_at: null,
            source,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            utm_term,
          },
        ],
        { onConflict: "email" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: "No se pudo suscribir." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
}
