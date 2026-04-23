"use client";

import { FormEvent, useEffect, useState } from "react";

type CouponRow = {
  id?: string | null;
  code?: string | null;
  title?: string | null;
  description?: string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  email?: string | null;
  user_id?: string | null;
};

function moneyCOP(value: number | string | null | undefined) {
  return Math.round(Number(value || 0)).toLocaleString("es-CO");
}

function discountLabel(coupon: CouponRow) {
  if (String(coupon.discount_type || "").toLowerCase() === "percentage") {
    return `${Number(coupon.discount_value || 0)}% OFF`;
  }
  return `$${moneyCOP(coupon.discount_value)} OFF`;
}

function formatDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "Sin vencimiento";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function isExpired(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) && parsed <= Date.now();
}

function statusLabel(coupon: CouponRow) {
  if (coupon.is_active === false) return "Inactivo";
  if (isExpired(coupon.expires_at)) return "Vencido";
  return "Disponible";
}

export default function CouponsDashboardClient() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    email: "",
    user_id: "",
    discount_type: "fixed",
    discount_value: "",
    expires_at: "",
  });

  async function loadCoupons(nextQuery = query) {
    setLoading(true);
    try {
      const qs = nextQuery.trim() ? `?q=${encodeURIComponent(nextQuery.trim())}` : "";
      const res = await fetch(`/api/admin/coupons${qs}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudieron cargar cupones");
      setCoupons(Array.isArray(json.coupons) ? json.coupons : []);
    } catch (error: any) {
      setMessage(error?.message || "No se pudieron cargar cupones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCoupons("");
  }, []);

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo crear el cupon");

      setMessage(json.emailSent ? "Cupon creado y correo enviado." : "Cupon creado. El correo no se pudo enviar.");
      setForm({
        code: "",
        title: "",
        description: "",
        email: "",
        user_id: "",
        discount_type: "fixed",
        discount_value: "",
        expires_at: "",
      });
      await loadCoupons();
    } catch (error: any) {
      setMessage(error?.message || "No se pudo crear el cupon");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(coupon: CouponRow, status: "active" | "used" | "expired" | "deleted") {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: coupon.id,
          code: coupon.code,
          email: coupon.email,
          status,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo actualizar el cupon");
      setMessage(`Cupon marcado como ${status}.`);
      await loadCoupons();
    } catch (error: any) {
      setMessage(error?.message || "No se pudo actualizar el cupon");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="dashPage">
      <aside className="side">
        <div className="brand">JUSP Admin</div>
        <div className="panel">PANEL</div>
        {["Dashboard", "Orders", "Payments", "Metrics", "Shipments", "Usuarios", "Direcciones", "Experiencia", "Cupones", "Facturas"].map((item) => (
          <a key={item} className={item === "Cupones" ? "nav on" : "nav"} href={item === "Cupones" ? "/dashboard/cupones" : "#"}>
            {item}
          </a>
        ))}
      </aside>

      <section className="content">
        <div className="top">
          <div>
            <h1>Cupones</h1>
            <p>Crea beneficios, envia el correo automatico y marca el estado operativo.</p>
          </div>
          <div className="tools">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por codigo o email"
            />
            <button type="button" onClick={() => loadCoupons()} disabled={loading}>
              Buscar
            </button>
          </div>
        </div>

        {message ? <div className="message">{message}</div> : null}

        <div className="grid">
          <form className="card form" onSubmit={createCoupon}>
            <h2>Nuevo cupón</h2>
            <input required value={form.code} onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))} placeholder="Codigo" />
            <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Titulo" />
            <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Descripcion" />
            <input required type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email del cliente" />
            <input value={form.user_id} onChange={(e) => setForm((c) => ({ ...c, user_id: e.target.value }))} placeholder="user_id opcional" />
            <div className="pair">
              <select value={form.discount_type} onChange={(e) => setForm((c) => ({ ...c, discount_type: e.target.value }))}>
                <option value="fixed">Monto fijo</option>
                <option value="percentage">Porcentaje</option>
              </select>
              <input required type="number" min="0" value={form.discount_value} onChange={(e) => setForm((c) => ({ ...c, discount_value: e.target.value }))} placeholder="Valor" />
            </div>
            <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((c) => ({ ...c, expires_at: e.target.value }))} />
            <button className="primary" disabled={saving}>
              {saving ? "Guardando..." : "Crear cupón y enviar correo"}
            </button>
          </form>

          <div className="card list">
            <h2>Cupones activos y cargados</h2>
            {loading ? <p className="muted">Cargando...</p> : null}
            <div className="table">
              <div className="thead">
                <span>Codigo</span>
                <span>Cliente</span>
                <span>Descuento</span>
                <span>Vence</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              {coupons.map((coupon) => (
                <div className="row" key={String(coupon.id || coupon.code)}>
                  <span>
                    <b>{coupon.code}</b>
                    <small>{coupon.title}</small>
                  </span>
                  <span>{coupon.email}</span>
                  <span>{discountLabel(coupon)}</span>
                  <span>{formatDate(coupon.expires_at)}</span>
                  <span>
                    <mark className={statusLabel(coupon).toLowerCase()}>{statusLabel(coupon)}</mark>
                  </span>
                  <span className="actions">
                    <button type="button" onClick={() => updateStatus(coupon, "used")} disabled={saving}>Usado</button>
                    <button type="button" onClick={() => updateStatus(coupon, "expired")} disabled={saving}>Vencido</button>
                    <button type="button" onClick={() => updateStatus(coupon, "deleted")} disabled={saving}>Eliminado</button>
                    <button type="button" onClick={() => updateStatus(coupon, "active")} disabled={saving}>Reactivar</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashPage{min-height:100vh;background:#f4f4f4;color:#050505;display:grid;grid-template-columns:390px 1fr;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial}
        .side{border-right:1px solid #111;background:#fff;padding:30px 18px;display:flex;flex-direction:column;gap:12px}
        .brand{font-size:28px;font-weight:1000;letter-spacing:-.05em}
        .panel{font-weight:900;color:#666;margin-bottom:20px}
        .nav{border:1px solid #111;border-radius:18px;padding:18px 24px;font-weight:850;text-decoration:none}
        .nav.on{background:#000;color:#fff}
        .content{padding:52px 36px}
        .top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-bottom:22px}
        h1{margin:0;font-size:32px;letter-spacing:-.04em}
        h2{margin:0 0 18px;font-size:18px;text-transform:uppercase;letter-spacing:.04em;color:#666}
        p{margin:6px 0 0;font-size:21px;line-height:1.4}
        .tools{display:flex;gap:12px;flex-wrap:wrap}
        input,textarea,select{width:100%;border:1px solid #111;border-radius:14px;background:#fff;padding:16px 18px;font:inherit;font-size:18px}
        textarea{min-height:144px;resize:vertical}
        button{border:1px solid #111;border-radius:12px;background:#fff;padding:14px 18px;font-weight:950;font-size:16px;cursor:pointer}
        button:disabled{opacity:.55;cursor:not-allowed}
        .primary{background:#000;color:#fff;width:100%;border-radius:12px}
        .message{margin-bottom:18px;border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:18px;padding:14px 18px;font-weight:850}
        .grid{display:grid;grid-template-columns:minmax(360px,.42fr) minmax(520px,1fr);gap:24px;align-items:start}
        .card{background:#fff;border:1px solid #111;border-radius:22px;overflow:hidden}
        .form{padding:24px;display:grid;gap:16px}
        .pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .list h2{padding:20px 24px;border-bottom:1px solid #111;margin:0}
        .muted{padding:20px 24px;color:#666;font-size:16px}
        .table{overflow:auto}
        .thead,.row{min-width:980px;display:grid;grid-template-columns:1.1fr 1.4fr .8fr .8fr .7fr 1.9fr;gap:18px;align-items:center;padding:18px 24px;border-bottom:1px solid rgba(0,0,0,.09)}
        .thead{font-weight:1000;color:#666;text-transform:uppercase;font-size:14px}
        .row span{min-width:0;overflow-wrap:anywhere;font-size:16px}
        .row small{display:block;margin-top:8px;color:#666}
        mark{border-radius:999px;padding:7px 10px;font-weight:950;background:#dcfce7;color:#166534}
        mark.vencido,mark.inactivo{background:#fee2e2;color:#991b1b}
        .actions{display:flex;gap:8px;flex-wrap:wrap}
        .actions button{padding:9px 10px;font-size:13px}
        @media(max-width:1100px){.dashPage{grid-template-columns:1fr}.side{display:none}.content{padding:28px 16px}.grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
