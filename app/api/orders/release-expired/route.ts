import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredExcelReservations } from "@/lib/stockExcel";
import { dbInsertLog } from "@/lib/ordersRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const bearer = req.headers.get("authorization") || "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7).trim() : "";
  const expected = String(process.env.CRON_SECRET || "").trim();

  if (!expected) return true;
  return !!token && token === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await releaseExpiredExcelReservations();

    await dbInsertLog({
      level: "info",
      scope: "orders.release-expired",
      message: "Reservas expiradas liberadas",
      meta: result,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    try {
      await dbInsertLog({
        level: "error",
        scope: "orders.release-expired",
        message: e?.message || "Error liberando reservas expiradas",
        meta: {
          stack: e?.stack || null,
        },
      });
    } catch {}

    return NextResponse.json(
      { ok: false, error: e?.message || "Error liberando reservas expiradas" },
      { status: 500 }
    );
  }
}