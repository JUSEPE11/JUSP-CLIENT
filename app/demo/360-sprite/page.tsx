import Sprite360Viewer from "./Sprite360Viewer";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f4f5",
        padding: "32px 16px",
      }}
    >
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "clamp(280px, 92vw, 440px)", maxWidth: 440 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              textAlign: "center",
              margin: "0 0 18px 0",
              color: "#111827",
            }}
          >
            360° Sprite — JUSP
          </h1>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 14,
              boxShadow: "0 18px 50px rgba(0,0,0,0.10)",
              overflow: "hidden",
            }}
          >
            <Sprite360Viewer
              spriteUrl="/360/nike-bra-black/sprite.jpg"
              frames={12}
              aspectRatio="4/5"
              sensitivity={10}
              loop
              enableWheel
              label="JUSP"
              tagline="Originales. Directo."
            />
          </div>

          <p style={{ marginTop: 12, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
            Debe existir este archivo:
            <br />
            <b>public/360/nike-bra-black/sprite.jpg</b>
          </p>
        </div>
      </div>
    </main>
  );
}