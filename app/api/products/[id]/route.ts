// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeId(raw: unknown) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = String(v ?? "").trim();
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = normalizeId(rawId);

    if (!id) {
      return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
    }

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(product, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
