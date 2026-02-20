"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

type TopItem = {
  id: string;
  name: string;
  href: string;
  img: string;
  brand?: string;
  price?: string;
};

const TOP_ITEMS: TopItem[] = [
      { id: "t1", name: "Air Max", href: "/products?q=air%20max", img: "/home/files/top-01.jpg", brand: "Nike", price: "Desde $—" },
      { id: "t2", name: "Superstar", href: "/products?q=superstar", img: "/home/files/top-02.jpg", brand: "Adidas", price: "Desde $—" },
      { id: "t3", name: "550", href: "/products?q=550", img: "/home/files/top-03.jpg", brand: "New Balance", price: "Desde $—" },
      { id: "t4", name: "Classic", href: "/products?q=classic", img: "/home/files/top-04.jpg", brand: "Reebok", price: "Desde $—" },
      { id: "t5", name: "Dunk Low", href: "/products?q=dunk%20low", img: "/home/files/top-05.jpg", brand: "Nike", price: "Desde $—" },
      { id: "t6", name: "Forum", href: "/products?q=forum", img: "/home/files/top-06.jpg", brand: "Adidas", price: "Desde $—" },
      { id: "t7", name: "Suede", href: "/products?q=suede", img: "/home/files/top-07.jpg", brand: "Puma", price: "Desde $—" },
      { id: "t8", name: "Gel", href: "/products?q=gel", img: "/home/files/top-08.jpg", brand: "ASICS", price: "Desde $—" },
      { id: "t9", name: "Vans Old Skool", href: "/products?q=old%20skool", img: "/home/files/top-09.jpg", brand: "Vans", price: "Desde $—" },
      { id: "t10", name: "Chuck 70", href: "/products?q=chuck%2070", img: "/home/files/top-10.jpg", brand: "Converse", price: "Desde $—" },
    
];


type CardItem = {
  /**
   * Algunos módulos usan "cards" y otros usan "grupos de links".
   * Para evitar errores de TypeScript al mezclar estructuras, hacemos campos opcionales
   * y renderizamos según existan.
   */
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


export default function Page() {
const scrollToTopPicks = () => {
  const section = document.getElementById("top-picks");
  if (!section) return;

  // Scroll with a small offset to account for the sticky header
  const y = section.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top: y, behavior: "smooth" });

  // Never leave a hash in the URL (so refresh doesn't jump)
  if (typeof window !== "undefined" && window.location.hash) {
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {}
  }
};

// Always start at the top on refresh/navigation (prevents browser scroll restoration)
useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {}
  window.scrollTo(0, 0);
}, []);
  /* ==========================
     BLOQUE 1 · HERO (2 VIDEOS)
     ========================= */
  const videos = ["/home/video/hero-1.mp4", "/home/video/hero-2.mp4"];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);

  const onHeroEnded = () => setVideoIndex((prev) => (prev + 1) % videos.length);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = () => v.play().catch(() => {});

    // Ensure the new source starts playing after swap
    v.load();
    tryPlay();

    // Some browsers need a ready event after swapping sources
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
    };
  }, [videoIndex]);


  /* ==========================================
     BLOQUE 2 · LO MÁS TOP (CARRUSEL PRO MAX)
     ✅ 10 productos
     ✅ 1 producto por pantalla
     ✅ Auto-rotación
     ✅ Swipe Nike-like (resistencia + snap)
     ✅ FIX PC: no “bloquea” el scroll de la página
        - Drag SOLO en touch/pen
        - Mouse solo hover/click (sin pointer capture / preventDefault)
     ========================================== */
  const topItems = TOP_ITEMS;

  /* ==========================================
     SEARCH PRO MAX (predictivo + resultados con imágenes)
     + Auth (login/registro) con onboarding premium (front-only)
     ========================================== */
  const SEARCH_RECENTS_KEY = "jusp_home_search_recents_v1";
  const USER_KEY = "jusp_user_v1";

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

  // onboarding
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2>(0);
  const [prefFocus, setPrefFocus] = useState<PrefFocus>("mix");
  const [prefSizes, setPrefSizes] = useState<string[]>([]);
  const [prefInterests, setPrefInterests] = useState<string[]>([]);


  /* ==========================================
     NEWSLETTER (Nike-style) — modal "carta" (UX premium)
     - Aparece SOLO a usuarios nuevos (por dispositivo)
     - Se puede cerrar con X sin dejar correo (no vuelve por 30 días)
     - Si se suscribe, se marca como suscrito y no vuelve a aparecer
     - POST /api/marketing/subscribe  { email, source, ts }
     ========================================== */
  const NL_HIDE_KEY = "jusp_newsletter_hide_until_v1";
  const NL_SUB_KEY = "jusp_newsletter_subscribed_v1";

  const [nlOpen, setNlOpen] = useState(false);
  const [nlEmail, setNlEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [nlMsg, setNlMsg] = useState<string>("");
  const [nlSubscribed, setNlSubscribed] = useState(false);

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
    // Decide si mostrar el modal (solo usuarios nuevos)
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
      // Si localStorage falla, igual mostramos (pero sin persistencia)
      const t = window.setTimeout(() => setNlOpen(true), 900);
      return () => window.clearTimeout(t);
    }
  }, []);

  function closeNewsletter(reason?: string) {
    setNlOpen(false);
    setNlMsg("");
    setNlStatus("idle");
    // No volver a mostrar por 30 días
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
      // Cierra automáticamente después de un momento
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
    // Índice simple (local) para resultados con imagen. Puedes expandir esto cuando tengas catálogo real.
    const base: SearchItem[] = topItems.slice(0, 10).map((t) => ({
      id: t.id,
      name: t.name,
      href: t.href,
      img: t.img,
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
  }, []);

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

  // Predictivo + cache: si repite patrón (prefijo), reducimos el debounce a 0.
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
          // micro-boost por usuario recurrente / logueado (prioridad, no diseño)
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

  // Shortcut: "/" para buscar, ESC para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !searchOpen) {
        const t = e.target as HTMLElement | null;
        const isInput =
          t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as any).isContentEditable);
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

  const openAuth = (mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setAuthErr(null);
    setOnboardingStep(0);
    setPrefFocus("mix");
    setPrefSizes([]);
    setPrefInterests([]);
    setAuthName("");
    setAuthEmail("");
    setSearchOpen(false);
  };

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
      // Login rápido (front-only)
      const u: UserSession = existing?.email === email
        ? { ...existing, lastSeenAt: Date.now() }
        : { email, name: authName.trim() || undefined, createdAt: Date.now(), lastSeenAt: Date.now() };

      completeLogin(u);
      return;
    }

    // Signup + onboarding premium
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
        // en.isIntersecting suele ser suficiente; añadimos ratio para evitar flapping.
        const ok = !!en?.isIntersecting && (en.intersectionRatio ?? 0) > 0.12;
        setTopInView(ok);
        // Si el usuario ya se fue del bloque, pausa para que no “jale” la página con scrollIntoView.
        if (!ok) {
          setTopPaused(true);
        } else {
          // Al volver, permitimos auto-rotación (si no está arrastrando).
          setTopPaused(false);
        }
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
  }>({
    down: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
  });

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
    topCardRefs.current[bestIdx]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  useEffect(() => {
    if (topPaused || !topInView) return;
    const t = setInterval(() => setTopActive((i) => (i + 1) % topItems.length), 2600);
    return () => clearInterval(t);
  }, [topPaused, topInView, topItems.length]);

  useEffect(() => {
    if (topPaused || !topInView) return;
    topCardRefs.current[topActive]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
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
    if (resume) window.setTimeout(() => setTopPaused(false), 450);
  };

  // ✅ FIX “se queda pegado”: si el pointerup ocurre fuera, igual cerramos
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

  // ✅ Drag solo en touch/pen (en PC mouse NO captura y NO bloquea el scroll vertical)
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

    // en touch sí evitamos selección/gestos raros; en mouse no entramos aquí
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

  // ✅ FIX PC (wheel / trackpad):
  // En contenedores con overflow-x, el scroll vertical suele convertirse en scroll horizontal
  // (y parece que la página “se queda pegada” en el carrusel). Aquí enviamos el deltaY al window.
  const onTopWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const vp = topViewportRef.current;
    if (!vp) return;

    // Si el usuario está usando horizontal real (trackpad) o SHIFT, no interferimos.
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    if (e.shiftKey || absX > absY) return;

    // Si estás arrastrando, no re-enviamos (para no pelear con el drag).
    if (dragRef.current.down) return;

    // Evita que el carrusel “consuma” el scroll.
    e.preventDefault();
    window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
  };

  // ✅ Garantiza preventDefault en Chrome/React (wheel suele ser passive): listener nativo no-passive.
  


  // ✅ si sales del carrusel mientras arrastras (touch), cerramos drag
  const onTopPointerLeave: React.PointerEventHandler<HTMLDivElement> = () => {
    if (!dragRef.current.down) return;
    endDrag(true);
  };

  /* ==========================================
     BLOQUE 3 · SELECCIÓN CURADA (HISTORIA JUSP)
     ✅ Entrada al hacer scroll
     ✅ Hover premium
     ✅ Parallax scroll suave
     ✅ Parallax mouse PRO
     ✅ Light-follow PRO MAX
     ========================================== */
  const storyBullets = [
    { title: "Curaduría real", desc: "No es catálogo infinito. Es selección con intención: lo que vale la pena, sin ruido." },
    { title: "Originales o nada", desc: "Solo marcas originales. Trazabilidad y confianza como estándar, no como “extra”." },
    { title: "Servicio pro", desc: "Comunicación clara, seguimiento y experiencia premium de inicio a fin." },
  ];

  const storySectionRef = useRef<HTMLElement | null>(null);
  const storyCardRef = useRef<HTMLDivElement | null>(null);

  const [storyInView, setStoryInView] = useState(false);
  const [storyParallax, setStoryParallax] = useState(0);

  const mouseRef = useRef({ x: 0, y: 0, active: false, raf: 0 });
  const [mouseTX, setMouseTX] = useState(0);
  const [mouseTY, setMouseTY] = useState(0);
  const [mouseRX, setMouseRX] = useState(0);
  const [mouseRY, setMouseRY] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);

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

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const el = storySectionRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const vh = Math.max(1, window.innerHeight || 1);
        const center = rect.top + rect.height * 0.5;
        const t = (center - vh * 0.5) / (vh * 0.5);
        const clamped = Math.max(-1, Math.min(1, t));
        setStoryParallax(-clamped * 10);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scheduleMouseParallax = () => {
    if (mouseRef.current.raf) return;
    mouseRef.current.raf = window.requestAnimationFrame(() => {
      mouseRef.current.raf = 0;
      const card = storyCardRef.current;
      if (!card || !mouseRef.current.active) return;

      const rect = card.getBoundingClientRect();
      const px = (mouseRef.current.x - rect.left) / Math.max(1, rect.width);
      const py = (mouseRef.current.y - rect.top) / Math.max(1, rect.height);

      const nx = (px - 0.5) * 2;
      const ny = (py - 0.5) * 2;

      setMouseTX(nx * 10);
      setMouseTY(ny * 8);
      setMouseRY(nx * 3.4);
      setMouseRX(-ny * 2.6);

      setGlowX(Math.round(px * 100));
      setGlowY(Math.round(py * 100));
    });
  };

  const onStoryMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    mouseRef.current.active = true;
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    scheduleMouseParallax();
  };

  const onStoryMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    mouseRef.current.active = false;
    setMouseTX(0);
    setMouseTY(0);
    setMouseRX(0);
    setMouseRY(0);
    setGlowX(50);
    setGlowY(50);
  };

  /* ==========================================
     BLOQUE 4 · COLECCIÓN (3D AUTO)
     ========================================== */
  const collectionCards: CardItem[] = useMemo(
    () => [
      {
        id: "c1",
        kicker: "COLECCIÓN",
        title: "Best of all time",
        desc: "Los íconos que nunca bajan. Multi-marca, multi-estilo, siempre top.",
        href: "/products?tag=top",
        img: "/home/files/file-2a.jpg",
      },
      {
        id: "c2",
        kicker: "COLECCIÓN",
        title: "Original brands",
        desc: "Nike, Adidas, Puma, NB y más. Selección limpia: solo lo que se siente premium.",
        href: "/products?tag=original",
        img: "/home/files/file-2b.jpg",
      },
      {
        id: "c3",
        kicker: "COLECCIÓN",
        title: "Street & minimal",
        desc: "Siluetas duras + outfits fáciles. Para verse fino sin esforzarse.",
        href: "/products?tag=street",
        img: "/home/files/file-3a.jpg",
      },
      {
        id: "c4",
        kicker: "COLECCIÓN",
        title: "Sport legends",
        desc: "Running, gym, fútbol y más. Rendimiento y estilo en la misma jugada.",
        href: "/products?tag=sport",
        img: "/home/files/file-3c.jpg",
      },
    ],
    []
  );


  const isCard = (c: CardItem): c is Required<Pick<CardItem, "id" | "kicker" | "desc" | "href" | "img">> & { title: string } => {
    return Boolean(c && c.id && c.kicker && c.desc && c.href && c.img);
  };

  const [colActive, setColActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setColActive((i) => (i + 1) % Math.max(1, collectionCards.filter(isCard).length)), 3200);
    return () => clearInterval(t);
  }, [collectionCards.length]);

  const activeCollection = collectionCards.filter(isCard)[colActive] ?? collectionCards[0];

  return (
    <main style={{ overflowX: "hidden", background: "#fff", color: "#000" }}>
      {/* ✅ Newsletter modal tipo Nike (solo usuarios nuevos por dispositivo) */}
      



      {/* HERO */}
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
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 35%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 2, padding: "120px 18px 56px", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ color: "#fff", opacity: 0.92, fontSize: 12, letterSpacing: 1.6, fontWeight: 800 }}>
            JUSP · ORIGINALES · PREMIUM
          </div>
          <h1 style={{ color: "#fff", margin: "10px 0 10px", fontSize: 46, lineHeight: 1.05 }}>
            JUSP · DO MORE
          </h1>
          <p style={{ color: "rgba(255,255,255,0.86)", maxWidth: 560, fontSize: 16, lineHeight: 1.6 }}>
            Originales. Directo.</p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={scrollToTopPicks}
                    style={{
                      borderRadius: 999,
                      padding: "14px 22px",
                      fontWeight: 700,
                      background: "white",
                      color: "black",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                  >
                    Ver lo más top
                  </button>
                </div>


        </div>
      </section>

      {/* BLOQUE 2 */}
      <section id="top-picks" ref={(el) => { topSectionRef.current = el; }} style={{ padding: "26px 0 10px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, opacity: 0.7 }}>LO MÁS TOP</div>
              <div style={{ fontSize: 22, fontWeight: 1000, marginTop: 6 }}>Top picks (10)</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
                Swipe Nike-like + snap. Auto-rotación se pausa al interactuar.
              </div>
            </div>

            <Link href="/products?tag=top" style={{ fontSize: 13, fontWeight: 900, textDecoration: "none", color: "#000", opacity: 0.85 }}>
              Ver todo →
            </Link>
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
                    key={it.id}
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
                      position: "relative",
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: isActive ? "0 22px 80px rgba(0,0,0,0.18)" : "0 10px 30px rgba(0,0,0,0.10)",
                      transform: isActive ? "perspective(1200px) translateZ(0) scale(1.01)" : "perspective(1200px) translateZ(0) scale(0.985)",
                      transition: "transform 420ms cubic-bezier(.2,.9,.2,1), box-shadow 420ms cubic-bezier(.2,.9,.2,1)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ height: "min(66vh, 520px)", minHeight: 360, background: "#f6f6f6", position: "relative" }}>
                      <img
                        src={it.img}
                        alt={it.name}
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transform: isActive
                            ? "perspective(1200px) rotateX(7deg) rotateY(-12deg) translateZ(40px) scale(1.10)"
                            : "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1.02)",
                          transformOrigin: "50% 60%",
                          transition: "transform 560ms cubic-bezier(.2,.9,.2,1)",
                          filter: isActive ? "contrast(1.06) saturate(1.08)" : "contrast(1.0) saturate(1.0)",
                          userSelect: "none",
                          pointerEvents: "none",
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "radial-gradient(1200px 520px at 50% 55%, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.38) 100%)",
                          pointerEvents: "none",
                          opacity: isActive ? 1 : 0.72,
                          transition: "opacity 420ms ease",
                        }}
                      />

                      <div style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: "100%", background: "rgba(255,255,255,0.16)" }}>
                        <div
                          style={{
                            height: "100%",
                            width: isActive ? "100%" : "0%",
                            background: "#fff",
                            opacity: 0.92,
                            transition: isActive ? "width 2600ms linear" : "width 220ms ease",
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px", fontSize: 12, opacity: 0.7 }}>
            Desliza horizontalmente para ver más.
          </div>
        </div>
      </section>

      {/* BLOQUE 3 */}
      <section
        ref={(el) => {
          storySectionRef.current = el;
        }}
        style={{
          padding: "26px 0",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          opacity: storyInView ? 1 : 0,
          transform: storyInView ? "translateY(0px)" : "translateY(14px)",
          transition: "opacity 780ms cubic-bezier(.2,.9,.2,1), transform 780ms cubic-bezier(.2,.9,.2,1)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, opacity: 0.7 }}>SELECCIÓN CURADA</div>
              <h2 style={{ fontSize: 30, lineHeight: 1.08, margin: "10px 0 10px", letterSpacing: -0.5 }}>
                JUSP no es “más productos”.
                <br />
                Es <span style={{ textDecoration: "underline" }}>mejor selección</span>.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.78, maxWidth: 640 }}>
                Nacimos para hacer lo difícil simple: encontrar originales, con estilo real, sin perder tiempo.
                JUSP es curaduría premium: lo que se ve bien, se siente bien y vale la pena.
              </p>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {storyBullets.map((b, i) => (
                  <div
                    key={b.title}
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 14,
                      background: "#fff",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
                      transform: storyInView ? "translateY(0px)" : "translateY(10px)",
                      opacity: storyInView ? 1 : 0,
                      transition:
                        "opacity 720ms cubic-bezier(.2,.9,.2,1), transform 720ms cubic-bezier(.2,.9,.2,1), box-shadow 240ms ease, transform 240ms ease",
                      transitionDelay: `${120 + i * 90}ms`,
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 18px 52px rgba(0,0,0,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0px)";
                      e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.06)";
                    }}
                  >
                    <div style={{ fontWeight: 1000, fontSize: 14 }}>{b.title}</div>
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.78, lineHeight: 1.6 }}>{b.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href="/products?tag=curated"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    padding: "0 16px",
                    borderRadius: 999,
                    background: "#000",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 1000,
                    transition: "transform 220ms ease, box-shadow 220ms ease",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px) scale(1.01)";
                    e.currentTarget.style.boxShadow = "0 18px 46px rgba(0,0,0,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)";
                  }}
                >
                  Ver curaduría
                </Link>

                <Link
                  href="/products?tab=exclusivo"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    padding: "0 16px",
                    borderRadius: 999,
                    background: "#fff",
                    color: "#000",
                    textDecoration: "none",
                    fontWeight: 1000,
                    border: "1px solid rgba(0,0,0,0.12)",
                    transition: "transform 220ms ease, box-shadow 220ms ease",
                    boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.06)";
                  }}
                >
                  Exclusivo
                </Link>
              </div>
            </div>

            <Link
              href="/products?tab=exclusivo"
              aria-label="Ver selección exclusiva"
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
                  <div
  ref={storyCardRef}
  onMouseMove={onStoryMouseMove}
  style={{
    borderRadius: 26,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.12)",
    background: "#f4f4f4",
    minHeight: 420,
    position: "relative",
    perspective: 1200,
    transition:
      "transform 420ms cubic-bezier(.2,.9,.2,1), box-shadow 420ms cubic-bezier(.2,.9,.2,1)",
  }}
  onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                e.currentTarget.style.boxShadow = "0 26px 90px rgba(0,0,0,0.16)";
              }}
  onMouseLeave={(e) => {
    onStoryMouseLeave(e);
    e.currentTarget.style.transform = "translateY(0px) scale(1)";
    e.currentTarget.style.boxShadow = "0 18px 60px rgba(0,0,0,0.12)";
  }}
>
              <img
                src="/home/files/file-3b.jpg"
                alt="Selección curada JUSP"
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `translateY(${storyParallax + mouseTY}px) translateX(${mouseTX}px) rotateX(${mouseRX}deg) rotateY(${mouseRY}deg) scale(1.06)`,
                  transformOrigin: "50% 55%",
                  transition: "transform 220ms ease",
                  willChange: "transform",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(700px 380px at ${glowX}% ${glowY}%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.0) 55%)`,
                  pointerEvents: "none",
                  opacity: mouseRef.current.active ? 1 : 0,
                  transition: "opacity 240ms ease",
                  mixBlendMode: "soft-light",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.62) 100%)",
                }}
              />

              <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, color: "#fff" }}>
                <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, opacity: 0.9 }}>JUSP · DO MORE</div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 1000 }}>Elegante, original y sin vueltas.</div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.84, lineHeight: 1.55 }}>
                  Selección lista para comprar con confianza.
                </div>
              </div>
            </div>
            </Link>
          </div>
        </div> 
      </section>

      {/* BLOQUE 4 */}
      <section style={{ padding: "26px 0 34px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, opacity: 0.7 }}>COLECCIÓN</div>
              <div style={{ fontSize: 26, fontWeight: 1000, marginTop: 8 }}>Lo mejor de todos los tiempos</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>Multi-marca. Formato 3D automático.</div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {collectionCards.filter(isCard).map((c, idx) => (
                <button
                  key={c.id ?? c.title}
                  aria-label={`Ver ${c.title}`}
                  onClick={() => setColActive(idx)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    border: "none",
                    background: idx === colActive ? "#000" : "rgba(0,0,0,0.18)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <Link
            href={activeCollection.href}
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: 14,
              textDecoration: "none",
              color: "#000",
              borderRadius: 26,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.14)",
              background: "#fff",
              transform: "perspective(1200px) translateZ(0)",
            }}
          >
            <div style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, opacity: 0.7 }}>{activeCollection.kicker}</div>
              <div style={{ marginTop: 8, fontSize: 34, fontWeight: 1000, lineHeight: 1.05, letterSpacing: -0.6 }}>
                {activeCollection.title}
              </div>
              <div style={{ marginTop: 10, fontSize: 14, opacity: 0.78, lineHeight: 1.7, maxWidth: 520 }}>
                {activeCollection.desc}
              </div>
              <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 1000 }}>
                Explorar ahora <span style={{ transform: "translateY(-1px)" }}>→</span>
              </div>
            </div>

            <div style={{ position: "relative", minHeight: 340, background: "#f3f3f3" }}>
              <img
                src={activeCollection.img}
                alt={activeCollection.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "perspective(1200px) rotateY(-10deg) rotateX(6deg) translateZ(30px) scale(1.08)",
                  transformOrigin: "60% 55%",
                  transition: "transform 520ms cubic-bezier(.2,.9,.2,1)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.08) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================= */}
      {/* SEARCH OVERLAY · Nike-like (full screen)   */}
      {/* ========================================= */}
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
            // click fuera cierra
            if (e.target === e.currentTarget) closeSearch();
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              overflow: "auto",
            }}
          >
            {/* top bar */}
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
                    style={{
                      height: 46,
                      padding: "0 16px",
                      borderRadius: 999,
                      border: "none",
                      background: "#000",
                      color: "#fff",
                      fontWeight: 1000,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Buscar
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
                  {q.trim() ? "Resultados" : searchRecents.length ? "Recientes" : "Sugerencias"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.65 }}>
                  Tip: <span style={{ fontWeight: 1000 }}>ESC</span> para cerrar
                </div>
              </div>

              {searchLoading ? (
                <div style={{ marginTop: 16, fontSize: 13, opacity: 0.7 }}>Buscando…</div>
              ) : null}

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
                      <img
                        src={p.img}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.44) 100%)",
                        }}
                      />
                      <div style={{ position: "absolute", left: 12, right: 12, bottom: 10, color: "#fff" }}>
                        <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>
                          {p.brand ?? "Original"}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 16, fontWeight: 1000, lineHeight: 1.1 }}>{p.name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* micro-UX: clear recents */}
              {(!q.trim() && searchRecents.length) ? (
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.removeItem(SEARCH_RECENTS_KEY); } catch {}
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

      {/* ========================================= */}
      {/* AUTH MODAL · login/registro + onboarding  */}
      {/* ========================================= */}
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

                    {authErr ? (
                      <div style={{ fontSize: 13, color: "#b00020", fontWeight: 900 }}>{authErr}</div>
                    ) : null}

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
                  <div style={{ marginTop: 8, fontSize: 20, fontWeight: 1000, letterSpacing: -0.2 }}>
                    ¿Qué te interesa más?
                  </div>

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
                      onClick={() => setOnboardingStep(2)}
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
                  <div style={{ marginTop: 8, fontSize: 20, fontWeight: 1000, letterSpacing: -0.2 }}>
                    ¿Qué estilo quieres ver primero?
                  </div>

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

</main>
  );
}
