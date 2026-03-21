import fs from "fs";
import path from "path";
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

const LOCK_PATH = path.join(process.cwd(), "data", ".catalogo_jusp.stock.lock");

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

export function checkExcelStock(items: StockLineItem[]): StockCheckResult[] {
  const excelPath = resolveExcelPath();
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
    const available = foundRows.reduce(
      (acc, row) => acc + toSafeNumber(getRowValue(row, ["stock", "inventario"], 0), 0),
      0
    );
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

async function acquireLock(timeoutMs = 15000): Promise<() => void> {
  const started = Date.now();

  while (true) {
    try {
      fs.writeFileSync(LOCK_PATH, String(process.pid), { flag: "wx" });
      return () => {
        try {
          fs.unlinkSync(LOCK_PATH);
        } catch {}
      };
    } catch {
      if (Date.now() - started > timeoutMs) {
        throw new Error("No se pudo obtener el lock del Excel a tiempo.");
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
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