import { NextRequest, NextResponse } from "next/server";

type FeedbackType = "bug" | "idea" | "product" | "support";
type Rating = 1 | 2 | 3 | 4 | 5;

function isValidType(value: unknown): value is FeedbackType {
  return value === "bug" || value === "idea" || value === "product" || value === "support";
}

function isValidRating(value: unknown): value is Rating {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isValidEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getTypeLabel(type: FeedbackType) {
  if (type === "bug") return "Bug";
  if (type === "idea") return "Idea";
  if (type === "product") return "Producto";
  return "Soporte";
}

function getRatingLabel(rating: Rating) {
  if (rating === 5) return "Excelente";
  if (rating === 4) return "Muy bien";
  if (rating === 3) return "Bien";
  if (rating === 2) return "Regular";
  return "Mal";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const type = body?.type;
    const rating = body?.rating;
    const message =
      body && typeof body.message === "string" ? body.message.trim() : "";
    const email =
      body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!isValidType(type)) {
      return NextResponse.json(
        { ok: false, error: "Tipo de feedback inválido." },
        { status: 400 }
      );
    }

    if (!isValidRating(rating)) {
      return NextResponse.json(
        { ok: false, error: "Calificación inválida." },
        { status: 400 }
      );
    }

    if (message.length < 12) {
      return NextResponse.json(
        { ok: false, error: "El mensaje debe tener al menos 12 caracteres." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "El email no es válido." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "JUSP <no-reply@jusp.com>";
    const to = process.env.FEEDBACK_TO_EMAIL || "contacto@juspco.com";

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "RESEND_API_KEY missing" },
        { status: 500 }
      );
    }

    const typeLabel = getTypeLabel(type);
    const ratingLabel = getRatingLabel(rating);

    const subject = `JUSP Feedback — ${typeLabel} — ${rating}/5`;

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5; color:#111">
        <h2 style="margin:0 0 12px 0">Nuevo feedback recibido</h2>

        <p style="margin:0 0 8px 0"><strong>Tipo:</strong> ${typeLabel}</p>
        <p style="margin:0 0 8px 0"><strong>Calificación:</strong> ${rating}/5 (${ratingLabel})</p>
        <p style="margin:0 0 8px 0"><strong>Email:</strong> ${email || "No dejó email"}</p>

        <div style="margin:16px 0 0 0; padding:14px; border-radius:14px; background:#f5f5f5; border:1px solid #e5e7eb;">
          <div style="font-weight:800; margin:0 0 8px 0;">Mensaje</div>
          <div style="white-space:pre-wrap;">${message
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</div>
        </div>

        <p style="margin:16px 0 0 0; color:#555; font-size:12px">
          Enviado automáticamente desde /feedback.
        </p>
      </div>
    `;

    const text = [
      "Nuevo feedback recibido",
      "",
      `Tipo: ${typeLabel}`,
      `Calificación: ${rating}/5 (${ratingLabel})`,
      `Email: ${email || "No dejó email"}`,
      "",
      "Mensaje:",
      message,
      "",
      "Enviado automáticamente desde /feedback.",
    ].join("\n");

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email || undefined,
        subject,
        html,
        text,
      }),
    });

    if (!resendRes.ok) {
      const txt = await resendRes.text().catch(() => "");
      throw new Error(`Resend failed: ${resendRes.status} ${txt}`);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Feedback enviado correctamente.",
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
      error instanceof Error ? error.message : "No se pudo enviar el feedback.";

    return NextResponse.json(
      {
        ok: false,
        error: message || "No se pudo enviar el feedback.",
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