/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * JUSP — Orders/Logs repository (Supabase REST)
 * - En servidor usa SUPABASE_SERVICE_ROLE_KEY
 * - En cliente usa NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Sin dependencia de @supabase/supabase-js
 */

export type OrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | string;

export type OrderItem = {
  id: string;
  product_id?: string | null;
  name?: string | null;
  qty?: number | null;
  price?: number | null;
  image?: string | null;
  size?: string | null;
  color?: string | null;
};

export type Order = {
  id?: string | null;

  order_code?: string | null;
  wompi_reference?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;

  status?: OrderStatus | null;

  total_amount?: number | null;
  currency?: string | null;

  customer_name?: string | null;
  customer_email?: string | null;
  customer_document_type?: string | null;
  customer_document?: string | null;

  phone?: string | null;

  country?: string | null;
  city?: string | null;
  customer_region?: string | null;
  address?: string | null;

  items_count?: number | null;

  provider?: string | null;
  payment_id?: string | null;
  risk_score?: number | null;
  tracking_code?: string | null;

  items?: OrderItem[] | null;

  admin_note?: string | null;
};

export type LogRow = {
  id?: string;
  created_at?: string;
  level?: "info" | "warn" | "error" | string;
  scope?: string | null;
  message: string;
  meta?: any;
  order_id?: string | null;
  user_email?: string | null;
};

type Env = { url: string; key: string };

function getEnv(): Env {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
  }

  const isServer = typeof window === "undefined";
  const key = isServer ? serviceRoleKey || anonKey : anonKey;

  if (!key) {
    throw new Error(
      isServer
        ? "Missing env var: SUPABASE_SERVICE_ROLE_KEY (or fallback NEXT_PUBLIC_SUPABASE_ANON_KEY)"
        : "Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, key };
}

function headers(): HeadersInit {
  const { key } = getEnv();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function headersGet(): HeadersInit {
  const { key } = getEnv();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

function restUrl(table: string) {
  const { url } = getEnv();
  return `${url.replace(/\/+$/, "")}/rest/v1/${table}`;
}

async function rest<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<{ data: T; status: number; raw: string }> {
  const res = await fetch(input, {
    cache: "no-store",
    ...init,
  });

  const raw = await res.text();

  if (!res.ok) {
    const msg = raw || res.statusText || "Supabase REST error";
    throw new Error(`${res.status} ${msg}`);
  }

  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw as any;
  }

  return { data: data as T, status: res.status, raw };
}

function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj || {})) {
    if (value !== undefined) {
      out[key] = value;
    }
  }

  return out as T;
}

function buildEqFilter(field: string, value: string) {
  return `${field}=eq.${encodeURIComponent(value)}`;
}

/** Insert a log row into public.logs */
export async function dbInsertLog(row: LogRow): Promise<void> {
  const url = restUrl("logs");
  await rest<any>(url, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
}

export async function dbGetOrderByCode(orderCode: string): Promise<Order | null> {
  const code = String(orderCode || "").trim();
  if (!code) return null;

  const url =
    restUrl("orders") +
    `?select=*&${buildEqFilter("order_code", code)}&limit=1`;

  const { data } = await rest<Order[] | null>(url, {
    method: "GET",
    headers: headersGet(),
  });

  if (Array.isArray(data) && data.length) return data[0] as Order;
  return null;
}

/**
 * Upsert real y blindado:
 * 1) busca por order_code
 * 2) si existe, hace PATCH
 * 3) si no existe, hace INSERT
 *
 * Esto evita depender del upsert implícito REST que en tu caso está fallando
 * con el unique constraint orders_order_code_key.
 */
export async function dbUpsertOrder(order: Order): Promise<Order> {
  const orderCode = String(order.order_code || "").trim();

  if (!orderCode) {
    throw new Error("dbUpsertOrder requiere order_code");
  }

  const payload = cleanUndefined({
    ...order,
    order_code: orderCode,
  });

  const existing = await dbGetOrderByCode(orderCode);

  if (existing?.id) {
    const patchUrl =
      restUrl("orders") +
      `?${buildEqFilter("order_code", orderCode)}&select=*`;

    const mergedPayload = cleanUndefined({
      ...payload,
      id: existing.id,
      created_at: existing.created_at || payload.created_at || null,
      updated_at: new Date().toISOString(),
    });

    const { data } = await rest<Order[] | null>(patchUrl, {
      method: "PATCH",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(mergedPayload),
    });

    if (Array.isArray(data) && data.length) return data[0] as Order;

    const reloaded = await dbGetOrderByCode(orderCode);
    if (reloaded) return reloaded;

    throw new Error(`No se pudo actualizar la orden ${orderCode}`);
  }

  const insertUrl = restUrl("orders") + "?select=*";

  try {
    const { data } = await rest<Order[] | null>(insertUrl, {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (Array.isArray(data) && data.length) return data[0] as Order;

    const reloaded = await dbGetOrderByCode(orderCode);
    if (reloaded) return reloaded;

    return payload;
  } catch (error: any) {
    const message = String(error?.message || "");

    const isDuplicate =
      message.includes("orders_order_code_key") ||
      message.toLowerCase().includes("duplicate key value violates unique constraint");

    if (!isDuplicate) {
      throw error;
    }

    const existingAfterDuplicate = await dbGetOrderByCode(orderCode);
    if (!existingAfterDuplicate) {
      throw error;
    }

    const patchUrl =
      restUrl("orders") +
      `?${buildEqFilter("order_code", orderCode)}&select=*`;

    const mergedPayload = cleanUndefined({
      ...payload,
      id: existingAfterDuplicate.id,
      created_at: existingAfterDuplicate.created_at || payload.created_at || null,
      updated_at: new Date().toISOString(),
    });

    const { data } = await rest<Order[] | null>(patchUrl, {
      method: "PATCH",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(mergedPayload),
    });

    if (Array.isArray(data) && data.length) return data[0] as Order;

    const reloaded = await dbGetOrderByCode(orderCode);
    if (reloaded) return reloaded;

    throw new Error(`No se pudo reconciliar la orden duplicada ${orderCode}`);
  }
}

/** List orders for a given customer email */
export async function myListOrdersByEmail(email: string): Promise<Order[]> {
  const url =
    restUrl("orders") +
    `?select=*&${buildEqFilter("customer_email", email)}&order=created_at.desc`;

  const { data } = await rest<Order[]>(url, {
    method: "GET",
    headers: headersGet(),
  });

  return Array.isArray(data) ? data : [];
}

/** Admin list */
export async function adminListOrders(limit = 50): Promise<Order[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 50;
  const url = restUrl("orders") + `?select=*&order=created_at.desc&limit=${safeLimit}`;

  const { data } = await rest<Order[]>(url, {
    method: "GET",
    headers: headersGet(),
  });

  return Array.isArray(data) ? data : [];
}

/** Admin list logs */
export async function adminListLogs(limit = 100): Promise<LogRow[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 100;
  const url = restUrl("logs") + `?select=*&order=created_at.desc&limit=${safeLimit}`;

  const { data } = await rest<LogRow[]>(url, {
    method: "GET",
    headers: headersGet(),
  });

  return Array.isArray(data) ? data : [];
}