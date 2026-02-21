"use client";

import * as React from "react";

type Jusp360ViewerProps = {
  frames: string[];
  alt: string;

  aspectRatio?: "1/1" | "4/5" | "3/4" | "16/9";
  sensitivity?: number; // px por frame (menor = gira más rápido)
  loop?: boolean;
  showHint?: boolean;

  brandLabel?: string;
  brandTagline?: string;

  enableWheel?: boolean;

  /**
   * "contain" = nunca recorta (recomendado)
   * "cover" = llena el cuadro, pero recorta (no recomendado para tus frames)
   */
  fit?: "contain" | "cover";

  /**
   * Solo aplica si fit="cover"
   * Ej: "50% 20%" para subir el encuadre
   */
  objectPosition?: string;

  /**
   * Si fit="contain", activa fondo blur para que se vea premium
   */
  blurredBackdrop?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function ratioToPaddingTop(r: Jusp360ViewerProps["aspectRatio"]) {
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

export default function Jusp360Viewer({
  frames,
  alt,
  aspectRatio = "4/5",
  sensitivity = 8,
  loop = true,
  showHint = true,
  brandLabel = "JUSP",
  brandTagline = "Originales. Directo.",
  enableWheel = true,
  fit = "contain",
  objectPosition = "50% 50%",
  blurredBackdrop = true,
}: Jusp360ViewerProps) {
  const safeFrames = Array.isArray(frames) ? frames.filter(Boolean) : [];
  const total = safeFrames.length;

  const [index, setIndex] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const lastX = React.useRef(0);
  const acc = React.useRef(0);

  React.useEffect(() => {
    setIndex(0);
    setIsDragging(false);
    lastX.current = 0;
    acc.current = 0;
  }, [total]);

  const step = (delta: number) => {
    if (!total) return;

    const pxPerFrame = Math.max(3, sensitivity);
    acc.current += delta;

    const frameDelta = Math.trunc(acc.current / pxPerFrame);
    if (frameDelta === 0) return;

    acc.current -= frameDelta * pxPerFrame;

    setIndex((prev) => {
      const next = prev + frameDelta;
      if (loop) return mod(next, total);
      return clamp(next, 0, total - 1);
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!total) return;
    setIsDragging(true);
    lastX.current = e.clientX;
    acc.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    step(dx);
  };

  const endDrag = () => {
    setIsDragging(false);
    acc.current = 0;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!enableWheel) return;
    if (!total) return;
    e.preventDefault();

    // Trackpad: a veces deltaY es mejor que deltaX
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    step(delta);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!total) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((prev) => (loop ? mod(prev - 1, total) : clamp(prev - 1, 0, total - 1)));
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex((prev) => (loop ? mod(prev + 1, total) : clamp(prev + 1, 0, total - 1)));
    }
  };

  const paddingTop = ratioToPaddingTop(aspectRatio);
  const src = total ? safeFrames[clamp(index, 0, total - 1)] : "";

  const foregroundObjectFit = fit === "cover" ? "cover" : "contain";

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        background: "#0b0b0c",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onWheel={onWheel}
    >
      <div style={{ position: "relative", width: "100%", paddingTop }}>
        {/* Fondo blur premium (solo cuando fit=contain) */}
        {src && blurredBackdrop && fit === "contain" ? (
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(22px)",
              transform: "scale(1.08)",
              opacity: 0.55,
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        ) : null}

        {/* Overlay suave */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.10), rgba(0,0,0,0.0) 55%)",
            pointerEvents: "none",
          }}
        />

        {/* Imagen principal (NO recorta si contain) */}
        {src ? (
          <img
            src={src}
            alt={alt}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: foregroundObjectFit as any,
              objectPosition: objectPosition,
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.65)",
              fontSize: 14,
            }}
          >
            Sin frames 360
          </div>
        )}

        {/* Branding arriba */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {brandLabel}
          </div>
        </div>

        {/* Hint + contador */}
        {showHint && total > 1 ? (
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
              pointerEvents: "none",
              backdropFilter: "blur(8px)",
            }}
          >
            Arrastra o rueda para girar
          </div>
        ) : null}

        {total > 1 ? (
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
              pointerEvents: "none",
              backdropFilter: "blur(8px)",
            }}
          >
            {index + 1}/{total}
          </div>
        ) : null}
      </div>

      {/* Footer tagline */}
      <div
        style={{
          textAlign: "center",
          padding: "10px 0 12px",
          background: "#0b0b0c",
          color: "rgba(255,255,255,0.85)",
          fontSize: 12,
        }}
      >
        {brandTagline}
      </div>
    </div>
  );
}