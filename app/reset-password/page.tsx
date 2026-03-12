"use client";

import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useEffect, useMemo, useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function ResetPasswordPage() {
  const supabaseRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const recoveryResolvedRef = useRef(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const passwordOk = password.length >= 6;
  const matchOk = password === confirmPassword;

  const canSubmit = useMemo(() => {
    if (!ready) return false;
    if (!recoveryReady) return false;
    if (!passwordOk) return false;
    if (!matchOk) return false;
    return status !== "loading";
  }, [ready, recoveryReady, passwordOk, matchOk, status]);

  useEffect(() => {
    mountedRef.current = true;

    const markReady = (isRecoveryReady: boolean, errorMessage?: string | null) => {
      if (!mountedRef.current) return;
      recoveryResolvedRef.current = true;
      setRecoveryReady(isRecoveryReady);
      setErr(errorMessage ?? null);
      setReady(true);
      setStatus("idle");
    };

    try {
      const supabase = createSupabaseBrowserClient();
      supabaseRef.current = supabase;

      const fallbackTimer = window.setTimeout(async () => {
        if (recoveryResolvedRef.current) return;

        try {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            markReady(false, "No se pudo validar la sesión de recuperación.");
            return;
          }

          if (data?.session) {
            markReady(true, null);
            return;
          }

          markReady(false, "El enlace de recuperación no es válido o ya expiró.");
        } catch {
          markReady(false, "No se pudo validar la sesión de recuperación.");
        }
      }, 1200);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mountedRef.current) return;

        if (event === "PASSWORD_RECOVERY") {
          window.clearTimeout(fallbackTimer);
          markReady(true, null);
          return;
        }

        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          window.clearTimeout(fallbackTimer);
          markReady(true, null);
          return;
        }
      });

      void (async () => {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (!mountedRef.current || recoveryResolvedRef.current) return;

          if (error) {
            window.clearTimeout(fallbackTimer);
            markReady(false, "No se pudo validar la sesión de recuperación.");
            return;
          }

          if (data?.session) {
            window.clearTimeout(fallbackTimer);
            markReady(true, null);
          }
        } catch {
          if (!mountedRef.current || recoveryResolvedRef.current) return;
          window.clearTimeout(fallbackTimer);
          markReady(false, "No se pudo validar la sesión de recuperación.");
        }
      })();

      return () => {
        mountedRef.current = false;
        window.clearTimeout(fallbackTimer);
        subscription.unsubscribe();
      };
    } catch {
      if (mountedRef.current) {
        setErr("No se pudo iniciar la recuperación de contraseña.");
        setReady(true);
        setRecoveryReady(false);
        setStatus("error");
      }
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setErr(null);

    if (!recoveryReady) {
      setErr("El enlace de recuperación no es válido o ya expiró.");
      setStatus("error");
      return;
    }

    if (!password) {
      setErr("Escribe tu nueva contraseña.");
      setStatus("error");
      return;
    }

    if (password.length < 6) {
      setErr("La contraseña debe tener mínimo 6 caracteres.");
      setStatus("error");
      return;
    }

    if (!confirmPassword) {
      setErr("Confirma tu nueva contraseña.");
      setStatus("error");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Las contraseñas no coinciden.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const supabase = supabaseRef.current;

      if (!supabase) {
        setErr("No se pudo iniciar la sesión de recuperación.");
        setStatus("error");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErr(error.message || "No se pudo actualizar la contraseña.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setErr(null);
    } catch {
      setErr("Error de red. Revisa tu conexión e intenta de nuevo.");
      setStatus("error");
    }
  }

  return (
    <main className="rp-root">
      <div className="rp-shell">
        <div className="rp-card">
          <div className="rp-head">
            <div className="rp-kicker">Cuenta</div>
            <h1 className="rp-title">Nueva contraseña</h1>
            <p className="rp-sub">
              Crea una nueva contraseña segura para volver a entrar a tu cuenta.
            </p>
          </div>

          {!ready ? (
            <div className="rp-info" role="status" aria-live="polite">
              Preparando recuperación de contraseña…
            </div>
          ) : !recoveryReady && status !== "success" ? (
            <div className="rp-invalid" role="alert" aria-live="polite">
              <div className="rp-alert-ico" aria-hidden="true">
                !
              </div>
              <div>
                <h2 className="rp-invalid-title">Enlace inválido o expirado</h2>
                <p className="rp-invalid-text">
                  {err || "Este enlace de recuperación no es válido, ya expiró o no abrió una sesión de recuperación."}
                </p>
                <div className="rp-actions">
                  <Link className="rp-btn rp-btn-ghost" href="/forgot-password">
                    Solicitar un nuevo enlace
                  </Link>
                  <Link className="rp-btn rp-btn-ghost" href="/login">
                    Volver al login
                  </Link>
                </div>
              </div>
            </div>
          ) : status === "success" ? (
            <div className="rp-success" role="status" aria-live="polite">
              <h2 className="rp-success-title">Contraseña actualizada</h2>
              <p className="rp-success-text">
                Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión con la nueva.
              </p>
              <div className="rp-actions">
                <Link className="rp-btn" href="/login">
                  Ir a iniciar sesión
                </Link>
              </div>
            </div>
          ) : (
            <>
              {err ? (
                <div className="rp-alert" role="alert" aria-live="polite">
                  <div className="rp-alert-ico" aria-hidden="true">
                    !
                  </div>
                  <div>{err}</div>
                </div>
              ) : null}

              <form className="rp-form" onSubmit={onSubmit}>
                <label className="rp-field">
                  <span className="rp-label">Nueva contraseña</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`rp-input ${password && !passwordOk ? "bad" : ""}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === "loading"}
                  />
                  {password && !passwordOk ? (
                    <span className="rp-hint bad">Mínimo 6 caracteres.</span>
                  ) : (
                    <span className="rp-hint">Usa una contraseña segura.</span>
                  )}
                </label>

                <label className="rp-field">
                  <span className="rp-label">Confirmar contraseña</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`rp-input ${confirmPassword && !matchOk ? "bad" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === "loading"}
                  />
                  {confirmPassword && !matchOk ? (
                    <span className="rp-hint bad">Las contraseñas no coinciden.</span>
                  ) : (
                    <span className="rp-hint">Debe coincidir exactamente con la anterior.</span>
                  )}
                </label>

                <div className="rp-actions">
                  <button
                    className="rp-btn"
                    type="submit"
                    disabled={!canSubmit}
                    aria-busy={status === "loading"}
                  >
                    {status === "loading" ? "Guardando…" : "Cambiar contraseña"}
                  </button>

                  <Link className="rp-btn rp-btn-ghost" href="/login">
                    Cancelar
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        body {
          background:
            radial-gradient(1200px 600px at 20% 0%, rgba(0, 0, 0, 0.06), transparent 55%),
            radial-gradient(900px 520px at 90% 15%, rgba(0, 0, 0, 0.04), transparent 60%),
            #f7f7f7;
        }
      `}</style>

      <style jsx>{`
        .rp-root {
          min-height: 100vh;
          padding: calc(var(--jusp-header-h, 64px) + 24px) 16px 32px;
        }
        .rp-shell {
          max-width: 560px;
          margin: 0 auto;
        }
        .rp-card {
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
          padding: 20px;
          backdrop-filter: blur(10px);
        }
        .rp-head {
          margin-bottom: 14px;
        }
        .rp-kicker {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.55);
        }
        .rp-title {
          margin: 8px 0 6px;
          font-size: 30px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: #111;
        }
        .rp-sub {
          margin: 0;
          color: rgba(0, 0, 0, 0.72);
          font-size: 14px;
          line-height: 1.6;
        }
        .rp-info {
          margin-top: 10px;
          border-radius: 14px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.72);
        }
        .rp-alert,
        .rp-invalid {
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
        .rp-alert-ico {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(198, 31, 31, 0.18);
          font-weight: 900;
          flex: 0 0 auto;
        }
        .rp-invalid-title {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 900;
          color: #111;
        }
        .rp-invalid-text {
          margin: 0 0 14px;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(0, 0, 0, 0.72);
        }
        .rp-success {
          margin-top: 14px;
          border-radius: 18px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.22);
        }
        .rp-success-title {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 900;
          color: #111;
        }
        .rp-success-text {
          margin: 0 0 14px;
          color: rgba(0, 0, 0, 0.72);
          font-size: 14px;
          line-height: 1.6;
        }
        .rp-form {
          margin-top: 14px;
          display: grid;
          gap: 14px;
        }
        .rp-field {
          display: grid;
          gap: 7px;
        }
        .rp-label {
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.78);
        }
        .rp-input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          padding: 12px 12px;
          font-size: 14px;
          outline: none;
        }
        .rp-input:focus {
          border-color: rgba(0, 0, 0, 0.34);
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
        }
        .rp-input.bad {
          border-color: rgba(198, 31, 31, 0.45);
          box-shadow: none;
        }
        .rp-hint {
          min-height: 16px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
        }
        .rp-hint.bad {
          color: rgba(198, 31, 31, 0.9);
        }
        .rp-actions {
          display: grid;
          gap: 10px;
        }
        .rp-btn {
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
        .rp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .rp-btn-ghost {
          background: rgba(255, 255, 255, 0.9);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
        }
        .rp-btn-ghost:hover {
          background: rgba(0, 0, 0, 0.03);
        }
      `}</style>
    </main>
  );
}