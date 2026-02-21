"use client";

import Sprite360Viewer from "../360-sprite/Sprite360Viewer";

export default function Demo360Page() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: 600,
          marginBottom: 30,
        }}
      >
        360° Viewer — JUSP
      </h1>

      <Sprite360Viewer
        spriteUrl="/360/nike-bra-black/sprite.jpeg"
        frames={12}
        aspectRatio="1/1"
        sensitivity={8}
        loop
        enableWheel
        label="JUSP"
        tagline="Originales. Directo."
      />
    </main>
  );
}