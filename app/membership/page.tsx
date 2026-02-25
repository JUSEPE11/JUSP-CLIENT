// app/membership/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type PlanKey = "core" | "plus" | "elite";

export default function MembershipPage() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [plan, setPlan] = useState<PlanKey>("plus");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) return;

    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const x = (e.clientX / w - 0.5) * 2;
      const y = (e.clientY / h - 0.5) * 2;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", String(x));
        el.style.setProperty("--my", String(y));
      });
    };

    const onScroll = () => {
      const s = window.scrollY || 0;
      el.style.setProperty("--sy", String(Math.min(1, s / 700)));
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const copy = useMemo(() => {
    const map: Record<PlanKey, { tag: string; title: string; desc: string }> = {
      core: {
        tag: "Base",
        title: "Acceso",
        desc: "Lo esencial para explorar referencias y comprar con trazabilidad.",
      },
      plus: {
        tag: "Recomendado",
        title: "Plus",
        desc: "Prioridad, soporte humano y gestión más rápida por operación.",
      },
      elite: {
        tag: "Pro",
        title: "Elite",
        desc: "Tratamiento premium: seguimiento y coordinación de punta a punta.",
      },
    };
    return map[plan];
  }, [plan]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <main ref={rootRef as any} className="juspMemRoot">
      <style>{`
        /* ===========================
           JUSP /membership — NIVEL DIOS PRO MAX REAL (ORGANIZADO)
           - NO toca global.css
           - NO cambia layout/header (header blanco visible)
           - Estructura limpia: HERO (1 col) + GRID (3 cards)
           =========================== */

        .juspMemRoot{
          --gold:#F5C030;
          --bg:#070709;
          --muted: rgba(255,255,255,0.62);
          --muted2: rgba(255,255,255,0.46);
          --border: rgba(255,255,255,0.12);
          --card: rgba(255,255,255,0.045);
          --ease: cubic-bezier(.2,.8,.2,1);

          --mx: 0;
          --my: 0;
          --sy: 0;

          min-height: 100vh;
          background: var(--bg);
          color: #fff;
          position: relative;
          overflow: hidden;
          isolation: isolate;

          /* deja espacio fijo para header blanco */
          padding-top: 72px;
        }

        /* Background cinematic */
        .bgLayer{ position:absolute; inset:0; z-index:0; pointer-events:none; }
        .bgBase{ position:absolute; inset:0; background: var(--bg); }

        .bgGlowLeft{
          position:absolute;
          left:-32%;
          top:-40%;
          width: 1300px;
          height: 1300px;
          border-radius: 9999px;
          filter: blur(78px);
          opacity: 0.92;
          background: radial-gradient(circle at 30% 30%,
            rgba(245,192,48,0.70),
            rgba(245,192,48,0.22) 34%,
            transparent 70%);
          transform: translate3d(calc(var(--mx) * -18px), calc(var(--my) * -14px), 0)
                     scale(calc(1 + (var(--sy) * 0.02)));
          animation: glowFloat 9.5s var(--ease) infinite alternate;
          will-change: transform, opacity;
        }

        .bgGlowRight{
          position:absolute;
          right:-34%;
          top:-30%;
          width: 1200px;
          height: 1200px;
          border-radius: 9999px;
          filter: blur(90px);
          opacity: 0.62;
          background: radial-gradient(circle at 65% 35%,
            rgba(255,255,255,0.14),
            rgba(255,255,255,0.05) 30%,
            transparent 72%);
          transform: translate3d(calc(var(--mx) * 14px), calc(var(--my) * -10px), 0);
          animation: glowFloat2 12.5s var(--ease) infinite alternate;
          will-change: transform, opacity;
        }

        .bgGradient{
          position:absolute; inset:0;
          opacity: 0.98;
          background:
            radial-gradient(1200px 680px at 12% 22%, rgba(245,192,48,0.22), transparent 62%),
            radial-gradient(980px 540px at 85% 12%, rgba(255,255,255,0.10), transparent 56%),
            linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(7,7,9,1) 56%, rgba(7,7,9,1) 100%);
          transform: translate3d(0, calc(var(--sy) * -6px), 0);
          will-change: transform;
        }

        .bgSheen{
          position:absolute;
          inset:-30% -20%;
          opacity: 0.22;
          background: linear-gradient(115deg,
            transparent 0%,
            rgba(255,255,255,0.09) 35%,
            transparent 62%);
          transform: translate3d(calc(var(--mx) * 22px), calc(var(--my) * 10px), 0) rotate(-7deg);
          mix-blend-mode: screen;
          will-change: transform;
        }

        .bgGrain{
          position:absolute; inset:0;
          opacity: 0.10;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 240px 240px;
          mix-blend-mode: overlay;
          transform: translate3d(calc(var(--mx) * -6px), calc(var(--my) * 4px), 0);
          will-change: transform;
        }

        .bgVignette{
          position:absolute; inset:0;
          background: radial-gradient(1200px 760px at 48% 34%, transparent 26%, rgba(0,0,0,0.86) 88%);
        }

        @keyframes glowFloat{
          0% { opacity: 0.76; filter: blur(74px); }
          100% { opacity: 0.94; filter: blur(84px); }
        }
        @keyframes glowFloat2{
          0% { opacity: 0.52; filter: blur(84px); }
          100% { opacity: 0.72; filter: blur(94px); }
        }

        .wrap{
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 24px 110px;
        }

        .topPill{
          display:inline-flex;
          align-items:center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }
        .dot{
          width: 8px; height: 8px; border-radius: 999px;
          background: var(--gold);
          box-shadow: 0 0 0 4px rgba(245,192,48,0.10);
        }
        .pillText{
          font-size: 12px;
          font-weight: 980;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.86);
        }

        .hero{
          margin-top: 22px;
          display:grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .kicker{
          font-size: 11px;
          font-weight: 980;
          letter-spacing: 0.34em;
          color: rgba(255,255,255,0.34);
          margin: 0 0 10px;
        }

        .h1{
          margin: 0;
          font-size: 62px;
          line-height: 0.95;
          letter-spacing: -0.04em;
          font-weight: 990;
          text-shadow: 0 22px 70px rgba(0,0,0,0.62);
        }
        .h1Muted{ color: rgba(255,255,255,0.52); font-weight: 940; }

        .sub{
          margin: 14px 0 0;
          max-width: 820px;
          font-size: 16px;
          line-height: 1.65;
          color: rgba(255,255,255,0.62);
          font-weight: 780;
        }

        .chipRow{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .chip{
          display:inline-flex;
          align-items:center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.78);
          font-size: 12px;
          font-weight: 920;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .chipDot{
          width: 7px; height: 7px; border-radius: 999px;
          background: rgba(245,192,48,0.9);
          box-shadow: 0 0 0 4px rgba(245,192,48,0.12);
        }

        /* GRID PRINCIPAL (organizado) */
        .mainGrid{
          margin-top: 18px;
          display:grid;
          grid-template-columns: 1.1fr 0.95fr 0.95fr;
          gap: 14px;
          align-items: start;
        }

        .card{
          position: relative;
          border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.045);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 36px 120px rgba(0,0,0,0.70);
          padding: 22px;
          overflow: hidden;
        }

        .card::before{
          content:"";
          position:absolute;
          inset: -1px;
          border-radius: 28px;
          padding: 1px;
          background: radial-gradient(780px 260px at 12% 12%,
            rgba(245,192,48,0.34),
            rgba(255,255,255,0.11) 26%,
            transparent 60%);
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.90;
          pointer-events: none;
        }

        .cardHead{
          display:flex;
          align-items:flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .cardTitle{
          margin: 0;
          font-size: 18px;
          font-weight: 990;
          letter-spacing: -0.02em;
        }
        .badge{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 9px 12px;
          border-radius: 999px;
          border: 1px solid rgba(245,192,48,0.25);
          background: rgba(245,192,48,0.10);
          color: var(--gold);
          font-size: 12px;
          font-weight: 990;
          white-space: nowrap;
        }

        .muted{
          margin: 10px 0 0;
          font-size: 13px;
          font-weight: 780;
          line-height: 1.6;
          color: rgba(255,255,255,0.56);
        }

        /* PLAN (selección PRO y sin “azules raros”) */
        .planStack{
          margin-top: 14px;
          display:grid;
          gap: 10px;
        }

        .planBtn{
          width: 100%;
          text-align:left;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.18);
          padding: 14px 14px;
          cursor: pointer;
          transition: transform 140ms var(--ease), background 140ms var(--ease), border-color 140ms var(--ease), box-shadow 140ms var(--ease), filter 140ms var(--ease);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          outline: none;
          position: relative;
          overflow: hidden;
        }
        .planBtn:hover{
          transform: translateY(-1px);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
        }

        .planBtnActive{
          border-color: rgba(245,192,48,0.48);
          background: rgba(245,192,48,0.10);
          box-shadow:
            0 22px 90px rgba(245,192,48,0.10),
            0 0 0 3px rgba(245,192,48,0.08) inset;
        }
        .planBtnActive::before{
          content:"";
          position:absolute;
          inset:-1px;
          border-radius: 18px;
          background: radial-gradient(520px 220px at 20% 10%, rgba(245,192,48,0.22), transparent 60%);
          opacity: 0.95;
          pointer-events:none;
        }
        .planBtnActive::after{
          content:"✓";
          position:absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size: 14px;
          font-weight: 990;
          color: #000;
          background: rgba(245,192,48,0.92);
          box-shadow: 0 14px 40px rgba(245,192,48,0.16);
          pointer-events:none;
        }

        .planTop{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
        }
        .planName{
          font-weight: 990;
          font-size: 14px;
          letter-spacing: -0.01em;
          color: rgba(255,255,255,0.92);
        }
        .planTag{
          font-weight: 980;
          font-size: 11px;
          color: rgba(245,192,48,0.92);
          border: 1px solid rgba(245,192,48,0.22);
          background: rgba(245,192,48,0.08);
          padding: 7px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .planDesc{
          margin-top: 8px;
          font-weight: 800;
          font-size: 12px;
          color: rgba(255,255,255,0.52);
          line-height: 1.35;
          max-width: 46ch;
        }

        .ctaBox{
          margin-top: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          padding: 14px;
          display:grid;
          gap: 12px;
        }

        .fieldRow{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }

        .input{
          flex: 1;
          min-width: 240px;
          height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(0,0,0,0.22);
          color: rgba(255,255,255,0.92);
          padding: 0 14px;
          font-weight: 850;
          outline: none;
          transition: border-color 140ms var(--ease), background 140ms var(--ease);
        }
        .input::placeholder{ color: rgba(255,255,255,0.36); font-weight: 850; }
        .input:focus{
          border-color: rgba(245,192,48,0.45);
          background: rgba(255,255,255,0.06);
        }

        .btnPrimary{
          position: relative;
          height: 54px;
          padding: 0 18px;
          border-radius: 16px;
          border: 0;
          background: #fff;
          color: #000;
          font-size: 13px;
          font-weight: 990;
          cursor: pointer;
          box-shadow: 0 18px 60px rgba(255,255,255,0.16);
          transition: transform 140ms var(--ease), background 140ms var(--ease), box-shadow 140ms var(--ease), filter 140ms var(--ease);
          overflow: hidden;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          white-space: nowrap;
          text-decoration: none;
        }
        .btnPrimary:hover{
          transform: translateY(-1px);
          background: rgba(255,255,255,0.92);
          box-shadow: 0 26px 92px rgba(255,255,255,0.14);
        }
        .btnPrimary:active{
          transform: translateY(0px) scale(0.99);
          filter: brightness(0.98);
        }

        .btnGhost{
          height: 54px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.82);
          font-size: 13px;
          font-weight: 990;
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: background 140ms var(--ease), color 140ms var(--ease), transform 140ms var(--ease);
          text-decoration: none;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          white-space: nowrap;
        }
        .btnGhost:hover{
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.94);
          transform: translateY(-1px);
        }
        .btnGhost:active{ transform: translateY(0px) scale(0.99); }

        .list{
          margin-top: 12px;
          display:grid;
          gap: 10px;
        }
        .row{
          display:flex;
          align-items:flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.18);
        }
        .rowLeft{ display:grid; gap: 2px; min-width: 0; }
        .rowTitle{
          font-weight: 950;
          font-size: 13px;
          color: rgba(255,255,255,0.90);
          letter-spacing: -0.01em;
        }
        .rowSub{
          font-weight: 800;
          font-size: 12px;
          color: rgba(255,255,255,0.52);
          line-height: 1.35;
        }
        .rowTag{
          font-weight: 980;
          font-size: 12px;
          color: rgba(245,192,48,0.92);
          border: 1px solid rgba(245,192,48,0.22);
          background: rgba(245,192,48,0.08);
          padding: 8px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Responsive */
        @media (max-width: 1100px){
          .mainGrid{ grid-template-columns: 1fr 1fr; }
          .span2{ grid-column: 1 / -1; }
        }
        @media (max-width: 980px){
          .h1{ font-size: 48px; }
          .mainGrid{ grid-template-columns: 1fr; }
          .span2{ grid-column: auto; }
        }
        @media (max-width: 520px){
          .wrap{ padding: 26px 16px 104px; }
          .h1{ font-size: 40px; }
          .input{ min-width: 0; width: 100%; }
        }

        @media (prefers-reduced-motion: reduce){
          .bgGlowLeft, .bgGlowRight{ animation: none !important; }
          .btnPrimary, .btnGhost, .planBtn{ transition: none !important; }
        }
      `}</style>

      <div className="bgLayer">
        <div className="bgBase" />
        <div className="bgGlowLeft" />
        <div className="bgGlowRight" />
        <div className="bgGradient" />
        <div className="bgSheen" />
        <div className="bgGrain" />
        <div className="bgVignette" />
      </div>

      <div className="wrap">
        <div className="topPill">
          <span className="dot" />
          <span className="pillText">JUSP · Membership</span>
        </div>

        {/* HERO limpio (ya no se mezcla con los cards) */}
        <section className="hero">
          <div>
            <p className="kicker">MEMBERSHIP</p>
            <h1 className="h1">
              Acceso premium
              <br />
              <span className="h1Muted"></span>
            </h1>

            <p className="sub">
              En JUSP la operación es controlada para mantener calidad y soporte humano. Elige un nivel y deja tu correo
              para habilitarte por fases.
            </p>

            <div className="chipRow">
              <span className="chip">
                <span className="chipDot" /> Transparencia
              </span>
              <span className="chip">
                <span className="chipDot" /> Trazabilidad real
              </span>
              <span className="chip">
                <span className="chipDot" /> Soporte humano
              </span>
            </div>
          </div>

          {/* GRID ORGANIZADO (3 cards) */}
          <div className="mainGrid">
            {/* 1) Plan selector (más ancho en desktop, ultra claro lo seleccionado) */}
            <div className="card span2">
              <div className="cardHead">
                <h2 className="cardTitle">Elige tu nivel</h2>
                <span className="badge">{copy.tag}</span>
              </div>

              <p className="muted">{copy.desc}</p>

              <div className="planStack" aria-label="Selecciona tu plan">
                <button
                  type="button"
                  className={`planBtn ${plan === "core" ? "planBtnActive" : ""}`}
                  onClick={() => setPlan("core")}
                  aria-pressed={plan === "core"}
                >
                  <div className="planTop">
                    <div className="planName">Core</div>
                    <div className="planTag">Base</div>
                  </div>
                  <div className="planDesc">Explora referencias + flujo estándar. Ideal para empezar sin fricción.</div>
                </button>

                <button
                  type="button"
                  className={`planBtn ${plan === "plus" ? "planBtnActive" : ""}`}
                  onClick={() => setPlan("plus")}
                  aria-pressed={plan === "plus"}
                >
                  <div className="planTop">
                    <div className="planName">Plus</div>
                    <div className="planTag">Recomendado</div>
                  </div>
                  <div className="planDesc">Prioridad + soporte humano. Mejor balance para operar rápido.</div>
                </button>

                <button
                  type="button"
                  className={`planBtn ${plan === "elite" ? "planBtnActive" : ""}`}
                  onClick={() => setPlan("elite")}
                  aria-pressed={plan === "elite"}
                >
                  <div className="planTop">
                    <div className="planName">Elite</div>
                    <div className="planTag">Pro</div>
                  </div>
                  <div className="planDesc">Gestión premium de punta a punta. Para ejecución sin pérdida de tiempo.</div>
                </button>
              </div>

              <form className="ctaBox" onSubmit={onSubmit}>
                <div className="fieldRow">
                  <input
                    className="input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (sent) setSent(false);
                    }}
                    autoComplete="email"
                  />
                  <button className="btnPrimary" type="submit">
                    {sent ? "Listo ✓" : "Solicitar acceso →"}
                  </button>
                </div>

                <div className="muted" style={{ margin: 0 }}>
                  Activación por fases. Si cierras sesión o cambias de dispositivo, solo vuelves a solicitar.
                </div>
              </form>
            </div>

            {/* 2) Qué incluye */}
            <div className="card">
              <div className="cardHead">
                <h2 className="cardTitle">¿Qué incluye?</h2>
                <span className="badge">PRO</span>
              </div>

              <div className="list">
                <div className="row">
                  <div className="rowLeft">
                    <div className="rowTitle">Cupo controlado</div>
                    <div className="rowSub">Entradas por fases para mantener calidad y soporte real.</div>
                  </div>
                  <div className="rowTag">Operación</div>
                </div>

                <div className="row">
                  <div className="rowLeft">
                    <div className="rowTitle">Transparencia total</div>
                    <div className="rowSub">Costos y tiempos claros. Sin letra pequeña.</div>
                  </div>
                  <div className="rowTag">Confianza</div>
                </div>

                <div className="row">
                  <div className="rowLeft">
                    <div className="rowTitle">Trazabilidad real</div>
                    <div className="rowSub">Seguimiento de estado y soporte humano cuando lo necesites.</div>
                  </div>
                  <div className="rowTag">Soporte</div>
                </div>
              </div>

              <div className="chipRow" style={{ marginTop: 14 }}>
                <Link className="btnPrimary" href="/early-access">
                  Early Access →
                </Link>
                <Link className="btnGhost" href="/stores">
                  Buscar tienda
                </Link>
                <Link className="btnGhost" href="/products">
                  Explorar productos
                </Link>
              </div>

              <p className="muted" style={{ marginTop: 14 }}>
                JUSP opera bajo intermediación premium. Transparencia primero. Sin promesas.
              </p>
            </div>

            {/* 3) Resumen */}
            <div className="card">
              <div className="cardHead">
                <h2 className="cardTitle">Resumen</h2>
                <span className="badge">{copy.title}</span>
              </div>

              <p className="muted">
                Entra por fases. Te habilitamos por cupo para mantener atención real. Si quieres empezar ya, usa Early
                Access.
              </p>

              <div className="list">
                <div className="row">
                  <div className="rowLeft">
                    <div className="rowTitle">Tiempo objetivo</div>
                    <div className="rowSub">Respuesta por fases según operación.</div>
                  </div>
                  <div className="rowTag">Control</div>
                </div>

                <div className="row">
                  <div className="rowLeft">
                    <div className="rowTitle">Prioridad</div>
                    <div className="rowSub">Plus/Elite suben prioridad en cola.</div>
                  </div>
                  <div className="rowTag">Speed</div>
                </div>

                <div className="row">
                  <div className="rowLeft">
                    <div className="rowTitle">Soporte humano</div>
                    <div className="rowSub">No bots. Conversación real.</div>
                  </div>
                  <div className="rowTag">Real</div>
                </div>
              </div>

              <div className="chipRow" style={{ marginTop: 14 }}>
                <Link className="btnPrimary" href="/">
                  Volver al inicio →
                </Link>
                <Link className="btnGhost" href="/help">
                  Centro de ayuda
                </Link>
                <Link className="btnGhost" href="/terms">
                  Términos
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}