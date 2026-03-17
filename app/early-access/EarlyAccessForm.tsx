"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

function isValidEmail(email: string) {
  const v = (email || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
}

export default function EarlyAccessForm() {
  const STORAGE_KEY = "jusp_early_access_email";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [msg, setMsg] = useState("");
  const [already, setAlready] = useState(false);

  const canSubmit = useMemo(() => {
    if (state === "loading") return false;
    if (already) return false;
    return isValidEmail(email);
  }, [email, state, already]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && isValidEmail(saved)) {
        setEmail(saved);
        setAlready(true);
        setState("success");
        setMsg("Ya estás en Early Access en este dispositivo.");
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

    if (already) {
      setState("success");
      setMsg("Ya estás en Early Access en este dispositivo.");
      return;
    }

    setState("loading");
    setMsg("");

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: v, source: "early-access" }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, v);
      } catch {
        // ignore
      }

      setAlready(true);
      setState("success");
      setMsg("Listo. Te avisamos cuando habilitemos tu acceso.");
    } catch {
      setState("error");
      setMsg("No pudimos enviar ahora. Intenta de nuevo.");
    }
  }

  return (
    <form onSubmit={onSubmit} style={s.form}>
      <div style={s.stack}>
        <div>
          <label style={s.label}>Email</label>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state !== "idle") {
                setState("idle");
                setMsg("");
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
          {already ? "Ya estás ✓" : state === "loading" ? "Enviando…" : "Entrar"}
        </button>
      </div>

      {msg ? (
        <div
          style={{
            ...s.toast,
            ...(state === "error" ? s.toastError : s.toastOk),
          }}
        >
          {msg}
        </div>
      ) : null}

      <div style={s.chips}>
        <span style={s.chip}>✓ Transparencia</span>
        <span style={s.chip}>⚡ Cupos por fases</span>
        <span style={s.chip}>🧠 Soporte humano</span>
      </div>
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
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 700,
    backdropFilter: "blur(14px)",
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