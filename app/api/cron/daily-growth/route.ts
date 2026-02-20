// app/api/cron/daily-growth/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dayKey(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Contar usuarios creados ayer (usando listUsers con cap)
    const perPage = 1000;
    let page = 1;
    let count = 0;

    while (page <= 10) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) break;

      const users = data?.users || [];
      for (const u of users) {
        const t = u.created_at ? Date.parse(u.created_at) : NaN;
        if (!Number.isFinite(t)) continue;
        if (t >= yesterday.getTime() && t < today.getTime()) count += 1;
      }

      if (users.length < perPage) break;
      page += 1;
    }

    // Guardar en tabla opcional daily_metrics (si existe)
    const day = dayKey(yesterday);
    const { error: insErr } = await supabase.from("daily_metrics").upsert({ day, new_users: count }, { onConflict: "day" });

    return NextResponse.json(
      { ok: true, day, new_users: count, stored: !insErr, store_error: insErr ? insErr.message : null },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "CRON_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
