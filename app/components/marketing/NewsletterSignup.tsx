// src/components/marketing/NewsletterSignup.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  source?: string; // ejemplo: "home_hero"
  className?: string;
};

type Metrics = {
  v: "jusp_marketing_metrics_v1";
  visits: number;
  emails: number;
  lastVisitSession?: string;
};

const LS_METRICS = "jusp_marketing_metrics_v1";

function safeJsonParse<T>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

function loadMetrics(): Metrics {
  const j = safeJsonParse<Metrics>(localStorage.getItem(LS_METRICS));
  return {
    v: "jusp_marketing_metrics_v1",
    visits: Number(j?.visits || 0),
    emails: Number(j?.emails || 0),
    lastVisitSession: j?.lastVisitSession ? String(j.lastVisitSession) : undefined,
  };
}

function saveMetrics(m: Metrics) {
  try {
    localStorage.setItem(LS_METRICS, JSON.stringify(m));
  } catch {}
}

function sessionId(): string {
  // sesion simple por pestaña/navegación (no PII)
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isValidEmail(email: string) {
  const e = String(email || "").trim();
  if (!e) return false;
  // validación pragmática (sin ser exagerados)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function NewsletterSignup({ source = "home_hero", className = "" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  const metrics = useMemo(() => {
    if (typeof window === "undefined") return { visits: 0, emails: 0, rate: 0 };
    const m = loadMetrics();
    const rate = m.visits > 0 ? Math.round((m.emails / m.visits) * 100) : 0;
    return { visits: m.visits, emails: m.emails, rate };
  }, [status]); // recalcula al cambiar estado (cuando sumamos emails)

  // Animación suave al aparecer (IntersectionObserver)
  useEffect(() => {
    setMounted(true);
    const el = sectionRef.current;
    if (!el) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    el.style.transition = "opacity 700ms ease, transform 700ms ease";

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Métrica: visitas (1 vez por sesión/pestaña)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sid = sessionId();
      const m = loadMetrics();
      if (m.lastVisitSession !== sid) {
        const next: Metrics = { ...m, lastVisitSession: sid, visits: m.visits + 1 };
        saveMetrics(next);

        // opcional: ping server (no DB) para tener hook futuro
        fetch("/api/newsletter/visit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source }),
        }).catch(() => {});
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = String(email || "").trim();

    if (!isValidEmail(v)) {
      setStatus("err");
      setMsg("Escribe un correo válido.");
      return;
    }

    setStatus("loading");
    setMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: v, source }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const reason = String(json?.error || "No se pudo suscribir.");
        throw new Error(reason);
      }

      // éxito
      setStatus("ok");
      setMsg("Listo. Te avisamos apenas caiga un drop nuevo. ✅");
      setEmail("");

      // Métrica: emails
      const m = loadMetrics();
      const next: Metrics = { ...m, emails: m.emails + 1 };
      saveMetrics(next);
    } catch (err: any) {
      setStatus("err");
      setMsg(err?.message || "No se pudo suscribir. Intenta de nuevo.");
    }
  }

  return (
    <div
      ref={sectionRef}
      className={[
        "mt-8 w-full max-w-2xl rounded-2xl border border-white/20 bg-black/35 p-5 backdrop-blur-md",
        className,
      ].join(" ")}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">
        ALERTA DE DROPS · SOLO LO BUENO
      </div>

      <div className="mt-2 text-[18px] md:text-[20px] font-extrabold text-white">
        Recibe primero lo nuevo. Sin spam.
      </div>

      <div className="mt-1 text-[13px] md:text-[14px] text-white/75">
        Te avisamos <span className="font-semibold text-white">solo</span> cuando entra un producto nuevo o un restock real.
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          autoComplete="email"
          placeholder="tu correo (ej: jusep@correo.com)"
          className="w-full flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/45 focus:border-white/35"
        />

        <button
          type="submit"
          disabled={!mounted || status === "loading"}
          className={[
            "rounded-xl px-5 py-3 text-[13px] font-extrabold",
            "border border-white/15 bg-white text-black hover:opacity-95",
            status === "loading" ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {status === "loading" ? "Guardando..." : "Avisarme"}
        </button>
      </form>

      {msg ? (
        <div
          className={[
            "mt-3 rounded-xl border px-4 py-3 text-[13px] font-semibold",
            status === "ok"
              ? "border-white/15 bg-white/10 text-white"
              : status === "err"
              ? "border-white/15 bg-white/10 text-white"
              : "border-white/15 bg-white/10 text-white",
          ].join(" ")}
        >
          {msg}
        </div>
      ) : null}

      {/* Métrica (no visible agresiva; discreta) */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
        <span className="rounded-full border border-white/15 px-3 py-1">
          Visitas: <span className="font-semibold text-white/80">{metrics.visits}</span>
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1">
          Emails: <span className="font-semibold text-white/80">{metrics.emails}</span>
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1">
          Conv: <span className="font-semibold text-white/80">{metrics.rate}%</span>
        </span>
      </div>
    </div>
  );
}