import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CACHE_FILE_NAME = "catalog_products.cache";
const CACHE_VERSION = 1;

function getDataDir() {
  return path.join(process.cwd(), "data");
}

function getExcelPath() {
  return path.join(getDataDir(), "catalogo_jusp.xlsx");
}

function getCachePath() {
  return path.join(getDataDir(), CACHE_FILE_NAME);
}

function buildProducts() {
  const excelPath = getExcelPath();
  if (!fs.existsSync(excelPath)) return [];

  const bytes = fs.readFileSync(excelPath);
  const workbook = XLSX.read(bytes, { type: "buffer" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows;
}

export async function GET() {
  try {
    const excelPath = getExcelPath();

    if (!fs.existsSync(excelPath)) {
      return NextResponse.json({ error: "Excel no existe" });
    }

    const stats = fs.statSync(excelPath);

    const products = buildProducts();

    const payload = {
      version: CACHE_VERSION,
      generatedAt: new Date().toISOString(),
      excelMtimeMs: stats.mtimeMs,
      products,
    };

    fs.writeFileSync(getCachePath(), JSON.stringify(payload, null, 2));

    return NextResponse.json({
      ok: true,
      regenerated: true,
      total: products.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "fail" });
  }
}