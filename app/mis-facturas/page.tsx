import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionPayload = {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
};

type InvoiceRow = {
  id?: string | null;
  order_code?: string | null;
  created_at?: string | null;
  payment_status?: string | null;
  status?: string | null;
  customer_email?: string | null;
  total_cop?: number | null;
  invoice_number?: string | null;
  invoice_note?: string | null;
};

function moneyCOP(value: number) {
  return Math.round(Number(value || 0)).toLocaleString("es-CO");
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isInvoiceVisible(row: InvoiceRow) {
  const payment = String(row?.payment_status || "").trim().toLowerCase();
  const status = String(row?.status || "").trim().toLowerCase();

  if (payment !== "paid" && payment !== "approved") return false;
  if (status === "cancelled" || status === "canceled" || status === "failed") return false;
  return true;
}

export default async function MisFacturasPage() {
  const store = await cookies();
  const token = store.get(COOKIE_AT)?.value;

  if (!token) redirect("/login");

  let decoded: SessionPayload;
  try {
    decoded = await verifyAccessToken(token);
  } catch {
    redirect("/login");
  }

  const userId = String(decoded?.sub || decoded?.userId || decoded?.id || "").trim();
  const email = String(decoded?.email || "").trim().toLowerCase();

  if (!userId && !email) redirect("/login");

  const admin = supabaseAdmin();
  let query = admin.from("orders").select("*").order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("customer_email", email);
  }

  const [ordersResult, logsResult] = await Promise.all([
    query,
    admin
      .from("logs")
      .select("id,order_id,user_email,meta,created_at")
      .eq("scope", "customer_invoice")
      .eq("user_email", email)
      .order("created_at", { ascending: false }),
  ]);

  const orders = Array.isArray(ordersResult.data) ? (ordersResult.data as InvoiceRow[]) : [];
  const invoiceLogs = Array.isArray(logsResult.data) ? logsResult.data : [];
  const invoiceMetaByOrder = new Map<string, { invoice_number?: string | null; invoice_note?: string | null; created_at?: string | null }>();

  for (const row of invoiceLogs) {
    const meta = row?.meta && typeof row.meta === "object" ? row.meta : {};
    const orderId = String(row?.order_id || meta?.order_id || "").trim();
    if (!orderId || invoiceMetaByOrder.has(orderId)) continue;
    invoiceMetaByOrder.set(orderId, {
      invoice_number: String(meta?.invoice_number || "").trim() || null,
      invoice_note: String(meta?.note || "").trim() || null,
      created_at: String(meta?.issued_at || row?.created_at || "").trim() || null,
    });
  }

  const invoices = orders
    .filter(isInvoiceVisible)
    .map((row) => ({
      ...row,
      ...(invoiceMetaByOrder.get(String(row.id || "").trim()) || {}),
    }));

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "calc(var(--jusp-header-h, 64px) + 28px) 16px 72px",
        background: "#f6f6f3",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 1000,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.52)",
              }}
            >
              Mi cuenta
            </div>
            <h1 style={{ margin: "10px 0 0", fontSize: 38, lineHeight: 1, fontWeight: 1000 }}>
              Mis facturas
            </h1>
            <p style={{ marginTop: 12, maxWidth: 640, fontSize: 15, lineHeight: 1.7, color: "rgba(0,0,0,0.66)" }}>
              Aquí puedes revisar las compras pagadas y su resumen para consulta rápida.
            </p>
          </div>

          <Link
            href="/account"
            style={{
              alignSelf: "start",
              textDecoration: "none",
              color: "#111",
              fontWeight: 900,
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.10)",
              padding: "12px 18px",
              background: "#fff",
            }}
          >
            Volver a mi cuenta
          </Link>
        </div>

        <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
          {invoices.length ? (
            invoices.map((invoice) => (
              <article
                key={String(invoice?.id || invoice?.order_code)}
                style={{
                  borderRadius: 24,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  padding: 20,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.4fr) minmax(200px, 0.8fr) minmax(160px, 0.7fr)",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,0,0,0.48)" }}>
                      Factura
                    </div>
                    <div style={{ marginTop: 8, fontSize: 22, fontWeight: 1000 }}>
                      #{String(invoice?.invoice_number || invoice?.order_code || invoice?.id || "").trim()}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14, color: "rgba(0,0,0,0.62)" }}>
                      Emitida el {formatDate(String(invoice?.created_at || ""))}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14, color: "rgba(0,0,0,0.62)" }}>
                      Correo: {String(invoice?.customer_email || email || "No disponible")}
                    </div>
                    {invoice?.invoice_note ? (
                      <div style={{ marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.66)" }}>
                        {String(invoice.invoice_note)}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,0,0,0.48)" }}>
                      Total
                    </div>
                    <div style={{ marginTop: 8, fontSize: 28, fontWeight: 1000 }}>
                      ${moneyCOP(Number(invoice?.total_cop || 0))}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "#166534" }}>
                      Pago confirmado
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <Link
                      href={`/mis-pedidos/${encodeURIComponent(String(invoice?.id || ""))}`}
                      style={{
                        textDecoration: "none",
                        textAlign: "center",
                        borderRadius: 999,
                        background: "#111",
                        color: "#fff",
                        padding: "12px 16px",
                        fontSize: 14,
                        fontWeight: 1000,
                      }}
                    >
                      Ver detalle
                    </Link>
                    <Link
                      href="/mis-pedidos"
                      style={{
                        textDecoration: "none",
                        textAlign: "center",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "#fff",
                        color: "#111",
                        padding: "12px 16px",
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      Ver pedidos
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div
              style={{
                borderRadius: 24,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                padding: 24,
                boxShadow: "0 16px 40px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 1000 }}>Todavía no tienes facturas disponibles.</div>
              <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "rgba(0,0,0,0.66)" }}>
                Las facturas aparecerán aquí cuando tengas compras con pago confirmado.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
