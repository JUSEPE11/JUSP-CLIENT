"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function StoresPage() {
  const [city, setCity] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");

  const rootRef = useRef<HTMLElement | null>(null);

  const subtitle = useMemo(() => {
    const parts = [city, brand, category, keyword].filter(Boolean);
    if (parts.length === 0) {
      return "Ubica referencias por ciudad, marca o categoría. Intermediación premium con trazabilidad real.";
    }
    return `Filtrando por: ${parts.join(" · ")}`;
  }, [city, brand, category, keyword]);

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
      const x = (e.clientX / w - 0.5) * 2; // -1..1
      const y = (e.clientY / h - 0.5) * 2;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", String(x));
        el.style.setProperty("--my", String(y));
      });
    };

    const onScroll = () => {
      const s = window.scrollY || 0;
      // micro parallax en scroll (muy leve)
      el.style.setProperty("--sy", String(Math.min(1, s / 600)));
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

  return (
    <main ref={rootRef as any} className="juspStoresRoot">
      <style>{`
        /* ===========================
           JUSP /stores — CINEMATIC PRO
           Autónomo: NO depende de globals/tailwind/layout
           =========================== */

        .juspStoresRoot{
          --gold: #F5C030;
          --bg: #070709;
          --card: rgba(255,255,255,0.045);
          --border: rgba(255,255,255,0.10);
          --muted: rgba(255,255,255,0.58);
          --muted2: rgba(255,255,255,0.45);
          --shadow: 0 30px 90px rgba(0,0,0,0.55);
          --ease: cubic-bezier(.2,.8,.2,1);

          /* Vars animadas (parallax) */
          --mx: 0;
          --my: 0;
          --sy: 0;

          position: relative;
          min-height: 100vh;
          overflow: hidden;
          color: #fff;
          background: var(--bg);
          isolation: isolate; /* overlays premium */
        }

        /* ===== BACKGROUND CINEMATIC ===== */
        .bgLayer{
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .bgBase{
          position:absolute; inset:0;
          background: var(--bg);
        }

        /* Glow dorado izquierdo (animado suave + parallax) */
        .bgGlowLeft{
          position:absolute;
          left: -28%;
          top: -28%;
          width: 1200px;
          height: 1200px;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.86;
          background: radial-gradient(circle at 30% 30%,
            rgba(245,192,48,0.62),
            rgba(245,192,48,0.20) 32%,
            transparent 68%);
          transform:
            translate3d(
              calc(var(--mx) * -18px),
              calc(var(--my) * -14px),
              0
            )
            scale(calc(1 + (var(--sy) * 0.02)));
          animation: glowFloat 10s var(--ease) infinite alternate;
          will-change: transform, opacity;
        }

        /* Glow derecho */
        .bgGlowRight{
          position:absolute;
          right: -30%;
          top: -22%;
          width: 1100px;
          height: 1100px;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.62;
          background: radial-gradient(circle at 65% 35%,
            rgba(255,255,255,0.12),
            rgba(255,255,255,0.05) 30%,
            transparent 70%);
          transform:
            translate3d(
              calc(var(--mx) * 14px),
              calc(var(--my) * -10px),
              0
            );
          animation: glowFloat2 12s var(--ease) infinite alternate;
          will-change: transform, opacity;
        }

        .bgGradient{
          position:absolute; inset:0;
          opacity: 0.96;
          background:
            radial-gradient(1200px 600px at 10% 20%, rgba(245,192,48,0.22), transparent 60%),
            radial-gradient(900px 520px at 85% 10%, rgba(255,255,255,0.10), transparent 55%),
            linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(7,7,9,1) 55%, rgba(7,7,9,1) 100%);
          transform: translate3d(0, calc(var(--sy) * -6px), 0);
          will-change: transform;
        }

        /* Viñeta fuerte de campaña */
        .bgVignette{
          position:absolute; inset:0;
          background: radial-gradient(1200px 700px at 50% 35%, transparent 30%, rgba(0,0,0,0.82) 86%);
        }

        /* “Sheen” horizontal muy suave */
        .bgSheen{
          position:absolute;
          inset: -30% -20%;
          opacity: 0.25;
          background: linear-gradient(115deg,
            transparent 0%,
            rgba(255,255,255,0.08) 35%,
            transparent 60%);
          transform: translate3d(calc(var(--mx) * 24px), calc(var(--my) * 10px), 0) rotate(-6deg);
          mix-blend-mode: screen;
          will-change: transform;
        }

        /* Grain/film — sutil */
        .bgGrain{
          position:absolute; inset:0;
          opacity: 0.10;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 240px 240px;
          mix-blend-mode: overlay;
          transform: translate3d(calc(var(--mx) * -6px), calc(var(--my) * 4px), 0);
          will-change: transform;
        }

        @keyframes glowFloat{
          0% { opacity: 0.78; filter: blur(68px); }
          100% { opacity: 0.92; filter: blur(74px); }
        }
        @keyframes glowFloat2{
          0% { opacity: 0.52; filter: blur(70px); }
          100% { opacity: 0.72; filter: blur(78px); }
        }

        /* ===== CONTENT WRAP ===== */
        .wrap{
          position: relative;
          z-index: 1;
          max-width: 1120px;
          margin: 0 auto;
          padding: 64px 24px 90px;
        }

        /* Top pill */
        .topRow{
          display:flex;
          align-items:center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .pill{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
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
          font-weight: 950;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.84);
        }

        /* Hero */
        .kicker{
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.32em;
          color: rgba(255,255,255,0.35);
          margin: 0 0 10px;
        }

        .h1{
          margin: 0;
          font-size: 60px;
          line-height: 0.96;
          letter-spacing: -0.03em;
          font-weight: 980;
          text-shadow: 0 18px 60px rgba(0,0,0,0.55);
        }
        .h1Muted{
          color: rgba(255,255,255,0.55);
          font-weight: 930;
        }

        .sub{
          margin: 18px 0 0;
          max-width: 760px;
          font-size: 16px;
          line-height: 1.65;
          color: var(--muted);
          font-weight: 750;
        }

        /* Chips */
        .chipRow{
          margin-top: 18px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .chip{
          position: relative;
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-size: 12px;
          font-weight: 950;
          color: rgba(255,255,255,0.72);
          overflow: hidden;
        }
        .chip::after{
          content:"";
          position:absolute;
          inset:0;
          opacity: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-60%);
          transition: opacity 220ms var(--ease);
        }
        .chip:hover::after{
          opacity: 1;
          animation: chipSheen 900ms var(--ease) 1;
        }
        @keyframes chipSheen{
          0%{ transform: translateX(-70%); }
          100%{ transform: translateX(70%); }
        }

        .chipDot{
          width: 8px; height: 8px; border-radius: 999px;
          background: rgba(255,255,255,0.28);
        }
        .chipDotGold{
          background: rgba(245,192,48,0.75);
        }

        /* Grid */
        .grid{
          margin-top: 34px;
          display:grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 18px;
          align-items: start;
        }

        /* ===== CARDS ===== */
        .card{
          position: relative;
          border-radius: 26px;
          border: 1px solid var(--border);
          background: var(--card);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: var(--shadow);
          padding: 20px;
          overflow: hidden;
          transition: transform 220ms var(--ease), box-shadow 220ms var(--ease), border-color 220ms var(--ease);
          will-change: transform;
        }

        /* borde vivo tipo campaña */
        .card::before{
          content:"";
          position:absolute;
          inset: -1px;
          border-radius: 28px;
          padding: 1px;
          background: radial-gradient(700px 240px at 15% 15%,
            rgba(245,192,48,0.32),
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
          pointer-events: none;
        }

        /* sheen interno (luz diagonal) */
        .card::after{
          content:"";
          position:absolute;
          inset:-30%;
          background: linear-gradient(115deg,
            transparent 0%,
            rgba(255,255,255,0.10) 35%,
            transparent 60%);
          transform: translate3d(calc(var(--mx) * 18px), calc(var(--my) * 12px), 0) rotate(-8deg);
          opacity: 0.18;
          pointer-events:none;
          mix-blend-mode: screen;
          transition: opacity 220ms var(--ease);
        }

        .card:hover{
          transform: translateY(-3px);
          box-shadow: 0 40px 120px rgba(0,0,0,0.62);
          border-color: rgba(255,255,255,0.14);
        }
        .card:hover::after{ opacity: 0.26; }

        .cardHead{
          display:flex;
          align-items:flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .cardTitle{
          margin: 0;
          font-size: 22px;
          font-weight: 980;
          letter-spacing: -0.02em;
        }

        .cardDesc{
          margin: 8px 0 0;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 750;
          color: rgba(255,255,255,0.55);
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
          font-weight: 980;
          white-space: nowrap;
        }

        /* Fields */
        .fields{
          margin-top: 14px;
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .input{
          height: 56px;
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.35);
          color: rgba(255,255,255,0.92);
          padding: 0 14px;
          font-size: 13px;
          font-weight: 950;
          outline: none;
          transition: transform 160ms var(--ease), border-color 160ms var(--ease), box-shadow 160ms var(--ease), background 160ms var(--ease);
        }
        .input::placeholder{
          color: rgba(255,255,255,0.30);
          font-weight: 850;
        }
        .input:hover{
          transform: translateY(-1px);
          background: rgba(0,0,0,0.40);
        }
        .input:focus{
          border-color: rgba(245,192,48,0.52);
          box-shadow: 0 0 0 6px rgba(245,192,48,0.10);
          background: rgba(0,0,0,0.46);
          transform: translateY(-1px);
        }

        /* Buttons */
        .btnRow{
          margin-top: 14px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btnPrimary{
          position: relative;
          height: 56px;
          padding: 0 18px;
          border-radius: 16px;
          border: 0;
          background: #fff;
          color: #000;
          font-size: 13px;
          font-weight: 980;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 16px 50px rgba(255,255,255,0.18);
          transition: transform 140ms var(--ease), background 140ms var(--ease), box-shadow 140ms var(--ease), filter 140ms var(--ease);
          overflow: hidden;
        }

        /* Shine animado del CTA (campaña) */
        .btnPrimary::after{
          content:"";
          position:absolute;
          top:-40%;
          left:-60%;
          width: 60%;
          height: 180%;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.10), transparent);
          transform: rotate(18deg);
          opacity: 0;
        }
        .btnPrimary:hover{
          transform: translateY(-1px);
          background: rgba(255,255,255,0.92);
          box-shadow: 0 22px 78px rgba(255,255,255,0.16);
        }
        .btnPrimary:hover::after{
          opacity: 1;
          animation: btnShine 900ms var(--ease) 1;
        }
        @keyframes btnShine{
          0%{ left:-70%; opacity: 0; }
          20%{ opacity: 0.6; }
          100%{ left: 120%; opacity: 0; }
        }
        .btnPrimary:active{
          transform: translateY(0px) scale(0.99);
          filter: brightness(0.98);
        }

        .btnGhost{
          height: 56px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.78);
          font-size: 13px;
          font-weight: 980;
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: background 140ms var(--ease), color 140ms var(--ease), transform 140ms var(--ease);
        }
        .btnGhost:hover{
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.92);
          transform: translateY(-1px);
        }
        .btnGhost:active{ transform: translateY(0px) scale(0.99); }

        /* Note */
        .note{
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.10);
          font-size: 12px;
          font-weight: 750;
          color: rgba(255,255,255,0.45);
          line-height: 1.55;
        }

        /* Right side */
        .infoTitle{
          margin: 0;
          font-size: 22px;
          font-weight: 980;
          letter-spacing: -0.02em;
        }
        .infoSub{
          margin: 8px 0 0;
          font-size: 13px;
          font-weight: 750;
          color: rgba(255,255,255,0.55);
          line-height: 1.55;
        }
        .infoStack{
          margin-top: 14px;
          display:grid;
          gap: 12px;
        }
        .infoRow{
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.25);
          padding: 14px;
          transition: transform 180ms var(--ease), background 180ms var(--ease);
        }
        .infoRow:hover{
          transform: translateY(-2px);
          background: rgba(0,0,0,0.30);
        }
        .infoRowHead{
          display:flex;
          align-items:center;
          gap: 10px;
        }
        .goldDot{
          width: 8px; height: 8px; border-radius: 999px;
          background: var(--gold);
          box-shadow: 0 0 0 4px rgba(245,192,48,0.10);
        }
        .infoRowTitle{
          margin: 0;
          font-size: 14px;
          font-weight: 980;
          color: rgba(255,255,255,0.92);
        }
        .infoRowDesc{
          margin: 8px 0 0;
          font-size: 13px;
          font-weight: 750;
          color: rgba(255,255,255,0.55);
          line-height: 1.55;
        }

        .proNote{
          margin-top: 12px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.30);
          padding: 14px;
        }
        .proKicker{
          font-size: 11px;
          font-weight: 980;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.52);
          margin: 0;
        }
        .proText{
          margin: 10px 0 0;
          font-size: 13px;
          font-weight: 750;
          color: rgba(255,255,255,0.62);
          line-height: 1.6;
        }
        .proStrong{
          color: rgba(255,255,255,0.92);
          font-weight: 980;
        }

        /* Responsive */
        @media (max-width: 980px){
          .grid{ grid-template-columns: 1fr; }
          .h1{ font-size: 48px; }
        }
        @media (max-width: 520px){
          .wrap{ padding: 52px 16px 78px; }
          .h1{ font-size: 40px; }
          .fields{ grid-template-columns: 1fr; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .bgGlowLeft, .bgGlowRight{ animation: none !important; }
          .chip:hover::after{ animation: none !important; }
          .btnPrimary:hover::after{ animation: none !important; }
          .card, .input, .btnPrimary, .btnGhost, .infoRow{ transition: none !important; }
        }
      `}</style>

      {/* Fondo */}
      <div className="bgLayer">
        <div className="bgBase" />
        <div className="bgGlowLeft" />
        <div className="bgGlowRight" />
        <div className="bgGradient" />
        <div className="bgSheen" />
        <div className="bgGrain" />
        <div className="bgVignette" />
      </div>

      {/* Contenido */}
      <div className="wrap">
        <div className="topRow">
          <div className="pill">
            <span className="dot" />
            <span className="pillText">JUSP · Buscar tienda</span>
          </div>
        </div>

        <p className="kicker">BUSCAR TIENDA</p>

        <h1 className="h1">
          Encuentra referencias
          <br />
          <span className="h1Muted"></span>
        </h1>

        <p className="sub">{subtitle}</p>

        <div className="chipRow">
          <span className="chip">
            <span className="chipDot" /> Transparencia
          </span>
          <span className="chip">
            <span className="chipDot chipDotGold" /> Trazabilidad real
          </span>
          <span className="chip">
            <span className="chipDot" /> Intermediación premium
          </span>
        </div>

        <section className="grid">
          {/* Card principal */}
          <div className="card">
            <div className="cardHead">
              <div>
                <h2 className="cardTitle">Encuentra por lo que importa</h2>
                <p className="cardDesc">Busca por ciudad, marca, categoría o palabra clave.</p>
              </div>
              <span className="badge">Premium</span>
            </div>

            <div className="fields">
              <input
                className="input"
                type="text"
                placeholder="Ciudad (Ej: Cali, Bogotá)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                className="input"
                type="text"
                placeholder="Marca (Ej: Nike, Adidas)"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
              <input
                className="input"
                type="text"
                placeholder="Categoría (Ej: Zapatillas)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <input
                className="input"
                type="text"
                placeholder="Palabra clave"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="btnRow">
              <button className="btnPrimary" type="button">
                Explorar referencias →
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() => {
                  setCity("");
                  setBrand("");
                  setCategory("");
                  setKeyword("");
                }}
              >
                Limpiar filtros
              </button>
            </div>

            <p className="note">
              Esta página es informativa. Las compras se gestionan bajo el modelo de intermediación de JUSP.
            </p>
          </div>

          {/* Card lateral */}
          <div className="card">
            <h3 className="infoTitle">¿Qué estás buscando exactamente?</h3>
            <p className="infoSub">Tips para encontrar más rápido.</p>

            <div className="infoStack">
              <div className="infoRow">
                <div className="infoRowHead">
                  <span className="goldDot" />
                  <p className="infoRowTitle">Ciudad primero</p>
                </div>
                <p className="infoRowDesc">
                  Empieza por ciudad si buscas disponibilidad local o referencias recurrentes.
                </p>
              </div>

              <div className="infoRow">
                <div className="infoRowHead">
                  <span className="goldDot" />
                  <p className="infoRowTitle">Marca después</p>
                </div>
                <p className="infoRowDesc">
                  Filtra por marca para cortar ruido y encontrar coincidencias reales.
                </p>
              </div>

              <div className="infoRow">
                <div className="infoRowHead">
                  <span className="goldDot" />
                  <p className="infoRowTitle">Keyword inteligente</p>
                </div>
                <p className="infoRowDesc">
                  Escribe modelo o referencia: “Air Max 90”, “TN”, “Dunk Panda”, “Jordan 4”.
                </p>
              </div>
            </div>

            <div className="proNote">
              <p className="proKicker">NOTA PRO</p>
              <p className="proText">
                Este buscador está diseñado para <span className="proStrong">referencias verificables</span>. No vendemos humo:
                solo lo que se puede gestionar con trazabilidad.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}