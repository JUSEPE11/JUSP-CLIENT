// app/api/admin/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DailyPoint = { day: string; count: number };

function dayKey(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdminAuthed(req)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const supabase = supabaseAdmin();

    // ⚠️ listUsers es paginado. Para métricas, lo recorremos con un cap razonable.
    const perPage = 1000;
    let page = 1;
    let total = 0;
    const daily = new Map<string, number>();

    // últimos 60 días
    const since = Date.now() - 60 * 24 * 60 * 60 * 1000;

    while (page <= 10) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) break;

      const users = data?.users || [];
      total += users.length;

      for (const u of users) {
        const created = u.created_at ? Date.parse(u.created_at) : NaN;
        if (!Number.isFinite(created)) continue;
        if (created < since) continue;

        const k = dayKey(new Date(created));
        daily.set(k, (daily.get(k) || 0) + 1);
      }

      if (users.length < perPage) break;
      page += 1;
    }

    // Construir serie ordenada (últimos 30 días)
    const days: DailyPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const k = dayKey(d);
      days.push({ day: k, count: daily.get(k) || 0 });
    }

    const last7 = days.slice(-7).reduce((a, x) => a + x.count, 0);
    const last30 = days.reduce((a, x) => a + x.count, 0);

    return NextResponse.json(
      { ok: true, totalUsers: total, last7, last30, daily: days },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
