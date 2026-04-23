import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim();
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

async function requireUser(req: NextRequest) {
  const token = getBearerToken(req);

  if (!token) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  const payload = await verifyAccessToken(token).catch(() => null);

  if (!payload) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  const userId = clean((payload as any)?.sub || (payload as any)?.id);
  const email = clean((payload as any)?.email).toLowerCase();

  if (!userId || !email) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { ok: false, error: "Invalid token payload" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }

  return {
    ok: true as const,
    userId,
    email,
  };
}

function pickProfile(body: any) {
  const profile = body?.profile && typeof body.profile === "object" ? body.profile : body || {};

  const fullName = clean(
    profile.fullName ||
      profile.full_name ||
      profile.name ||
      profile.nombre ||
      body?.fullName ||
      body?.name
  );

  const documentType = clean(
    profile.documentType ||
      profile.document_type ||
      profile.tipoDocumento ||
      profile.tipo_documento ||
      body?.documentType
  ).toUpperCase();

  const documentNumber = clean(
    profile.documentNumber ||
      profile.document_number ||
      profile.numeroDocumento ||
      profile.numero_documento ||
      profile.document ||
      body?.documentNumber
  );

  const phone = clean(
    profile.phone ||
      profile.telefono ||
      profile.mobile ||
      profile.celular ||
      body?.phone
  );

  const city = clean(
    profile.city ||
      profile.ciudad ||
      profile.municipality ||
      profile.municipio ||
      body?.city
  );

  const region = clean(
    profile.region ||
      profile.departamento ||
      profile.state ||
      profile.province ||
      body?.region
  );

  const addressLine1 = clean(
    profile.addressLine1 ||
      profile.address ||
      profile.direccion ||
      profile.street ||
      body?.addressLine1
  );

  const notes = clean(profile.notes || profile.notas || body?.notes);

  return {
    fullName,
    name: fullName,
    documentType: documentType || "CC",
    document_type: documentType || "CC",
    documentNumber,
    document_number: documentNumber,
    phone,
    telefono: phone,
    city,
    ciudad: city,
    region,
    departamento: region,
    addressLine1,
    address: addressLine1,
    direccion: addressLine1,
    country: "CO",
    notes,
    updatedAt: new Date().toISOString(),
  };
}

function validateProfile(profile: ReturnType<typeof pickProfile>) {
  if (!profile.fullName) return "Nombre completo requerido.";
  if (!profile.documentType) return "Tipo de documento requerido.";
  if (!profile.documentNumber) return "Número de documento requerido.";
  if (!profile.phone) return "Teléfono requerido.";
  if (!profile.city) return "Ciudad requerida.";
  if (!profile.region) return "Región/departamento requerido.";
  if (!profile.addressLine1) return "Dirección requerida.";

  const phoneDigits = profile.phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return "Teléfono inválido. Debe tener entre 7 y 15 dígitos.";
  }

  if (!/^[A-Za-z0-9.\-]{5,30}$/.test(profile.documentNumber)) {
    return "Número de documento inválido.";
  }

  return "";
}

export async function GET(req: NextRequest) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.res;

  try {
    const admin = supabaseAdmin();

    const { data, error } = await admin
      .from("user_registry")
      .select("user_id,email,name,profile,email_verified,verified_at")
      .eq("user_id", gate.userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: gate.userId,
          email: data?.email || gate.email,
          name: data?.name || null,
          profile: data?.profile || null,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Profile GET error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.res;

  try {
    const body = await req.json().catch(() => ({}));
    const profile = pickProfile(body);
    const validationError = validateProfile(profile);

    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const admin = supabaseAdmin();

    const { data: existing } = await admin
      .from("user_registry")
      .select("profile")
      .eq("user_id", gate.userId)
      .maybeSingle();

    const previousProfile =
      existing?.profile && typeof existing.profile === "object"
        ? existing.profile
        : {};

    const nextProfile = {
      ...previousProfile,
      ...profile,
    };

    const { data, error } = await admin
      .from("user_registry")
      .upsert(
        {
          user_id: gate.userId,
          email: gate.email,
          name: profile.fullName,
          profile: nextProfile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("user_id,email,name,profile")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: gate.userId,
          email: data?.email || gate.email,
          name: data?.name || profile.fullName,
          profile: data?.profile || nextProfile,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Profile save error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}