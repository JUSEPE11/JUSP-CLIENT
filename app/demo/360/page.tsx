import Jusp360Viewer from "./Jusp360Viewer";
import { build360Frames } from "./build360Frames";

export default function Page() {
  const slug = "nike-bra-black";

  // 01-05 son .jpeg, 06-12 son .jpg (según tu captura)
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
    <main style={{ minHeight: "100vh", background: "#ffffff", padding: 24 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          360° Viewer — JUSP
        </h1>

        {/* DEBUG VISIBLE */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            background: "#f9fafb",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          <div>
            <b>slug:</b> {slug}
          </div>
          <div>
            <b>frames:</b> {frames.length}
          </div>
          <div>
            <b>frame[0]:</b> {frames[0]}
          </div>
          <div>
            <b>frame[5]:</b> {frames[5]}
          </div>
          <div style={{ marginTop: 6 }}>
            Prueba directa: abre estas URLs:
            <div style={{ marginTop: 4 }}>
              <b>{frames[0]}</b>
            </div>
            <div style={{ marginTop: 4 }}>
              <b>{frames[5]}</b>
            </div>
          </div>
        </div>

        <div style={{ border: "2px solid #111827", borderRadius: 16, padding: 12 }}>
          <Jusp360Viewer
            frames={frames}
            alt="Producto 360"
            aspectRatio="1/1"
            preload="eager"
            sensitivity={8}
            loop
            showHint
            brandLabel="JUSP"
            brandTagline="Originales. Directo."
            enableWheel
          />
        </div>

        <p style={{ marginTop: 16, color: "#4b5563", fontSize: 14 }}>
          Carpeta esperada:
          <br />
          <b>public/360/{slug}/</b>
          <br />
          Archivos:
          <br />
          <b>01.jpeg..05.jpeg</b> y <b>06.jpg..12.jpg</b>
        </p>
      </div>
    </main>
  );
}