// /app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    // ✅ Ahora es async
    const supabase = await createSupabaseServerClient();

    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Logout error" },
      { status: 500 }
    );
  }
}