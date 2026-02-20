"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Status = "idle" | "loading" | "error" | "success";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setErr(null);

    const t = token.trim();
    if (!t) return setErr("Escribe tu token admin.");

    setStatus("loading");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: t }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        setErr((data && (data.error || data.message)) || "No autorizado.");
        setStatus("error");
        return;
      }

      setStatus("success");
      window.location.replace("/admin/metrics");
    } catch {
      setErr("Error de red.");
      setStatus("error");
    }
  }

  return (
    <main className="auth-root">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo">JUSP</div>
            <div className="auth-badge">ADMIN</div>
          </div>

          <h1 className="auth-title">Acceso Admin</h1>
          <p className="auth-sub">Ingresa tu token privado para ver métricas.</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-card-kicker">Admin</div>
            <div className="auth-card-h">Iniciar sesión</div>
            <div className="auth-card-p">Se guarda en cookie HttpOnly (no visible en el navegador).</div>
          </div>

          {err ? (
            <div className="auth-alert" role="alert" aria-live="polite">
              <div className="auth-alert-ico" aria-hidden="true">
                !
              </div>
              <div className="auth-alert-text">{err}</div>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field-label">Token admin</span>
              <input
                ref={inputRef}
                className="field-input"
                type="password"
                placeholder="••••••••••"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={status === "loading"}
              />
              <span className="field-hint">Tu token está en la variable JUSP_ADMIN_TOKEN.</span>
            </label>

            <button className="btn" type="submit" disabled={status === "loading"} aria-busy={status === "loading"}>
              {status === "loading" ? "Entrando…" : "Entrar"}
            </button>

            <Link className="btn ghost" href="/">
              Volver a JUSP
            </Link>
          </form>
        </div>
      </div>

      <style jsx global>{`
        body {
          background: radial-gradient(1200px 600px at 20% 0%, rgba(0, 0, 0, 0.06), transparent 55%),
            radial-gradient(900px 520px at 90% 15%, rgba(0, 0, 0, 0.04), transparent 60%),
            #f7f7f7;
        }
      `}</style>

      <style jsx>{`
        .auth-root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 32px;
        }
        .auth-shell {
          max-width: 1040px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 18px;
          align-items: start;
        }
        .auth-left {
          padding: 18px 10px;
        }
        .auth-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .auth-logo {
          font-weight: 900;
          letter-spacing: 0.14em;
          color: #111;
        }
        .auth-badge {
          font-weight: 900;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 214, 0, 0.55);
          color: #111;
        }
        .auth-title {
          margin: 8px 0 6px;
          font-size: 34px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111;
        }
        .auth-sub {
          margin: 0;
          max-width: 460px;
          color: rgba(0, 0, 0, 0.72);
          font-size: 14px;
          line-height: 1.6;
        }
        .auth-card {
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
          padding: 16px;
          overflow: hidden;
        }
        .auth-card-head {
          padding: 10px 10px 8px;
        }
        .auth-card-kicker {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.55);
        }
        .auth-card-h {
          margin-top: 6px;
          font-size: 18px;
          font-weight: 950;
          color: #111;
        }
        .auth-card-p {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.7);
          line-height: 1.5;
        }
        .auth-alert {
          margin: 8px 10px 0;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(198, 31, 31, 0.08);
          border: 1px solid rgba(198, 31, 31, 0.2);
          color: rgba(120, 18, 18, 0.95);
        }
        .auth-alert-ico {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(198, 31, 31, 0.18);
          font-weight: 900;
          flex: 0 0 auto;
        }
        .auth-form {
          padding: 10px;
          display: grid;
          gap: 12px;
        }
        .field {
          display: grid;
          gap: 7px;
        }
        .field-label {
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.78);
        }
        .field-input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          padding: 12px 12px;
          font-size: 14px;
          outline: none;
        }
        .field-input:focus {
          border-color: rgba(0, 0, 0, 0.34);
          box-shadow: 0 0 0 4px rgba(255, 214, 0, 0.28);
        }
        .field-hint {
          min-height: 16px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
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
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.9);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
          text-align: center;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 900px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }
          .auth-title {
            font-size: 28px;
          }
        }
      `}</style>
    </main>
  );
}
