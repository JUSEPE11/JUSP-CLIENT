import { NextRequest, NextResponse } from "next/server";
import {
  deleteSavedPaymentMethodForIdentity,
  listSavedPaymentMethodsForIdentity,
  requirePaymentIdentity,
  upsertSavedPaymentMethodForIdentity,
} from "@/lib/paymentMethods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "No session" },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  const identity = await requirePaymentIdentity(req);
  if (!identity) return unauthorized();

  try {
    const paymentMethods = await listSavedPaymentMethodsForIdentity(identity);
    return NextResponse.json(
      { ok: true, paymentMethods },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "No se pudieron cargar los metodos de pago." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: NextRequest) {
  const identity = await requirePaymentIdentity(req);
  if (!identity) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const paymentMethod = await upsertSavedPaymentMethodForIdentity(identity, body || {});
    const paymentMethods = await listSavedPaymentMethodsForIdentity(identity);

    return NextResponse.json(
      { ok: true, paymentMethod, paymentMethods },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "No se pudo guardar el metodo de pago." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const identity = await requirePaymentIdentity(req);
  if (!identity) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "").trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta id." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    await deleteSavedPaymentMethodForIdentity(identity, id);
    const paymentMethods = await listSavedPaymentMethodsForIdentity(identity);

    return NextResponse.json(
      { ok: true, paymentMethods },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "No se pudo eliminar el metodo de pago." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
