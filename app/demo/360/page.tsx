import Jusp360Viewer from "./Jusp360Viewer";
import { build360Frames } from "./build360Frames";

export default function Page() {
  const slug = "nike-bra-black";

  // Según tu carpeta: 01-05 .jpeg y 06-12 .jpg
  const extByIndex: Record<number, "jpeg" | "jpg"> = {
    1: "jpeg",
    2: "jpeg",
    3: "jpeg",
    4: "jpeg",
    5: "jpeg",
    6: "jpg",
    7: "jpg",
    8: "jpg",
    9: "jpg",
    10: "jpg",
    11: "jpg",
    12: "jpg",
  };

  const frames = build360Frames({
    slug,
    count: 12,
    filePrefix: "",
    pad: 2,
    extByIndex,
    defaultExt: "jpg",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f4f5",
        padding: "32px 16px",
      }}
    >
      {/* Wrapper que SIEMPRE centra y limita */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* Contenedor con ancho forzado (clamp) */}
        <div
          style={{
            width: "clamp(280px, 92vw, 440px)",
            maxWidth: "440px",
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              textAlign: "center",
              margin: "0 0 18px 0",
              color: "#111827",
            }}
          >
            360° Viewer — JUSP
          </h1>

          {/* Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 14,
              boxShadow: "0 18px 50px rgba(0,0,0,0.10)",
              overflow: "hidden", // 👈 corta cualquier desborde sí o sí
            }}
          >
            {/* Wrapper extra para forzar ancho */}
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                margin: "0 auto",
                overflow: "hidden",
                borderRadius: 16,
              }}
            >
              <Jusp360Viewer
                frames={frames}
                alt="Producto 360"
                aspectRatio="4/5" // vertical
                sensitivity={8}
                loop
                enableWheel
                showHint
                brandLabel="JUSP"
                brandTagline="Originales. Directo."
              />
            </div>
          </div>

          {/* Nota */}
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            Frames: <b>{frames.length}</b> — ejemplo: <b>{frames[0]}</b>
          </div>
        </div>
      </div>
    </main>
  );
}