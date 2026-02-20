// lib/auth.ts
// Fuente única de verdad de AUTH en JUSP (USER + ADMIN)

import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

// ===============================
// USER AUTH (JWT cookies)
// ===============================

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "dev_access_secret");
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "dev_refresh_secret");

// ✅ Cookies oficiales del sistema (USER)
export const COOKIE_AT = "jusp_at";
export const COOKIE_RT = "jusp_rt";
export const COOKIE_PROFILE = "jusp_profile";
export const COOKIE_CSRF = "jusp_csrf";

export async function signAccessToken(payload: any) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("15m").sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: any) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload;
}

// Cookie helpers (USER)
export function accessCookie(value: string) {
  return { name: COOKIE_AT, value, httpOnly: true, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
}
export function refreshCookie(value: string) {
  return { name: COOKIE_RT, value, httpOnly: true, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
}
export function profileCookie(value: string) {
  return { name: COOKIE_PROFILE, value, httpOnly: true, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
}
export function csrfCookie(value: string) {
  return { name: COOKIE_CSRF, value, httpOnly: false, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
}
export function clearCookie(name: string) {
  return { name, value: "", path: "/", expires: new Date(0) };
}

// ===============================
// ADMIN AUTH (HttpOnly cookie)
// ===============================

// ✅ Estándar Admin Login Blindado PRO MAX
export const ADMIN_COOKIE_DEV = "jusp_admin_token";
export const ADMIN_COOKIE_PROD = "__Host-jusp_admin_token";

export function adminCookieName() {
  return process.env.NODE_ENV === "production" ? ADMIN_COOKIE_PROD : ADMIN_COOKIE_DEV;
}

export function isAdminAuthed(req: NextRequest) {
  const cookieName = adminCookieName();
  const token =
    req.cookies.get(cookieName)?.value ||
    req.cookies.get(ADMIN_COOKIE_DEV)?.value ||
    req.cookies.get(ADMIN_COOKIE_PROD)?.value;

  if (!token) return false;

  const expected = process.env.JUSP_ADMIN_TOKEN;
  if (!expected) return false;

  return token === expected;
}

export const isValidAdmin = isAdminAuthed;

export function adminCookie(value: string) {
  const name = adminCookieName();
  return { name, value, httpOnly: true, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7 };
}

export function clearAdminCookie() {
  return clearCookie(adminCookieName());
}
