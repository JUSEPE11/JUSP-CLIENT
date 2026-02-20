// app/admin/metrics/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

type DailyPoint = { day: string; count: number };
type MetricsOk = { ok: true; totalUsers: number; last7: number; last30: number; daily: DailyPoint[] };
type MetricsErr = { ok: false; error?: string; message?: string };
type Metrics = MetricsOk | MetricsErr;

type Status = "idle" | "loading" | "success" | "error";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function shortDay(iso: string) {
  // iso: YYYY-MM-DD
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

function safeNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function LineChart({ points }: { points: DailyPoint[] }) {
  const clean = (points || []).slice(-14);
  const values = clean.map((p) => safeNum(p.count));
  const max = Math.max(1, ...values);
  const w = 560;
  const h = 160;
  const padX = 16;
  const padY = 16;

  const pts = clean
    .map((p, i) => {
      const x = padX + (i / Math.max(1, clean.length - 1)) * (w - padX * 2);
      const y = h - padY - (safeNum(p.count) / max) * (h - padY * 2);
      return [x, y] as const;
    })
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const labels = clean.map((p) => shortDay(p.day));

  return (
    <div className="chart">
      <div className="chart-h">Crecimiento diario (últimos {clean.length} días)</div>

      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Crecimiento diario">
        {/* grid */}
        <g opacity="0.22">
          <line x1="16" y1="16" x2={w - 16} y2="16" stroke="currentColor" />
          <line x1="16" y1={h / 2} x2={w - 16} y2={h / 2} stroke="currentColor" />
          <line x1="16" y1={h - 16} x2={w - 16} y2={h - 16} stroke="currentColor" />
        </g>

        {/* line */}
        <polyline fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" points={pts} />

        {/* points */}
        {clean.map((p, i) => {
          const x = padX + (i / Math.max(1, clean.length - 1)) * (w - padX * 2);
          const y = h - padY - (safeNum(p.count) / max) * (h - padY * 2);
          return <circle key={p.day} cx={x} cy={y} r="3.2" fill="currentColor" opacity="0.9" />;
        })}
      </svg>

      <div className="chart-x">
        {labels.map((t, i) => (
          <span key={i} className="chart-tick">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminMetricsPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [metrics, setMetrics] = useState<MetricsOk | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const mounted = useRef(true);

  const totalUsers = useMemo(() => (metrics ? safeNum(metrics.totalUsers) : 0), [metrics]);
  const last7 = useMemo(() => (metrics ? safeNum(metrics.last7) : 0), [metrics]);
  const last30 = useMemo(() => (metrics ? safeNum(metrics.last30) : 0), [metrics]);

  async function load() {
    setErr(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/admin/metrics", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "cache-control": "no-store" },
      });

      const data = (await safeJson(res)) as Metrics | null;

      if (!res.ok || !data || (data as any).ok !== true) {
        const msg =
          (data && ((data as any).error || (data as any).message)) ||
          (res.status === 401 ? "No autorizado. Inicia sesión como admin." : "No se pudieron cargar métricas.");
        if (mounted.current) {
          setMetrics(null);
          setErr(String(msg));
          setStatus("error");
        }
        return;
      }

      if (mounted.current) {
        setMetrics(data as MetricsOk);
        setStatus("success");
      }
    } catch {
      if (mounted.current) {
        setMetrics(null);
        setErr("Error de red. Revisa tu conexión e intenta de nuevo.");
        setStatus("error");
      }
    }
  }

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="root">
      <div className="top">
        <div>
          <div className="kicker">Admin</div>
          <h1 className="h1">Métricas</h1>
        </div>

        <div className="top-actions">
          <button className="btn ghost" type="button" onClick={load} disabled={status === "loading"}>
            {status === "loading" ? "Actualizando…" : "Actualizar"}
          </button>
          <Link className="btn" href="/">
            Volver
          </Link>
        </div>
      </div>

      {err ? (
        <div className="alert" role="alert" aria-live="polite">
          <div className="alert-ico">!</div>
          <div className="alert-text">
            <div className="alert-h">No autorizado o sin datos</div>
            <div className="alert-p">{err}</div>
            <div className="alert-tip">Tip: abre primero tu panel admin (cookie) y luego vuelve aquí.</div>
          </div>
        </div>
      ) : null}

      <section className="grid">
        <div className="card">
          <div className="card-k">Usuarios totales</div>
          <div className="card-v">{status === "success" ? totalUsers.toLocaleString() : "—"}</div>
          <div className="card-s">Cuentas registradas en Supabase Auth</div>
        </div>

        <div className="card">
          <div className="card-k">Últimos 7 días</div>
          <div className="card-v">{status === "success" ? last7.toLocaleString() : "—"}</div>
          <div className="card-s">Nuevas cuentas verificadas</div>
        </div>

        <div className="card">
          <div className="card-k">Últimos 30 días</div>
          <div className="card-v">{status === "success" ? last30.toLocaleString() : "—"}</div>
          <div className="card-s">Crecimiento mensual</div>
        </div>
      </section>

      <section className="panel">
        {status === "loading" ? (
          <div className="skeleton">
            <div className="sh" />
            <div className="sb" />
          </div>
        ) : metrics ? (
          <LineChart points={metrics.daily} />
        ) : (
          <div className="empty">Sin datos aún.</div>
        )}
      </section>

      <style jsx>{`
        .root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 40px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 12px;
        }
        .kicker {
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.6);
        }
        .h1 {
          margin: 6px 0 0;
          font-size: 40px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #111;
        }
        .top-actions {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 950;
          cursor: pointer;
          background: #111;
          color: #fff;
          font-size: 13px;
          border: 0;
          text-decoration: none;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.9);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
        }
        .btn.ghost:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .alert {
          margin-top: 10px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border-radius: 18px;
          padding: 12px 14px;
          background: rgba(198, 31, 31, 0.08);
          border: 1px solid rgba(198, 31, 31, 0.22);
          color: rgba(120, 18, 18, 0.95);
        }
        .alert-ico {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(198, 31, 31, 0.18);
          font-weight: 950;
          flex: 0 0 auto;
          margin-top: 1px;
        }
        .alert-h {
          font-weight: 950;
          color: rgba(120, 18, 18, 0.95);
        }
        .alert-p {
          margin-top: 2px;
          color: rgba(120, 18, 18, 0.88);
          font-size: 13px;
          line-height: 1.45;
        }
        .alert-tip {
          margin-top: 6px;
          font-size: 12px;
          color: rgba(120, 18, 18, 0.7);
        }

        .grid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .card {
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.06);
          padding: 14px;
        }
        .card-k {
          font-weight: 900;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .card-v {
          margin-top: 8px;
          font-weight: 950;
          font-size: 34px;
          letter-spacing: -0.02em;
          color: #111;
        }
        .card-s {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.65);
          line-height: 1.4;
        }

        .panel {
          margin-top: 12px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.06);
          padding: 14px;
          overflow: hidden;
        }
        .empty {
          padding: 18px;
          color: rgba(0, 0, 0, 0.65);
          font-size: 13px;
        }

        .chart {
          display: grid;
          gap: 10px;
        }
        .chart-h {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.82);
        }
        .chart svg {
          color: #111;
        }
        .chart-x {
          display: grid;
          grid-template-columns: repeat(14, minmax(0, 1fr));
          gap: 6px;
          font-size: 11px;
          color: rgba(0, 0, 0, 0.55);
        }
        .chart-tick {
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .skeleton {
          display: grid;
          gap: 10px;
          padding: 10px;
        }
        .sh {
          height: 14px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.06);
        }
        .sb {
          height: 160px;
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.06);
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .h1 {
            font-size: 30px;
          }
          .chart-x {
            grid-template-columns: repeat(7, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}
