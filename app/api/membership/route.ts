import { NextRequest, NextResponse } from "next/server";
import { sendMembershipRequestEmail } from "../../../lib/email";

type PlanKey = "core" | "plus" | "elite";

function isValidPlan(value: unknown): value is PlanKey {
  return value === "core" || value === "plus" || value === "elite";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const email =
      body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const plan = body?.plan;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "El correo es obligatorio." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Correo inválido." },
        { status: 400 }
      );
    }

    if (!isValidPlan(plan)) {
      return NextResponse.json(
        { ok: false, error: "Plan inválido." },
        { status: 400 }
      );
    }

    await sendMembershipRequestEmail({
      email,
      plan,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Solicitud enviada correctamente.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo procesar la solicitud.";

    return NextResponse.json(
      {
        ok: false,
        error: message || "No se pudo procesar la solicitud.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}