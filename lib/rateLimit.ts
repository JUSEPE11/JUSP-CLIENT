type Entry = { count: number; resetAt: number; blockedUntil: number };

const store = new Map<string, Entry>();

function now() {
  return Date.now();
}

export function rateLimit(params: {
  key: string;            // por ejemplo: "login:IP"
  windowMs: number;       // 60_000
  max: number;            // 10
  blockMs?: number;       // 5 * 60_000
}) {
  const { key, windowMs, max, blockMs = 5 * 60_000 } = params;

  const t = now();
  const e = store.get(key);

  // Limpieza ligera
  if (e && t > e.resetAt && t > e.blockedUntil) {
    store.delete(key);
  }

  const cur = store.get(key);

  if (!cur) {
    store.set(key, { count: 1, resetAt: t + windowMs, blockedUntil: 0 });
    return { ok: true, remaining: max - 1, resetAt: t + windowMs, blockedUntil: 0 };
  }

  if (cur.blockedUntil && t < cur.blockedUntil) {
    return { ok: false, remaining: 0, resetAt: cur.resetAt, blockedUntil: cur.blockedUntil };
  }

  // Ventana nueva
  if (t > cur.resetAt) {
    cur.count = 1;
    cur.resetAt = t + windowMs;
    cur.blockedUntil = 0;
    store.set(key, cur);
    return { ok: true, remaining: max - 1, resetAt: cur.resetAt, blockedUntil: 0 };
  }

  cur.count += 1;

  if (cur.count > max) {
    cur.blockedUntil = t + blockMs;
    store.set(key, cur);
    return { ok: false, remaining: 0, resetAt: cur.resetAt, blockedUntil: cur.blockedUntil };
  }

  store.set(key, cur);
  return { ok: true, remaining: Math.max(0, max - cur.count), resetAt: cur.resetAt, blockedUntil: 0 };
}