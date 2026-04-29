import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getDataDir() {
  return path.join(process.cwd(), "data");
}

function getExcelPath() {
  return path.join(getDataDir(), "catalogo_jusp.xlsx");
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

    const products = buildProducts();

    return NextResponse.json({
      ok: true,
      regenerated: false,
      total: products.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "fail" });
  }
}
