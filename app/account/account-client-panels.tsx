"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type DocumentType = "CC" | "CE" | "NIT" | "PAS";

type SavedAddressRecord = {
  id: string;
  label: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  municipality: string;
  region: string;
  addressLine1: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type SavedPaymentMethodRecord = {
  id: string;
  label: string;
  brand: string;
  last4: string;
  cardholderName: string;
  expMonth: string;
  expYear: string;
  provider: string;
  isDefault: boolean;
  paymentSourceId: string;
  sourceStatus: string;
  tokenizationMode: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
};

type WompiTokenizationConfig = {
  ok?: boolean;
  enabled?: boolean;
  publicKey?: string;
  acceptanceToken?: string;
  acceptPersonalAuth?: string;
  reason?: string | null;
  environment?: string;
};

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

const MUNICIPALITIES_BY_DEPARTMENT: Record<(typeof COLOMBIA_DEPARTMENTS)[number], string[]> = {
  Amazonas: ["Leticia", "Puerto Narino"],
  Antioquia: ["Medellin", "Bello", "Itagui", "Envigado", "Sabaneta", "Rionegro", "Apartado"],
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
  Cundinamarca: ["Soacha", "Chia", "Zipaquira", "Facatativa", "Girardot", "Mosquera", "Funza"],
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
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tulua", "Buga", "Cartago", "Jamundi"],
  Vaupes: ["Mitu"],
  Vichada: ["Puerto Carreno"],
};

const CARD_BRANDS = ["Visa", "Mastercard", "American Express", "Diners", "Nequi", "Bancolombia"];

function emptyAddress(email: string) {
  return {
    id: "",
    fullName: "",
    email,
    documentType: "" as DocumentType | "",
    documentNumber: "",
    phone: "",
    municipality: "",
    region: "",
    addressLine1: "",
    notes: "",
  };
}

function emptyPaymentMethod() {
  return {
    id: "",
    label: "",
    brand: "Visa",
    last4: "",
    cardholderName: "",
    expMonth: "",
    expYear: "",
    isDefault: true,
    cardNumber: "",
    cvc: "",
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeExpiryYearForStorage(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 2) return `20${digits}`;
  if (digits.length >= 4) return digits.slice(0, 4);
  return digits;
}

function normalizeExpiryYearForWompi(value: string) {
  const digits = onlyDigits(value);
  if (digits.length >= 4) return digits.slice(-2);
  return digits.slice(0, 2);
}

export default function AccountClientPanels(props: {
  initialEmail: string;
  initialAddresses: SavedAddressRecord[];
  initialPaymentMethods: SavedPaymentMethodRecord[];
}) {
  const { initialEmail, initialAddresses, initialPaymentMethods } = props;
  const [addresses, setAddresses] = useState<SavedAddressRecord[]>(initialAddresses);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethodRecord[]>(initialPaymentMethods);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [tokenizationConfig, setTokenizationConfig] = useState<WompiTokenizationConfig | null>(null);
  const [loadingTokenizationConfig, setLoadingTokenizationConfig] = useState(false);
  const [addressForm, setAddressForm] = useState(() =>
    initialAddresses[0]
      ? {
          id: initialAddresses[0].id,
          fullName: initialAddresses[0].fullName,
          email: initialAddresses[0].email,
          documentType: (initialAddresses[0].documentType || "") as DocumentType | "",
          documentNumber: initialAddresses[0].documentNumber,
          phone: initialAddresses[0].phone,
          municipality: initialAddresses[0].municipality,
          region: initialAddresses[0].region,
          addressLine1: initialAddresses[0].addressLine1,
          notes: initialAddresses[0].notes,
        }
      : emptyAddress(initialEmail)
  );
  const [paymentForm, setPaymentForm] = useState(() =>
    initialPaymentMethods[0]
      ? {
          id: initialPaymentMethods[0].id,
          label: initialPaymentMethods[0].label,
          brand: initialPaymentMethods[0].brand,
          last4: initialPaymentMethods[0].last4,
          cardholderName: initialPaymentMethods[0].cardholderName,
          expMonth: initialPaymentMethods[0].expMonth,
          expYear: initialPaymentMethods[0].expYear,
          isDefault: initialPaymentMethods[0].isDefault,
          cardNumber: "",
          cvc: "",
        }
      : emptyPaymentMethod()
  );

  const primaryAddress = addresses[0] || null;
  const primaryPaymentMethod = paymentMethods.find((item) => item.isDefault) || paymentMethods[0] || null;
  const municipalities = useMemo(() => {
    if (!addressForm.region) return [];
    return MUNICIPALITIES_BY_DEPARTMENT[addressForm.region as keyof typeof MUNICIPALITIES_BY_DEPARTMENT] || [];
  }, [addressForm.region]);

  useEffect(() => {
    void loadTokenizationConfig();
  }, []);

  async function loadTokenizationConfig() {
    setLoadingTokenizationConfig(true);
    try {
      const res = await fetch("/api/wompi/tokenization-config", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      setTokenizationConfig(json);
    } catch {
      setTokenizationConfig({
        ok: false,
        enabled: false,
        reason: "No se pudo verificar la configuración de Wompi.",
      });
    } finally {
      setLoadingTokenizationConfig(false);
    }
  }

  async function saveAddress() {
    setSavingAddress(true);
    setAddressError("");

    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo guardar la direccion.");
      }
      const nextAddresses = Array.isArray(json.addresses) ? (json.addresses as SavedAddressRecord[]) : [];
      setAddresses(nextAddresses);
      if (nextAddresses[0]) {
        setAddressForm({
          id: nextAddresses[0].id,
          fullName: nextAddresses[0].fullName,
          email: nextAddresses[0].email,
          documentType: (nextAddresses[0].documentType || "") as DocumentType | "",
          documentNumber: nextAddresses[0].documentNumber,
          phone: nextAddresses[0].phone,
          municipality: nextAddresses[0].municipality,
          region: nextAddresses[0].region,
          addressLine1: nextAddresses[0].addressLine1,
          notes: nextAddresses[0].notes,
        });
      }
      setEditingAddress(false);
    } catch (error: any) {
      setAddressError(error?.message || "No se pudo guardar la direccion.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function removeAddress(id: string) {
    const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.ok) {
      const nextAddresses = Array.isArray(json.addresses) ? (json.addresses as SavedAddressRecord[]) : [];
      setAddresses(nextAddresses);
      if (nextAddresses[0]) {
        setAddressForm({
          id: nextAddresses[0].id,
          fullName: nextAddresses[0].fullName,
          email: nextAddresses[0].email,
          documentType: (nextAddresses[0].documentType || "") as DocumentType | "",
          documentNumber: nextAddresses[0].documentNumber,
          phone: nextAddresses[0].phone,
          municipality: nextAddresses[0].municipality,
          region: nextAddresses[0].region,
          addressLine1: nextAddresses[0].addressLine1,
          notes: nextAddresses[0].notes,
        });
      } else {
        setAddressForm(emptyAddress(initialEmail));
      }
    }
  }

  async function savePaymentMethod() {
    setSavingPayment(true);
    setPaymentError("");

    try {
      if (!tokenizationConfig?.enabled || !tokenizationConfig.publicKey) {
        throw new Error(
          tokenizationConfig?.reason ||
            "La tokenización real de Wompi no está habilitada todavía en esta cuenta."
        );
      }

      const cleanCardNumber = onlyDigits(paymentForm.cardNumber || "");
      const cleanCvc = onlyDigits(paymentForm.cvc || "");
      const expMonth = onlyDigits(paymentForm.expMonth).slice(0, 2);
      const expYearForWompi = normalizeExpiryYearForWompi(paymentForm.expYear);
      const expYearForStorage = normalizeExpiryYearForStorage(paymentForm.expYear);

      if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        throw new Error("Escribe un número de tarjeta válido.");
      }

      if (cleanCvc.length < 3 || cleanCvc.length > 4) {
        throw new Error("Escribe un código de seguridad válido.");
      }

      if (!paymentForm.cardholderName.trim()) {
        throw new Error("Escribe el nombre del titular.");
      }

      const wompiTokenRes = await fetch(
        `https://${tokenizationConfig.environment === "sandbox" ? "sandbox" : "production"}.wompi.co/v1/tokens/cards`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenizationConfig.publicKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: cleanCardNumber,
            cvc: cleanCvc,
            exp_month: expMonth,
            exp_year: expYearForWompi,
            card_holder: paymentForm.cardholderName.trim(),
          }),
        }
      );

      const wompiTokenJson = await wompiTokenRes.json().catch(() => null);
      const tokenId = String(wompiTokenJson?.data?.id || "").trim();
      if (!wompiTokenRes.ok || !tokenId) {
        throw new Error(
          wompiTokenJson?.error?.reason ||
            wompiTokenJson?.error?.messages?.[0] ||
            "Wompi no pudo tokenizar la tarjeta."
        );
      }

      const payload = {
        label: paymentForm.label,
        brand: paymentForm.brand,
        last4: cleanCardNumber.slice(-4),
        cardholderName: paymentForm.cardholderName.trim(),
        expMonth,
        expYear: expYearForStorage,
        isDefault: paymentForm.isDefault,
        customerEmail: initialEmail,
        acceptanceToken: tokenizationConfig.acceptanceToken,
        acceptPersonalAuth: tokenizationConfig.acceptPersonalAuth,
        tokenId,
      };

      const res = await fetch("/api/wompi/payment-sources", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo guardar el metodo de pago.");
      }
      const nextPaymentMethods = Array.isArray(json.paymentMethods)
        ? (json.paymentMethods as SavedPaymentMethodRecord[])
        : [];
      setPaymentMethods(nextPaymentMethods);
      if (nextPaymentMethods[0]) {
        setPaymentForm({
          id: nextPaymentMethods[0].id,
          label: nextPaymentMethods[0].label,
          brand: nextPaymentMethods[0].brand,
          last4: nextPaymentMethods[0].last4,
          cardholderName: nextPaymentMethods[0].cardholderName,
          expMonth: nextPaymentMethods[0].expMonth,
          expYear: nextPaymentMethods[0].expYear,
          isDefault: nextPaymentMethods[0].isDefault,
          cardNumber: "",
          cvc: "",
        });
      }
      setEditingPayment(false);
    } catch (error: any) {
      setPaymentError(error?.message || "No se pudo guardar el metodo de pago.");
    } finally {
      setSavingPayment(false);
    }
  }

  async function removePaymentMethod(id: string) {
    const res = await fetch(`/api/account/payment-methods?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.ok) {
      const nextPaymentMethods = Array.isArray(json.paymentMethods)
        ? (json.paymentMethods as SavedPaymentMethodRecord[])
        : [];
      setPaymentMethods(nextPaymentMethods);
      if (nextPaymentMethods[0]) {
        setPaymentForm({
          id: nextPaymentMethods[0].id,
          label: nextPaymentMethods[0].label,
          brand: nextPaymentMethods[0].brand,
          last4: nextPaymentMethods[0].last4,
          cardholderName: nextPaymentMethods[0].cardholderName,
          expMonth: nextPaymentMethods[0].expMonth,
          expYear: nextPaymentMethods[0].expYear,
          isDefault: nextPaymentMethods[0].isDefault,
          cardNumber: "",
          cvc: "",
        });
      } else {
        setPaymentForm(emptyPaymentMethod());
      }
    }
  }

  return (
    <section
      className="account-section-grid account-bottom-grid"
      style={{
        marginTop: 18,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 18,
      }}
    >
      <div className="account-light-card" style={cardStyle}>
        <div style={eyebrowStyle}>Direcciones guardadas</div>
        <h3 className="account-section-title" style={titleStyle}>
          Tu direccion principal de entrega.
        </h3>

        <div style={{ marginTop: 18 }}>
          {primaryAddress ? (
            <div style={infoBoxStyle}>
              <div style={miniEyebrowStyle}>Direccion activa</div>
              <div style={valueStyle}>
                {[primaryAddress.addressLine1, primaryAddress.municipality, primaryAddress.region]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </div>
          ) : (
            <div style={emptyBoxStyle}>
              Aun no tienes una direccion guardada. Agregarla hace mas rapido tu proceso de compra.
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={infoItemStyle}>
            <div style={miniEyebrowStyle}>Ciudad</div>
            <div style={valueSingleStyle}>{primaryAddress?.municipality || "Por definir"}</div>
          </div>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => {
              setEditingAddress((current) => !current);
              setAddressError("");
            }}
          >
            {editingAddress ? "Cerrar editor" : "Editar direccion"}
          </button>
        </div>

        {addresses.length > 0 ? (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {addresses.map((address) => (
              <div key={address.id} style={listCardStyle}>
                <div>
                  <div style={{ fontWeight: 900, color: "#111", fontSize: 14 }}>{address.label}</div>
                  <div style={{ marginTop: 6, color: "rgba(0,0,0,0.65)", fontWeight: 700, lineHeight: 1.5 }}>
                    {[address.addressLine1, address.municipality, address.region].filter(Boolean).join(", ")}
                  </div>
                </div>
                <button type="button" style={ghostDeleteStyle} onClick={() => removeAddress(address.id)}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {editingAddress ? (
          <div style={editorShellStyle}>
            <div className="account-address-grid" style={{ display: "grid", gap: 12 }}>
              <label style={fieldStyle}>
                <span>Nombre completo</span>
                <input
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm((current) => ({ ...current, fullName: e.target.value }))}
                  style={inputStyle}
                />
              </label>
              <label style={fieldStyle}>
                <span>Correo</span>
                <input
                  type="email"
                  value={addressForm.email}
                  onChange={(e) => setAddressForm((current) => ({ ...current, email: e.target.value }))}
                  style={inputStyle}
                />
              </label>
              <div className="account-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={fieldStyle}>
                  <span>Documento</span>
                  <select
                    value={addressForm.documentType}
                    onChange={(e) =>
                      setAddressForm((current) => ({
                        ...current,
                        documentType: e.target.value as DocumentType | "",
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Selecciona</option>
                    <option value="CC">Cedula</option>
                    <option value="CE">Extranjeria</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </label>
                <label style={fieldStyle}>
                  <span>Numero</span>
                  <input
                    value={addressForm.documentNumber}
                    onChange={(e) =>
                      setAddressForm((current) => ({ ...current, documentNumber: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </label>
              </div>
              <label style={fieldStyle}>
                <span>Telefono</span>
                <input
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((current) => ({ ...current, phone: onlyDigits(e.target.value) }))}
                  style={inputStyle}
                />
              </label>
              <div className="account-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={fieldStyle}>
                  <span>Departamento</span>
                  <select
                    value={addressForm.region}
                    onChange={(e) =>
                      setAddressForm((current) => ({
                        ...current,
                        region: e.target.value,
                        municipality: "",
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="">Selecciona departamento</option>
                    {COLOMBIA_DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={fieldStyle}>
                  <span>Ciudad</span>
                  <select
                    value={addressForm.municipality}
                    onChange={(e) =>
                      setAddressForm((current) => ({ ...current, municipality: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      {addressForm.region ? "Selecciona ciudad" : "Primero selecciona departamento"}
                    </option>
                    {municipalities.map((municipality) => (
                      <option key={municipality} value={municipality}>
                        {municipality}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={fieldStyle}>
                <span>Direccion</span>
                <input
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm((current) => ({ ...current, addressLine1: e.target.value }))}
                  style={inputStyle}
                />
              </label>
              <label style={fieldStyle}>
                <span>Notas</span>
                <textarea
                  value={addressForm.notes}
                  onChange={(e) => setAddressForm((current) => ({ ...current, notes: e.target.value }))}
                  style={{ ...inputStyle, minHeight: 90, resize: "vertical" as const }}
                />
              </label>
            </div>

            {addressError ? <div style={errorStyle}>{addressError}</div> : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button type="button" style={primaryButtonStyle} onClick={saveAddress} disabled={savingAddress}>
                {savingAddress ? "Guardando..." : "Guardar direccion"}
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => setAddressForm(emptyAddress(initialEmail))}
              >
                Nueva direccion
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="account-light-card" style={cardStyle}>
        <div style={eyebrowStyle}>Metodos de pago</div>
        <h3 className="account-section-title" style={titleStyle}>
          Tu forma de pago guardada.
        </h3>

        <div style={{ marginTop: 18 }}>
          {primaryPaymentMethod ? (
            <div
              style={{
                ...infoBoxStyle,
                background: "linear-gradient(135deg, #121212 0%, #1b1612 100%)",
                color: "#fff",
              }}
            >
              <div style={{ ...miniEyebrowStyle, color: "rgba(255,255,255,0.54)" }}>Metodo activo</div>
              <div style={{ ...valueStyle, color: "#fff" }}>
                {primaryPaymentMethod.brand} terminada en **** {primaryPaymentMethod.last4}
              </div>
              <div style={{ marginTop: 8, color: "rgba(255,255,255,0.72)", fontWeight: 700, lineHeight: 1.5 }}>
                {primaryPaymentMethod.tokenizationMode === "real"
                  ? "Tarjeta tokenizada de forma real en Wompi y lista para usarse en checkout."
                  : "Metodo guardado localmente. Si habilitas tokenización real, aquí verás tus payment sources de Wompi."}
              </div>
            </div>
          ) : (
            <div style={emptyBoxStyle}>
              Aun no tienes un metodo de pago guardado. Cuando lo agregues, tu checkout sera mas rapido.
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={infoItemStyle}>
            <div style={miniEyebrowStyle}>Estado</div>
            <div style={valueSingleStyle}>
              {paymentMethods.length ? `${paymentMethods.length} metodo${paymentMethods.length === 1 ? "" : "s"} guardado${paymentMethods.length === 1 ? "" : "s"}` : "Sin metodos guardados por ahora."}
            </div>
          </div>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => {
              setEditingPayment((current) => !current);
              setPaymentError("");
            }}
          >
            {editingPayment ? "Cerrar editor" : "Agregar tarjeta"}
          </button>
        </div>

        {paymentMethods.length > 0 ? (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {paymentMethods.map((method) => (
              <div key={method.id} style={listCardStyle}>
                <div>
                  <div style={{ fontWeight: 900, color: "#111", fontSize: 14 }}>
                    {method.label} {method.isDefault ? "· Principal" : ""}
                  </div>
                  <div style={{ marginTop: 6, color: "rgba(0,0,0,0.65)", fontWeight: 700, lineHeight: 1.5 }}>
                    {method.brand} · **** {method.last4} · {method.expMonth}/{method.expYear}
                  </div>
                </div>
                <button type="button" style={ghostDeleteStyle} onClick={() => removePaymentMethod(method.id)}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {editingPayment ? (
          <div style={editorShellStyle}>
            <div className="account-payment-grid" style={{ display: "grid", gap: 12 }}>
              <div style={hintCardStyle}>
                {loadingTokenizationConfig
                  ? "Verificando si la tokenización real de Wompi está disponible..."
                  : tokenizationConfig?.enabled
                    ? "Tu cuenta permite tokenizar tarjetas reales con Wompi. La tarjeta no se guarda completa en JUSP."
                    : tokenizationConfig?.reason ||
                      "La tokenización real no está disponible todavía para esta cuenta."}
              </div>
              <label style={fieldStyle}>
                <span>Nombre de la tarjeta</span>
                <input
                  value={paymentForm.label}
                  onChange={(e) => setPaymentForm((current) => ({ ...current, label: e.target.value }))}
                  placeholder="Ej: Visa personal"
                  style={inputStyle}
                />
              </label>
              <label style={fieldStyle}>
                <span>Titular</span>
                <input
                  value={paymentForm.cardholderName}
                  onChange={(e) =>
                    setPaymentForm((current) => ({ ...current, cardholderName: e.target.value }))
                  }
                  style={inputStyle}
                />
              </label>
              <label style={fieldStyle}>
                <span>Numero de tarjeta</span>
                <input
                  value={paymentForm.cardNumber}
                  onChange={(e) =>
                    setPaymentForm((current) => ({
                      ...current,
                      cardNumber: onlyDigits(e.target.value).slice(0, 19),
                      last4: onlyDigits(e.target.value).slice(-4),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="4242424242424242"
                  style={inputStyle}
                />
              </label>
              <div className="account-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={fieldStyle}>
                  <span>Marca</span>
                  <select
                    value={paymentForm.brand}
                    onChange={(e) => setPaymentForm((current) => ({ ...current, brand: e.target.value }))}
                    style={inputStyle}
                  >
                    {CARD_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={fieldStyle}>
                  <span>Ultimos 4 digitos</span>
                  <input
                    value={paymentForm.last4}
                    onChange={(e) =>
                      setPaymentForm((current) => ({ ...current, last4: onlyDigits(e.target.value).slice(-4) }))
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={fieldStyle}>
                  <span>CVC</span>
                  <input
                    value={paymentForm.cvc}
                    onChange={(e) =>
                      setPaymentForm((current) => ({
                        ...current,
                        cvc: onlyDigits(e.target.value).slice(0, 4),
                      }))
                    }
                    inputMode="numeric"
                    placeholder="123"
                    style={inputStyle}
                  />
                </label>
              </div>
              <div className="account-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={fieldStyle}>
                  <span>Mes</span>
                  <input
                    value={paymentForm.expMonth}
                    onChange={(e) =>
                      setPaymentForm((current) => ({ ...current, expMonth: onlyDigits(e.target.value).slice(0, 2) }))
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={fieldStyle}>
                  <span>Ano</span>
                  <input
                    value={paymentForm.expYear}
                    onChange={(e) =>
                      setPaymentForm((current) => ({ ...current, expYear: onlyDigits(e.target.value).slice(0, 4) }))
                    }
                    style={inputStyle}
                  />
                </label>
              </div>
              <label style={{ ...fieldStyle, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={paymentForm.isDefault}
                  onChange={(e) =>
                    setPaymentForm((current) => ({ ...current, isDefault: e.target.checked }))
                  }
                />
                <span>Usar como metodo principal en checkout</span>
              </label>
            </div>

            {paymentError ? <div style={errorStyle}>{paymentError}</div> : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button
                type="button"
                style={{
                  ...primaryButtonStyle,
                  opacity: !loadingTokenizationConfig && !tokenizationConfig?.enabled ? 0.55 : 1,
                  cursor:
                    !loadingTokenizationConfig && !tokenizationConfig?.enabled ? "not-allowed" : "pointer",
                }}
                onClick={savePaymentMethod}
                disabled={savingPayment || (!loadingTokenizationConfig && !tokenizationConfig?.enabled)}
              >
                {savingPayment ? "Tokenizando..." : "Tokenizar y guardar tarjeta"}
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => setPaymentForm(emptyPaymentMethod())}
              >
                Nueva tarjeta
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          .account-bottom-grid {
            grid-template-columns: 1fr !important;
          }
          .account-two {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const cardStyle = {
  borderRadius: 30,
  background: "#ffffff",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.06)",
  padding: 22,
} satisfies CSSProperties;

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "rgba(171,125,74,0.92)",
} satisfies CSSProperties;

const titleStyle = {
  margin: "12px 0 0",
  fontSize: 30,
  fontWeight: 1000,
  letterSpacing: "-0.05em",
  color: "#111",
  lineHeight: 1.06,
} satisfies CSSProperties;

const infoBoxStyle = {
  borderRadius: 20,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "linear-gradient(180deg, #fff, #faf7f4)",
  padding: 18,
} satisfies CSSProperties;

const emptyBoxStyle = {
  borderRadius: 20,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(0,0,0,0.02)",
  padding: 16,
  color: "rgba(0,0,0,0.72)",
  fontSize: 14,
  lineHeight: 1.7,
} satisfies CSSProperties;

const miniEyebrowStyle = {
  fontSize: 11,
  fontWeight: 900,
  color: "rgba(0,0,0,0.48)",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
} satisfies CSSProperties;

const valueStyle = {
  marginTop: 10,
  fontSize: 15,
  fontWeight: 800,
  color: "#111",
  lineHeight: 1.65,
} satisfies CSSProperties;

const infoItemStyle = {
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "#fff",
  padding: 14,
} satisfies CSSProperties;

const valueSingleStyle = {
  marginTop: 8,
  fontSize: 15,
  fontWeight: 800,
  color: "#111",
} satisfies CSSProperties;

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "0 18px",
  background: "linear-gradient(135deg, #121212 0%, #1b1612 100%)",
  color: "#fff",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 950,
  border: "none",
  cursor: "pointer",
} satisfies CSSProperties;

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: "#fff",
  color: "#111",
  border: "1px solid rgba(0,0,0,0.08)",
} satisfies CSSProperties;

const listCardStyle = {
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "linear-gradient(180deg, #fff, #faf7f4)",
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
} satisfies CSSProperties;

const ghostDeleteStyle = {
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "#fff",
  color: "#111",
  fontWeight: 900,
  padding: "10px 14px",
  cursor: "pointer",
} satisfies CSSProperties;

const editorShellStyle = {
  marginTop: 16,
  borderRadius: 22,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "linear-gradient(180deg, #fff, #faf7f4)",
  padding: 16,
} satisfies CSSProperties;

const hintCardStyle = {
  borderRadius: 16,
  border: "1px solid rgba(171,125,74,0.18)",
  background: "rgba(212,165,116,0.10)",
  color: "#6b4f2d",
  padding: 14,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.65,
} satisfies CSSProperties;

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  fontSize: 13,
  fontWeight: 800,
  color: "#111",
} satisfies CSSProperties;

const inputStyle = {
  width: "100%",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "#fff",
  minHeight: 48,
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 700,
  color: "#111",
  outline: "none",
} satisfies CSSProperties;

const errorStyle = {
  marginTop: 12,
  borderRadius: 16,
  padding: 12,
  border: "1px solid rgba(220,38,38,0.18)",
  background: "rgba(220,38,38,0.08)",
  color: "#991b1b",
  fontSize: 13,
  fontWeight: 800,
} satisfies CSSProperties;
