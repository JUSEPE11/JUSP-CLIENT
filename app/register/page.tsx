// app/register/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
function strength(pw: string) {
  const s = pw || "";
  let score = 0;
  if (s.length >= 8) score += 1;
  if (/[A-Z]/.test(s)) score += 1;
  if (/[0-9]/.test(s)) score += 1;
  if (/[^A-Za-z0-9]/.test(s)) score += 1;
  return score; // 0..4
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const mounted = useRef(true);

  const emailOk = useMemo(() => (email ? isEmailLike(email) : true), [email]);
  const pwOk = useMemo(() => (password ? password.length >= 8 : true), [password]);
  const matchOk = useMemo(() => (confirm ? confirm === password : true), [confirm, password]);
  const pwScore = useMemo(() => strength(password), [password]);

  const canSubmit = useMemo(() => {
    const n = clean(name);
    const e = clean(email);
    if (!n || !e || !password || !confirm) return false;
    if (!isEmailLike(e)) return false;
    if (password.length < 8) return false;
    if (password !== confirm) return false;
    return status !== "loading";
  }, [name, email, password, confirm, status]);

  useEffect(() => {
    mounted.current = true;
    nameRef.current?.focus();
    return () => {
      mounted.current = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setErr(null);

    const n = clean(name);
    const e1 = clean(email);
    const p1 = password;
    const c1 = confirm;

    if (!n) return setErr("Escribe tu nombre.");
    if (!e1) return setErr("Escribe tu correo.");
    if (!isEmailLike(e1)) return setErr("Ese correo no parece válido.");
    if (!p1 || p1.length < 8) return setErr("Tu contraseña debe tener mínimo 8 caracteres.");
    if (p1 !== c1) return setErr("Las contraseñas no coinciden.");

    setStatus("loading");

    try {
      // Registro + envío OTP real (6 dígitos) al correo
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: n, email: e1, password: p1 }),
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          (res.status === 409 ? "Ese correo ya está registrado." : "No se pudo crear la cuenta. Intenta de nuevo.");
        if (mounted.current) {
          setErr(String(msg));
          setStatus("error");
        }
        return;
      }

      if (mounted.current) setStatus("success");

      // Ir a verificación por código
      const url = `/verify?email=${encodeURIComponent(e1)}`;
      window.location.assign(url);
    } catch {
      if (mounted.current) {
        setErr("Error de red. Revisa tu conexión e intenta de nuevo.");
        setStatus("error");
      }
    }
  }

  return (
    <main className="auth-root">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo">JUSP</div>
          </div>

          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-sub">Regístrate para guardar favoritos, ver pedidos, drops y comprar más rápido.</p>

          <div className="auth-perks">
            <div className="perk">
              <span className="perk-dot" />
              <span>Atajos (buscar con /)</span>
            </div>
            <div className="perk">
              <span className="perk-dot" />
              <span>Checkout más rápido</span>
            </div>
            <div className="perk">
              <span className="perk-dot" />
              <span>Mis pedidos y trazabilidad</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-card-kicker">Cuenta</div>
            <div className="auth-card-h">Crea tu acceso</div>
            <div className="auth-card-p">Te enviaremos un código de 6 dígitos a tu correo para verificar.</div>
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
              <span className="field-label">Nombre</span>
              <input
                ref={nameRef}
                className="field-input"
                type="text"
                autoComplete="name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "loading"}
              />
              <span className="field-hint">Como te quieres ver en tu cuenta.</span>
            </label>

            <label className="field">
              <span className="field-label">Correo</span>
              <input
                className={`field-input ${!emailOk ? "bad" : ""}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
              />
              {!emailOk ? <span className="field-hint bad">Revisa el formato del correo.</span> : <span className="field-hint" />}
            </label>

            <label className="field">
              <span className="field-label">Contraseña</span>
              <div className={`field-row ${!pwOk ? "bad" : ""}`}>
                <input
                  className="field-input row"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "loading"}
                />
                <button className="pw-toggle" type="button" onClick={() => setShowPw((v) => !v)} disabled={status === "loading"}>
                  {showPw ? "Ocultar" : "Ver"}
                </button>
              </div>

              <div className="pw-meter" aria-hidden="true">
                <div className={`pw-bar ${pwScore >= 1 ? "on" : ""}`} />
                <div className={`pw-bar ${pwScore >= 2 ? "on" : ""}`} />
                <div className={`pw-bar ${pwScore >= 3 ? "on" : ""}`} />
                <div className={`pw-bar ${pwScore >= 4 ? "on" : ""}`} />
              </div>

              {!pwOk ? <span className="field-hint bad">Recomendado: 8+ caracteres.</span> : <span className="field-hint">Tip: mezcla mayúscula, número y símbolo.</span>}
            </label>

            <label className="field">
              <span className="field-label">Confirmar contraseña</span>
              <div className={`field-row ${!matchOk ? "bad" : ""}`}>
                <input
                  className="field-input row"
                  type={showPw2 ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={status === "loading"}
                />
                <button className="pw-toggle" type="button" onClick={() => setShowPw2((v) => !v)} disabled={status === "loading"}>
                  {showPw2 ? "Ocultar" : "Ver"}
                </button>
              </div>
              {!matchOk ? <span className="field-hint bad">No coincide.</span> : <span className="field-hint" />}
            </label>

            <button className="btn" type="submit" disabled={!canSubmit} aria-busy={status === "loading"}>
              {status === "loading" ? (
                <span className="btn-inner">
                  <span className="spinner" aria-hidden="true" />
                  Creando cuenta…
                </span>
              ) : (
                "Registrarse"
              )}
            </button>

            <div className="divider">
              <span />
              <em>o</em>
              <span />
            </div>

            <Link className="btn ghost" href="/login">
              Ya tengo cuenta
            </Link>

            <div className="auth-foot">
              <span className="muted">Al registrarte aceptas</span>{" "}
              <Link className="link" href="/ayuda">
                términos y políticas
              </Link>
              .
            </div>
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
        .auth-perks {
          margin-top: 18px;
          display: grid;
          gap: 10px;
          max-width: 420px;
        }
        .perk {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: rgba(0, 0, 0, 0.8);
          font-size: 13px;
          backdrop-filter: blur(10px);
        }
        .perk-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 214, 0, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.08);
          flex: 0 0 auto;
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
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
        }
        .field-input.bad,
        .field-row.bad .field-input {
          border-color: rgba(198, 31, 31, 0.45);
          box-shadow: none;
        }
        .field-hint {
          min-height: 16px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
        }
        .field-hint.bad {
          color: rgba(198, 31, 31, 0.9);
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
        }
        .pw-toggle {
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 900;
          font-size: 12px;
          cursor: pointer;
        }
        .pw-toggle:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .pw-meter {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 8px;
        }
        .pw-bar {
          height: 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .pw-bar.on {
          background: rgba(255, 214, 0, 0.8);
          border-color: rgba(0, 0, 0, 0.08);
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
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.9);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
          text-align: center;
        }
        .btn.ghost:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .btn-inner {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: rgba(255, 255, 255, 0.95);
          animation: spin 0.8s linear infinite;
        }
        .divider {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 10px;
          align-items: center;
          color: rgba(0, 0, 0, 0.5);
          font-size: 12px;
          margin: 2px 0;
        }
        .divider span {
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
        }
        .divider em {
          font-style: normal;
          font-weight: 900;
          opacity: 0.6;
        }
        .auth-foot {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.65);
          line-height: 1.5;
        }
        .muted {
          opacity: 0.8;
        }
        .link {
          color: rgba(0, 0, 0, 0.8);
          font-weight: 900;
          text-decoration: none;
        }
        .link:hover {
          text-decoration: underline;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 900px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }
          .auth-left {
            padding: 8px 4px 0;
          }
          .auth-title {
            font-size: 28px;
          }
        }
      `}</style>
    </main>
  );
}
