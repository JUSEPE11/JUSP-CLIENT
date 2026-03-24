"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "@/app/components/store";

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

// COP -> cents (Wompi pide amount-in-cents)
function centsCOP(cop: number) {
  return Math.round(cop) * 100;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("es-CO", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDeliveryEstimate() {
  const now = new Date();

  const min = new Date(now);
  min.setDate(min.getDate() + 15);

  const max = new Date(now);
  max.setDate(max.getDate() + 20);

  return `${formatDate(min)} - ${formatDate(max)}`;
}

const SHIPPING_KEY = "jusp_checkout_shipping_v1";
const SHIPPING_PRICE = 99990;
const HALF_SHIPPING_MIN_ITEMS = 3;
const FREE_SHIPPING_MIN_ITEMS = 6;
const CREATE_ORDER_ENDPOINT = "/api/orders";

const COLOMBIA_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

const COLOMBIA_CITIES_BY_DEPARTMENT: Record<(typeof COLOMBIA_DEPARTMENTS)[number], string[]> = {
  Amazonas: ["Leticia", "Puerto Nariño"],
  Antioquia: [
    "Medellín",
    "Bello",
    "Itagüí",
    "Envigado",
    "Sabaneta",
    "Rionegro",
    "Apartadó",
    "Turbo",
    "Santa Fe de Antioquia",
    "La Ceja",
    "Copacabana",
  ],
  Arauca: ["Arauca", "Arauquita", "Saravena", "Tame"],
  Atlántico: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Sabanalarga", "Baranoa"],
  "Bogotá D.C.": ["Bogotá"],
  Bolívar: ["Cartagena", "Magangué", "Turbaco", "Arjona", "El Carmen de Bolívar", "Mompós"],
  Boyacá: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Villa de Leyva"],
  Caldas: ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"],
  Caquetá: ["Florencia", "San Vicente del Caguán", "Puerto Rico", "El Doncello"],
  Casanare: ["Yopal", "Aguazul", "Villanueva", "Paz de Ariporo", "Tauramena"],
  Cauca: ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Patía", "Piendamó"],
  Cesar: ["Valledupar", "Aguachica", "Bosconia", "La Jagua de Ibirico", "Curumaní"],
  Chocó: ["Quibdó", "Istmina", "Tadó", "Condoto", "Riosucio"],
  Córdoba: ["Montería", "Cereté", "Lorica", "Sahagún", "Montelíbano", "Planeta Rica"],
  Cundinamarca: [
    "Soacha",
    "Chía",
    "Zipaquirá",
    "Facatativá",
    "Girardot",
    "Mosquera",
    "Funza",
    "Madrid",
    "Cajicá",
    "Fusagasugá",
  ],
  Guainía: ["Inírida"],
  Guaviare: ["San José del Guaviare", "Calamar", "El Retorno"],
  Huila: ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "Fonseca", "San Juan del Cesar"],
  Magdalena: ["Santa Marta", "Ciénaga", "Fundación", "Plato", "Aracataca"],
  Meta: ["Villavicencio", "Acacías", "Granada", "Puerto López", "Restrepo"],
  Nariño: ["Pasto", "Tumaco", "Ipiales", "Túquerres", "La Unión"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario", "Los Patios"],
  Putumayo: ["Mocoa", "Puerto Asís", "Sibundoy", "Orito", "Villagarzón"],
  Quindío: ["Armenia", "Calarcá", "La Tebaida", "Montenegro", "Quimbaya"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia", "Belén de Umbría"],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  Santander: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
  Sucre: ["Sincelejo", "Corozal", "Sampués", "Tolú", "San Marcos"],
  Tolima: ["Ibagué", "Espinal", "Melgar", "Honda", "Líbano"],
  "Valle del Cauca": [
    "Cali",
    "Palmira",
    "Buenaventura",
    "Tuluá",
    "Buga",
    "Cartago",
    "Jamundí",
    "Yumbo",
    "Florida",
    "Candelaria",
  ],
  Vaupés: ["Mitú"],
  Vichada: ["Puerto Carreño"],
};

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function sanitizeDocumentNumber(value: string, documentType: DocumentType | "") {
  if (documentType === "PAS") {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  return onlyDigits(value);
}

function hasAtLeastFiveDigits(value: string) {
  return onlyDigits(value).length >= 5;
}

type DocumentType = "CC" | "CE" | "NIT" | "PAS";

type Shipping = {
  fullName: string;
  email: string;
  documentType: DocumentType | "";
  documentNumber: string;
  phone: string;
  city: string;
  region: string;
  addressLine1: string;
  notes: string;
};

function emptyShipping(): Shipping {
  return {
    fullName: "",
    email: "",
    documentType: "",
    documentNumber: "",
    phone: "",
    city: "",
    region: "",
    addressLine1: "",
    notes: "",
  };
}

export default function CheckoutPage() {
  const { state, cartTotal, cartCount } = useStore();

  const [step, setStep] = useState<"envio" | "pago">("envio");
  const [busy, setBusy] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);

  const [ship, setShip] = useState<Shipping>(emptyShipping());

  const items = state.cart;
  const canContinue = cartCount > 0;
  const deliveryEstimate = useMemo(() => getDeliveryEstimate(), []);

  const selectedDepartmentCities = useMemo(() => {
    if (!ship.region) return [];
    return COLOMBIA_CITIES_BY_DEPARTMENT[ship.region as keyof typeof COLOMBIA_CITIES_BY_DEPARTMENT] ?? [];
  }, [ship.region]);

  const summary = useMemo(() => {
    let shipping = SHIPPING_PRICE;

    if (cartCount >= FREE_SHIPPING_MIN_ITEMS) {
      shipping = 0;
    } else if (cartCount >= HALF_SHIPPING_MIN_ITEMS) {
      shipping = Math.round(SHIPPING_PRICE * 0.5);
    }

    return {
      subtotal: cartTotal,
      shipping,
      total: cartTotal + shipping,
    };
  }, [cartTotal, cartCount]);

  const shippingLabel = useMemo(() => {
    if (summary.shipping === 0) return "Envío gratis";
    if (cartCount >= HALF_SHIPPING_MIN_ITEMS) return `Envío 50% OFF · $${moneyCOP(summary.shipping)}`;
    return `$${moneyCOP(summary.shipping)}`;
  }, [summary.shipping, cartCount]);

  const orderRef = useMemo(() => `JUSP-${Date.now()}`, []);

  const reservedUntilLabel = useMemo(() => {
    if (!reservedUntil) return null;
    const date = new Date(reservedUntil);
    if (Number.isNaN(date.getTime())) return null;
    return formatDateTime(date);
  }, [reservedUntil]);

  useEffect(() => {
    const prev = safeParse(localStorage.getItem(SHIPPING_KEY));
    if (prev && typeof prev === "object") {
      const nextRegion = String((prev as any).region || "");
      const nextCity = String((prev as any).city || "");
      const nextDocumentType = (
        ["CC", "CE", "NIT", "PAS"].includes(String((prev as any).documentType || ""))
          ? String((prev as any).documentType || "")
          : ""
      ) as DocumentType | "";

      const regionIsValid = COLOMBIA_DEPARTMENTS.includes(
        nextRegion as (typeof COLOMBIA_DEPARTMENTS)[number]
      );

      const cityIsValid = regionIsValid
        ? (COLOMBIA_CITIES_BY_DEPARTMENT[nextRegion as keyof typeof COLOMBIA_CITIES_BY_DEPARTMENT] ?? []).includes(
            nextCity
          )
        : false;

      setShip({
        fullName: String((prev as any).fullName || ""),
        email: String((prev as any).email || ""),
        documentType: nextDocumentType,
        documentNumber: sanitizeDocumentNumber(
          String((prev as any).documentNumber || ""),
          nextDocumentType
        ),
        phone: onlyDigits(String((prev as any).phone || "")),
        city: cityIsValid ? nextCity : "",
        region: regionIsValid ? nextRegion : "",
        addressLine1: String((prev as any).addressLine1 || ""),
        notes: String((prev as any).notes || ""),
      });
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { "cache-control": "no-store" },
        });

        if (!active) return;

        setIsAuthed(res.ok);
      } catch {
        if (!active) return;
        setIsAuthed(false);
      } finally {
        if (!active) return;
        setAuthLoading(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SHIPPING_KEY, JSON.stringify(ship));
    } catch {}
  }, [ship]);

  const documentNumberValid = useMemo(
    () => hasAtLeastFiveDigits(ship.documentNumber),
    [ship.documentNumber]
  );
  const phoneValid = useMemo(() => hasAtLeastFiveDigits(ship.phone), [ship.phone]);

  const shipOk = useMemo(() => {
    const fullName = ship.fullName.trim();
    const email = ship.email.trim();
    const documentType = ship.documentType.trim();
    const documentNumber = ship.documentNumber.trim();
    const phone = ship.phone.trim();
    const city = ship.city.trim();
    const address = ship.addressLine1.trim();
    const region = ship.region.trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    return Boolean(
      fullName &&
        email &&
        emailOk &&
        documentType &&
        documentNumber &&
        documentNumberValid &&
        phone &&
        phoneValid &&
        city &&
        address &&
        region
    );
  }, [ship, documentNumberValid, phoneValid]);

  function goToLogin() {
    const redirect = step === "pago" ? "/checkout?step=pago" : "/checkout";
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
  }

  function handleContinueToPayment() {
    if (!shipOk) return;

    if (authLoading) return;

    if (!isAuthed) {
      goToLogin();
      return;
    }

    setStep("pago");
  }

  async function payWithWompiRedirect() {
    if (busy || authLoading) return;

    if (!isAuthed) {
      goToLogin();
      return;
    }

    if (!shipOk) {
      alert(
        "Completa los datos obligatorios antes de pagar. El número de documento y el celular deben tener mínimo 5 números. En pasaporte se permiten letras y números."
      );
      setStep("envio");
      return;
    }

    setBusy(true);
    try {
      const amountInCents = centsCOP(summary.total);

      const payload = {
        amountInCents,
        currency: "COP",
        reference: orderRef,
        customer: {
          fullName: ship.fullName.trim(),
          email: ship.email.trim(),
          documentType: ship.documentType,
          documentNumber: ship.documentNumber.trim(),
          phone: ship.phone.trim(),
        },
        shipping: {
          fullName: ship.fullName.trim(),
          email: ship.email.trim(),
          documentType: ship.documentType,
          documentNumber: ship.documentNumber.trim(),
          phone: ship.phone.trim(),
          city: ship.city.trim(),
          region: ship.region.trim(),
          addressLine1: ship.addressLine1.trim(),
          notes: ship.notes.trim(),
          country: "CO",
        },
        items: items.map((it) => ({
          id: it.id,
          product_id: it.id,
          name: it.name,
          qty: it.qty,
          price: it.price,
          image: it.image ?? null,
          size: it.size ?? null,
          color: it.color ?? null,
        })),
        totals: {
          subtotal: summary.subtotal,
          shipping: summary.shipping,
          total: summary.total,
        },
      };

      const createRes = await fetch(CREATE_ORDER_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const createData = await createRes.json().catch(() => null);

      if (createRes.status === 401) {
        goToLogin();
        return;
      }

      if (!createRes.ok || !createData?.ok) {
        alert(createData?.error || "No se pudo crear tu orden antes de iniciar el pago.");
        return;
      }

      const res = await fetch("/api/wompi/checkout-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        goToLogin();
        return;
      }

      if (!res.ok || !data?.ok || !data?.checkoutUrl) {
        alert(data?.error || "No se pudo generar el link de pago.");
        return;
      }

      setReservedUntil(typeof data?.reservedUntil === "string" ? data.reservedUntil : null);

      window.location.href = data.checkoutUrl;
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <main className="root">
        <div className="wrap">
          <div className="top">
            <div>
              <div className="brand">JUSP</div>
              <h1 className="h1">Checkout</h1>
              <p className="sub">Resumen del pedido y datos de envío.</p>
            </div>
            <Link className="back" href="/products">
              ← Volver a productos
            </Link>
          </div>

          <div className="empty">
            <div className="eT">Tu carrito está vacío</div>
            <div className="eS">Agrega productos para continuar al checkout.</div>
            <Link className="go" href="/products">
              Ir a productos
            </Link>
          </div>
        </div>

        <style jsx>{baseCss}</style>
      </main>
    );
  }

  return (
    <main className="root">
      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand">JUSP</div>
            <h1 className="h1">Checkout</h1>
            <p className="sub">Resumen del pedido y datos de envío.</p>
          </div>
          <Link className="back" href="/products">
            ← Volver a productos
          </Link>
        </div>

        <div className="steps">
          <button className={`st ${step === "envio" ? "on" : ""}`} type="button" onClick={() => setStep("envio")}>
            1. Envío
          </button>
          <button
            className={`st ${step === "pago" ? "on" : ""}`}
            type="button"
            onClick={handleContinueToPayment}
            title={!isAuthed && !authLoading ? "Debes iniciar sesión para entrar a pago" : ""}
          >
            2. Pago
          </button>
        </div>

        <div className="grid">
          <section className="left">
            {step === "envio" ? (
              <div className="card">
                <div className="cT">Datos de envío</div>
                <div className="cS">Esto es obligatorio para continuar al pago.</div>

                <div className="form">
                  <label className="f">
                    <span>Nombre completo *</span>
                    <input
                      value={ship.fullName}
                      onChange={(e) => setShip((s) => ({ ...s, fullName: e.target.value }))}
                      placeholder="Ej: Breiner Paz"
                    />
                  </label>

                  <label className="f">
                    <span>Correo electrónico *</span>
                    <input
                      value={ship.email}
                      onChange={(e) => setShip((s) => ({ ...s, email: e.target.value }))}
                      placeholder="Ej: correo@ejemplo.com"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                    />
                  </label>

                  <div className="two">
                    <label className="f">
                      <span>Tipo de documento *</span>
                      <select
                        value={ship.documentType}
                        onChange={(e) =>
                          setShip((s) => ({
                            ...s,
                            documentType: e.target.value as DocumentType | "",
                            documentNumber: sanitizeDocumentNumber(
                              s.documentNumber,
                              e.target.value as DocumentType | ""
                            ),
                          }))
                        }
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="CC">Cédula de ciudadanía</option>
                        <option value="CE">Cédula de extranjería</option>
                        <option value="NIT">NIT</option>
                        <option value="PAS">Pasaporte</option>
                      </select>
                    </label>

                    <label className="f">
                      <span>Número de documento *</span>
                      <input
                        value={ship.documentNumber}
                        onChange={(e) =>
                          setShip((s) => ({
                            ...s,
                            documentNumber: sanitizeDocumentNumber(e.target.value, s.documentType),
                          }))
                        }
                        placeholder={ship.documentType === "PAS" ? "Ej: AB12345" : "Ej: 1234567890"}
                        inputMode={ship.documentType === "PAS" ? "text" : "numeric"}
                        autoComplete="off"
                      />
                      {ship.documentNumber.trim().length > 0 && !documentNumberValid && (
                        <small className="err">
                          {ship.documentType === "PAS"
                            ? "Debe contener mínimo 5 números. En pasaporte se permiten letras y números."
                            : "Debe tener mínimo 5 números."}
                        </small>
                      )}
                    </label>
                  </div>

                  <label className="f">
                    <span>Teléfono *</span>
                    <input
                      value={ship.phone}
                      onChange={(e) =>
                        setShip((s) => ({
                          ...s,
                          phone: onlyDigits(e.target.value),
                        }))
                      }
                      placeholder="Ej: 3001234567"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    {ship.phone.trim().length > 0 && !phoneValid && (
                      <small className="err">Debe tener mínimo 5 números.</small>
                    )}
                  </label>

                  <div className="two">
                    <label className="f">
                      <span>Departamento *</span>
                      <select
                        value={ship.region}
                        onChange={(e) =>
                          setShip((s) => ({
                            ...s,
                            region: e.target.value,
                            city: "",
                          }))
                        }
                      >
                        <option value="">Selecciona un departamento</option>
                        {COLOMBIA_DEPARTMENTS.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="f">
                      <span>Ciudad *</span>
                      <select
                        value={ship.city}
                        onChange={(e) => setShip((s) => ({ ...s, city: e.target.value }))}
                        disabled={!ship.region}
                      >
                        <option value="">
                          {!ship.region ? "Primero selecciona un departamento" : "Selecciona una ciudad"}
                        </option>
                        {selectedDepartmentCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {ship.region && selectedDepartmentCities.length > 0 ? (
                    <div className="cityMegaMenu">
                      <div className="cityMegaTitle">Ciudades disponibles en {ship.region}</div>
                      <div className="cityMegaGrid">
                        {selectedDepartmentCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            className={`cityChip ${ship.city === city ? "active" : ""}`}
                            onClick={() => setShip((s) => ({ ...s, city }))}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label className="f">
                    <span>Dirección *</span>
                    <input
                      value={ship.addressLine1}
                      onChange={(e) => setShip((s) => ({ ...s, addressLine1: e.target.value }))}
                      placeholder="Calle / Carrera, número, barrio…"
                    />
                  </label>

                  <label className="f">
                    <span>Notas (opcional)</span>
                    <textarea
                      value={ship.notes}
                      onChange={(e) => setShip((s) => ({ ...s, notes: e.target.value }))}
                      placeholder="Apto / torre / instrucciones de entrega…"
                    />
                  </label>
                </div>

                {!authLoading && !isAuthed && (
                  <div className="authNote">Debes iniciar sesión antes de pasar a pago.</div>
                )}

                <button
                  className="cta"
                  type="button"
                  onClick={handleContinueToPayment}
                  disabled={!canContinue || !shipOk || authLoading}
                  title={
                    !shipOk
                      ? "Completa el envío. Documento y celular deben tener mínimo 5 números. En pasaporte se permiten letras."
                      : authLoading
                        ? "Validando sesión..."
                        : ""
                  }
                >
                  {authLoading ? "Validando sesión…" : !isAuthed ? "Iniciar sesión para pagar" : "Continuar a pago"}
                </button>
              </div>
            ) : (
              <div className="card">
                <div className="cT">Pago Wompi</div>
                <div className="cS">
                  Te llevamos a Wompi para completar el pago. La orden queda registrada como pendiente y solo se marca
                  pagada cuando Wompi confirme la aprobación.
                </div>

                {reservedUntilLabel ? (
                  <div className="reserveBox">
                    <div className="reserveTitle">Stock reservado temporalmente</div>
                    <div className="reserveText">
                      Tu carrito quedó reservado hasta <b>{reservedUntilLabel}</b>.
                    </div>
                  </div>
                ) : null}

                <div className="payBox">
                  <div className="pRow">
                    <span>Método</span>
                    <b>Wompi Checkout (redirect)</b>
                  </div>
                  <div className="pRow">
                    <span>Total a pagar</span>
                    <b>${moneyCOP(summary.total)}</b>
                  </div>
                </div>

                {!authLoading && !isAuthed && (
                  <div className="authWarn">Debes iniciar sesión para continuar con el pago.</div>
                )}

                <button
                  className="cta dark"
                  type="button"
                  disabled={busy || authLoading || !isAuthed}
                  onClick={payWithWompiRedirect}
                >
                  {authLoading
                    ? "Validando sesión…"
                    : !isAuthed
                      ? "Iniciar sesión para pagar"
                      : busy
                        ? "Abriendo Wompi…"
                        : "Pagar ahora"}
                </button>

                {!authLoading && !isAuthed ? (
                  <button className="ghost" type="button" onClick={goToLogin} disabled={busy}>
                    Ir a iniciar sesión
                  </button>
                ) : (
                  <button className="ghost" type="button" onClick={() => setStep("envio")} disabled={busy}>
                    Volver a envío
                  </button>
                )}
              </div>
            )}
          </section>

          <aside className="right">
            <div className="card">
              <div className="cT">Resumen</div>

              <div className="rows">
                {items.map((it) => (
                  <div key={`${it.id}__${it.color ?? ""}__${it.size ?? ""}`} className="it">
                    <div className="itL">
                      <div className="itN">{it.name}</div>
                      <div className="itS">
                        x{it.qty} {it.size ? `· Talla ${it.size}` : ""} {it.color ? `· ${it.color}` : ""}
                      </div>
                    </div>
                    <div className="itP">${moneyCOP(it.price * it.qty)}</div>
                  </div>
                ))}
              </div>

              <div className="sum">
                <div className="r">
                  <span>Subtotal</span>
                  <b>${moneyCOP(summary.subtotal)}</b>
                </div>
                <div className="r">
                  <span>Envío</span>
                  <b>{shippingLabel}</b>
                </div>
                <div className="r tot">
                  <span>Total</span>
                  <b>${moneyCOP(summary.total)}</b>
                </div>

                <div className="delivery">
                  <span>Entrega estimada</span>
                  <b>{deliveryEstimate}</b>
                </div>

                {reservedUntilLabel ? (
                  <div className="holdInfo">
                    <span>Reserva activa</span>
                    <b>Hasta {reservedUntilLabel}</b>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{baseCss}</style>
    </main>
  );
}

const baseCss = `
  .root{
    padding-top: calc(var(--jusp-header-h, 64px) + 18px);
    padding: 18px 16px 34px;
    background: #fff;
    min-height: 100vh;
  }
  .wrap{ max-width: 1160px; margin: 0 auto; }

  .top{
    display:flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .brand{
    font-weight: 950;
    letter-spacing: 0.12em;
    font-size: 12px;
    color: rgba(0,0,0,0.55);
  }
  .h1{
    margin: 8px 0 0;
    font-size: 44px;
    font-weight: 950;
    letter-spacing: -0.04em;
    color:#111;
    line-height: 1.02;
  }
  .sub{
    margin: 8px 0 0;
    font-weight: 900;
    color: rgba(0,0,0,0.62);
  }
  .back{
    text-decoration:none;
    font-weight: 950;
    border-radius: 999px;
    padding: 12px 14px;
    border: 1px solid rgba(0,0,0,0.14);
    color:#111;
    background:#fff;
    white-space: nowrap;
    height: fit-content;
  }

  .steps{
    margin-top: 18px;
    display:flex;
    gap: 10px;
    align-items:center;
  }
  .st{
    border-radius: 999px;
    padding: 10px 12px;
    font-weight: 950;
    border: 1px solid rgba(0,0,0,0.14);
    background:#fff;
    cursor:pointer;
    color: rgba(0,0,0,0.75);
  }
  .st.on{
    background: rgba(17,17,17,0.92);
    color: rgba(255,255,255,0.95);
    border-color: rgba(0,0,0,0.2);
  }

  .grid{
    margin-top: 16px;
    display:grid;
    grid-template-columns: 1fr 420px;
    gap: 18px;
    align-items:start;
  }

  .card{
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 22px;
    padding: 16px;
    background:#fff;
  }
  .cT{
    font-weight: 950;
    color:#111;
    font-size: 16px;
  }
  .cS{
    margin-top: 6px;
    font-weight: 900;
    color: rgba(0,0,0,0.62);
    font-size: 13px;
    line-height: 1.35;
  }

  .form{ margin-top: 14px; display: grid; gap: 10px; }
  .f{ display:grid; gap: 6px; }
  .f span{ font-weight: 950; font-size: 12px; color: rgba(0,0,0,0.72); }
  .f input, .f textarea, .f select{
    border: 1px solid rgba(0,0,0,0.14);
    border-radius: 14px;
    padding: 12px 12px;
    font-weight: 900;
    outline: none;
    background: #fff;
    color: #111;
  }
  .f textarea{ min-height: 92px; resize: vertical; }
  .f select:disabled{
    opacity: 0.6;
    cursor: not-allowed;
  }

  .two{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .cityMegaMenu{
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 18px;
    padding: 14px;
    background: rgba(0,0,0,0.018);
  }
  .cityMegaTitle{
    font-size: 12px;
    font-weight: 950;
    color: rgba(0,0,0,0.72);
    margin-bottom: 10px;
  }
  .cityMegaGrid{
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .cityChip{
    border: 1px solid rgba(0,0,0,0.1);
    background: #fff;
    color: #111;
    border-radius: 12px;
    padding: 10px 12px;
    text-align: left;
    font-weight: 900;
    font-size: 13px;
    cursor: pointer;
    transition: all .18s ease;
  }
  .cityChip:hover{
    transform: translateY(-1px);
    border-color: rgba(0,0,0,0.18);
  }
  .cityChip.active{
    background: rgba(17,17,17,0.92);
    color: rgba(255,255,255,0.95);
    border-color: rgba(17,17,17,0.92);
  }

  .err{
    display:block;
    margin-top: 2px;
    font-size: 12px;
    font-weight: 900;
    color: #c62828;
  }

  .authNote,
  .authWarn{
    margin-top: 14px;
    border-radius: 14px;
    padding: 12px 14px;
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(0,0,0,0.03);
    color: rgba(0,0,0,0.78);
    font-weight: 900;
    font-size: 13px;
    line-height: 1.35;
  }

  .reserveBox{
    margin-top: 14px;
    border-radius: 16px;
    padding: 12px 14px;
    border: 1px solid rgba(212,175,55,0.28);
    background: rgba(212,175,55,0.08);
  }
  .reserveTitle{
    font-weight: 950;
    color: #111;
    font-size: 13px;
  }
  .reserveText{
    margin-top: 4px;
    font-weight: 900;
    color: rgba(0,0,0,0.74);
    font-size: 12px;
    line-height: 1.35;
  }

  .cta{
    margin-top: 16px;
    width: 100%;
    border-radius: 999px;
    padding: 14px 16px;
    font-weight: 950;
    border: 1px solid rgba(0,0,0,0.14);
    background: #fff;
    color:#111;
    cursor:pointer;
  }
  .cta.dark{
    background: rgba(17,17,17,0.92);
    color: rgba(255,255,255,0.95);
  }
  .cta:disabled{ opacity: 0.6; cursor:not-allowed; }

  .ghost{
    margin-top: 10px;
    width: 100%;
    border-radius: 999px;
    padding: 14px 16px;
    font-weight: 950;
    border: 1px solid rgba(0,0,0,0.14);
    background: rgba(0,0,0,0.02);
    cursor:pointer;
  }

  .rows{ margin-top: 14px; display:grid; gap: 12px; }
  .it{ display:flex; justify-content: space-between; gap: 12px; }
  .itN{ font-weight: 950; color:#111; font-size: 13px; line-height: 1.2; }
  .itS{ margin-top: 5px; font-weight: 900; color: rgba(0,0,0,0.6); font-size: 12px; }
  .itP{ font-weight: 950; color:#111; }

  .sum{
    margin-top: 16px;
    border-top: 1px solid rgba(0,0,0,0.08);
    padding-top: 14px;
    display:grid;
    gap: 10px;
  }
  .r{ display:flex; justify-content: space-between; font-weight: 900; color: rgba(0,0,0,0.7); }
  .r b{ color:#111; font-weight: 950; }
  .tot{ font-size: 15px; }
  .tot b{ font-size: 16px; }

  .delivery{
    display:flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.08);
    font-weight: 900;
    color: rgba(0,0,0,0.72);
  }
  .delivery b{
    color:#111;
    font-weight: 950;
    text-align: right;
  }

  .holdInfo{
    display:flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.24);
    font-weight: 900;
    color: rgba(0,0,0,0.72);
  }
  .holdInfo b{
    color:#111;
    font-weight: 950;
    text-align: right;
  }

  .payBox{
    margin-top: 14px;
    border-radius: 18px;
    background: rgba(0,0,0,0.02);
    border: 1px solid rgba(0,0,0,0.08);
    padding: 12px;
    display:grid;
    gap: 10px;
  }
  .pRow{ display:flex; justify-content: space-between; gap: 10px; font-weight: 900; color: rgba(0,0,0,0.7); }
  .pRow b{ color:#111; font-weight: 950; text-align:right; }

  .empty{
    margin-top: 18px;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 22px;
    padding: 16px;
    background: rgba(0,0,0,0.015);
    max-width: 680px;
  }
  .eT{ font-weight: 950; color:#111; font-size: 15px; }
  .eS{ margin-top: 6px; font-weight: 900; color: rgba(0,0,0,0.62); font-size: 13px; }
  .go{
    margin-top: 12px;
    display:inline-flex;
    text-decoration:none;
    font-weight: 950;
    border-radius: 999px;
    padding: 12px 14px;
    border: 1px solid rgba(0,0,0,0.14);
    color:#111;
    background:#fff;
  }

  @media (max-width: 980px){
    .grid{ grid-template-columns: 1fr; }
    .cityMegaGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 520px){
    .h1{ font-size: 32px; }
    .top{ flex-direction: column; align-items:flex-start; }
    .two{ grid-template-columns: 1fr; }
    .delivery{
      flex-direction: column;
    }
    .delivery b{
      text-align: left;
    }
    .holdInfo{
      flex-direction: column;
    }
    .holdInfo b{
      text-align: left;
    }
    .cityMegaGrid{ grid-template-columns: 1fr; }
  }
`;