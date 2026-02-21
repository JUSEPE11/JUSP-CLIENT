"use client";

import * as React from "react";

type Sprite360ViewerProps = {
  spriteUrl: string; // ej: "/360/nike-bra-black/sprite.jpeg"
  frames: number; // ej: 12
  aspectRatio?: "1/1" | "4/5" | "3/4" | "16/9";
  sensitivity?: number; // px por frame (menor = más rápido)
  loop?: boolean;
  enableWheel?: boolean;
  label?: string;
  tagline?: string;
};

function ratioToPaddingTop(r: Sprite360ViewerProps["aspectRatio"]) {
  switch (r) {
    case "4/5":
      return "125%";
    case "3/4":
      return "133.3333%";
    case "16/9":
      return "56.25%";
    case "1/1":
    default:
      return "100%";
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export default function Sprite360Viewer({
  spriteUrl,
  frames,
  aspectRatio = "1/1",
  sensitivity = 10,
  loop = true,
  enableWheel = true,
  label = "JUSP",
  tagline = "Originales. Directo.",
}: Sprite360ViewerProps) {
  const total = Math.max(1, frames);

  const [idx, setIdx] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const lastX = React.useRef(0);
  const acc = React.useRef(0);

  const step = (deltaPx: number) => {
    const pxPerFrame = Math.max(3, sensitivity);
    acc.current += deltaPx;

    const frameDelta = Math.trunc(acc.current / pxPerFrame);
    if (frameDelta === 0) return;

    acc.current -= frameDelta * pxPerFrame;

    setIdx((prev) => {
      const next = prev + frameDelta;
      if (loop) return mod(next, total);
      return clamp(next, 0, total - 1);
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    lastX.current = e.clientX;
    acc.current = 0;

    // Captura el pointer para que el drag no se corte si el cursor sale del área
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    step(dx);
  };

  const endDrag = () => {
    setDragging(false);
    acc.current = 0;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!enableWheel) return;
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    step(delta);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIdx((prev) =>
        loop ? mod(prev - 1, total) : clamp(prev - 1, 0, total - 1)
      );
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setIdx((prev) =>
        loop ? mod(prev + 1, total) : clamp(prev + 1, 0, total - 1)
      );
    }
  };

  const paddingTop = ratioToPaddingTop(aspectRatio);

  // La imagen del sprite mide (total * 100%) del contenedor.
  // 1 frame = 100% del contenedor.
  // translateX en % se calcula sobre el ancho del propio sprite:
  // mover 1 frame = mover (1/total) del sprite => (100/total)%
  const translatePct = (idx * 100) / total;

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onWheel={onWheel}
      style={{
        width: "100%",
        borderRadius: 18,
        overflow: "hidden",
        background: "#0b0b0c",
        cursor: dragging ? "grabbing" : "grab",
        boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
        outline: "none",
        touchAction: "pan-y", // permite scroll vertical, pero el drag horizontal lo controlamos nosotros
      }}
    >
      <div style={{ position: "relative", width: "100%", paddingTop }}>
        {/* Fondo premium */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.10), rgba(0,0,0,0.0) 55%)",
            pointerEvents: "none",
          }}
        />

        {/* Sprite (robusto): <img> gigante + translateX */}
        <div
          aria-label="360 sprite"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={spriteUrl}
            alt="360 sprite"
            draggable={false}
            onLoad={() => setLoaded(true)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${total * 100}%`,
              transform: `translateX(-${translatePct}%)`,
              transition: dragging ? "none" : "transform 90ms linear",
              userSelect: "none",
              WebkitUserSelect: "none",
              pointerEvents: "none",
              filter: "contrast(1.02) saturate(1.02)",
            }}
          />

          {/* Fallback si aún no cargó */}
          {!loaded && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.75)",
                fontSize: 12,
              }}
            >
              Cargando…
            </div>
          )}
        </div>

        {/* UI */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 11,
            letterSpacing: "0.35em",
            color: "rgba(255,255,255,0.75)",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "rgba(0,0,0,0.55)",
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            color: "#fff",
            backdropFilter: "blur(8px)",
            pointerEvents: "none",
          }}
        >
          Arrastra o rueda para girar
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            background: "rgba(0,0,0,0.55)",
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            color: "#fff",
            backdropFilter: "blur(8px)",
            pointerEvents: "none",
          }}
        >
          {idx + 1}/{total}
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "10px 0 12px",
          background: "#0b0b0c",
          color: "rgba(255,255,255,0.85)",
          fontSize: 12,
        }}
      >
        {tagline}
      </div>
    </div>
  );
}