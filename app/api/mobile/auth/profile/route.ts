import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  deleteSavedAddressForIdentity,
  listSavedAddressesForIdentity,
  upsertSavedAddressForIdentity,
} from "@/lib/addressBook";

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

  return { ok: true as const, userId, email };
}

function pickProfile(body: any) {
  const profile = body?.profile && typeof body.profile === "object" ? body.profile : body || {};

  const id = clean(profile.id || profile.addressId || body?.id || body?.addressId);
  const fullName = clean(profile.fullName || profile.full_name || profile.name || profile.nombre);
  const documentType = clean(profile.documentType || profile.document_type || profile.tipoDocumento).toUpperCase();
  const documentNumber = clean(profile.documentNumber || profile.document_number || profile.numeroDocumento || profile.document);
  const phone = clean(profile.phone || profile.telefono || profile.mobile || profile.celular);
  const municipality = clean(profile.municipality || profile.city || profile.ciudad || profile.municipio);
  const region = clean(profile.region || profile.departamento || profile.state || profile.province);
  const addressLine1 = clean(profile.addressLine1 || profile.address || profile.direccion || profile.street);
  const notes = clean(profile.notes || profile.notas);

  return {
    id,
    fullName,
    name: fullName,
    documentType: documentType || "CC",
    document_type: documentType || "CC",
    documentNumber,
    document_number: documentNumber,
    phone,
    telefono: phone,
    city: municipality,
    ciudad: municipality,
    municipality,
    municipio: municipality,
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
  if (!profile.municipality) return "Ciudad requerida.";
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

function normalizeMobileAddress(address: any) {
  return {
    id: clean(address?.id),
    label: clean(address?.label),
    fullName: clean(address?.fullName),
    email: clean(address?.email).toLowerCase(),
    documentType: clean(address?.documentType).toUpperCase(),
    documentNumber: clean(address?.documentNumber),
    phone: clean(address?.phone),
    city: clean(address?.municipality || address?.city),
    municipality: clean(address?.municipality || address?.city),
    region: clean(address?.region),
    addressLine1: clean(address?.addressLine1),
    country: "CO",
    notes: clean(address?.notes),
    isDefault: false,
    createdAt: address?.createdAt || null,
    updatedAt: address?.updatedAt || null,
  };
}

async function buildUserResponse(params: {
  userId: string;
  email: string;
  name: string | null;
  profile: any;
}) {
  const savedAddressesRaw = await listSavedAddressesForIdentity({
    userId: params.userId,
    email: params.email,
  });

  const savedAddresses = savedAddressesRaw.map((address, index) => ({
    ...normalizeMobileAddress(address),
    isDefault: index === 0,
  }));

  const defaultAddress = savedAddresses[0] || null;

  const mergedProfile =
    params.profile && typeof params.profile === "object"
      ? {
          ...params.profile,
          savedAddresses,
          defaultAddress,
        }
      : {
          savedAddresses,
          defaultAddress,
        };

  return {
    id: params.userId,
    email: params.email,
    name: params.name || null,
    profile: mergedProfile,
    savedAddresses,
    defaultAddress,
  };
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

    const user = await buildUserResponse({
      userId: gate.userId,
      email: data?.email || gate.email,
      name: data?.name || null,
      profile: data?.profile || null,
    });

    return NextResponse.json(
      { ok: true, user },
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

    const savedAddress = await upsertSavedAddressForIdentity(
      {
        userId: gate.userId,
        email: gate.email,
      },
      {
        id: profile.id || undefined,
        label: `${profile.fullName} - ${profile.municipality}`,
        fullName: profile.fullName,
        email: gate.email,
        documentType: profile.documentType,
        documentNumber: profile.documentNumber,
        phone: profile.phone,
        municipality: profile.municipality,
        region: profile.region,
        addressLine1: profile.addressLine1,
        notes: profile.notes,
      }
    );

    const nextProfile = {
      ...previousProfile,
      ...profile,
      defaultAddress: savedAddress,
      lastSavedAddress: savedAddress,
    };

    const { data, error } = await admin
      .from("user_registry")
      .upsert(
        {
          user_id: gate.userId,
          email: gate.email,
          name: profile.fullName,
          profile: nextProfile,
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

    const user = await buildUserResponse({
      userId: gate.userId,
      email: data?.email || gate.email,
      name: data?.name || profile.fullName,
      profile: data?.profile || nextProfile,
    });

    return NextResponse.json(
      { ok: true, user },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Profile save error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.res;

  try {
    const body = await req.json().catch(() => ({}));
    const addressId = clean(body?.addressId || body?.id);

    if (!addressId) {
      return NextResponse.json(
        { ok: false, error: "addressId requerido." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    await deleteSavedAddressForIdentity(
      {
        userId: gate.userId,
        email: gate.email,
      },
      addressId
    );

    const admin = supabaseAdmin();

    const { data } = await admin
      .from("user_registry")
      .select("user_id,email,name,profile")
      .eq("user_id", gate.userId)
      .maybeSingle();

    const user = await buildUserResponse({
      userId: gate.userId,
      email: data?.email || gate.email,
      name: data?.name || null,
      profile: data?.profile || null,
    });

    return NextResponse.json(
      { ok: true, user },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Profile delete error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}