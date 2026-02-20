// app/admin/registrations/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type RowType = "user" | "newsletter";

type Row = {
  type: RowType;
  id: string;
  email: string;
  created_at: string; // ISO
  name?: string | null;
  focus?: string | null;
  has_purchased?: boolean | null;
  source?: string | null;
  device_id?: string | null;
  country?: string | null;
  city?: string | null;
};

type ApiResp = {
  ok: boolean;
  rows: Row[];
  total: number;
  stats: {
    users: number;
    newsletter: number;
    last24h: number;
    last7d: number;
  };
  error?: string;
};

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function toCsvValue(v: any) {
  const s = v === null || v === undefined ? "" : String(v);
  // escape quotes
  const esc = s.replace(/"/g, '""');
  return `"${esc}"`;
}

function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminRegistrationsPage() {
  const [type, setType] = useState<"all" | RowType>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ApiResp["stats"] | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 25;

  const mounted = useRef(true);

  const qp = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (type !== "all") p.set("type", type);
    if (q.trim()) p.set("q", q.trim());
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [page, pageSize, type, q, from, to]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/registrations?${qp}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await res.json().catch(() => null)) as ApiResp | null;

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error ||
          (res.status === 401 ? "No autorizado. Inicia sesión como admin." : "No se pudo cargar el registro.");
        if (mounted.current) setErr(msg);
        return;
      }

      if (mounted.current) {
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setStats(data.stats || null);
      }
    } catch {
      if (mounted.current) setErr("Error de red. Revisa tu conexión.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qp]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function onApplyFilters() {
    setPage(1);
    load();
  }

  async function onExportCsv() {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/registrations/export?${qp}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        const msg = j?.error || (res.status === 401 ? "No autorizado." : "No se pudo exportar.");
        setErr(msg);
        return;
      }
      const csv = await res.text();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadCsv(`jusp_registrations_${stamp}.csv`, csv);
    } catch {
      setErr("Error de red al exportar.");
    }
  }

  const header = (
    <div className="head">
      <div className="title">
        <div className="kicker">Admin</div>
        <h1>Registro de usuarios</h1>
        <p>Usuarios (auth/profile) + Newsletter/Waitlist. Solo para ti.</p>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="sN">{stats?.users ?? "—"}</div>
          <div className="sL">Usuarios</div>
        </div>
        <div className="stat">
          <div className="sN">{stats?.newsletter ?? "—"}</div>
          <div className="sL">Newsletter</div>
        </div>
        <div className="stat">
          <div className="sN">{stats?.last24h ?? "—"}</div>
          <div className="sL">Últ. 24h</div>
        </div>
        <div className="stat">
          <div className="sN">{stats?.last7d ?? "—"}</div>
          <div className="sL">Últ. 7 días</div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="root">
      <div className="shell">
        {header}

        <section className="panel">
          <div className="filters">
            <div className="f">
              <label>Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} disabled={loading}>
                <option value="all">Todo</option>
                <option value="user">Usuarios</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>

            <div className="f">
              <label>Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="email, nombre, source…"
                disabled={loading}
              />
            </div>

            <div className="f">
              <label>Desde</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={loading} />
            </div>

            <div className="f">
              <label>Hasta</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={loading} />
            </div>

            <div className="actions">
              <button className="btn" onClick={onApplyFilters} disabled={loading}>
                {loading ? "Cargando…" : "Aplicar"}
              </button>
              <button className="btn ghost" onClick={onExportCsv} disabled={loading || total === 0}>
                Exportar CSV
              </button>
            </div>
          </div>

          {err ? (
            <div className="alert" role="alert">
              <span className="bang">!</span>
              <span>{err}</span>
            </div>
          ) : null}

          <div className="tableWrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Fuente</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      {loading ? "Cargando…" : "Sin registros con esos filtros."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={`${r.type}:${r.id}`}>
                      <td>
                        <span className={`pill ${r.type}`}>{r.type === "user" ? "Usuario" : "Newsletter"}</span>
                      </td>
                      <td className="mono">{r.email}</td>
                      <td>{r.name || "—"}</td>
                      <td className="muted">{r.source || "—"}</td>
                      <td className="muted">{fmtDate(r.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <div className="muted">
              {total === 0 ? "0" : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)}`} de {total}
            </div>

            <div className="pgBtns">
              <button className="btn ghost" onClick={() => setPage(1)} disabled={loading || page <= 1}>
                «
              </button>
              <button className="btn ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
                ‹
              </button>
              <div className="pgNow">
                <span className="mono">{page}</span>
                <span className="muted">/ {totalPages}</span>
              </div>
              <button
                className="btn ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || page >= totalPages}
              >
                ›
              </button>
              <button className="btn ghost" onClick={() => setPage(totalPages)} disabled={loading || page >= totalPages}>
                »
              </button>
            </div>
          </div>
        </section>

        <section className="note">
          <div className="noteCard">
            <div className="noteTitle">Seguridad</div>
            <div className="noteText">
              Este panel consume <span className="mono">/api/admin/registrations</span> protegido por cookie admin HttpOnly. Si no estás
              logueado como admin, responderá 401.
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 48px;
          background: radial-gradient(1100px 600px at 20% 0%, rgba(0, 0, 0, 0.06), transparent 55%),
            radial-gradient(900px 520px at 90% 15%, rgba(0, 0, 0, 0.04), transparent 60%),
            #f7f7f7;
          min-height: 100vh;
        }
        .shell {
          max-width: 1100px;
          margin: 0 auto;
        }
        .head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: end;
          margin-bottom: 14px;
        }
        .kicker {
          font-weight: 950;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.55);
        }
        .title h1 {
          margin: 6px 0 4px;
          font-size: 34px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111;
        }
        .title p {
          margin: 0;
          color: rgba(0, 0, 0, 0.68);
          font-size: 14px;
          line-height: 1.6;
          max-width: 620px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(110px, 1fr));
          gap: 10px;
        }
        .stat {
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.06);
          padding: 10px 12px;
        }
        .sN {
          font-weight: 950;
          font-size: 18px;
          color: #111;
        }
        .sL {
          margin-top: 4px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.58);
          font-weight: 800;
        }

        .panel {
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
          padding: 14px;
          overflow: hidden;
        }
        .filters {
          display: grid;
          grid-template-columns: 160px 1fr 160px 160px auto;
          gap: 10px;
          align-items: end;
          padding: 6px 6px 10px;
        }
        .f label {
          display: block;
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
          margin-bottom: 6px;
        }
        .f input,
        .f select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          padding: 11px 12px;
          font-size: 14px;
          outline: none;
        }
        .f input:focus,
        .f select:focus {
          border-color: rgba(0, 0, 0, 0.34);
          box-shadow: 0 0 0 4px rgba(255, 214, 0, 0.25);
        }
        .actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .btn {
          border: 0;
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          background: #111;
          color: #fff;
          font-size: 14px;
          white-space: nowrap;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.9);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .alert {
          margin: 6px 6px 0;
          display: flex;
          gap: 10px;
          align-items: center;
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(198, 31, 31, 0.08);
          border: 1px solid rgba(198, 31, 31, 0.2);
          color: rgba(120, 18, 18, 0.95);
        }
        .bang {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(198, 31, 31, 0.18);
          font-weight: 950;
          flex: 0 0 auto;
        }

        .tableWrap {
          margin-top: 10px;
          overflow: auto;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
        }
        .t {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }
        .t th,
        .t td {
          padding: 12px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          text-align: left;
          font-size: 13px;
        }
        .t th {
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.6);
          background: rgba(0, 0, 0, 0.02);
        }
        .t tr:hover td {
          background: rgba(0, 0, 0, 0.015);
        }
        .empty {
          padding: 22px 12px;
          text-align: center;
          color: rgba(0, 0, 0, 0.55);
        }
        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-weight: 950;
          font-size: 12px;
          border: 1px solid rgba(0, 0, 0, 0.12);
        }
        .pill.user {
          background: rgba(0, 0, 0, 0.06);
          color: #111;
        }
        .pill.newsletter {
          background: rgba(255, 214, 0, 0.18);
          border-color: rgba(255, 214, 0, 0.28);
          color: rgba(0, 0, 0, 0.8);
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .muted {
          color: rgba(0, 0, 0, 0.55);
        }

        .pager {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 8px 6px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pgBtns {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .pgNow {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          padding: 0 4px;
          font-weight: 900;
        }

        .note {
          margin-top: 12px;
        }
        .noteCard {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 12px 14px;
          backdrop-filter: blur(10px);
        }
        .noteTitle {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.85);
        }
        .noteText {
          margin-top: 6px;
          color: rgba(0, 0, 0, 0.62);
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 980px) {
          .head {
            grid-template-columns: 1fr;
          }
          .stats {
            grid-template-columns: repeat(2, minmax(120px, 1fr));
          }
          .filters {
            grid-template-columns: 1fr 1fr;
          }
          .actions {
            grid-column: 1 / -1;
            justify-content: flex-start;
          }
          .t {
            min-width: 720px;
          }
        }
      `}</style>
    </main>
  );
}
