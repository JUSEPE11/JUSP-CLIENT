// src/lib/email.ts
type SendOtpArgs = {
  to: string;
  code: string;
};

export async function sendOtpEmail({ to, code }: SendOtpArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "JUSP <no-reply@jusp.com>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing");
  }

  const subject = "Tu código de verificación JUSP";
  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.4; color:#111">
    <h2 style="margin:0 0 12px 0">Verifica tu correo</h2>
    <p style="margin:0 0 12px 0">Tu código es:</p>
    <div style="display:inline-block; padding:14px 18px; border-radius:14px; background:#111; color:#fff; font-weight:800; letter-spacing:0.22em; font-size:22px">${code}</div>
    <p style="margin:14px 0 0 0; color:#555; font-size:12px">Este código expira en 10 minutos. Si no fuiste tú, ignora este mensaje.</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Resend failed: ${res.status} ${txt}`);
  }
}
