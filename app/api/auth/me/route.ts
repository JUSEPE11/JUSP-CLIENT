import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_AT, COOKIE_PROFILE, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function isObject(x: unknown) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export async function GET() {
  try {
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return noStoreJson({
        ok: false,
        user: null,
        authenticated: false,
        error: "No session",
      });
    }

    let decoded: any = null;

    try {
      decoded = await verifyAccessToken(at);
    } catch {
      return noStoreJson({
        ok: false,
        user: null,
        authenticated: false,
        error: "Invalid session",
      });
    }

    const rawProfile = store.get(COOKIE_PROFILE)?.value;

    if (!rawProfile) {
      return noStoreJson({
        ok: true,
        authenticated: true,
        user: {
          id: decoded?.sub ? String(decoded.sub) : null,
          email: decoded?.email ? String(decoded.email).toLowerCase() : null,
          name: null,
          profile: null,
        },
      });
    }

    let parsed: any = null;

    try {
      parsed = JSON.parse(safeDecode(rawProfile));
    } catch {
      parsed = null;
    }

    const userId = decoded?.sub ? String(decoded.sub) : null;
    const email = decoded?.email ? String(decoded.email).toLowerCase() : null;

    let outUser: any;

    if (isObject(parsed) && ("id" in parsed || "email" in parsed || "profile" in parsed)) {
      outUser = {
        id: parsed.id ?? userId,
        email: parsed.email ?? email,
        name: parsed.name ?? null,
        profile: parsed.profile ?? null,
      };
    } else {
      outUser = {
        id: userId,
        email,
        name: null,
        profile: parsed,
      };
    }

    return noStoreJson({
      ok: true,
      authenticated: true,
      user: outUser,
    });
  } catch (error) {
    console.error("[api/auth/me] error:", error);

    return noStoreJson({
      ok: false,
      user: null,
      authenticated: false,
      error: "Server error",
    });
  }
}