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

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const answer = cleanString(body?.answer);
    const filter = cleanString(body?.filter || "all", 40);
    const source = cleanString(body?.source || "home", 40);
    const answeredAt = Number(body?.answeredAt);

    if (!VALID_HOME_SURVEY_OPTIONS.has(answer)) {
      return noStoreJson(
        { ok: false, error: "Respuesta de encuesta invalida." },
        400
      );
    }

    try {
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

      if (error) {
        console.error("[api/survey] Supabase insert error:", error);
      }
    } catch (error) {
      console.error("[api/survey] Supabase runtime error:", error);
    }

    return noStoreJson({ ok: true }, 200);
  } catch (error) {
    console.error("[api/survey] Fatal error:", error);

    return noStoreJson(
      { ok: false, error: "No se pudo registrar la encuesta." },
      500
    );
  }
}