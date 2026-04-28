import { NextRequest, NextResponse } from "next/server";

const USER_AUTH_COOKIE = "jusp_at";
const ADMIN_ORIGIN = "https://admin.juspco.com";

const PROTECTED_PATHS = ["/favorites", "/account", "/orders"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function mapAdminDestination(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/" || pathname === "/dashboard" || pathname === "/dashboard/") {
    return `${ADMIN_ORIGIN}/dashboard`;
  }

  if (pathname === "/admin/login") return `${ADMIN_ORIGIN}/login`;
  if (pathname === "/admin/metrics") return `${ADMIN_ORIGIN}/dashboard/metrics`;
  if (pathname === "/admin/registrations") return `${ADMIN_ORIGIN}/dashboard/usuarios`;

  if (pathname.startsWith("/dashboard/")) {
    return `${ADMIN_ORIGIN}${pathname}`;
  }

  if (pathname.startsWith("/admin/")) {
    const suffix = pathname.replace(/^\/admin/, "");
    return `${ADMIN_ORIGIN}/dashboard${suffix}`;
  }

  return `${ADMIN_ORIGIN}/dashboard`;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isAdminPath(pathname)) {
    const target = new URL(mapAdminDestination(pathname));
    if (search) target.search = search;
    return NextResponse.redirect(target, 308);
  }

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
  matcher: ["/favorites/:path*", "/account/:path*", "/orders/:path*", "/admin/:path*", "/dashboard/:path*"],
};
