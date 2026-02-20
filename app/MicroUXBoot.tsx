"use client";

import { useEffect } from "react";

const KEY_HAS_PURCHASED = "jusp_microux_hasPurchased_v1";
const KEY_PROFILE = "jusp_microux_profile_v1"; // { visits, lastSeenAt, returning, hasPurchased, fastSearchHint }
const KEY_RESET_SNAPSHOT = "jusp_microux_reset_v1";

type MicroUXProfile = {
  visits: number;
  lastSeenAt: number;
  returning: boolean;
  hasPurchased: boolean;
  fastSearchHint: boolean; // para “resultados más rápidos si repite patrón”
};

function now() {
  return Date.now();
}

function safeReadProfile(): MicroUXProfile {
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    if (!raw) {
      const base: MicroUXProfile = {
        visits: 0,
        lastSeenAt: 0,
        returning: false,
        hasPurchased: false,
        fastSearchHint: false,
      };
      return base;
    }
    const p = JSON.parse(raw) as Partial<MicroUXProfile>;
    return {
      visits: typeof p.visits === "number" ? p.visits : 0,
      lastSeenAt: typeof p.lastSeenAt === "number" ? p.lastSeenAt : 0,
      returning: typeof p.returning === "boolean" ? p.returning : false,
      hasPurchased: typeof p.hasPurchased === "boolean" ? p.hasPurchased : false,
      fastSearchHint: typeof p.fastSearchHint === "boolean" ? p.fastSearchHint : false,
    };
  } catch {
    return {
      visits: 0,
      lastSeenAt: 0,
      returning: false,
      hasPurchased: false,
      fastSearchHint: false,
    };
  }
}

function safeWriteProfile(next: MicroUXProfile) {
  try {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(next));
  } catch {}
}

function safeGetHasPurchased(): boolean {
  try {
    return localStorage.getItem(KEY_HAS_PURCHASED) === "1";
  } catch {
    return false;
  }
}

function safeSetHasPurchased(v: boolean) {
  try {
    localStorage.setItem(KEY_HAS_PURCHASED, v ? "1" : "0");
  } catch {}
}

function broadcast() {
  try {
    window.dispatchEvent(new CustomEvent("jusp:microux"));
  } catch {}
}

function applyBodyFlags(profile: MicroUXProfile) {
  // No cambia diseño. Solo “pistas” para CSS/JS si quieres usarlo.
  // Puedes usar: document.body.classList.contains("jusp-returning") etc.
  document.body.classList.toggle("jusp-returning", profile.returning);
  document.body.classList.toggle("jusp-purchased", profile.hasPurchased);
  document.body.classList.toggle("jusp-fastsearch", profile.fastSearchHint);

  // Variables para micro-timing (si quieres usarlas en CSS)
  // Primera visita: más suave / lento; recurrente: más rápido; comprado: aún más seguro/rápido
  const msBase = profile.returning ? 140 : 190;
  const ms = profile.hasPurchased ? Math.max(110, msBase - 30) : msBase;
  document.documentElement.style.setProperty("--jusp-ux-ms", `${ms}ms`);
}

function updateSeen() {
  const p = safeReadProfile();
  const t = now();

  const last = p.lastSeenAt || 0;
  const gapMs = t - last;

  // returning si ya volvió (o sea, si hubo una visita previa y pasaron > 30s)
  // (evita que refresh cuente como “recurrente”)
  const returning = p.visits >= 1 && gapMs > 30_000;

  // fastSearchHint: si es recurrente, damos permiso para optimizaciones (cache, menos skeleton, etc.)
  const fastSearchHint = p.visits >= 2;

  const hasPurchased = safeGetHasPurchased();

  const next: MicroUXProfile = {
    visits: Math.min(9999, (p.visits || 0) + 1),
    lastSeenAt: t,
    returning,
    hasPurchased,
    fastSearchHint,
  };

  safeWriteProfile(next);
  applyBodyFlags(next);
  broadcast();
}

function resetMicroUX() {
  try {
    localStorage.removeItem(KEY_PROFILE);
    localStorage.removeItem(KEY_HAS_PURCHASED);
    localStorage.setItem(KEY_RESET_SNAPSHOT, String(now()));
  } catch {}
  const next = safeReadProfile();
  applyBodyFlags(next);
  broadcast();
}

function toggleHasPurchased() {
  const current = safeGetHasPurchased();
  safeSetHasPurchased(!current);

  const p = safeReadProfile();
  const next: MicroUXProfile = {
    ...p,
    hasPurchased: !current,
  };
  safeWriteProfile(next);
  applyBodyFlags(next);
  broadcast();

  // feedback mínimo (sin UI visible)
  // Si quieres, lo puedes quitar.
  try {
    // eslint-disable-next-line no-console
    console.log(`[JUSP] hasPurchased = ${!current ? "ON" : "OFF"}`);
  } catch {}
}

export default function MicroUXBoot() {
  useEffect(() => {
    updateSeen();

    const onKey = (e: KeyboardEvent) => {
      // Ctrl + Shift + J => toggle “ya compró”
      if (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j")) {
        e.preventDefault();
        toggleHasPurchased();
        return;
      }

      // Ctrl + Shift + K => reset micro-UX
      if (e.ctrlKey && e.shiftKey && (e.key === "K" || e.key === "k")) {
        e.preventDefault();
        resetMicroUX();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}