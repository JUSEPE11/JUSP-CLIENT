// app/api/admin/registrations/export/route.ts
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
  return new Date(`${s}T00:00:00.000Z`).toISOString();
}

function parseDateOnlyEnd(v: string | null) {
  if (!v) return null;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function csvEscape(v: any) {
  const s = v === null || v === undefined ? "" : String(v);
  const esc = s.replace(/"/g, '""');
  return `"${esc}"`;
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
    const fromIso = parseDateOnly(searchParams.get("from"));
    const toIso = parseDateOnlyEnd(searchParams.get("to"));

    // USERS
    let users: any[] = [];
    if (type === "all" || type === "user") {
      let uq = sb.from("user_profiles").select("id,email,name,focus,has_purchased,created_at");
      if (fromIso) uq = uq.gte("created_at", fromIso);
      if (toIso) uq = uq.lt("created_at", toIso);
      if (q) uq = uq.or(`email.ilike.%${q}%,name.ilike.%${q}%`);

      const ures = await uq;
      if (ures.error) {
        return NextResponse.json({ ok: false, error: `Supabase user_profiles error: ${ures.error.message}` }, { status: 500 });
      }
      users = (ures.data || []).map((u) => ({
        type: "user",
        id: String(u.id),
        email: u.email,
        name: u.name ?? "",
        source: "auth",
        created_at: u.created_at,
      }));
    }

    // NEWSLETTER
    let news: any[] = [];
    if (type === "all" || type === "newsletter") {
      let nq = sb.from("newsletter_subscribers").select("id,email,source,device_id,country,city,created_at");
      if (fromIso) nq = nq.gte("created_at", fromIso);
      if (toIso) nq = nq.lt("created_at", toIso);
      if (q) nq = nq.or(`email.ilike.%${q}%,source.ilike.%${q}%`);

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
        name: "",
        source: n.source ?? "",
        created_at: n.created_at,
      }));
    }

    const all = [...users, ...news].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const header = ["type", "id", "email", "name", "source", "created_at"];
    const lines = [
      header.map(csvEscape).join(","),
      ...all.map((r) => header.map((k) => csvEscape((r as any)[k])).join(",")),
    ];
    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="jusp_registrations.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown_error" }, { status: 500 });
  }
}
