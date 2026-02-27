// /app/size-guide/page.tsx

import Link from "next/link";
import { getSizeGuide, SIZE_GUIDES } from "@/lib/size-guides";

function normalizeTab(tab?: string): "men" | "women" | "kids" {
  if (tab === "women") return "women";
  if (tab === "kids") return "kids";
  return "men";
}

export default function SizeGuidePage({
  searchParams,
}: {
  searchParams?: { tab?: string | string[] };
}) {
  const rawTab = Array.isArray(searchParams?.tab) ? searchParams?.tab?.[0] : searchParams?.tab;
  const tab = normalizeTab(rawTab);

  const guide = getSizeGuide(tab);
  const activeLabel = SIZE_GUIDES.find((g) => g.key === tab)?.title ?? "Hombre";

  return (
    <main style={{ background: "#0b0b10", minHeight: "100vh", color: "white" }}>
      {/* HERO (igual vibe /help) */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        {/* glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(1200px 600px at 15% 25%, rgba(247,198,0,0.22), transparent 55%), radial-gradient(900px 500px at 85% 30%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(900px 700px at 60% 120%, rgba(247,198,0,0.10), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent 55%)",
            filter: "saturate(1.05)",
          }}
        />
        {/* grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.1,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 1180,
            margin: "0 auto",
            padding: "56px 18px 22px",
          }}
        >
          {/* badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#f7c600",
                boxShadow: "0 0 0 6px rgba(247,198,0,0.15)",
              }}
            />
            <span style={{ fontSize: 12, letterSpacing: 0.6, color: "rgba(255,255,255,0.72)" }}>
              GUÍA DE TALLAS JUSP
            </span>
          </div>

          <h1
            style={{
              fontSize: 44,
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 900,
              letterSpacing: -0.6,
            }}
          >
            Guía de tallas
          </h1>

          <p
            style={{
              marginTop: 12,
              marginBottom: 18,
              maxWidth: 760,
              color: "rgba(255,255,255,0.78)",
              fontSize: 16,
            }}
          >
            {guide.subtitle || "Calzado, ropa y accesorios — tablas de referencia."}
          </p>

          {/* Control Bar (igual a search glass /help) */}
          <div
            style={{
              maxWidth: 980,
              borderRadius: 18,
              padding: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 80px rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* icon box */}
              <div
                aria-hidden
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: "rgba(247,198,0,0.16)",
                  border: "1px solid rgba(247,198,0,0.35)",
                  display: "grid",
                  placeItems: "center",
                  color: "#f7c600",
                  fontWeight: 900,
                }}
              >
                #
              </div>

              {/* tabs */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: "1 1 auto" }}>
                {SIZE_GUIDES.map((g) => {
                  const active = g.key === tab;
                  return (
                    <Link
                      key={g.key}
                      href={`/size-guide?tab=${g.key}`}
                      style={{
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        borderRadius: 999,
                        padding: "10px 12px",
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: 0.2,
                        border: active ? "1px solid rgba(247,198,0,0.55)" : "1px solid rgba(255,255,255,0.12)",
                        background: active ? "rgba(247,198,0,0.14)" : "rgba(0,0,0,0.35)",
                        color: active ? "#ffffff" : "rgba(255,255,255,0.88)",
                      }}
                    >
                      {g.title}
                    </Link>
                  );
                })}
              </div>

              {/* actions */}
              <Link
                href="/products"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  padding: "0 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "white",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  fontWeight: 800,
                }}
              >
                Volver a productos
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 14, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
            Tip: cambia entre <span style={{ color: "#f7c600", fontWeight: 900 }}>{activeLabel}</span> para ver sus
            tablas. Si necesitas ayuda, entra al{" "}
            <Link href="/help" style={{ color: "#f7c600", textDecoration: "none", fontWeight: 900 }}>
              Centro de ayuda
            </Link>
            .
          </div>
        </div>
      </section>

      {/* CONTENT CARD (misma card grande /help) */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 18px 64px" }}>
        <div
          style={{
            borderRadius: 26,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 18,
          }}
        >
          {guide.tables.length === 0 ? (
            <div
              style={{
                borderRadius: 18,
                background: "rgba(0,0,0,0.42)",
                border: "1px dashed rgba(255,255,255,0.16)",
                padding: 16,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              Aún no está cargada esta guía. Envíame las tablas y la dejamos exacta.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {guide.tables.map((t, tIdx) => (
                <div key={`${t.title}-${tIdx}`}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.2 }}>{t.title}</h2>
                      {t.subtitle ? (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)" }}>{t.subtitle}</div>
                      ) : null}
                    </div>

                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      Desliza horizontalmente para ver más tallas
                    </span>
                  </div>

                  <div
                    role="region"
                    aria-label={`Tabla de tallas ${t.title}`}
                    tabIndex={0}
                    style={{
                      borderRadius: 18,
                      background: "rgba(0,0,0,0.42)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow: "0 12px 44px rgba(0,0,0,0.45)",
                      overflow: "auto",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: Math.max(760, 120 + t.columns.length * 86),
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "14px 14px",
                              borderBottom: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(255,255,255,0.06)",
                              position: "sticky",
                              left: 0,
                              zIndex: 2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Talla
                          </th>
                          {t.columns.map((c, idx) => (
                            <th
                              key={`${c}-${idx}`}
                              style={{
                                textAlign: "center",
                                padding: "14px 14px",
                                borderBottom: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(255,255,255,0.06)",
                                whiteSpace: "nowrap",
                                fontWeight: 900,
                              }}
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {t.rows.map((row, rIdx) => {
                          const isLast = rIdx === t.rows.length - 1;
                          const values = (row.values ?? []).slice(0, t.columns.length);
                          const padded =
                            values.length < t.columns.length
                              ? values.concat(Array.from({ length: t.columns.length - values.length }).map(() => ""))
                              : values;

                          return (
                            <tr key={`${t.title}-${row.label}-${rIdx}`}>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "12px 14px",
                                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)",
                                  background: "rgba(255,255,255,0.03)",
                                  position: "sticky",
                                  left: 0,
                                  zIndex: 1,
                                  whiteSpace: "nowrap",
                                  fontWeight: 900,
                                }}
                              >
                                {row.label}
                              </th>
                              {padded.map((v, idx) => (
                                <td
                                  key={`${tIdx}-${rIdx}-${idx}`}
                                  style={{
                                    textAlign: "center",
                                    padding: "12px 14px",
                                    borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.88)",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {String(v ?? "")}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* chips (igual /help) */}
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              href="/help"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Centro de ayuda
            </Link>
            <Link
              href="/terms"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Términos
            </Link>
            <Link
              href="/privacy"
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Privacidad
            </Link>
            <Link
              href="/help/pqr"
              style={{
                textDecoration: "none",
                color: "#0b0b10",
                border: "1px solid rgba(247,198,0,0.55)",
                background: "#f7c600",
                padding: "10px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 950,
              }}
            >
              PQR / Reclamos
            </Link>
          </div>

          <div
            style={{
              marginTop: 18,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.12em",
              fontSize: 12,
              textTransform: "uppercase",
            }}
          >
            JUSP • ORIGINALES. DIRECTO.
          </div>
        </div>
      </section>
    </main>
  );
}
