import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNext(next: string | null) {
  if (!next || !next.startsWith("/")) return "/reset-password";
  return next;
}

function withError(url: URL, error: string, description?: string) {
  const target = new URL("/forgot-password", url.origin);
  target.searchParams.set("error", error);
  if (description) target.searchParams.set("error_description", description);
  return target;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"));

  if (!tokenHash) {
    return NextResponse.redirect(
      withError(url, "missing_token_hash", "El enlace no trae token_hash.")
    );
  }

  if (type !== "recovery") {
    return NextResponse.redirect(
      withError(url, "invalid_type", "El tipo del enlace no es recovery.")
    );
  }

  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (error) {
    return NextResponse.redirect(
      withError(
        url,
        error.name || "verify_otp_failed",
        error.message || "No se pudo validar el enlace de recuperación."
      )
    );
  }

  return response;
}