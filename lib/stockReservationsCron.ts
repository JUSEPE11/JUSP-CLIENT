import fs from "fs";
import path from "path";
import crypto from "crypto";

type ReservationRecord = {
  reference: string;
  createdAt: string;
  expiresAt: string;
  items: Array<{
    slug: string;
    size: string;
    color: string;
    qty: number;
  }>;
};

type LockPayload = {
  owner: string;
  pid: number;
  createdAt: string;
};

const RUNTIME_WRITABLE_DIR = process.env.JUSP_RUNTIME_TMP_DIR?.trim() || "/tmp";

const LOCK_PATH = path.join(RUNTIME_WRITABLE_DIR, ".catalogo_jusp.stock.lock");

const RESERVATIONS_PATH = path.join(
  RUNTIME_WRITABLE_DIR,
  "catalog_stock_reservations.json"
);

const LOCK_WAIT_STEP_MS = 200;
const LOCK_TIMEOUT_MS = 25000;
const LOCK_STALE_MS = 60000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureRuntimeWritableDir() {
  if (!fs.existsSync(RUNTIME_WRITABLE_DIR)) {
    fs.mkdirSync(RUNTIME_WRITABLE_DIR, { recursive: true });
  }
}

function readReservationsUnsafe(): ReservationRecord[] {
  try {
    if (!fs.existsSync(RESERVATIONS_PATH)) return [];

    const raw = fs.readFileSync(RESERVATIONS_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReservationsUnsafe(records: ReservationRecord[]) {
  ensureRuntimeWritableDir();
  fs.writeFileSync(RESERVATIONS_PATH, JSON.stringify(records, null, 2), "utf8");
}

function isReservationActive(record: ReservationRecord, nowMs: number) {
  const expiresAtMs = new Date(record.expiresAt).getTime();
  return Number.isFinite(expiresAtMs) && expiresAtMs > nowMs;
}

function cleanupReservations(records: ReservationRecord[]) {
  const nowMs = Date.now();

  return records.filter((record) => {
    if (!record || typeof record !== "object") return false;
    if (!String(record.reference || "").trim()) return false;
    if (!Array.isArray(record.items) || !record.items.length) return false;

    return isReservationActive(record, nowMs);
  });
}

function safeReadLockPayload(): LockPayload | null {
  try {
    if (!fs.existsSync(LOCK_PATH)) return null;

    const raw = fs.readFileSync(LOCK_PATH, "utf8");
    if (!raw.trim()) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      owner: String((parsed as any).owner || "").trim(),
      pid: Number((parsed as any).pid || 0),
      createdAt: String((parsed as any).createdAt || "").trim(),
    };
  } catch {
    return null;
  }
}

function getLockAgeMs(): number | null {
  try {
    if (!fs.existsSync(LOCK_PATH)) return null;

    const stat = fs.statSync(LOCK_PATH);
    const ageMs = Date.now() - stat.mtimeMs;

    return Number.isFinite(ageMs) ? ageMs : null;
  } catch {
    return null;
  }
}

function getLockCreatedAgeMs(payload: LockPayload | null): number | null {
  if (!payload?.createdAt) return null;

  const createdAtMs = new Date(payload.createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return null;

  const ageMs = Date.now() - createdAtMs;

  return Number.isFinite(ageMs) ? ageMs : null;
}

function removeLockIfStale(staleMs = LOCK_STALE_MS): boolean {
  try {
    if (!fs.existsSync(LOCK_PATH)) return false;

    const payload = safeReadLockPayload();
    const ageByMtime = getLockAgeMs();
    const ageByPayload = getLockCreatedAgeMs(payload);

    const ageMs =
      ageByPayload !== null
        ? ageByPayload
        : ageByMtime !== null
          ? ageByMtime
          : null;

    if (ageMs === null || ageMs < staleMs) return false;

    fs.unlinkSync(LOCK_PATH);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock(timeoutMs = LOCK_TIMEOUT_MS): Promise<() => void> {
  ensureRuntimeWritableDir();

  const started = Date.now();
  const owner = crypto.randomUUID();

  const payload: LockPayload = {
    owner,
    pid: process.pid,
    createdAt: new Date().toISOString(),
  };

  while (true) {
    try {
      fs.writeFileSync(LOCK_PATH, JSON.stringify(payload), { flag: "wx" });

      return () => {
        try {
          const current = safeReadLockPayload();

          if (!current) {
            if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
            return;
          }

          if (current.owner === owner && fs.existsSync(LOCK_PATH)) {
            fs.unlinkSync(LOCK_PATH);
          }
        } catch {}
      };
    } catch (error: any) {
      const code = String(error?.code || "");

      if (code && code !== "EEXIST") {
        throw error;
      }

      removeLockIfStale();

      if (Date.now() - started > timeoutMs) {
        const current = safeReadLockPayload();
        const ageMs = getLockAgeMs();
        const createdAgeMs = getLockCreatedAgeMs(current);

        throw new Error(
          `No se pudo obtener el lock de reservas a tiempo.${
            current?.owner ? ` owner=${current.owner}` : ""
          }${current?.pid ? ` pid=${current.pid}` : ""}${
            ageMs !== null ? ` ageMs=${Math.floor(ageMs)}` : ""
          }${createdAgeMs !== null ? ` createdAgeMs=${Math.floor(createdAgeMs)}` : ""}`
        );
      }

      await sleep(LOCK_WAIT_STEP_MS);
    }
  }
}

export async function releaseExpiredStockReservations() {
  const release = await acquireLock();

  try {
    const current = readReservationsUnsafe();
    const cleaned = cleanupReservations(current);

    if (JSON.stringify(current) !== JSON.stringify(cleaned)) {
      writeReservationsUnsafe(cleaned);
    }

    return {
      ok: true,
      released: current.length - cleaned.length,
      active: cleaned.length,
    };
  } finally {
    release();
  }
}