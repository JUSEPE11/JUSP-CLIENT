// app/feedback/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type FeedbackType = "bug" | "idea" | "product" | "support";
type Rating = 1 | 2 | 3 | 4 | 5;

export default function FeedbackPage() {
  const rootRef = useRef<HTMLElement | null>(null);

  const [type, setType] = useState<FeedbackType>("idea");
  const [rating, setRating] = useState<Rating>(5);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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

  const meta = useMemo(() => {
    const map: Record<
      FeedbackType,
      { tag: string; title: string; desc: string; hint: string }
    > = {
      idea: {
        tag: "Recomendado",
        title: "Idea",
        desc: "Cuéntanos qué te gustaría ver. Lo usamos para priorizar roadmap real.",
        hint: "Ej: Quiero filtros por talla y disponibilidad por ciudad.",
      },
      bug: {
        tag: "Crítico",
        title: "Bug",
        desc: "Si algo falla, lo arreglamos primero. Describe qué pasó y en qué página.",
        hint: "Ej: En /stores, el botón ‘Explorar’ no carga resultados.",
      },
      product: {
        tag: "Catálogo",
        title: "Producto",
        desc: "Pide referencias, marcas o categorías. Te leemos para expandir catálogo.",
        hint: "Ej: Agrega Nike Air Max 90, talla 42, color negro.",
      },
      support: {
        tag: "Humano",
        title: "Soporte",
        desc: "¿Te quedó una duda? Escríbenos y te guiamos con trazabilidad real.",
        hint: "Ej: ¿Cómo funciona la intermediación y los tiempos?",
      },
    };
    return map[type];
  }, [type]);

  const canSend = message.trim().length >= 12;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSent(true);

    // Aquí luego conectas endpoint si quieres.
    // UX premium sin backend.
  };

  const reset = () => {
    setSent(false);
    setMessage("");
    setEmail("");
    setRating(5);
    setType("idea");
  };

  return (
    <main ref={rootRef as any} className="juspFbRoot">
      <style>{`
        /* ===========================
           JUSP /feedback — NIVEL DIOS PRO MAX REAL
           - NO toca global.css
           - NO cambia layout/header (header blanco visible)
           - Hero empieza debajo del header
           =========================== */

        .juspFbRoot{
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

        .kicker{
          font-size: 11px;
          font-weight: 980;
          letter-spacing: 0.34em;
          color: rgba(255,255,255,0.34);
          margin: 18px 0 10px;
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
          max-width: 840px;
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

        .grid{
          margin-top: 18px;
          display:grid;
          grid-template-columns: 1.1fr 0.9fr;
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

        .segRow{
          margin-top: 14px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .segBtn{
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.18);
          padding: 10px 12px;
          cursor: pointer;
          transition: transform 140ms var(--ease), background 140ms var(--ease), border-color 140ms var(--ease), box-shadow 140ms var(--ease);
          user-select: none;
          color: rgba(255,255,255,0.86);
          font-weight: 950;
          font-size: 12px;
          letter-spacing: -0.01em;
          display:inline-flex;
          align-items:center;
          gap: 10px;
          outline: none;
        }
        .segBtn:hover{
          transform: translateY(-1px);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
        }
        .segActive{
          border-color: rgba(245,192,48,0.48);
          background: rgba(245,192,48,0.10);
          box-shadow: 0 18px 70px rgba(245,192,48,0.10);
        }
        .segDot{
          width: 7px; height: 7px; border-radius: 999px;
          background: rgba(245,192,48,0.92);
          box-shadow: 0 0 0 4px rgba(245,192,48,0.10);
          opacity: 0.75;
        }
        .segActive .segDot{ opacity: 1; }

        .form{
          margin-top: 14px;
          display:grid;
          gap: 12px;
        }

        .fieldLabel{
          font-size: 12px;
          font-weight: 980;
          letter-spacing: 0.10em;
          color: rgba(255,255,255,0.44);
          text-transform: uppercase;
        }

        .input{
          width: 100%;
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

        .textarea{
          width: 100%;
          min-height: 150px;
          resize: vertical;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(0,0,0,0.22);
          color: rgba(255,255,255,0.92);
          padding: 14px 14px;
          font-weight: 850;
          outline: none;
          transition: border-color 140ms var(--ease), background 140ms var(--ease);
        }
        .textarea::placeholder{ color: rgba(255,255,255,0.34); font-weight: 850; }
        .textarea:focus{
          border-color: rgba(245,192,48,0.45);
          background: rgba(255,255,255,0.06);
        }

        .ratingRow{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }

        .starBtn{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.18);
          cursor: pointer;
          transition: transform 140ms var(--ease), background 140ms var(--ease), border-color 140ms var(--ease), box-shadow 140ms var(--ease);
          display:flex;
          align-items:center;
          justify-content:center;
          color: rgba(255,255,255,0.72);
          font-size: 18px;
          font-weight: 990;
          outline: none;
          user-select: none;
        }
        .starBtn:hover{
          transform: translateY(-1px);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
        }
        .starOn{
          border-color: rgba(245,192,48,0.50);
          background: rgba(245,192,48,0.10);
          box-shadow: 0 18px 70px rgba(245,192,48,0.12);
          color: rgba(245,192,48,0.96);
        }

        .actions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
          justify-content: space-between;
          margin-top: 6px;
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
        .btnPrimary:disabled{
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
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

        .mini{
          font-size: 12px;
          font-weight: 820;
          color: rgba(255,255,255,0.50);
          line-height: 1.45;
        }

        .toast{
          margin-top: 12px;
          border-radius: 18px;
          border: 1px solid rgba(245,192,48,0.24);
          background: rgba(245,192,48,0.10);
          padding: 12px 12px;
          display:flex;
          align-items:flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .toastTitle{
          font-weight: 990;
          color: rgba(245,192,48,0.98);
          letter-spacing: -0.01em;
          font-size: 13px;
        }
        .toastSub{
          margin-top: 4px;
          font-weight: 800;
          color: rgba(255,255,255,0.62);
          font-size: 12px;
          line-height: 1.35;
        }

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

        @media (max-width: 980px){
          .grid{ grid-template-columns: 1fr; }
          .h1{ font-size: 48px; }
        }
        @media (max-width: 520px){
          .wrap{ padding: 26px 16px 104px; }
          .h1{ font-size: 40px; }
          .textarea{ min-height: 170px; }
        }

        @media (prefers-reduced-motion: reduce){
          .bgGlowLeft, .bgGlowRight{ animation: none !important; }
          .btnPrimary, .btnGhost, .segBtn, .starBtn{ transition: none !important; }
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
          <span className="pillText">JUSP · Feedback</span>
        </div>

        <p className="kicker">FEEDBACK</p>
        <h1 className="h1">
          Haz que JUSP mejore
          <br />
          <span className="h1Muted"></span>
        </h1>

        <p className="sub">
          Lo leemos de verdad. Tu feedback se usa para priorizar lo que impacta operación, confianza y velocidad.
        </p>

        <div className="chipRow">
          <span className="chip">
            <span className="chipDot" /> Real (no bots)
          </span>
          <span className="chip">
            <span className="chipDot" /> Priorización por impacto
          </span>
          <span className="chip">
            <span className="chipDot" /> Respuesta por fases
          </span>
        </div>

        <div className="grid">
          {/* FORM */}
          <div className="card">
            <div className="cardHead">
              <h2 className="cardTitle">Enviar feedback</h2>
              <span className="badge">{meta.tag}</span>
            </div>

            <p className="muted">{meta.desc}</p>

            <div className="segRow" aria-label="Tipo de feedback">
              <button
                type="button"
                className={`segBtn ${type === "idea" ? "segActive" : ""}`}
                onClick={() => setType("idea")}
                aria-pressed={type === "idea"}
              >
                <span className="segDot" /> Idea
              </button>

              <button
                type="button"
                className={`segBtn ${type === "bug" ? "segActive" : ""}`}
                onClick={() => setType("bug")}
                aria-pressed={type === "bug"}
              >
                <span className="segDot" /> Bug
              </button>

              <button
                type="button"
                className={`segBtn ${type === "product" ? "segActive" : ""}`}
                onClick={() => setType("product")}
                aria-pressed={type === "product"}
              >
                <span className="segDot" /> Producto
              </button>

              <button
                type="button"
                className={`segBtn ${type === "support" ? "segActive" : ""}`}
                onClick={() => setType("support")}
                aria-pressed={type === "support"}
              >
                <span className="segDot" /> Soporte
              </button>
            </div>

            <form className="form" onSubmit={onSubmit}>
              <div>
                <div className="fieldLabel">Tu calificación</div>
                <div className="ratingRow" style={{ marginTop: 10 }}>
                  {([1, 2, 3, 4, 5] as Rating[]).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`starBtn ${n <= rating ? "starOn" : ""}`}
                      onClick={() => setRating(n)}
                      aria-label={`Calificación ${n}`}
                      aria-pressed={n === rating}
                    >
                      ★
                    </button>
                  ))}
                  <div className="mini" style={{ marginLeft: 6 }}>
                    {rating === 5
                      ? "Excelente"
                      : rating === 4
                      ? "Muy bien"
                      : rating === 3
                      ? "Bien"
                      : rating === 2
                      ? "Regular"
                      : "Mal"}
                  </div>
                </div>
              </div>

              <div>
                <div className="fieldLabel">Tu mensaje</div>
                <textarea
                  className="textarea"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (sent) setSent(false);
                  }}
                  placeholder={meta.hint}
                />
                <div className="mini" style={{ marginTop: 8 }}>
                  Mínimo 12 caracteres. Si es bug: di la ruta (ej. /stores) + qué esperabas.
                </div>
              </div>

              <div>
                <div className="fieldLabel">Email (opcional)</div>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (sent) setSent(false);
                  }}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
                <div className="mini" style={{ marginTop: 8 }}>
                  Si lo dejas, podemos responderte cuando el cambio esté listo.
                </div>
              </div>

              <div className="actions">
                <button className="btnPrimary" type="submit" disabled={!canSend}>
                  {sent ? "Enviado ✓" : "Enviar →"}
                </button>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btnGhost" href="/membership">
                    Membership
                  </Link>
                  <Link className="btnGhost" href="/early-access">
                    Early Access
                  </Link>
                  <Link className="btnGhost" href="/stores">
                    Stores
                  </Link>
                </div>
              </div>

              {sent ? (
                <div className="toast" role="status" aria-live="polite">
                  <div>
                    <div className="toastTitle">Listo. Recibido.</div>
                    <div className="toastSub">
                      Gracias. Esto entra a cola real de revisión. Si dejaste email, te escribimos cuando haya update.
                    </div>
                  </div>
                  <button type="button" className="btnGhost" onClick={reset} style={{ height: 44 }}>
                    Nuevo
                  </button>
                </div>
              ) : null}
            </form>
          </div>

          {/* PANEL DERECHO */}
          <div className="card">
            <div className="cardHead">
              <h2 className="cardTitle">Cómo escribirlo bien</h2>
              <span className="badge">PRO</span>
            </div>

            <div className="list">
              <div className="row">
                <div className="rowLeft">
                  <div className="rowTitle">Contexto rápido</div>
                  <div className="rowSub">Ruta + qué estabas haciendo + qué esperabas.</div>
                </div>
                <div className="rowTag">Claro</div>
              </div>

              <div className="row">
                <div className="rowLeft">
                  <div className="rowTitle">Impacto</div>
                  <div className="rowSub">¿Te bloquea? ¿Te frena? ¿O es mejora?</div>
                </div>
                <div className="rowTag">Prioridad</div>
              </div>

              <div className="row">
                <div className="rowLeft">
                  <div className="rowTitle">Ejemplo</div>
                  <div className="rowSub">“En /stores, filtro por marca no aplica al buscar.”</div>
                </div>
                <div className="rowTag">Útil</div>
              </div>
            </div>

            <p className="muted" style={{ marginTop: 14 }}>
              JUSP es intermediación premium con trazabilidad real. Feedback = mejora real.
            </p>

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
      </div>
    </main>
  );
}