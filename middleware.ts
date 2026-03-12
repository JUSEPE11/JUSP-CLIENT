import { NextRequest, NextResponse } from "next/server";

const USER_AUTH_COOKIE = "jusp_at";

const PROTECTED_PATHS = ["/favorites", "/account", "/orders"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get(USER_AUTH_COOKIE)?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);

  const nextPath = `${pathname}${search || ""}`;
  if (nextPath && nextPath !== "/login") {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/favorites/:path*", "/account/:path*", "/orders/:path*"],
};