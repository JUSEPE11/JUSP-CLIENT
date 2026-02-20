// lib/juspAuth.ts
// PRO MAX: Auth SOLO por cookies HttpOnly + /api/auth/*
// NO localStorage. NO estados fantasmas.

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "operator" | "user";
  profile?: any | null;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function getMe(): Promise<
  { ok: true; user: AuthUser } | { ok: false; error: string; status: number }
> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
  });

  const data = await safeJson(res);

  if (!res.ok) {
    return { ok: false, status: res.status, error: data?.error || "Invalid session" };
  }

  return { ok: true, user: data.user as AuthUser };
}

export async function signIn(
  email: string,
  password: string
): Promise<
  | { ok: true; user: AuthUser }
  | { ok: false; error: string; status: number; step?: "login" | "me" }
> {
  const loginRes = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({ email, password }),
  });

  const loginData = await safeJson(loginRes);

  if (!loginRes.ok) {
    return {
      ok: false,
      status: loginRes.status,
      step: "login",
      error: loginData?.error || "Credenciales inválidas",
    };
  }

  // Prueba oro inmediata
  const me = await getMe();
  if (!me.ok) {
    return {
      ok: false,
      status: me.status,
      step: "me",
      error: `POST login ok pero /me falló (${me.status}): ${me.error}`,
    };
  }

  return { ok: true, user: me.user };
}

export async function signOut(): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
  });

  if (!res.ok) {
    const data = await safeJson(res);
    return { ok: false, status: res.status, error: data?.error || "Logout error" };
  }

  return { ok: true };
}