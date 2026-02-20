// app/onboarding/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Segment = "hombre" | "mujer" | "niños";

// ✅ Expandimos tallas para soportar Mujer + Kids (sin romper: siguen siendo strings controlados)
type Size =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  // Hombre (EU)
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  // Mujer (EU)
  | "35"
  | "36"
  | "37"
  // Kids (EU)
  | "28"
  | "29"
  | "30"
  | "31"
  | "32"
  | "33"
  | "34"
  // Kids ropa (edad)
  | "2"
  | "4"
  | "6"
  | "8"
  | "10"
  | "12"
  | "14";

type Interest = { key: string; label: string };

const INTERESTS_BY_SEGMENT: Record<Segment, Interest[]> = {
  hombre: [
    { key: "futbol", label: "Fútbol" },
    { key: "gym", label: "Gym" },
    { key: "street", label: "Street" },
    { key: "running", label: "Running" },
    { key: "basket", label: "Basket" },
    { key: "skate", label: "Skate" },
    { key: "outdoor", label: "Outdoor" },
    { key: "retro", label: "Retro" },
    { key: "techwear", label: "Techwear" },
    { key: "lux", label: "Premium" },
  ],
  mujer: [
    { key: "gym", label: "Gym" },
    { key: "running", label: "Running" },
    { key: "yoga", label: "Yoga" },
    { key: "street", label: "Street" },
    { key: "lifestyle", label: "Lifestyle" },
    { key: "fashion", label: "Fashion" },
    { key: "outdoor", label: "Outdoor" },
    { key: "retro", label: "Retro" },
    { key: "techwear", label: "Techwear" },
    { key: "lux", label: "Premium" },
  ],
  niños: [
    { key: "futbol", label: "Fútbol" },
    { key: "running", label: "Running" },
    { key: "basket", label: "Basket" },
    { key: "school", label: "Colegio" },
    { key: "street", label: "Street" },
    { key: "outdoor", label: "Outdoor" },
    { key: "skate", label: "Skate" },
    { key: "gaming", label: "Gaming" },
    { key: "retro", label: "Retro" },
    { key: "premium", label: "Premium" },
  ],
};

const SIZES_BY_SEGMENT: Record<Segment, Size[]> = {
  hombre: ["XS", "S", "M", "L", "XL", "38", "39", "40", "41", "42", "43", "44"],
  mujer: ["XS", "S", "M", "L", "XL", "35", "36", "37", "38", "39", "40", "41"],
  // Kids: mezcla práctica (ropa por edad + calzado EU kids)
  niños: ["2", "4", "6", "8", "10", "12", "14", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37"],
};

const DEFAULT_INTERESTS: Record<Segment, string[]> = {
  hombre: ["Fútbol"],
  mujer: ["Gym"],
  niños: ["Colegio"],
};

const DEFAULT_SIZES: Record<Segment, Size[]> = {
  hombre: ["41"],
  mujer: ["38"],
  niños: ["8"],
};

const SIZE_GUIDE_COPY: Record<Segment, string> = {
  hombre: "Guía: calzado EU (38–44) y ropa (XS–XL).",
  mujer: "Guía: calzado EU mujer (35–41) y ropa (XS–XL).",
  niños: "Guía: ropa por edad (2–14) y calzado kids EU (28–37).",
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function clamp(s: string, n: number) {
  return (s || "").trim().slice(0, n);
}

function titleCase(s: string) {
  const x = (s || "").trim();
  return x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paso 1
  const [segment, setSegment] = useState<Segment>("hombre");

  // Paso 2
  const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS.hombre);

  // Paso 3
  const [sizes, setSizes] = useState<Size[]>(DEFAULT_SIZES.hombre); // ✅ hasta 3 tallas
  const [vibe, setVibe] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [msgTone, setMsgTone] = useState<"idle" | "ok" | "warn">("idle");

  const vibeSuggestions = ["minimal", "street", "gym", "runner", "techwear", "retro", "lux", "all-black"];

  // ✅ LISTAS dinámicas por segmento
  const INTERESTS = useMemo(() => INTERESTS_BY_SEGMENT[segment], [segment]);
  const SIZES = useMemo(() => SIZES_BY_SEGMENT[segment], [segment]);
  const sizeGuide = useMemo(() => SIZE_GUIDE_COPY[segment], [segment]);

  // ✅ Cuando cambie el segmento: recalcular pasos 2 y 3 (intereses + tallas)
  useEffect(() => {
    setInterests(DEFAULT_INTERESTS[segment] || []);
    setSizes(DEFAULT_SIZES[segment] || []);
    setMsg("");
    setMsgTone("idle");
    // vibe lo dejamos (es estilo personal, no depende del segmento)
  }, [segment]);

  const profilePayload = useMemo(() => {
    const cleanVibe = clamp(vibe, 60);
    const primarySize = sizes?.[0] ?? undefined;
    const sizesUpTo3 = (sizes || []).slice(0, 3);
    return {
      segment,
      interests,
      // compat (backend actual): mantiene "size"
      size: primarySize,
      // extra (no rompe si el backend lo ignora)
      sizes: sizesUpTo3.length ? sizesUpTo3 : undefined,
      vibe: cleanVibe || undefined,
    };
  }, [segment, interests, sizes, vibe]);

  function skip() {
    router.replace("/account");
    router.refresh();
  }

  function back() {
    if (saving) return;
    if (step === 1) return router.back();
    setMsg("");
    setMsgTone("idle");
    setStep((s) => (s === 2 ? 1 : 2));
  }

  function next() {
    if (saving) return;

    if (step === 1) {
      setMsg("");
      setMsgTone("idle");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!interests.length) {
        setMsg("Tip: elige al menos 1 interés para personalizar mejor (o salta si no quieres).");
        setMsgTone("warn");
        return;
      }
      setMsg("");
      setMsgTone("idle");
      setStep(3);
      return;
    }
  }

  function toggleInterest(label: string) {
    setInterests((prev) => {
      const has = prev.some((x) => x.toLowerCase() === label.toLowerCase());
      if (has) return prev.filter((x) => x.toLowerCase() !== label.toLowerCase());
      if (prev.length >= 7) return prev;
      return [...prev, label];
    });
  }

  function toggleSize(s: Size) {
    setSizes((prev) => {
      const has = prev.includes(s);
      if (has) return prev.filter((x) => x !== s);
      if (prev.length >= 3) {
        const [, ...rest] = prev; // FIFO
        return [...rest, s];
      }
      return [...prev, s];
    });
  }

  function clearSizes() {
    setSizes([]);
  }

  async function saveAndFinish() {
    if (saving) return;
    setSaving(true);
    setMsg("");
    setMsgTone("idle");

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profile: profilePayload }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        const err = data?.error || `No se pudo guardar (${res.status})`;
        setMsg(`Ups: ${err}`);
        setMsgTone("warn");
        setSaving(false);
        return;
      }

      setMsg("Guardado ✅");
      setMsgTone("ok");
      router.replace("/account");
      router.refresh();
    } catch (e: any) {
      setMsg(`Ups: ${e?.message || "Error inesperado"}`);
      setMsgTone("warn");
      setSaving(false);
    }
  }

  const topKicker = `ONBOARDING · Paso ${step}/3`;

  return (
    <main
      style={{
        paddingTop: "calc(var(--jusp-header-h, 64px) + 18px)",
        padding: "18px 16px 54px",
        background:
          "radial-gradient(1200px 520px at 50% 0%, rgba(0,0,0,0.10), rgba(255,255,255,0) 60%), radial-gradient(900px 500px at 20% 0%, rgba(255,214,0,0.10), rgba(255,255,255,0) 55%), #ffffff",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Top progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Pill done={step > 1} active={step === 1} label="Tu foco" stepNum={1} />
            <Pill done={step > 2} active={step === 2} label="Intereses" stepNum={2} />
            <Pill done={false} active={step === 3} label="Ajuste fino" stepNum={3} />
          </div>

          <button
            onClick={skip}
            type="button"
            style={{
              border: "1px solid rgba(0,0,0,0.14)",
              background: "rgba(255,255,255,0.92)",
              borderRadius: 999,
              padding: "10px 14px",
              fontWeight: 950,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
            }}
          >
            Saltar →
          </button>
        </div>

        {/* Title */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontWeight: 950,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.58)",
            }}
          >
            {topKicker}
          </div>

          <h1 style={{ marginTop: 8, fontSize: 44, fontWeight: 980, letterSpacing: "-0.04em", color: "#0B0B0C" }}>
            {step === 1 ? (
              <>
                Primero, dinos tu{" "}
                <span
                  style={{
                    textDecoration: "underline",
                    textDecorationThickness: "3px",
                    textUnderlineOffset: "6px",
                  }}
                >
                  foco
                </span>
                .
              </>
            ) : step === 2 ? (
              <>
                ¿Qué te{" "}
                <span
                  style={{
                    textDecoration: "underline",
                    textDecorationThickness: "3px",
                    textUnderlineOffset: "6px",
                  }}
                >
                  mueve
                </span>
                ?
              </>
            ) : (
              <>
                Haz que JUSP se sienta{" "}
                <span
                  style={{
                    textDecoration: "underline",
                    textDecorationThickness: "3px",
                    textUnderlineOffset: "6px",
                  }}
                >
                  &ldquo;tuyo&rdquo;
                </span>
                .
              </>
            )}
          </h1>

          <p style={{ marginTop: 10, fontSize: 14, color: "rgba(0,0,0,0.70)", lineHeight: 1.7, maxWidth: 760 }}>
            {step === 1
              ? "Esto ordena la experiencia desde el inicio. Puedes cambiarlo después."
              : step === 2
                ? `Elegimos drops, outfits y sugerencias con más precisión para ${titleCase(segment)}.`
                : "Afinamos recomendaciones para que lo que ves se sienta más personal. Si no quieres, lo saltas y listo."}
          </p>
        </div>

        {/* Premium Card */}
        <div
          style={{
            marginTop: 18,
            borderRadius: 26,
            border: "1px solid rgba(0,0,0,0.10)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.88)), radial-gradient(900px 420px at 50% 0%, rgba(0,0,0,0.08), rgba(255,255,255,0) 70%)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 8,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.95), rgba(255,214,0,0.75), rgba(0,0,0,0.95))",
            }}
          />

          <div style={{ padding: 20 }}>
            {/* Head */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 980, color: "#0B0B0C" }}>
                  {step === 1 ? "Tu foco" : step === 2 ? "Intereses" : "Ajuste fino"}
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.66)", lineHeight: 1.6 }}>
                  {step === 1
                    ? "Elige una base para personalizar JUSP."
                    : step === 2
                      ? `Elige 1–7 intereses para ${titleCase(segment)} (rápido).`
                      : "15 segundos. Recomendaciones más precisas. "}
                  {step === 3 ? <b style={{ color: "#111" }}>Opcional.</b> : null}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(0,0,0,0.02)",
                  fontSize: 12,
                  fontWeight: 900,
                  color: "rgba(0,0,0,0.70)",
                }}
              >
                Privacidad: no es obligatorio ✅
              </div>
            </div>

            {/* CONTENT */}
            {step === 1 ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(10,10,12,0.03)",
                  padding: 16,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <ChoiceCard
                    title="Hombre"
                    sub="Sneakers, tech, street."
                    active={segment === "hombre"}
                    onClick={() => setSegment("hombre")}
                  />
                  <ChoiceCard
                    title="Mujer"
                    sub="Fit premium, lifestyle."
                    active={segment === "mujer"}
                    onClick={() => setSegment("mujer")}
                  />
                  <ChoiceCard
                    title="Niños"
                    sub="Tallas kids, combos."
                    active={segment === "niños"}
                    onClick={() => setSegment("niños")}
                  />
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                  Seleccionado: <b style={{ color: "#111" }}>{titleCase(segment)}</b>. Esto ajusta intereses y tallas.
                </div>
              </div>
            ) : step === 2 ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(10,10,12,0.03)",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>
                    Elige tus intereses ({titleCase(segment)})
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div
                      style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "rgba(255,255,255,0.9)",
                        fontWeight: 950,
                        fontSize: 12,
                        color: "rgba(0,0,0,0.70)",
                      }}
                      title="Máximo 7"
                    >
                      {interests.length}/7
                    </div>
                    <button
                      type="button"
                      onClick={() => setInterests([])}
                      style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "rgba(255,255,255,0.9)",
                        fontWeight: 950,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      title="Limpiar intereses"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {INTERESTS.map((it) => {
                    const on = interests.some((x) => x.toLowerCase() === it.label.toLowerCase());
                    return (
                      <button
                        key={it.key}
                        type="button"
                        onClick={() => toggleInterest(it.label)}
                        style={{
                          borderRadius: 999,
                          padding: "10px 12px",
                          border: on ? "1px solid rgba(0,0,0,0.92)" : "1px solid rgba(0,0,0,0.10)",
                          background: on ? "linear-gradient(180deg, #111, #0b0b0c)" : "rgba(255,255,255,0.92)",
                          color: on ? "#fff" : "#111",
                          fontWeight: 980,
                          fontSize: 13,
                          cursor: "pointer",
                          boxShadow: on ? "0 14px 30px rgba(0,0,0,0.14)" : "none",
                          transform: on ? "translateY(-1px)" : "translateY(0)",
                          transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
                        }}
                        title={on ? "Quitar" : "Agregar"}
                      >
                        {it.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                  Tus intereses ayudan a mostrarte drops y sugerencias más precisas para <b style={{ color: "#111" }}>{titleCase(segment)}</b>.
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(10,10,12,0.03)",
                  padding: 16,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1.85fr", gap: 16 }}>
                  {/* Sizes */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>
                          Talla ({titleCase(segment)})
                        </div>
                        <div
                          style={{
                            borderRadius: 999,
                            padding: "6px 10px",
                            border: "1px solid rgba(0,0,0,0.10)",
                            background: "rgba(255,255,255,0.9)",
                            fontWeight: 950,
                            fontSize: 12,
                            color: "rgba(0,0,0,0.70)",
                          }}
                          title="Máximo 3 tallas"
                        >
                          {sizes.length}/3
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={clearSizes}
                        style={{
                          borderRadius: 999,
                          padding: "6px 10px",
                          border: "1px solid rgba(0,0,0,0.10)",
                          background: "rgba(255,255,255,0.9)",
                          fontWeight: 950,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                        title="Quitar selección"
                      >
                        Limpiar
                      </button>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {SIZES.map((s) => {
                        const active = sizes.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSize(s)}
                            style={{
                              borderRadius: 14,
                              padding: "9px 12px",
                              fontWeight: 980,
                              fontSize: 13,
                              cursor: "pointer",
                              border: active ? "1px solid rgba(0,0,0,0.95)" : "1px solid rgba(0,0,0,0.10)",
                              background: active
                                ? "linear-gradient(180deg, #111, #0b0b0c)"
                                : "rgba(255,255,255,0.96)",
                              color: active ? "#fff" : "#111",
                              boxShadow: active ? "0 12px 24px rgba(0,0,0,0.16)" : "none",
                              transform: active ? "translateY(-1px)" : "translateY(0)",
                              transition: "transform 140ms ease, box-shadow 140ms ease",
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                      Puedes elegir hasta <b style={{ color: "#111" }}>3 tallas</b>. {sizeGuide}
                    </div>
                  </div>

                  {/* Vibe */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>Tu vibe</div>

                    <input
                      value={vibe}
                      onChange={(e) => setVibe(e.target.value)}
                      placeholder="Ej: minimal, street, gym…"
                      maxLength={60}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        borderRadius: 14,
                        border: "1px solid rgba(0,0,0,0.12)",
                        padding: "12px 12px",
                        outline: "none",
                        fontSize: 14,
                        fontWeight: 800,
                        background: "rgba(255,255,255,0.96)",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
                      }}
                    />

                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {vibeSuggestions.map((v) => {
                        const on = clamp(vibe, 60).toLowerCase().includes(v.toLowerCase());
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              const cur = clamp(vibe, 60);
                              if (!cur) return setVibe(v);
                              if (cur.toLowerCase().includes(v.toLowerCase())) return;
                              setVibe(clamp(`${cur}, ${v}`, 60));
                            }}
                            style={{
                              borderRadius: 999,
                              padding: "8px 10px",
                              border: on ? "1px solid rgba(0,0,0,0.9)" : "1px solid rgba(0,0,0,0.10)",
                              background: on ? "#111" : "rgba(255,255,255,0.9)",
                              color: on ? "#fff" : "#111",
                              fontWeight: 950,
                              fontSize: 12,
                              cursor: "pointer",
                              boxShadow: on ? "0 12px 24px rgba(0,0,0,0.14)" : "none",
                              transition: "all 140ms ease",
                            }}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                      Escribe tu estilo en 2–3 palabras. Esto ayuda a que JUSP se vea más{" "}
                      <b style={{ color: "#111" }}>tuyo</b>.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            <div
              style={{
                marginTop: 14,
                border:
                  msgTone === "warn"
                    ? "1px solid rgba(198, 31, 31, 0.22)"
                    : msgTone === "ok"
                      ? "1px solid rgba(0,0,0,0.12)"
                      : "1px solid rgba(0,0,0,0.10)",
                background:
                  msgTone === "warn"
                    ? "rgba(198, 31, 31, 0.06)"
                    : msgTone === "ok"
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(0,0,0,0.02)",
                padding: "10px 12px",
                fontSize: 13,
                color: msgTone === "warn" ? "rgba(120, 18, 18, 0.95)" : "rgba(0,0,0,0.72)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                borderRadius: 16,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 950,
                  background:
                    msgTone === "warn"
                      ? "rgba(198, 31, 31, 0.16)"
                      : msgTone === "ok"
                        ? "rgba(0,0,0,0.10)"
                        : "rgba(0,0,0,0.08)",
                }}
              >
                {msgTone === "warn" ? "!" : msgTone === "ok" ? "✓" : "i"}
              </span>

              <div style={{ lineHeight: 1.55 }}>
                {msg
                  ? msg
                  : step === 1
                    ? "Tip: esto solo ordena tu experiencia. Puedes cambiarlo después."
                    : step === 2
                      ? `Tip: tus intereses cambian según tu foco (${titleCase(segment)}).`
                      : `Tip: tus tallas también se ajustan por foco. ${sizeGuide}`}
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button
                type="button"
                onClick={back}
                disabled={saving}
                style={{
                  borderRadius: 999,
                  padding: "12px 16px",
                  fontWeight: 980,
                  fontSize: 13,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "rgba(255,255,255,0.95)",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                Atrás
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={saving}
                  style={{
                    borderRadius: 999,
                    padding: "12px 18px",
                    fontWeight: 980,
                    fontSize: 13,
                    border: "1px solid rgba(0,0,0,0.95)",
                    background: "linear-gradient(180deg, #111, #0b0b0c)",
                    color: "#fff",
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
                    minWidth: 140,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveAndFinish}
                  disabled={saving}
                  style={{
                    borderRadius: 999,
                    padding: "12px 18px",
                    fontWeight: 980,
                    fontSize: 13,
                    border: "1px solid rgba(0,0,0,0.95)",
                    background: saving
                      ? "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.48))"
                      : "linear-gradient(180deg, #111, #0b0b0c)",
                    color: "#fff",
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: saving ? "none" : "0 18px 40px rgba(0,0,0,0.20)",
                    minWidth: 140,
                  }}
                >
                  {saving ? "Guardando…" : "Terminar"}
                </button>
              )}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
              ¿No quieres hacerlo ahora? Puedes <b>saltarlo</b> y hacerlo después.
            </div>

            {/* Responsive tweak */}
            <style jsx>{`
              @media (max-width: 880px) {
                h1 {
                  font-size: 36px !important;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </main>
  );
}

function Pill({
  label,
  done,
  active,
  stepNum,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
  stepNum: 1 | 2 | 3;
}) {
  return (
    <div
      className={cx("pill")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        padding: "10px 14px",
        border: active ? "1px solid rgba(0,0,0,0.95)" : "1px solid rgba(0,0,0,0.14)",
        background: active ? "linear-gradient(180deg, #111, #0b0b0c)" : "rgba(0,0,0,0.02)",
        color: active ? "#fff" : "#111",
        fontWeight: 980,
        fontSize: 13,
        boxShadow: active ? "0 14px 30px rgba(0,0,0,0.14)" : "none",
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
          fontWeight: 950,
        }}
      >
        {done ? "✓" : String(stepNum)}
      </span>
      {label}
    </div>
  );
}

function ChoiceCard({
  title,
  sub,
  active,
  onClick,
}: {
  title: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        borderRadius: 18,
        padding: 14,
        border: active ? "1px solid rgba(0,0,0,0.95)" : "1px solid rgba(0,0,0,0.10)",
        background: active ? "linear-gradient(180deg, #111, #0b0b0c)" : "rgba(255,255,255,0.92)",
        color: active ? "#fff" : "#111",
        cursor: "pointer",
        boxShadow: active ? "0 18px 40px rgba(0,0,0,0.18)" : "0 10px 22px rgba(0,0,0,0.06)",
        transform: active ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 980, letterSpacing: "-0.01em" }}>{title}</div>
        <div
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 950,
            background: active ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)",
            color: active ? "#fff" : "#111",
          }}
        >
          {active ? "✓" : "•"}
        </div>
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          lineHeight: 1.55,
          color: active ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.62)",
        }}
      >
        {sub}
      </div>
    </button>
  );
}