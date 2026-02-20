// lib/authClient.ts
"use client";

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok?: false; error?: string };

async function jsonOrThrow(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : null;
  return { res, data };
}

export async function apiLogin(email: string, password: string) {
  const { res, data } = await jsonOrThrow(
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
  );

  if (!res.ok) {
    const msg = (data as ApiErr)?.error || `Login failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ApiOk<{ user: { email: string; role: string } }>;
}

export async function apiRegister(name: string, email: string, password: string) {
  const { res, data } = await jsonOrThrow(
    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    })
  );

  if (!res.ok) {
    const msg = (data as ApiErr)?.error || `Register failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ApiOk<{ user: { email: string; role: string } }>;
}

export async function apiMe() {
  const { res, data } = await jsonOrThrow(
    await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
  );

  if (!res.ok) {
    const msg = (data as ApiErr)?.error || `Me failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ApiOk<{
    user: { id: string; email: string; role: string; profile?: any | null };
  }>;
}