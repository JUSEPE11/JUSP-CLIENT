// app/account/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_AT, COOKIE_PROFILE, verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, any>;

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

async function readProfileFromDb(email: string) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("user_registry")
    .select("profile, name, email")
    .eq("email", email)
    .maybeSingle();

  if (error) return null;
  if (!data) return null;

  const profile =
    data.profile && typeof data.profile === "object" && !Array.isArray(data.profile)
      ? ({ ...(data.profile as JsonRecord) } as JsonRecord)
      : {};

  if (!profile.name && data.name) {
    profile.name = String(data.name).trim();
  }

  if (!profile.email && data.email) {
    profile.email = String(data.email).trim().toLowerCase();
  }

  return profile;
}

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
      message: "Tu experiencia JUSP ya está totalmente afinada.",
    };
  }

  if (completion >= 75) {
    return {
      label: "Perfil casi listo",
      accent: "#f59e0b",
      soft: "rgba(245,158,11,0.14)",
      border: "rgba(245,158,11,0.28)",
      message: "Solo faltan unos detalles para mejorar aún más tus recomendaciones.",
    };
  }

  return {
    label: "Perfil en progreso",
    accent: "#60a5fa",
    soft: "rgba(96,165,250,0.14)",
    border: "rgba(96,165,250,0.28)",
    message: "Completar tu perfil ayuda a mostrarte mejores productos, tallas y colecciones.",
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

  let decoded: any;

  try {
    decoded = await verifyAccessToken(at);
  } catch {
    redirect("/login");
  }

  const email = decoded?.email ? String(decoded.email).trim().toLowerCase() : "";
  if (!email) redirect("/login");

  const dbProfile = await readProfileFromDb(email);
  const cookieProfile = await readProfileCookie();

  const profile = dbProfile || cookieProfile;

  if (!profile) redirect("/onboarding");

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
      .filter(Boolean)[0] || "Member";

  const city =
    String(profile?.city ?? profile?.location ?? "").trim() || "Por definir";

  const progressWidth = `${Math.max(8, Math.min(completion, 100))}%`;

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingTop: "calc(var(--jusp-header-h, 64px) + 22px)",
        paddingRight: 16,
        paddingBottom: 64,
        paddingLeft: 16,
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.96) 0%, rgba(246,246,246,1) 32%, rgba(237,237,237,1) 100%)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 34,
            background: "linear-gradient(135deg, #050505 0%, #101010 48%, #181818 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.22)",
            padding: 24,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -90,
              right: -50,
              width: 250,
              height: 250,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              filter: "blur(34px)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -120,
              left: -60,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              filter: "blur(30px)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.92fr)",
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
                Tu espacio JUSP
              </div>

              <div style={{ marginTop: 20 }}>
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
                    margin: "10px 0 0",
                    fontSize: 44,
                    lineHeight: 0.98,
                    fontWeight: 1000,
                    color: "#fff",
                    letterSpacing: "-0.045em",
                  }}
                >
                  Hola, {firstName}
                </h1>

                <p
                  style={{
                    marginTop: 14,
                    maxWidth: 720,
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.78)",
                  }}
                >
                  Aquí puedes ver tus pedidos, ajustar tu perfil y mantener una experiencia JUSP
                  más personalizada, clara y premium.
                </p>
              </div>

              <div
                style={{
                  marginTop: 22,
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
                  Experiencia personalizada activa
                </span>
              </div>

              <div
                style={{
                  marginTop: 28,
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
                    minHeight: 50,
                    borderRadius: 999,
                    padding: "0 20px",
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
                    minHeight: 50,
                    borderRadius: 999,
                    padding: "0 20px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Editar perfil
                </Link>

                <form action={logoutAction} style={{ margin: 0 }}>
                  <button
                    type="submit"
                    style={{
                      minHeight: 50,
                      borderRadius: 999,
                      padding: "0 20px",
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
                    color: "rgba(255,255,255,0.60)",
                  }}
                >
                  Estado de tu perfil
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 42,
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
                    lineHeight: 1.72,
                    color: "rgba(255,255,255,0.74)",
                  }}
                >
                  {tone.message}
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
                    { label: "Estilo", value: vibe },
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
            gridTemplateColumns: "minmax(0, 1.02fr) minmax(0, 0.98fr)",
            gap: 18,
          }}
        >
          <div
            style={{
              borderRadius: 28,
              background: "rgba(255,255,255,0.88)",
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
              Tu perfil
            </div>

            <h2
              style={{
                margin: "10px 0 0",
                fontSize: 30,
                lineHeight: 1.04,
                fontWeight: 1000,
                letterSpacing: "-0.045em",
                color: "#111",
              }}
            >
              Preferencias que hacen tu experiencia más precisa.
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
                  title: "Talla base",
                  text: size,
                },
                {
                  title: "Tu estilo",
                  text: vibe,
                },
                {
                  title: "Segmento",
                  text: segment,
                },
                {
                  title: "Ubicación",
                  text: city,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    borderRadius: 22,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,247,247,0.96))",
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "rgba(0,0,0,0.48)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 18,
                      fontWeight: 950,
                      color: "#111",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.text}
                  </div>
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
              Tu experiencia JUSP
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {[
                "Recomendaciones más precisas según tu estilo.",
                "Mejor selección por talla y preferencias.",
                "Acceso rápido a tus pedidos y seguimiento.",
                "Experiencia más alineada con tus intereses.",
              ].map((text) => (
                <div
                  key={text}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(0,0,0,0.02)",
                    padding: 16,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#111",
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#111",
                      lineHeight: 1.55,
                    }}
                  >
                    {text}
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
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
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
              Intereses
            </div>

            <h3
              style={{
                margin: "10px 0 0",
                fontSize: 26,
                fontWeight: 1000,
                letterSpacing: "-0.04em",
                color: "#111",
                lineHeight: 1.08,
              }}
            >
              Esto ayuda a afinar lo que ves dentro de JUSP.
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
                      minHeight: 40,
                      borderRadius: 999,
                      padding: "0 14px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "linear-gradient(180deg, #fff, #f5f5f5)",
                      color: "#111",
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
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(0,0,0,0.02)",
                    padding: 16,
                    color: "rgba(0,0,0,0.68)",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  Aún no has definido tus intereses. Completar esa parte mejora tus sugerencias,
                  colecciones y descubrimiento de producto.
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              borderRadius: 28,
              background: "linear-gradient(135deg, #090909 0%, #111111 50%, #191919 100%)",
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
              Qué sigue
            </div>

            <h3
              style={{
                margin: "10px 0 0",
                fontSize: 26,
                fontWeight: 1000,
                letterSpacing: "-0.045em",
                color: "#fff",
                lineHeight: 1.08,
              }}
            >
              Lleva tu experiencia JUSP al siguiente nivel.
            </h3>

            <p
              style={{
                marginTop: 14,
                fontSize: 14,
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.74)",
              }}
            >
              Ajusta tu perfil para descubrir productos más alineados contigo, mejorar tu selección
              por talla y hacer que tu experiencia se sienta aún más personalizada.
            </p>

            <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
              {[
                "Completa los detalles que faltan en tu perfil.",
                "Afina tu talla base y tu estilo principal.",
                "Mejora la precisión de tus recomendaciones.",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    padding: 14,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 800,
                    lineHeight: 1.55,
                  }}
                >
                  {item}
                </div>
              ))}
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
                  minHeight: 48,
                  borderRadius: 999,
                  padding: "0 18px",
                  background: "#fff",
                  color: "#111",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 950,
                }}
              >
                Actualizar perfil
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}