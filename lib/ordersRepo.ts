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
  phone?: string | null;

  country?: string | null;
  city?: string | null;
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

function restUrl(table: string) {
  const { url } = getEnv();
  return `${url.replace(/\/+$/, "")}/rest/v1/${table}`;
}

async function rest<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<{ data: T; status: number; raw: string }> {
  const res = await fetch(input, init);
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

/** Insert a log row into public.logs */
export async function dbInsertLog(row: LogRow): Promise<void> {
  const url = restUrl("logs");
  await rest<any>(url, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
}

/**
 * Upsert an order into public.orders by order_code.
 * Requiere que public.orders.order_code exista y sea UNIQUE.
 */
export async function dbUpsertOrder(order: Order): Promise<Order> {
  if (!order.order_code || !String(order.order_code).trim()) {
    throw new Error("dbUpsertOrder requiere order_code");
  }

  const url = restUrl("orders") + "?on_conflict=order_code";

  const { data } = await rest<Order[] | null>(url, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(order),
  });

  if (Array.isArray(data) && data.length) return data[0] as Order;
  return order;
}

/** List orders for a given customer email */
export async function myListOrdersByEmail(email: string): Promise<Order[]> {
  const url =
    restUrl("orders") +
    `?select=*&customer_email=eq.${encodeURIComponent(email)}&order=created_at.desc`;

  const { data } = await rest<Order[]>(url, {
    method: "GET",
    headers: headers(),
  });

  return Array.isArray(data) ? data : [];
}

/** Admin list */
export async function adminListOrders(limit = 50): Promise<Order[]> {
  const url = restUrl("orders") + `?select=*&order=created_at.desc&limit=${limit}`;

  const { data } = await rest<Order[]>(url, {
    method: "GET",
    headers: headers(),
  });

  return Array.isArray(data) ? data : [];
}

/** Admin list logs */
export async function adminListLogs(limit = 100): Promise<LogRow[]> {
  const url = restUrl("logs") + `?select=*&order=created_at.desc&limit=${limit}`;

  const { data } = await rest<LogRow[]>(url, {
    method: "GET",
    headers: headers(),
  });

  return Array.isArray(data) ? data : [];
}