/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { addFavorite, removeFavorite } from "@/lib/favoritesRepo";

export const runtime = "nodejs";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const productId = String(body?.productId || "").trim();
    const sessionId = String(body?.sessionId || "").trim();
    const active = Boolean(body?.active);

    if (!productId) return bad("productId requerido");
    if (!sessionId) return bad("sessionId requerido");

    if (active) {
      await addFavorite(productId, sessionId);
    } else {
      await removeFavorite(productId, sessionId);
    }

    return NextResponse.json(
      {
        ok: true,
        productId,
        active,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error?.message || "No se pudo actualizar favorito"),
      },
      { status: 500 }
    );
  }
}