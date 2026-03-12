"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

/** =========================
 *  Types
 *  ========================= */
type FavAny = any;

type FavoriteItem = {
  id: string;
  title: string;
  price?: number | null;
  image?: string | null;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  href?: string | null;
  createdAt?: string | null;
};

type SortKey = "recommended" | "price_desc" | "price_asc" | "title_asc";

/** =========================
 *  Storage keys candidates
 *  ========================= */
const KEYS_CANDIDATES = ["jusp_favorites", "favorites", "wishlist", "jusp_wishlist"];

/** =========================
 *  Helpers (SAFE)
 *  ========================= */
function safeStr(v: unknown, max = 2000) {
  const s = typeof v === "string" ? v : "";
  return s.length > max ? s.slice(0, max) : s;
}

function safeNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeMoneyCOP(n: number) {
  const rounded = Math.round(n);
  return rounded.toLocaleString("es-CO");
}

function compactId(id: string) {
  const s = String(id || "");
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function tryParseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeOne(raw: FavAny): FavoriteItem | null {
  if (typeof raw === "string") {
    const id = raw.trim();
    if (!id) return null;
    return { id, title: "Producto guardado", href: `/product/${encodeURIComponent(id)}` };
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    const id = String(raw);
    return { id, title: "Producto guardado", href: `/product/${encodeURIComponent(id)}` };
  }

  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;

  const id =
    safeStr(r.id, 160).trim() ||
    safeStr(r.product_id, 160).trim() ||
    safeStr(r.sku, 160).trim() ||
    safeStr(r.slug, 160).trim();

  if (!id) return null;

  const title =
    safeStr(r.title, 220).trim() ||
    safeStr(r.name, 220).trim() ||
    safeStr(r.product_title, 220).trim() ||
    "Producto guardado";

  const price =
    safeNum(r.price) ??
    safeNum(r.amount) ??
    safeNum(r.sale_price) ??
    safeNum(r.retail_price) ??
    safeNum(r.value) ??
    null;

  const image =
    safeStr(r.image, 1400).trim() ||
    safeStr(r.img, 1400).trim() ||
    safeStr(r.thumbnail, 1400).trim() ||
    safeStr(r.cover, 1400).trim() ||
    null;

  const brand = safeStr(r.brand, 120).trim() || safeStr(r.marca, 120).trim() || null;

  const size =
    safeStr(r.size, 60).trim() ||
    safeStr(r.talla, 60).trim() ||
    (Array.isArray(r.sizes) && r.sizes[0] ? safeStr(r.sizes[0], 60).trim() : "") ||
    null;

  const color =
    safeStr(r.color, 60).trim() ||
    safeStr(r.colour, 60).trim() ||
    safeStr(r.colorway, 60).trim() ||
    (Array.isArray(r.colors) && r.colors[0] ? safeStr(r.colors[0], 60).trim() : "") ||
    null;

  const href =
    safeStr(r.href, 600).trim() ||
    safeStr(r.url, 600).trim() ||
    safeStr(r.link, 600).trim() ||
    (id ? `/product/${encodeURIComponent(id)}` : "/products");

  const createdAt =
    safeStr(r.createdAt, 60).trim() ||
    safeStr(r.created_at, 60).trim() ||
    safeStr(r.savedAt, 60).trim() ||
    null;

  return {
    id,
    title,
    price,
    image,
    brand,
    size: size || null,
    color: color || null,
    href: href || null,
    createdAt,
  };
}

function normalizeList(input: unknown): FavoriteItem[] {
  const out: FavoriteItem[] = [];
  if (!input) return out;

  const maybeObj = input as any;
  if (typeof maybeObj === "object" && !Array.isArray(maybeObj)) {
    const arr =
      (Array.isArray(maybeObj.items) && maybeObj.items) ||
      (Array.isArray(maybeObj.favorites) && maybeObj.favorites) ||
      (Array.isArray(maybeObj.list) && maybeObj.list) ||
      null;

    if (arr) return normalizeList(arr);
  }

  if (!Array.isArray(input)) {
    const one = normalizeOne(input as any);
    return one ? [one] : [];
  }

  for (const raw of input) {
    const one = normalizeOne(raw);
    if (!one) continue;
    if (!out.some((x) => x.id === one.id)) out.push(one);
  }

  return out;
}

function readFavoritesRaw(): { key: string | null; value: unknown } {
  if (typeof window === "undefined") return { key: null, value: null };

  for (const k of KEYS_CANDIDATES) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;

    const parsed = tryParseJSON<any>(raw);
    if (parsed !== null) return { key: k, value: parsed };

    const trimmed = raw.trim();
    if (trimmed.includes(",")) {
      const arr = trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return { key: k, value: arr };
    }

    return { key: k, value: trimmed };
  }

  return { key: null, value: null };
}

function writeFavorites(key: string, items: FavoriteItem[]) {
  if (typeof window === "undefined") return;

  const payload = items.map((x) => ({
    id: x.id,
    title: x.title,
    price: x.price ?? null,
    image: x.image ?? null,
    brand: x.brand ?? null,
    size: x.size ?? null,
    color: x.color ?? null,
    href: x.href ?? null,
    createdAt: x.createdAt ?? null,
  }));

  window.localStorage.setItem(key, JSON.stringify(payload));
}

function uniq(arr: string[]) {
  const out: string[] = [];
  for (const a of arr) if (a && !out.includes(a)) out.push(a);
  return out;
}

/** =========================
 *  Page
 *  ========================= */
export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [storeKey, setStoreKey] = useState<string>("jusp_favorites");
  const [items, setItems] = useState<FavoriteItem[]>([]);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [chip, setChip] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [active, setActive] = useState<FavoriteItem | null>(null);

  const mounted = useRef(true);
  const toastTimer = useRef<any>(null);

  function showToast(msg: string) {
    if (!mounted.current) return;
    setToast(msg);

    if (toastTimer.current) clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 2200);
  }

  function reload() {
    setLoading(true);
    try {
      const { key, value } = readFavoritesRaw();
      const normalized = normalizeList(value);
      setStoreKey(key || "jusp_favorites");
      setItems(normalized);
    } finally {
      setTimeout(() => setLoading(false), 180);
    }
  }

  useEffect(() => {
    mounted.current = true;
    reload();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (KEYS_CANDIDATES.includes(e.key)) reload();
    };

    window.addEventListener("storage", onStorage);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      mounted.current = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("keydown", onKey);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const kpis = useMemo(() => {
    const total = items.length;
    const withPrice = items.filter((x) => typeof x.price === "number" && Number.isFinite(x.price)).length;
    const sum = items.reduce((acc, x) => acc + (typeof x.price === "number" ? x.price : 0), 0);
    return { total, withPrice, sum };
  }, [items]);

  const chips = useMemo(() => {
    const c: string[] = [];
    for (const it of items) {
      if (it.brand) c.push(it.brand);
      if (it.size) c.push(`Talla ${it.size}`);
      if (it.color) c.push(it.color);
    }
    return uniq(c).slice(0, 14);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...items];

    if (chip) {
      const cl = chip.toLowerCase();
      list = list.filter((x) => {
        const all = [
          x.brand ? String(x.brand) : "",
          x.size ? `Talla ${x.size}` : "",
          x.color ? String(x.color) : "",
        ]
          .join(" · ")
          .toLowerCase();

        return all.includes(cl);
      });
    }

    if (q) {
      list = list.filter((x) => {
        const hay = `${x.title} ${x.brand || ""} ${x.size || ""} ${x.color || ""} ${x.id}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sort === "price_desc") {
      list.sort((a, b) => (Number(b.price ?? -1) || -1) - (Number(a.price ?? -1) || -1));
    } else if (sort === "price_asc") {
      list.sort((a, b) => (Number(a.price ?? 1e18) || 1e18) - (Number(b.price ?? 1e18) || 1e18));
    } else if (sort === "title_asc") {
      list.sort((a, b) => String(a.title).localeCompare(String(b.title), "es"));
    } else {
      list.sort((a, b) => {
        const ap = typeof a.price === "number" ? 1 : 0;
        const bp = typeof b.price === "number" ? 1 : 0;
        const ai = a.image ? 1 : 0;
        const bi = b.image ? 1 : 0;
        const scoreA = ai * 2 + ap;
        const scoreB = bi * 2 + bp;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return String(a.title).localeCompare(String(b.title), "es");
      });
    }

    return list;
  }, [items, query, sort, chip]);

  function remove(id: string) {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    writeFavorites(storeKey, next);
    showToast("Eliminado de favoritos");
    if (active?.id === id) setActive(null);
  }

  function clearAll() {
    setItems([]);
    try {
      window.localStorage.setItem(storeKey, JSON.stringify([]));
    } catch {}
    showToast("Favoritos vacíos");
    setActive(null);
  }

  function copyText(label: string, value: string) {
    if (!value) {
      showToast("Nada para copiar");
      return;
    }

    try {
      navigator.clipboard.writeText(value);
      showToast(`${label} copiado`);
    } catch {
      showToast("No se pudo copiar");
    }
  }

  function applyChipFromModal(value: string) {
    const v = String(value || "").trim();
    if (!v) return;
    setActive(null);
    setQuery("");
    setChip(v);
    showToast(`Filtrando: ${v}`);
  }

  function productHrefFrom(item: FavoriteItem) {
    const h = (item.href || "").trim();
    if (h) return h;
    return `/product/${encodeURIComponent(item.id)}`;
  }

  const emptyByFilter = !loading && items.length > 0 && filtered.length === 0;

  return (
    <main className="fv-root">
      <div className="fv-wrap">
        <section className={`hero ${loading ? "isLoading" : "ready"}`}>
          <div className="hero-left">
            <div className="eyebrow-row">
              <div className="kicker">CUENTA</div>
              <div className="eyebrow-pill">Colección personal</div>
            </div>

            <h1 className="title">Favoritos</h1>

            <p className="sub">
              Todo lo que guardas en JUSP, en un solo lugar. Más limpio, más premium y listo para volver
              cuando quieras.
            </p>

            <div className="stats">
              <div className="stat stat-featured">
                <div className="stat-l">Guardados</div>
                <div className="stat-v">{loading ? "—" : kpis.total}</div>
                <div className="stat-s">Tus piezas guardadas</div>
              </div>

              <div className="stat">
                <div className="stat-l">Con precio</div>
                <div className="stat-v">{loading ? "—" : kpis.withPrice}</div>
                <div className="stat-s">Listos para comparar</div>
              </div>

              <div className="stat">
                <div className="stat-l">Valor visible</div>
                <div className="stat-v">{loading ? "—" : `$${safeMoneyCOP(kpis.sum)}`}</div>
                <div className="stat-s">Suma referencial</div>
              </div>

              <div className="stat">
                <div className="stat-l">Estado</div>
                <div className="stat-v mono">{loading ? "—" : items.length ? "ACTIVO" : "VACÍO"}</div>
                <div className="stat-s">{loading ? "Cargando" : items.length ? "Tu selección vive aquí" : "Listo para empezar"}</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-topline">
              <div className="hero-badge">{loading ? "Preparando vista…" : filtered.length === 1 ? "1 favorito visible" : `${filtered.length} favoritos visibles`}</div>
            </div>

            <div className="actions">
              <Link className="btn ghost bright" href="/products">
                Seguir comprando
              </Link>

              <button className="btn ghost" onClick={reload} disabled={loading} aria-busy={loading}>
                {loading ? "Cargando…" : "Actualizar"}
              </button>

              <button className="btn danger" onClick={clearAll} disabled={loading || items.length === 0}>
                Vaciar
              </button>
            </div>

            <div className="controls">
              <div className="search">
                <span className="search-ico">⌕</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en tus favoritos…"
                  spellCheck={false}
                />
                {query ? (
                  <button className="x" onClick={() => setQuery("")} type="button" aria-label="Limpiar">
                    ×
                  </button>
                ) : null}
              </div>

              <div className="sort">
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Ordenar">
                  <option value="recommended">Recomendado</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="title_asc">Nombre: A → Z</option>
                </select>
              </div>
            </div>

            {chips.length ? (
              <div className="chipbar" role="list">
                <button className={`chip ${chip === null ? "on" : ""}`} onClick={() => setChip(null)} type="button">
                  Todo
                </button>

                {chips.map((c) => (
                  <button
                    key={c}
                    className={`chip ${chip === c ? "on" : ""}`}
                    onClick={() => setChip(chip === c ? null : c)}
                    type="button"
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <div className="hint">Tu colección se irá refinando a medida que guardes más productos.</div>
            )}
          </div>

          <div className="hero-glow" />
          <div className="hero-grid-shine" />
        </section>

        {loading ? (
          <div className="grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card sk">
                <div className="sk-img" />
                <div className="sk-body">
                  <div className="sk-line w70" />
                  <div className="sk-line w55" />
                  <div className="sk-line w35" />
                  <div className="sk-row">
                    <div className="sk-pill w25" />
                    <div className="sk-pill w35" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="empty-card">
              <div className="empty-orb" />
              <div className="empty-badge">Tu selección aún está vacía</div>
              <div className="empty-h">Empieza a guardar lo mejor de JUSP</div>
              <div className="empty-p">
                Cuando marques un producto como favorito, aparecerá aquí con una vista más limpia,
                más rápida y mucho más premium.
              </div>

              <div className="empty-actions">
                <Link className="btn" href="/products">
                  Ver productos
                </Link>

                <Link className="btn ghost" href="/account">
                  Ir a mi cuenta
                </Link>
              </div>
            </div>
          </div>
        ) : emptyByFilter ? (
          <div className="empty">
            <div className="empty-card compact">
              <div className="empty-badge">Sin resultados</div>
              <div className="empty-h">No hay coincidencias con ese filtro</div>
              <div className="empty-p">Prueba otra búsqueda o vuelve a mostrar toda tu colección.</div>

              <div className="empty-actions">
                <button className="btn" onClick={() => setQuery("")} type="button">
                  Limpiar búsqueda
                </button>

                <button className="btn ghost" onClick={() => setChip(null)} type="button">
                  Mostrar todo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid enter">
            {filtered.map((p, idx) => {
              const title = p.title || "Producto";
              const price = typeof p.price === "number" ? p.price : null;
              const chipsLocal: string[] = [];

              if (p.brand) chipsLocal.push(String(p.brand));
              if (p.size) chipsLocal.push(`Talla ${p.size}`);
              if (p.color) chipsLocal.push(String(p.color));

              return (
                <button
                  key={p.id}
                  className="card"
                  style={{ animationDelay: `${Math.min(idx * 16, 180)}ms` }}
                  onClick={() => setActive(p)}
                  type="button"
                >
                  <div className="img">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={title} loading="lazy" />
                    ) : (
                      <div className="noimg">
                        <span className="noimg-dot" />
                        <span>Sin imagen</span>
                      </div>
                    )}

                    <div className="img-shade" />

                    <div className="topline">
                      <span className="tag mono">{compactId(p.id)}</span>

                      {price !== null ? (
                        <span className="tag price">${safeMoneyCOP(price)}</span>
                      ) : (
                        <span className="tag soft">Guardado</span>
                      )}
                    </div>
                  </div>

                  <div className="body">
                    <div className="t">{title}</div>

                    <div className="chips">
                      {chipsLocal.length ? (
                        chipsLocal.slice(0, 3).map((c) => (
                          <span key={c} className="chip">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="chip soft">Favorito</span>
                      )}
                    </div>

                    <div className="hintline">
                      <span>Ver detalle</span>
                      <span className="arrow">→</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {active ? (
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setActive(null);
            }}
          >
            <div className="sheet" role="document">
              <div className="sheet-top">
                <div>
                  <div className="sheet-k">FAVORITO</div>
                  <div className="sheet-h">{active.title}</div>

                  <div className="sheet-sub">
                    <span className="mono">{compactId(active.id)}</span>
                    {typeof active.price === "number" ? (
                      <>
                        <span className="dot">•</span>
                        <span className="price">${safeMoneyCOP(active.price)}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <button className="x2" onClick={() => setActive(null)} type="button" aria-label="Cerrar">
                  ×
                </button>
              </div>

              <div className="sheet-body">
                <div className="sheet-img">
                  {active.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={active.image} alt={active.title} />
                  ) : (
                    <div className="sheet-noimg">
                      <span className="noimg-dot" />
                      <span>Sin imagen</span>
                    </div>
                  )}
                </div>

                <div className="sheet-meta">
                  <div className="meta-grid">
                    <div className="meta">
                      <div className="meta-l">Marca</div>
                      <div className="meta-v">{active.brand || "—"}</div>
                    </div>

                    <div className="meta">
                      <div className="meta-l">Talla</div>
                      <div className="meta-v">{active.size ? `Talla ${active.size}` : "—"}</div>
                    </div>

                    <div className="meta">
                      <div className="meta-l">Color</div>
                      <div className="meta-v">{active.color || "—"}</div>
                    </div>

                    <div className="meta">
                      <div className="meta-l">Destino</div>
                      <div className="meta-v mono">{productHrefFrom(active) ? "DISPONIBLE" : "—"}</div>
                    </div>
                  </div>

                  <div className="sheet-actions">
                    <Link className="btn ghost" href={productHrefFrom(active)}>
                      Ver producto
                    </Link>

                    <button className="btn ghost" onClick={() => copyText("ID", active.id)} type="button">
                      Copiar ID
                    </button>

                    <button className="btn ghost" onClick={() => copyText("Link", productHrefFrom(active))} type="button">
                      Copiar link
                    </button>

                    <button className="btn" onClick={() => remove(active.id)} type="button">
                      Quitar de favoritos
                    </button>
                  </div>

                  <div className="sheet-chipbar">
                    {active.brand ? (
                      <button type="button" className="chip" onClick={() => applyChipFromModal(active.brand!)}>
                        {active.brand}
                      </button>
                    ) : null}

                    {active.size ? (
                      <button type="button" className="chip" onClick={() => applyChipFromModal(`Talla ${active.size}`)}>
                        Talla {active.size}
                      </button>
                    ) : null}

                    {active.color ? (
                      <button type="button" className="chip" onClick={() => applyChipFromModal(active.color!)}>
                        {active.color}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>

      <style jsx>{`
        :global(html) {
          scroll-behavior: smooth;
        }

        .fv-root {
          padding-top: calc(var(--jusp-header-h, 64px) + 18px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 42px;
          background:
            radial-gradient(1200px 620px at 14% -2%, rgba(255, 214, 0, 0.12), transparent 48%),
            radial-gradient(900px 520px at 95% 8%, rgba(0, 0, 0, 0.06), transparent 58%),
            linear-gradient(180deg, #f7f7f7 0%, #f1f1f1 100%);
          min-height: 100vh;
        }

        .fv-wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero {
          position: relative;
          border-radius: 32px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 248, 248, 0.96));
          box-shadow:
            0 26px 80px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          padding: 22px;
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 16px;
          transform: translateY(10px);
          opacity: 0;
          animation: heroIn 420ms ease forwards;
          isolation: isolate;
        }

        @keyframes heroIn {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .hero.isLoading {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-glow {
          position: absolute;
          inset: -1px;
          pointer-events: none;
          background:
            radial-gradient(900px 420px at 10% 0%, rgba(255, 214, 0, 0.22), transparent 54%),
            radial-gradient(760px 420px at 100% 0%, rgba(0, 0, 0, 0.05), transparent 60%);
          mix-blend-mode: multiply;
          z-index: 0;
        }

        .hero-grid-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(125deg, rgba(255, 255, 255, 0.26), transparent 35%, transparent 70%, rgba(255, 255, 255, 0.18));
          opacity: 0.65;
          z-index: 0;
        }

        .hero-left,
        .hero-right {
          position: relative;
          z-index: 1;
        }

        .eyebrow-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .eyebrow-pill {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          border-radius: 999px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 950;
          color: #111;
          background: rgba(255, 214, 0, 0.38);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 10px 24px rgba(255, 214, 0, 0.14);
        }

        .kicker {
          font-weight: 950;
          font-size: 11px;
          letter-spacing: 0.16em;
          color: rgba(0, 0, 0, 0.54);
        }

        .title {
          margin: 8px 0 8px;
          font-size: 42px;
          line-height: 0.96;
          font-weight: 1000;
          letter-spacing: -0.045em;
          color: #0f0f0f;
        }

        .sub {
          margin: 0;
          max-width: 720px;
          color: rgba(0, 0, 0, 0.72);
          font-size: 14px;
          line-height: 1.72;
          font-weight: 700;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
            monospace;
          font-weight: 950;
        }

        .stats {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .stat {
          position: relative;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(244, 244, 244, 0.9));
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 14px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56);
        }

        .stat-featured {
          background: linear-gradient(180deg, rgba(255, 245, 184, 0.74), rgba(255, 255, 255, 0.9));
        }

        .stat-l {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.14em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }

        .stat-v {
          margin-top: 8px;
          font-size: 21px;
          font-weight: 1000;
          color: #111;
          word-break: break-word;
          letter-spacing: -0.03em;
        }

        .stat-s {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.45;
          color: rgba(0, 0, 0, 0.58);
          font-weight: 800;
        }

        .hero-topline {
          display: flex;
          justify-content: flex-end;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          border-radius: 999px;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 950;
          color: #111;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06);
        }

        .actions {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .controls {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1fr 230px;
          gap: 10px;
        }

        .search {
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.88);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .search-ico {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.45);
        }

        .search input {
          border: 0;
          outline: none;
          width: 100%;
          font-size: 13px;
          font-weight: 900;
          color: #111;
          background: transparent;
        }

        .x {
          border: 0;
          background: rgba(0, 0, 0, 0.06);
          color: #111;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 950;
        }

        .sort select {
          width: 100%;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.88);
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 900;
          outline: none;
          color: #111;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .chipbar {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .hint {
          margin-top: 14px;
          color: rgba(0, 0, 0, 0.6);
          font-size: 12px;
          font-weight: 900;
          text-align: right;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .card {
          text-align: left;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 247, 247, 0.94));
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow:
            0 24px 64px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
          overflow: hidden;
          cursor: pointer;
          transform: translateY(10px);
          opacity: 0;
          animation: pop 360ms ease forwards;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          padding: 0;
          position: relative;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 32px 84px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
          border-color: rgba(0, 0, 0, 0.12);
        }

        @keyframes pop {
          to {
            transform: translateY(0px);
            opacity: 1;
          }
        }

        .img {
          height: 208px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.05));
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
        }

        .img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.02);
          transition: transform 240ms ease;
        }

        .card:hover .img img {
          transform: scale(1.06);
        }

        .img-shade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.08));
        }

        .topline {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          pointer-events: none;
        }

        .tag {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 950;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          white-space: nowrap;
        }

        .tag.price {
          background: rgba(17, 17, 17, 0.92);
          border-color: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.94);
        }

        .tag.soft {
          background: rgba(255, 214, 0, 0.62);
          color: #111;
        }

        .noimg {
          height: 100%;
          display: grid;
          place-items: center;
          gap: 8px;
          color: rgba(0, 0, 0, 0.55);
          font-weight: 900;
        }

        .noimg-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.18);
        }

        .body {
          padding: 14px;
          display: grid;
          gap: 10px;
        }

        .t {
          font-weight: 950;
          color: #111;
          font-size: 15px;
          line-height: 1.28;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: -0.02em;
        }

        .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .chip {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.78);
          white-space: nowrap;
          cursor: pointer;
          transition: transform 120ms ease, background 120ms ease, color 120ms ease;
        }

        .chip:active {
          transform: scale(0.98);
        }

        .chip.soft {
          background: rgba(255, 214, 0, 0.45);
          border-color: rgba(0, 0, 0, 0.12);
          color: #111;
        }

        .chip.on {
          background: rgba(17, 17, 17, 0.94);
          border-color: rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.94);
        }

        .hintline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          padding-top: 8px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .arrow {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.55);
        }

        .btn {
          border: 0;
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          background: #111;
          color: #fff;
          font-size: 13px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: transform 140ms ease, opacity 140ms ease, background 140ms ease, box-shadow 140ms ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .btn.ghost {
          background: rgba(255, 255, 255, 0.92);
          color: #111;
          border: 1px solid rgba(0, 0, 0, 0.14);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.05);
        }

        .btn.ghost:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .btn.ghost.bright {
          background: #fff;
        }

        .btn.danger {
          background: rgba(17, 17, 17, 0.94);
        }

        .btn.danger:hover {
          background: rgba(239, 68, 68, 0.94);
        }

        .empty {
          margin-top: 18px;
          display: grid;
          place-items: center;
          min-height: 52vh;
        }

        .empty-card {
          position: relative;
          max-width: 720px;
          width: 100%;
          border-radius: 30px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 246, 246, 0.96));
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
          padding: 24px;
          isolation: isolate;
        }

        .empty-card.compact {
          max-width: 620px;
        }

        .empty-orb {
          position: absolute;
          top: -100px;
          right: -40px;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 214, 0, 0.28), transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .empty-badge,
        .empty-h,
        .empty-p,
        .empty-actions {
          position: relative;
          z-index: 1;
        }

        .empty-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 214, 0, 0.55);
          color: #111;
        }

        .empty-h {
          margin-top: 12px;
          font-size: 28px;
          line-height: 1.04;
          font-weight: 1000;
          color: #111;
          letter-spacing: -0.04em;
        }

        .empty-p {
          margin-top: 10px;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.7);
          line-height: 1.72;
          font-weight: 800;
          max-width: 560px;
        }

        .empty-actions {
          margin-top: 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.38);
          display: grid;
          place-items: center;
          padding: 16px;
          z-index: 80;
          animation: fade 160ms ease forwards;
        }

        @keyframes fade {
          to {
            background: rgba(0, 0, 0, 0.5);
          }
        }

        .sheet {
          width: min(980px, 100%);
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 248, 248, 0.96));
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 38px 120px rgba(0, 0, 0, 0.34);
          overflow: hidden;
          transform: translateY(10px);
          opacity: 0;
          animation: sheetIn 220ms ease forwards;
        }

        @keyframes sheetIn {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .sheet-top {
          padding: 16px 16px 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .sheet-k {
          font-weight: 950;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: rgba(0, 0, 0, 0.55);
        }

        .sheet-h {
          margin-top: 6px;
          font-size: 22px;
          line-height: 1.06;
          font-weight: 1000;
          color: #111;
          letter-spacing: -0.03em;
        }

        .sheet-sub {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.62);
          font-weight: 900;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .dot {
          opacity: 0.5;
        }

        .price {
          color: rgba(0, 0, 0, 0.78);
        }

        .x2 {
          border: 0;
          background: rgba(0, 0, 0, 0.06);
          color: #111;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 950;
          font-size: 18px;
        }

        .sheet-body {
          padding: 16px;
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 16px;
        }

        .sheet-img {
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.03);
          height: 380px;
        }

        .sheet-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sheet-noimg {
          height: 100%;
          display: grid;
          place-items: center;
          gap: 8px;
          color: rgba(0, 0, 0, 0.55);
          font-weight: 900;
        }

        .sheet-meta {
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .meta {
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 12px;
        }

        .meta-l {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
        }

        .meta-v {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.8);
          word-break: break-word;
        }

        .sheet-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sheet-chipbar {
          margin-top: 2px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .toast {
          position: fixed;
          right: 16px;
          bottom: 16px;
          border-radius: 999px;
          padding: 10px 12px;
          background: rgba(17, 17, 17, 0.94);
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.25);
          z-index: 90;
        }

        .sk {
          opacity: 1;
          transform: none;
          animation: none;
          cursor: default;
        }

        .sk-img {
          height: 208px;
          background: rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
        }

        .sk-body {
          padding: 14px;
          display: grid;
          gap: 10px;
        }

        .sk-line,
        .sk-pill {
          position: relative;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 999px;
        }

        .sk-line {
          height: 12px;
        }

        .sk-pill {
          height: 26px;
        }

        .sk-row {
          display: flex;
          gap: 10px;
        }

        .sk-img::after,
        .sk-line::after,
        .sk-pill::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
          animation: shimmer 1.2s infinite;
        }

        @keyframes shimmer {
          to {
            transform: translateX(100%);
          }
        }

        .w25 {
          width: 25%;
        }

        .w35 {
          width: 35%;
        }

        .w55 {
          width: 55%;
        }

        .w70 {
          width: 70%;
        }

        @media (max-width: 1100px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .hero {
            grid-template-columns: 1fr;
          }

          .actions,
          .hero-topline {
            justify-content: flex-start;
          }

          .chipbar,
          .hint {
            justify-content: flex-start;
            text-align: left;
          }
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .controls {
            grid-template-columns: 1fr;
          }

          .sheet-body {
            grid-template-columns: 1fr;
          }

          .sheet-img {
            height: 300px;
          }

          .meta-grid {
            grid-template-columns: 1fr 1fr;
          }

          .title {
            font-size: 36px;
          }
        }

        @media (max-width: 520px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .meta-grid {
            grid-template-columns: 1fr;
          }

          .title {
            font-size: 32px;
          }

          .hero,
          .empty-card,
          .sheet {
            border-radius: 24px;
          }
        }
      `}</style>
    </main>
  );
}