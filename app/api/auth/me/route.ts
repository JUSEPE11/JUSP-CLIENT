// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_AT, COOKIE_PROFILE, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function isObject(x: any) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export async function GET() {
  try {
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // ✅ Validar token y extraer sub/email si el verifier devuelve payload
    let decoded: any = null;
    try {
      decoded = await verifyAccessToken(at);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const rawProfile = store.get(COOKIE_PROFILE)?.value;
    if (!rawProfile) {
      return NextResponse.json({ ok: false, error: "No profile" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(safeDecode(rawProfile));
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid profile" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    // ✅ NORMALIZAR SI LA COOKIE VIENE "PLANA" (ej: {segment, interests,...})
    // Tu UI necesita: user.profile
    const userId = decoded?.sub ? String(decoded.sub) : null;
    const email = decoded?.email ? String(decoded.email).toLowerCase() : null;

    let outUser: any;

    if (isObject(parsed) && ("id" in parsed || "email" in parsed || "profile" in parsed)) {
      // Ya viene con shape wrapper
      outUser = {
        id: parsed.id ?? userId,
        email: parsed.email ?? email,
        name: parsed.name ?? null,
        profile: parsed.profile ?? null,
      };
    } else {
      // Cookie plana => la guardamos dentro de profile
      outUser = {
        id: userId,
        email,
        name: null,
        profile: parsed,
      };
    }

    return NextResponse.json({ ok: true, user: outUser }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}