"use client";

import * as React from "react";

type Jusp360ViewerProps = {
  frames: string[];
  alt: string;
  aspectRatio?: "1/1" | "4/5" | "3/4" | "16/9";
  sensitivity?: number;
  loop?: boolean;
  showHint?: boolean;
  brandLabel?: string;
  brandTagline?: string;
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
  aspectRatio = "4/5",
  sensitivity = 8,
  loop = true,
  showHint = true,
  brandLabel = "JUSP",
  brandTagline = "Originales. Directo.",
  enableWheel = true,
}: Jusp360ViewerProps) {
  const safeFrames = frames || [];
  const total = safeFrames.length;

  const [index, setIndex] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const lastX = React.useRef(0);
  const acc = React.useRef(0);

  const step = (delta: number) => {
    if (!total) return;

    acc.current += delta;
    const frameDelta = Math.trunc(acc.current / sensitivity);

    if (frameDelta !== 0) {
      acc.current -= frameDelta * sensitivity;

      setIndex((prev) => {
        const next = prev + frameDelta;
        if (loop) return mod(next, total);
        return clamp(next, 0, total - 1);
      });
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastX.current = e.clientX;
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
    e.preventDefault();
    step(e.deltaY);
  };

  const paddingTop = ratioToPaddingTop(aspectRatio);

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        background: "#000",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onWheel={onWheel}
    >
      <div style={{ position: "relative", width: "100%", paddingTop }}>
        {total > 0 && (
          <img
            src={safeFrames[index]}
            alt={alt}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover", // 🔥 CAMBIO IMPORTANTE
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        )}

        {showHint && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "rgba(0,0,0,0.6)",
              padding: "4px 8px",
              borderRadius: 20,
              fontSize: 12,
              color: "#fff",
            }}
          >
            Arrastra o rueda para girar
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            background: "rgba(0,0,0,0.6)",
            padding: "4px 8px",
            borderRadius: 20,
            fontSize: 12,
            color: "#fff",
          }}
        >
          {index + 1}/{total}
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "8px 0",
          background: "#000",
          color: "#fff",
          fontSize: 12,
        }}
      >
        {brandTagline}
      </div>
    </div>
  );
}