// app/api/auth/onboarding/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { COOKIE_AT, verifyAccessToken, profileCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse(v: any) {
  try {
    if (typeof v === "string") return JSON.parse(v);
    return v;
  } catch {
    return v;
  }
}

function encodeProfileCookie(sessionUser: any) {
  return encodeURIComponent(JSON.stringify(sessionUser ?? {}));
}

function cleanIncomingProfile(input: any) {
  const p = safeJsonParse(input) ?? {};
  // dejamos solo lo que tu UI manda (y lo que es común en perfil)
  const segment = typeof p.segment === "string" ? p.segment : undefined;
  const interests = Array.isArray(p.interests) ? p.interests.filter((x: any) => typeof x === "string").slice(0, 7) : undefined;
  const size = typeof p.size === "string" ? p.size : undefined;
  const sizes = Array.isArray(p.sizes) ? p.sizes.filter((x: any) => typeof x === "string").slice(0, 3) : undefined;
  const colors = Array.isArray(p.colors) ? p.colors.filter((x: any) => typeof x === "string").slice(0, 3) : undefined;
  const brands = Array.isArray(p.brands) ? p.brands.filter((x: any) => typeof x === "string").slice(0, 8) : undefined;
  const vibe = typeof p.vibe === "string" ? p.vibe.slice(0, 40) : undefined;

  // payload final (no incluye undefined)
  const out: any = {};
  if (segment) out.segment = segment;
  if (interests) out.interests = interests;
  if (size) out.size = size;
  if (sizes) out.sizes = sizes;
  if (colors) out.colors = colors;
  if (brands) out.brands = brands;
  if (vibe) out.vibe = vibe;
  return out;
}

async function upsertProfileForUser(userId: string, incoming: any) {
  const admin = supabaseAdmin();

  // Tablas candidatas (por si tu proyecto ya tiene una)
  const tables = ["profiles", "user_profiles", "customer_profiles", "user_profile", "users_profile"];

  // Intentos de payload (por si la tabla guarda columnas sueltas o un JSONB)
  const candidateRows: any[] = [
    { id: userId, ...incoming }, // columnas sueltas
    { id: userId, profile: incoming }, // jsonb profile
    { id: userId, data: incoming }, // jsonb data
    { id: userId, payload: incoming }, // jsonb payload
  ];

  let lastError: any = null;

  for (const table of tables) {
    for (const row of candidateRows) {
      try {
        const { data, error } = await admin.from(table).upsert(row, { onConflict: "id" }).select("*").maybeSingle();
        if (!error) {
          // data puede ser null si la tabla no retorna, pero upsert fue ok
          return { table, row: data ?? row };
        }
        lastError = error;
      } catch (e) {
        lastError = e;
      }
    }
  }

  // Si no se pudo persistir en ninguna tabla
  throw new Error(
    typeof (lastError as any)?.message === "string"
      ? (lastError as any).message
      : "No se pudo guardar el perfil en DB (no se encontró tabla/estructura compatible)."
  );
}

export async function POST(req: Request) {
  try {
    // ✅ Gate: requiere sesión (cookie HttpOnly)
    const store = await cookies();
    const at = store.get(COOKIE_AT)?.value;

    if (!at) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // ✅ Valida token y obtenemos payload
    const payload: any = await verifyAccessToken(at);
    const userId = String(payload?.sub || "").trim();
    const email = typeof payload?.email === "string" ? payload.email : null;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const body = await req.json().catch(() => ({}));
    const incomingRaw = body?.profile ?? body ?? {};
    const incomingProfile = cleanIncomingProfile(incomingRaw);

    // ✅ Persistencia REAL: guardar en DB (para siempre)
    const saved = await upsertProfileForUser(userId, incomingProfile);

    // ✅ Cookie para que /api/auth/me + Header reflejen inmediatamente
    const sessionUser = {
      id: userId,
      email,
      name: null,
      profile: incomingProfile, // para UI esto es lo importante (ya no null)
    };

    const res = NextResponse.json(
      { ok: true, saved: true, table: saved.table },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    res.cookies.set(profileCookie(encodeProfileCookie(sessionUser)));
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Onboarding error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}