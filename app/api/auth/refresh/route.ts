// app/api/auth/refresh/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Refresh not implemented" },
    { status: 501 }
  );
}