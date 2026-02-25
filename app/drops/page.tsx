// app/drops/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Drops | JUSP",
  description: "Drops exclusivos (stock limitado). Accesos por fases. Sin humo.",
};

type Drop = {
  tag: string;
  title: string;
  desc: string;
  badge?: "Nuevo" | "Limitado" | "Exclusivo";
  bullets: string[];
};

const DROPS: Drop[] = [
  {
    tag: "DROP 01",
    title: "Drops exclusivos (stock limitado)",
    desc: "Accesos por fases. Productos seleccionados. Operación controlada para cumplir perfecto.",
    badge: "Limitado",
    bullets: ["Cupos reales", "Selección curada", "Sin promesas vacías"],
  },
  {
    tag: "DROP 02",
    title: "Early Access primero",
    desc: "Los miembros entran antes. Tú decides si esperas o te adelantas a los cupos.",
    badge: "Exclusivo",
    bullets: ["Prioridad en cola", "Soporte humano", "Más velocidad operativa"],
  },
  {
    tag: "DROP 03",
    title: "Curaduría JUSP",
    desc: "No catálogo infinito: calidad. Enfoque en lo más top para comprar con confianza.",
    badge: "Nuevo",
    bullets: ["Menos ruido", "Más calidad", "Mejor trazabilidad"],
  },
];

const FAQS = [
  {
    q: "¿Qué es un Drop en JUSP?",
    a: "Una selección limitada que abrimos por fases. No es “oferta vacía”: es cupo real para operar con calidad.",
  },
  {
    q: "¿Cómo entro a un Drop?",
    a: "Con Early Access cuando esté activo. Si no, explora productos y te avisamos cuando abramos cupos.",
  },
  {
    q: "¿Por qué los Drops tienen cupos?",
    a: "Porque la operación es internacional y preferimos cumplir perfecto antes que prometer de más.",
  },
  {
    q: "¿JUSP vende directo?",
    a: "No. JUSP gestiona la compra internacional como intermediario/gestor. Tienes claridad, trazabilidad y soporte humano.",
  },
];

function TonePill({
  tone,
  children,
}: {
  tone: "gold" | "blue" | "neutral";
  children: ReactNode;
}) {
  const cls =
    tone === "gold" ? "pill pillGold" : tone === "blue" ? "pill pillBlue" : "pill";
  return <span className={cls}>{children}</span>;
}

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

export default function DropsPage() {
  return (
    <main className="dropsRoot">
      <style>{`
        /* =========================================
           JUSP /drops — NIVEL DIOS PRO MAX REAL
           - NO toca global.css
           - NO bloquea scroll (para que el footer SIEMPRE aparezca al final)
           ========================================= */

        .dropsRoot{
          --bg:#0b0b0f;
          --glass: rgba(255,255,255,0.06);
          --glass2: rgba(255,255,255,0.045);
          --stroke: rgba(255,255,255,0.12);
          --muted: rgba(255,255,255,0.70);
          --muted2: rgba(255,255,255,0.56);
          --muted3: rgba(255,255,255,0.44);
          --gold:#facc15;
          --ease: cubic-bezier(.2,.8,.2,1);

          position: relative;
          color: #fff;
          background: var(--bg);
          /* 👇 clave: NO overflow hidden acá */
          min-height: auto;
          isolation: isolate;
        }

        /* Fondo cinematográfico: fixed detrás, pero sin tapar footer */
        .bg{
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: var(--bg);
        }
        .bg::before{
          content:"";
          position:absolute; inset:0;
          background:
            radial-gradient(980px 520px at 14% 18%, rgba(250,204,21,0.32), transparent 60%),
            radial-gradient(860px 520px at 88% 16%, rgba(255,255,255,0.10), transparent 58%),
            radial-gradient(980px 760px at 92% 92%, rgba(59,130,246,0.12), transparent 62%),
            linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(11,11,15,1) 55%, rgba(11,11,15,1) 100%);
          opacity: 0.98;
        }
        .bg::after{
          content:"";
          position:absolute; inset:0;
          opacity: 0.10;
          mix-blend-mode: overlay;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 240px 240px;
        }
        .vignette{
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events:none;
          background: radial-gradient(1200px 720px at 50% 32%, transparent 26%, rgba(0,0,0,0.88) 88%);
        }

        .wrap{
          width: min(1120px, calc(100% - 48px));
          margin: 0 auto;
          padding: 44px 0 74px;
        }

        /* Topbar */
        .topbar{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .brandPill{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 18px 70px rgba(0,0,0,0.45);
        }
        .dot{
          width: 8px; height: 8px;
          border-radius: 999px;
          background: var(--gold);
          box-shadow: 0 0 0 4px rgba(250,204,21,0.12), 0 0 18px rgba(250,204,21,0.55);
        }
        .brandText{
          font-size: 12px;
          font-weight: 980;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.78);
        }
        .actions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }
        .btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          height: 40px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.16);
          text-decoration:none;
          font-weight: 950;
          font-size: 12px;
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: transform 140ms var(--ease), background 140ms var(--ease);
          white-space: nowrap;
        }
        .btn:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.09); }
        .btnWhite{
          background: #fff;
          color: #000;
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 20px 70px rgba(255,255,255,0.12);
        }

        /* Hero */
        .hero{
          margin-top: 44px;
        }
        .pillRow{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }
        .pill{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .pillGold{
          border-color: rgba(250,204,21,0.22);
          background: rgba(250,204,21,0.10);
          color: rgba(255,245,210,0.92);
        }
        .pillBlue{
          border-color: rgba(147,197,253,0.22);
          background: rgba(59,130,246,0.10);
          color: rgba(219,234,254,0.92);
        }

        .kicker{
          margin-top: 18px;
          font-size: 12px;
          letter-spacing: 0.28em;
          font-weight: 980;
          color: rgba(255,255,255,0.56);
        }
        .h1{
          margin: 14px 0 0;
          font-size: 72px;
          line-height: 1.02;
          letter-spacing: -0.05em;
          font-weight: 990;
          text-shadow: 0 18px 80px rgba(0,0,0,0.62);
        }
        .lead{
          margin: 16px 0 0;
          max-width: 880px;
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255,255,255,0.74);
          font-weight: 780;
        }
        .ctaRow{
          margin-top: 18px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ctaPrimary{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          height: 46px;
          padding: 0 16px;
          border-radius: 18px;
          border: 0;
          background: #fff;
          color: #000;
          font-weight: 990;
          text-decoration:none;
          box-shadow: 0 26px 92px rgba(255,255,255,0.14);
          transition: transform 140ms var(--ease), filter 140ms var(--ease);
          white-space: nowrap;
        }
        .ctaPrimary:hover{ transform: translateY(-1px); filter: brightness(0.96); }
        .ctaSecondary{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          height: 46px;
          padding: 0 16px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.94);
          font-weight: 980;
          text-decoration:none;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          white-space: nowrap;
        }

        /* Panel principal */
        .panel{
          margin-top: 22px;
          border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(15,15,21,0.62);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 40px 140px rgba(0,0,0,0.72);
          overflow: hidden;
        }
        .panelHead{
          padding: 22px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
          background:
            linear-gradient(90deg, rgba(250,204,21,0.12), rgba(255,255,255,0.06), rgba(59,130,246,0.08));
          display:flex;
          align-items:flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .panelK{
          font-size: 12px;
          letter-spacing: 0.08em;
          font-weight: 950;
          color: rgba(255,255,255,0.62);
        }
        .panelT{
          margin-top: 6px;
          font-size: 24px;
          font-weight: 990;
          letter-spacing: -0.02em;
        }
        .panelBody{
          padding: 22px;
        }

        /* Grid drops */
        .grid3{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .card{
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.34);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 26px 90px rgba(0,0,0,0.58);
          padding: 18px;
          position: relative;
          overflow: hidden;
        }
        .card::before{
          content:"";
          position:absolute;
          inset:-1px;
          border-radius: 24px;
          padding:1px;
          background: radial-gradient(740px 240px at 12% 10%,
            rgba(250,204,21,0.30),
            rgba(255,255,255,0.10) 26%,
            transparent 60%);
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.85;
          pointer-events:none;
        }
        .cardTop{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tag{
          font-size: 12px;
          letter-spacing: 0.18em;
          font-weight: 950;
          color: rgba(255,255,255,0.58);
        }
        .badge{
          display:inline-flex;
          align-items:center;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 980;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          white-space: nowrap;
        }
        .cardTitle{
          margin-top: 12px;
          font-size: 18px;
          font-weight: 990;
          letter-spacing: -0.02em;
        }
        .cardDesc{
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.7;
          color: rgba(255,255,255,0.66);
          font-weight: 780;
        }
        .divider{
          margin-top: 14px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent);
        }
        .bullets{
          margin-top: 12px;
          display:flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mini{
          font-size: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.74);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        /* FAQ */
        .faq{
          margin-top: 14px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.26);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 26px 90px rgba(0,0,0,0.58);
          padding: 18px;
        }
        .faqTop{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .faqTitle{
          font-size: 18px;
          font-weight: 990;
          letter-spacing: -0.02em;
        }
        .faqGrid{
          margin-top: 14px;
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .faqItem{
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.05);
          padding: 14px;
        }
        .faqQ{
          font-size: 14px;
          font-weight: 950;
          color: rgba(255,255,255,0.92);
        }
        .faqA{
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255,255,255,0.66);
          font-weight: 780;
        }
        .faqActions{
          margin-top: 14px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .note{
          margin-top: 14px;
          font-size: 12px;
          line-height: 1.6;
          color: rgba(255,255,255,0.46);
        }

        /* Responsive */
        @media (max-width: 980px){
          .wrap{ width: min(1120px, calc(100% - 32px)); }
          .grid3{ grid-template-columns: 1fr; }
          .faqGrid{ grid-template-columns: 1fr; }
          .h1{ font-size: 44px; }
        }
        @media (max-width: 520px){
          .wrap{ width: calc(100% - 28px); padding: 36px 0 64px; }
          .h1{ font-size: 38px; }
          .btn{ height: 42px; }
        }

        @media (prefers-reduced-motion: reduce){
          .btn, .ctaPrimary{ transition: none !important; }
        }
      `}</style>

      <div className="bg" aria-hidden />
      <div className="vignette" aria-hidden />

      <div className="wrap">
        {/* Top micro-nav */}
        <div className="topbar">
          <div className="brandPill">
            <span className="dot" aria-hidden="true" />
            <span className="brandText">JUSP · Drops</span>
          </div>

          <div className="actions">
            <Link href="/products" className="btn btnWhite">
              Ver productos
            </Link>
            <Link href="/early-access" className="btn">
              Early Access →
            </Link>
            <Link href="/help" className="btn">
              Volver
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section className="hero">
          <div className="pillRow">
            <TonePill tone="gold">Stock limitado</TonePill>
            <TonePill tone="neutral">Acceso por fases</TonePill>
            <TonePill tone="blue">Soporte humano</TonePill>
          </div>

          <div className="kicker">DROPS</div>

          <h1 className="h1">Drops exclusivos</h1>

          <p className="lead">
            No hacemos “catálogo infinito”. Abrimos cupos reales para operar bien: trazabilidad,
            comunicación clara y entrega sin vueltas.
          </p>

          <div className="ctaRow">
            <Link href="/early-access" className="ctaPrimary">
              Pedir Early Access
            </Link>
            <Link href="/products" className="ctaSecondary">
              Explorar productos →
            </Link>
          </div>
        </section>

        {/* PANEL PRINCIPAL */}
        <section className="panel" aria-label="Drops">
          <div className="panelHead">
            <div>
              <div className="panelK">Cómo funciona</div>
              <div className="panelT">Drops con control real</div>
            </div>
            <TonePill tone="gold">Sin humo</TonePill>
          </div>

          <div className="panelBody">
            {/* Cards */}
            <div className="grid3">
              {DROPS.map((d) => (
                <div key={d.tag} className="card">
                  <div className="cardTop">
                    <div className="tag">{d.tag}</div>
                    {d.badge ? <Badge label={d.badge} /> : null}
                  </div>

                  <div className="cardTitle">{d.title}</div>
                  <div className="cardDesc">{d.desc}</div>

                  <div className="divider" />

                  <div className="bullets">
                    {d.bullets.map((b) => (
                      <span key={`${d.tag}-${b}`} className="mini">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="faq" aria-label="Preguntas rápidas">
              <div className="faqTop">
                <div className="faqTitle">Preguntas rápidas</div>
                <TonePill tone="gold">Claro y directo</TonePill>
              </div>

              <div className="faqGrid">
                {FAQS.map((f) => (
                  <div key={f.q} className="faqItem">
                    <div className="faqQ">{f.q}</div>
                    <div className="faqA">{f.a}</div>
                  </div>
                ))}
              </div>

              <div className="faqActions">
                <Link href="/early-access" className="btn btnWhite">
                  Early Access →
                </Link>
                <Link href="/products" className="btn">
                  Ver productos
                </Link>
                <Link href="/terms" className="btn">
                  Ver términos →
                </Link>
              </div>

              <p className="note">
                Nota: JUSP gestiona la compra internacional como intermediario. Consulta términos para el detalle legal.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}