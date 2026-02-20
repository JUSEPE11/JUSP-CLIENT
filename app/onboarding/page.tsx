// app/onboarding/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Segment = "hombre" | "mujer" | "niños";
type Size = string;

const STORAGE_KEY = "jusp_onboarding_v2";

const SIZES_BY_SEGMENT: Record<
  Segment,
  {
    label: string;
    guide: string;
    sizes: Size[];
    defaultSizes: Size[];
  }
> = {
  hombre: {
    label: "Hombre",
    guide: "Guía: calzado EU hombre (38–44) y ropa (XS–XL).",
    sizes: ["XS", "S", "M", "L", "XL", "38", "39", "40", "41", "42", "43", "44"],
    defaultSizes: ["41"],
  },
  mujer: {
    label: "Mujer",
    guide: "Guía: calzado EU mujer (35–41) y ropa (XS–XL).",
    sizes: ["XS", "S", "M", "L", "XL", "35", "36", "37", "38", "39", "40", "41"],
    defaultSizes: ["38"],
  },
  niños: {
    label: "Niños",
    guide: "Guía: calzado kids EU (28–37) y ropa kids (XS–XL).",
    sizes: ["XS", "S", "M", "L", "XL", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37"],
    defaultSizes: ["34"],
  },
};

const INTERESTS_BY_SEGMENT: Record<Segment, Array<{ key: string; label: string }>> = {
  hombre: [
    { key: "futbol", label: "Fútbol" },
    { key: "gym", label: "Gym" },
    { key: "street", label: "Street" },
    { key: "running", label: "Running" },
    { key: "basket", label: "Basket" },
    { key: "skate", label: "Skate" },
    { key: "outdoor", label: "Outdoor" },
    { key: "lux", label: "Premium" },
    { key: "retro", label: "Retro" },
    { key: "techwear", label: "Techwear" },
  ],
  mujer: [
    { key: "lifestyle", label: "Lifestyle" },
    { key: "gym", label: "Gym" },
    { key: "running", label: "Running" },
    { key: "street", label: "Street" },
    { key: "tennis", label: "Tennis" },
    { key: "yoga", label: "Yoga" },
    { key: "outdoor", label: "Outdoor" },
    { key: "lux", label: "Premium" },
    { key: "retro", label: "Retro" },
    { key: "techwear", label: "Techwear" },
  ],
  niños: [
    { key: "colegio", label: "Colegio" },
    { key: "deporte", label: "Deporte" },
    { key: "juego", label: "Juego" },
    { key: "street", label: "Street" },
    { key: "running", label: "Running" },
    { key: "futbol", label: "Fútbol" },
    { key: "outdoor", label: "Outdoor" },
    { key: "combo", label: "Combos" },
  ],
};

const USE_CASES_BY_SEGMENT: Record<Segment, Array<{ key: string; label: string; sub: string }>> = {
  hombre: [
    { key: "diario", label: "Diario", sub: "Para el día a día" },
    { key: "gym", label: "Gym", sub: "Entrenar / rutinas" },
    { key: "trabajo", label: "Trabajo", sub: "Smart casual" },
    { key: "salidas", label: "Salidas", sub: "Outfit premium" },
    { key: "deporte", label: "Deporte", sub: "Rendimiento" },
  ],
  mujer: [
    { key: "diario", label: "Diario", sub: "Casual + comfy" },
    { key: "gym", label: "Gym", sub: "Training / fit" },
    { key: "trabajo", label: "Trabajo", sub: "Limpio y elegante" },
    { key: "salidas", label: "Salidas", sub: "Lifestyle premium" },
    { key: "deporte", label: "Deporte", sub: "Running / performance" },
  ],
  niños: [
    { key: "colegio", label: "Colegio", sub: "Resistente" },
    { key: "juego", label: "Juego", sub: "Comodidad" },
    { key: "deporte", label: "Deporte", sub: "Movimiento" },
    { key: "salidas", label: "Salidas", sub: "Bonito + fácil" },
    { key: "diario", label: "Diario", sub: "Todo terreno" },
  ],
};

// ✅ 20 marcas originales (máx 8)
const BRANDS_TOP20: Array<{ key: string; label: string }> = [
  { key: "nike", label: "Nike" },
  { key: "adidas", label: "Adidas" },
  { key: "puma", label: "Puma" },
  { key: "newbalance", label: "New Balance" },
  { key: "jordan", label: "Jordan" },
  { key: "converse", label: "Converse" },
  { key: "vans", label: "Vans" },
  { key: "reebok", label: "Reebok" },
  { key: "underarmour", label: "Under Armour" },
  { key: "asics", label: "ASICS" },
  { key: "thenorthface", label: "The North Face" },
  { key: "columbia", label: "Columbia" },
  { key: "patagonia", label: "Patagonia" },
  { key: "champion", label: "Champion" },
  { key: "tommyhilfiger", label: "Tommy Hilfiger" },
  { key: "calvinklein", label: "Calvin Klein" },
  { key: "lacoste", label: "Lacoste" },
  { key: "levis", label: "Levi’s" },
  { key: "carhartt", label: "Carhartt" },
  { key: "fila", label: "Fila" },
];

const COLORS: Array<{ key: string; label: string; swatch: string; textOnDark?: boolean }> = [
  { key: "negro", label: "Negro", swatch: "#0B0B0C", textOnDark: true },
  { key: "blanco", label: "Blanco", swatch: "#FFFFFF" },
  { key: "gris", label: "Gris", swatch: "#9AA0A6" },
  { key: "azul", label: "Azul", swatch: "#2563EB" },
  { key: "rojo", label: "Rojo", swatch: "#DC2626" },
  { key: "verde", label: "Verde", swatch: "#16A34A" },
  { key: "amarillo", label: "Amarillo", swatch: "#FACC15" },
  { key: "morado", label: "Morado", swatch: "#7C3AED" },
  { key: "rosado", label: "Rosado", swatch: "#F472B6" },
  { key: "naranja", label: "Naranja", swatch: "#F97316" },
  { key: "beige", label: "Beige", swatch: "#E7D7C1" },
  { key: "cafe", label: "Café", swatch: "#7C4A1E", textOnDark: true },
];

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

function uniqLower(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr || []) {
    const k = (x || "").trim().toLowerCase();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push((x || "").trim());
  }
  return out;
}

type Persisted = {
  v: 2;
  step: 1 | 2 | 3 | 4 | 5;
  segment: Segment;
  interests: string[];
  brands: string[];
  sizes: Size[];
  colors: string[];
  vibe: string; // compat: aquí significa "Uso principal"
};

function safeParse<T>(s: string | null): T | null {
  try {
    if (!s) return null;
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Paso 1
  const [segment, setSegment] = useState<Segment>("hombre");

  // Paso 2
  const [interests, setInterests] = useState<string[]>(["Fútbol"]);
  const [brands, setBrands] = useState<string[]>([]); // Top 20, máx 8

  // Paso 3
  const [sizes, setSizes] = useState<Size[]>(["41"]); // máx 3
  const [colors, setColors] = useState<string[]>(["Negro"]); // máx 3

  // Paso 4
  const [vibe, setVibe] = useState<string>(""); // "Uso principal"

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [msgTone, setMsgTone] = useState<"idle" | "ok" | "warn">("idle");

  // ---------- LocalStorage: load once ----------
  const didHydrate = useRef(false);
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const parsed = safeParse<Persisted>(raw);

    if (!parsed || parsed.v !== 2) return;

    const seg: Segment = parsed.segment || "hombre";
    setSegment(seg);

    const st = parsed.step;
    if (st === 1 || st === 2 || st === 3 || st === 4 || st === 5) setStep(st);

    setInterests(Array.isArray(parsed.interests) ? uniqLower(parsed.interests).slice(0, 7) : []);
    setBrands(Array.isArray(parsed.brands) ? uniqLower(parsed.brands).slice(0, 8) : []);

    const segSizes = SIZES_BY_SEGMENT[seg]?.sizes || [];
    const restoredSizes = Array.isArray(parsed.sizes)
      ? (parsed.sizes.filter((x) => segSizes.includes(String(x))) as Size[])
      : [];
    setSizes((restoredSizes.length ? restoredSizes : SIZES_BY_SEGMENT[seg].defaultSizes).slice(0, 3));

    const restoredColors = Array.isArray(parsed.colors) ? uniqLower(parsed.colors) : [];
    setColors((restoredColors.length ? restoredColors : ["Negro"]).slice(0, 3));

    setVibe(clamp(String(parsed.vibe || ""), 40));
  }, []);

  // ---------- LocalStorage: autosave ----------
  useEffect(() => {
    if (!didHydrate.current) return;

    const payload: Persisted = {
      v: 2,
      step,
      segment,
      interests: (interests || []).slice(0, 7),
      brands: (brands || []).slice(0, 8),
      sizes: (sizes || []).slice(0, 3),
      colors: (colors || []).slice(0, 3),
      vibe: clamp(vibe || "", 40),
    };

    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {}
    }, 120);

    return () => window.clearTimeout(t);
  }, [step, segment, interests, brands, sizes, colors, vibe]);

  function clearLocal() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  const segMeta = SIZES_BY_SEGMENT[segment];
  const interestsList = INTERESTS_BY_SEGMENT[segment] || [];
  const useCases = USE_CASES_BY_SEGMENT[segment] || [];

  const profilePayload = useMemo(() => {
    const sizesUpTo3 = (sizes || []).slice(0, 3);
    const colorsUpTo3 = (colors || []).slice(0, 3);
    const brandsUpTo8 = (brands || []).slice(0, 8);

    const primarySize = sizesUpTo3?.[0] ?? undefined;
    return {
      segment,
      interests: (interests || []).slice(0, 7),
      // compat backend: mantiene "size"
      size: primarySize,
      // extras: no rompe si backend ignora
      sizes: sizesUpTo3.length ? sizesUpTo3 : undefined,
      colors: colorsUpTo3.length ? colorsUpTo3 : undefined,
      brands: brandsUpTo8.length ? brandsUpTo8 : undefined,
      // compat: "vibe" (aquí es uso principal)
      vibe: clamp(vibe, 40) || undefined,
    };
  }, [segment, interests, sizes, colors, brands, vibe]);

  function skip() {
    clearLocal();
    router.replace("/account");
    router.refresh();
  }

  function back() {
    if (saving) return;
    if (step === 1) return router.back();
    setMsg("");
    setMsgTone("idle");
    setStep((s) => (s === 5 ? 4 : s === 4 ? 3 : s === 3 ? 2 : 1));
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
        setMsg("Tip: elige al menos 1 interés para que el feed te quede más exacto.");
        setMsgTone("warn");
        return;
      }
      setMsg("");
      setMsgTone("idle");
      setStep(3);
      return;
    }

    if (step === 3) {
      setMsg("");
      setMsgTone("idle");
      setStep(4);
      return;
    }

    if (step === 4) {
      setMsg("");
      setMsgTone("idle");
      setStep(5);
      return;
    }
  }

  function applySegment(seg: Segment) {
    if (saving) return;
    setSegment(seg);

    const defaults = SIZES_BY_SEGMENT[seg]?.defaultSizes || [];
    setSizes(defaults.slice(0, 3));

    const interestsBySeg = INTERESTS_BY_SEGMENT[seg] || [];
    const first = interestsBySeg[0]?.label;
    setInterests(first ? [first] : []);

    // marcas: limpio para evitar mezcla mental entre segmentos
    setBrands([]);

    // uso principal vacío
    setVibe("");

    // colores: mantenemos si ya eligió, si no Negro
    setColors((prev) => (prev && prev.length ? prev.slice(0, 3) : ["Negro"]));

    setMsg("");
    setMsgTone("idle");
  }

  function toggleInterest(label: string) {
    setInterests((prev) => {
      const p = prev || [];
      const has = p.some((x) => x.toLowerCase() === label.toLowerCase());
      if (has) return p.filter((x) => x.toLowerCase() !== label.toLowerCase());
      if (p.length >= 7) return p;
      return [...p, label];
    });
  }

  function toggleBrand(label: string) {
    setBrands((prev) => {
      const p = prev || [];
      const has = p.some((x) => x.toLowerCase() === label.toLowerCase());
      if (has) return p.filter((x) => x.toLowerCase() !== label.toLowerCase());
      if (p.length >= 8) return p;
      return [...p, label];
    });
  }

  function toggleSize(s: Size) {
    setSizes((prev) => {
      const p = prev || [];
      const has = p.includes(s);
      if (has) return p.filter((x) => x !== s);
      if (p.length >= 3) {
        const [, ...rest] = p;
        return [...rest, s];
      }
      return [...p, s];
    });
  }

  function clearSizes() {
    setSizes([]);
  }

  function toggleColor(label: string) {
    setColors((prev) => {
      const p = prev || [];
      const has = p.some((x) => x.toLowerCase() === label.toLowerCase());
      if (has) return p.filter((x) => x.toLowerCase() !== label.toLowerCase());
      if (p.length >= 3) {
        const [, ...rest] = p;
        return [...rest, label];
      }
      return [...p, label];
    });
  }

  function clearColors() {
    setColors([]);
  }

  function setUseCase(label: string) {
    setVibe((prev) => {
      const cur = (prev || "").trim().toLowerCase();
      if (cur && cur === label.toLowerCase()) return "";
      return label;
    });
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

      clearLocal();

      router.replace("/account");
      router.refresh();
    } catch (e: any) {
      setMsg(`Ups: ${e?.message || "Error inesperado"}`);
      setMsgTone("warn");
      setSaving(false);
    }
  }

  const topKicker = `ONBOARDING · Paso ${step}/5`;

  const summary = useMemo(() => {
    return {
      segment: titleCase(segment),
      interests: (interests || []).slice(0, 7),
      brands: (brands || []).slice(0, 8),
      sizes: (sizes || []).slice(0, 3),
      colors: (colors || []).slice(0, 3),
      vibe: clamp(vibe || "", 40),
    };
  }, [segment, interests, brands, sizes, colors, vibe]);

  const headline = useMemo(() => {
    if (step === 1) return { h: "Primero, dinos tu foco.", sub: "Esto ordena la experiencia desde el inicio. Puedes cambiarlo después." };
    if (step === 2) return { h: "Intereses y marcas.", sub: "Esto mejora MUCHO el feed. Menos scroll, más compras." };
    if (step === 3) return { h: "Tallas y colores.", sub: "Para mostrarte lo que realmente te queda y te gusta." };
    if (step === 4) return { h: "Uso principal.", sub: "Esto ordena outfits y recomendaciones (reemplaza vibe)." };
    return { h: "Resumen final.", sub: "Revisa y edita por sección antes de terminar." };
  }, [step]);

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
            <Pill done={step > 1} active={step === 1} label="Segmento" stepNum={1} />
            <Pill done={step > 2} active={step === 2} label="Intereses" stepNum={2} />
            <Pill done={step > 3} active={step === 3} label="Tallas + Colores" stepNum={3} />
            <Pill done={step > 4} active={step === 4} label="Uso principal" stepNum={4} />
            <Pill done={false} active={step === 5} label="Resumen" stepNum={5} />
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
            title="Saltar onboarding"
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
            <span
              style={{
                textDecoration: "underline",
                textDecorationThickness: "3px",
                textUnderlineOffset: "6px",
              }}
            >
              {headline.h}
            </span>
          </h1>

          <p style={{ marginTop: 10, fontSize: 14, color: "rgba(0,0,0,0.70)", lineHeight: 1.7, maxWidth: 760 }}>
            {headline.sub}
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
              background: "linear-gradient(90deg, rgba(0,0,0,0.95), rgba(255,214,0,0.75), rgba(0,0,0,0.95))",
            }}
          />

          <div style={{ padding: 20 }}>
            {/* Head */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 980, color: "#0B0B0C" }}>
                  {step === 1
                    ? "Segmento"
                    : step === 2
                      ? "Intereses + Marcas"
                      : step === 3
                        ? "Tallas + Colores"
                        : step === 4
                          ? "Uso principal"
                          : "Resumen"}
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.66)", lineHeight: 1.6 }}>
                  {step === 1
                    ? "Elige una base para personalizar JUSP."
                    : step === 2
                      ? "Elige 1–7 intereses y hasta 8 marcas."
                      : step === 3
                        ? "Elige hasta 3 tallas y 3 colores."
                        : step === 4
                          ? "Selecciona 1 uso principal (opcional)."
                          : "Revisa y edita antes de terminar."}{" "}
                  {step !== 5 ? <b style={{ color: "#111" }}>Opcional.</b> : null}
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
                  <ChoiceCard title="Hombre" sub="Sneakers, tech, street." active={segment === "hombre"} onClick={() => applySegment("hombre")} />
                  <ChoiceCard title="Mujer" sub="Fit premium, lifestyle." active={segment === "mujer"} onClick={() => applySegment("mujer")} />
                  <ChoiceCard title="Niños" sub="Tallas kids, combos." active={segment === "niños"} onClick={() => applySegment("niños")} />
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                  Seleccionado: <b style={{ color: "#111" }}>{titleCase(segment)}</b>. Esto ajusta intereses, tallas y guías.
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
                {/* Interests */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>
                    Intereses <span style={{ opacity: 0.7 }}>({titleCase(segment)})</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
                  {interestsList.map((it) => {
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
                  Intereses = catálogo más exacto. Menos scroll, más compras.
                </div>

                {/* Brands */}
                <div style={{ marginTop: 16, height: 1, background: "rgba(0,0,0,0.06)" }} />

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>Marcas favoritas (Top 20)</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
                      title="Máximo 8"
                    >
                      {brands.length}/8
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrands([])}
                      style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "rgba(255,255,255,0.9)",
                        fontWeight: 950,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      title="Limpiar marcas"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {BRANDS_TOP20.map((b) => {
                    const on = brands.some((x) => x.toLowerCase() === b.label.toLowerCase());
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => toggleBrand(b.label)}
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
                        {b.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                  Marcas = conversión. Si ve su marca primero, compra más rápido.
                </div>
              </div>
            ) : step === 3 ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(10,10,12,0.03)",
                  padding: 16,
                }}
              >
                {/* Sizes */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>
                      Talla ({segMeta.label})
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
                    title="Limpiar tallas"
                  >
                    Limpiar
                  </button>
                </div>

                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {segMeta.sizes.map((s) => {
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
                          background: active ? "linear-gradient(180deg, #111, #0b0b0c)" : "rgba(255,255,255,0.96)",
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
                  Puedes elegir hasta <b style={{ color: "#111" }}>3 tallas</b>. {segMeta.guide}
                </div>

                {/* Colors */}
                <div style={{ marginTop: 16, height: 1, background: "rgba(0,0,0,0.06)" }} />

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>Colores</div>
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
                      title="Máximo 3 colores"
                    >
                      {colors.length}/3
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearColors}
                    style={{
                      borderRadius: 999,
                      padding: "6px 10px",
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "rgba(255,255,255,0.9)",
                      fontWeight: 950,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    title="Limpiar colores"
                  >
                    Limpiar
                  </button>
                </div>

                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {COLORS.map((c) => {
                    const on = colors.some((x) => x.toLowerCase() === c.label.toLowerCase());
                    const textColor = c.textOnDark ? "#fff" : "#111";
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleColor(c.label)}
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
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            background: c.swatch,
                            border: "1px solid rgba(0,0,0,0.18)",
                            boxShadow: "0 6px 14px rgba(0,0,0,0.10)",
                          }}
                        />
                        <span style={{ color: on ? "#fff" : textColor }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                  Esto ayuda a mostrarte prendas en tus tonos favoritos (máx <b style={{ color: "#111" }}>3</b>).
                </div>

                <div style={{ marginTop: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)", padding: 10, fontSize: 12, color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>
                  Tip PRO: se guarda solo. Si cierras el navegador, cuando vuelvas sigue igual.
                </div>
              </div>
            ) : step === 4 ? (
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
                  <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.75)" }}>Uso principal</div>
                  <button
                    type="button"
                    onClick={() => setVibe("")}
                    style={{
                      borderRadius: 999,
                      padding: "6px 10px",
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "rgba(255,255,255,0.9)",
                      fontWeight: 950,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    title="Limpiar uso principal"
                  >
                    Limpiar
                  </button>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  {useCases.map((u) => {
                    const on = (vibe || "").trim().toLowerCase() === u.label.toLowerCase();
                    return (
                      <button
                        key={u.key}
                        type="button"
                        onClick={() => setUseCase(u.label)}
                        style={{
                          borderRadius: 16,
                          padding: 12,
                          border: on ? "1px solid rgba(0,0,0,0.95)" : "1px solid rgba(0,0,0,0.10)",
                          background: on ? "linear-gradient(180deg, #111, #0b0b0c)" : "rgba(255,255,255,0.96)",
                          color: on ? "#fff" : "#111",
                          cursor: "pointer",
                          boxShadow: on ? "0 18px 40px rgba(0,0,0,0.18)" : "0 10px 22px rgba(0,0,0,0.06)",
                          transform: on ? "translateY(-1px)" : "translateY(0)",
                          transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div style={{ fontWeight: 980, letterSpacing: "-0.01em" }}>{u.label}</div>
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
                              background: on ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)",
                              color: on ? "#fff" : "#111",
                            }}
                          >
                            {on ? "✓" : "•"}
                          </div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45, color: on ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.62)" }}>
                          {u.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                  Esto afina outfits y ordena el feed para que encuentres lo tuyo más rápido.
                </div>

                <div style={{ marginTop: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)", padding: 10, fontSize: 12, color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>
                  Tip PRO: todo esto queda guardado automáticamente (anti pérdida).
                </div>
              </div>
            ) : (
              // step 5: Resumen final
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(10,10,12,0.03)",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "rgba(255,255,255,0.92)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(0,0,0,0.55)" }}>
                        Resumen final
                      </div>
                      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 980, color: "#111" }}>Así queda tu perfil</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMsg("");
                        setMsgTone("idle");
                        setStep(1);
                      }}
                      style={{
                        borderRadius: 999,
                        padding: "8px 12px",
                        border: "1px solid rgba(0,0,0,0.14)",
                        background: "rgba(255,255,255,0.95)",
                        fontWeight: 950,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      title="Editar todo"
                    >
                      Editar todo ✎
                    </button>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    <SummaryRow label="Segmento" value={[summary.segment]} onEdit={() => setStep(1)} />
                    <SummaryRow label="Intereses" value={summary.interests.length ? summary.interests : ["—"]} onEdit={() => setStep(2)} />
                    <SummaryRow label="Marcas" value={summary.brands.length ? summary.brands : ["—"]} onEdit={() => setStep(2)} />
                    <SummaryRow label="Tallas" value={summary.sizes.length ? summary.sizes : ["—"]} onEdit={() => setStep(3)} />
                    <SummaryRow label="Colores" value={summary.colors.length ? summary.colors : ["—"]} onEdit={() => setStep(3)} />
                    <SummaryRow label="Uso principal" value={[summary.vibe || "—"]} onEdit={() => setStep(4)} />
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                    Tip: puedes editar cualquier sección y no pierdes nada. Esto se guarda automáticamente.
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
                    ? "Tip: elige tu segmento y seguimos."
                    : step === 2
                      ? "Tip: intereses + marcas = feed más exacto. Menos fricción, más compras."
                      : step === 3
                        ? "Tip: tallas + colores = te mostramos cosas que realmente te sirven."
                        : step === 4
                          ? "Tip: uso principal ordena outfits (y acelera decisiones)."
                          : "Tip: revisa el resumen. Si todo está bien, termina y listo."}
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

              {step < 5 ? (
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
  stepNum: 1 | 2 | 3 | 4 | 5;
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
      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.55, color: active ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.62)" }}>
        {sub}
      </div>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string[];
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr auto",
        gap: 10,
        alignItems: "start",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.70)", paddingTop: 6 }}>{label}</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(value || []).map((v, idx) => (
          <span
            key={`${label}-${v}-${idx}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              padding: "8px 10px",
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(0,0,0,0.02)",
              fontWeight: 950,
              fontSize: 12,
              color: "rgba(0,0,0,0.85)",
            }}
          >
            {v}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onEdit}
        style={{
          borderRadius: 999,
          padding: "8px 10px",
          border: "1px solid rgba(0,0,0,0.14)",
          background: "rgba(255,255,255,0.95)",
          fontWeight: 950,
          fontSize: 12,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title={`Editar ${label}`}
      >
        Editar
      </button>

      <style jsx>{`
        @media (max-width: 640px) {
          div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}