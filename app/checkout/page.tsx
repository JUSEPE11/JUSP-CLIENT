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

function getDeliveryEstimate(expressEligibleOnly = false) {
  const now = new Date();

  const min = new Date(now);
  min.setDate(min.getDate() + (expressEligibleOnly ? 8 : 15));

  const max = new Date(now);
  max.setDate(max.getDate() + (expressEligibleOnly ? 10 : 20));

  return `${formatDate(min)} - ${formatDate(max)}`;
}

const SHIPPING_KEY = "jusp_checkout_shipping_v1";
const SAVED_ADDRESSES_KEY = "jusp_checkout_saved_addresses_v1";
const SHIPPING_PRICE = 99990;
const HALF_SHIPPING_MIN_ITEMS = 3;
const CREATE_ORDER_ENDPOINT = "/api/orders";
const DEFAULT_CARRIER_CODE = "COORDINADORA";
const DEFAULT_CARRIER_LABEL = "Coordinadora";

const COLOMBIA_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlantico",
  "Bogota D.C.",
  "Bolivar",
  "Boyaca",
  "Caldas",
  "Caqueta",
  "Casanare",
  "Cauca",
  "Cesar",
  "Choco",
  "Cordoba",
  "Cundinamarca",
  "Guainia",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Narino",
  "Norte de Santander",
  "Putumayo",
  "Quindio",
  "Risaralda",
  "San Andres y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupes",
  "Vichada",
] as const;

// Base actual del checkout.
// Sigue siendo la base local actual del proyecto.
const COLOMBIA_MUNICIPALITIES_BY_DEPARTMENT: Record<
  (typeof COLOMBIA_DEPARTMENTS)[number],
  string[]
> = {
  Amazonas: ["Leticia", "Puerto Narino"],
  Antioquia: [
    "Medellin",
    "Bello",
    "Itagui",
    "Envigado",
    "Sabaneta",
    "Rionegro",
    "Apartado",
    "Turbo",
    "Santa Fe de Antioquia",
    "La Ceja",
    "Copacabana",
  ],
  Arauca: ["Arauca", "Arauquita", "Saravena", "Tame"],
  Atlantico: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Sabanalarga", "Baranoa"],
  "Bogota D.C.": ["Bogota"],
  Bolivar: ["Cartagena", "Magangue", "Turbaco", "Arjona", "El Carmen de Bolivar", "Mompos"],
  Boyaca: ["Tunja", "Duitama", "Sogamoso", "Chiquinquira", "Paipa", "Villa de Leyva"],
  Caldas: ["Manizales", "La Dorada", "Chinchina", "Villamaria", "Riosucio"],
  Caqueta: ["Florencia", "San Vicente del Caguan", "Puerto Rico", "El Doncello"],
  Casanare: ["Yopal", "Aguazul", "Villanueva", "Paz de Ariporo", "Tauramena"],
  Cauca: ["Popayan", "Santander de Quilichao", "Puerto Tejada", "Patia", "Piendamo"],
  Cesar: ["Valledupar", "Aguachica", "Bosconia", "La Jagua de Ibirico", "Curumani"],
  Choco: ["Quibdo", "Istmina", "Tado", "Condoto", "Riosucio"],
  Cordoba: ["Monteria", "Cerete", "Lorica", "Sahagun", "Montelibano", "Planeta Rica"],
  Cundinamarca: [
    "Soacha",
    "Chia",
    "Zipaquira",
    "Facatativa",
    "Girardot",
    "Mosquera",
    "Funza",
    "Madrid",
    "Cajica",
    "Fusagasuga",
  ],
  Guainia: ["Inirida"],
  Guaviare: ["San Jose del Guaviare", "Calamar", "El Retorno"],
  Huila: ["Neiva", "Pitalito", "Garzon", "La Plata", "Campoalegre"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "Fonseca", "San Juan del Cesar"],
  Magdalena: ["Santa Marta", "Cienaga", "Fundacion", "Plato", "Aracataca"],
  Meta: ["Villavicencio", "Acacias", "Granada", "Puerto Lopez", "Restrepo"],
  Narino: ["Pasto", "Tumaco", "Ipiales", "Tuquerres", "La Union"],
  "Norte de Santander": ["Cucuta", "Ocana", "Pamplona", "Villa del Rosario", "Los Patios"],
  Putumayo: ["Mocoa", "Puerto Asis", "Sibundoy", "Orito", "Villagarzon"],
  Quindio: ["Armenia", "Calarca", "La Tebaida", "Montenegro", "Quimbaya"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia", "Belen de Umbria"],
  "San Andres y Providencia": ["San Andres", "Providencia"],
  Santander: ["Bucaramanga", "Floridablanca", "Giron", "Piedecuesta", "Barrancabermeja", "San Gil"],
  Sucre: ["Sincelejo", "Corozal", "Sampues", "Tolu", "San Marcos"],
  Tolima: ["Ibague", "Espinal", "Melgar", "Honda", "Libano"],
  "Valle del Cauca": [
    "Cali",
    "Palmira",
    "Buenaventura",
    "Tulua",
    "Buga",
    "Cartago",
    "Jamundi",
    "Yumbo",
    "Florida",
    "Candelaria",
  ],
  Vaupes: ["Mitu"],
  Vichada: ["Puerto Carreno"],
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
  municipality: string;
  region: string;
  addressLine1: string;
  notes: string;
};

type SavedAddress = Shipping & {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};

function emptyShipping(): Shipping {
  return {
    fullName: "",
    email: "",
    documentType: "",
    documentNumber: "",
    phone: "",
    municipality: "",
    region: "",
    addressLine1: "",
    notes: "",
  };
}

function normalizeShippingForSave(ship: Shipping): Shipping {
  return {
    fullName: String(ship.fullName || "").trim(),
    email: String(ship.email || "").trim().toLowerCase(),
    documentType: ship.documentType,
    documentNumber: String(ship.documentNumber || "").trim(),
    phone: String(ship.phone || "").trim(),
    municipality: String(ship.municipality || "").trim(),
    region: String(ship.region || "").trim(),
    addressLine1: String(ship.addressLine1 || "").trim(),
    notes: String(ship.notes || "").trim(),
  };
}

function addressFingerprint(ship: Shipping) {
  const safe = normalizeShippingForSave(ship);
  return [
    safe.fullName,
    safe.phone,
    safe.region,
    safe.municipality,
    safe.addressLine1,
  ]
    .map((value) => value.toLowerCase())
    .join("|");
}

function buildAddressLabel(ship: Shipping) {
  const safe = normalizeShippingForSave(ship);
  const city = [safe.municipality, safe.region].filter(Boolean).join(", ");
  return [safe.fullName || "Direccion guardada", city].filter(Boolean).join(" - ");
}

function loadSavedAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  const raw = safeParse(localStorage.getItem(SAVED_ADDRESSES_KEY));
  if (!Array.isArray(raw)) return [];

  const out: SavedAddress[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const shipping = normalizeShippingForSave(entry as Shipping);
    if (!shipping.addressLine1 || !shipping.region || !shipping.municipality) continue;

    out.push({
      id: String((entry as any).id || `${Date.now()}-${out.length}`).trim(),
      label: String((entry as any).label || buildAddressLabel(shipping)).trim(),
      createdAt: String((entry as any).createdAt || new Date().toISOString()).trim(),
      updatedAt: String((entry as any).updatedAt || new Date().toISOString()).trim(),
      ...shipping,
    });
  }

  return out.slice(0, 6);
}

function persistSavedAddresses(addresses: SavedAddress[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses.slice(0, 6)));
  } catch {}
}

function upsertSavedAddress(addresses: SavedAddress[], ship: Shipping): SavedAddress[] {
  const safe = normalizeShippingForSave(ship);
  if (!safe.addressLine1 || !safe.region || !safe.municipality || !safe.fullName) return addresses;

  const fingerprint = addressFingerprint(safe);
  const idx = addresses.findIndex((entry) => addressFingerprint(entry) === fingerprint);
  const now = new Date().toISOString();

  if (idx >= 0) {
    const next = [...addresses];
    next[idx] = {
      ...next[idx],
      ...safe,
      label: buildAddressLabel(safe),
      updatedAt: now,
    };
    return next.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6);
  }

  return [
    {
      id: `addr_${Date.now()}`,
      label: buildAddressLabel(safe),
      createdAt: now,
      updatedAt: now,
      ...safe,
    },
    ...addresses,
  ].slice(0, 6);
}

function mergeSavedAddresses(primary: SavedAddress[], secondary: SavedAddress[]) {
  const merged = [...primary, ...secondary];
  const byFingerprint = new Map<string, SavedAddress>();

  for (const entry of merged) {
    const fingerprint = addressFingerprint(entry);
    const current = byFingerprint.get(fingerprint);
    if (!current) {
      byFingerprint.set(fingerprint, entry);
      continue;
    }

    const currentStamp = String(current.updatedAt || current.createdAt || "");
    const nextStamp = String(entry.updatedAt || entry.createdAt || "");
    if (nextStamp.localeCompare(currentStamp) > 0) {
      byFingerprint.set(fingerprint, entry);
    }
  }

  return Array.from(byFingerprint.values())
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))
    .slice(0, 6);
}

export default function CheckoutPage() {
  const { state, cartTotal, cartCount } = useStore();

  const [step, setStep] = useState<"envio" | "pago">("envio");
  const [busy, setBusy] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);

  const [ship, setShip] = useState<Shipping>(emptyShipping());
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const items = state.cart;
  const canContinue = cartCount > 0;
  const expressEligibleOnly = useMemo(() => {
    if (!items.length) return false;
    return items.every((item: any) => Boolean(item?.expressDelivery || item?.pickupToday));
  }, [items]);
  const deliveryEstimate = useMemo(() => getDeliveryEstimate(expressEligibleOnly), [expressEligibleOnly]);

  const selectedMunicipalities = useMemo(() => {
    if (!ship.region) return [];
    return COLOMBIA_MUNICIPALITIES_BY_DEPARTMENT[
      ship.region as keyof typeof COLOMBIA_MUNICIPALITIES_BY_DEPARTMENT
    ] ?? [];
  }, [ship.region]);

  const summary = useMemo(() => {
    let shipping = SHIPPING_PRICE;

    if (expressEligibleOnly) {
      shipping = 0;
    } else if (cartCount >= HALF_SHIPPING_MIN_ITEMS) {
      shipping = Math.round(SHIPPING_PRICE * 0.5);
    }

    return {
      subtotal: cartTotal,
      shipping,
      total: cartTotal + shipping,
    };
  }, [cartTotal, cartCount, expressEligibleOnly]);

  const shippingLabel = useMemo(() => {
    if (expressEligibleOnly) return "Envio gratis express";
    if (cartCount >= HALF_SHIPPING_MIN_ITEMS) return `Envio 50% OFF - $${moneyCOP(summary.shipping)}`;
    return `$${moneyCOP(summary.shipping)}`;
  }, [summary.shipping, cartCount, expressEligibleOnly]);

  const orderRef = useMemo(() => `JUSP-${Date.now()}`, []);

  const reservedUntilLabel = useMemo(() => {
    if (!reservedUntil) return null;
    const date = new Date(reservedUntil);
    if (Number.isNaN(date.getTime())) return null;
    return formatDateTime(date);
  }, [reservedUntil]);

  useEffect(() => {
    const prev = safeParse(localStorage.getItem(SHIPPING_KEY));
    setSavedAddresses(loadSavedAddresses());
    if (prev && typeof prev === "object") {
      const nextRegion = String((prev as any).region || "");
      const nextMunicipality = String(
        (prev as any).municipality || (prev as any).city || ""
      );
      const nextDocumentType = (
        ["CC", "CE", "NIT", "PAS"].includes(String((prev as any).documentType || ""))
          ? String((prev as any).documentType || "")
          : ""
      ) as DocumentType | "";

      const regionIsValid = COLOMBIA_DEPARTMENTS.includes(
        nextRegion as (typeof COLOMBIA_DEPARTMENTS)[number]
      );

      const municipalityIsValid = regionIsValid
        ? (
            COLOMBIA_MUNICIPALITIES_BY_DEPARTMENT[
              nextRegion as keyof typeof COLOMBIA_MUNICIPALITIES_BY_DEPARTMENT
            ] ?? []
          ).includes(nextMunicipality)
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
        municipality: municipalityIsValid ? nextMunicipality : "",
        region: regionIsValid ? nextRegion : "",
        addressLine1: String((prev as any).addressLine1 || ""),
        notes: String((prev as any).notes || ""),
      });

      const mergedSaved = upsertSavedAddress(loadSavedAddresses(), {
        fullName: String((prev as any).fullName || ""),
        email: String((prev as any).email || ""),
        documentType: nextDocumentType,
        documentNumber: sanitizeDocumentNumber(
          String((prev as any).documentNumber || ""),
          nextDocumentType
        ),
        phone: onlyDigits(String((prev as any).phone || "")),
        municipality: municipalityIsValid ? nextMunicipality : "",
        region: regionIsValid ? nextRegion : "",
        addressLine1: String((prev as any).addressLine1 || ""),
        notes: String((prev as any).notes || ""),
      });
      setSavedAddresses(mergedSaved);
      persistSavedAddresses(mergedSaved);
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

        const json = await res.json().catch(() => null);

        if (!active) return;

        setIsAuthed(res.ok);
        if (res.ok && json?.user?.email) {
          setShip((current) => ({
            ...current,
            email: current.email || String(json.user.email || "").trim().toLowerCase(),
          }));
        }

        if (res.ok) {
          const addressesRes = await fetch("/api/account/addresses", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: { "cache-control": "no-store" },
          }).catch(() => null);

          if (addressesRes?.ok) {
            const addressesJson = await addressesRes.json().catch(() => null);
            const serverAddresses = Array.isArray(addressesJson?.addresses)
              ? (addressesJson.addresses as SavedAddress[])
              : [];
            const merged = mergeSavedAddresses(serverAddresses, loadSavedAddresses());
            setSavedAddresses(merged);
            persistSavedAddresses(merged);
          }
        }
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

  function applySavedAddress(address: SavedAddress) {
    setShip({
      fullName: address.fullName,
      email: address.email,
      documentType: address.documentType,
      documentNumber: address.documentNumber,
      phone: address.phone,
      municipality: address.municipality,
      region: address.region,
      addressLine1: address.addressLine1,
      notes: address.notes,
    });
  }

  async function rememberCurrentAddress() {
    const next = upsertSavedAddress(savedAddresses, ship);
    setSavedAddresses(next);
    persistSavedAddresses(next);

    if (!isAuthed) return;

    await fetch("/api/account/addresses", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ship),
    }).catch(() => null);
  }

  function removeSavedAddress(id: string) {
    const next = savedAddresses.filter((entry) => entry.id !== id);
    setSavedAddresses(next);
    persistSavedAddresses(next);

    if (isAuthed) {
      void fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => null);
    }
  }

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
    const municipality = ship.municipality.trim();
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
        municipality &&
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
    void rememberCurrentAddress();

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
        "Completa los datos obligatorios antes de pagar. El numero de documento y el celular deben tener minimo 5 numeros. En pasaporte se permiten letras y numeros."
      );
      setStep("envio");
      return;
    }

    await rememberCurrentAddress();

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
          carrier: DEFAULT_CARRIER_CODE,
          carrierLabel: DEFAULT_CARRIER_LABEL,
          mode: expressEligibleOnly ? "express_flash" : "standard",
          fullName: ship.fullName.trim(),
          email: ship.email.trim(),
          documentType: ship.documentType,
          documentNumber: ship.documentNumber.trim(),
          phone: ship.phone.trim(),
          city: ship.municipality.trim(),
          municipality: ship.municipality.trim(),
          region: ship.region.trim(),
          addressLine1: ship.addressLine1.trim(),
          notes: ship.notes.trim(),
          country: "CO",
        },
        items: items.map((it) => ({
          id: it.id,
          product_id: it.id,
          slug: (it as any).slug ?? null,
          product_slug: (it as any).slug ?? null,
          name: it.name,
          qty: it.qty,
          price: it.price,
          image: it.image ?? null,
          size: it.size ?? null,
          color: it.color ?? null,
          expressDelivery: Boolean((it as any).expressDelivery),
          pickupToday: Boolean((it as any).pickupToday),
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
              <p className="sub">Resumen del pedido y datos de envio.</p>
            </div>
            <Link className="back" href="/products">
              Volver a productos
            </Link>
          </div>

          <div className="empty">
            <div className="eT">Tu carrito esta vacio</div>
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
            <p className="sub">Resumen del pedido y datos de envio.</p>
          </div>
          <Link className="back" href="/products">
            Volver a productos
          </Link>
        </div>

        <div className="steps">
          <button className={`st ${step === "envio" ? "on" : ""}`} type="button" onClick={() => setStep("envio")}>
            1. Envio
          </button>
          <button
            className={`st ${step === "pago" ? "on" : ""}`}
            type="button"
            onClick={handleContinueToPayment}
            title={!isAuthed && !authLoading ? "Debes iniciar sesion para entrar a pago" : ""}
          >
            2. Pago
          </button>
        </div>

        <div className="grid">
          <section className="left">
            {step === "envio" ? (
              <div className="card">
                <div className="cT">Datos de envio</div>
                <div className="cS">Esto es obligatorio para continuar al pago.</div>

                {savedAddresses.length ? (
                  <div className="savedAddresses">
                    <div className="savedHead">
                      <div className="savedTitle">Direcciones guardadas</div>
                      <div className="savedSub">Usa una direccion anterior sin volver a llenar todo.</div>
                    </div>

                    <div className="savedGrid">
                      {savedAddresses.map((address) => {
                        const active = addressFingerprint(address) === addressFingerprint(ship);
                        return (
                          <div key={address.id} className={`savedCard ${active ? "on" : ""}`}>
                            <button type="button" className="savedUse" onClick={() => applySavedAddress(address)}>
                              <div className="savedLabel">{address.label}</div>
                              <div className="savedText">{address.addressLine1}</div>
                              <div className="savedText">
                                {[address.municipality, address.region].filter(Boolean).join(" - ")}
                              </div>
                            </button>

                            <button
                              type="button"
                              className="savedRemove"
                              onClick={() => removeSavedAddress(address.id)}
                              aria-label="Eliminar direccion guardada"
                            >
                              X
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

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
                    <span>Correo electronico *</span>
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
                        <option value="">Selecciona una opcion</option>
                        <option value="CC">Cedula de ciudadania</option>
                        <option value="CE">Cedula de extranjeria</option>
                        <option value="NIT">NIT</option>
                        <option value="PAS">Pasaporte</option>
                      </select>
                    </label>

                    <label className="f">
                      <span>Numero de documento *</span>
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
                            ? "Debe contener minimo 5 numeros. En pasaporte se permiten letras y numeros."
                            : "Debe tener minimo 5 numeros."}
                        </small>
                      )}
                    </label>
                  </div>

                  <label className="f">
                    <span>Telefono *</span>
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
                      <small className="err">Debe tener minimo 5 numeros.</small>
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
                            municipality: "",
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
                      <span>Municipio / ciudad *</span>
                      <select
                        value={ship.municipality}
                        onChange={(e) =>
                          setShip((s) => ({
                            ...s,
                            municipality: e.target.value,
                          }))
                        }
                        disabled={!ship.region}
                      >
                        <option value="">
                          {!ship.region
                            ? "Primero selecciona un departamento"
                            : "Selecciona un municipio o ciudad"}
                        </option>
                        {selectedMunicipalities.map((municipality) => (
                          <option key={municipality} value={municipality}>
                            {municipality}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {ship.region && selectedMunicipalities.length > 0 ? (
                    <div className="cityMegaMenu">
                      <div className="cityMegaGrid">
                        {selectedMunicipalities.map((municipality) => (
                          <button
                            key={municipality}
                            type="button"
                            className={`cityChip ${ship.municipality === municipality ? "active" : ""}`}
                            onClick={() =>
                              setShip((s) => ({
                                ...s,
                                municipality,
                              }))
                            }
                          >
                            {municipality}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label className="f">
                    <span>Direccion *</span>
                    <input
                      value={ship.addressLine1}
                      onChange={(e) => setShip((s) => ({ ...s, addressLine1: e.target.value }))}
                      placeholder="Calle / Carrera, numero, barrio"
                    />
                  </label>

                  <label className="f">
                    <span>Notas (opcional)</span>
                    <textarea
                      value={ship.notes}
                      onChange={(e) => setShip((s) => ({ ...s, notes: e.target.value }))}
                      placeholder="Apto / torre / instrucciones de entrega"
                    />
                  </label>
                </div>

                {!authLoading && !isAuthed && (
                  <div className="authNote">Debes iniciar sesion antes de pasar a pago.</div>
                )}

                <button
                  className="cta"
                  type="button"
                  onClick={handleContinueToPayment}
                  disabled={!canContinue || !shipOk || authLoading}
                  title={
                    !shipOk
                      ? "Completa el envio. Documento y celular deben tener minimo 5 numeros. En pasaporte se permiten letras."
                      : authLoading
                        ? "Validando sesion..."
                        : ""
                  }
                >
                  {authLoading ? "Validando sesion..." : !isAuthed ? "Iniciar sesion para pagar" : "Continuar a pago"}
                </button>
              </div>
            ) : (
              <div className="card">
                <div className="cT">Pago Wompi</div>
                <div className="cS">
                  Te llevamos a Wompi para completar el pago. La orden queda registrada como pendiente y solo se marca
                  pagada cuando Wompi confirme la aprobacion.
                </div>

                {reservedUntilLabel ? (
                  <div className="reserveBox">
                    <div className="reserveTitle">Stock reservado temporalmente</div>
                    <div className="reserveText">
                      Tu carrito quedo reservado hasta <b>{reservedUntilLabel}</b>.
                    </div>
                  </div>
                ) : null}

                <div className="payBox">
                  <div className="pRow">
                    <span>Metodo</span>
                    <b>Wompi Checkout (redirect)</b>
                  </div>
                  <div className="pRow">
                    <span>Total a pagar</span>
                    <b>${moneyCOP(summary.total)}</b>
                  </div>
                </div>

                {!authLoading && !isAuthed && (
                  <div className="authWarn">Debes iniciar sesion para continuar con el pago.</div>
                )}

                <button
                  className="cta dark"
                  type="button"
                  disabled={busy || authLoading || !isAuthed}
                  onClick={payWithWompiRedirect}
                >
                  {authLoading
                    ? "Validando sesion..."
                    : !isAuthed
                      ? "Iniciar sesion para pagar"
                      : busy
                        ? "Abriendo Wompi..."
                        : "Pagar ahora"}
                </button>

                {!authLoading && !isAuthed ? (
                  <button className="ghost" type="button" onClick={goToLogin} disabled={busy}>
                    Ir a iniciar sesion
                  </button>
                ) : (
                  <button className="ghost" type="button" onClick={() => setStep("envio")} disabled={busy}>
                    Volver a envio
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
                        x{it.qty} {it.size ? `- Talla ${it.size}` : ""} {it.color ? `- ${it.color}` : ""}
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
                  <span>Envio</span>
                  <b>{shippingLabel}</b>
                </div>
                <div className="r tot">
                  <span>Total</span>
                  <b>${moneyCOP(summary.total)}</b>
                </div>

                <div className="delivery">
                  <span>Entrega estimada</span>
                  <b>
                    {deliveryEstimate}
                    {expressEligibleOnly ? <small>Producto flash / express: entrega estimada de 8 dias a 10 dias</small> : null}
                  </b>
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

  .savedAddresses{
    margin-top: 16px;
    display: grid;
    gap: 10px;
  }
  .savedHead{
    display: grid;
    gap: 4px;
  }
  .savedTitle{
    font-size: 13px;
    font-weight: 950;
    color:#111;
  }
  .savedSub{
    font-size: 12px;
    font-weight: 900;
    color: rgba(0,0,0,0.56);
  }
  .savedGrid{
    display:grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .savedCard{
    position: relative;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(255,255,255,0.94);
    overflow: hidden;
  }
  .savedCard.on{
    border-color: rgba(212,175,55,0.44);
    box-shadow: 0 0 0 3px rgba(212,175,55,0.12);
  }
  .savedUse{
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    padding: 14px 42px 14px 14px;
    cursor: pointer;
    display:grid;
    gap: 4px;
  }
  .savedLabel{
    font-size: 13px;
    font-weight: 950;
    color:#111;
  }
  .savedText{
    font-size: 12px;
    font-weight: 900;
    line-height: 1.35;
    color: rgba(0,0,0,0.58);
  }
  .savedRemove{
    position:absolute;
    top: 8px;
    right: 8px;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.08);
    background:#fff;
    color: rgba(0,0,0,0.56);
    font-size: 16px;
    font-weight: 900;
    cursor: pointer;
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
  .delivery small{
    display:block;
    margin-top: 4px;
    font-size: 11px;
    font-weight: 900;
    color: rgba(0,0,0,0.52);
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
    .savedGrid{ grid-template-columns: 1fr; }
  }
`;

