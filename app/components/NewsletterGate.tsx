"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const HIDE_KEY = "jusp_newsletter_hide_until_v1";
const SUB_KEY = "jusp_newsletter_subscribed_v1";

function isValidEmail(value: string) {
  const s = String(value || "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

function readHideUntil() {
  try {
    const raw = localStorage.getItem(HIDE_KEY);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeHideDays(days: number) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(HIDE_KEY, String(until));
  } catch {}
}

function writeSubscribed() {
  try {
    localStorage.setItem(SUB_KEY, "1");
  } catch {}
}

export default function NewsletterGate() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const hiddenByPath = useMemo(() => {
    const path = String(pathname || "").toLowerCase();
    return path.startsWith("/admin");
  }, [pathname]);

  useEffect(() => {
    if (hiddenByPath) return;

    try {
      const isSub = localStorage.getItem(SUB_KEY) === "1";
      const hideUntil = readHideUntil();
      const shouldHide = hideUntil && Date.now() < hideUntil;

      if (!isSub && !shouldHide) {
        const timer = window.setTimeout(() => setOpen(true), 900);
        return () => window.clearTimeout(timer);
      }
    } catch {
      const timer = window.setTimeout(() => setOpen(true), 900);
      return () => window.clearTimeout(timer);
    }
  }, [hiddenByPath]);

  function closeModal() {
    setOpen(false);
    setStatus("idle");
    setMessage("");
    writeHideDays(30);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const safeEmail = email.trim().toLowerCase();
    setMessage("");

    if (!isValidEmail(safeEmail)) {
      setStatus("error");
      setMessage("Escribe un correo valido para recibir las novedades de JUSP.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: safeEmail,
          source: "global_newsletter_gate",
          ts: Date.now(),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      writeSubscribed();
      setStatus("ok");
      setMessage("Listo. Te avisaremos cuando entren productos nuevos y drops destacados.");
      setEmail("");

      window.setTimeout(() => {
        setOpen(false);
      }, 1200);
    } catch {
      setStatus("error");
      setMessage("No pudimos guardar tu correo ahora. Intenta otra vez en unos segundos.");
    }
  }

  if (!open || hiddenByPath) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recibe novedades de JUSP"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2300,
        background: "rgba(0,0,0,0.40)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        style={{
          width: "min(680px, 100%)",
          borderRadius: 26,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(247,246,243,0.98) 55%, rgba(238,236,231,0.98) 100%)",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 28px 110px rgba(0,0,0,0.24)",
        }}
      >
        <div
          style={{
            padding: "22px 22px 16px",
            display: "flex",
            alignItems: "start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 1000,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.56)",
              }}
            >
              JUSP ALERTAS
            </div>
            <h2
              style={{
                margin: "8px 0 0",
                fontSize: 28,
                lineHeight: 1.02,
                fontWeight: 1000,
                letterSpacing: "-0.04em",
              }}
            >
              Recibe primero los productos nuevos
            </h2>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(0,0,0,0.68)",
                maxWidth: 520,
              }}
            >
              Guarda tu correo y te enviaremos notificaciones elegantes con nuevos ingresos,
              productos flash y selecciones destacadas de JUSP.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Cerrar"
            style={{
              flex: "0 0 auto",
              width: 42,
              height: 42,
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "0 22px 22px" }}>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo"
              style={{
                width: "100%",
                height: 50,
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "#fff",
                padding: "0 18px",
                fontSize: 15,
                outline: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  minWidth: 168,
                  height: 48,
                  borderRadius: 999,
                  border: "none",
                  background: "#111",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 1000,
                  cursor: status === "loading" ? "wait" : "pointer",
                  padding: "0 18px",
                }}
              >
                {status === "loading" ? "Guardando..." : "Quiero recibir avisos"}
              </button>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  height: 48,
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                  color: "#111",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  padding: "0 18px",
                }}
              >
                Ahora no
              </button>
            </div>

            {message ? (
              <div
                style={{
                  borderRadius: 16,
                  padding: "12px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  background: status === "ok" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
                  color: status === "ok" ? "#166534" : "#991b1b",
                  border:
                    status === "ok"
                      ? "1px solid rgba(34,197,94,0.18)"
                      : "1px solid rgba(239,68,68,0.16)",
                }}
              >
                {message}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
