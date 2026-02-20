// app/verify/VerifyClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

function clean(v: string) {
  return (v || "").trim();
}
function onlyDigits6(s: string) {
  return clean(s).replace(/\D/g, "").slice(0, 6);
}
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function VerifyClient() {
  const sp = useSearchParams();
  const emailFromUrl = clean(sp.get("email") || "");
  const emailLocked = !!emailFromUrl;

  const [email, setEmail] = useState(emailFromUrl);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // ⏱️ 60s para ingresar el código
  const [secondsLeft, setSecondsLeft] = useState<number>(60);

  const codeRef = useRef<HTMLInputElement | null>(null);
  const mounted = useRef(true);
  const timerRef = useRef<number | null>(null);

  const codeOk = useMemo(() => (code ? onlyDigits6(code).length === 6 : true), [code]);

  const timeUp = secondsLeft <= 0;

  const canSubmit = useMemo(() => {
    const e = clean(email);
    const c = onlyDigits6(code);
    if (!e) return false;
    if (c.length !== 6) return false;
    if (timeUp) return false;
    return status !== "loading";
  }, [email, code, status, timeUp]);

  // Reset cuando cambia el email por URL (y bloquearlo)
  useEffect(() => {
    mounted.current = true;

    setEmail(emailFromUrl || "");
    setCode("");
    setErr(null);
    setOkMsg(null);
    setStatus("idle");
    setSecondsLeft(60);

    // focus code
    setTimeout(() => codeRef.current?.focus(), 50);

    return () => {
      mounted.current = false;
    };
  }, [emailFromUrl]);

  // Timer de 60s (corre siempre que no estemos en success)
  useEffect(() => {
    // limpiar interval anterior
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status === "success") return;

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 0) return 0;
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  // Cuando se acaba el tiempo, avisar
  useEffect(() => {
    if (!mounted.current) return;
    if (timeUp && status !== "success" && status !== "loading") {
      setErr("Tiempo agotado. Reenvía el código.");
      setOkMsg(null);
    }
  }, [timeUp, status]);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setErr(null);
    setOkMsg(null);

    const e1 = clean(email).toLowerCase();
    const c1 = onlyDigits6(code);

    if (!e1) return setErr("Escribe tu correo.");
    if (timeUp) return setErr("Tiempo agotado. Reenvía el código.");
    if (c1.length !== 6) return setErr("Escribe el código de 6 dígitos.");

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e1, code: c1 }),
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || "No se pudo verificar. Intenta de nuevo.";
        if (mounted.current) {
          setErr(String(msg));
          setStatus("error");
        }
        return;
      }

      if (mounted.current) {
        setStatus("success");
        setOkMsg("Correo verificado ✅ Ahora personalizamos tu cuenta.");
      }

      setTimeout(() => {
        window.location.assign("/onboarding");
      }, 700);
    } catch {
      if (mounted.current) {
        setErr("Error de red. Revisa tu conexión e intenta de nuevo.");
        setStatus("error");
      }
    }
  }

  async function onResend() {
    if (status === "loading") return;

    setErr(null);
    setOkMsg(null);

    const e1 = clean(email).toLowerCase();
    if (!e1) return setErr("Escribe tu correo.");

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e1 }),
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || "No se pudo reenviar el código.";
        if (mounted.current) {
          setErr(String(msg));
          setStatus("error");
        }
        return;
      }

      if (mounted.current) {
        setOkMsg("Código reenviado ✅ Revisa tu correo.");
        setStatus("idle");
        setCode("");
        setSecondsLeft(60);
        setTimeout(() => codeRef.current?.focus(), 50);
      }
    } catch {
      if (mounted.current) {
        setErr("Error de red al reenviar.");
        setStatus("error");
      }
    }
  }

  return (
    <main className="auth-root">
      <div className="auth-shell one">
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo">JUSP</div>
          </div>

          <h1 className="auth-title">Verificar correo</h1>
          <p className="auth-sub">Te enviamos un código de 6 dígitos. Escríbelo aquí para activar tu cuenta.</p>

          <div className="auth-perks">
            <div className="perk">
              <span className="perk-dot" />
              <span>Seguro (código expira en 10 min)</span>
            </div>
            <div className="perk">
              <span className="perk-dot" />
              <span>Sin links raros</span>
            </div>
            <div className="perk">
              <span className="perk-dot" />
              <span>Listo para comprar</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-card-kicker">Verificación</div>
            <div className="auth-card-h">Código de 6 dígitos</div>
            <div className="auth-card-p">Si no llega, revisa Spam o reenvía.</div>
          </div>

          {err ? (
            <div className="auth-alert" role="alert" aria-live="polite">
              <div className="auth-alert-ico" aria-hidden="true">
                !
              </div>
              <div className="auth-alert-text">{err}</div>
            </div>
          ) : null}

          {okMsg ? (
            <div className="auth-ok" role="status" aria-live="polite">
              <div className="auth-ok-ico" aria-hidden="true">
                ✓
              </div>
              <div className="auth-ok-text">{okMsg}</div>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={onVerify}>
            <label className="field">
              <span className="field-label">Correo</span>
              <input
                className={`field-input ${emailLocked ? "locked" : ""}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  if (emailLocked) return;
                  setEmail(e.target.value);
                }}
                disabled={status === "loading" || emailLocked}
                readOnly={emailLocked}
              />
              <span className="field-hint">
                {emailLocked ? "Este correo está bloqueado (viene del registro)." : "Usa el mismo correo con el que te registraste."}
              </span>
            </label>

            <label className="field">
              <span className="field-label" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>Código</span>
                <span className={`timer ${timeUp ? "bad" : ""}`} aria-live="polite">
                  {timeUp ? "00:00" : `00:${String(secondsLeft).padStart(2, "0")}`}
                </span>
              </span>

              <input
                ref={codeRef}
                className={`field-input ${!codeOk || timeUp ? "bad" : ""}`}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(onlyDigits6(e.target.value))}
                disabled={status === "loading" || timeUp}
              />

              {timeUp ? (
                <span className="field-hint bad">Tiempo agotado. Reenvía el código.</span>
              ) : !codeOk ? (
                <span className="field-hint bad">El código debe tener 6 dígitos.</span>
              ) : (
                <span className="field-hint">Ej: 123456</span>
              )}
            </label>

            <button className="btn" type="submit" disabled={!canSubmit} aria-busy={status === "loading"}>
              {status === "loading" ? (
                <span className="btn-inner">
                  <span className="spinner" aria-hidden="true" />
                  Verificando…
                </span>
              ) : (
                "Verificar"
              )}
            </button>

            <button className="btn ghost" type="button" onClick={onResend} disabled={status === "loading"}>
              Reenviar código
            </button>

            <div className="auth-foot">
              <span className="muted">¿Ya verificaste?</span>{" "}
              <Link className="link" href="/login">
                Iniciar sesión
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
        .auth-shell.one {
          grid-template-columns: 1fr 1fr;
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
        .auth-alert,
        .auth-ok {
          margin: 8px 10px 0;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          border-radius: 14px;
          padding: 10px 12px;
        }
        .auth-alert {
          background: rgba(198, 31, 31, 0.08);
          border: 1px solid rgba(198, 31, 31, 0.2);
          color: rgba(120, 18, 18, 0.95);
        }
        .auth-ok {
          background: rgba(23, 160, 71, 0.1);
          border: 1px solid rgba(23, 160, 71, 0.25);
          color: rgba(10, 88, 36, 0.95);
        }
        .auth-alert-ico,
        .auth-ok-ico {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-weight: 900;
          flex: 0 0 auto;
        }
        .auth-alert-ico {
          background: rgba(198, 31, 31, 0.18);
        }
        .auth-ok-ico {
          background: rgba(23, 160, 71, 0.2);
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
        .timer {
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
        }
        .timer.bad {
          color: rgba(198, 31, 31, 0.9);
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
        .field-input.locked {
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.72);
          cursor: not-allowed;
        }
        .field-input:focus {
          border-color: rgba(0, 0, 0, 0.34);
          box-shadow: 0 0 0 4px rgba(255, 214, 0, 0.28);
        }
        .field-input.bad {
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