// app/account/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_AT, COOKIE_PROFILE, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

async function readProfileCookie() {
  const store = await cookies();
  const raw = store.get(COOKIE_PROFILE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(safeDecode(raw));
  } catch {
    return null;
  }
}

/**
 * Logout local por Server Action:
 * - borra cookies HttpOnly del host actual
 * - evita navegar a JSON
 * - redirige a /login
 */
async function logoutAction() {
  "use server";

  const store = await cookies();

  store.set(COOKIE_AT, "", { path: "/", maxAge: 0 });
  store.set(COOKIE_PROFILE, "", { path: "/", maxAge: 0 });

  store.set(COOKIE_AT, "", { path: "/", expires: new Date(0) });
  store.set(COOKIE_PROFILE, "", { path: "/", expires: new Date(0) });

  redirect("/login");
}

function profileCompletion(profile: any) {
  let done = 0;
  const total = 4;

  if (profile?.segment) done++;
  if (profile?.size) done++;
  if (Array.isArray(profile?.interests) && profile.interests.length > 0) done++;
  if (profile?.vibe) done++;

  return Math.round((done / total) * 100);
}

function completionTone(completion: number) {
  if (completion >= 100) {
    return {
      label: "Perfil completo",
      accent: "#22c55e",
      soft: "rgba(34,197,94,0.14)",
      border: "rgba(34,197,94,0.28)",
    };
  }

  if (completion >= 75) {
    return {
      label: "Perfil muy completo",
      accent: "#f59e0b",
      soft: "rgba(245,158,11,0.14)",
      border: "rgba(245,158,11,0.28)",
    };
  }

  return {
    label: "Perfil en progreso",
    accent: "#60a5fa",
    soft: "rgba(96,165,250,0.14)",
    border: "rgba(96,165,250,0.28)",
  };
}

function toList(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function niceValue(value: any, fallback = "Aún no definido") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

export default async function AccountPage() {
  const store = await cookies();

  const at = store.get(COOKIE_AT)?.value;
  if (!at) redirect("/login");

  try {
    await verifyAccessToken(at);
  } catch {
    redirect("/login");
  }

  const profile = await readProfileCookie();
  if (!profile) redirect("/onboarding");

  const role = profile?.role ? String(profile.role) : "User";
  const userId = profile?.id ? String(profile.id) : null;
  const shortId = userId ? `${userId.slice(0, 8)}…` : "—";

  const completion = profileCompletion(profile);
  const tone = completionTone(completion);

  const segment = niceValue(profile?.segment);
  const size = niceValue(profile?.size);
  const vibe = niceValue(profile?.vibe);
  const interests = toList(profile?.interests);

  const firstName =
    String(profile?.first_name ?? profile?.name ?? profile?.full_name ?? "")
      .trim()
      .split(" ")
      .filter(Boolean)[0] || "JUSP Member";

  const email =
    String(profile?.email ?? profile?.customer_email ?? "").trim() || "Cuenta protegida";
  const city =
    String(profile?.city ?? profile?.location ?? "").trim() || "Ubicación no definida";

  const progressWidth = `${Math.max(8, Math.min(completion, 100))}%`;

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingTop: "calc(var(--jusp-header-h, 64px) + 20px)",
        paddingRight: 16,
        paddingBottom: 48,
        paddingLeft: 16,
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.92) 0%, rgba(248,248,248,1) 30%, rgba(239,239,239,1) 100%)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            background:
              "linear-gradient(135deg, #050505 0%, #0f0f0f 45%, #171717 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.22)",
            padding: 24,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -80,
              right: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              filter: "blur(30px)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -100,
              left: -40,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              filter: "blur(24px)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.9fr)",
              gap: 18,
            }}
          >
            <div
              style={{
                borderRadius: 28,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                backdropFilter: "blur(10px)",
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "8px 12px",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: tone.accent,
                    boxShadow: `0 0 16px ${tone.accent}`,
                    display: "inline-block",
                  }}
                />
                Cuenta protegida
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,0.68)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Bienvenido de vuelta
                </div>

                <h1
                  style={{
                    margin: "8px 0 0",
                    fontSize: 42,
                    lineHeight: 1,
                    fontWeight: 1000,
                    color: "#fff",
                    letterSpacing: "-0.04em",
                  }}
                >
                  Mi cuenta
                </h1>

                <p
                  style={{
                    marginTop: 14,
                    maxWidth: 700,
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.76)",
                  }}
                >
                  Sesión verificada por <b style={{ color: "#fff" }}>cookies HttpOnly</b>. Tu
                  cuenta está lista para personalizar catálogo, recomendaciones, pedidos y
                  experiencia JUSP.
                </p>
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    padding: "10px 14px",
                    border: `1px solid ${tone.border}`,
                    background: tone.soft,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: tone.accent,
                      display: "inline-block",
                    }}
                  />
                  {tone.label} · {completion}%
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    padding: "10px 14px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  ID: {shortId}
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    padding: "10px 14px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  Rol: {role}
                </span>
              </div>

              <div
                style={{
                  marginTop: 26,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <Link
                  href="/mis-pedidos"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 48,
                    borderRadius: 999,
                    padding: "0 18px",
                    background: "#fff",
                    color: "#111",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                    boxShadow: "0 10px 30px rgba(255,255,255,0.14)",
                  }}
                >
                  Ver pedidos
                </Link>

                <Link
                  href="/onboarding"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 48,
                    borderRadius: 999,
                    padding: "0 18px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Mejorar perfil
                </Link>

                <form action={logoutAction} style={{ margin: 0 }}>
                  <button
                    type="submit"
                    style={{
                      minHeight: 48,
                      borderRadius: 999,
                      padding: "0 18px",
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.02)",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>

            <div
              style={{
                borderRadius: 28,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
                backdropFilter: "blur(10px)",
                padding: 22,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.62)",
                  }}
                >
                  Estado del perfil
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 40,
                    fontWeight: 1000,
                    lineHeight: 1,
                    color: "#fff",
                    letterSpacing: "-0.05em",
                  }}
                >
                  {completion}%
                </div>

                <p
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.74)",
                  }}
                >
                  Tu cuenta ya está protegida. Completar bien tus gustos mejora la precisión del
                  catálogo, recomendaciones y experiencia de compra.
                </p>
              </div>

              <div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: progressWidth,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${tone.accent}, #ffffff)`,
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  {[
                    { label: "Segmento", value: segment },
                    { label: "Talla", value: size },
                    { label: "Vibe", value: vibe },
                    { label: "Ciudad", value: city },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.54)",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 15,
                          fontWeight: 900,
                          color: "#fff",
                          lineHeight: 1.35,
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
            gap: 18,
          }}
        >
          <div
            style={{
              borderRadius: 28,
              background: "rgba(255,255,255,0.84)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.06)",
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.50)",
              }}
            >
              Resumen de cuenta
            </div>

            <h2
              style={{
                margin: "10px 0 0",
                fontSize: 28,
                lineHeight: 1.05,
                fontWeight: 1000,
                letterSpacing: "-0.04em",
                color: "#111",
              }}
            >
              Todo lo importante, claro y premium.
            </h2>

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  title: "Cuenta verificada",
                  text: "Protección activa con cookies HttpOnly como fuente de verdad.",
                },
                {
                  title: "Experiencia personalizada",
                  text: "Tu perfil ayuda a mostrar mejor catálogo, talla y estilo.",
                },
                {
                  title: "Historial listo",
                  text: "Acceso rápido a pedidos, trazabilidad y seguimiento.",
                },
                {
                  title: "Base para recomendaciones",
                  text: "Tus intereses y vibe alimentan una experiencia más precisa.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    borderRadius: 22,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,248,248,0.96))",
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 950,
                      color: "#111",
                      lineHeight: 1.25,
                    }}
                  >
                    {item.title}
                  </div>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "rgba(0,0,0,0.68)",
                    }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 28,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.06)",
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.50)",
              }}
            >
              Tu identidad JUSP
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {[
                { label: "Nombre", value: firstName },
                { label: "Correo", value: email },
                { label: "Rol", value: role },
                { label: "ID visible", value: shortId },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(0,0,0,0.02)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(0,0,0,0.48)",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 15,
                      fontWeight: 900,
                      color: "#111",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
            gap: 18,
          }}
        >
          <div
            style={{
              borderRadius: 28,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.06)",
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.50)",
              }}
            >
              ADN de estilo
            </div>

            <h3
              style={{
                margin: "10px 0 0",
                fontSize: 24,
                fontWeight: 1000,
                letterSpacing: "-0.04em",
                color: "#111",
                lineHeight: 1.08,
              }}
            >
              Perfil pensado para una experiencia más inteligente.
            </h3>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {[
                { label: "Segmento", value: segment },
                { label: "Talla base", value: size },
                { label: "Vibe", value: vibe },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 20,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "linear-gradient(180deg, #fff, #f6f6f6)",
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(0,0,0,0.46)",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 17,
                      fontWeight: 950,
                      color: "#111",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 28,
              background: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 28px 70px rgba(0,0,0,0.18)",
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              Intereses destacados
            </div>

            <h3
              style={{
                margin: "10px 0 0",
                fontSize: 24,
                fontWeight: 1000,
                letterSpacing: "-0.04em",
                color: "#fff",
                lineHeight: 1.08,
              }}
            >
              Esto ayuda a afinar tu experiencia JUSP.
            </h3>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {interests.length > 0 ? (
                interests.map((interest) => (
                  <span
                    key={interest}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 38,
                      borderRadius: 999,
                      padding: "0 14px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <div
                  style={{
                    width: "100%",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    padding: 16,
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  Aún no hay intereses definidos. Completar tu onboarding mejora la selección de
                  productos, colecciones y recomendaciones.
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 18,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: 18,
              }}
            >
              <Link
                href="/onboarding"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 46,
                  borderRadius: 999,
                  padding: "0 18px",
                  background: "#fff",
                  color: "#111",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 950,
                }}
              >
                Ajustar mi perfil
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}