"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

// ✅ Queremos que después de login vaya a HOME con sesión iniciada
const HOME_ROUTE = "/";

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

function nextFromMe(me: any): string {
  // Esperado: { ok: true, user: { profile: null | object } }
  if (me?.ok !== true) return "/login";
  const profile = me?.user?.profile ?? null;

  // ✅ Si NO hay profile -> onboarding
  if (profile === null) return "/onboarding";

  // ✅ Si HAY profile -> HOME
  return HOME_ROUTE;
}

export default function LoginPage() {
  const r = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const mounted = useRef(true);

  const emailOk = useMemo(() => (email ? isEmailLike(email) : true), [email]);
  const pwOk = useMemo(() => (password ? password.length >= 6 : true), [password]);

  const canSubmit = useMemo(() => {
    const e = clean(email);
    const p = password;
    if (!e || !p) return false;
    if (!isEmailLike(e)) return false;
    if (p.length < 6) return false;
    return status !== "loading";
  }, [email, password, status]);

  useEffect(() => {
    mounted.current = true;
    emailRef.current?.focus();
    return () => {
      mounted.current = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setErr(null);

    const e1 = clean(email);
    const p1 = password;

    if (!e1) return setErr("Escribe tu correo.");
    if (!isEmailLike(e1)) return setErr("Ese correo no parece válido.");
    if (!p1) return setErr("Escribe tu contraseña.");
    if (p1.length < 6) return setErr("La contraseña debe tener mínimo 6 caracteres.");

    setStatus("loading");

    try {
      // 1) LOGIN (setea cookies)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e1, password: p1 }),
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          (res.status === 401
            ? "Correo o contraseña incorrectos."
            : res.status === 429
              ? "Demasiados intentos. Intenta más tarde."
              : "No se pudo iniciar sesión. Intenta de nuevo.");

        if (mounted.current) {
          setErr(String(msg));
          setStatus("error");
        }
        return;
      }

      // 2) /me decide next real (HOME si hay profile, onboarding si falta)
      let next = HOME_ROUTE;

      try {
        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const me = await safeJson(meRes);

        if (meRes.ok && me?.ok === true) next = nextFromMe(me);
        else next = HOME_ROUTE;
      } catch {
        // Si falla /me, igual vamos a HOME; el gate server-side decidirá.
        next = HOME_ROUTE;
      }

      if (mounted.current) setStatus("success");

      // 3) NAV + HARD LOAD para asegurar que el Server lea cookies SI O SI
      r.replace(next);
      window.location.assign(next);
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

          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-sub">Entra rápido. Compra con calma. Tu cuenta guarda favoritos, carrito y pedidos.</p>

          <div className="auth-perks">
            <div className="perk">
              <span className="perk-dot" />
              <span>Originalidad verificada</span>
            </div>
            <div className="perk">
              <span className="perk-dot" />
              <span>Envío cross-border</span>
            </div>
            <div className="perk">
              <span className="perk-dot" />
              <span>Soporte y garantía</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-card-kicker">Cuenta</div>
            <div className="auth-card-h">Bienvenido de vuelta</div>
            <div className="auth-card-p">Ingresa con tus datos.</div>
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
              <span className="field-label">Correo</span>
              <input
                ref={emailRef}
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "loading"}
                />
                <button
                  className="pw-toggle"
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={status === "loading"}
                >
                  {showPw ? "Ocultar" : "Ver"}
                </button>
              </div>
              {!pwOk ? <span className="field-hint bad">Mínimo 6 caracteres.</span> : <span className="field-hint">Tip: usa una contraseña segura.</span>}
            </label>

            <div className="auth-row">
              <div className="mini">
                <span className="mini-dot" />
                <span>Sesión segura</span>
              </div>

              <div className="auth-links-right">
                <Link className="link subtle-link" href="/forgot-password">
                  ¿Olvidaste tu contraseña?
                </Link>
                <Link className="link" href="/ayuda">
                  ¿Necesitas ayuda?
                </Link>
              </div>
            </div>

            <button className="btn" type="submit" disabled={!canSubmit} aria-busy={status === "loading"}>
              {status === "loading" ? (
                <span className="btn-inner">
                  <span className="spinner" aria-hidden="true" />
                  Entrando…
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </button>

            <div className="divider">
              <span />
              <em>o</em>
              <span />
            </div>

            <Link className="btn ghost" href="/register">
              Crear cuenta
            </Link>

            <div className="auth-foot">
              <span className="muted">Al continuar aceptas</span>{" "}
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
          background:
            radial-gradient(900px 420px at 14% 4%, rgba(255, 214, 0, 0.18), transparent 62%),
            radial-gradient(780px 420px at 92% 0%, rgba(0, 0, 0, 0.055), transparent 58%),
            linear-gradient(180deg, #ffffff 0%, #f7f7f4 44%, #f1f1ee 100%);
        }
      `}</style>

      <style jsx>{`
        .auth-root {
          position: relative;
          min-height: calc(100vh - var(--jusp-header-h, 64px));
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 42px;
          overflow: hidden;
        }
        .auth-root::before {
          content: "";
          position: absolute;
          inset: 18px auto auto -120px;
          width: 360px;
          height: 360px;
          border-radius: 999px;
          background: rgba(255, 214, 0, 0.13);
          filter: blur(28px);
          pointer-events: none;
        }
        .auth-root::after {
          content: "";
          position: absolute;
          right: -160px;
          bottom: -180px;
          width: 430px;
          height: 430px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.045);
          filter: blur(34px);
          pointer-events: none;
        }
        .auth-shell {
          position: relative;
          z-index: 1;
          max-width: 1080px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.08fr 1fr;
          gap: 28px;
          align-items: start;
        }
        .auth-left {
          padding: 30px 10px;
        }
        .auth-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .auth-logo {
          font-weight: 950;
          letter-spacing: 0.16em;
          color: #111;
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        .auth-title {
          margin: 10px 0 10px;
          font-size: clamp(38px, 5vw, 64px);
          line-height: 0.92;
          font-weight: 950;
          letter-spacing: -0.06em;
          color: #0b0b0b;
          text-wrap: balance;
        }
        .auth-sub {
          margin: 0;
          max-width: 500px;
          color: rgba(0, 0, 0, 0.68);
          font-size: 15px;
          line-height: 1.75;
        }
        .auth-perks {
          margin-top: 26px;
          display: grid;
          gap: 12px;
          max-width: 450px;
        }
        .perk {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 15px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.74);
          border: 1px solid rgba(0, 0, 0, 0.075);
          color: rgba(0, 0, 0, 0.78);
          font-size: 13px;
          font-weight: 750;
          backdrop-filter: blur(14px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.045);
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
          position: relative;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.78);
          box-shadow:
            0 34px 90px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.86);
          padding: 18px;
          overflow: hidden;
          backdrop-filter: blur(18px);
        }
        .auth-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 214, 0, 0.24), rgba(0, 0, 0, 0.08));
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
          pointer-events: none;
        }
        .auth-card-head {
          padding: 14px 12px 10px;
        }
        .auth-card-kicker {
          font-weight: 950;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.5);
        }
        .auth-card-h {
          margin-top: 7px;
          font-size: 24px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.035em;
          color: #0b0b0b;
        }
        .auth-card-p {
          margin-top: 8px;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.62);
          line-height: 1.55;
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
          padding: 12px;
          display: grid;
          gap: 14px;
        }
        .field {
          display: grid;
          gap: 7px;
        }
        .field-label {
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.76);
        }
        .field-input {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.96);
          padding: 14px 14px;
          font-size: 15px;
          font-weight: 700;
          color: #111;
          caret-color: #111;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 24px rgba(0, 0, 0, 0.04);
          transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, background 160ms ease;
        }
        .field-input::placeholder {
          color: rgba(0, 0, 0, 0.34);
          font-weight: 650;
        }
        .field-input:focus {
          border-color: rgba(0, 0, 0, 0.42);
          background: #fff;
          box-shadow: 0 0 0 5px rgba(255, 214, 0, 0.22), 0 18px 34px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        .field-input:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #111 !important;
          caret-color: #111 !important;
          box-shadow: 0 0 0 1000px #fff inset !important;
          transition: background-color 9999s ease-in-out 0s;
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
          min-width: 64px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          border-radius: 16px;
          padding: 12px 13px;
          font-weight: 950;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.045);
          transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .pw-toggle:hover {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.075);
        }
        .auth-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .auth-links-right {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .mini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
        }
        .mini-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }
        .btn {
          border: 0;
          border-radius: 999px;
          padding: 14px 16px;
          font-weight: 950;
          cursor: pointer;
          background: linear-gradient(135deg, #111 0%, #2b2b2b 100%);
          color: #fff;
          font-size: 14px;
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.18);
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 22px 48px rgba(0, 0, 0, 0.22);
        }
        .btn:disabled {
          opacity: 0.46;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.94);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.12);
          text-align: center;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.055);
        }
        .btn.ghost:hover {
          background: #fff;
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
          color: rgba(0, 0, 0, 0.82);
          font-weight: 950;
          text-decoration: none;
        }
        .link:hover {
          text-decoration: underline;
        }
        .subtle-link {
          color: rgba(0, 0, 0, 0.66);
        }
        .subtle-link:hover {
          color: #111;
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
            font-size: 38px;
          }
        }
        @media (max-width: 560px) {
          .auth-row {
            align-items: flex-start;
          }
          .auth-links-right {
            width: 100%;
            justify-content: space-between;
            gap: 8px 12px;
          }
        }
      `}</style>
    </main>
  );
}