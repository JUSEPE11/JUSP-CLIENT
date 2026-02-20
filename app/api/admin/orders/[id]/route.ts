// app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, serviceRole);
}

/* =========================
   GET — Obtener orden por ID (admin)
========================= */

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = normalizeId(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const res = NextResponse.json(
      { ok: true, order: data },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH — Actualizar orden (admin)
   ✅ Compatible con Next 16
========================= */

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = normalizeId(rawId);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .update(body)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const res = NextResponse.json(
      { ok: true, order: data },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}