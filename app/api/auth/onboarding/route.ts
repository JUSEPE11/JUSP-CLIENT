// app/api/auth/onboarding/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  COOKIE_AT,
  verifyAccessToken,
  profileCookie,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, any>;

function encodeProfile(profile: any) {
  return encodeURIComponent(JSON.stringify(profile ?? {}));
}

function safeEmailName(email: string) {
  const base = String(email || "").split("@")[0] || "Usuario";
  return base.slice(0, 40);
}

function normalizeString(value: unknown, max = 120) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function uniqueNormalizedStrings(input: unknown, maxItems: number, maxLen = 40) {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of input) {
    const value = normalizeString(item, maxLen);
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(value);

    if (out.length >= maxItems) break;
  }

  return out;
}

function normalizeSegment(value: unknown) {
  const v = normalizeString(value, 20).toLowerCase();
  if (v === "hombre" || v === "mujer" || v === "niños" || v === "ninos") {
    return v === "ninos" ? "niños" : v;
  }
  return undefined;
}

function sanitizeProfile(input: unknown): JsonRecord {
  const src = input && typeof input === "object" && !Array.isArray(input)
    ? (input as JsonRecord)
    : {};

  const segment = normalizeSegment(src.segment);
  const interests = uniqueNormalizedStrings(src.interests, 7, 40);
  const brands = uniqueNormalizedStrings(src.brands, 8, 40);
  const sizes = uniqueNormalizedStrings(src.sizes, 3, 20);
  const colors = uniqueNormalizedStrings(src.colors, 3, 30);
  const vibe = normalizeString(src.vibe, 40);

  const clean: JsonRecord = {};

  if (segment) clean.segment = segment;
  if (interests.length) clean.interests = interests;
  if (brands.length) clean.brands = brands;
  if (sizes.length) {
    clean.size = sizes[0];
    clean.sizes = sizes;
  }
  if (colors.length) clean.colors = colors;
  if (vibe) clean.vibe = vibe;

  return clean;
}

function mergeProfiles(existingProfile: unknown, incomingProfile: JsonRecord): JsonRecord {
  const base =
    existingProfile && typeof existingProfile === "object" && !Array.isArray(existingProfile)
      ? { ...(existingProfile as JsonRecord) }
      : {};

  return {
    ...base,
    ...incomingProfile,
  };
}

export async function POST(req: Request) {
  try {
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json(
        { ok: false, error: "No session" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const decoded: any = await verifyAccessToken(at);

    const userId = decoded?.sub ? String(decoded.sub).trim() : "";
    const email = decoded?.email ? String(decoded.email).trim().toLowerCase() : "";

    if (!userId || !email) {
      return NextResponse.json(
        { ok: false, error: "Invalid session payload" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawProfile = body?.profile ?? body ?? {};
    const incomingProfile = sanitizeProfile(rawProfile);

    const nameFromBody =
      rawProfile &&
      typeof rawProfile === "object" &&
      typeof (rawProfile as JsonRecord).name === "string"
        ? normalizeString((rawProfile as JsonRecord).name, 80)
        : "";

    const safeName = nameFromBody || safeEmailName(email);
    const admin = supabaseAdmin();

    const { data: existingUser, error: findErr } = await admin
      .from("user_registry")
      .select("user_id, email, name, profile")
      .eq("email", email)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json(
        { ok: false, error: findErr.message || "DB read error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (existingUser) {
      const existingUserId = String(existingUser.user_id || "").trim();

      // Blindaje: si hay mismatch de identidad, no pisar user_id.
      if (existingUserId && existingUserId !== userId) {
        return NextResponse.json(
          {
            ok: false,
            error: "Identity mismatch in user_registry. Existing email belongs to a different user_id.",
          },
          { status: 409, headers: { "Cache-Control": "no-store" } }
        );
      }

      const mergedProfile = mergeProfiles(existingUser.profile, incomingProfile);

      const { error: updateErr } = await admin
        .from("user_registry")
        .update({
          name: safeName,
          profile: mergedProfile,
        })
        .eq("email", email);

      if (updateErr) {
        return NextResponse.json(
          { ok: false, error: updateErr.message || "DB update error" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        );
      }

      const value = encodeProfile(mergedProfile);
      const res = NextResponse.json(
        { ok: true, mode: "updated" },
        { status: 200 }
      );

      res.cookies.set(profileCookie(value));
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const { error: insertErr } = await admin
      .from("user_registry")
      .insert({
        user_id: userId,
        email,
        name: safeName,
        profile: incomingProfile,
      });

    if (insertErr) {
      return NextResponse.json(
        { ok: false, error: insertErr.message || "DB insert error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const value = encodeProfile(incomingProfile);
    const res = NextResponse.json(
      { ok: true, mode: "inserted" },
      { status: 200 }
    );

    res.cookies.set(profileCookie(value));
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Onboarding error";

    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}