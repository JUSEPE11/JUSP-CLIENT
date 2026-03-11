"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

function isEmailLike(v: string) {
  const s = v.trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function clean(v: string) {
  return v.trim();
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);

  const emailOk = useMemo(() => (email ? isEmailLike(email) : true), [email]);

  const canSubmit = useMemo(() => {
    const e = clean(email);
    if (!e) return false;
    if (!isEmailLike(e)) return false;
    return status !== "loading";
  }, [email, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setErr(null);

    const e1 = clean(email);

    if (!e1) {
      setErr("Escribe tu correo.");
      return;
    }

    if (!isEmailLike(e1)) {
      setErr("Ese correo no parece válido.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e1 }),
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          "No se pudo procesar la solicitud. Intenta de nuevo.";

        setErr(String(msg));
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErr("Error de red. Revisa tu conexión e intenta de nuevo.");
      setStatus("error");
    }
  }

  return (
    <main className="fp-root">
      <div className="fp-shell">
        <div className="fp-card">
          <div className="fp-head">
            <div className="fp-kicker">Cuenta</div>
            <h1 className="fp-title">Recuperar contraseña</h1>
            <p className="fp-sub">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {err ? (
            <div className="fp-alert" role="alert" aria-live="polite">
              <div className="fp-alert-ico" aria-hidden="true">
                !
              </div>
              <div>{err}</div>
            </div>
          ) : null}

          {status === "success" ? (
            <div className="fp-success" role="status" aria-live="polite">
              <h2 className="fp-success-title">Revisa tu correo</h2>
              <p className="fp-success-text">
                Si existe una cuenta con ese email, te enviaremos un enlace para recuperar tu contraseña.
              </p>

              <div className="fp-actions">
                <Link className="fp-btn fp-btn-ghost" href="/login">
                  Volver a iniciar sesión
                </Link>
              </div>
            </div>
          ) : (
            <form className="fp-form" onSubmit={onSubmit}>
              <label className="fp-field">
                <span className="fp-label">Correo</span>
                <input
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className={`fp-input ${!emailOk ? "bad" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                />
                {!emailOk ? (
                  <span className="fp-hint bad">Revisa el formato del correo.</span>
                ) : (
                  <span className="fp-hint">Usaremos este correo para enviarte el enlace.</span>
                )}
              </label>

              <div className="fp-actions">
                <button
                  className="fp-btn"
                  type="submit"
                  disabled={!canSubmit}
                  aria-busy={status === "loading"}
                >
                  {status === "loading" ? "Enviando…" : "Enviar enlace"}
                </button>

                <Link className="fp-btn fp-btn-ghost" href="/login">
                  Volver
                </Link>
              </div>
            </form>
          )}
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
        .fp-root {
          min-height: 100vh;
          padding: calc(var(--jusp-header-h, 64px) + 24px) 16px 32px;
        }
        .fp-shell {
          max-width: 560px;
          margin: 0 auto;
        }
        .fp-card {
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
          padding: 20px;
          backdrop-filter: blur(10px);
        }
        .fp-head {
          margin-bottom: 14px;
        }
        .fp-kicker {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.55);
        }
        .fp-title {
          margin: 8px 0 6px;
          font-size: 30px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111;
        }
        .fp-sub {
          margin: 0;
          color: rgba(0, 0, 0, 0.72);
          font-size: 14px;
          line-height: 1.6;
        }
        .fp-alert {
          margin: 10px 0 0;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(198, 31, 31, 0.08);
          border: 1px solid rgba(198, 31, 31, 0.2);
          color: rgba(120, 18, 18, 0.95);
        }
        .fp-alert-ico {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(198, 31, 31, 0.18);
          font-weight: 900;
          flex: 0 0 auto;
        }
        .fp-form {
          margin-top: 14px;
          display: grid;
          gap: 14px;
        }
        .fp-field {
          display: grid;
          gap: 7px;
        }
        .fp-label {
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.78);
        }
        .fp-input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          padding: 12px 12px;
          font-size: 14px;
          outline: none;
        }
        .fp-input:focus {
          border-color: rgba(0, 0, 0, 0.34);
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
        }
        .fp-input.bad {
          border-color: rgba(198, 31, 31, 0.45);
          box-shadow: none;
        }
        .fp-hint {
          min-height: 16px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
        }
        .fp-hint.bad {
          color: rgba(198, 31, 31, 0.9);
        }
        .fp-actions {
          display: grid;
          gap: 10px;
        }
        .fp-btn {
          border: 0;
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          background: #111;
          color: #fff;
          font-size: 14px;
          text-align: center;
          text-decoration: none;
        }
        .fp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .fp-btn-ghost {
          background: rgba(255, 255, 255, 0.9);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
        }
        .fp-btn-ghost:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .fp-success {
          margin-top: 14px;
          border-radius: 18px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.22);
        }
        .fp-success-title {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 900;
          color: #111;
        }
        .fp-success-text {
          margin: 0 0 14px;
          color: rgba(0, 0, 0, 0.72);
          font-size: 14px;
          line-height: 1.6;
        }
      `}</style>
    </main>
  );
}