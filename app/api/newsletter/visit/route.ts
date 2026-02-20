// app/api/newsletter/visit/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  // Sin DB a propósito: este endpoint existe para “enganchar” analítica real luego
  // (PostHog/GA/DB/Queue) sin tocar el front.
  try {
    await req.json().catch(() => null);
  } catch {}
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}