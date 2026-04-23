"use client";

import { useEffect, useRef } from "react";

export default function StoresPage() {
  const rootRef = useRef<HTMLElement | null>(null);

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
      el.style.setProperty("--sy", String(Math.min(1, s / 900)));
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
        .juspStoresRoot{
          --gold: #F5C030;
          --bg: #050506;
          --border: rgba(255,255,255,0.12);
          --shadow: 0 30px 90px rgba(0,0,0,0.55);
          --ease: cubic-bezier(.2,.8,.2,1);

          --mx: 0;
          --my: 0;
          --sy: 0;

          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          color: #fff;
          background: var(--bg);
          isolation: isolate;
        }

        .bgLayer{
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .bgBase{
          position:absolute;
          inset:0;
          background:
            radial-gradient(900px 500px at 12% 8%, rgba(245,192,48,0.18), transparent 60%),
            radial-gradient(900px 500px at 88% 0%, rgba(255,255,255,0.08), transparent 60%),
            linear-gradient(180deg, #080809 0%, #050506 100%);
        }

        .bgGlowLeft{
          position:absolute;
          left: -18%;
          top: -8%;
          width: 900px;
          height: 900px;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.55;
          background: radial-gradient(circle, rgba(245,192,48,0.40), transparent 68%);
          transform: translate3d(calc(var(--mx) * -18px), calc(var(--my) * -12px), 0);
        }

        .bgGlowRight{
          position:absolute;
          right: -18%;
          top: 0;
          width: 820px;
          height: 820px;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.28;
          background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 68%);
          transform: translate3d(calc(var(--mx) * 14px), calc(var(--my) * -10px), 0);
        }

        .bgGrain{
          position:absolute;
          inset:0;
          opacity: 0.08;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
          background-size: 240px 240px;
          mix-blend-mode: overlay;
        }

        .wrap{
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 40px 20px 72px;
        }

        .topRow{
          display:flex;
          align-items:center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 22px;
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
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--gold);
          box-shadow: 0 0 0 4px rgba(245,192,48,0.10);
        }

        .pillText{
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.84);
        }

        .gallery{
          display: grid;
          gap: 24px;
        }

        .imageCard{
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          box-shadow: var(--shadow);
        }

        .imageCard::before{
          content:"";
          position:absolute;
          inset: -1px;
          border-radius: 32px;
          padding: 1px;
          background: radial-gradient(
            700px 240px at 15% 15%,
            rgba(245,192,48,0.30),
            rgba(255,255,255,0.08) 26%,
            transparent 60%
          );
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.9;
          z-index: 2;
        }

        .poster{
          position: relative;
          width: 100%;
          min-height: calc(100vh - 150px);
          background-position: center top;
          background-repeat: no-repeat;
          background-size: contain;
          background-color: #050506;
        }

        .posterTall{
          min-height: calc(100vh - 120px);
        }

        .posterWide{
          min-height: calc(100vh - 120px);
        }

        .poster::after{
          content:"";
          position:absolute;
          inset:0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.06) 24%, rgba(0,0,0,0.14) 100%);
          pointer-events:none;
        }

        .bottomNote{
          margin-top: 18px;
          text-align: center;
          font-size: 12px;
          line-height: 1.6;
          font-weight: 800;
          color: rgba(255,255,255,0.52);
          letter-spacing: 0.03em;
        }

        @media (max-width: 980px){
          .wrap{
            padding: 24px 12px 48px;
          }

          .imageCard{
            border-radius: 22px;
          }

          .poster{
            min-height: auto;
            aspect-ratio: 4 / 6;
            background-size: cover;
            background-position: center center;
          }

          .posterWide{
            aspect-ratio: 16 / 10;
          }
        }

        @media (max-width: 640px){
          .topRow{
            margin-bottom: 16px;
          }

          .poster{
            border-radius: 22px;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .bgGlowLeft,
          .bgGlowRight{
            transform: none !important;
          }
        }
      `}</style>

      <div className="bgLayer">
        <div className="bgBase" />
        <div className="bgGlowLeft" />
        <div className="bgGlowRight" />
        <div className="bgGrain" />
      </div>

      <div className="wrap">
        <div className="topRow">
          <div className="pill">
            <span className="dot" />
            <span className="pillText">JUSP · Buscar tienda</span>
          </div>
        </div>

        <section className="gallery">
          <div className="imageCard">
            <div
              className="poster posterTall"
              style={{
                backgroundImage: 'url("/stores-hero-1.jpg")',
              }}
            />
          </div>

          <div className="imageCard">
            <div
              className="poster posterWide"
              style={{
                backgroundImage: 'url("/stores-hero-2.jpg")',
              }}
            />
          </div>
        </section>

        <p className="bottomNote">
          Próximamente JUSP en Colombia.
        </p>
      </div>
    </main>
  );
}