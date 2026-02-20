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
 * ✅ Logout "local" (mismo host) vía Server Action
 * - Evita navegar a /api/auth/logout (pantalla JSON)
 * - Borra cookies HttpOnly en el host actual
 * - Redirige a /login
 */
async function logoutAction() {
  "use server";
  const store = await cookies();

  // Borrado explícito (más fiable que delete en algunos casos)
  // Importante: path "/" para que coincida con la cookie original.
  store.set(COOKIE_AT, "", { path: "/", maxAge: 0 });
  store.set(COOKIE_PROFILE, "", { path: "/", maxAge: 0 });

  // Por si tu cookie fue seteada con "expires" y no respeta maxAge (extra hardening)
  store.set(COOKIE_AT, "", { path: "/", expires: new Date(0) });
  store.set(COOKIE_PROFILE, "", { path: "/", expires: new Date(0) });

  redirect("/login");
}

export default async function AccountPage() {
  const store = await cookies();

  // 1️⃣ Gate duro: si no hay access token -> login
  const at = store.get(COOKIE_AT)?.value;
  if (!at) redirect("/login");

  // 2️⃣ Verifica token (si está vencido/invalid -> login)
  try {
    await verifyAccessToken(at);
  } catch {
    redirect("/login");
  }

  // 3️⃣ Si aún no hay profile -> onboarding
  const profile = await readProfileCookie();
  if (!profile) redirect("/onboarding");

  const role = profile?.role ? String(profile.role) : "User";
  const userId = profile?.id ? String(profile.id) : null;

  const completion = (() => {
    let done = 0;
    const total = 4;
    if (profile?.segment) done++;
    if (profile?.size) done++;
    if (Array.isArray(profile?.interests) && profile.interests.length > 0) done++;
    if (profile?.vibe) done++;
    return Math.round((done / total) * 100);
  })();

  const shortId = userId ? `${userId.slice(0, 8)}…` : "—";

  return (
    <main
      style={{
        paddingTop: "calc(var(--jusp-header-h, 64px) + 18px)",
        padding: "18px 16px 32px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            borderRadius: 20,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 22px 60px rgba(0,0,0,0.08)",
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
                  fontWeight: 900,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(0,0,0,0.55)",
                }}
              >
                Cuenta
              </div>

              <h1 style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: "#111" }}>
                Mi cuenta
              </h1>

              <p style={{ marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.70)", lineHeight: 1.5 }}>
                Sesión verificada por <b>cookies HttpOnly</b>. Tu perfil está listo para personalizar catálogo y recomendaciones.
              </p>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "rgba(0,0,0,0.03)",
                    borderRadius: 999,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  ● Perfil muy completo · {completion}%
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "rgba(0,0,0,0.03)",
                    borderRadius: 999,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  ID: {shortId}
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "rgba(0,0,0,0.03)",
                    borderRadius: 999,
                    padding: "7px 10px",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  Rol: {role}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href="/mis-pedidos"
                style={{
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "#fff",
                  borderRadius: 999,
                  padding: "10px 12px",
                  fontWeight: 950,
                  fontSize: 13,
                  textDecoration: "none",
                  color: "#111",
                }}
              >
                Ver pedidos
              </Link>

              {/* ✅ Server Action: no navega al JSON, borra cookies y redirige */}
              <form action={logoutAction}>
                <button
                  type="submit"
                  style={{
                    background: "#111",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "10px 12px",
                    fontWeight: 950,
                    fontSize: 13,
                    border: 0,
                    cursor: "pointer",
                  }}
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}