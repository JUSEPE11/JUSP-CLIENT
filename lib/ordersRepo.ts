/* eslint-disable @typescript-eslint/no-explicit-any */

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
  id?: string | null;
  product_id?: string | null;
  slug?: string | null;
  product_slug?: string | null;
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

  const isServer = typeof window === "undefined";
  const key = isServer ? serviceRoleKey || anonKey : anonKey;

  if (!url || !key) {
    throw new Error("Supabase env vars missing");
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
): Promise<{ data: T; status: number; text: string }> {
  const res = await fetch(input, {
    cache: "no-store",
    ...init,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Supabase error");
  }

  const data = text ? JSON.parse(text) : null;

  return { data, status: res.status, text };
}

function isDuplicateOrderCodeError(error: unknown) {
  const message = String((error as any)?.message || "").toLowerCase();
  return (
    message.includes("orders_order_code_key") ||
    message.includes("duplicate key value violates unique constraint")
  );
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

export async function dbInsertLog(row: LogRow): Promise<void> {
  await rest<null>(restUrl("logs"), {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(cleanUndefined(row)),
  });
}

export async function dbGetOrderByCode(orderCode: string): Promise<Order | null> {
  const code = String(orderCode || "").trim();
  if (!code) return null;

  const url =
    restUrl("orders") +
    `?select=*&order_code=eq.${encodeURIComponent(code)}&limit=1`;

  const { data } = await rest<Order[]>(url, {
    method: "GET",
    headers: headersGet(),
  });

  if (Array.isArray(data) && data.length > 0) {
    return data[0] || null;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*                              SAFE UPSERT ORDER                             */
/* -------------------------------------------------------------------------- */

export async function dbUpsertOrder(order: Order): Promise<Order> {
  const orderCode = String(order.order_code || "").trim();

  if (!orderCode) {
    throw new Error("order_code requerido");
  }

  const code = encodeURIComponent(orderCode);

  const basePayload = cleanUndefined({
    ...order,
    order_code: orderCode,
  });

  /* 1) Buscar si ya existe */
  const checkUrl =
    restUrl("orders") +
    `?select=*&order_code=eq.${code}&limit=1`;

  const { data: existing } = await rest<Order[]>(checkUrl, {
    method: "GET",
    headers: headersGet(),
  });

  /* 2) UPDATE si ya existe */
  if (Array.isArray(existing) && existing.length) {
    const current = existing[0];

    const updateUrl =
      restUrl("orders") +
      `?order_code=eq.${code}&select=*`;

    const { data } = await rest<Order[]>(updateUrl, {
      method: "PATCH",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(
        cleanUndefined({
          ...basePayload,
          id: current?.id ?? null,
          created_at: current?.created_at ?? basePayload.created_at ?? null,
          updated_at: new Date().toISOString(),
        })
      ),
    });

    return (Array.isArray(data) && data[0]) || current || basePayload;
  }

  /* 3) INSERT si no existe */
  const insertUrl = restUrl("orders") + "?select=*";

  try {
    const { data } = await rest<Order[]>(insertUrl, {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(
        cleanUndefined({
          ...basePayload,
          created_at: basePayload.created_at || new Date().toISOString(),
        })
      ),
    });

    return (Array.isArray(data) && data[0]) || basePayload;
  } catch (error) {
    if (!isDuplicateOrderCodeError(error)) {
      throw error;
    }

    /* 4) Si chocó por carrera, recargar y actualizar */
    const current = await dbGetOrderByCode(orderCode);

    if (!current) {
      throw error;
    }

    const updateUrl =
      restUrl("orders") +
      `?order_code=eq.${code}&select=*`;

    const { data } = await rest<Order[]>(updateUrl, {
      method: "PATCH",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(
        cleanUndefined({
          ...basePayload,
          id: current.id ?? null,
          created_at: current.created_at ?? basePayload.created_at ?? null,
          updated_at: new Date().toISOString(),
        })
      ),
    });

    return (Array.isArray(data) && data[0]) || current;
  }
}
