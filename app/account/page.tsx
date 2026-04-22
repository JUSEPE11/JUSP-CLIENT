// app/account/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_AT, COOKIE_PROFILE, verifyAccessToken } from "@/lib/auth";
import { getProducts, type Product } from "@/lib/products";
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
  try {
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
  } catch {
    return null;
  }
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
      glow: "0 0 26px rgba(34,197,94,0.28)",
    };
  }

  if (completion >= 75) {
    return {
      label: "Perfil casi listo",
      accent: "#d4a574",
      soft: "rgba(212,165,116,0.14)",
      border: "rgba(212,165,116,0.30)",
      message: "Solo faltan unos detalles para mejorar aún más tus recomendaciones.",
      glow: "0 0 26px rgba(212,165,116,0.24)",
    };
  }

  return {
    label: "Perfil en progreso",
    accent: "#c79a63",
    soft: "rgba(199,154,99,0.14)",
    border: "rgba(199,154,99,0.28)",
    message: "Completar tu perfil ayuda a mostrarte mejores productos, tallas y colecciones.",
    glow: "0 0 26px rgba(199,154,99,0.22)",
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

function prettyInitial(name: string) {
  const clean = String(name || "").trim();
  return clean ? clean[0]!.toUpperCase() : "J";
}

function normalizeProfileText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildInterestTokens(profile: JsonRecord, interests: string[]) {
  const tokens = new Set<string>();

  const push = (value: unknown) => {
    const normalized = normalizeProfileText(value);
    if (!normalized) return;
    for (const token of normalized.split(/\s+/)) {
      if (token) tokens.add(token);
    }
  };

  push(profile?.segment);
  push(profile?.size);
  push(profile?.vibe);
  push(profile?.city);
  push(profile?.location);
  for (const interest of interests) push(interest);

  return Array.from(tokens);
}

function scoreProductForProfile(product: Product, profile: JsonRecord, tokens: string[]) {
  const haystack = normalizeProfileText(
    [
      product.title,
      product.name,
      product.brand,
      product.category,
      product.kind,
      product.gender,
      product.colors?.join(" "),
      product.tags?.join(" "),
      product.sport?.join(" "),
      product.models?.join(" "),
    ].join(" ")
  );

  if (!haystack) return 0;

  let score = 0;
  const segment = normalizeProfileText(profile?.segment);
  const vibe = normalizeProfileText(profile?.vibe);

  if (segment) {
    if (segment.includes("muj") && product.gender === "women") score += 80;
    if (segment.includes("hom") && product.gender === "men") score += 80;
    if ((segment.includes("nin") || segment.includes("kid")) && product.gender === "kids") score += 80;
  }

  if (vibe && haystack.includes(vibe)) score += 32;

  for (const token of tokens) {
    if (!token) continue;
    if (haystack.includes(token)) score += 18;
    if (normalizeProfileText(product.brand).startsWith(token)) score += 10;
  }

  if (Array.isArray(product.tags) && product.tags.length) score += 6;
  if (Array.isArray(product.colors) && product.colors.length) score += 4;
  return score;
}

function productHref(product: Product) {
  const rawId = String(product.slug || product.id || "").trim();
  const gender = String(product.gender || "").trim();
  const query = gender ? `?g=${gender}` : "";
  return `/product/${encodeURIComponent(rawId)}${query}`;
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
  const initial = prettyInitial(firstName);
  const products = await getProducts();
  const interestTokens = buildInterestTokens(profile, interests);
  const recommendedProducts = products
    .map((product) => ({ product, score: scoreProductForProfile(product, profile, interestTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || String(a.product.title || "").localeCompare(String(b.product.title || "")))
    .slice(0, 8)
    .map((entry) => entry.product);

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingTop: "calc(var(--jusp-header-h, 64px) + 22px)",
        paddingRight: 16,
        paddingBottom: 64,
        paddingLeft: 16,
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.98) 0%, rgba(246,244,241,1) 35%, rgba(237,234,230,1) 100%)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <section
          className="account-hero-shell"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 34,
            background:
              "linear-gradient(135deg, #040404 0%, #0c0c0c 36%, #141312 68%, #1b1816 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.22)",
            padding: 24,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 16% 18%, rgba(212,165,116,0.10) 0%, rgba(212,165,116,0) 34%), radial-gradient(circle at 82% 12%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 28%)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -100,
              right: -40,
              width: 340,
              height: 340,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 42%, rgba(255,255,255,0) 72%)",
              filter: "blur(8px)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -140,
              left: -60,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(212,165,116,0.14) 0%, rgba(212,165,116,0.02) 50%, rgba(212,165,116,0) 76%)",
              filter: "blur(18px)",
            }}
          />

          <div
            className="account-hero-grid"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.88fr)",
              gap: 20,
            }}
          >
            <div
              className="account-card account-main-card"
              style={{
                borderRadius: 30,
                border: "1px solid rgba(255,255,255,0.09)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
                backdropFilter: "blur(12px)",
                padding: 26,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
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
                      boxShadow: tone.glow,
                      display: "inline-block",
                    }}
                  />
                  Tu espacio JUSP
                </div>

                <div
                  className="account-avatar-badge"
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background:
                      "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.02) 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.28)",
                    color: "#f4e7d8",
                    fontWeight: 1000,
                    fontSize: 28,
                    letterSpacing: "-0.04em",
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,0.56)",
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  Bienvenido de vuelta
                </div>

                <h1
                  className="account-title"
                  style={{
                    margin: "12px 0 0",
                    fontSize: 52,
                    lineHeight: 0.94,
                    fontWeight: 1000,
                    color: "#fff",
                    letterSpacing: "-0.06em",
                  }}
                >
                  Hola,{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #f1dfcb 32%, #d4a574 78%, #b8844f 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {firstName}
                  </span>
                </h1>

                <p
                  style={{
                    marginTop: 16,
                    maxWidth: 700,
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.76)",
                  }}
                >
                  Aquí puedes ver tus pedidos, ajustar tu perfil y mantener una experiencia JUSP
                  más personalizada, clara y premium.
                </p>
              </div>

              <div
                style={{
                  marginTop: 24,
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
                    boxShadow: tone.glow,
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
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  Experiencia personalizada activa
                </span>
              </div>

              <div
                className="account-actions"
                style={{
                  marginTop: 28,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <Link
                  href="/mis-pedidos"
                  className="account-action-link account-action-link-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 52,
                    borderRadius: 999,
                    padding: "0 20px",
                    background: "linear-gradient(135deg, #fff 0%, #f6efe7 100%)",
                    color: "#111",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                    boxShadow: "0 16px 36px rgba(255,255,255,0.12)",
                  }}
                >
                  Ver pedidos
                </Link>

                <Link
                  href="/onboarding"
                  className="account-action-link"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 52,
                    borderRadius: 999,
                    padding: "0 20px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Editar perfil
                </Link>

                <Link
                  href="/mis-facturas"
                  className="account-action-link"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 52,
                    borderRadius: 999,
                    padding: "0 20px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Mis facturas
                </Link>

                <Link
                  href="/mis-cupones"
                  className="account-action-link"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 52,
                    borderRadius: 999,
                    padding: "0 20px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Mis cupones
                </Link>

                <form action={logoutAction} style={{ margin: 0 }} className="account-action-form">
                  <button
                    type="submit"
                    className="account-action-button"
                    style={{
                      minHeight: 52,
                      borderRadius: 999,
                      padding: "0 20px",
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.025)",
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
              className="account-card account-side-card"
              style={{
                position: "relative",
                borderRadius: 30,
                border: "1px solid rgba(255,255,255,0.10)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.03))",
                backdropFilter: "blur(12px)",
                padding: 22,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 18,
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(212,165,116,0.06) 0%, rgba(212,165,116,0) 40%, rgba(255,255,255,0.04) 100%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
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

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 34,
                      borderRadius: 999,
                      padding: "0 12px",
                      border: `1px solid ${tone.border}`,
                      background: tone.soft,
                      color: tone.accent,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {tone.label}
                  </span>
                </div>

                <div
                  className="account-progress-number"
                  style={{
                    marginTop: 14,
                    fontSize: 46,
                    fontWeight: 1000,
                    lineHeight: 1,
                    color: "#fff",
                    letterSpacing: "-0.06em",
                  }}
                >
                  {completion}%
                </div>

                <p
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.74)",
                  }}
                >
                  {tone.message}
                </p>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    height: 12,
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
                      background: `linear-gradient(90deg, ${tone.accent}, #f7e8d5 60%, #ffffff 100%)`,
                      boxShadow: tone.glow,
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.52)",
                    fontWeight: 900,
                  }}
                >
                  Progreso general
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.88)",
                    fontWeight: 900,
                  }}
                >
                  {completion}% completado
                </div>

                <div
                  className="account-mini-grid"
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  {[
                    { label: "Segmento", value: segment, icon: "◈" },
                    { label: "Talla", value: size, icon: "⌁" },
                    { label: "Estilo", value: vibe, icon: "✦" },
                    { label: "Ciudad", value: city, icon: "◉" },
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
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(255,255,255,0.06)",
                            color: "#d9b48c",
                            fontSize: 12,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
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
                      </div>
                      <div
                        style={{
                          marginTop: 10,
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
          }}
        >
          <div
            className="account-light-card"
            style={{
              borderRadius: 30,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
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
                color: "rgba(171,125,74,0.92)",
              }}
            >
              Tu experiencia JUSP
            </div>

            <h3
              className="account-section-title"
              style={{
                margin: "12px 0 0",
                fontSize: 28,
                lineHeight: 1.08,
                fontWeight: 1000,
                letterSpacing: "-0.045em",
                color: "#111",
              }}
            >
              Beneficios de un perfil completo.
            </h3>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {[
                { text: "Recomendaciones más precisas según tu estilo.", icon: "✦" },
                { text: "Mejor selección por talla y preferencias.", icon: "⌁" },
                { text: "Acceso rápido a tus pedidos y seguimiento.", icon: "◉" },
                { text: "Experiencia más alineada con tus intereses.", icon: "◈" },
              ].map((item) => (
                <div
                  key={item.text}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.06)",
                    background: "linear-gradient(180deg, #fff, #faf7f4)",
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: "linear-gradient(135deg, #fff 0%, #f3ebe2 100%)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      color: "#b07c49",
                      fontSize: 15,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#111",
                      lineHeight: 1.55,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="account-section-grid account-bottom-grid"
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 18,
          }}
        >
          <div
            className="account-light-card"
            style={{
              borderRadius: 30,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
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
                color: "rgba(171,125,74,0.92)",
              }}
            >
              Tus intereses
            </div>

            <h3
              className="account-section-title"
              style={{
                margin: "12px 0 0",
                fontSize: 30,
                fontWeight: 1000,
                letterSpacing: "-0.05em",
                color: "#111",
                lineHeight: 1.06,
                maxWidth: 520,
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
                      border: "1px solid rgba(0,0,0,0.07)",
                      background: "linear-gradient(180deg, #fff, #f5f1ed)",
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
                    border: "1px solid rgba(0,0,0,0.06)",
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

            <div
              style={{
                marginTop: 18,
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.06)",
                background: "linear-gradient(180deg, #faf7f4, #f4eeea)",
                padding: 16,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.06)",
                  color: "#b07c49",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                ✦
              </span>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "rgba(0,0,0,0.72)",
                }}
              >
                Completa tus intereses para recibir mejores sugerencias, colecciones y descubrimiento
                de producto.
              </div>
            </div>

            {recommendedProducts.length > 0 ? (
              <div
                style={{
                  marginTop: 22,
                  borderRadius: 24,
                  border: "1px solid rgba(0,0,0,0.06)",
                  background: "linear-gradient(180deg, #fff, #f7f2ed)",
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "#ab7d4a",
                      }}
                    >
                      Recomendado para ti
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 22,
                        fontWeight: 1000,
                        letterSpacing: "-0.04em",
                        color: "#111",
                      }}
                    >
                      Productos alineados con tu cuenta
                    </div>
                  </div>

                  <Link
                    href="/products"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 42,
                      borderRadius: 999,
                      padding: "0 16px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "#fff",
                      color: "#111",
                      fontSize: 13,
                      fontWeight: 900,
                      textDecoration: "none",
                    }}
                  >
                    Ver catálogo
                  </Link>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 14,
                  }}
                >
                  {recommendedProducts.map((product) => (
                    <Link
                      key={String(product.id)}
                      href={productHref(product)}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        borderRadius: 22,
                        overflow: "hidden",
                        border: "1px solid rgba(0,0,0,0.06)",
                        background: "#fff",
                        boxShadow: "0 16px 34px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: "1 / 1.08",
                          background: "linear-gradient(180deg, #f6f1eb, #fff)",
                        }}
                      >
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : null}
                      </div>

                      <div style={{ padding: 14 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: "rgba(0,0,0,0.5)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {product.brand || "JUSP"}
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 16,
                            lineHeight: 1.2,
                            fontWeight: 900,
                            color: "#111",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 38,
                          }}
                        >
                          {product.title}
                        </div>
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 22,
                            fontWeight: 1000,
                            letterSpacing: "-0.04em",
                            color: "#111",
                          }}
                        >
                          ${Math.round(Number(product.price) || 0).toLocaleString("es-CO")}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="account-dark-card"
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 30,
              background:
                "linear-gradient(135deg, #070707 0%, #111111 46%, #1a1612 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 28px 70px rgba(0,0,0,0.18)",
              padding: 22,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: -70,
                bottom: -80,
                width: 260,
                height: 260,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(212,165,116,0.18) 0%, rgba(212,165,116,0.04) 46%, rgba(212,165,116,0) 72%)",
                filter: "blur(20px)",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -60,
                right: -30,
                width: 180,
                height: 180,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.05)",
                opacity: 0.7,
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#d9b48c",
                }}
              >
                Qué sigue
              </div>

              <h3
                className="account-section-title"
                style={{
                  margin: "12px 0 0",
                  fontSize: 34,
                  fontWeight: 1000,
                  letterSpacing: "-0.055em",
                  color: "#fff",
                  lineHeight: 1.02,
                  maxWidth: 420,
                }}
              >
                Lleva tu experiencia JUSP al siguiente nivel.
              </h3>

              <p
                style={{
                  marginTop: 14,
                  fontSize: 14,
                  lineHeight: 1.78,
                  color: "rgba(255,255,255,0.74)",
                  maxWidth: 480,
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/onboarding"
                  className="account-action-link account-action-link-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 50,
                    borderRadius: 999,
                    padding: "0 18px",
                    background: "linear-gradient(135deg, #d6a875 0%, #c4915d 100%)",
                    color: "#111",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 950,
                    boxShadow: "0 18px 40px rgba(196,145,93,0.24)",
                  }}
                >
                  Actualizar perfil
                </Link>

                <div
                  style={{
                    color: "rgba(255,255,255,0.50)",
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 900,
                  }}
                >
                  JUSP
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .account-action-form {
          margin: 0;
        }

        .account-action-button {
          width: 100%;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .account-action-link {
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .account-card,
        .account-light-card,
        .account-dark-card {
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .account-avatar-badge {
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .account-action-link:hover,
        .account-action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
        }

        .account-card:hover,
        .account-light-card:hover,
        .account-dark-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.12);
        }

        .account-avatar-badge:hover {
          transform: scale(1.04);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 22px 50px rgba(0,0,0,0.32),
            0 0 24px rgba(212,165,116,0.14);
        }

        @media (max-width: 1024px) {
          .account-hero-grid,
          .account-section-grid,
          .account-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          main {
            padding-right: 12px !important;
            padding-left: 12px !important;
            padding-bottom: 40px !important;
            padding-top: calc(var(--jusp-header-h, 64px) + 14px) !important;
          }

          .account-hero-shell,
          .account-card,
          .account-light-card,
          .account-dark-card,
          .account-main-card,
          .account-side-card {
            border-radius: 24px !important;
          }

          .account-card,
          .account-light-card,
          .account-dark-card,
          .account-main-card,
          .account-side-card {
            padding: 18px !important;
          }

          .account-avatar-badge {
            width: 62px !important;
            height: 62px !important;
            font-size: 22px !important;
          }

          .account-title {
            font-size: 36px !important;
            line-height: 0.98 !important;
          }

          .account-progress-number {
            font-size: 34px !important;
          }

          .account-section-title {
            font-size: 25px !important;
            line-height: 1.1 !important;
          }

          .account-mini-grid {
            grid-template-columns: 1fr !important;
          }

          .account-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .account-action-link,
          .account-action-link-primary,
          .account-action-form,
          .account-action-button {
            width: 100% !important;
          }

          .account-action-link,
          .account-action-link-primary,
          .account-action-button {
            min-height: 48px !important;
            padding: 12px 16px !important;
          }

          .account-card:hover,
          .account-light-card:hover,
          .account-dark-card:hover,
          .account-action-link:hover,
          .account-action-button:hover,
          .account-avatar-badge:hover {
            transform: none !important;
          }
        }

        @media (max-width: 480px) {
          .account-title {
            font-size: 30px !important;
            letter-spacing: -0.05em !important;
          }

          .account-section-title {
            font-size: 22px !important;
          }

          .account-progress-number {
            font-size: 30px !important;
          }
        }
      `}</style>
    </main>
  );
}
