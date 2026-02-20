"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Segment = "hombre" | "mujer" | "niños";
type Size =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44";

const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "38", "39", "40", "41", "42", "43", "44"];

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export default function OnboardingPage() {
  const router = useRouter();

  // Si ya traes segment/interests de pasos previos, ajústalo aquí si lo necesitas.
  // Por ahora dejamos defaults seguros:
  const [segment] = useState<Segment>("hombre");
  const [interests] = useState<string[]>(["Fútbol"]);

  const [size, setSize] = useState<Size | null>("41");
  const [vibe, setVibe] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const profilePayload = useMemo(() => {
    const cleanVibe = vibe.trim().slice(0, 60);
    return {
      segment,
      interests,
      size: size ?? undefined,
      vibe: cleanVibe || undefined,
    };
  }, [segment, interests, size, vibe]);

  async function saveAndFinish() {
    if (saving) return;
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ CRÍTICO: garantiza cookies
        body: JSON.stringify({ profile: profilePayload }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        const err = data?.error || `No se pudo guardar (${res.status})`;
        setMsg(`Ups: ${err}`);
        setSaving(false);
        return;
      }

      // ✅ Guardado real. Ahora reflejarlo (redirige a cuenta y refresca server components)
      setMsg("Guardado ✅");
      router.replace("/account");
      router.refresh();
    } catch (e: any) {
      setMsg(`Ups: ${e?.message || "Error inesperado"}`);
      setSaving(false);
    }
  }

  function skip() {
    router.replace("/account");
    router.refresh();
  }

  return (
    <main
      style={{
        paddingTop: "calc(var(--jusp-header-h, 64px) + 18px)",
        padding: "18px 16px 44px",
        background:
          "radial-gradient(1200px 400px at 50% 0%, rgba(0,0,0,0.06), rgba(255,255,255,0) 60%), #fff",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Top progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Pill done label="Tu foco" />
            <Pill done label="Intereses" />
            <Pill active label="Ajuste fino" />
          </div>

          <button
            onClick={skip}
            type="button"
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.9)",
              borderRadius: 999,
              padding: "10px 14px",
              fontWeight: 950,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Saltar →
          </button>
        </div>

        {/* Title */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.55)",
            }}
          >
            ONBOARDING · Paso 3/3
          </div>

          <h1 style={{ marginTop: 6, fontSize: 40, fontWeight: 950, letterSpacing: "-0.03em", color: "#111" }}>
            Haz que JUSP se sienta <span style={{ textDecoration: "underline" }}>&ldquo;tuyo&rdquo;</span>.
          </h1>

          <p style={{ marginTop: 8, fontSize: 14, color: "rgba(0,0,0,0.65)", lineHeight: 1.6 }}>
            Esto solo personaliza la experiencia: orden, prioridad y recomendaciones. Nada de esto es obligatorio.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            marginTop: 16,
            borderRadius: 22,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 6,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.95), rgba(0,0,0,0.65), rgba(0,0,0,0.95))",
            }}
          />

          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 950, color: "#111" }}>Ajuste fino (opcional)</div>

            <div
              style={{
                marginTop: 12,
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                padding: 14,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: 14 }}>
                {/* Sizes */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.7)" }}>Talla</div>
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {SIZES.map((s) => {
                      const active = size === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSize(s)}
                          style={{
                            borderRadius: 14,
                            padding: "9px 12px",
                            fontWeight: 950,
                            fontSize: 13,
                            cursor: "pointer",
                            border: active ? "1px solid rgba(0,0,0,0.9)" : "1px solid rgba(0,0,0,0.10)",
                            background: active ? "#111" : "rgba(255,255,255,0.95)",
                            color: active ? "#fff" : "#111",
                            boxShadow: active ? "0 10px 20px rgba(0,0,0,0.16)" : "none",
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vibe */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.7)" }}>Tu vibe</div>
                  <input
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    placeholder="Ej: minimal, street, gym…"
                    maxLength={60}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.10)",
                      padding: "12px 12px",
                      outline: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      background: "rgba(255,255,255,0.95)",
                    }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                    Opcional, pero ayuda a afinar recomendaciones.
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div
              style={{
                marginTop: 12,
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                padding: "10px 12px",
                fontSize: 13,
                color: msg ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.55)",
              }}
            >
              <b>Ups:</b>{" "}
              {msg ? msg : "Si cambias tu talla o vibe, lo guardamos para recomendarte mejor."}
            </div>

            {/* Actions */}
            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  borderRadius: 999,
                  padding: "12px 16px",
                  fontWeight: 950,
                  fontSize: 13,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "rgba(255,255,255,0.95)",
                  cursor: "pointer",
                }}
              >
                Atrás
              </button>

              <button
                type="button"
                onClick={saveAndFinish}
                disabled={saving}
                style={{
                  borderRadius: 999,
                  padding: "12px 18px",
                  fontWeight: 950,
                  fontSize: 13,
                  border: "1px solid rgba(0,0,0,0.9)",
                  background: saving ? "rgba(0,0,0,0.55)" : "#111",
                  color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
                  minWidth: 130,
                }}
              >
                {saving ? "Guardando…" : "Terminar"}
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.5)" }}>
              ¿Problemas para terminar? Puedes saltar y hacerlo después.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Pill({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div
      className={cx("pill")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        padding: "10px 14px",
        border: active ? "1px solid rgba(0,0,0,0.9)" : "1px solid rgba(0,0,0,0.12)",
        background: active ? "#111" : "rgba(0,0,0,0.02)",
        color: active ? "#fff" : "#111",
        fontWeight: 950,
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          background: done || active ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)",
          color: active ? "#fff" : "#111",
        }}
      >
        {done ? "✓" : active ? "3" : "•"}
      </span>
      {label}
    </div>
  );
}