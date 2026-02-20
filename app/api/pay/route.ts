// app/api/pay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ✅ Next 16: cookies() ES ASYNC
    const cookieStore = await cookies();

    // Si tu lógica necesitaba "getAll" (para pasarlas a otro cliente)
    const all = cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));

    // 👇 Mantengo el comportamiento genérico (no invento integraciones)
    // Si tu endpoint ya armaba el request a un proveedor, aquí tú usas `all`
    // y/o req.json() como lo tengas.
    const body = await req.json().catch(() => ({}));

    return NextResponse.json(
      { ok: true, received: body ?? {}, cookies: all.length },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Pay error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}