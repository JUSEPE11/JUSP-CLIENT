import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as XLSX from "xlsx";

type ExcelRow = Record<string, unknown>;

export type StockLineItem = {
  id?: string | null;
  product_id?: string | null;
  slug?: string | null;
  size?: string | null;
  color?: string | null;
  qty?: number | null;
};

export type StockCheckResult = {
  ok: boolean;
  requested: number;
  available: number;
  slug: string;
  size: string;
  color: string;
  reason?: string;
};

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

type CheckOptions = {
  excludeReference?: string | null;
};

type LockPayload = {
  owner: string;
  pid: number;
  createdAt: string;
};

const RUNTIME_WRITABLE_DIR =
  process.env.JUSP_RUNTIME_TMP_DIR?.trim() || "/tmp";

const LOCK_PATH = path.join(
  RUNTIME_WRITABLE_DIR,
  ".catalogo_jusp.stock.lock"
);
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

function normalizeHeaderKey(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getRowValue(row: ExcelRow, possibleKeys: string[], fallback: unknown = ""): unknown {
  const normalizedMap = new Map<string, unknown>();

  for (const [key, value] of Object.entries(row)) {
    normalizedMap.set(normalizeHeaderKey(key), value);
  }

  for (const key of possibleKeys) {
    const hit = normalizedMap.get(normalizeHeaderKey(key));
    if (hit !== undefined) return hit;
  }

  return fallback;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeLoose(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function ensureRuntimeWritableDir() {
  if (!fs.existsSync(RUNTIME_WRITABLE_DIR)) {
    fs.mkdirSync(RUNTIME_WRITABLE_DIR, { recursive: true });
  }
}

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function resolveExcelPath(): string | null {
  const dataDir = path.join(process.cwd(), "data");
  const preferred = path.join(dataDir, "catalogo_jusp.xlsx");

  if (fs.existsSync(preferred)) return preferred;
  if (!fs.existsSync(dataDir)) return null;

  const files = fs.readdirSync(dataDir);
  const candidate = files.find(
    (file) => /^catalogo_jusp(\.[^.]+)?\.xlsx$/i.test(file) || /^catalogo_jusp\.xlsx$/i.test(file)
  );

  return candidate ? path.join(dataDir, candidate) : null;
}

function loadWorkbook(filePath: string): XLSX.WorkBook {
  const buffer = fs.readFileSync(filePath);
  return XLSX.read(buffer, { type: "buffer" });
}

function getProductsSheetName(workbook: XLSX.WorkBook): string | null {
  if (workbook.Sheets["productos"]) return "productos";
  if (workbook.Sheets["Productos"]) return "Productos";
  return workbook.SheetNames[0] || null;
}

function getProductsSheet(workbook: XLSX.WorkBook) {
  const sheetName = getProductsSheetName(workbook);
  return sheetName ? workbook.Sheets[sheetName] : null;
}

function canonicalSlug(item: StockLineItem): string {
  return normalizeLoose(item.slug || item.product_id || item.id || "");
}

function canonicalSize(item: StockLineItem): string {
  return String(item.size ?? "").trim();
}

function canonicalColor(item: StockLineItem): string {
  return normalizeLoose(item.color);
}

function requestedQty(item: StockLineItem): number {
  const qty = Number(item.qty || 0);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}

function stockKeyParts(slug: string, size: string, color: string) {
  return `${slug}__${size}__${color}`;
}

function stockKeyFromItem(item: StockLineItem) {
  return stockKeyParts(canonicalSlug(item), canonicalSize(item), canonicalColor(item));
}

function matchesRow(row: ExcelRow, item: StockLineItem): boolean {
  const rowSlug = normalizeLoose(getRowValue(row, ["product_slug", "slug", "productslug"], ""));
  const rowSize = String(getRowValue(row, ["size", "talla"], "")).trim();
  const rowColor = normalizeLoose(getRowValue(row, ["color", "colour"], ""));

  const itemSlug = canonicalSlug(item);
  const itemSize = canonicalSize(item);
  const itemColor = canonicalColor(item);

  if (!itemSlug || rowSlug !== itemSlug) return false;
  if (itemSize && rowSize !== itemSize) return false;
  if (itemColor && rowColor !== itemColor) return false;

  return true;
}

function setRowStockValue(row: ExcelRow, next: number) {
  if (Object.prototype.hasOwnProperty.call(row, "stock")) {
    row.stock = next;
    return;
  }

  if (Object.prototype.hasOwnProperty.call(row, "Stock")) {
    (row as Record<string, unknown>).Stock = next;
    return;
  }

  if (Object.prototype.hasOwnProperty.call(row, "inventario")) {
    row.inventario = next;
    return;
  }

  if (Object.prototype.hasOwnProperty.call(row, "Inventario")) {
    (row as Record<string, unknown>).Inventario = next;
    return;
  }

  row.stock = next;
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

function readActiveReservationsSnapshot(excludeReference?: string | null) {
  const records = cleanupReservations(readReservationsUnsafe());
  const exclude = String(excludeReference || "").trim();
  return exclude ? records.filter((r) => r.reference !== exclude) : records;
}

function findActiveReservationByReference(reference: string): ReservationRecord | null {
  const safeReference = String(reference || "").trim();
  if (!safeReference) return null;

  const records = cleanupReservations(readReservationsUnsafe());
  return records.find((r) => r.reference === safeReference) || null;
}

export function getActiveReservationSummary(excludeReference?: string | null) {
  const active = readActiveReservationsSnapshot(excludeReference);
  const map = new Map<string, number>();

  for (const record of active) {
    for (const item of record.items) {
      const key = stockKeyParts(
        normalizeLoose(item.slug),
        String(item.size || "").trim(),
        normalizeLoose(item.color)
      );
      map.set(key, (map.get(key) || 0) + requestedQty(item));
    }
  }

  return map;
}

export function checkExcelStock(items: StockLineItem[], options?: CheckOptions): StockCheckResult[] {
  const excelPath = resolveExcelPath();
  const reservedSummary = getActiveReservationSummary(options?.excludeReference);

  if (!excelPath) {
    return items.map((item) => ({
      ok: false,
      requested: requestedQty(item),
      available: 0,
      slug: canonicalSlug(item),
      size: canonicalSize(item),
      color: canonicalColor(item),
      reason: "No se encontró data/catalogo_jusp.xlsx",
    }));
  }

  const workbook = loadWorkbook(excelPath);
  const sheet = getProductsSheet(workbook);
  if (!sheet) {
    return items.map((item) => ({
      ok: false,
      requested: requestedQty(item),
      available: 0,
      slug: canonicalSlug(item),
      size: canonicalSize(item),
      color: canonicalColor(item),
      reason: "No se encontró la hoja de productos en el Excel",
    }));
  }

  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "", raw: false });

  return items.map((item) => {
    const foundRows = rows.filter((row) => matchesRow(row, item));
    const rawAvailable = foundRows.reduce(
      (acc, row) => acc + toSafeNumber(getRowValue(row, ["stock", "inventario"], 0), 0),
      0
    );

    const reserved = reservedSummary.get(stockKeyFromItem(item)) || 0;
    const available = Math.max(0, rawAvailable - reserved);
    const requested = requestedQty(item);

    if (!foundRows.length) {
      return {
        ok: false,
        requested,
        available: 0,
        slug: canonicalSlug(item),
        size: canonicalSize(item),
        color: canonicalColor(item),
        reason: "La variante no existe en el Excel",
      };
    }

    return {
      ok: available >= requested,
      requested,
      available,
      slug: canonicalSlug(item),
      size: canonicalSize(item),
      color: canonicalColor(item),
      reason: available >= requested ? undefined : "Stock insuficiente",
    };
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
          `No se pudo obtener el lock del Excel a tiempo.${
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

function sameReservationItems(
  a: Array<{ slug: string; size: string; color: string; qty: number }>,
  b: Array<{ slug: string; size: string; color: string; qty: number }>
) {
  if (a.length !== b.length) return false;

  const normalize = (items: Array<{ slug: string; size: string; color: string; qty: number }>) =>
    [...items]
      .map((item) => ({
        slug: normalizeLoose(item.slug),
        size: String(item.size || "").trim(),
        color: normalizeLoose(item.color),
        qty: requestedQty(item),
      }))
      .sort((x, y) =>
        `${x.slug}|${x.size}|${x.color}|${x.qty}`.localeCompare(
          `${y.slug}|${y.size}|${y.color}|${y.qty}`
        )
      );

  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

export async function reserveExcelStock(
  reference: string,
  items: StockLineItem[],
  holdMinutes = 10
) {
  const safeReference = String(reference || "").trim();
  if (!safeReference) {
    throw new Error("La reserva requiere reference.");
  }

  const filtered = items
    .map((item) => ({
      slug: canonicalSlug(item),
      size: canonicalSize(item),
      color: canonicalColor(item),
      qty: requestedQty(item),
    }))
    .filter((item) => item.slug && item.qty > 0);

  if (!filtered.length) {
    throw new Error("La reserva no trae items válidos.");
  }

  const existingBeforeLock = findActiveReservationByReference(safeReference);
  if (existingBeforeLock && sameReservationItems(existingBeforeLock.items, filtered)) {
    return { ok: true, expiresAt: existingBeforeLock.expiresAt, reused: true };
  }

  const release = await acquireLock();
  try {
    const current = cleanupReservations(readReservationsUnsafe());

    const existingInsideLock = current.find((record) => record.reference === safeReference);
    if (existingInsideLock && sameReservationItems(existingInsideLock.items, filtered)) {
      return { ok: true, expiresAt: existingInsideLock.expiresAt, reused: true };
    }

    const precheck = checkExcelStock(filtered, { excludeReference: safeReference });
    const failed = precheck.find((row) => !row.ok);
    if (failed) {
      throw new Error(
        `Stock insuficiente para ${failed.slug}${failed.size ? ` / ${failed.size}` : ""}${
          failed.color ? ` / ${failed.color}` : ""
        }. Disponible: ${failed.available}.`
      );
    }

    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000).toISOString();

    const next = [
      ...current.filter((record) => record.reference !== safeReference),
      {
        reference: safeReference,
        createdAt: new Date().toISOString(),
        expiresAt,
        items: filtered,
      },
    ];

    writeReservationsUnsafe(next);

    return { ok: true, expiresAt, reused: false };
  } finally {
    release();
  }
}

export async function releaseExcelReservation(reference: string) {
  const safeReference = String(reference || "").trim();
  if (!safeReference) return { ok: true, released: 0 };

  const release = await acquireLock();
  try {
    const current = cleanupReservations(readReservationsUnsafe());
    const before = current.length;
    const next = current.filter((record) => record.reference !== safeReference);
    writeReservationsUnsafe(next);
    return { ok: true, released: before - next.length };
  } finally {
    release();
  }
}

export async function releaseExpiredExcelReservations() {
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

export async function decrementExcelStock(items: StockLineItem[]) {
  const filtered = items
    .map((item) => ({
      ...item,
      qty: requestedQty(item),
      size: canonicalSize(item),
      color: canonicalColor(item),
      slug: canonicalSlug(item),
    }))
    .filter((item) => item.slug && Number(item.qty || 0) > 0);

  if (!filtered.length) {
    return { ok: true, updated: 0 };
  }

  const precheck = checkExcelStock(filtered);
  const failed = precheck.find((row) => !row.ok);
  if (failed) {
    throw new Error(
      `Stock insuficiente para ${failed.slug}${failed.size ? ` / ${failed.size}` : ""}${
        failed.color ? ` / ${failed.color}` : ""
      }. Disponible: ${failed.available}. Pedido: ${failed.requested}.`
    );
  }

  const release = await acquireLock();
  try {
    const excelPath = resolveExcelPath();
    if (!excelPath) throw new Error("No se encontró data/catalogo_jusp.xlsx");

    const workbook = loadWorkbook(excelPath);
    const sheetName = getProductsSheetName(workbook);
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;

    if (!sheet || !sheetName) {
      throw new Error("No se encontró la hoja de productos en el Excel");
    }

    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "", raw: false });

    for (const item of filtered) {
      let remaining = requestedQty(item);

      for (const row of rows) {
        if (!matchesRow(row, item)) continue;
        if (remaining <= 0) break;

        const current = toSafeNumber(getRowValue(row, ["stock", "inventario"], 0), 0);
        if (current <= 0) continue;

        const discount = Math.min(current, remaining);
        const next = current - discount;
        remaining -= discount;

        setRowStockValue(row, next);
      }

      if (remaining > 0) {
        throw new Error(
          `No fue posible descontar todo el stock de ${item.slug}${item.size ? ` / ${item.size}` : ""}${
            item.color ? ` / ${item.color}` : ""
          }.`
        );
      }
    }

    const nextSheet = XLSX.utils.json_to_sheet(rows);
    workbook.Sheets[sheetName] = nextSheet;
    XLSX.writeFile(workbook, excelPath);

    const cachePath = path.join(process.cwd(), "data", "catalog_products.cache.json");
    try {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    } catch {}

    return { ok: true, updated: filtered.length };
  } finally {
    release();
  }
}

export async function consumeExcelReservationAndDecrement(
  reference: string,
  items: StockLineItem[]
) {
  const safeReference = String(reference || "").trim();
  if (!safeReference) {
    throw new Error("Falta reference para consumir la reserva.");
  }

  const filtered = items
    .map((item) => ({
      ...item,
      qty: requestedQty(item),
      size: canonicalSize(item),
      color: canonicalColor(item),
      slug: canonicalSlug(item),
    }))
    .filter((item) => item.slug && Number(item.qty || 0) > 0);

  if (!filtered.length) {
    return { ok: true, updated: 0 };
  }

  const release = await acquireLock();
  try {
    const reservations = cleanupReservations(readReservationsUnsafe());

    const precheck = checkExcelStock(filtered, { excludeReference: safeReference });
    const failed = precheck.find((row) => !row.ok);
    if (failed) {
      throw new Error(
        `Stock insuficiente para ${failed.slug}${failed.size ? ` / ${failed.size}` : ""}${
          failed.color ? ` / ${failed.color}` : ""
        }. Disponible: ${failed.available}. Pedido: ${failed.requested}.`
      );
    }

    const excelPath = resolveExcelPath();
    if (!excelPath) throw new Error("No se encontró data/catalogo_jusp.xlsx");

    const workbook = loadWorkbook(excelPath);
    const sheetName = getProductsSheetName(workbook);
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;

    if (!sheet || !sheetName) {
      throw new Error("No se encontró la hoja de productos en el Excel");
    }

    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "", raw: false });

    for (const item of filtered) {
      let remaining = requestedQty(item);

      for (const row of rows) {
        if (!matchesRow(row, item)) continue;
        if (remaining <= 0) break;

        const current = toSafeNumber(getRowValue(row, ["stock", "inventario"], 0), 0);
        if (current <= 0) continue;

        const discount = Math.min(current, remaining);
        const next = current - discount;
        remaining -= discount;

        setRowStockValue(row, next);
      }

      if (remaining > 0) {
        throw new Error(
          `No fue posible descontar todo el stock de ${item.slug}${item.size ? ` / ${item.size}` : ""}${
            item.color ? ` / ${item.color}` : ""
          }.`
        );
      }
    }

    const nextSheet = XLSX.utils.json_to_sheet(rows);
    workbook.Sheets[sheetName] = nextSheet;
    XLSX.writeFile(workbook, excelPath);

    writeReservationsUnsafe(reservations.filter((record) => record.reference !== safeReference));

    const cachePath = path.join(process.cwd(), "data", "catalog_products.cache.json");
    try {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    } catch {}

    return { ok: true, updated: filtered.length };
  } finally {
    release();
  }
}