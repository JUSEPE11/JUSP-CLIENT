// app/api/wompi/signature/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

type Body = {
  reference: string;
  amountInCents: number;
  currency: "COP";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const reference = String(body.reference || "").trim();
    const amountInCents = Number(body.amountInCents);
    const currency = body.currency === "COP" ? "COP" : "COP";

    if (!reference || !Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    if (!integritySecret) {
      return NextResponse.json({ error: "Missing WOMPI_INTEGRITY_SECRET" }, { status: 500 });
    }

    const raw = `${reference}${amountInCents}${currency}${integritySecret}`;
    const signature = crypto.createHash("sha256").update(raw).digest("hex");

    return NextResponse.json({ signature });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}