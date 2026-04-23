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

function normalizeAddress(row: any) {
  const fullName = clean(row?.full_name || row?.fullName || row?.name || row?.nombre);
  const email = clean(row?.email || row?.customer_email);
  const documentType = clean(row?.document_type || row?.documentType || row?.tipo_documento).toUpperCase();
  const documentNumber = clean(row?.document_number || row?.documentNumber || row?.documento);
  const phone = clean(row?.phone || row?.telefono || row?.mobile || row?.celular);
  const city = clean(row?.city || row?.municipality || row?.municipio || row?.ciudad);
  const region = clean(row?.region || row?.department || row?.departamento || row?.state);
  const addressLine1 = clean(row?.address_line_1 || row?.addressLine1 || row?.address || row?.direccion);
  const notes = clean(row?.notes || row?.notas || row?.reference || row?.referencia);

  return {
    id: clean(row?.id || row?.address_id || `${city}-${addressLine1}`),
    fullName,
    email,
    documentType,
    documentNumber,
    phone,
    city,
    region,
    addressLine1,
    country: clean(row?.country || "CO").toUpperCase(),
    notes,
    isDefault: Boolean(row?.is_default || row?.isDefault || row?.default),
    createdAt: row?.created_at || row?.createdAt || null,
    updatedAt: row?.updated_at || row?.updatedAt || null,
  };
}

function isUsableAddress(address: any) {
  return Boolean(
    address &&
      address.phone &&
      address.city &&
      address.region &&
      address.addressLine1
  );
}

function mergeUniqueAddresses(addresses: any[]) {
  const map = new Map<string, any>();

  for (const address of addresses.map(normalizeAddress).filter(isUsableAddress)) {
    const key = [
      address.phone,
      address.city,
      address.region,
      address.addressLine1,
      address.documentNumber,
    ]
      .join("|")
      .toLowerCase();

    if (!map.has(key)) {
      map.set(key, address);
    }
  }

  return Array.from(map.values());
}

async function getRegistry(admin: ReturnType<typeof supabaseAdmin>, userId: string, email: string) {
  const byUser = await admin
    .from("user_registry")
    .select("profile,name,email,user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUser.data) return byUser.data;

  const byEmail = await admin
    .from("user_registry")
    .select("profile,name,email,user_id")
    .eq("email", email)
    .maybeSingle();

  return byEmail.data || null;
}

async function safeReadAddresses(params: {
  admin: ReturnType<typeof supabaseAdmin>;
  table: string;
  userId: string;
  email: string;
}) {
  const { admin, table, userId, email } = params;

  const results: any[] = [];

  try {
    const byUser = await admin
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (Array.isArray(byUser.data)) results.push(...byUser.data);
  } catch {}

  try {
    const byEmail = await admin
      .from(table)
      .select("*")
      .eq("email", email)
      .order("updated_at", { ascending: false });

    if (Array.isArray(byEmail.data)) results.push(...byEmail.data);
  } catch {}

  try {
    const byCustomerEmail = await admin
      .from(table)
      .select("*")
      .eq("customer_email", email)
      .order("updated_at", { ascending: false });

    if (Array.isArray(byCustomerEmail.data)) results.push(...byCustomerEmail.data);
  } catch {}

  return results;
}

function addressFromProfile(profile: any, email: string) {
  if (!profile || typeof profile !== "object") return null;

  const address = normalizeAddress({
    ...profile,
    email: profile.email || email,
    fullName: profile.fullName || profile.full_name || profile.name || profile.nombre,
    documentType: profile.documentType || profile.document_type,
    documentNumber: profile.documentNumber || profile.document_number,
    addressLine1: profile.addressLine1 || profile.address || profile.direccion,
  });

  return isUsableAddress(address) ? address : null;
}

async function getSavedAddresses(params: {
  admin: ReturnType<typeof supabaseAdmin>;
  userId: string;
  email: string;
  profile: any;
}) {
  const { admin, userId, email, profile } = params;

  const possibleTables = [
    "address_book",
    "user_addresses",
    "shipping_addresses",
    "saved_addresses",
    "customer_addresses",
  ];

  const rows: any[] = [];

  for (const table of possibleTables) {
    const tableRows = await safeReadAddresses({
      admin,
      table,
      userId,
      email,
    });

    rows.push(...tableRows);
  }

  const profileAddress = addressFromProfile(profile, email);
  if (profileAddress) rows.unshift({ ...profileAddress, is_default: true });

  const merged = mergeUniqueAddresses(rows);

  const defaultAddress =
    merged.find((address) => address.isDefault) ||
    merged[0] ||
    null;

  return {
    savedAddresses: merged,
    defaultAddress,
  };
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload = await verifyAccessToken(accessToken).catch(() => null);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const userId = clean((payload as any)?.sub || (payload as any)?.id);
    const email = clean((payload as any)?.email).toLowerCase();

    if (!userId || !email) {
      return NextResponse.json(
        { ok: false, error: "Invalid token payload" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const admin = supabaseAdmin();

    let dbProfile: any = null;
    let dbName: string | null = null;
    let registryEmail = email;

    try {
      const reg = await getRegistry(admin, userId, email);

      if (reg?.profile) dbProfile = reg.profile;
      if (typeof reg?.name === "string") dbName = reg.name;
      if (typeof reg?.email === "string" && reg.email.trim()) {
        registryEmail = reg.email.trim().toLowerCase();
      }
    } catch {}

    const { savedAddresses, defaultAddress } = await getSavedAddresses({
      admin,
      userId,
      email: registryEmail || email,
      profile: dbProfile,
    });

    const mergedProfile =
      dbProfile && typeof dbProfile === "object"
        ? {
            ...dbProfile,
            defaultAddress,
            savedAddresses,
          }
        : {
            defaultAddress,
            savedAddresses,
          };

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: userId,
          email: registryEmail || email,
          name: dbName || null,
          profile: mergedProfile,
          savedAddresses,
          defaultAddress,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Me error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}