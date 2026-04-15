"use client";

import Link from "next/link";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type Product } from "@/lib/products";

function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mq.matches);

    onChange();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    const legacyMq = mq as any;
    legacyMq.addListener?.(onChange);
    return () => legacyMq.removeListener?.(onChange);
  }, [breakpoint]);

  return isMobile;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    const legacyMq = mq as any;
    legacyMq.addListener?.(onChange);
    return () => legacyMq.removeListener?.(onChange);
  }, []);

  return reduced;
}

function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => setCoarse(mq.matches);
    onChange();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    const legacyMq = mq as any;
    legacyMq.addListener?.(onChange);
    return () => legacyMq.removeListener?.(onChange);
  }, []);

  return coarse;
}

type SmartImgProps = {
  baseSrc: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  onLoad?: () => void;
};

function SmartImg({
  baseSrc,
  alt,
  style,
  className,
  loading = "lazy",
  fetchPriority = "auto",
  onLoad,
}: SmartImgProps) {
  const safeBaseSrc = String((baseSrc as any) ?? "");
  const hasExt = useMemo(() => /\.[a-zA-Z0-9]+$/.test(safeBaseSrc), [safeBaseSrc]);

  const candidates = useMemo(() => {
    if (!safeBaseSrc) return [];
    if (hasExt) return [safeBaseSrc];

    const raw = [
      safeBaseSrc,
      `${safeBaseSrc}.jpg`,
      `${safeBaseSrc}.jpeg`,
      `${safeBaseSrc}.png`,
      `${safeBaseSrc}.webp`,
      `${safeBaseSrc}.avif`,
      `${safeBaseSrc.toLowerCase()}.jpg`,
      `${safeBaseSrc.toLowerCase()}.jpeg`,
      `${safeBaseSrc.toLowerCase()}.png`,
      `${safeBaseSrc.toLowerCase()}.webp`,
      `${safeBaseSrc.toLowerCase()}.avif`,
    ];

    return Array.from(new Set(raw.filter(Boolean)));
  }, [safeBaseSrc, hasExt]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [safeBaseSrc]);

  const src = candidates[Math.min(idx, candidates.length - 1)];

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onLoad={onLoad}
      onError={() => {
        if (idx < candidates.length - 1) {
          setIdx((i) => Math.min(i + 1, candidates.length - 1));
        }
      }}
    />
  );
}

type TopItem = {
  id: string;
  name: string;
  href: string;
  imgBase: string;
  img?: string;
  brand?: string;
  price?: string;
  gender?: "men" | "women" | "kids";
  expressDelivery?: boolean;
  searchBlob?: string;
};

const TOP_ITEMS: TopItem[] = [
  { id: "t1", name: "Air Max", href: "/products?tag=top&pick=01", imgBase: "/home/mas-top/01", brand: "Nike", price: "Drop Top" },
  { id: "t2", name: "Superstar", href: "/products?tag=top&pick=02", imgBase: "/home/mas-top/02", brand: "Adidas", price: "Drop Top" },
  { id: "t3", name: "Jordan Low", href: "/products?tag=top&pick=03", imgBase: "/home/mas-top/03", brand: "Jordan", price: "Drop Top" },
  { id: "t4", name: "Air Force 1", href: "/products?tag=top&pick=04", imgBase: "/home/mas-top/04", brand: "Nike", price: "Drop Top" },
  { id: "t5", name: "Dunk Low", href: "/products?tag=top&pick=05", imgBase: "/home/mas-top/05", brand: "Nike", price: "Drop Top" },
  { id: "t6", name: "Campus", href: "/products?tag=top&pick=06", imgBase: "/home/mas-top/06", brand: "Adidas", price: "Drop Top" },
  { id: "t7", name: "Tech Fleece", href: "/products?tag=top&pick=07", imgBase: "/home/mas-top/07", brand: "Nike", price: "Drop Top" },
  { id: "t8", name: "Essentials", href: "/products?tag=top&pick=08", imgBase: "/home/mas-top/08", brand: "Fear of God", price: "Drop Top" },
  { id: "t9", name: "Running", href: "/products?tag=top&pick=09", imgBase: "/home/mas-top/09", brand: "Nike", price: "Drop Top" },
  { id: "t10", name: "Metcon", href: "/products?tag=top&pick=10", imgBase: "/home/mas-top/10", brand: "Nike", price: "Drop Top" },
];

function formatCOP(n: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "";
  return Math.round(x).toLocaleString("es-CO");
}

function minPriceFromProduct(p: any): number | null {
  const variants = Array.isArray(p?.variants) ? p.variants : [];
  let best: number | null = null;

  for (const v of variants) {
    const n = Number((v as any)?.price);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (best === null || n < best) best = n;
  }

  if (best !== null) return best;

  const base = Number(p?.price);
  if (Number.isFinite(base) && base > 0) return base;

  return null;
}

type HomeProductFilter = "all" | "men" | "women" | "accessories" | "kids";

function normalizeHomeFilterParam(v: unknown): HomeProductFilter | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;

  if (["all", "todo", "todos"].includes(s)) return "all";
  if (["men", "man", "hombre", "male", "masculino", "unisex"].includes(s)) return "men";
  if (["women", "woman", "mujer", "female", "femenino"].includes(s)) return "women";
  if (["kids", "kid", "children", "child", "niños", "ninos", "niñas", "ninas", "junior", "boys", "girls", "infantil"].includes(s)) return "kids";
  if (["accessories", "accessory", "accesorios", "accesorio"].includes(s)) return "accessories";

  return null;
}

function homeFilterLabel(filter: HomeProductFilter) {
  if (filter === "men") return "Hombre";
  if (filter === "women") return "Mujer";
  if (filter === "kids") return "Niños";
  if (filter === "accessories") return "Accesorios";
  return "Te podría gustar";
}

function matchesHomeProductFilter(item: TopItem, filter: "all" | "men" | "women" | "accessories" | "kids") {
  if (filter === "all") return true;
  if (filter === "men") return item.gender === "men";
  if (filter === "women") return item.gender === "women";
  if (filter === "kids") return item.gender === "kids";

  const blob = String(item.searchBlob ?? `${item.name} ${item.brand ?? ""}`).toLowerCase();
  return [
    "accesorio",
    "accessor",
    "gorra",
    "cap",
    "mochila",
    "bag",
    "bolso",
    "media",
    "sock",
    "cintur",
    "belt",
    "botella",
    "glove",
    "guante",
    "beanie",
    "hat",
    "wallet",
  ].some((term) => blob.includes(term));
}

function normalizeHomeGender(v: unknown): "men" | "women" | "kids" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;

  if (
    s === "women" ||
    s === "mujer" ||
    s === "w" ||
    s === "female" ||
    s === "femenino"
  ) {
    return "women";
  }

  if (
    s === "kids" ||
    s === "kid" ||
    s === "children" ||
    s === "child" ||
    s === "niños" ||
    s === "ninos" ||
    s === "niñas" ||
    s === "ninas" ||
    s === "niño" ||
    s === "nino" ||
    s === "niña" ||
    s === "nina" ||
    s === "boys" ||
    s === "girls"
  ) {
    return "kids";
  }

  if (
    s === "men" ||
    s === "man" ||
    s === "hombre" ||
    s === "male" ||
    s === "masculino" ||
    s === "unisex"
  ) {
    return "men";
  }

  return null;
}

function inferProductGender(p: any): "men" | "women" | "kids" {
  const direct = normalizeHomeGender(p?.gender);
  if (direct) return direct;

  const blob = [
    p?.gender,
    p?.category,
    p?.kind,
    p?.productType,
    p?.title,
    p?.name,
    p?.slug,
    p?.product_code,
    p?.brand,
    ...(Array.isArray(p?.tags) ? p.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    [
      "kids",
      "kid",
      "children",
      "child",
      "niños",
      "ninos",
      "niñas",
      "ninas",
      "niño",
      "nino",
      "niña",
      "nina",
      "junior",
      "boys",
      "girls",
      "short-nike-kids",
    ].some((term) => blob.includes(term))
  ) {
    return "kids";
  }

  if (
    [
      "women",
      "mujer",
      "female",
      "femenino",
      "bra",
      "sujetador",
      "leggings",
      "top",
      "sports-bra",
      "womens",
      "women's",
      "dri-fit women",
      "nike-bra-dri-fit",
    ].some((term) => blob.includes(term))
  ) {
    return "women";
  }

  return "men";
}

function firstImageFromProduct(p: Product, slug: string): string {
  const imgs = Array.isArray((p as any).images) ? ((p as any).images as unknown[]) : [];
  const main = String((imgs?.[0] as any) || ((p as any).image as any) || (slug ? `/products/${slug}/1` : "")).trim();

  if (!main) return slug ? `/products/${slug}/1` : "";

  const isAbs = /^https?:\/\//i.test(main);
  const hasSlash = main.startsWith("/");

  if (isAbs) return main;
  if (hasSlash) return main;
  if (main.startsWith("products/")) return `/${main}`;

  return `/products/${main}`;
}

function mapProductsToTopItems(input: Product[]): TopItem[] {
  return (input ?? []).map((p: any, idx: number) => {
    const slug = String(p?.slug ?? p?.id ?? "").trim();
    const title = String(p?.title ?? p?.name ?? "Producto").trim();
    const brand = String(p?.brand ?? p?.marca ?? "JUSP").trim() || "JUSP";
    const gender = inferProductGender(p);
    const imgBase = firstImageFromProduct(p as Product, slug);

    const href = slug
      ? `/product/${encodeURIComponent(slug)}?g=${encodeURIComponent(gender)}`
      : "/products";

    const priceNum = minPriceFromProduct(p);
    const price = typeof priceNum === "number" && priceNum > 0 ? `$${formatCOP(priceNum)}` : undefined;

    const searchBlob = [
      title,
      brand,
      slug,
      p?.gender,
      p?.category,
      p?.subcategory,
      p?.collection,
      p?.sport,
      ...(Array.isArray(p?.tags) ? p.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      id: slug || `p${idx + 1}`,
      name: title,
      href,
      imgBase,
      brand,
      price,
      gender,
      expressDelivery: Boolean(p?.expressDelivery || p?.pickupToday),
      searchBlob,
    } as TopItem;
  });
}

type CardItem = {
  id?: string;
  kicker?: string;
  title: string;
  desc?: string;
  href?: string;
  img?: string;
  links?: Array<{ label: string; href: string }>;
};

type PrefFocus = "hombre" | "mujer" | "ninos" | "mix";

type UserSession = {
  email: string;
  name?: string;
  createdAt: number;
  lastSeenAt: number;
  hasPurchased?: boolean;
  onboardingDone?: boolean;
  prefs?: { focus?: PrefFocus; sizes?: string[]; interests?: string[] };
};

type SearchItem = { id: string; name: string; href: string; img: string; brand?: string };

function HomePageContent() {
  const searchParams = useSearchParams();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setCatalogProducts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setCatalogProducts([]);
        }
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const ALL_PRODUCTS = useMemo(() => mapProductsToTopItems(catalogProducts), [catalogProducts]);

  const urlContextFilter = useMemo<HomeProductFilter>(() => {
    return (
      normalizeHomeFilterParam(
        searchParams.get("g") ?? searchParams.get("gender") ?? searchParams.get("segment")
      ) ?? "all"
    );
  }, [searchParams]);

  const [homeProductFilter, setHomeProductFilter] = useState<HomeProductFilter>("all");

  const isMobile = useIsMobile();
  const reduceMotion = usePrefersReducedMotion();
  useIsCoarsePointer();

  useEffect(() => {
    if (urlContextFilter !== "all") {
      setHomeProductFilter(urlContextFilter);
    }
  }, [urlContextFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {}
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setFavoriteIds(loadFavoriteIds());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFavorites = () => setFavoriteIds(loadFavoriteIds());

    const onStorage = (e: StorageEvent) => {
      if (!e.key || FAVORITES_COMPAT_KEYS.includes(e.key as (typeof FAVORITES_COMPAT_KEYS)[number])) {
        syncFavorites();
      }
    };

    const onFavoritesChanged = () => syncFavorites();

    window.addEventListener("storage", onStorage);
    window.addEventListener("jusp:favorites-changed", onFavoritesChanged as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jusp:favorites-changed", onFavoritesChanged as EventListener);
    };
  }, []);

  const toggleFavorite = (product: TopItem) => {
    const productId = String(product?.id ?? "").trim();
    if (!productId) return;

    setFavoriteIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];

      const currentItems = readFavoriteItems().filter((item) => item.id !== productId);

      if (!exists) {
        currentItems.push({
          id: productId,
          title: product.name,
          name: product.name,
          price: product.price ?? null,
          image: product.imgBase ?? null,
          img: product.imgBase ?? null,
          href: product.href ?? `/product/${encodeURIComponent(productId)}`,
          brand: product.brand ?? null,
        });
      }

      persistFavoriteItems(currentItems);

      setFavoriteToast(
        exists
          ? `${product.name ?? "Producto"} eliminado de favoritos`
          : `${product.name ?? "Producto"} guardado en favoritos`
      );

      return next;
    });
  };

  const videos = ["/home/video/hero-1.mp4", "/home/video/hero-2.mp4"];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);

  const onHeroEnded = () => setVideoIndex((prev) => (prev + 1) % videos.length);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    v.load();
    tryPlay();
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
    };
  }, [videoIndex]);

  const topItems = useMemo(() => {
    const live = ALL_PRODUCTS.filter((item) => String(item.imgBase || "").trim());
    if (live.length >= 4) return live.slice(0, 10);

    const merged = [...live];
    for (const fallback of TOP_ITEMS) {
      if (merged.length >= 10) break;
      if (merged.some((it) => it.id === fallback.id || it.href === fallback.href)) continue;
      merged.push(fallback);
    }

    return merged.slice(0, 10);
  }, [ALL_PRODUCTS]);

  const SEARCH_RECENTS_KEY = "jusp_home_search_recents_v1";
  const USER_KEY = "jusp_user_v1";
  const FAVORITES_KEY = "jusp_home_favorites_v1";
  const FAVORITES_COMPAT_KEYS = [
    "jusp_home_favorites_v1",
    "jusp_favorites_v1",
    "jusp_favorites",
    "favorites",
  ] as const;

  const normalizeFavoriteId = (value: any): string | null => {
    const candidate =
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : typeof value === "object" && value
        ? String(value.id ?? value.productId ?? value.slug ?? "").trim()
        : "";

    const safe = String(candidate || "").trim();
    return safe ? safe : null;
  };

  const normalizeFavoriteEntry = (value: any) => {
    const id = normalizeFavoriteId(value);
    if (!id) return null;

    if (typeof value === "string" || typeof value === "number") {
      return {
        id,
        title: id,
        name: id,
        price: null,
        image: null,
        img: null,
        href: `/product/${encodeURIComponent(id)}`,
      };
    }

    return {
      id,
      title: String(value?.title ?? value?.name ?? id).trim(),
      name: String(value?.name ?? value?.title ?? id).trim(),
      price: value?.price ?? value?.amount ?? value?.sale_price ?? null,
      image: String(value?.image ?? value?.img ?? value?.thumbnail ?? "").trim() || null,
      img: String(value?.img ?? value?.image ?? value?.thumbnail ?? "").trim() || null,
      href: String(value?.href ?? value?.url ?? value?.link ?? `/product/${encodeURIComponent(id)}`).trim(),
      brand: String(value?.brand ?? "").trim() || null,
    };
  };

  const readFavoriteItems = () => {
    try {
      const merged: any[] = [];

      for (const key of FAVORITES_COMPAT_KEYS) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;

        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }

        const source = Array.isArray(parsed)
          ? parsed
          : parsed && Array.isArray(parsed.items)
          ? parsed.items
          : parsed && Array.isArray(parsed.favorites)
          ? parsed.favorites
          : [];

        for (const entry of source) {
          const normalized = normalizeFavoriteEntry(entry);
          if (!normalized) continue;

          const existingIdx = merged.findIndex((x) => x.id === normalized.id);
          if (existingIdx === -1) {
            merged.push(normalized);
            continue;
          }

          merged[existingIdx] = {
            ...merged[existingIdx],
            ...normalized,
            price: normalized.price ?? merged[existingIdx].price ?? null,
            image: normalized.image ?? merged[existingIdx].image ?? null,
            img: normalized.img ?? merged[existingIdx].img ?? null,
            href: normalized.href ?? merged[existingIdx].href ?? null,
          };
        }
      }

      return merged;
    } catch {
      return [];
    }
  };

  const loadFavoriteIds = (): string[] => {
    try {
      return readFavoriteItems()
        .map((item) => normalizeFavoriteId(item))
        .filter((id): id is string => Boolean(id));
    } catch {
      return [];
    }
  };

  const persistFavoriteItems = (items: any[]) => {
    try {
      const unique = items.filter(
        (item, index, arr) => item?.id && arr.findIndex((x) => x.id === item.id) === index
      );

      for (const key of FAVORITES_COMPAT_KEYS) {
        window.localStorage.setItem(key, JSON.stringify(unique));
      }

      window.dispatchEvent(
        new CustomEvent("jusp:favorites-changed", {
          detail: { items: unique, ids: unique.map((item) => item.id), ts: Date.now() },
        })
      );
    } catch {}
  };

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchRecents, setSearchRecents] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cacheRef = useRef<Map<string, SearchItem[]>>(new Map());
  const lastQueryRef = useRef<string>("");

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<UserSession | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authErr, setAuthErr] = useState<string | null>(null);

  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2>(0);
  const [prefFocus, setPrefFocus] = useState<PrefFocus>("mix");
  const [prefSizes, setPrefSizes] = useState<string[]>([]);
  const [prefInterests, setPrefInterests] = useState<string[]>([]);

  const NL_HIDE_KEY = "jusp_newsletter_hide_until_v1";
  const NL_SUB_KEY = "jusp_newsletter_subscribed_v1";
  const [nlOpen, setNlOpen] = useState(false);
  const [nlEmail, setNlEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [nlMsg, setNlMsg] = useState<string>("");
  const [nlSubscribed, setNlSubscribed] = useState(false);

  useEffect(() => {
    if (!favoriteToast) return;
    const t = window.setTimeout(() => setFavoriteToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [favoriteToast]);


  function isValidEmail(v: string) {
    const s = String(v || "").trim();
    if (!s) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
  }

  function readHideUntil(): number {
    try {
      const raw = localStorage.getItem(NL_HIDE_KEY);
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }

  function writeHideDays(days: number) {
    try {
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(NL_HIDE_KEY, String(until));
    } catch {}
  }

  function writeSubscribed() {
    try {
      localStorage.setItem(NL_SUB_KEY, "1");
    } catch {}
  }

  useEffect(() => {
    try {
      const isSub = localStorage.getItem(NL_SUB_KEY) === "1";
      setNlSubscribed(isSub);
      const hideUntil = readHideUntil();
      const shouldHide = hideUntil && Date.now() < hideUntil;
      if (!isSub && !shouldHide) {
        const t = window.setTimeout(() => setNlOpen(true), 900);
        return () => window.clearTimeout(t);
      }
    } catch {
      const t = window.setTimeout(() => setNlOpen(true), 900);
      return () => window.clearTimeout(t);
    }
  }, []);

  function closeNewsletter() {
    setNlOpen(false);
    setNlMsg("");
    setNlStatus("idle");
    writeHideDays(30);
  }

  async function onNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = nlEmail.trim();
    setNlMsg("");

    if (!isValidEmail(email)) {
      setNlStatus("error");
      setNlMsg("Escribe un correo válido (ej: hola@correo.com).");
      return;
    }

    setNlStatus("loading");

    try {
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter_modal", ts: Date.now() }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`.trim());
      }

      setNlStatus("ok");
      setNlMsg("Listo ✅ Te avisaremos cuando haya drops y descuentos.");
      setNlEmail("");
      setNlSubscribed(true);
      writeSubscribed();
      window.setTimeout(() => setNlOpen(false), 900);
    } catch {
      setNlStatus("error");
      setNlMsg("No se pudo registrar ahora. Intenta de nuevo en unos segundos.");
    }
  }

  const safeLoadRecents = () => {
    try {
      const raw = localStorage.getItem(SEARCH_RECENTS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter((x) => typeof x === "string").slice(0, 8);
    } catch {
      return [];
    }
  };

  const safeSaveRecent = (text: string) => {
    const s = text.trim();
    if (!s) return;
    try {
      const prev = safeLoadRecents();
      const next = [s, ...prev.filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, 8);
      localStorage.setItem(SEARCH_RECENTS_KEY, JSON.stringify(next));
      setSearchRecents(next);
    } catch {}
  };

  const safeLoadUser = (): UserSession | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const u = JSON.parse(raw);
      if (!u || typeof u !== "object") return null;
      if (typeof u.email !== "string") return null;
      return u as UserSession;
    } catch {
      return null;
    }
  };

  const safeSaveUser = (u: UserSession | null) => {
    try {
      if (!u) localStorage.removeItem(USER_KEY);
      else localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {}
  };

  useEffect(() => {
    setSearchRecents(safeLoadRecents());
    const u = safeLoadUser();
    if (u) {
      const next: UserSession = { ...u, lastSeenAt: Date.now() };
      setUser(next);
      safeSaveUser(next);
    }
  }, []);

  const searchIndex: SearchItem[] = useMemo(() => {
    const base: SearchItem[] = topItems.slice(0, 10).map((t) => ({
      id: t.id,
      name: t.name,
      href: t.href,
      img: t.imgBase,
      brand: t.brand,
    }));

    const extra: SearchItem[] = [
      { id: "s1", name: "Exclusivo", href: "/products?tab=exclusivo", img: "/home/files/file-3b.jpg", brand: "JUSP" },
      { id: "s2", name: "Best of all time", href: "/products?tag=top", img: "/home/files/file-2a.jpg", brand: "Multi" },
      { id: "s3", name: "Original brands", href: "/products?tag=original", img: "/home/files/file-2b.jpg", brand: "Original" },
      { id: "s4", name: "Street & minimal", href: "/products?tag=street", img: "/home/files/file-3a.jpg", brand: "Curaduría" },
      { id: "s5", name: "Sport legends", href: "/products?tag=sport", img: "/home/files/file-3c.jpg", brand: "Sport" },
    ];

    return [...base, ...extra];
  }, [topItems]);

  const openSearch = () => {
    setSearchOpen(true);
    setAuthOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQ("");
    setSearchResults([]);
    setSearchLoading(false);
  };

  const submitSearch = (text: string) => {
    const s = text.trim();
    if (!s) return;
    safeSaveRecent(s);
    window.location.href = `/products?q=${encodeURIComponent(s)}`;
  };

  useEffect(() => {
    if (!searchOpen) return;

    const trimmed = q.trim();
    const lower = trimmed.toLowerCase();

    if (!trimmed) {
      const quick = [
        ...searchRecents.map((r, i) => ({
          id: `r${i}`,
          name: r,
          href: `/products?q=${encodeURIComponent(r)}`,
          img: "/home/files/file-2a.jpg",
          brand: "Reciente",
        })),
        ...searchIndex.slice(0, 6),
      ].slice(0, 10);

      setSearchResults(quick);
      setSearchLoading(false);
      return;
    }

    const cached = cacheRef.current.get(lower);
    if (cached) {
      setSearchResults(cached);
      setSearchLoading(false);
      lastQueryRef.current = lower;
      return;
    }

    setSearchLoading(true);

    const isRepeatPattern =
      lastQueryRef.current && (lower.startsWith(lastQueryRef.current) || lastQueryRef.current.startsWith(lower));

    const delay = isRepeatPattern ? 0 : 80;

    const t = window.setTimeout(() => {
      const hits = searchIndex
        .map((p) => {
          const name = p.name.toLowerCase();
          const brand = (p.brand ?? "").toLowerCase();
          let score = 0;
          if (name.startsWith(lower)) score += 6;
          if (name.includes(lower)) score += 3;
          if (brand.includes(lower)) score += 2;
          if (user?.email) score += 0.2;
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((x) => x.p);

      cacheRef.current.set(lower, hits);
      setSearchResults(hits);
      setSearchLoading(false);
      lastQueryRef.current = lower;
    }, delay);

    return () => window.clearTimeout(t);
  }, [q, searchOpen, searchIndex, searchRecents, user?.email]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !searchOpen) {
        const t = e.target as HTMLElement | null;
        const isInput = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as any).isContentEditable);
        if (isInput) return;
        e.preventDefault();
        openSearch();
      }

      if (e.key === "Escape") {
        if (searchOpen) closeSearch();
        if (authOpen) setAuthOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, authOpen]);

  const completeLogin = (u: UserSession) => {
    const next: UserSession = { ...u, lastSeenAt: Date.now() };
    setUser(next);
    safeSaveUser(next);
    setAuthOpen(false);
  };

  const handleAuthSubmit = () => {
    const email = authEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setAuthErr("Escribe un correo válido.");
      return;
    }

    const existing = safeLoadUser();

    if (authMode === "login") {
      const u: UserSession =
        existing?.email === email
          ? { ...existing, lastSeenAt: Date.now() }
          : { email, name: authName.trim() || undefined, createdAt: Date.now(), lastSeenAt: Date.now() };

      completeLogin(u);
      return;
    }

    const u: UserSession = {
      email,
      name: authName.trim() || undefined,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      hasPurchased: false,
      onboardingDone: false,
      prefs: { focus: "mix", sizes: [], interests: [] },
    };

    setUser(u);
    safeSaveUser(u);
    setOnboardingStep(1);
    setAuthErr(null);
  };

  const finishOnboarding = () => {
    if (!user) return;

    const next: UserSession = {
      ...user,
      onboardingDone: true,
      prefs: { focus: prefFocus, sizes: prefSizes, interests: prefInterests },
      lastSeenAt: Date.now(),
    };

    setUser(next);
    safeSaveUser(next);
    setAuthOpen(false);
  };

  const topSectionRef = useRef<HTMLElement | null>(null);
  const [topInView, setTopInView] = useState(false);

  useEffect(() => {
    const el = topSectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const en = entries[0];
        const ok = !!en?.isIntersecting && (en.intersectionRatio ?? 0) > 0.12;
        setTopInView(ok);
        if (!ok) setTopPaused(true);
        else setTopPaused(false);
      },
      { root: null, threshold: [0, 0.12, 0.2, 0.4, 0.8] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const topViewportRef = useRef<HTMLDivElement | null>(null);
  const topCardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [topActive, setTopActive] = useState(0);
  const [topPaused, setTopPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    down: boolean;
    pointerId: number | null;
    startX: number;
    startScrollLeft: number;
  }>({ down: false, pointerId: null, startX: 0, startScrollLeft: 0 });

  const [rubberX, setRubberX] = useState(0);
  const rubberXRef = useRef(0);

  const setRubber = (v: number) => {
    rubberXRef.current = v;
    setRubberX(v);
  };

  const getBounds = () => {
    const vp = topViewportRef.current;
    if (!vp) return { max: 0 };
    const max = Math.max(0, vp.scrollWidth - vp.clientWidth);
    return { max };
  };

  const scrollTopCardHorizontallyToIndex = (idx: number, behavior: ScrollBehavior = "smooth") => {
    const vp = topViewportRef.current;
    const el = topCardRefs.current[idx];
    if (!vp || !el) return;
    const left = el.offsetLeft;
    try {
      vp.scrollTo({ left, behavior });
    } catch {
      vp.scrollLeft = left;
    }
  };

  const snapToNearest = () => {
    const vp = topViewportRef.current;
    if (!vp) return;

    const vpRect = vp.getBoundingClientRect();
    const vpCenter = vpRect.left + vpRect.width / 2;

    let bestIdx = 0;
    let bestD = Number.POSITIVE_INFINITY;

    for (let i = 0; i < topCardRefs.current.length; i++) {
      const el = topCardRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const d = Math.abs(cx - vpCenter);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }

    setTopActive(bestIdx);
    scrollTopCardHorizontallyToIndex(bestIdx, "smooth");
  };

  useEffect(() => {
    if (reduceMotion || topPaused || !topInView) return;
    const intervalMs = isMobile ? 5200 : 3600;
    const t = setInterval(() => {
      setTopActive((i) => (i + 1) % topItems.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [reduceMotion, topPaused, topInView, topItems.length, isMobile]);

  useEffect(() => {
    if (topPaused || !topInView) return;
    scrollTopCardHorizontallyToIndex(topActive, "smooth");
  }, [topActive, topPaused, topInView]);

  const endDrag = (resume = true) => {
    const vp = topViewportRef.current;
    if (!vp) return;

    dragRef.current.down = false;
    dragRef.current.pointerId = null;

    if (rubberXRef.current !== 0) setRubber(0);

    vp.style.scrollBehavior = "smooth";
    snapToNearest();
    setIsDragging(false);

    if (resume) {
      window.setTimeout(() => setTopPaused(false), isMobile ? 2500 : 1600);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const onUp = () => endDrag(true);
    const onCancel = () => endDrag(true);

    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onCancel, { passive: true });
    window.addEventListener("blur", onCancel);

    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onCancel);
    };
  }, [isDragging]);

  const onTopPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const vp = topViewportRef.current;
    if (!vp) return;
    const isTouchLike = e.pointerType === "touch" || e.pointerType === "pen";
    if (!isTouchLike) return;

    setTopPaused(true);
    setIsDragging(true);
    dragRef.current.down = true;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = vp.scrollLeft;
    vp.style.scrollBehavior = "auto";

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    e.preventDefault();
  };

  const onTopPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const vp = topViewportRef.current;
    if (!vp) return;
    if (!dragRef.current.down) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const rawTarget = dragRef.current.startScrollLeft - dx;
    const { max } = getBounds();

    if (rawTarget < 0) {
      setRubber(rawTarget * 0.22);
      vp.scrollLeft = 0;
    } else if (rawTarget > max) {
      setRubber((rawTarget - max) * 0.22);
      vp.scrollLeft = max;
    } else {
      if (rubberXRef.current !== 0) setRubber(0);
      vp.scrollLeft = rawTarget;
    }
  };

  const onTopPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragRef.current.down) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    endDrag(true);
  };

  const onTopPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragRef.current.down) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    endDrag(true);
  };

  const onTopWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const vp = topViewportRef.current;
    if (!vp) return;
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    if (e.shiftKey || absX > absY) return;
    if (dragRef.current.down) return;
    e.preventDefault();
    window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
  };

  const onTopPointerLeave: React.PointerEventHandler<HTMLDivElement> = () => {
    if (!dragRef.current.down) return;
    endDrag(true);
  };

  const curatedSlides = useMemo(
    () =>
      [
        { id: "st01", brand: "Jordan" },
        { id: "st02", brand: "ASICS" },
        { id: "st03", brand: "Nike" },
        { id: "st04", brand: "Armani Exchange" },
        { id: "st05", brand: "Converse" },
        { id: "st06", brand: "Tommy Hilfiger" },
        { id: "st07", brand: "Lacoste" },
        { id: "st08", brand: "Adidas" },
        { id: "st09", brand: "Calvin Klein" },
        { id: "st10", brand: "Puma" },
        { id: "st11", brand: "Reebok" },
        { id: "st12", brand: "New Balance" },
        { id: "st13", brand: "Vans" },
        { id: "st14", brand: "Ralph Lauren" },
        { id: "st15", brand: "Nautica" },
      ].map((item, index) => {
        const n = String(index + 1).padStart(2, "0");
        return {
          id: item.id,
          href: `/products?brand=${encodeURIComponent(item.brand)}`,
          imgBase: `/home/stories/story-${n}.jpg`,
          alt: `${item.brand} en JUSP`,
          label: item.brand,
        };
      }),
    []
  );

  const curatedViewportRef = useRef<HTMLDivElement | null>(null);

  const onCuratedWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const vp = curatedViewportRef.current;
    if (!vp) return;
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    if (e.shiftKey || absX > absY) return;
    e.preventDefault();
    window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
  };

  const storySectionRef = useRef<HTMLElement | null>(null);
  const [storyInView, setStoryInView] = useState(false);

  useEffect(() => {
    const el = storySectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const en = entries[0];
        if (en?.isIntersecting) setStoryInView(true);
      },
      { root: null, threshold: 0.14 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const collectionCards: CardItem[] = useMemo(
    () => [
      {
        id: "c1",
        kicker: "",
        title: "Converse Chuck Taylor All Star",
        desc: "Esencia: El sneaker más clásico de la historia. Nació como zapato de baloncesto en 1917 y terminó siendo ícono cultural. Minimalista, versátil y atemporal.",
        href: "/products?tag=top",
        img: "/home/mas-top/01",
      },
      {
        id: "c2",
        kicker: "",
        title: "Nike Air Force 1",
        desc: "Esencia: El sneaker urbano más vendido del mundo. Lanzado en 1982, combina simplicidad con presencia fuerte. El modelo blanco es un estándar global.",
        href: "/products?tag=top",
        img: "/home/mas-top/02",
      },
      {
        id: "c3",
        kicker: "",
        title: "Adidas Stan Smith",
        desc: "Esencia: Elegancia minimalista. Diseño limpio, blanco con detalles verdes. Fue el zapato más vendido del mundo en los 80.",
        href: "/products?tag=top",
        img: "/home/mas-top/03",
      },
      {
        id: "c4",
        kicker: "",
        title: "Adidas Superstar",
        desc: "Esencia: Cultura hip-hop y calle. Famoso por su puntera tipo “shell toe”. Se volvió leyenda en los 80 gracias a Run-D.M.C..",
        href: "/products?tag=top",
        img: "/home/mas-top/04",
      },
    ],
    []
  );

  const isCard = (
    c: CardItem
  ): c is Required<Pick<CardItem, "id" | "desc" | "href" | "img">> & { title: string; kicker?: string } => {
    return Boolean(c && c.id && c.title && c.desc && c.href && c.img);
  };

  const [colActive, setColActive] = useState(0);
  const colCards = collectionCards.filter(isCard);
  const colLen = Math.max(1, colCards.length);

  const colLenRef = React.useRef(colLen);
  colLenRef.current = colLen;

  useEffect(() => {
    if (colLenRef.current <= 1) return;

    const interval = setInterval(() => {
      setColActive((prev) => (prev + 1) % colLenRef.current);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  const activeCollection = colCards[colActive] ?? colCards[0] ?? collectionCards[0];

  const filteredProducts = useMemo(
    () => ALL_PRODUCTS.filter((p) => matchesHomeProductFilter(p, homeProductFilter)),
    [ALL_PRODUCTS, homeProductFilter]
  );

  const contextHeadline = "Te podría gustar";

  return (
    <main style={{ overflowX: "hidden", background: "#fff", color: "#000" }}>
      <style>{`
        :root {
          --jusp-ease: cubic-bezier(.2,.9,.2,1);
        }
        .jusp-card {
          transform: translateZ;
          transition: transform 280ms var(--jusp-ease), box-shadow 280ms var(--jusp-ease), filter 280ms var(--jusp-ease);
          will-change: transform;
        }
        @media (hover:hover) and (pointer:fine) {
          .jusp-card:hover {
            transform: translateY(-3px) scale(1.008);
            box-shadow: 0 18px 55px rgba(0,0,0,0.14);
          }
        }
        .jusp-card:active {
          transform: translateY(0px) scale(0.988);
        }
        .jusp-btn {
          transition: transform 180ms var(--jusp-ease), filter 180ms var(--jusp-ease), background 180ms var(--jusp-ease);
          will-change: transform;
        }
        @media (hover:hover) and (pointer:fine) {
          .jusp-btn:hover { filter: brightness(1.03); }
        }
        .jusp-btn:active { transform: scale(0.98); }
        .jusp-save[data-saved="1"] {
          animation: juspPop 260ms var(--jusp-ease);
        }
        @keyframes juspPop {
          0% { transform: scale(0.96); }
          55% { transform: scale(1.06); }
          100% { transform: scale(1.0); }
        }
        .jusp-focus:focus-visible {
          outline: 3px solid rgba(0,0,0,0.20);
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .jusp-card, .jusp-btn { transition: none !important; animation: none !important; }
        }
      `}</style>


      {favoriteToast ? (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            right: 16,
            bottom: 18,
            zIndex: 95,
            padding: "12px 14px",
            borderRadius: 16,
            background: "rgba(0,0,0,0.92)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 900,
            boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
            backdropFilter: "blur(12px)",
          }}
        >
          {favoriteToast}
        </div>
      ) : null}

      {nlOpen && false ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,0,0.48)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeNewsletter();
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              borderRadius: 22,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.10)",
              boxShadow: "0 28px 110px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                padding: "14px 14px",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, opacity: 0.7 }}>NEWSLETTER</div>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 1000 }}>Drops, ofertas y alertas</div>
              </div>
              <button
                type="button"
                onClick={() => closeNewsletter()}
                aria-label="Cerrar"
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 1000,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 14 }}>
              <form onSubmit={onNewsletterSubmit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                  placeholder="Tu correo"
                  inputMode="email"
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.14)",
                    padding: "0 16px",
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={nlStatus === "loading"}
                  style={{
                    height: 46,
                    width: 54,
                    borderRadius: 999,
                    border: "none",
                    background: "#000",
                    color: "#fff",
                    fontWeight: 1000,
                    cursor: "pointer",
                    boxShadow: "0 16px 42px rgba(0,0,0,0.18)",
                    opacity: nlStatus === "loading" ? 0.75 : 1,
                  }}
                >
                  →
                </button>
              </form>
              {nlMsg ? (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 900, color: nlStatus === "error" ? "#b00020" : "#0a7a2f" }}>
                  {nlMsg}
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.72, lineHeight: 1.55 }}>
                  Si cierras, no vuelve por 30 días. Si te suscribes, no vuelve a aparecer.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section id="hero" style={{ width: "100vw", minHeight: "calc(100vh - 64px)", position: "relative", background: "#000" }}>
        <video
          ref={videoRef}
          key={videos[videoIndex]}
          muted
          playsInline
          autoPlay
          preload="auto"
          onEnded={onHeroEnded}
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        >
          <source src={videos[videoIndex]} type="video/mp4" />
        </video>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 35%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 2, padding: "120px 18px 56px", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ color: "#fff", opacity: 0.92, fontSize: 12, letterSpacing: 1.6, fontWeight: 800 }}>
            JUSP · ORIGINALES.
          </div>
          <h1 style={{ color: "#fff", margin: "10px 0 0", fontSize: 46, lineHeight: 1.05 }}>JUSP · DO MORE</h1>
        </div>
      </section>

      <section
        ref={(el) => {
          storySectionRef.current = el;
        }}
        style={{
          padding: "22px 0 30px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.00) 100%)",
          opacity: storyInView ? 1 : 0,
          transform: storyInView ? "translateY(0px)" : "translateY(10px)",
          transition: "opacity 680ms cubic-bezier(.2,.9,.2,1), transform 680ms cubic-bezier(.2,.9,.2,1)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, opacity: 0.7 }}>HISTORY</div>
            </div>
          </div>

          <div
            ref={curatedViewportRef}
            onWheel={onCuratedWheel}
            style={{
              marginTop: 14,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorX: "contain",
              scrollbarWidth: "none",
              padding: "8px 2px 10px",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
              {curatedSlides.map((s, idx) => (
                <Link
                  key={s.id}
                  href={s.href}
                  aria-label={s.alt}
                  style={{
                    flex: "0 0 auto",
                    scrollSnapAlign: "start",
                    textDecoration: "none",
                    color: "#000",
                  }}
                >
                  <div
                    style={{
                      width: "min(64vw, 260px)",
                      aspectRatio: "9 / 16",
                      borderRadius: 22,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "#f2f2f2",
                      boxShadow: "0 18px 55px rgba(0,0,0,0.14)",
                      transform: "translateZ(0)",
                      position: "relative",
                    }}
                  >
                    <SmartImg
                      baseSrc={s.imgBase}
                      alt={s.alt}
                      loading={idx < 2 ? "eager" : "lazy"}
                      fetchPriority={idx < 2 ? "high" : "low"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.30) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        top: 10,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.50)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 1000,
                        letterSpacing: 0.6,
                        border: "1px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      JUSP
                    </div>
                  </div>
                </Link>
              ))}
              <div style={{ flex: "0 0 6px" }} />
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "10px 0 26px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.02) 100%)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, opacity: 0.7 }}>
                CONFIANZA
              </div>

              <div style={{ fontSize: 22, fontWeight: 1000, marginTop: 6 }}>
                Compra protegida por JUSP
              </div>

              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
                Garantía 
              </div>
            </div>

            <Link
              href="/terms"
              style={{
                fontSize: 13,
                fontWeight: 900,
                textDecoration: "none",
                color: "#000",
                opacity: 0.85,
              }}
            >
              Ver términos →
            </Link>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {[
              {
                k: "auth",
                t: "Autenticidad protegida",
                d: "Te devolvemos cuatro veces el precio si es falso.\nSi un cliente recibe un producto que no es auténtico, JUSP pagará 4 veces el valor real del producto como compensación.",
                i: "🔒",
              },
              {
                k: "refund",
                t: "Compra protegida",
                d: "Políticas de devolución.\nReembolso instantáneo.\n ✔ Producto original verificado.\n ✔ Pago seguro.\n ✔ Envío asegurado ",
                i: "💸",
              },
              {
                k: "support",
                t: "Soporte real",
                d: "Te respondemos antes, durante y después.\nAcompañamiento real en todo el proceso de compra.",
                i: "💬",
              },
            ].map((b) => (
              <div
                key={b.k}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 20,
                  padding: 16,
                  background: "#fff",
                  boxShadow: "0 14px 50px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ fontSize: 22 }}>{b.i}</div>

                <div style={{ marginTop: 10, fontWeight: 1000, fontSize: 15 }}>
                  {b.t}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    opacity: 0.75,
                    lineHeight: 1.4,
                  }}
                >
                  {b.d.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="top-picks"
        ref={(el) => {
          topSectionRef.current = el;
        }}
        style={{ padding: "26px 0 10px", borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px" }}>
          <div className="tpWrap">
            <div className="tpHeader">
              <div>
                <div className="tpKicker">LO MÁS TOP</div>
              </div>
            </div>

            <style>{`
              .tpWrap {
                margin-top: 22px;
              }
              .tpHeader {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 16px;
                flex-wrap: wrap;
              }
              .tpKicker {
                font-size: 12px;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                opacity: 0.7;
                font-weight: 800;
              }
              .tpTitle {
                margin: 6px 0 0;
                font-size: 44px;
                line-height: 1;
                font-weight: 900;
              }
              .tpCount {
                font-weight: 900;
                opacity: 0.9;
              }
              .tpSubtitle {
                margin: 10px 0 0;
                opacity: 0.75;
                max-width: 560px;
              }
              .tpAll {
                font-weight: 800;
                color: #111;
                text-decoration: none;
                display: inline-flex;
                gap: 8px;
                align-items: center;
                padding: 8px 10px;
                border-radius: 999px;
                background: rgba(0,0,0,0.04);
              }
              .tpControls {
                margin-top: 14px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                flex-wrap: wrap;
              }
              .tpSearch {
                flex: 1 1 380px;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 12px;
                border: 1px solid #e6e6e6;
                border-radius: 999px;
                background: #fff;
                box-shadow: 0 10px 24px rgba(0,0,0,0.06);
              }
              .tpChips {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
              }

              @media (max-width: 720px) {
                .tpTitle { font-size: 34px; }
                .tpSubtitle { max-width: 100%; }
                .tpControls {
                  flex-direction: column;
                  align-items: stretch;
                }
                .tpSearch {
                  flex: 1 1 auto;
                  width: 100%;
                }
                .tpChips {
                  flex-wrap: nowrap;
                  overflow-x: auto;
                  padding-bottom: 6px;
                  -webkit-overflow-scrolling: touch;
                }
                .tpChips::-webkit-scrollbar { display: none; }
              }
            `}</style>
          </div>
        </div>

        <div style={{ marginTop: 16, position: "relative" }}>
          <div
            ref={topViewportRef}
            onMouseEnter={() => setTopPaused(true)}
            onMouseLeave={() => setTopPaused(false)}
            onWheel={onTopWheel}
            onPointerDown={onTopPointerDown}
            onPointerMove={onTopPointerMove}
            onPointerUp={onTopPointerUp}
            onPointerCancel={onTopPointerCancel}
            onPointerLeave={onTopPointerLeave}
            style={{
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              overscrollBehaviorX: "contain",
              padding: "10px 14px 18px",
              touchAction: isDragging ? "none" : "pan-y",
              userSelect: isDragging ? "none" : "auto",
              cursor: isDragging ? "grabbing" : "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 0,
                transform: rubberX ? `translateX(${rubberX}px)` : "translateX(0px)",
                transition: rubberX ? "none" : "transform 220ms cubic-bezier(.2,.9,.2,1)",
                willChange: "transform",
              }}
            >
              {topItems.slice(0, 10).map((it, idx) => {
                const isActive = idx === topActive;
                return (
                  <Link
                    key={it?.href ? it.href : String(idx)}
                    className="jusp-card"
                    href={it.href}
                    ref={(el) => {
                      topCardRefs.current[idx] = el;
                    }}
                    onMouseEnter={() => setTopActive(idx)}
                    style={{
                      scrollSnapAlign: "start",
                      textDecoration: "none",
                      color: "#000",
                      flex: "0 0 calc(100vw - 28px)",
                      width: "calc(100vw - 28px)",
                      maxWidth: "calc(100vw - 28px)",
                      borderRadius: 26,
                      marginTop: isMobile ? 10 : 0,
                      position: "relative",
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: isActive ? "0 22px 80px rgba(0,0,0,0.18)" : "0 10px 30px rgba(0,0,0,0.10)",
                      transform: isActive
                        ? "perspective(1200px) translateZ(0) scale(1.01)"
                        : "perspective(1200px) translateZ(0) scale(0.985)",
                      transition: "transform 420ms cubic-bezier(.2,.9,.2,1), box-shadow 420ms cubic-bezier(.2,.9,.2,1)",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        height: isMobile ? "min(68vh, 560px)" : "min(78vh, 680px)",
                        minHeight: isMobile ? 360 : 500,
                        background: "linear-gradient(180deg, #fbfbfb 0%, #f3f3f3 100%)",
                        position: "relative",
                      }}
                    >
                  <SmartImg
                        baseSrc={it.imgBase}
                        alt={it.name}
                        loading={idx <= 1 ? "eager" : "lazy"}
                        fetchPriority={idx === 0 ? "high" : idx === 1 ? "high" : "auto"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          objectPosition: "center center",
                          transform: isActive ? "scale(1.02)" : "scale(1)",
                          transition: "transform 900ms cubic-bezier(.22,1,.36,1), opacity 400ms ease",
                          willChange: "transform",
                          display: "block",
                          background: "#f6f6f6",
                          padding: isMobile ? "14px" : "24px",
                        }}
                      />
                      {it.expressDelivery ? (
                        <div
                          style={{
                            position: "absolute",
                            top: 14,
                            left: 14,
                            zIndex: 3,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 14px",
                            borderRadius: 999,
                            background: "rgba(17,17,17,0.92)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 1000,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                          }}
                        >
                          <span aria-hidden="true">⚡</span>
                          Entrega flash
                        </div>
                      ) : null}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: isMobile
                            ? "linear-gradient(180deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.00) 62%, rgba(0,0,0,0.06) 100%)"
                            : "radial-gradient(1200px 560px at 50% 50%, rgba(255,255,255,0.00) 48%, rgba(0,0,0,0.08) 100%)",
                          pointerEvents: "none",
                          opacity: isActive ? 1 : 0.9,
                          transition: "opacity 520ms ease",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 3,
                          background: "rgba(255,255,255,0.14)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: isActive ? "100%" : "0%",
                            background: "#fff",
                            opacity: 0.96,
                            transition: isActive ? `width ${isMobile ? 5200 : 3600}ms linear` : "width 220ms ease",
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      <section style={{ padding: "26px 0 44px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px" }}>
          <div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 1000, letterSpacing: -0.4 }}>{contextHeadline}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            {[
              { key: "all" as const, label: "Te podría gustar" },
              { key: "men" as const, label: "Hombre" },
              { key: "women" as const, label: "Mujer" },
              { key: "accessories" as const, label: "Accesorios" },
              { key: "kids" as const, label: "Niños" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setHomeProductFilter(tab.key)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: homeProductFilter === tab.key ? "rgba(0,0,0,0.92)" : "white",
                  color: homeProductFilter === tab.key ? "white" : "rgba(0,0,0,0.85)",
                  fontWeight: 900,
                  fontSize: 12,
                  letterSpacing: 0.2,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className="__jusp_all_products_grid"
            style={{
              marginTop: 16,
              display: "grid",
              gap: 14,
              opacity: 1,
              transform: "translateY(0px)",
              transition: "opacity 220ms ease, transform 220ms ease",
            }}
          >
            {filteredProducts.map((p) => {
              const isFavorite = favoriteIds.includes(String(p.id));

              return (
                <a
                  key={p.id}
                  href={p.href}
                  className="jusp-card"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "white",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ position: "relative", background: "#f7f7f7" }}>
                    {p.expressDelivery ? (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          zIndex: 3,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: 999,
                          background: "rgba(17,17,17,0.92)",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 1000,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
                        }}
                      >
                        <span aria-hidden="true">⚡</span>
                        Flash
                      </div>
                    ) : null}

                    <button
                      type="button"
                      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                      aria-pressed={isFavorite}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(p);
                      }}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 3,
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(255,255,255,0.96)",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
                        transform: isFavorite ? "scale(1.04)" : "scale(1)",
                        transition: "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          fontSize: 18,
                          lineHeight: 1,
                          color: isFavorite ? "#e11d48" : "rgba(0,0,0,0.80)",
                          transition: "transform 180ms ease, color 180ms ease",
                          transform: isFavorite ? "scale(1.08)" : "scale(1)",
                        }}
                      >
                        {isFavorite ? "♥" : "♡"}
                      </span>
                    </button>

                    <div className="__jusp_home_product_media" style={{ height: 220, position: "relative" }}>
                      <SmartImg
                        baseSrc={p.imgBase}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 1000, fontSize: 14, lineHeight: 1.2 }}>{p.name}</div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.72 }}>{p.price ?? "Oferta"}</div>
                  </div>
                </a>
              );
            })}
          </div>

          {!filteredProducts.length ? (
            <div
              style={{
                marginTop: 14,
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                padding: 18,
                boxShadow: "0 14px 40px rgba(0,0,0,0.06)",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              No encontramos productos para este contexto todavía.
            </div>
          ) : null}

          <style>{`
            .__jusp_all_products_grid {
              width: 100%;
              grid-template-columns: repeat(5, minmax(0, 1fr));
            }

            .__jusp_all_products_grid > a {
              min-width: 0;
            }

            .__jusp_home_product_media {
              height: 220px;
            }

            .__jusp_home_product_media img {
              width: 100% !important;
              height: 100% !important;
              object-fit: contain !important;
              display: block !important;
            }

            @media (max-width: 767px) {
              .__jusp_all_products_grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 12px !important;
              }

              .__jusp_home_product_media {
                height: 160px !important;
              }
            }
          `}</style>
        </div>

        {searchOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 80,
              background: "rgba(0,0,0,0.44)",
              backdropFilter: "blur(10px)",
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeSearch();
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "auto" }}>
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  padding: "18px 14px 12px",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 1000, letterSpacing: 1.4, fontSize: 12, opacity: 0.75 }}>JUSP</div>
                  <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      ref={inputRef}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar productos, marcas, estilos…"
                      aria-label="Buscar"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitSearch(q);
                      }}
                      style={{
                        width: "100%",
                        height: 46,
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.14)",
                        padding: "0 16px",
                        fontSize: 15,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => submitSearch(q)}
                      aria-label="Buscar"
                      title="Buscar"
                      style={{
                        height: 46,
                        width: 56,
                        borderRadius: 999,
                        border: "none",
                        background: "#000",
                        color: "#fff",
                        fontWeight: 1000,
                        cursor: "pointer",
                        boxShadow: "0 16px 42px rgba(0,0,0,0.18)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      🔍
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={closeSearch}
                    aria-label="Cerrar"
                    style={{
                      height: 46,
                      width: 46,
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.14)",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 1000,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 14px 30px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.72 }}>
                    {q.trim() ? "" : searchRecents.length ? "Recientes" : "Sugerencias"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>
                    Tip: <span style={{ fontWeight: 1000 }}>ESC</span> para cerrar
                  </div>
                </div>

                {searchLoading ? <div style={{ marginTop: 16, fontSize: 13, opacity: 0.7 }}>Buscando…</div> : null}

                <div
                  style={{
                    marginTop: 14,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {searchResults.map((p) => (
                    <Link
                      key={p.id + p.href}
                      href={p.href}
                      onClick={() => {
                        if (q.trim()) safeSaveRecent(q.trim());
                        setSearchOpen(false);
                      }}
                      style={{
                        textDecoration: "none",
                        color: "#000",
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "1px solid rgba(0,0,0,0.08)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                        background: "#fff",
                        transform: "translateZ(0)",
                        transition: "transform 220ms ease, box-shadow 220ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                        e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0px) scale(1)";
                        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.08)";
                      }}
                    >
                      <div style={{ position: "relative", height: 220, background: "#f4f4f4" }}>
                        <SmartImg baseSrc={p.img} alt={p.name} loading="lazy" fetchPriority="auto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.44) 100%)" }} />
                        <div style={{ position: "absolute", left: 12, right: 12, bottom: 10, color: "#fff" }}>
                          <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>{p.brand ?? "Original"}</div>
                          <div style={{ marginTop: 4, fontSize: 16, fontWeight: 1000, lineHeight: 1.1 }}>{p.name}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {!q.trim() && searchRecents.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem(SEARCH_RECENTS_KEY);
                      } catch {}
                      setSearchRecents([]);
                    }}
                    style={{
                      marginTop: 16,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 13,
                      opacity: 0.7,
                      textDecoration: "underline",
                    }}
                  >
                    Borrar recientes
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {authOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 85,
              background: "rgba(0,0,0,0.48)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 14,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setAuthOpen(false);
            }}
          >
            <div
              style={{
                width: "min(680px, 100%)",
                borderRadius: 22,
                overflow: "hidden",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.10)",
                boxShadow: "0 28px 110px rgba(0,0,0,0.22)",
              }}
            >
              <div
                style={{
                  padding: "14px 14px",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, opacity: 0.7 }}>CUENTA</div>
                  <div style={{ marginTop: 4, fontSize: 18, fontWeight: 1000 }}>
                    {authMode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthOpen(false)}
                  aria-label="Cerrar"
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.14)",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 1000,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: 14 }}>
                {onboardingStep === 0 ? (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,0.14)",
                          background: authMode === "login" ? "#000" : "#fff",
                          color: authMode === "login" ? "#fff" : "#000",
                          fontWeight: 1000,
                          cursor: "pointer",
                          transition: "transform 180ms ease",
                        }}
                      >
                        Iniciar sesión
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode("signup")}
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,0.14)",
                          background: authMode === "signup" ? "#000" : "#fff",
                          color: authMode === "signup" ? "#fff" : "#000",
                          fontWeight: 1000,
                          cursor: "pointer",
                        }}
                      >
                        Registrarme
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {authMode === "signup" ? (
                        <input
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Nombre (opcional)"
                          style={{
                            height: 46,
                            borderRadius: 14,
                            border: "1px solid rgba(0,0,0,0.14)",
                            padding: "0 12px",
                            outline: "none",
                          }}
                        />
                      ) : null}

                      <input
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="Correo"
                        inputMode="email"
                        style={{
                          height: 46,
                          borderRadius: 14,
                          border: "1px solid rgba(0,0,0,0.14)",
                          padding: "0 12px",
                          outline: "none",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAuthSubmit();
                        }}
                      />
                      {authErr ? <div style={{ fontSize: 13, color: "#b00020", fontWeight: 900 }}>{authErr}</div> : null}
                      <button
                        type="button"
                        onClick={handleAuthSubmit}
                        style={{
                          height: 46,
                          borderRadius: 999,
                          border: "none",
                          background: "#000",
                          color: "#fff",
                          fontWeight: 1000,
                          cursor: "pointer",
                          boxShadow: "0 16px 42px rgba(0,0,0,0.18)",
                        }}
                      >
                        {authMode === "login" ? "Entrar" : "Continuar"}
                      </button>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7, lineHeight: 1.55 }}>
                        * Versión PRO MAX (sin backend): guardamos tu sesión en el navegador por ahora.
                      </div>
                    </div>
                  </>
                ) : null}

                {onboardingStep === 1 ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.78 }}>Onboarding premium</div>
                    <div style={{ marginTop: 8, fontSize: 20, fontWeight: 1000, letterSpacing: -0.2 }}>¿Qué te interesa más?</div>
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                      {[
                        { k: "hombre" as const, t: "Hombre" },
                        { k: "mujer" as const, t: "Mujer" },
                        { k: "ninos" as const, t: "Niños" },
                        { k: "mix" as const, t: "Mix" },
                      ].map((x) => (
                        <button
                          key={x.k}
                          type="button"
                          onClick={() => setPrefFocus(x.k)}
                          style={{
                            height: 44,
                            borderRadius: 14,
                            border: "1px solid rgba(0,0,0,0.14)",
                            background: prefFocus === x.k ? "#000" : "#fff",
                            color: prefFocus === x.k ? "#fff" : "#000",
                            fontWeight: 1000,
                            cursor: "pointer",
                          }}
                        >
                          {x.t}
                        </button>
                      ))}
                    </div>

                    <div style={{ marginTop: 14, fontSize: 13, fontWeight: 1000, opacity: 0.78 }}>Tallas rápidas</div>
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["38", "39", "40", "41", "42", "43", "S", "M", "L", "XL"].map((s) => {
                        const on = prefSizes.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setPrefSizes((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                            style={{
                              height: 36,
                              padding: "0 12px",
                              borderRadius: 999,
                              border: "1px solid rgba(0,0,0,0.14)",
                              background: on ? "#000" : "#fff",
                              color: on ? "#fff" : "#000",
                              fontWeight: 1000,
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(1)}
                        style={{
                          height: 44,
                          padding: "0 16px",
                          borderRadius: 999,
                          border: "none",
                          background: "#000",
                          color: "#fff",
                          fontWeight: 1000,
                          cursor: "pointer",
                        }}
                      >
                        Continuar →
                      </button>
                    </div>
                  </>
                ) : null}

                {onboardingStep === 2 ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.78 }}>Último toque</div>
                    <div style={{ marginTop: 8, fontSize: 20, fontWeight: 1000, letterSpacing: -0.2 }}>¿Qué estilo quieres ver primero?</div>
                    <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["Minimal", "Street", "Premium", "Running", "Gym", "Outdoor"].map((s) => {
                        const on = prefInterests.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setPrefInterests((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                            style={{
                              height: 38,
                              padding: "0 14px",
                              borderRadius: 999,
                              border: "1px solid rgba(0,0,0,0.14)",
                              background: on ? "#000" : "#fff",
                              color: on ? "#fff" : "#000",
                              fontWeight: 1000,
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(1)}
                        style={{
                          height: 44,
                          padding: "0 14px",
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,0.14)",
                          background: "#fff",
                          cursor: "pointer",
                          fontWeight: 1000,
                        }}
                      >
                        ← Atrás
                      </button>
                      <button
                        type="button"
                        onClick={finishOnboarding}
                        style={{
                          height: 44,
                          padding: "0 16px",
                          borderRadius: 999,
                          border: "none",
                          background: "#000",
                          color: "#fff",
                          fontWeight: 1000,
                          cursor: "pointer",
                          boxShadow: "0 16px 42px rgba(0,0,0,0.18)",
                        }}
                      >
                        Terminar
                      </button>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.72, lineHeight: 1.55 }}>
                      Micro-UX: no cambiamos diseño, solo prioridad/timing según contexto (primera visita vs recurrente vs logueado).
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "#fff" }} />}>
      <HomePageContent />
    </Suspense>
  );
}
