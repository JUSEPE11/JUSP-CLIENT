"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";
type QueueStatus = "waiting" | "activated" | "rejected" | null;

type EarlyAccessApiSuccess = {
  ok: true;
  alreadyJoined: boolean;
  status: "waiting" | "activated" | "rejected";
  position: number | null;
  total: number;
  message: string;
};

type EarlyAccessApiError = {
  ok: false;
  error: string;
};

function isValidEmail(email: string) {
  const v = (email || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
}

export default function EarlyAccessForm() {
  const STORAGE_KEY = "jusp_early_access_email";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [msg, setMsg] = useState("");
  const [joined, setJoined] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const canSubmit = useMemo(() => {
    if (state === "loading") return false;
    return isValidEmail(email);
  }, [email, state]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && isValidEmail(saved)) {
        setEmail(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const v = (email || "").trim().toLowerCase();

    if (!isValidEmail(v)) {
      setState("error");
      setMsg("Escribe un email válido.");
      return;
    }

    setState("loading");
    setMsg("");
    setQueueStatus(null);
    setPosition(null);
    setTotal(null);

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: v, source: "early-access" }),
      });

      const data = (await res.json().catch(() => null)) as
        | EarlyAccessApiSuccess
        | EarlyAccessApiError
        | null;

      if (!res.ok || !data || data.ok !== true) {
        const message =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : "No pudimos enviar ahora. Intenta de nuevo.";
        throw new Error(message);
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, v);
      } catch {
        // ignore
      }

      setJoined(true);
      setQueueStatus(data.status);
      setPosition(data.position);
      setTotal(data.total);
      setState("success");
      setMsg(data.message);
    } catch {
      setState("error");
      setMsg("No pudimos enviar ahora. Intenta de nuevo.");
    }
  }

  return (
    <form onSubmit={onSubmit} style={s.form}>
      <div style={s.stack} className="ea-form-stack">
        <div>
          <label style={s.label}>Email</label>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state !== "idle") {
                setState("idle");
                setMsg("");
                setJoined(false);
                setQueueStatus(null);
                setPosition(null);
                setTotal(null);
              }
            }}
            placeholder="tu@email.com"
            inputMode="email"
            autoComplete="email"
            aria-label="Email"
            style={s.input}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            ...s.button,
            ...(canSubmit ? s.buttonOn : s.buttonOff),
          }}
        >
          {state === "loading"
            ? "Enviando…"
            : joined
              ? "En lista ✓"
              : "Entrar"}
        </button>
      </div>

      {msg ? (
        <div
          style={{
            ...s.toast,
            ...(state === "error" ? s.toastError : s.toastOk),
          }}
        >
          <div style={s.toastTitle}>
            {state === "error"
              ? "No se pudo procesar"
              : queueStatus === "activated"
                ? "Acceso activado"
                : joined
                  ? "Waitlist confirmada"
                  : "Waitlist"}
          </div>

          <div style={s.toastText}>{msg}</div>

          {state === "success" && queueStatus === "waiting" && position && total ? (
            <div style={s.queueBox}>
              <div style={s.queueMetric}>
                <span style={s.queueLabel}>Tu posición</span>
                <span style={s.queueValue}>#{position}</span>
              </div>

              <div style={s.queueMetric}>
                <span style={s.queueLabel}>Total en cola</span>
                <span style={s.queueValue}>{total}</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={s.chips}>
        <span style={s.chip}>✓ Transparencia</span>
        <span style={s.chip}>⚡ Cupos por fases</span>
        <span style={s.chip}>🧠 Soporte humano</span>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .ea-form-stack {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}

const s: Record<string, CSSProperties> = {
  form: {
    width: "100%",
  },
  stack: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 14,
    alignItems: "end",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.70)",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    width: "100%",
    minHeight: 58,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.36)",
    color: "#fff",
    padding: "0 16px",
    outline: "none",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    fontSize: 16,
    fontWeight: 700,
  },
  button: {
    minHeight: 58,
    minWidth: 156,
    borderRadius: 20,
    padding: "0 18px",
    fontWeight: 900,
    fontSize: 16,
    border: "1px solid rgba(255,255,255,0.16)",
    transition: "transform .12s ease",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  },
  buttonOn: {
    background: "#ffffff",
    color: "#000",
    cursor: "pointer",
  },
  buttonOff: {
    background: "rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.72)",
    cursor: "not-allowed",
  },
  toast: {
    marginTop: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "14px 14px",
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 700,
    backdropFilter: "blur(14px)",
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: -0.2,
  },
  toastText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.55,
  },
  toastOk: {
    borderColor: "rgba(250,204,21,0.22)",
    background: "rgba(250,204,21,0.10)",
    color: "rgba(255,245,210,0.92)",
  },
  toastError: {
    borderColor: "rgba(248,113,113,0.26)",
    background: "rgba(248,113,113,0.10)",
    color: "rgba(254,226,226,0.92)",
  },
  queueBox: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  queueMetric: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.18)",
    padding: "12px 14px",
    display: "grid",
    gap: 6,
  },
  queueLabel: {
    fontSize: 12,
    color: "rgba(255,245,210,0.72)",
    fontWeight: 700,
  },
  queueValue: {
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: -0.8,
    color: "rgba(255,255,255,0.98)",
  },
  chips: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  chip: {
    fontSize: 12,
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.76)",
  },
};