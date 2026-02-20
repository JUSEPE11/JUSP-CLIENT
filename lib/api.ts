// lib/api.ts
import type { Product } from "@/lib/products";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };

function getBaseUrl() {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    process.env.SITE_URL ||
    "";
  return env || "http://localhost:3000";
}

async function getServerCookieHeader(): Promise<string | undefined> {
  try {
    const mod = await import("next/headers");
    const store = await mod.cookies(); // ✅ Next 16
    const all = store.getAll();
    if (!all.length) return undefined;

    return all.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
  } catch {
    return undefined;
  }
}

async function rawFetch(
  url: string,
  init: RequestInit | undefined,
  isServer: boolean,
  revalidateSeconds: number
) {
  const baseHeaders: Record<string, string> = {
    "content-type": "application/json",
  };

  const merged = new Headers(init?.headers as any);
  for (const [k, v] of Object.entries(baseHeaders)) {
    if (!merged.has(k)) merged.set(k, v);
  }

  if (isServer) {
    const cookie = await getServerCookieHeader();
    if (cookie && !merged.has("cookie")) merged.set("cookie", cookie);
  }

  const res = await fetch(url, {
    ...init,
    ...(isServer ? {} : { credentials: "include" as const }),
    ...(isServer ? { next: { revalidate: revalidateSeconds } as any } : {}),
    headers: merged,
  });

  return res;
}

async function tryRefreshOnce(isServer: boolean) {
  const refreshUrl = isServer ? `${getBaseUrl()}/api/auth/refresh` : "/api/auth/refresh";
  const res = await rawFetch(
    refreshUrl,
    {
      method: "POST",
    },
    isServer,
    0
  );
  return res.ok;
}

async function apiFetch(path: string, init?: RequestInit, revalidateSeconds = 60) {
  const isServer = typeof window === "undefined";
  const url = isServer ? `${getBaseUrl()}${path}` : path;

  const first = await rawFetch(url, init, isServer, revalidateSeconds);
  if (first.status !== 401) return first;

  const refreshed = await tryRefreshOnce(isServer);
  if (!refreshed) return first;

  const second = await rawFetch(url, init, isServer, revalidateSeconds);
  return second;
}

export async function getProducts(): Promise<Product[]> {
  const res = await apiFetch("/api/products", undefined, 60);
  const json = (await res.json()) as ApiOk<Product[]> | ApiErr;

  if (!res.ok || !json.ok) return [];
  return json.data;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!id) return null;

  const safe = encodeURIComponent(id);
  const res = await apiFetch(`/api/products/${safe}`, undefined, 60);
  if (res.status === 404) return null;

  const json = (await res.json()) as ApiOk<Product> | ApiErr;
  if (!res.ok || !json.ok) return null;

  return json.data;
}

export { apiFetch };