import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

const ADDRESS_SCOPE = "customer_address_book";
const ADDRESS_KIND = "shipping_address";
const MAX_ADDRESSES = 6;

type AddressBookPayload = {
  id?: string | null;
  label?: string | null;
  fullName?: string | null;
  email?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  municipality?: string | null;
  region?: string | null;
  addressLine1?: string | null;
  notes?: string | null;
};

type AddressBookMeta = {
  kind?: string | null;
  address_id?: string | null;
  label?: string | null;
  deleted?: boolean | null;
  user_id?: string | null;
  address?: AddressBookPayload | null;
};

type AddressLogRow = {
  created_at?: string | null;
  user_email?: string | null;
  meta?: AddressBookMeta | null;
};

type SessionIdentity = {
  userId: string | null;
  email: string | null;
};

type AccessTokenPayload = {
  sub?: string | null;
  userId?: string | null;
  id?: string | null;
  email?: string | null;
  user?: {
    email?: string | null;
  } | null;
};

export type SavedAddressRecord = {
  id: string;
  label: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  municipality: string;
  region: string;
  addressLine1: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function getDbClient() {
  const url =
    normalizeText(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    normalizeText(process.env.SUPABASE_URL);
  const key =
    normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    normalizeText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function safePayload(value: unknown): AccessTokenPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const userValue = record.user;
  const user =
    userValue && typeof userValue === "object" && !Array.isArray(userValue)
      ? (userValue as Record<string, unknown>)
      : null;

  return {
    sub: normalizeText(record.sub) || null,
    userId: normalizeText(record.userId) || null,
    id: normalizeText(record.id) || null,
    email: normalizeEmail(record.email) || null,
    user: user
      ? {
          email: normalizeEmail(user.email) || null,
        }
      : null,
  };
}

function normalizeAddress(input: AddressBookPayload) {
  const fullName = normalizeText(input.fullName);
  const email = normalizeEmail(input.email);
  const documentType = normalizeText(input.documentType).toUpperCase();
  const documentNumber = normalizeText(input.documentNumber);
  const phone = normalizeText(input.phone);
  const municipality = normalizeText(input.municipality);
  const region = normalizeText(input.region);
  const addressLine1 = normalizeText(input.addressLine1);
  const notes = normalizeText(input.notes);
  const label =
    normalizeText(input.label) ||
    [fullName || "Direccion guardada", [municipality, region].filter(Boolean).join(", ")]
      .filter(Boolean)
      .join(" - ");

  return {
    id: normalizeText(input.id),
    label,
    fullName,
    email,
    documentType,
    documentNumber,
    phone,
    municipality,
    region,
    addressLine1,
    notes,
  };
}

function isValidAddress(address: ReturnType<typeof normalizeAddress>) {
  return Boolean(
    address.fullName &&
      address.email &&
      address.phone &&
      address.region &&
      address.municipality &&
      address.addressLine1
  );
}

function toSavedAddressRecord(
  address: ReturnType<typeof normalizeAddress>,
  createdAt: string,
  updatedAt: string
): SavedAddressRecord {
  return {
    id: address.id || `addr_${Date.now()}`,
    label: address.label,
    fullName: address.fullName,
    email: address.email,
    documentType: address.documentType,
    documentNumber: address.documentNumber,
    phone: address.phone,
    municipality: address.municipality,
    region: address.region,
    addressLine1: address.addressLine1,
    notes: address.notes,
    createdAt,
    updatedAt,
  };
}

async function getIdentityFromRequest(req: NextRequest): Promise<SessionIdentity | null> {
  const token = req.cookies.get(COOKIE_AT)?.value;
  if (!token) return null;

  try {
    const payload = safePayload(await verifyAccessToken(token));
    const userId = normalizeText(payload.sub || payload.userId || payload.id) || null;
    const email = normalizeEmail(payload.email || payload.user?.email) || null;
    if (!userId && !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export async function requireAddressIdentity(req: NextRequest) {
  const identity = await getIdentityFromRequest(req);
  if (!identity?.email) {
    return null;
  }
  return identity;
}

export async function listSavedAddressesForIdentity(identity: SessionIdentity) {
  if (!identity.email) return [];

  const db = getDbClient();
  const { data, error } = await db
    .from("logs")
    .select("created_at,user_email,meta")
    .eq("scope", ADDRESS_SCOPE)
    .eq("user_email", identity.email)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message || "No se pudieron cargar las direcciones guardadas.");
  }

  const latest = new Map<string, SavedAddressRecord | null>();

  for (const row of (Array.isArray(data) ? data : []) as AddressLogRow[]) {
    const meta = row?.meta && typeof row.meta === "object" ? row.meta : {};
    if (normalizeText(meta.kind) !== ADDRESS_KIND) continue;

    const addressId = normalizeText(meta.address_id);
    if (!addressId || latest.has(addressId)) continue;

    if (meta.deleted) {
      latest.set(addressId, null);
      continue;
    }

    const normalized = normalizeAddress({
      id: addressId,
      label: meta.label,
      ...(meta.address || {}),
    });

    if (!isValidAddress(normalized)) {
      latest.set(addressId, null);
      continue;
    }

    latest.set(
      addressId,
      toSavedAddressRecord(
        normalized,
        normalizeText(row.created_at) || new Date().toISOString(),
        normalizeText(row.created_at) || new Date().toISOString()
      )
    );
  }

  return Array.from(latest.values())
    .filter((entry): entry is SavedAddressRecord => Boolean(entry))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, MAX_ADDRESSES);
}

export async function upsertSavedAddressForIdentity(
  identity: SessionIdentity,
  input: AddressBookPayload
) {
  if (!identity.email) {
    throw new Error("No user identity for address book");
  }

  const normalized = normalizeAddress(input);
  if (!isValidAddress(normalized)) {
    throw new Error("La direccion no esta completa.");
  }

  const now = new Date().toISOString();
  const addressId = normalized.id || `addr_${Date.now()}`;
  const db = getDbClient();

  const { error } = await db.from("logs").insert({
    level: "info",
    scope: ADDRESS_SCOPE,
    message: "upsert",
    order_id: identity.userId || null,
    user_email: identity.email,
    meta: {
      kind: ADDRESS_KIND,
      address_id: addressId,
      label: normalized.label,
      user_id: identity.userId,
      deleted: false,
      updated_at: now,
      address: {
        ...normalized,
        id: addressId,
      },
    },
  });

  if (error) {
    throw new Error(error.message || "No se pudo guardar la direccion.");
  }

  return toSavedAddressRecord(
    { ...normalized, id: addressId },
    now,
    now
  );
}

export async function deleteSavedAddressForIdentity(
  identity: SessionIdentity,
  addressId: string
) {
  const safeAddressId = normalizeText(addressId);
  if (!identity.email || !safeAddressId) {
    throw new Error("No se pudo eliminar la direccion.");
  }

  const db = getDbClient();
  const { error } = await db.from("logs").insert({
    level: "info",
    scope: ADDRESS_SCOPE,
    message: "delete",
    order_id: identity.userId || null,
    user_email: identity.email,
    meta: {
      kind: ADDRESS_KIND,
      address_id: safeAddressId,
      user_id: identity.userId,
      deleted: true,
    },
  });

  if (error) {
    throw new Error(error.message || "No se pudo eliminar la direccion.");
  }
}

export async function rememberShippingAddressForIdentity(
  identity: SessionIdentity,
  input: AddressBookPayload
) {
  if (!identity.email) return null;
  try {
    return await upsertSavedAddressForIdentity(identity, input);
  } catch {
    return null;
  }
}
