// app/api/private/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Next 16: cookies() es async
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) return bad("No auth", 401);

    // ✅ Valida token
    await verifyAccessToken(at);

    const body = await req.json().catch(() => ({}));

    return NextResponse.json(
      { ok: true, data: body ?? {} },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Onboarding error";
    return bad(msg, 500);
  }
}