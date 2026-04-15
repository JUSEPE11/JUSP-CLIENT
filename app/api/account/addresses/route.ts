import { NextRequest, NextResponse } from "next/server";
import {
  deleteSavedAddressForIdentity,
  listSavedAddressesForIdentity,
  requireAddressIdentity,
  upsertSavedAddressForIdentity,
} from "@/lib/addressBook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "No session" },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  const identity = await requireAddressIdentity(req);
  if (!identity) return unauthorized();

  try {
    const addresses = await listSavedAddressesForIdentity(identity);
    return NextResponse.json(
      { ok: true, addresses },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "No se pudieron cargar las direcciones." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: NextRequest) {
  const identity = await requireAddressIdentity(req);
  if (!identity) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const address = await upsertSavedAddressForIdentity(identity, body || {});
    const addresses = await listSavedAddressesForIdentity(identity);

    return NextResponse.json(
      { ok: true, address, addresses },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "No se pudo guardar la direccion." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const identity = await requireAddressIdentity(req);
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

    await deleteSavedAddressForIdentity(identity, id);
    const addresses = await listSavedAddressesForIdentity(identity);

    return NextResponse.json(
      { ok: true, addresses },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "No se pudo eliminar la direccion." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
