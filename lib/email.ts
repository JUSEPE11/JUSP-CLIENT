type SendOtpArgs = {
  to: string;
  code: string;
};

type DigestProduct = {
  slug?: string;
  title: string;
  brand?: string;
  image?: string;
  price?: number;
  expressDelivery?: boolean;
  pickupToday?: boolean;
};

type SendMembershipRequestArgs = {
  email: string;
  plan: "core" | "plus" | "elite";
};

type SendCouponCreatedArgs = {
  to: string;
  code: string;
  title?: string | null;
  description?: string | null;
  discountType?: string | null;
  discountValue?: number | string | null;
  expiresAt?: string | null;
};

function getMembershipPlanLabel(plan: SendMembershipRequestArgs["plan"]) {
  if (plan === "core") return "Core";
  if (plan === "plus") return "Plus";
  return "Elite";
}

async function sendEmail(payload: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "JUSP <no-reply@jusp.com>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      ...payload,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Resend failed: ${res.status} ${txt}`);
  }
}

export async function sendOtpEmail({ to, code }: SendOtpArgs) {
  const subject = "Tu codigo de verificacion JUSP";
  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.4; color:#111">
    <h2 style="margin:0 0 12px 0">Verifica tu correo</h2>
    <p style="margin:0 0 12px 0">Tu codigo es:</p>
    <div style="display:inline-block; padding:14px 18px; border-radius:14px; background:#111; color:#fff; font-weight:800; letter-spacing:0.22em; font-size:22px">${code}</div>
    <p style="margin:14px 0 0 0; color:#555; font-size:12px">Este codigo expira en 10 minutos. Si no fuiste tu, ignora este mensaje.</p>
  </div>`;

  await sendEmail({
    to: [to],
    subject,
    html,
  });
}

export async function sendMembershipRequestEmail({
  email,
  plan,
}: SendMembershipRequestArgs) {
  const to = process.env.MEMBERSHIP_REQUEST_TO || "DIRECTOR@JUSPCO.COM";
  const planLabel = getMembershipPlanLabel(plan);
  const subject = `JUSP Membership - Solicitud ${planLabel}`;

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5; color:#111">
    <h2 style="margin:0 0 12px 0">Nueva solicitud de Membership</h2>
    <p style="margin:0 0 10px 0"><strong>Plan:</strong> ${planLabel}</p>
    <p style="margin:0 0 10px 0"><strong>Correo:</strong> ${email}</p>
    <p style="margin:16px 0 0 0; color:#555; font-size:12px">
      Solicitud enviada automaticamente desde /membership.
    </p>
  </div>`;

  const text = [
    "Nueva solicitud de Membership",
    "",
    `Plan: ${planLabel}`,
    `Correo: ${email}`,
    "",
    "Solicitud enviada automaticamente desde /membership.",
  ].join("\n");

  await sendEmail({
    to: [to],
    reply_to: email,
    subject,
    html,
    text,
  });
}

function productHref(slug?: string) {
  const safeSlug = String(slug || "").trim();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.juspco.com";
  if (!safeSlug) return `${origin}/products`;
  return `${origin}/product/${encodeURIComponent(safeSlug)}`;
}

function assetHref(src?: string) {
  const safeSrc = String(src || "").trim();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.juspco.com";
  if (!safeSrc) return "";
  if (/^https?:\/\//i.test(safeSrc)) return safeSrc;
  return `${origin}${safeSrc.startsWith("/") ? safeSrc : `/${safeSrc}`}`;
}

function moneyCOP(value: number) {
  return Math.round(Number(value || 0)).toLocaleString("es-CO");
}

function couponDiscountLabel(type?: string | null, value?: number | string | null) {
  const amount = Number(value || 0);
  if (String(type || "").toLowerCase() === "percentage") return `${amount}% OFF`;
  return `$${moneyCOP(amount)} OFF`;
}

function formatCouponDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "Sin fecha de vencimiento";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function sendCouponCreatedEmail({
  to,
  code,
  title,
  description,
  discountType,
  discountValue,
  expiresAt,
}: SendCouponCreatedArgs) {
  const safeTo = String(to || "").trim().toLowerCase();
  const safeCode = String(code || "").trim().toUpperCase();
  if (!safeTo || !safeCode) return;

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.juspco.com";
  const discount = couponDiscountLabel(discountType, discountValue);
  const dateLabel = formatCouponDate(expiresAt);
  const subject = `Tienes un nuevo cupon JUSP: ${safeCode}`;

  const html = `
    <div style="margin:0;padding:26px;background:#f3f1ec;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111111">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:collapse">
        <tr>
          <td style="padding:30px;border-radius:30px;background:linear-gradient(135deg,#111111 0%,#1b1b1b 56%,#2c2c2c 100%);color:#ffffff;box-shadow:0 24px 70px rgba(0,0,0,0.18)">
            <div style="font-size:12px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.68)">JUSP BENEFIT</div>
            <div style="margin-top:14px;font-size:38px;line-height:0.98;font-weight:1000;letter-spacing:-0.055em">Nuevo cupon para ti</div>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.76)">
              ${String(title || "Tienes un beneficio disponible").trim()}
            </p>
          </td>
        </tr>
        <tr><td style="height:18px"></td></tr>
        <tr>
          <td style="border-radius:28px;background:#ffffff;border:1px solid rgba(0,0,0,0.08);overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,0.08)">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
              <tr>
                <td style="padding:28px;background:#111111;color:#ffffff">
                  <div style="font-size:11px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.62)">Codigo</div>
                  <div style="margin-top:10px;font-size:40px;line-height:1;font-weight:1000;letter-spacing:0.02em">${safeCode}</div>
                  ${
                    description
                      ? `<p style="margin:14px 0 0;color:rgba(255,255,255,0.74);font-size:14px;line-height:1.7">${String(description).trim()}</p>`
                      : ""
                  }
                </td>
                <td style="width:210px;padding:26px;background:#ffffff;color:#111111">
                  <div style="font-size:28px;line-height:1;font-weight:1000;letter-spacing:-0.04em">${discount}</div>
                  <div style="margin-top:12px;font-size:13px;font-weight:800;color:#555555">Vence: ${dateLabel}</div>
                  <div style="margin-top:18px">
                    <a href="${origin}/checkout" style="display:inline-block;padding:13px 18px;border-radius:999px;background:#111111;color:#ffffff;text-decoration:none;font-weight:1000;font-size:13px">Usar ahora</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 4px 0;color:#666666;font-size:12px;line-height:1.6">
            Este cupon esta asociado a tu cuenta JUSP. Si no solicitaste este beneficio, simplemente ignora este correo.
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "JUSP - Nuevo cupon",
    "",
    `Codigo: ${safeCode}`,
    `Descuento: ${discount}`,
    `Vence: ${dateLabel}`,
    "",
    `${origin}/checkout`,
  ].join("\n");

  await sendEmail({
    to: [safeTo],
    subject,
    html,
    text,
  });
}

export async function sendProductDropDigestEmail({
  to,
  products,
}: {
  to: string[];
  products: DigestProduct[];
}) {
  const recipients = Array.from(
    new Set(
      (to || [])
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (!recipients.length) return;

  const cards = (products || [])
    .slice(0, 8)
    .map((product) => {
      const href = productHref(product.slug);
      const image = assetHref(product.image);
      const badge =
        product.expressDelivery || product.pickupToday ? "Entrega flash" : "Nuevo en JUSP";
      const brand = String(product.brand || "JUSP").trim();
      const price =
        typeof product.price === "number" && Number.isFinite(product.price) && product.price > 0
          ? `$${moneyCOP(product.price)}`
          : "Ver producto";

      return `
        <tr>
          <td style="padding:0 0 16px 0">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:20px;overflow:hidden">
              <tr>
                <td style="padding:18px">
                  <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280">${badge}</div>
                  <div style="margin-top:8px;font-size:22px;line-height:1.08;font-weight:900;color:#111111">${String(product.title || "Producto nuevo")}</div>
                  <div style="margin-top:8px;font-size:13px;font-weight:700;color:#4b5563">${brand}</div>
                  <div style="margin-top:8px;font-size:15px;font-weight:900;color:#111111">${price}</div>
                  <div style="margin-top:16px">
                    <a href="${href}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#111111;color:#ffffff;text-decoration:none;font-weight:900;font-size:13px">Ver en JUSP</a>
                  </div>
                </td>
                ${
                  image
                    ? `<td style="width:180px;padding:12px 18px 12px 0">
                        <img src="${image}" alt="${String(product.title || "Producto")}" style="display:block;width:100%;height:160px;object-fit:contain;background:#f7f7f7;border-radius:16px" />
                      </td>`
                    : ""
                }
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const subject = "Nuevos productos JUSP";
  const html = `
    <div style="margin:0;padding:24px;background:#f3f1ec;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111111">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;margin:0 auto;border-collapse:collapse">
        <tr>
          <td style="padding:28px;border-radius:28px;background:linear-gradient(135deg,#111111 0%,#1f1f1f 48%,#2c2c2c 100%);color:#ffffff">
            <div style="font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.72)">JUSP</div>
            <div style="margin-top:12px;font-size:36px;line-height:1;font-weight:1000;letter-spacing:-0.05em">Nuevos ingresos seleccionados</div>
            <p style="margin:14px 0 0;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.78)">
              Cada 3 dias te enviaremos una seleccion elegante con los productos nuevos que vale la pena ver primero.
            </p>
          </td>
        </tr>
        <tr><td style="height:18px"></td></tr>
        ${cards}
      </table>
    </div>
  `;

  const text = [
    "JUSP - Nuevos productos",
    "",
    "Te compartimos una seleccion de productos nuevos:",
    "",
    ...(products || []).slice(0, 8).map((product) => {
      const brand = String(product.brand || "JUSP").trim();
      return `- ${String(product.title || "Producto nuevo")} | ${brand} | ${productHref(product.slug)}`;
    }),
  ].join("\n");

  await sendEmail({
    to: recipients,
    subject,
    html,
    text,
  });
}
