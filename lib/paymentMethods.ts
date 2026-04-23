import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

const PAYMENT_SCOPE = "customer_payment_methods";
const PAYMENT_KIND = "saved_payment_method";
const MAX_PAYMENT_METHODS = 6;

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

type PaymentMethodPayload = {
  id?: string | null;
  label?: string | null;
  brand?: string | null;
  last4?: string | null;
  cardholderName?: string | null;
  expMonth?: string | null;
  expYear?: string | null;
  isDefault?: boolean | null;
  provider?: string | null;
  paymentSourceId?: string | null;
  sourceStatus?: string | null;
  tokenizationMode?: string | null;
  customerEmail?: string | null;
};

type PaymentMethodMeta = {
  kind?: string | null;
  payment_method_id?: string | null;
  deleted?: boolean | null;
  user_id?: string | null;
  payment_method?: PaymentMethodPayload | null;
};

type PaymentMethodLogRow = {
  created_at?: string | null;
  user_email?: string | null;
  meta?: PaymentMethodMeta | null;
};

export type SavedPaymentMethodRecord = {
  id: string;
  label: string;
  brand: string;
  last4: string;
  cardholderName: string;
  expMonth: string;
  expYear: string;
  provider: string;
  isDefault: boolean;
  paymentSourceId: string;
  sourceStatus: string;
  tokenizationMode: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function onlyDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeCardExpiryYear(value: unknown) {
  const digits = onlyDigits(value);
  if (digits.length === 2) {
    return `20${digits}`;
  }
  if (digits.length >= 4) {
    return digits.slice(0, 4);
  }
  return digits;
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

function normalizePaymentMethod(input: PaymentMethodPayload) {
  const brand = normalizeText(input.brand);
  const last4 = onlyDigits(input.last4).slice(-4);
  const cardholderName = normalizeText(input.cardholderName);
  const expMonth = onlyDigits(input.expMonth).slice(0, 2);
  const expYear = normalizeCardExpiryYear(input.expYear);
  const provider = normalizeText(input.provider) || "wompi";
  const paymentSourceId = normalizeText(input.paymentSourceId);
  const sourceStatus = normalizeText(input.sourceStatus) || "available";
  const tokenizationMode = normalizeText(input.tokenizationMode) || "reference";
  const customerEmail = normalizeEmail(input.customerEmail);
  const isDefault = Boolean(input.isDefault);
  const label =
    normalizeText(input.label) ||
    [brand || "Tarjeta", last4 ? `**** ${last4}` : ""].filter(Boolean).join(" ");

  return {
    id: normalizeText(input.id),
    label,
    brand,
    last4,
    cardholderName,
    expMonth,
    expYear,
    provider,
    isDefault,
    paymentSourceId,
    sourceStatus,
    tokenizationMode,
    customerEmail,
  };
}

function isValidPaymentMethod(paymentMethod: ReturnType<typeof normalizePaymentMethod>) {
  const month = Number(paymentMethod.expMonth);
  const year = Number(paymentMethod.expYear);

  return Boolean(
    paymentMethod.brand &&
      paymentMethod.last4.length === 4 &&
      paymentMethod.cardholderName &&
      month >= 1 &&
      month <= 12 &&
      year >= 2024
  );
}

function toSavedPaymentMethodRecord(
  paymentMethod: ReturnType<typeof normalizePaymentMethod>,
  createdAt: string,
  updatedAt: string
): SavedPaymentMethodRecord {
  return {
    id: paymentMethod.id || `pm_${Date.now()}`,
    label: paymentMethod.label,
    brand: paymentMethod.brand,
    last4: paymentMethod.last4,
    cardholderName: paymentMethod.cardholderName,
    expMonth: paymentMethod.expMonth,
    expYear: paymentMethod.expYear,
    provider: paymentMethod.provider,
    isDefault: paymentMethod.isDefault,
    paymentSourceId: paymentMethod.paymentSourceId,
    sourceStatus: paymentMethod.sourceStatus,
    tokenizationMode: paymentMethod.tokenizationMode,
    customerEmail: paymentMethod.customerEmail,
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

export async function requirePaymentIdentity(req: NextRequest) {
  const identity = await getIdentityFromRequest(req);
  if (!identity?.email) return null;
  return identity;
}

export async function listSavedPaymentMethodsForIdentity(identity: SessionIdentity) {
  if (!identity.email) return [];

  const db = getDbClient();
  const { data, error } = await db
    .from("logs")
    .select("created_at,user_email,meta")
    .eq("scope", PAYMENT_SCOPE)
    .eq("user_email", identity.email)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message || "No se pudieron cargar los metodos de pago.");
  }

  const latest = new Map<string, SavedPaymentMethodRecord | null>();

  for (const row of (Array.isArray(data) ? data : []) as PaymentMethodLogRow[]) {
    const meta = row?.meta && typeof row.meta === "object" ? row.meta : {};
    if (normalizeText(meta.kind) !== PAYMENT_KIND) continue;

    const paymentMethodId = normalizeText(meta.payment_method_id);
    if (!paymentMethodId || latest.has(paymentMethodId)) continue;

    if (meta.deleted) {
      latest.set(paymentMethodId, null);
      continue;
    }

    const normalized = normalizePaymentMethod({
      id: paymentMethodId,
      ...(meta.payment_method || {}),
    });

    if (!isValidPaymentMethod(normalized)) {
      latest.set(paymentMethodId, null);
      continue;
    }

    latest.set(
      paymentMethodId,
      toSavedPaymentMethodRecord(
        normalized,
        normalizeText(row.created_at) || new Date().toISOString(),
        normalizeText(row.created_at) || new Date().toISOString()
      )
    );
  }

  const methods = Array.from(latest.values()).filter(
    (entry): entry is SavedPaymentMethodRecord => Boolean(entry)
  );

  methods.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  return methods.slice(0, MAX_PAYMENT_METHODS);
}

export async function upsertSavedPaymentMethodForIdentity(
  identity: SessionIdentity,
  input: PaymentMethodPayload
) {
  if (!identity.email) {
    throw new Error("No user identity for payment methods");
  }

  const normalized = normalizePaymentMethod(input);
  if (!isValidPaymentMethod(normalized)) {
    throw new Error("El metodo de pago no esta completo.");
  }

  const now = new Date().toISOString();
  const paymentMethodId = normalized.id || `pm_${Date.now()}`;
  const db = getDbClient();

  if (normalized.isDefault) {
    const currentMethods = await listSavedPaymentMethodsForIdentity(identity);

    for (const method of currentMethods) {
      if (method.id === paymentMethodId) continue;
      if (!method.isDefault) continue;

      await db.from("logs").insert({
        level: "info",
        scope: PAYMENT_SCOPE,
        message: "unset-default",
        order_id: identity.userId || null,
        user_email: identity.email,
        meta: {
          kind: PAYMENT_KIND,
          payment_method_id: method.id,
          user_id: identity.userId,
          deleted: false,
          payment_method: {
            ...method,
            isDefault: false,
          },
        },
      });
    }
  }

  const { error } = await db.from("logs").insert({
    level: "info",
    scope: PAYMENT_SCOPE,
    message: "upsert",
    order_id: identity.userId || null,
    user_email: identity.email,
    meta: {
      kind: PAYMENT_KIND,
      payment_method_id: paymentMethodId,
      user_id: identity.userId,
      deleted: false,
      updated_at: now,
      payment_method: {
        ...normalized,
        id: paymentMethodId,
      },
    },
  });

  if (error) {
    throw new Error(error.message || "No se pudo guardar el metodo de pago.");
  }

  return toSavedPaymentMethodRecord(
    { ...normalized, id: paymentMethodId },
    now,
    now
  );
}

export async function deleteSavedPaymentMethodForIdentity(
  identity: SessionIdentity,
  paymentMethodId: string
) {
  const safePaymentMethodId = normalizeText(paymentMethodId);
  if (!identity.email || !safePaymentMethodId) {
    throw new Error("No se pudo eliminar el metodo de pago.");
  }

  const db = getDbClient();
  const { error } = await db.from("logs").insert({
    level: "info",
    scope: PAYMENT_SCOPE,
    message: "delete",
    order_id: identity.userId || null,
    user_email: identity.email,
    meta: {
      kind: PAYMENT_KIND,
      payment_method_id: safePaymentMethodId,
      user_id: identity.userId,
      deleted: true,
    },
  });

  if (error) {
    throw new Error(error.message || "No se pudo eliminar el metodo de pago.");
  }
}
