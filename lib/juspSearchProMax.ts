"use client";

/**
 * JUSP Search PRO MAX – Adaptive Debounce + Predictive Pattern
 * - No depende de backend
 * - Usa localStorage para “memoria” ligera (patrones, recents, stats)
 * - Hecho para integrarse en tu Header (Search overlay PRO MAX)
 */

import { useEffect, useMemo, useRef, useState } from "react";

export type JuspProductLite = {
  id?: string;
  title: string;
  href: string;
  image?: string;
  subtitle?: string;
  price?: string;
};

export type PredictiveKind = "recent" | "suggest" | "quick" | "product";

export type PredictiveItem = {
  kind: PredictiveKind;
  label: string;
  href: string;
  image?: string;
  meta?: string;
  score?: number;
};

type PatternStats = {
  // “intenciones” simples por prefijos
  prefixHits: Record<string, number>;
  // historial de queries submit
  lastQueries: string[];
  // timing
  avgKeyIntervalMs: number; // EMA
  // contador de uso general
  submits: number;
  picks: number;
  updatedAt: number;
};

const LS_KEY_STATS = "jusp_search_stats_v1";
const LS_KEY_RECENTS = "jusp_search_recents_v1"; // (si ya tienes este, lo respetamos)

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadStats(): PatternStats {
  if (typeof window === "undefined") {
    return {
      prefixHits: {},
      lastQueries: [],
      avgKeyIntervalMs: 140,
      submits: 0,
      picks: 0,
      updatedAt: Date.now(),
    };
  }

  const parsed = safeJsonParse<PatternStats>(localStorage.getItem(LS_KEY_STATS));
  if (!parsed || typeof parsed !== "object") {
    return {
      prefixHits: {},
      lastQueries: [],
      avgKeyIntervalMs: 140,
      submits: 0,
      picks: 0,
      updatedAt: Date.now(),
    };
  }

  return {
    prefixHits: parsed.prefixHits && typeof parsed.prefixHits === "object" ? parsed.prefixHits : {},
    lastQueries: Array.isArray(parsed.lastQueries) ? parsed.lastQueries.filter((x) => typeof x === "string").slice(0, 30) : [],
    avgKeyIntervalMs: typeof parsed.avgKeyIntervalMs === "number" ? clamp(parsed.avgKeyIntervalMs, 60, 420) : 140,
    submits: typeof parsed.submits === "number" ? Math.max(0, parsed.submits) : 0,
    picks: typeof parsed.picks === "number" ? Math.max(0, parsed.picks) : 0,
    updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
  };
}

function saveStats(next: PatternStats) {
  try {
    localStorage.setItem(LS_KEY_STATS, JSON.stringify(next));
  } catch {}
}

export function safeLoadRecents(limit = 8): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY_RECENTS);
    const arr = safeJsonParse<unknown>(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === "string").slice(0, limit);
  } catch {
    return [];
  }
}

export function safeSaveRecent(q: string, limit = 8) {
  const s = q.trim();
  if (!s) return;
  try {
    const prev = safeLoadRecents(limit);
    const next = [s, ...prev.filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, limit);
    localStorage.setItem(LS_KEY_RECENTS, JSON.stringify(next));
  } catch {}
}

/**
 * Aprende patrones de intención:
 * - Guarda prefijos (3..12 chars) del query (lowercase)
 */
function bumpPrefixHits(stats: PatternStats, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return stats;

  const next = { ...stats, prefixHits: { ...stats.prefixHits }, updatedAt: Date.now() };
  const minLen = 3;
  const maxLen = Math.min(12, s.length);

  for (let L = minLen; L <= maxLen; L++) {
    const p = s.slice(0, L);
    next.prefixHits[p] = (next.prefixHits[p] ?? 0) + 1;
  }

  return next;
}

/**
 * Debounce adaptativo:
 * - Base depende del largo del query
 * - Ajusta por velocidad de tipeo (EMA del intervalo entre teclas)
 * - Reduce delay si detecta patrón repetido (prefijo con hits altos)
 */
export function getAdaptiveDebounceMs(params: {
  query: string;
  keyIntervalMs?: number;
  stats?: PatternStats;
}) {
  const q = (params.query ?? "").trim();
  const L = q.length;

  // base por longitud (más corto => más delay para evitar spam)
  let base = 260;
  if (L <= 0) base = 0;
  else if (L <= 1) base = 340;
  else if (L <= 2) base = 300;
  else if (L <= 4) base = 260;
  else if (L <= 7) base = 220;
  else base = 180;

  const stats = params.stats ?? loadStats();

  // typing speed factor (más rápido tipeo => sube un poco el delay para “esperar”)
  const ki = typeof params.keyIntervalMs === "number" ? clamp(params.keyIntervalMs, 40, 520) : stats.avgKeyIntervalMs;
  const speedFactor = clamp((ki - 80) / 240, -0.35, 0.55); // ki bajo => factor negativo => baja delay

  // pattern boost: si el prefijo ya es común => baja delay (resultados “más rápidos si repite patrón”)
  const p = q.toLowerCase().slice(0, Math.min(8, q.length));
  const hits = p.length >= 3 ? (stats.prefixHits[p] ?? 0) : 0;
  const patternFactor = clamp(hits / 14, 0, 0.55); // 0..0.55

  // si el usuario ya buscó algo muy similar recientemente, baja delay fuerte
  const last = stats.lastQueries ?? [];
  const similar = q.length >= 3 ? last.some((x) => x.toLowerCase().startsWith(q.toLowerCase()) || q.toLowerCase().startsWith(x.toLowerCase())) : false;

  let ms = base;

  ms = ms * (1 + speedFactor);
  ms = ms * (1 - patternFactor);

  if (similar) ms = ms * 0.55;

  // límites
  ms = clamp(Math.round(ms), 60, 420);

  // query vacío => 0
  if (!q) ms = 0;

  return ms;
}

/**
 * Re-rank predictivo:
 * - Prioriza recents que matchean prefijo
 * - Sube quick/suggest que se parezcan al patrón más usado
 */
export function rankPredictiveItems(params: {
  query: string;
  items: PredictiveItem[];
  recents?: string[];
  stats?: PatternStats;
}) {
  const q = (params.query ?? "").trim().toLowerCase();
  const stats = params.stats ?? loadStats();
  const recents = params.recents ?? safeLoadRecents(8);

  const prefix = q.slice(0, Math.min(8, q.length));
  const prefixHits = prefix.length >= 3 ? (stats.prefixHits[prefix] ?? 0) : 0;

  const scored = params.items.map((it) => {
    const label = it.label.toLowerCase();
    let s = 0;

    // match directo
    if (q && label === q) s += 50;
    if (q && label.startsWith(q)) s += 38;
    if (q && label.includes(q)) s += 18;

    // recents boost
    if (it.kind === "recent") {
      s += 24;
      if (q && label.startsWith(q)) s += 22;
      if (recents.some((r) => r.toLowerCase() === label)) s += 12;
    }

    // pattern boost
    if (prefixHits > 0) {
      if (q && label.startsWith(prefix)) s += Math.min(26, 6 + prefixHits);
      if (it.kind === "quick" || it.kind === "suggest") s += Math.min(10, Math.floor(prefixHits / 3));
    }

    // producto (cuando existe) se prioriza mucho si match
    if (it.kind === "product") {
      if (q && label.startsWith(q)) s += 60;
      else if (q && label.includes(q)) s += 32;
      else s += 8;
    }

    return { ...it, score: s };
  });

  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // dedupe por href
  const seen = new Set<string>();
  const out: PredictiveItem[] = [];
  for (const it of scored) {
    const k = it.href;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }

  return out;
}

/**
 * Registrar “submit” (Enter / click buscar):
 * - actualiza stats
 * - actualiza recents
 */
export function recordSearchSubmit(query: string) {
  const q = query.trim();
  if (!q) return;

  safeSaveRecent(q, 8);

  if (typeof window === "undefined") return;
  const prev = loadStats();
  const next1 = bumpPrefixHits(prev, q);

  const next: PatternStats = {
    ...next1,
    submits: (next1.submits ?? 0) + 1,
    lastQueries: [q, ...(next1.lastQueries ?? []).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 30),
    updatedAt: Date.now(),
  };

  saveStats(next);
}

/**
 * Registrar “pick” de una sugerencia:
 */
export function recordSuggestionPick(label: string) {
  const q = label.trim();
  if (!q) return;

  if (typeof window === "undefined") return;
  const prev = loadStats();
  const next1 = bumpPrefixHits(prev, q);

  const next: PatternStats = {
    ...next1,
    picks: (next1.picks ?? 0) + 1,
    lastQueries: [q, ...(next1.lastQueries ?? []).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 30),
    updatedAt: Date.now(),
  };

  saveStats(next);
}

/**
 * Hook: mide intervalo entre teclas (EMA) para el debounce adaptativo
 */
export function useKeyIntervalEma(depsKey: string, enabled = true) {
  const lastTs = useRef<number>(0);
  const ema = useRef<number>(140);
  const [emaMs, setEmaMs] = useState(140);

  useEffect(() => {
    if (!enabled) return;
    const now = Date.now();
    if (lastTs.current > 0) {
      const dt = clamp(now - lastTs.current, 40, 520);
      // EMA rápida
      ema.current = Math.round(ema.current * 0.72 + dt * 0.28);
      setEmaMs(ema.current);
    }
    lastTs.current = now;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, enabled]);

  return emaMs;
}

/**
 * Hook: debounce adaptativo del query (devuelve value debounced + ms actual)
 */
export function useAdaptiveDebouncedValue(query: string, enabled = true) {
  const q = query ?? "";
  const stats = useMemo(() => (typeof window === "undefined" ? null : loadStats()), []);
  const keyIntervalMs = useKeyIntervalEma(q, enabled);

  const debounceMs = useMemo(() => {
    return getAdaptiveDebounceMs({ query: q, keyIntervalMs, stats: stats ?? undefined });
  }, [q, keyIntervalMs, stats]);

  const [debounced, setDebounced] = useState(q);

  useEffect(() => {
    if (!enabled) {
      setDebounced(q);
      return;
    }
    if (!q.trim()) {
      setDebounced(q);
      return;
    }
    const t = window.setTimeout(() => setDebounced(q), debounceMs);
    return () => window.clearTimeout(t);
  }, [q, debounceMs, enabled]);

  return { debouncedQuery: debounced, debounceMs, keyIntervalMs };
}

/**
 * Hook: fetch predictivo con AbortController
 * - tú pasas fetcher(debouncedQuery, signal)
 */
export function usePredictiveFetch<T>(params: {
  open: boolean;
  query: string;
  fetcher: (q: string, signal: AbortSignal) => Promise<T>;
  minChars?: number;
}) {
  const { open, query, fetcher, minChars = 2 } = params;

  const { debouncedQuery, debounceMs } = useAdaptiveDebouncedValue(query, open);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const acRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setErr(null);
      setData(null);
      try {
        acRef.current?.abort();
      } catch {}
      acRef.current = null;
      return;
    }

    const q = debouncedQuery.trim();
    if (q.length < minChars) {
      setLoading(false);
      setErr(null);
      setData(null);
      try {
        acRef.current?.abort();
      } catch {}
      acRef.current = null;
      return;
    }

    try {
      acRef.current?.abort();
    } catch {}
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);

    fetcher(q, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        setData(res);
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setErr(typeof e?.message === "string" ? e.message : "Error");
      })
      .finally(() => {
        if (ac.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      try {
        ac.abort();
      } catch {}
    };
  }, [open, debouncedQuery, fetcher, minChars]);

  return { debouncedQuery, debounceMs, loading, err, data };
}