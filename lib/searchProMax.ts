export type SearchCacheEntry<T> = { ts: number; items: T[] };

export type SearchProMaxConfig = {
  recentsKey?: string;
  cacheKey?: string;
  ttlMs?: number;          // freshness
  maxCacheKeys?: number;   // LRU size
  maxRecents?: number;
};

const DEFAULTS: Required<SearchProMaxConfig> = {
  recentsKey: "jusp_search_recents_v1",
  cacheKey: "jusp_search_cache_v1",
  ttlMs: 1000 * 60 * 5,
  maxCacheKeys: 28,
  maxRecents: 12,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function createSearchProMax<T>(config?: SearchProMaxConfig) {
  const cfg = { ...DEFAULTS, ...(config ?? {}) };
  const typing = { lastAt: 0, avgDelta: 160 };

  let cache: Record<string, SearchCacheEntry<T>> = {};
  let recents: string[] = [];

  const hasWindow = typeof window !== "undefined";

  const load = () => {
    if (!hasWindow) return;
    recents = safeJsonParse<string[]>(window.localStorage.getItem(cfg.recentsKey), [])
      .filter((x) => typeof x === "string")
      .slice(0, cfg.maxRecents);

    cache = safeJsonParse<Record<string, SearchCacheEntry<T>>>(window.localStorage.getItem(cfg.cacheKey), {});
  };

  const save = () => {
    if (!hasWindow) return;

    // compact LRU
    const entries = Object.entries(cache)
      .sort((a, b) => (b[1]?.ts ?? 0) - (a[1]?.ts ?? 0))
      .slice(0, cfg.maxCacheKeys);

    const compact: Record<string, SearchCacheEntry<T>> = {};
    for (const [k, v] of entries) compact[k] = v;

    cache = compact;
    window.localStorage.setItem(cfg.cacheKey, JSON.stringify(compact));
    window.localStorage.setItem(cfg.recentsKey, JSON.stringify(recents.slice(0, cfg.maxRecents)));
  };

  const addRecent = (q: string) => {
    const s = q.trim();
    if (!s) return;
    const next = [s, ...recents.filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, cfg.maxRecents);
    recents = next;
    save();
  };

  const getAdaptiveDelay = (q: string) => {
    const now = Date.now();
    const prev = typing.lastAt || now;
    const delta = clamp(now - prev, 8, 520);
    typing.lastAt = now;
    typing.avgDelta = typing.avgDelta * 0.7 + delta * 0.3;

    const s = q.trim();
    if (!s) return 220;

    const key = s.toLowerCase();
    const repeated =
      recents.some((r) => r.toLowerCase() === key) ||
      Object.keys(cache).some((k) => k.toLowerCase() === key);

    if (repeated) return 80;
    if (typing.avgDelta < 85) return 260;
    if (s.length <= 2) return 200;
    return 130;
  };

  const getPredictive = (q: string) => {
    const s = q.trim().toLowerCase();
    if (!s) return null;

    // exact cache
    const exact = cache[s];
    if (exact?.items?.length && Date.now() - exact.ts < cfg.ttlMs) return exact.items;

    // prefix cache (latest first)
    const prefix = Object.entries(cache)
      .filter(([k]) => k.toLowerCase().startsWith(s))
      .sort((a, b) => (b[1]?.ts ?? 0) - (a[1]?.ts ?? 0))[0];

    if (prefix?.[1]?.items?.length) return prefix[1].items;

    return null;
  };

  const setCache = (q: string, items: T[]) => {
    const s = q.trim().toLowerCase();
    if (!s) return;
    cache[s] = { ts: Date.now(), items };
    save();
  };

  const getSuggestions = (q: string) => {
    const s = q.trim().toLowerCase();
    if (!s) return recents.slice(0, cfg.maxRecents);

    const fromRecents = recents.filter((x) => x.toLowerCase().includes(s));
    const fromCache = Object.keys(cache)
      .filter((k) => k.toLowerCase().includes(s))
      .sort((a, b) => (cache[b]?.ts ?? 0) - (cache[a]?.ts ?? 0));

    const merged: string[] = [];
    for (const it of [...fromRecents, ...fromCache]) {
      if (!merged.some((x) => x.toLowerCase() === it.toLowerCase())) merged.push(it);
      if (merged.length >= 10) break;
    }
    return merged;
  };

  return {
    load,
    save,
    addRecent,
    getAdaptiveDelay,
    getPredictive,
    setCache,
    getSuggestions,
  };
}