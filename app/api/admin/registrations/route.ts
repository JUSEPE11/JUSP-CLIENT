// app/api/admin/registrations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthed } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function parseDateOnly(v: string | null) {
  if (!v) return null;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  // inclusive start
  return new Date(`${s}T00:00:00.000Z`).toISOString();
}

function parseDateOnlyEnd(v: string | null) {
  if (!v) return null;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  // inclusive end -> next day start
  const d = new Date(`${s}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const ok = isAdminAuthed(req);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { ok: false, error: "Missing SUPABASE envs (NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);

    const type = (searchParams.get("type") || "all").toLowerCase();
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("pageSize") || "25") || 25));
    const fromIso = parseDateOnly(searchParams.get("from"));
    const toIso = parseDateOnlyEnd(searchParams.get("to"));

    // Stats windows
    const now = new Date();
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // We query both sources, then merge/sort/paginate in memory (simple + safe for admin scale).
    // USERS
    let users: any[] = [];
    let usersCount = 0;

    if (type === "all" || type === "user") {
      let uq = sb.from("user_profiles").select("id,email,name,focus,has_purchased,created_at", { count: "exact" });

      if (fromIso) uq = uq.gte("created_at", fromIso);
      if (toIso) uq = uq.lt("created_at", toIso);
      if (q) {
        // OR filter on email/name
        uq = uq.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
      }

      const ures = await uq;
      if (ures.error) {
        return NextResponse.json({ ok: false, error: `Supabase user_profiles error: ${ures.error.message}` }, { status: 500 });
      }
      users = (ures.data || []).map((u) => ({
        type: "user",
        id: String(u.id),
        email: u.email,
        name: u.name ?? null,
        focus: u.focus ?? null,
        has_purchased: u.has_purchased ?? null,
        created_at: u.created_at,
        source: "auth",
      }));
      usersCount = ures.count ?? users.length;
    }

    // NEWSLETTER
    let news: any[] = [];
    let newsCount = 0;

    if (type === "all" || type === "newsletter") {
      let nq = sb
        .from("newsletter_subscribers")
        .select("id,email,source,device_id,country,city,created_at", { count: "exact" });

      if (fromIso) nq = nq.gte("created_at", fromIso);
      if (toIso) nq = nq.lt("created_at", toIso);
      if (q) {
        nq = nq.or(`email.ilike.%${q}%,source.ilike.%${q}%`);
      }

      const nres = await nq;
      if (nres.error) {
        return NextResponse.json(
          { ok: false, error: `Supabase newsletter_subscribers error: ${nres.error.message}` },
          { status: 500 }
        );
      }
      news = (nres.data || []).map((n) => ({
        type: "newsletter",
        id: String(n.id),
        email: n.email,
        created_at: n.created_at,
        source: n.source ?? null,
        device_id: n.device_id ?? null,
        country: n.country ?? null,
        city: n.city ?? null,
      }));
      newsCount = nres.count ?? news.length;
    }

    // Merge + sort desc by created_at
    const all = [...users, ...news].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    });

    const total = all.length;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = all.slice(start, end);

    const stats = {
      users: usersCount,
      newsletter: newsCount,
      last24h: all.filter((x) => x.created_at >= last24).length,
      last7d: all.filter((x) => x.created_at >= last7).length,
    };

    return NextResponse.json(
      { ok: true, rows: pageRows, total, stats },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown_error" }, { status: 500 });
  }
}
