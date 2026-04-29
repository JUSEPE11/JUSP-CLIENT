import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_HOME_SURVEY_OPTIONS = new Set([
  "Muy satisfecho",
  "Bastante satisfecho",
  "Generalmente satisfecho",
  "No muy satisfecho",
  "Muy insatisfecho",
]);

function cleanString(value: unknown, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const answer = cleanString(body?.answer);
    const filter = cleanString(body?.filter || "all", 40);
    const source = cleanString(body?.source || "home", 40);
    const answeredAt = Number(body?.answeredAt);

    if (!VALID_HOME_SURVEY_OPTIONS.has(answer)) {
      return NextResponse.json(
        { ok: false, error: "Respuesta de encuesta invalida." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const db = supabaseAdmin();
    const { error } = await db.from("logs").insert({
      level: "info",
      scope: "home_survey",
      message: answer,
      user_email: null,
      meta: {
        answer,
        answered_at: Number.isFinite(answeredAt) ? answeredAt : null,
        filter,
        source,
        page: "/",
        user_agent: cleanString(req.headers.get("user-agent"), 240),
      },
    });

    if (error) throw error;

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo registrar la encuesta." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
