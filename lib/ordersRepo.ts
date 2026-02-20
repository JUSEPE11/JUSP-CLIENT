/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * JUSP — Orders/Logs repository (Supabase REST)
 * ✅ No dependency on @supabase/supabase-js (avoids module-not-found)
 * ✅ Works from client using NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Tables expected (can be created later):
 * - public.orders
 * - public.logs
 *
 * If tables don't exist yet, functions will throw (and UI should show toast/error).
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
  id: string;

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

  // free-form payloads
  items?: OrderItem[] | null;

  // admin
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

type Env = { url: string; anonKey: string };

function getEnv(): Env {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return { url, anonKey };
}

function headers(): HeadersInit {
  const { anonKey } = getEnv();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
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

/** Upsert an order into public.orders (by id) */
export async function dbUpsertOrder(order: Order): Promise<Order> {
  const url = restUrl("orders") + "?on_conflict=id";
  const { data } = await rest<Order[] | null>(url, {
    method: "POST",
    headers: { ...headers(), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(order),
  });
  if (Array.isArray(data) && data.length) return data[0] as Order;
  return order;
}

/** List orders for a given customer email (client "My Orders") */
export async function myListOrdersByEmail(email: string): Promise<Order[]> {
  const url =
    restUrl("orders") +
    `?select=*&customer_email=eq.${encodeURIComponent(email)}&order=created_at.desc`;
  const { data } = await rest<Order[]>(url, { method: "GET", headers: headers() });
  return Array.isArray(data) ? data : [];
}

/** Admin list (basic) — on client this is only for demo; use RLS on your DB */
export async function adminListOrders(limit = 50): Promise<Order[]> {
  const url = restUrl("orders") + `?select=*&order=created_at.desc&limit=${limit}`;
  const { data } = await rest<Order[]>(url, { method: "GET", headers: headers() });
  return Array.isArray(data) ? data : [];
}

/** Admin list logs (basic) — on client this is only for demo; use RLS on your DB */
export async function adminListLogs(limit = 100): Promise<LogRow[]> {
  const url = restUrl("logs") + `?select=*&order=created_at.desc&limit=${limit}`;
  const { data } = await rest<LogRow[]>(url, { method: "GET", headers: headers() });
  return Array.isArray(data) ? data : [];
}
