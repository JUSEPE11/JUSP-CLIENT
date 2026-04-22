export type FlashWindowState = {
  isFlash24h: boolean;
  flashStartsAt?: string;
  flashExpiresAt?: string;
  flashActive: boolean;
  flashUpcoming: boolean;
  flashExpired: boolean;
};

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toSafeBoolean(value: unknown): boolean {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    v === "1" ||
    v === "true" ||
    v === "yes" ||
    v === "si" ||
    v === "sí" ||
    v === "x" ||
    v === "ok"
  );
}

export function parseFlashDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(EXCEL_EPOCH_MS + value * DAY_MS);
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2})(?::(\d{2}))(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  const [, dd, mm, yyyy, hh = "0", min = "0", sec = "0"] = match;
  const parsed = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    Number(sec)
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveFlashWindow(input: {
  isFlash24h?: unknown;
  flashStartsAt?: unknown;
  flashExpiresAt?: unknown;
  now?: Date;
}): FlashWindowState {
  const isFlash24h = toSafeBoolean(input.isFlash24h);
  if (!isFlash24h) {
    return {
      isFlash24h: false,
      flashActive: false,
      flashUpcoming: false,
      flashExpired: false,
    };
  }

  const now = input.now instanceof Date ? input.now : new Date();
  let startsAt = parseFlashDate(input.flashStartsAt);
  let expiresAt = parseFlashDate(input.flashExpiresAt);

  if (!startsAt && expiresAt) {
    startsAt = new Date(expiresAt.getTime() - DAY_MS);
  }

  if (startsAt && !expiresAt) {
    expiresAt = new Date(startsAt.getTime() + DAY_MS);
  }

  if (!startsAt || !expiresAt || expiresAt.getTime() <= startsAt.getTime()) {
    return {
      isFlash24h,
      flashActive: false,
      flashUpcoming: false,
      flashExpired: false,
    };
  }

  const current = now.getTime();
  const start = startsAt.getTime();
  const end = expiresAt.getTime();

  return {
    isFlash24h,
    flashStartsAt: startsAt.toISOString(),
    flashExpiresAt: expiresAt.toISOString(),
    flashActive: current >= start && current < end,
    flashUpcoming: current < start,
    flashExpired: current >= end,
  };
}

export function formatCountdownParts(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    compact:
      days > 0
        ? `${days}d ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
        : `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`,
  };
}

export function isFridayInSantiago(now = new Date()) {
  try {
    const weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "America/Santiago",
    }).format(now);

    return weekday.toLowerCase().startsWith("fri");
  } catch {
    return now.getDay() === 5;
  }
}
