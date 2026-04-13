/* eslint-disable @typescript-eslint/no-explicit-any */

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
): Promise<{ data: T; status: number }> {
  const res = await fetch(input, {
    cache: "no-store",
    ...init,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Supabase error");
  }

  const data = text ? JSON.parse(text) : null;

  return { data, status: res.status };
}

/* -------------------------------------------------------------------------- */
/*                                SESSION ID                                  */
/* -------------------------------------------------------------------------- */

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";

  const KEY = "jusp_session_id";
  let id = localStorage.getItem(KEY);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }

  return id;
}

/* -------------------------------------------------------------------------- */
/*                               FAVORITES LOGIC                              */
/* -------------------------------------------------------------------------- */

export async function addFavorite(productId: string, sessionId: string) {
  await rest(restUrl("product_favorites"), {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      product_id: productId,
      session_id: sessionId,
    }),
  });
}

export async function removeFavorite(productId: string, sessionId: string) {
  const url =
    restUrl("product_favorites") +
    `?product_id=eq.${encodeURIComponent(productId)}&session_id=eq.${encodeURIComponent(sessionId)}`;

  await rest(url, {
    method: "DELETE",
    headers: headers(),
  });
}

export async function getFavoritesCountMap(): Promise<Record<string, number>> {
  const url =
    restUrl("product_favorites") +
    "?select=product_id";

  const { data } = await rest<any[]>(url, {
    method: "GET",
    headers: headersGet(),
  });

  const map: Record<string, number> = {};

  for (const row of data || []) {
    const id = row.product_id;
    if (!id) continue;

    map[id] = (map[id] || 0) + 1;
  }

  return map;
}

export async function isFavorite(productId: string, sessionId: string): Promise<boolean> {
  const url =
    restUrl("product_favorites") +
    `?select=product_id&product_id=eq.${encodeURIComponent(productId)}&session_id=eq.${encodeURIComponent(sessionId)}&limit=1`;

  const { data } = await rest<any[]>(url, {
    method: "GET",
    headers: headersGet(),
  });

  return Array.isArray(data) && data.length > 0;
}