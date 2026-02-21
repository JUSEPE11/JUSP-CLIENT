"use client";

import * as React from "react";

type DragDirection = "horizontal" | "vertical";

type Jusp360ViewerProps = {
  frames: string[];
  alt: string;

  aspectRatio?: "1/1" | "4/5" | "3/4" | "16/9";
  className?: string;

  dragDirection?: DragDirection;
  sensitivity?: number; // px por frame (menor = gira más rápido)
  reverse?: boolean;
  loop?: boolean;

  preload?: "eager" | "lazy";
  decode?: "sync" | "async";
  showHint?: boolean;

  brandLabel?: string;
  brandTagline?: string;

  /** PRO: rueda del mouse/trackpad para girar */
  enableWheel?: boolean;
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
  aspectRatio = "1/1",
  className = "",
  dragDirection = "horizontal",
  sensitivity = 8, // MÁS RÁPIDO por defecto (antes 14)
  reverse = false,
  loop = true,
  preload = "eager",
  decode = "async",
  showHint = true,
  brandLabel = "JUSP",
  brandTagline = "Originales. Directo.",
  enableWheel = true,
}: Jusp360ViewerProps) {
  const safeFrames = Array.isArray(frames) ? frames.filter(Boolean) : [];
  const safeTotal = safeFrames.length;

  const [index, setIndex] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [loadedCount, setLoadedCount] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);

  const pointerIdRef = React.useRef<number | null>(null);
  const lastXRef = React.useRef(0);
  const lastYRef = React.useRef(0);
  const accRef = React.useRef(0);

  React.useEffect(() => {
    setIndex(0);
    setIsDragging(false);
    setLoadedCount(0);
    setHasError(false);
    accRef.current = 0;
    pointerIdRef.current = null;
  }, [safeTotal]);

  const currentSrc =
    safeTotal > 0 ? safeFrames[clamp(index, 0, safeTotal - 1)] : "";

  const step = React.useCallback(
    (deltaPx: number) => {
      if (!safeTotal) return;

      const dir = reverse ? -1 : 1;
      const pxPerFrame = Math.max(3, sensitivity);
      accRef.current += deltaPx;

      const frameDelta = Math.trunc(accRef.current / pxPerFrame);
      if (frameDelta === 0) return;

      accRef.current -= frameDelta * pxPerFrame;

      setIndex((prev) => {
        const next = prev + frameDelta * dir;
        if (loop) return mod(next, safeTotal);
        return clamp(next, 0, safeTotal - 1);
      });
    },
    [loop, reverse, safeTotal, sensitivity]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!safeTotal) return;

    setIsDragging(true);
    setHasError(false);

    pointerIdRef.current = e.pointerId;
    lastXRef.current = e.clientX;
    lastYRef.current = e.clientY;
    accRef.current = 0;

    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (pointerIdRef.current !== e.pointerId) return;

    const dx = e.clientX - lastXRef.current;
    const dy = e.clientY - lastYRef.current;

    lastXRef.current = e.clientX;
    lastYRef.current = e.clientY;

    const delta = dragDirection === "vertical" ? dy : dx;
    step(delta);
  };

  const endDrag = (e?: React.PointerEvent) => {
    setIsDragging(false);
    if (e && pointerIdRef.current === e.pointerId) {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
    pointerIdRef.current = null;
    accRef.current = 0;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!safeTotal) return;

    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((prev) => {
        const next = prev - (reverse ? -1 : 1);
        if (loop) return mod(next, safeTotal);
        return clamp(next, 0, safeTotal - 1);
      });
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((prev) => {
        const next = prev + (reverse ? -1 : 1);
        if (loop) return mod(next, safeTotal);
        return clamp(next, 0, safeTotal - 1);
      });
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!enableWheel) return;
    if (!safeTotal) return;

    // Evita scroll de la página mientras giras
    e.preventDefault();

    // Trackpad suele mandar deltaY suave: lo convertimos a “pasos”
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    step(delta);
  };

  const paddingTop = ratioToPaddingTop(aspectRatio);

  return (
    <div className={`w-full ${className}`}>
      <div
        role="application"
        aria-label={alt}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        className={[
          "relative w-full select-none rounded-2xl",
          "bg-black/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
          "outline-none focus:ring-2 focus:ring-white/20",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
        style={{
          touchAction: dragDirection === "vertical" ? "pan-x" : "pan-y",
        }}
      >
        <div className="relative w-full" style={{ paddingTop }}>
          {safeTotal > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentSrc}
              alt={alt}
              draggable={false}
              loading={preload === "eager" ? "eager" : "lazy"}
              decoding={decode}
              onError={() => setHasError(true)}
              className={[
                "absolute inset-0 h-full w-full object-contain",
                "transition-opacity duration-150",
                hasError ? "opacity-40" : "opacity-100",
              ].join(" ")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              Sin frames 360
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.10),rgba(0,0,0,0.0)_55%)]" />

          {showHint && safeTotal > 1 ? (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/8 px-3 py-1 text-xs text-white/80 backdrop-blur">
              Arrastra o rueda para girar
            </div>
          ) : null}

          {safeTotal > 1 ? (
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/8 px-3 py-1 text-xs text-white/80 backdrop-blur">
              {index + 1}/{safeTotal}
            </div>
          ) : null}

          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 text-center">
            <div className="text-[11px] tracking-[0.35em] text-white/70">
              {brandLabel}
            </div>
          </div>

          {hasError ? (
            <div className="absolute inset-x-0 bottom-12 mx-auto w-fit rounded-xl bg-white/10 px-3 py-2 text-xs text-white/80 backdrop-blur">
              No se pudo cargar un frame. Revisa URLs.
            </div>
          ) : null}
        </div>

        {/* Preload */}
        <div className="hidden">
          {safeFrames.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${i}`}
              src={src}
              alt=""
              loading={preload === "eager" ? "eager" : "lazy"}
              decoding={decode}
              onLoad={() => setLoadedCount((c) => c + 1)}
            />
          ))}
        </div>

        <div className="px-4 pb-4 pt-2 text-center">
          <div className="text-xs text-white/65">{brandTagline}</div>
          {safeTotal > 0 ? (
            <div className="mt-1 text-[11px] text-white/35">
              Preload: {Math.min(loadedCount, safeTotal)}/{safeTotal}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}