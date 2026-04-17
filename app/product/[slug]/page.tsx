"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "../../components/store";
import ProductReviews from "./ProductReviews";

type ProductVariant = {
  key: string;
  color?: string;
  size?: string;
  price: number;
  supplierPrice?: number;
  stock?: number;
};

type ProductMediaItem = {
  type: "image" | "video";
  src: string;
};

type ProductParameter = {
  label: string;
  value: string;
  order?: number;
};

type Product = {
  id: string;
  slug?: string;
  product_code?: string;
  title: string;
  name?: string;
  price: number;
  currency?: string;
  description?: string;
  image?: string;
  images?: string[];
  videos?: string[];
  media?: ProductMediaItem[];
  parameters?: ProductParameter[];
  colors?: string[];
  sizes?: string[];
  category?: string;
  brand?: string;
  gender?: "men" | "women" | "kids" | "unisex";
  productType?: "shoes" | "clothing" | "accessory";
  kind?: string;
  sport?: string[];
  models?: string[];
  tags?: string[];
  isExclusive?: boolean;
  isCollection?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  discountPercent?: number;
  bestSeller?: boolean;
  stockHint?: number;
  variants?: ProductVariant[];
  favoritesCount?: number;
  isFavorite?: boolean;
};

function moneyCOP(n: number) {
  return Math.round(n).toLocaleString("es-CO");
}

function formatEstimateDate(date: Date) {
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });
}

function getDeliveryEstimate() {
  const now = new Date();

  const min = new Date(now);
  min.setDate(min.getDate() + 15);

  const max = new Date(now);
  max.setDate(max.getDate() + 20);

  return `${formatEstimateDate(min)} - ${formatEstimateDate(max)}`;
}

function uniqueStringsCaseInsensitive(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of arr) {
    const value = String(item || "").trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(value);
  }

  return out;
}

function uniqueMediaItems(items: ProductMediaItem[]) {
  const seen = new Set<string>();
  const out: ProductMediaItem[] = [];

  for (const item of items) {
    const src = String(item?.src || "").trim();
    if (!src) continue;
    const key = `${String(item?.type || "image").trim().toLowerCase()}::${src.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      type: item.type === "video" ? "video" : "image",
      src,
    });
  }

  return out;
}

function getTouchDistance(
  touchA: { clientX: number; clientY: number },
  touchB: { clientX: number; clientY: number }
) {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampImagePan(scale: number, translateX: number, translateY: number, width: number, height: number) {
  if (scale <= 1 || !width || !height) {
    return { translateX: 0, translateY: 0 };
  }

  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;

  return {
    translateX: clampNumber(translateX, -maxX, maxX),
    translateY: clampNumber(translateY, -maxY, maxY),
  };
}

const FAVORITES_COMPAT_KEYS = [
  "jusp_home_favorites_v1",
  "jusp_favorites_v1",
  "jusp_favorites",
  "favorites",
] as const;

const PRODUCT_TASTE_HISTORY_KEY = "jusp_pdp_taste_history_v1";
const ONBOARDING_STORAGE_KEY = "jusp_onboarding_v2";

type SessionUser = {
  id?: string;
  email?: string;
  profile?: {
    segment?: string;
    interests?: string[];
    brands?: string[];
  } | null;
};

type TasteHistoryEntry = {
  key: string;
  id: string;
  slug?: string;
  productCode?: string;
  title: string;
  category?: string;
  brand?: string;
  gender?: string;
  productType?: string;
  kind?: string;
  sport?: string[];
  models?: string[];
  tags?: string[];
  viewedAt: number;
  views: number;
};

type TasteHistoryStore = Record<string, TasteHistoryEntry[]>;

type TasteProfile = {
  segment: GenderScope | null;
  interests: string[];
  brands: string[];
};

type RecommendedProduct = {
  product: Product;
  reason: string;
  score: number;
};

function safeParseJson<T>(value: string | null): T | null {
  try {
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeSignalValue(value: unknown): string {
  const safe = String(value ?? "").trim().toLowerCase();
  if (!safe || safe === "undefined" || safe === "null") return "";
  return safe;
}

function normalizeSignalList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value
        .split(/[|,/]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return uniqueStringsCaseInsensitive(source.map((item) => String(item ?? "").trim()).filter(Boolean)).map((item) =>
    item.toLowerCase()
  );
}

function productAliases(product: Partial<Product> | { id?: string; slug?: string; productCode?: string } | null | undefined): string[] {
  const item = product as any;

  return uniqueStringsCaseInsensitive(
    [item?.id, item?.slug, item?.product_code, item?.productCode]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  );
}

function buildTasteScopeKey(user: SessionUser | null): string {
  const userId = String(user?.id ?? "").trim();
  if (userId) return `uid:${userId}`;

  const email = String(user?.email ?? "").trim().toLowerCase();
  if (email) return `email:${email}`;

  return "guest";
}

function readTasteHistoryStore(): TasteHistoryStore {
  if (typeof window === "undefined") return {};
  return safeParseJson<TasteHistoryStore>(window.localStorage.getItem(PRODUCT_TASTE_HISTORY_KEY)) ?? {};
}

function loadTasteHistory(scopeKey: string): TasteHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const store = readTasteHistoryStore();
  const list = Array.isArray(store[scopeKey]) ? store[scopeKey] : [];
  return list.slice(0, 24);
}

function loadOnboardingTasteProfile(): TasteProfile {
  if (typeof window === "undefined") {
    return { segment: null, interests: [], brands: [] };
  }

  const payload = safeParseJson<any>(window.localStorage.getItem(ONBOARDING_STORAGE_KEY));

  return {
    segment: normalizeGenderScope(payload?.segment),
    interests: normalizeSignalList(payload?.interests),
    brands: normalizeSignalList(payload?.brands),
  };
}

function buildTasteHistoryEntry(product: Product): TasteHistoryEntry {
  const key = productAliases(product)[0] || String(product.id || "").trim();

  return {
    key,
    id: String(product.id || "").trim(),
    slug: String(product.slug || "").trim() || undefined,
    productCode: String(product.product_code || "").trim() || undefined,
    title: String(product.title || product.name || "Producto").trim(),
    category: normalizeSignalValue(product.category) || undefined,
    brand: normalizeSignalValue(product.brand) || undefined,
    gender: normalizeSignalValue(product.gender) || undefined,
    productType: normalizeSignalValue(product.productType) || undefined,
    kind: normalizeSignalValue(product.kind) || undefined,
    sport: normalizeSignalList(product.sport),
    models: normalizeSignalList(product.models),
    tags: normalizeSignalList(product.tags),
    viewedAt: Date.now(),
    views: 1,
  };
}

function upsertTasteHistory(scopeKey: string, product: Product): TasteHistoryEntry[] {
  if (typeof window === "undefined") return [];

  const store = readTasteHistoryStore();
  const previous = Array.isArray(store[scopeKey]) ? store[scopeKey] : [];
  const nextEntry = buildTasteHistoryEntry(product);
  const nextKey = nextEntry.key;

  const existingIndex = previous.findIndex((entry) => entry.key === nextKey);
  const merged = [...previous];

  if (existingIndex >= 0) {
    const existing = merged[existingIndex];
    merged[existingIndex] = {
      ...existing,
      ...nextEntry,
      views: Math.min(12, Number(existing.views || 0) + 1),
      viewedAt: Date.now(),
    };
  } else {
    merged.unshift(nextEntry);
  }

  const ordered = merged
    .filter((entry) => String(entry.key || "").trim())
    .sort((a, b) => Number(b.viewedAt || 0) - Number(a.viewedAt || 0))
    .slice(0, 24);

  store[scopeKey] = ordered;

  try {
    window.localStorage.setItem(PRODUCT_TASTE_HISTORY_KEY, JSON.stringify(store));
  } catch {}

  return ordered;
}

function extractProductSignals(product: Partial<Product> | TasteHistoryEntry | null | undefined) {
  const category = normalizeSignalValue((product as any)?.category);
  const brand = normalizeSignalValue((product as any)?.brand);
  const gender = normalizeSignalValue((product as any)?.gender);
  const productType = normalizeSignalValue((product as any)?.productType);
  const kind = normalizeSignalValue((product as any)?.kind);
  const sport = normalizeSignalList((product as any)?.sport);
  const models = normalizeSignalList((product as any)?.models);
  const tags = normalizeSignalList((product as any)?.tags);

  const tokens = uniqueStringsCaseInsensitive(
    [...sport, ...models, ...tags, category, brand, gender, productType, kind].filter(Boolean)
  ).map((item) => item.toLowerCase());

  return {
    category,
    brand,
    gender,
    productType,
    kind,
    tokens,
  };
}

function countSharedSignals(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const base = new Set(a);
  let total = 0;

  for (const value of b) {
    if (base.has(value)) total += 1;
  }

  return total;
}

function formatReasonLabel(value: string) {
  const safe = String(value || "").trim();
  if (!safe) return "";
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

function scoreRecommendation(
  candidate: Product,
  currentProduct: Product,
  historyEntries: TasteHistoryEntry[],
  favoriteProducts: Product[],
  profile: TasteProfile
): RecommendedProduct {
  const currentSignals = extractProductSignals(currentProduct);
  const candidateSignals = extractProductSignals(candidate);
  const profileInterests = profile.interests;
  const profileBrands = profile.brands;

  let score = 0;

  if (candidateSignals.category && candidateSignals.category === currentSignals.category) score += 28;
  if (candidateSignals.brand && candidateSignals.brand === currentSignals.brand) score += 24;
  if (candidateSignals.productType && candidateSignals.productType === currentSignals.productType) score += 14;
  if (candidateSignals.gender && candidateSignals.gender === currentSignals.gender) score += 10;
  if (candidateSignals.kind && candidateSignals.kind === currentSignals.kind) score += 10;

  score += countSharedSignals(candidateSignals.tokens, currentSignals.tokens) * 6;

  favoriteProducts.slice(0, 6).forEach((favoriteProduct, index) => {
    const favoriteSignals = extractProductSignals(favoriteProduct);
    const weight = Math.max(3, 8 - index);

    if (candidateSignals.brand && candidateSignals.brand === favoriteSignals.brand) score += 6 * weight;
    if (candidateSignals.category && candidateSignals.category === favoriteSignals.category) score += 5 * weight;
    if (candidateSignals.productType && candidateSignals.productType === favoriteSignals.productType)
      score += 4 * weight;
    score += countSharedSignals(candidateSignals.tokens, favoriteSignals.tokens) * Math.max(2, weight - 2);
  });

  historyEntries.slice(0, 8).forEach((entry, index) => {
    const entrySignals = extractProductSignals(entry);
    const baseWeight = Math.max(2, 9 - index);
    const viewWeight = Math.min(4, Number(entry.views || 1));

    if (candidateSignals.brand && candidateSignals.brand === entrySignals.brand) score += 4 * baseWeight + viewWeight;
    if (candidateSignals.category && candidateSignals.category === entrySignals.category)
      score += 5 * baseWeight + viewWeight;
    if (candidateSignals.productType && candidateSignals.productType === entrySignals.productType)
      score += 3 * baseWeight;
    if (candidateSignals.gender && candidateSignals.gender === entrySignals.gender) score += 2 * baseWeight;
    score += countSharedSignals(candidateSignals.tokens, entrySignals.tokens) * Math.max(2, baseWeight - 2);
  });

  if (profile.segment && candidateSignals.gender && candidateSignals.gender === profile.segment) score += 16;
  if (candidateSignals.brand && profileBrands.includes(candidateSignals.brand)) score += 24;
  score += countSharedSignals(candidateSignals.tokens, profileInterests) * 9;

  if (candidate.bestSeller) score += 4;
  if (candidate.isFeatured) score += 3;
  if (candidate.isNew) score += 2;

  let reason = "Selección curada por JUSP";

  if (candidateSignals.brand && profileBrands.includes(candidateSignals.brand)) {
    reason = "Recomendado para ti";
  } else {
    const matchedInterest = profileInterests.find((interest) => candidateSignals.tokens.includes(interest));
    if (matchedInterest) {
      reason = `Va con tu interés en ${formatReasonLabel(matchedInterest)}`;
    } else if (candidateSignals.brand && favoriteProducts.some((favorite) => extractProductSignals(favorite).brand === candidateSignals.brand)) {
      reason = `Se parece a lo que guardas de ${formatReasonLabel(candidateSignals.brand)}`;
    } else if (
      candidateSignals.category &&
      historyEntries.some((entry) => extractProductSignals(entry).category === candidateSignals.category)
    ) {
      reason = `Basado en lo que miras de ${formatReasonLabel(candidateSignals.category)}`;
    } else if (
      (candidateSignals.brand && candidateSignals.brand === currentSignals.brand) ||
      (candidateSignals.category && candidateSignals.category === currentSignals.category)
    ) {
      reason = "Similar a este producto";
    }
  }

  return { product: candidate, reason, score };
}

function normalizeFavoriteId(value: any): string | null {
  const candidate =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : typeof value === "object" && value
      ? String(value.id ?? value.productId ?? value.slug ?? value.product_code ?? "").trim()
      : "";

  const safe = String(candidate || "").trim();
  return safe ? safe : null;
}

function loadFavoriteIdsCompat(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const merged: string[] = [];

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
        const id = normalizeFavoriteId(entry);
        if (id && !merged.includes(id)) merged.push(id);
      }
    }

    return merged;
  } catch {
    return [];
  }
}

function persistFavoriteIdsCompat(ids: string[]) {
  if (typeof window === "undefined") return;

  try {
    const unique = Array.from(new Set(ids.map((v) => String(v).trim()).filter(Boolean)));

    for (const key of FAVORITES_COMPAT_KEYS) {
      window.localStorage.setItem(key, JSON.stringify(unique));
    }

    window.dispatchEvent(
      new CustomEvent("jusp:favorites-changed", {
        detail: { ids: unique, ts: Date.now() },
      })
    );
  } catch {}
}

function buildMediaCandidates(p: Product, pageSlug?: string): ProductMediaItem[] {
  const media = Array.isArray(p.media) ? p.media : [];
  const imgs = Array.isArray(p.images) ? p.images : [];
  const videos = Array.isArray(p.videos) ? p.videos : [];
  const main = (typeof p.image === "string" ? p.image : "").trim();

  const rawMedia = [
    ...media,
    ...[main, ...imgs]
      .map((src) => String(src || "").trim())
      .filter(Boolean)
      .map((src) => ({ type: "image" as const, src })),
    ...videos
      .map((src) => String(src || "").trim())
      .filter(Boolean)
      .map((src) => ({ type: "video" as const, src })),
  ];

  const isAbs = (s: string) => /^https?:\/\//i.test(s);
  const hasImageExt = (s: string) => /\.(png|jpe?g|webp|gif|avif)$/i.test(s);
  const hasVideoExt = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);

  const normalizeOne = (item: ProductMediaItem) => {
    const v = String(item?.src || "").trim();
    if (!v) return "";
    if (isAbs(v)) return v;
    if (v.startsWith("/")) return v;
    if (v.startsWith("products/")) return `/${v}`;
    if (hasImageExt(v) || hasVideoExt(v)) return `/products/${v}`;
    return "";
  };

  const candidateSlugs = uniqueStringsCaseInsensitive(
    [
      String(pageSlug || "").trim(),
      String(p.slug || "").trim(),
      String(p.id || "").trim(),
      String(p.product_code || "").trim(),
    ].filter(Boolean)
  ).map((x) => x.toLowerCase());

  const candidateIndexes = Array.from({ length: 20 }, (_, index) => index + 1);
  const imageExtensions = ["jpg", "jpeg", "JPG", "JPEG"] as const;
  const videoExtensions = ["mp4", "MP4", "mov", "MOV", "webm", "WEBM", "m4v", "M4V"] as const;

  const localCandidates = candidateSlugs.flatMap((s) =>
    candidateIndexes.flatMap((index) => {
      const plain = String(index);
      const padded = String(index).padStart(2, "0");

      const imageItems = [plain, padded].flatMap((base) =>
        imageExtensions.map((ext) => ({
          type: "image" as const,
          src: `/products/${s}/${base}.${ext}`,
        }))
      );

      const videoItems = [plain, padded].flatMap((base) =>
        videoExtensions.map((ext) => ({
          type: "video" as const,
          src: `/products/${s}/${base}.${ext}`,
        }))
      );

      return [...videoItems, ...imageItems];
    })
  );

  return uniqueMediaItems([
    ...rawMedia
      .map((item) => ({
        type: (item.type === "video" ? "video" : "image") as "image" | "video",
        src: normalizeOne(item),
      }))
      .filter((item) => item.src),
    ...localCandidates,
  ]);
}

function buildImageCandidates(p: Product, pageSlug?: string): string[] {
  return buildMediaCandidates(p, pageSlug)
    .filter((item) => item.type === "image")
    .map((item) => item.src);
}

function loadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function loadVideo(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const done = (ok: boolean) => {
      video.onloadeddata = null;
      video.onerror = null;
      resolve(ok);
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => done(true);
    video.onerror = () => done(false);
    video.src = src;
  });
}

type GenderScope = "men" | "women" | "kids";

function normalizeGenderScope(v: unknown): GenderScope | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s || s === "undefined" || s === "null") return null;
  if (s === "men" || s === "hombre") return "men";
  if (s === "women" || s === "mujer") return "women";
  if (s === "kids" || s === "kid" || s === "niños" || s === "ninos") return "kids";
  return null;
}

function readStoredScope(): GenderScope | null {
  try {
    return normalizeGenderScope(window.localStorage.getItem("jusp:genderScope"));
  } catch {
    return null;
  }
}

function storeScope(scope: GenderScope) {
  try {
    window.localStorage.setItem("jusp:genderScope", scope);
  } catch {}
}

function convertMenToWomenUS(size: string) {
  const raw = (size || "").trim();
  if (!raw || /[a-zA-Z]/.test(raw)) return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const w = n + 1.5;
  const rounded = Math.round(w * 2) / 2;
  return Number.isInteger(rounded) ? String(Math.trunc(rounded)) : String(rounded);
}

function convertWomenToMenUS(size: string) {
  const raw = (size || "").trim();
  if (!raw || /[a-zA-Z]/.test(raw)) return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const m = n - 1.5;
  const rounded = Math.round(m * 2) / 2;
  return Number.isInteger(rounded) ? String(Math.trunc(rounded)) : String(rounded);
}

function applyScopeToSizes(rawSizes: string[], scope: GenderScope) {
  if (!Array.isArray(rawSizes)) return [];
  if (scope === "women") return rawSizes.map(convertMenToWomenUS);
  return rawSizes;
}

function safeArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim())
    : [];
}

function uniq(arr: string[]) {
  const out: string[] = [];
  for (const a of arr) {
    const v = (a || "").trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

function normalizeCompareValue(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function toSafeStock(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }

  return null;
}

type SizingMode = "shoe" | "apparel";

const WOMEN_SHOE_FULL_US = ["5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5"];
const APPAREL_SIZES = ["S", "M", "L", "XL"];
const MEN_DEFAULT = ["7", "7.5", "8", "8.5", "9", "10"];
const KIDS_DEFAULT = ["3Y", "3.5Y", "4Y", "4.5Y", "5Y", "5.5Y", "6Y"];

function normalizeVariants(product: Product): ProductVariant[] {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const out: ProductVariant[] = [];

  for (const v of variants) {
    const size = String(v.size ?? "").trim();
    const color = String(v.color ?? "").trim();
    const price = typeof v.price === "number" ? v.price : Number(v.price);
    if (!size && !color) continue;
    if (!Number.isFinite(price)) continue;
    out.push({ ...v, size, color, price });
  }

  return out;
}

function looksLikeApparelSize(s: string) {
  const x = String(s || "").trim().toLowerCase();
  return x === "xs" || x === "s" || x === "m" || x === "l" || x === "xl" || x === "xxl";
}

function inferSizingMode(product: Product, variants: ProductVariant[]): SizingMode {
  const vSizes = uniq(variants.map((v) => String(v?.size ?? "").trim()).filter(Boolean));

  if (vSizes.some((s) => looksLikeApparelSize(s))) return "apparel";

  const ps = safeArr(product.sizes);
  if (ps.some((s) => looksLikeApparelSize(s))) return "apparel";

  const haystack =
    `${String(product.category ?? "")} ${String((product as any)?.type ?? "")} ${String(
      (product as any)?.collection ?? ""
    )} ${String(product.title ?? "")} ${String(product.name ?? "")}`.toLowerCase();

  const apparelWords = [
    "shirt",
    "tee",
    "t-shirt",
    "camisa",
    "polo",
    "hoodie",
    "sudadera",
    "sweater",
    "jacket",
    "chaqueta",
    "pants",
    "pantalon",
    "jean",
    "jeans",
    "short",
    "shorts",
    "bermuda",
    "ropa",
    "apparel",
    "tank",
    "top",
    "bra",
  ];

  if (apparelWords.some((w) => haystack.includes(w))) return "apparel";

  return "shoe";
}

function findVariantBySelection(
  product: Product,
  scope: GenderScope,
  displayedSize: string | null,
  selectedColor: string | null
): ProductVariant | null {
  const variants = normalizeVariants(product);
  if (!variants.length) return null;

  const ds = (displayedSize ?? "").trim();
  const dc = (selectedColor ?? "").trim().toLowerCase();

  const byColor = dc
    ? variants.filter((v) => String(v.color ?? "").trim().toLowerCase() === dc)
    : variants;

  if (ds) {
    const exact = byColor.filter((v) => String(v.size ?? "").trim() === ds);
    if (exact.length) {
      let best = exact[0];
      for (const v of exact) {
        const p = Number(v.price ?? 0);
        if (p < Number(best.price ?? 0)) best = v;
      }
      return best;
    }
  }

  const normalizedDs = ds;
  const maybeConverted =
    scope === "women" && normalizedDs && !/[a-zA-Z/]/.test(normalizedDs)
      ? convertWomenToMenUS(normalizedDs)
      : normalizedDs;

  if (maybeConverted && maybeConverted !== normalizedDs) {
    const converted = byColor.filter((v) => String(v.size ?? "").trim() === maybeConverted);
    if (converted.length) {
      let best = converted[0];
      for (const v of converted) {
        const p = Number(v.price ?? 0);
        if (p < Number(best.price ?? 0)) best = v;
      }
      return best;
    }
  }

  const fallbackPool = byColor.length ? byColor : variants;

  let best = fallbackPool[0];
  for (const v of fallbackPool) {
    const p = Number(v.price ?? 0);
    if (p < Number(best.price ?? 0)) best = v;
  }

  return best ?? null;
}

function minVariantPrice(product: Product): number {
  const variants = normalizeVariants(product);
  if (!variants.length) return Number(product.price || 0);

  let m = Number.POSITIVE_INFINITY;
  for (const v of variants) {
    const p = typeof v.price === "number" ? v.price : Number.POSITIVE_INFINITY;
    if (p < m) m = p;
  }

  return Number.isFinite(m) ? m : Number(product.price || 0);
}

function maxVariantPrice(product: Product): number {
  const variants = normalizeVariants(product);
  if (!variants.length) return Number(product.price || 0);

  let m = 0;
  for (const v of variants) {
    const p = typeof v.price === "number" ? v.price : 0;
    if (p > m) m = p;
  }

  return Number.isFinite(m) ? m : Number(product.price || 0);
}

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gParam = searchParams?.get("g");

  const slug = decodeURIComponent(String(params?.slug || "")).trim().toLowerCase();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [tasteHistory, setTasteHistory] = useState<TasteHistoryEntry[]>([]);
  const [onboardingTaste, setOnboardingTaste] = useState<TasteProfile>({
    segment: null,
    interests: [],
    brands: [],
  });

  const {
    state,
    addToCart,
    openCart,
    isFav,
    toggleFav,
    getFavCount,
    setFavCount,
    hydrateFavCountsFromProducts,
  } = useStore();

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoadingProduct(true);

        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();

        const list = Array.isArray(data) ? data : [];
        const s = String(slug || "").trim().toLowerCase();

        const found = list.find((p: any) => {
          const pid = String(p?.id ?? "").trim().toLowerCase();
          const pslug = String(p?.slug ?? "").trim().toLowerCase();
          const pcode = String(p?.product_code ?? "").trim().toLowerCase();
          return pid === s || pslug === s || pcode === s;
        }) as Product | undefined;

        if (!cancelled) {
          setCatalogProducts(list);
          setProduct(found);
        }
      } catch {
        if (!cancelled) {
          setCatalogProducts([]);
          setProduct(undefined);
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);

        if (!cancelled) {
          setSessionUser(res.ok ? ((json?.user ?? null) as SessionUser | null) : null);
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
        }
      } finally {
        if (!cancelled) {
          setSessionChecked(true);
        }
      }
    }

    loadSessionUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const initialScope = useMemo<GenderScope>(() => {
    const fromProduct = normalizeGenderScope(product?.gender);
    if (fromProduct) return fromProduct;

    const fromQuery = normalizeGenderScope(gParam);
    if (fromQuery) return fromQuery;

    return "men";
  }, [gParam, product]);

  const [scope, setScope] = useState<GenderScope>(initialScope);
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const tasteScopeKey = useMemo(() => buildTasteScopeKey(sessionUser), [sessionUser]);

  useEffect(() => {
    setScope(initialScope);
  }, [initialScope]);

  useEffect(() => {
    if (gParam) return;
    const stored = readStoredScope();
    if (!stored) return;
    setScope((prev) => (prev === stored ? prev : stored));
  }, [gParam]);

  useEffect(() => {
    storeScope(scope);
  }, [scope]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setFavoriteIds(loadFavoriteIdsCompat());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionChecked) return;

    setTasteHistory(loadTasteHistory(tasteScopeKey));
    setOnboardingTaste(loadOnboardingTasteProfile());
  }, [sessionChecked, tasteScopeKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFavorites = () => setFavoriteIds(loadFavoriteIdsCompat());

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

  const title = useMemo(
    () => (product ? product.title || product.name || "Producto" : "Producto"),
    [product]
  );

  const mediaCandidates = useMemo(
    () => (product ? buildMediaCandidates(product, slug) : []),
    [product, slug]
  );

  const variants = useMemo(() => (product ? normalizeVariants(product) : []), [product]);

  useEffect(() => {
    let cancelled = false;

    async function resolveMedia() {
      if (!mediaCandidates.length) {
        if (!cancelled) setMediaItems([]);
        return;
      }

      const order = new Map(mediaCandidates.map((item, index) => [`${item.type}::${item.src}`, index]));
      let foundAny = false;
      let validItems: ProductMediaItem[] = [];

      const commit = (nextItems: ProductMediaItem[]) => {
        validItems = uniqueMediaItems(nextItems).sort((a, b) => {
          const keyA = `${a.type}::${a.src}`;
          const keyB = `${b.type}::${b.src}`;
          return (order.get(keyA) ?? Number.MAX_SAFE_INTEGER) - (order.get(keyB) ?? Number.MAX_SAFE_INTEGER);
        });

        if (!cancelled) {
          setMediaItems(validItems);
        }
      };

      const verify = async (item: ProductMediaItem) => {
        return item.type === "video" ? await loadVideo(item.src) : await loadImage(item.src);
      };

      for (const item of mediaCandidates) {
        const ok = await verify(item);
        if (cancelled) return;

        if (ok) {
          foundAny = true;
          commit([...validItems, item]);
          break;
        }
      }

      if (cancelled) return;

      if (!foundAny) {
        setMediaItems([]);
      }

      const remaining = mediaCandidates.filter(
        (item) => !validItems.some((existing) => existing.type === item.type && existing.src === item.src)
      );

      const batchSize = 4;
      for (let i = 0; i < remaining.length; i += batchSize) {
        const batch = remaining.slice(i, i + batchSize);
        const checks = await Promise.all(
          batch.map(async (item) => ({
            item,
            ok: await verify(item),
          }))
        );

        if (cancelled) return;

        const batchValid = checks.filter((entry) => entry.ok).map((entry) => entry.item);
        if (batchValid.length) {
          commit([...validItems, ...batchValid]);
        }
      }
    }

    resolveMedia();

    return () => {
      cancelled = true;
    };
  }, [mediaCandidates]);

  useEffect(() => {
    return () => {
      stopThumbColumnAutoScroll();
      stopThumbColumnDrag();
    };
  }, []);

  useEffect(() => {
    if (!product) return;
    hydrateFavCountsFromProducts([product]);
    setFavCount(product.id, Number(product.favoritesCount || 0));
  }, [product, hydrateFavCountsFromProducts, setFavCount]);

  useEffect(() => {
    if (!product || !sessionChecked || typeof window === "undefined") return;
    setTasteHistory(upsertTasteHistory(tasteScopeKey, product));
  }, [product?.id, product?.slug, sessionChecked, tasteScopeKey]);

  const sizingMode = useMemo<SizingMode>(() => {
    if (!product) return "shoe";
    return inferSizingMode(product, variants);
  }, [product, variants]);

  const rawSizes = useMemo(() => {
    if (!product) return [];

    if (variants.length) {
      return uniq(variants.map((v) => String(v?.size ?? "").trim()).filter(Boolean));
    }

    const ps = safeArr(product.sizes);
    if (ps.length) return uniq(ps);

    if (sizingMode === "apparel") return APPAREL_SIZES;
    if (scope === "women") return WOMEN_SHOE_FULL_US.map(convertWomenToMenUS);
    if (scope === "kids") return KIDS_DEFAULT;
    return MEN_DEFAULT;
  }, [product, variants, scope, sizingMode]);

  const sizes = useMemo(() => {
    if (variants.length) return rawSizes;
    if (sizingMode === "apparel") return rawSizes;
    if (scope === "women") return applyScopeToSizes(rawSizes, scope);
    return rawSizes;
  }, [rawSizes, scope, sizingMode, variants]);

  const colors = useMemo(() => {
    if (!product) return [];
    const fromVariants = uniq(variants.map((v) => String(v?.color ?? "").trim()).filter(Boolean));
    const fromProduct = uniq(safeArr(product.colors));
    return uniqueStringsCaseInsensitive([...fromVariants, ...fromProduct]);
  }, [product, variants]);

  const [size, setSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [toast, setToast] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState<number>(0);
  const [attemptedBuy, setAttemptedBuy] = useState(false);
  const [imageZoom, setImageZoom] = useState({
    active: false,
    left: 0,
    top: 0,
    focusSize: 132,
    paneWidth: 320,
    paneHeight: 520,
    paneImageLeft: 0,
    paneImageTop: 0,
    paneImageWidth: 260,
    paneImageHeight: 320,
  });
  const [mobileImageZoom, setMobileImageZoom] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
    pinching: false,
  });
  const activeImageRef = useRef<HTMLImageElement | null>(null);
  const infoCardRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const pinchStartTranslateRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; translateX: number; translateY: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const thumbColRef = useRef<HTMLDivElement | null>(null);
  const thumbAutoScrollFrameRef = useRef<number | null>(null);
  const thumbAutoScrollVelocityRef = useRef<number>(0);
  const thumbDragActiveRef = useRef(false);
  const thumbDragLastYRef = useRef<number | null>(null);
  const currentMedia = mediaItems[activeImg] ?? null;
  const currentImage = currentMedia?.type === "image" ? currentMedia.src : "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const imageSources = mediaItems
      .filter((item) => item.type === "image" && item.src)
      .map((item) => item.src);

    imageSources.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [mediaItems]);

  const productParameters = useMemo(
    () =>
      Array.isArray(product?.parameters)
        ? product.parameters.filter(
            (item) => String(item?.label || "").trim() && String(item?.value || "").trim()
          )
        : [],
    [product?.parameters]
  );

  function stopThumbColumnAutoScroll() {
    thumbAutoScrollVelocityRef.current = 0;

    if (typeof window !== "undefined" && thumbAutoScrollFrameRef.current != null) {
      window.cancelAnimationFrame(thumbAutoScrollFrameRef.current);
      thumbAutoScrollFrameRef.current = null;
    }
  }

  function runThumbColumnAutoScroll() {
    const container = thumbColRef.current;

    if (!container) {
      stopThumbColumnAutoScroll();
      return;
    }

    const velocity = thumbAutoScrollVelocityRef.current;
    if (!velocity) {
      thumbAutoScrollFrameRef.current = null;
      return;
    }

    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const nextScrollTop = Math.min(maxScrollTop, Math.max(0, container.scrollTop + velocity));

    container.scrollTop = nextScrollTop;

    if (nextScrollTop >= maxScrollTop) {
      stopThumbColumnAutoScroll();
      return;
    }

    if (typeof window !== "undefined") {
      thumbAutoScrollFrameRef.current = window.requestAnimationFrame(runThumbColumnAutoScroll);
    }
  }

  function stopThumbColumnDrag() {
    thumbDragActiveRef.current = false;
    thumbDragLastYRef.current = null;
  }

  function onThumbColumnMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 980px)").matches) return;
    if (e.button !== 0 && e.button !== 2) return;

    stopThumbColumnAutoScroll();
    thumbDragActiveRef.current = true;
    thumbDragLastYRef.current = e.clientY;
    e.preventDefault();
  }

  function onThumbColumnMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 980px)").matches) return;

    const container = thumbColRef.current;
    if (!container) return;

    if (thumbDragActiveRef.current) {
      const lastY = thumbDragLastYRef.current;
      if (lastY != null) {
        const deltaY = e.clientY - lastY;
        container.scrollTop += deltaY;
      }
      thumbDragLastYRef.current = e.clientY;
      e.preventDefault();
      return;
    }

    const rect = container.getBoundingClientRect();
    const localY = e.clientY - rect.top;
    const bottomZone = Math.min(120, rect.height * 0.32);
    const startZone = rect.height - bottomZone;

    if (localY <= startZone) {
      stopThumbColumnAutoScroll();
      return;
    }

    const progress = Math.min(1, Math.max(0, (localY - startZone) / bottomZone));
    thumbAutoScrollVelocityRef.current = 2 + progress * 12;

    if (thumbAutoScrollFrameRef.current == null) {
      thumbAutoScrollFrameRef.current = window.requestAnimationFrame(runThumbColumnAutoScroll);
    }
  }

  useEffect(() => {
    return () => {
      stopThumbColumnAutoScroll();
    };
  }, []);

  function goToPrevImage() {
    if (mediaItems.length <= 1) return;
    setActiveImg((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }

  function goToNextImage() {
    if (mediaItems.length <= 1) return;
    setActiveImg((prev) => (prev + 1) % mediaItems.length);
  }

  function onImageTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (currentMedia?.type !== "image") return;
    setImageZoom((prev) => (prev.active ? { ...prev, active: false } : prev));

    if (e.touches.length >= 2) {
      const [touchA, touchB] = Array.from(e.touches);

      pinchStartDistanceRef.current = getTouchDistance(touchA, touchB);
      pinchStartScaleRef.current = mobileImageZoom.scale;
      pinchStartTranslateRef.current = {
        x: mobileImageZoom.translateX,
        y: mobileImageZoom.translateY,
      };
      panStartRef.current = null;
      touchStartXRef.current = null;
      touchStartYRef.current = null;

      setMobileImageZoom((prev) => ({
        ...prev,
        pinching: true,
      }));
      return;
    }

    if (mobileImageZoom.scale > 1.02) {
      const touch = e.touches?.[0];
      if (!touch) return;
      panStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        translateX: mobileImageZoom.translateX,
        translateY: mobileImageZoom.translateY,
      };
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const touch = e.touches?.[0];
    if (!touch) return;
    panStartRef.current = null;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }

  function onImageTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (currentMedia?.type !== "image") return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    if (e.touches.length >= 2 && pinchStartDistanceRef.current != null) {
      const [touchA, touchB] = Array.from(e.touches);
      const nextDistance = getTouchDistance(touchA, touchB);
      const nextScale = Math.min(
        4,
        Math.max(1, pinchStartScaleRef.current * (nextDistance / pinchStartDistanceRef.current))
      );
      const clampedPan = clampImagePan(
        nextScale,
        pinchStartTranslateRef.current.x,
        pinchStartTranslateRef.current.y,
        rect.width,
        rect.height
      );

      e.preventDefault();
      setMobileImageZoom({
        scale: nextScale,
        translateX: clampedPan.translateX,
        translateY: clampedPan.translateY,
        pinching: true,
      });
      return;
    }

    if (e.touches.length !== 1 || !panStartRef.current || mobileImageZoom.scale <= 1.02) return;

    const touch = e.touches[0];
    const nextTranslateX = panStartRef.current.translateX + (touch.clientX - panStartRef.current.x);
    const nextTranslateY = panStartRef.current.translateY + (touch.clientY - panStartRef.current.y);
    const clampedPan = clampImagePan(mobileImageZoom.scale, nextTranslateX, nextTranslateY, rect.width, rect.height);

    e.preventDefault();
    setMobileImageZoom((prev) => ({
      ...prev,
      translateX: clampedPan.translateX,
      translateY: clampedPan.translateY,
      pinching: false,
    }));
  }

  function onImageTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (currentMedia?.type !== "image") return;
    if (pinchStartDistanceRef.current != null) {
      if (e.touches.length >= 2) return;

      pinchStartDistanceRef.current = null;
      pinchStartScaleRef.current = mobileImageZoom.scale;
      pinchStartTranslateRef.current = {
        x: mobileImageZoom.translateX,
        y: mobileImageZoom.translateY,
      };
      setMobileImageZoom((prev) => ({
        ...prev,
        scale: prev.scale < 1.05 ? 1 : prev.scale,
        translateX: prev.scale < 1.05 ? 0 : prev.translateX,
        translateY: prev.scale < 1.05 ? 0 : prev.translateY,
        pinching: false,
      }));
      panStartRef.current = null;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const touch = e.changedTouches?.[0];

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (!touch) return;

    const now = Date.now();
    const lastTap = lastTapRef.current;
    const rect = e.currentTarget.getBoundingClientRect();

    if (
      lastTap &&
      now - lastTap.time < 280 &&
      Math.abs(lastTap.x - touch.clientX) < 24 &&
      Math.abs(lastTap.y - touch.clientY) < 24
    ) {
      if (mobileImageZoom.scale > 1.02) {
        setMobileImageZoom({ scale: 1, translateX: 0, translateY: 0, pinching: false });
      } else if (rect.width && rect.height) {
        const tapX = touch.clientX - rect.left;
        const tapY = touch.clientY - rect.top;
        const nextScale = 2.4;
        const desiredTranslateX = (rect.width / 2 - tapX) * (nextScale - 1);
        const desiredTranslateY = (rect.height / 2 - tapY) * (nextScale - 1);
        const clampedPan = clampImagePan(nextScale, desiredTranslateX, desiredTranslateY, rect.width, rect.height);

        setMobileImageZoom({
          scale: nextScale,
          translateX: clampedPan.translateX,
          translateY: clampedPan.translateY,
          pinching: false,
        });
      }

      lastTapRef.current = null;
      panStartRef.current = null;
      return;
    }

    lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };

    if (mobileImageZoom.scale > 1.02) {
      panStartRef.current = null;
      return;
    }

    if (startX == null || startY == null || mediaItems.length <= 1) return;

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;

    if (dx < 0) {
      goToNextImage();
      return;
    }

    goToPrevImage();
  }

  useEffect(() => {
    setActiveImg(0);
    setAttemptedBuy(false);

    if (sizes.length) {
      setSize((prev) => {
        if (prev && sizes.includes(prev)) return prev;
        return sizes[0] ?? null;
      });
    } else {
      setSize(null);
    }
  }, [slug, sizes]);

  useEffect(() => {
    if (colors.length) {
      setSelectedColor((prev) => {
        if (prev && colors.some((c) => c.toLowerCase() === prev.toLowerCase())) return prev;
        return colors[0] ?? null;
      });
    } else {
      setSelectedColor(null);
    }
  }, [slug, colors]);

  useEffect(() => {
    if (!mediaItems.length) {
      setActiveImg(0);
      return;
    }

    setActiveImg((prev) => (prev >= mediaItems.length ? 0 : prev));
  }, [mediaItems]);

  useEffect(() => {
    setImageZoom((prev) => (prev.active ? { ...prev, active: false } : prev));
    setMobileImageZoom((prev) =>
      prev.scale > 1 || prev.translateX !== 0 || prev.translateY !== 0
        ? { ...prev, scale: 1, translateX: 0, translateY: 0, pinching: false }
        : prev
    );
    pinchStartDistanceRef.current = null;
    panStartRef.current = null;
  }, [activeImg]);

  function onImageMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (currentMedia?.type !== "image") return;
    if (!currentImage) return;
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const framePadding = 12;
    const frameWidth = Math.max(1, rect.width - framePadding * 2);
    const frameHeight = Math.max(1, rect.height - framePadding * 2);
    const naturalWidth = activeImageRef.current?.naturalWidth || frameWidth;
    const naturalHeight = activeImageRef.current?.naturalHeight || frameHeight;
    const imageAspect = naturalWidth / naturalHeight || 1;
    const frameAspect = frameWidth / frameHeight;

    let renderedWidth = frameWidth;
    let renderedHeight = frameHeight;
    let offsetX = framePadding;
    let offsetY = framePadding;

    if (imageAspect > frameAspect) {
      renderedWidth = frameWidth;
      renderedHeight = renderedWidth / imageAspect;
      offsetY = framePadding + (frameHeight - renderedHeight) / 2;
    } else {
      renderedHeight = frameHeight;
      renderedWidth = renderedHeight * imageAspect;
      offsetX = framePadding + (frameWidth - renderedWidth) / 2;
    }

    const focusSize = Math.min(150, Math.max(108, Math.min(renderedWidth, renderedHeight) * 0.22));
    const lensRadius = focusSize / 2;
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const left = clampNumber(rawX, offsetX + lensRadius, offsetX + renderedWidth - lensRadius);
    const top = clampNumber(rawY, offsetY + lensRadius, offsetY + renderedHeight - lensRadius);
    const localX = clampNumber(rawX - offsetX, 0, renderedWidth);
    const localY = clampNumber(rawY - offsetY, 0, renderedHeight);
    const cardRect = infoCardRef.current?.getBoundingClientRect();
    const paneWidth = Math.max(280, (cardRect?.width ?? 348) - 28);
    const paneHeight = Math.max(360, (cardRect?.height ?? 560) - 28);
    const zoomScale = Math.max(paneWidth / focusSize, paneHeight / focusSize);
    const paneImageWidth = renderedWidth * zoomScale;
    const paneImageHeight = renderedHeight * zoomScale;
    const paneImageLeft = clampNumber(paneWidth / 2 - localX * zoomScale, paneWidth - paneImageWidth, 0);
    const paneImageTop = clampNumber(paneHeight / 2 - localY * zoomScale, paneHeight - paneImageHeight, 0);

    setImageZoom({
      active: true,
      left,
      top,
      focusSize,
      paneWidth,
      paneHeight,
      paneImageLeft,
      paneImageTop,
      paneImageWidth,
      paneImageHeight,
    });
  }

  function onImageMouseLeave() {
    setImageZoom((prev) => (prev.active ? { ...prev, active: false } : prev));
  }

  const hasRealVariants = useMemo(() => variants.length > 0, [variants]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return findVariantBySelection(product, scope, size, selectedColor);
  }, [product, scope, size, selectedColor]);

  const displayPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant && typeof selectedVariant.price === "number") return selectedVariant.price;
    return Number(product.price ?? 0);
  }, [product, selectedVariant]);

  const fromPrice = useMemo(() => (product ? minVariantPrice(product) : 0), [product]);
  const toPrice = useMemo(() => (product ? maxVariantPrice(product) : 0), [product]);

  const discountPct = useMemo(() => {
    const d = Number(product?.discountPercent ?? 0);
    if (!Number.isFinite(d)) return 0;
    return Math.max(0, Math.min(90, Math.round(d)));
  }, [product]);

  const priceBefore = useMemo(() => {
    if (!displayPrice) return 0;
    if (!discountPct) return 0;
    return Math.round(displayPrice / (1 - discountPct / 100));
  }, [displayPrice, discountPct]);

  const currentStock = useMemo(() => {
    if (!product) return 0;

    if (selectedVariant) {
      const variantStock = toSafeStock(selectedVariant.stock);
      if (variantStock !== null) return variantStock;
    }

    const hintStock = toSafeStock(product.stockHint);
    if (hintStock !== null) return hintStock;

    return 0;
  }, [product, selectedVariant]);

  const isSoldOut = currentStock <= 0;

  const urgencyText = useMemo(() => {
    if (isSoldOut) return "Agotado";
    if (currentStock > 0 && currentStock <= 2) return "Quedan muy pocas";
    if (currentStock > 0 && currentStock <= 8) return "Stock limitado";
    return "Disponible";
  }, [currentStock, isSoldOut]);

  const deliveryEstimate = useMemo(() => getDeliveryEstimate(), []);

  const trustHighlights = [
    {
      key: "auth",
      title: "Autenticidad protegida",
      description:
        "Te devolvemos cuatro veces el precio si es falso.\nSi un cliente recibe un producto que no es auténtico, JUSP pagará 4 veces el valor real del producto como compensación.",
      tone: "gold",
    },
    {
      key: "refund",
      title: "Compra protegida",
      description:
        "Políticas de devolución.\nReembolso instantáneo.\n ✔ Producto original verificado.\n ✔ Pago seguro.\n ✔ Envío asegurado",
      tone: "mint",
    },
    {
      key: "support",
      title: "Soporte real",
      description:
        "Te respondemos antes, durante y después.\nAcompañamiento real en todo el proceso de compra.",
      tone: "lavender",
    },
  ] as const;

  const [activeTrustKey, setActiveTrustKey] = useState<"auth" | "refund" | "support" | null>(null);

  const activeTrust = useMemo(
    () => trustHighlights.find((item) => item.key === activeTrustKey) ?? null,
    [activeTrustKey, trustHighlights]
  );

  const selectionMissing = useMemo(() => {
    if (!hasRealVariants) return false;

    const hasSizeVariants = variants.some((v) => String(v.size ?? "").trim());
    const hasColorVariants = variants.some((v) => String(v.color ?? "").trim());

    const okSize = !hasSizeVariants || !!(size && size.trim());
    const okColor = !hasColorVariants || !!(selectedColor && selectedColor.trim());

    return !(okSize && okColor);
  }, [hasRealVariants, variants, size, selectedColor]);

  const selectionHint = useMemo(() => {
    if (!hasRealVariants) return null;
    if (!attemptedBuy) return "Selecciona talla y color para ver el precio exacto.";
    if (selectionMissing) return "Falta seleccionar talla o color para continuar.";
    return null;
  }, [hasRealVariants, attemptedBuy, selectionMissing]);

  const visibleColorLabel = useMemo(() => {
    if (selectedColor) return selectedColor;
    if (selectedVariant?.color) return String(selectedVariant.color).trim();
    if (colors.length === 1) return colors[0];
    return null;
  }, [selectedColor, selectedVariant, colors]);

  const qtyAlreadyInCart = useMemo(() => {
    const cart = Array.isArray(state?.cart) ? state.cart : [];
    const selectedId = normalizeCompareValue(product?.id);
    const selectedColorValue = normalizeCompareValue(visibleColorLabel);
    const selectedSizeValue = normalizeCompareValue(size);

    return cart.reduce((acc, item) => {
      const sameId = normalizeCompareValue(item?.id) === selectedId;
      const sameColor = normalizeCompareValue(item?.color) === selectedColorValue;
      const sameSize = normalizeCompareValue(item?.size) === selectedSizeValue;

      if (!sameId || !sameColor || !sameSize) return acc;

      const itemQty =
        typeof item?.qty === "number" && Number.isFinite(item.qty) ? Math.max(0, item.qty) : 0;

      return acc + itemQty;
    }, 0);
  }, [state?.cart, product?.id, visibleColorLabel, size]);

  const maxQtyAllowed = useMemo(() => {
    if (selectionMissing) return 0;
    return Math.max(0, currentStock - qtyAlreadyInCart);
  }, [selectionMissing, currentStock, qtyAlreadyInCart]);

  const stockMessage = useMemo(() => {
    if (selectionMissing) return null;
    if (isSoldOut) return "Agotado";
    if (maxQtyAllowed <= 0) return "Ya tienes el máximo disponible en el carrito";
    if (maxQtyAllowed === 1) return "¿Tienes dudas? Escríbenos y te respondemos en minutos";
    return `Disponibles: ${maxQtyAllowed}`;
  }, [selectionMissing, isSoldOut, maxQtyAllowed]);

  useEffect(() => {
    if (selectionMissing) {
      setQty(1);
      return;
    }

    if (maxQtyAllowed <= 0) {
      setQty(1);
      return;
    }

    setQty((prev) => {
      const next = Math.max(1, Math.min(prev, maxQtyAllowed));
      return next;
    });
  }, [maxQtyAllowed, selectionMissing]);

  const favoriteAliases = useMemo(
    () =>
      uniqueStringsCaseInsensitive(
        [product?.id, product?.slug, product?.product_code, slug]
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
      ),
    [product, slug]
  );

  const isFavorite = favoriteAliases.some((id) => favoriteIds.includes(id));
  const localFavoriteCount = favoriteAliases.some((id) => favoriteIds.includes(id)) ? 1 : 0;
  const favoriteCount = product
    ? Math.max(localFavoriteCount, getFavCount(product.id), Number(product.favoritesCount || 0))
    : localFavoriteCount;

  const effectiveTasteProfile = useMemo<TasteProfile>(() => {
    const profile = sessionUser?.profile ?? null;

    return {
      segment: normalizeGenderScope(profile?.segment) || onboardingTaste.segment,
      interests: uniqueStringsCaseInsensitive([
        ...normalizeSignalList(profile?.interests),
        ...onboardingTaste.interests,
      ]).map((item) => item.toLowerCase()),
      brands: uniqueStringsCaseInsensitive([
        ...normalizeSignalList(profile?.brands),
        ...onboardingTaste.brands,
      ]).map((item) => item.toLowerCase()),
    };
  }, [sessionUser, onboardingTaste]);

  const favoriteProducts = useMemo(() => {
    if (!catalogProducts.length || !favoriteIds.length) return [];

    return catalogProducts.filter((candidate) =>
      productAliases(candidate).some((alias) => favoriteIds.includes(alias))
    );
  }, [catalogProducts, favoriteIds]);

  const recommendedProducts = useMemo<RecommendedProduct[]>(() => {
    if (!product || !catalogProducts.length) return [];

    const blockedAliases = new Set(productAliases(product));
    const scored = catalogProducts
      .filter((candidate) => {
        const aliases = productAliases(candidate);
        if (!aliases.length) return false;
        return !aliases.some((alias) => blockedAliases.has(alias));
      })
      .map((candidate) => scoreRecommendation(candidate, product, tasteHistory, favoriteProducts, effectiveTasteProfile))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return scored;
  }, [catalogProducts, effectiveTasteProfile, favoriteProducts, product, tasteHistory]);

  async function onToggleFavorite() {
    if (!product) return;

    await toggleFav(product.id, {
      ...(product as any),
      price: displayPrice,
    } as Product);

    const aliases = favoriteAliases.length
      ? favoriteAliases
      : uniqueStringsCaseInsensitive([product.id, product.slug, product.product_code, slug].filter(Boolean) as string[]);

    const nextIds = isFavorite
      ? favoriteIds.filter((id) => !aliases.includes(id))
      : uniqueStringsCaseInsensitive([...favoriteIds, ...aliases]);

    setFavoriteIds(nextIds);
    persistFavoriteIdsCompat(nextIds);

    const nextIsFavorite = !isFavorite;
    setToast(nextIsFavorite ? "Añadido a favoritos" : "Eliminado de favoritos");
    window.setTimeout(() => setToast(null), 1600);
  }

  function onBuyReal(mode: "add" | "now") {
    setAttemptedBuy(true);

    if (selectionMissing || !product) {
      setToast("Selecciona talla y color para continuar");
      window.setTimeout(() => setToast(null), 1600);
      return;
    }

    if (isSoldOut) {
      setToast("Producto agotado");
      window.setTimeout(() => setToast(null), 1600);
      return;
    }

    if (maxQtyAllowed <= 0) {
      setToast("Ya no hay más stock disponible para esta selección");
      window.setTimeout(() => setToast(null), 1600);
      return;
    }

    const finalQty = Math.max(1, Math.min(qty, maxQtyAllowed));
    const cloned: any = { ...product, price: displayPrice };
    addToCart(cloned, { color: visibleColorLabel, size, qty: finalQty });

    setToast(finalQty === 1 ? "Añadido al carrito" : `${finalQty} unidades añadidas al carrito`);
    openCart();
    window.setTimeout(() => setToast(null), 1600);

    if (mode === "now") {
      window.setTimeout(() => router.push("/checkout"), 350);
    }
  }

  if (loadingProduct) {
    return (
      <main style={{ padding: 24 }}>
        <Link href="/products">← Volver</Link>
        <h1 style={{ marginTop: 12 }}>Cargando producto...</h1>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ padding: 24 }}>
        <Link href="/products">← Volver</Link>
        <h1 style={{ marginTop: 12 }}>Producto no encontrado</h1>
      </main>
    );
  }

  return (
    <main className="root">
      <div className="wrap">
        <div className="top">
          <Link className="back" href="/products">
            ← Volver
          </Link>

          <div className="topR">
            <Link className="link" href="/size-guide">
              Guía de tallas
            </Link>
            <button className="go" type="button" onClick={() => router.push("/checkout")}>
              Ir al checkout
            </button>
          </div>
        </div>

        <div className="grid">
          <section className="media">
            <div className="mediaCard">
              <div className="gallery">
                {mediaItems.length > 1 ? (
                  <div
                    ref={thumbColRef}
                    className="thumbCol"
                    aria-label="Miniaturas"
                    onMouseDown={onThumbColumnMouseDown}
                    onMouseMove={onThumbColumnMouseMove}
                    onMouseUp={stopThumbColumnDrag}
                    onMouseLeave={() => {
                      stopThumbColumnDrag();
                      stopThumbColumnAutoScroll();
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {mediaItems.map((item, i) => (
                      <button
                        key={`${item.src}-${i}`}
                        type="button"
                        className={`thBtn ${activeImg === i ? "on" : ""}`}
                        onClick={() => setActiveImg(i)}
                        onMouseEnter={() => {
                          if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                            setActiveImg(i);
                          }
                        }}
                        aria-label={item.type === "video" ? `Ver video ${i + 1}` : `Ver imagen ${i + 1}`}
                      >
                        {item.type === "video" ? (
                          <div className="thVideo" aria-hidden="true">
                            <video className="th" src={item.src} muted playsInline preload="metadata" />
                            <span className="thPlay" aria-hidden="true">▶</span>
                          </div>
                        ) : (
                          <img className="th" src={item.src} alt="" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div
                  className={`imgBox ${currentMedia?.type === "image" ? "zoomReady" : ""}`}
                  onTouchStart={onImageTouchStart}
                  onTouchMove={onImageTouchMove}
                  onTouchEnd={onImageTouchEnd}
                  onMouseMove={onImageMouseMove}
                  onMouseEnter={onImageMouseMove}
                  onMouseLeave={onImageMouseLeave}
                >
                  <button
                    type="button"
                    className={`favBtn ${isFavorite ? "on" : ""}`}
                    onClick={onToggleFavorite}
                    aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                    aria-pressed={isFavorite}
                    title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="favIcon">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="favCount">{favoriteCount}</span>
                  </button>

                  {currentMedia ? (
                    currentMedia.type === "video" ? (
                      <video
                        key={currentMedia.src}
                        className="productVideo"
                        src={currentMedia.src}
                        autoPlay
                        muted
                        loop
                        controls
                        playsInline
                        preload="auto"
                      />
                    ) : (
                      <img
                        ref={activeImageRef}
                        src={currentImage}
                        alt={title}
                        loading="eager"
                        decoding="sync"
                        fetchPriority="high"
                        style={{
                          transform: `translate3d(${mobileImageZoom.translateX}px, ${mobileImageZoom.translateY}px, 0) scale(${mobileImageZoom.scale})`,
                          transformOrigin: "center center",
                          transition: mobileImageZoom.pinching ? "none" : "transform 180ms ease",
                        }}
                      />
                    )
                  ) : (
                    <div className="ph" />
                  )}

                  {currentMedia?.type === "image" ? (
                    <>
                      <div
                        className={`imgZoomFocus ${imageZoom.active ? "on" : ""}`}
                        aria-hidden="true"
                        style={{
                          left: `${imageZoom.left}px`,
                          top: `${imageZoom.top}px`,
                          width: `${imageZoom.focusSize}px`,
                          height: `${imageZoom.focusSize}px`,
                        }}
                      />
                    </>
                  ) : null}

                  <div className="imgBadge">
                    <span className="b1">JUSP</span>
                    <span className="bDot" aria-hidden="true" />
                    <span className="b2">{urgencyText}</span>
                  </div>

                  <div className="imgGlow" aria-hidden="true" />

                  {mediaItems.length > 1 ? (
                    <div className="swipeHint" aria-hidden="true"></div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="info">
            <div ref={infoCardRef} className="card">
              {currentMedia?.type === "image" ? (
                <div className={`cardZoomViewer ${imageZoom.active ? "on" : ""}`} aria-hidden="true">
                  <img
                    src={currentImage}
                    alt=""
                    className="cardZoomViewerImg"
                    style={{
                      left: `${imageZoom.paneImageLeft}px`,
                      top: `${imageZoom.paneImageTop}px`,
                      width: `${imageZoom.paneImageWidth}px`,
                      height: `${imageZoom.paneImageHeight}px`,
                    }}
                  />
                </div>
              ) : null}

              <div className="head">
                <div className="title">{title}</div>
              </div>

              <div className="priceBox">
                <div className="priceNow">
                  <span className="cur">$</span>
                  <span className="num">{moneyCOP(displayPrice)}</span>
                </div>

                <div className="priceMeta">
                  {hasRealVariants && fromPrice > 0 && toPrice > 0 && fromPrice !== toPrice ? (
                    <div className="range">
                      Rango: <b>${moneyCOP(fromPrice)}</b> – <b>${moneyCOP(toPrice)}</b> (según talla)
                    </div>
                  ) : null}

                  {discountPct > 0 ? (
                    <div className="coupon">
                      Descuento <span className="pillGold">-{discountPct}%</span>
                    </div>
                  ) : null}

                  {priceBefore ? (
                    <div className="before">
                      Antes <span className="strike">${moneyCOP(priceBefore)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectionHint ? (
                <div className={`hint ${attemptedBuy && selectionMissing ? "err" : ""}`}>{selectionHint}</div>
              ) : null}

              {stockMessage ? (
                <div className={`stockHint ${isSoldOut || maxQtyAllowed <= 0 ? "soldOut" : ""}`}>
                  {stockMessage}
                </div>
              ) : null}

              <section
                className="trustSection inCard"
                aria-label="Confianza del producto"
                onMouseLeave={() => setActiveTrustKey(null)}
              >
                <div className="shipTrustRow">
                  <div className="deliveryPanel">
                    <div className="deliveryTop">
                      <span className="deliveryEmoji" aria-hidden="true">
                        🚚
                      </span>
                      <div className="deliveryDate">{deliveryEstimate}</div>
                    </div>
                  </div>

                  <div className="trustRail" aria-label="Pilares de confianza">
                    {trustHighlights.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`trustLogoBtn ${item.tone} ${activeTrustKey === item.key ? "active" : ""}`}
                        onMouseEnter={() => setActiveTrustKey(item.key)}
                        aria-label={item.title}
                        title={item.title}
                      >
                        <span className="trustIcon" aria-hidden="true">
                          {item.key === "auth" ? (
                            <svg viewBox="0 0 24 24" className="trustSvg">
                              <path
                                d="M12 2.75 5 5.5v5.13c0 4.2 2.7 8.11 7 9.62 4.3-1.5 7-5.42 7-9.62V5.5l-7-2.75Zm0 5.25a2 2 0 0 1 2 2v1h.5A1.5 1.5 0 0 1 16 12.5v3A1.5 1.5 0 0 1 14.5 17h-5A1.5 1.5 0 0 1 8 15.5v-3A1.5 1.5 0 0 1 9.5 11H10v-1a2 2 0 0 1 2-2Zm0 1.5a.5.5 0 0 0-.5.5v1h1v-1a.5.5 0 0 0-.5-.5Z"
                                fill="currentColor"
                              />
                            </svg>
                          ) : item.key === "refund" ? (
                            <svg viewBox="0 0 24 24" className="trustSvg">
                              <path
                                d="M12 3a8.99 8.99 0 0 1 7.8 4.5H22l-3.5 3.5L15 7.5h2.26A7 7 0 1 0 19 12h2a9 9 0 1 1-9-9Zm-1.5 5h3a1.5 1.5 0 0 1 0 3h-3a.5.5 0 0 0 0 1h4v2h-2v1h-2v-1H8v-2h3.5a.5.5 0 0 0 0-1h-3a1.5 1.5 0 0 1 0-3h3V7h2v1Z"
                                fill="currentColor"
                              />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="trustSvg">
                              <path
                                d="M12 4c4.97 0 9 3.36 9 7.5S16.97 19 12 19c-1.17 0-2.3-.19-3.34-.54L4 20l1.28-3.18C3.84 15.48 3 13.56 3 11.5 3 7.36 7.03 4 12 4Zm-3.5 6a1.5 1.5 0 1 0 0 3h7a1.5 1.5 0 1 0 0-3h-7Z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {activeTrust ? (
                  <article className={`trustDetail ${activeTrust.tone}`} aria-live="polite">
                    <div className="trustDetailTop">
                      <div className="trustCardTitle">{activeTrust.title}</div>
                    </div>
                    <p className="trustCardText">{activeTrust.description}</p>
                  </article>
                ) : null}
              </section>

              {colors.length ? (
                <div className="blk">
                  <div className="lbl">Color</div>

                  <div className="colorHead">
                    <span className="colorText">
                      Seleccionado: <b>{visibleColorLabel || "Sin definir"}</b>
                    </span>
                  </div>

                  <div className="colorGrid">
                    {colors.map((c) => {
                      const isOn = String(selectedColor || "").toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          className={`colorBtn ${isOn ? "on" : ""}`}
                          type="button"
                          onClick={() => {
                            setSelectedColor(c);
                            setAttemptedBuy(false);
                          }}
                        >
                          <span className="colorName">{c}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="blk">
                <div className="lbl">Talla</div>
                <div className="gridOps">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      className={`op ${size === s ? "on" : ""} ${
                        attemptedBuy && selectionMissing && !size ? "shake" : ""
                      }`}
                      type="button"
                      onClick={() => {
                        setSize(s);
                        setAttemptedBuy(false);
                      }}
                    >
                      <span className="opT">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="blk">
                <div className="lbl">Cantidad</div>
                <div className="qty">
                  <button
                    type="button"
                    className="qbtn"
                    onClick={() => setQty((v) => Math.max(1, v - 1))}
                    disabled={isSoldOut || maxQtyAllowed <= 0}
                  >
                    −
                  </button>
                  <div className="qval">{qty}</div>
                  <button
                    type="button"
                    className="qbtn"
                    onClick={() => setQty((v) => Math.min(maxQtyAllowed || 1, v + 1))}
                    disabled={isSoldOut || maxQtyAllowed <= 1 || qty >= maxQtyAllowed}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="ctaRow">
                <button
                  className="ctaAlt"
                  type="button"
                  onClick={() => onBuyReal("add")}
                  disabled={selectionMissing || isSoldOut || maxQtyAllowed <= 0}
                >
                  {isSoldOut ? "Agotado" : "Añadir al carrito"}
                </button>
                <button
                  className="ctaBlack"
                  type="button"
                  onClick={() => onBuyReal("now")}
                  disabled={selectionMissing || isSoldOut || maxQtyAllowed <= 0}
                >
                  {isSoldOut ? "No disponible" : "Comprar ahora"}
                </button>
              </div>

            </div>
          </section>
        </div>

        {productParameters.length ? (
          <section
            aria-labelledby="product-parameters-title"
            style={{
              marginTop: 28,
              borderRadius: 28,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(180deg, #ffffff 0%, #faf7f1 100%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px 24px 12px",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
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
                    fontWeight: 1000,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    opacity: 0.6,
                  }}
                >
                  Informacion del producto
                </div>
                <h2
                  id="product-parameters-title"
                  style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1.05, fontWeight: 1000 }}
                >
                  Parametro
                </h2>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.7 }}>
                Datos cargados desde Excel para este producto
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 0,
              }}
            >
              {productParameters.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  style={{
                    padding: "18px 24px",
                    borderTop: index < 2 ? "none" : "1px solid rgba(0,0,0,0.06)",
                    borderRight: "1px solid rgba(0,0,0,0.06)",
                    background: index % 2 === 0 ? "rgba(255,255,255,0.72)" : "rgba(250,247,241,0.9)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      opacity: 0.56,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.55, fontWeight: 700 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {product ? (
          <ProductReviews
            productId={product.id}
            productSlug={product.slug || slug}
            productTitle={title}
          />
        ) : null}

        {recommendedProducts.length ? (
          <section className="recoSection" aria-labelledby="storeRecoTitle">
            <div className="recoHead">
              <h2 id="storeRecoTitle" className="recoTitle">
                Lo recomendado por la tienda
              </h2>
            </div>

            <div className="recoGrid">
              {recommendedProducts.map(({ product: reco }, index) => {
                const recoKey = productAliases(reco)[0] || `${reco.id}-${index}`;
                const recoHrefSlug = String(reco.slug || reco.id || "").trim();
                const recoHref = recoHrefSlug ? `/product/${encodeURIComponent(recoHrefSlug)}` : "/products";
                const recoImage = buildImageCandidates(reco, reco.slug || reco.id)[0] || "";
                const recoPrice = minVariantPrice(reco);
                const recoDiscount = Math.max(0, Number(reco.discountPercent || 0));
                const recoMeta = uniqueStringsCaseInsensitive(
                  [
                    reco.brand,
                    reco.category,
                    reco.gender === "women"
                      ? "Mujer"
                      : reco.gender === "men"
                      ? "Hombre"
                      : reco.gender === "kids"
                      ? "Niños"
                      : "",
                  ].filter(Boolean) as string[]
                ).join(" · ");
                const recoLiked = productAliases(reco).some((alias) => favoriteIds.includes(alias));

                return (
                  <Link key={recoKey} href={recoHref} className="recoCard">
                    <div className="recoMedia">
                      {recoImage ? (
                        <img src={recoImage} alt={reco.title || reco.name || "Producto recomendado"} />
                      ) : (
                        <div className="recoPlaceholder">JUSP</div>
                      )}

                      <div className="recoBadgeRow">
                        <span className="recoBadge">{recoLiked ? "Te gusta" : "Recomendado"}</span>
                        {reco.bestSeller ? <span className="recoBadge dark">Top tienda</span> : null}
                      </div>
                    </div>

                    <div className="recoBody">
                      <h3 className="recoCardTitle">{reco.title || reco.name || "Producto"}</h3>
                      {recoMeta ? <div className="recoMeta">{recoMeta}</div> : null}

                      <div className="recoFoot">
                        <div className="recoPrice">${moneyCOP(recoPrice)}</div>
                        {recoDiscount > 0 ? (
                          <div className="recoFootMeta">
                            <span className="recoMiniPill">-{recoDiscount}%</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <div className="mobileBar" role="presentation">
        <div className="mLeft">
          <div className="mTop">
            <div className="mLabel">Total</div>
            <div className="mVal">${moneyCOP(displayPrice * Math.max(1, qty))}</div>
          </div>
          {hasRealVariants ? (
            <div className={`mHint ${attemptedBuy && selectionMissing ? "mErr" : ""}`}>
              {selectionMissing
                ? "Selecciona talla o color"
                : isSoldOut
                  ? "Agotado"
                  : maxQtyAllowed <= 0
                    ? "Sin más stock"
                    : "Listo para comprar"}
            </div>
          ) : (
            <div className="mHint">{isSoldOut ? "Agotado" : "Listo para comprar"}</div>
          )}
        </div>

        <div className="mBtns">
          <button
            className="mBtnAlt"
            type="button"
            onClick={() => onBuyReal("add")}
            disabled={selectionMissing || isSoldOut || maxQtyAllowed <= 0}
          >
            {isSoldOut ? "Agotado" : "Añadir"}
          </button>
          <button
            className="mBtnBlack"
            type="button"
            onClick={() => onBuyReal("now")}
            disabled={selectionMissing || isSoldOut || maxQtyAllowed <= 0}
          >
            {isSoldOut ? "No disponible" : "Ahora"}
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <style jsx>{`
        :root {
          --jusp-gold: #d4af37;
          --jusp-gold-2: #f5c400;
          --jusp-gold-soft: rgba(212, 175, 55, 0.14);
          --jusp-gold-mid: rgba(212, 175, 55, 0.42);
          --jusp-gold-strong: rgba(212, 175, 55, 0.95);

          --ink: rgba(0, 0, 0, 0.9);
          --ink2: rgba(0, 0, 0, 0.72);
          --ink3: rgba(0, 0, 0, 0.56);

          --b: rgba(0, 0, 0, 0.1);
          --b2: rgba(0, 0, 0, 0.08);

          --shadow: 0 18px 60px rgba(0, 0, 0, 0.08);
          --shadow2: 0 22px 80px rgba(0, 0, 0, 0.12);
        }

        .root {
          padding-top: 8px;
          padding-bottom: 124px;
          padding-left: 16px;
          padding-right: 16px;
          min-height: 100vh;
          background: radial-gradient(1200px 500px at 20% 0%, rgba(212, 175, 55, 0.08), transparent 60%),
            radial-gradient(900px 500px at 90% 10%, rgba(0, 0, 0, 0.04), transparent 55%), #ffffff;
        }

        .wrap {
          max-width: 1160px;
          margin: 0 auto;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .back {
          text-decoration: none;
          font-weight: 950;
          color: var(--ink2);
          letter-spacing: -0.01em;
        }
        .back:hover {
          color: var(--ink);
        }

        .topR {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .link {
          text-decoration: none;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.68);
          border: 1px solid var(--b);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 999px;
          padding: 12px 14px;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .link:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
          color: var(--ink);
        }

        .go {
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 999px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          color: #111;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .go:hover {
          background: #fff;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        .go:active {
          transform: translateY(0);
        }

        .grid {
          display: grid;
          grid-template-columns: 1.18fr 0.82fr;
          gap: 18px;
          align-items: start;
        }

        .mediaCard {
          border-radius: 22px;
          border: 1px solid var(--b2);
          background: rgba(255, 255, 255, 0.86);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .gallery {
          display: grid;
          grid-template-columns: 98px 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px;
        }

        .thumbCol {
          display: grid;
          gap: 10px;
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 16px);
          max-height: calc((86px * 7) + (10px * 6) + 12px);
          overflow-y: auto;
          padding-right: 4px;
          padding-bottom: 18px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 88%, rgba(0,0,0,0.18) 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 88%, rgba(0,0,0,0.18) 100%);
          scroll-behavior: smooth;
          cursor: ns-resize;
          overscroll-behavior: contain;
        }
        .thumbCol::-webkit-scrollbar {
          display: none;
        }
        .thumbCol:active {
          cursor: grabbing;
        }

        .thBtn {
          position: relative;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 248, 248, 0.96));
          border-radius: 18px;
          padding: 6px;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.06);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            filter 180ms ease;
        }
        .thBtn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0));
          pointer-events: none;
          opacity: 0.9;
        }
        .thBtn:hover {
          transform: translateY(-2px) scale(1.015);
          border-color: rgba(212, 175, 55, 0.18);
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.1);
          filter: saturate(1.02);
        }
        .thBtn.on {
          border-color: var(--jusp-gold-mid);
          background: linear-gradient(180deg, rgba(255, 251, 240, 1), rgba(255, 255, 255, 0.98));
          box-shadow:
            0 0 0 3px var(--jusp-gold-soft),
            0 20px 40px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .th {
          position: relative;
          z-index: 1;
          width: 86px;
          height: 86px;
          border-radius: 14px;
          object-fit: contain;
          display: block;
          background: radial-gradient(circle at top, rgba(212, 175, 55, 0.08), rgba(0, 0, 0, 0.015));
          transition: transform 180ms ease, filter 180ms ease;
        }
        .thBtn:hover .th {
          transform: scale(1.035);
          filter: contrast(1.02);
        }
        .thBtn.on .th {
          transform: scale(1.04);
        }
        .thVideo {
          position: relative;
        }
        .thPlay {
          position: absolute;
          right: 8px;
          bottom: 8px;
          z-index: 2;
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.88);
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          box-shadow: 0 8px 18px rgba(0,0,0,0.2);
        }

        .imgBox {
          position: relative;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: radial-gradient(500px 240px at 40% 20%, rgba(212, 175, 55, 0.12), transparent 60%), #fafafa;
          overflow: hidden;
          aspect-ratio: 3 / 4;
          min-height: 520px;
          display: grid;
          place-items: center;
          box-shadow: var(--shadow2);
          touch-action: pan-y;
        }

        .imgBox img,
        .imgBox video {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          padding: 10px;
          display: block;
          user-select: none;
          -webkit-user-select: none;
          transform: translateZ(0);
          backface-visibility: hidden;
          image-rendering: auto;
          -webkit-backface-visibility: hidden;
        }
        .imgBox.zoomReady img {
          cursor: zoom-in;
        }
        .productVideo {
          background: #000;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
          border-radius: 16px;
        }
        .imgZoomFocus {
          position: absolute;
          z-index: 3;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.96);
          background: rgba(255, 255, 255, 0.22);
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.16),
            inset 0 0 0 1px rgba(0, 0, 0, 0.08);
          transform: translate(-50%, -50%) scale(0.92);
          opacity: 0;
          transition: opacity 140ms ease, transform 140ms ease;
          pointer-events: none;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }
        .imgZoomFocus.on {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        .cardZoomViewer {
          position: absolute;
          inset: 14px;
          z-index: 7;
          border-radius: 22px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.16);
          opacity: 0;
          transform: translateY(8px) scale(0.985);
          transition: opacity 140ms ease, transform 140ms ease;
          pointer-events: none;
          background:
            radial-gradient(520px 220px at 20% 10%, rgba(255, 255, 255, 0.72), transparent 55%),
            rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .cardZoomViewerImg {
          position: absolute;
          display: block;
          max-width: none;
          user-select: none;
          -webkit-user-select: none;
          pointer-events: none;
        }
        .cardZoomViewer::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.9);
        }
        .cardZoomViewer.on {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .favBtn {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 4;
          min-height: 54px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease;
        }
        .favBtn:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 22px 54px rgba(0, 0, 0, 0.16);
          background: rgba(255, 255, 255, 0.98);
        }
        .favBtn:active {
          transform: scale(0.98);
        }
        .favBtn.on {
          border-color: rgba(255, 70, 100, 0.28);
          background: rgba(255, 240, 244, 0.96);
          box-shadow: 0 0 0 4px rgba(255, 70, 100, 0.08), 0 22px 54px rgba(0, 0, 0, 0.14);
        }
        .favIcon {
          width: 24px;
          height: 24px;
          display: block;
          fill: transparent;
          stroke: rgba(0, 0, 0, 0.82);
          stroke-width: 2;
          transition: fill 140ms ease, stroke 140ms ease, transform 140ms ease;
          flex: 0 0 auto;
        }
        .favBtn.on .favIcon {
          fill: #ff4d6d;
          stroke: #ff4d6d;
          transform: scale(1.06);
        }
        .favCount {
          min-width: 10px;
          font-size: 13px;
          font-weight: 950;
          line-height: 1;
          color: rgba(0, 0, 0, 0.86);
        }

        .imgGlow {
          position: absolute;
          inset: -40px;
          background: radial-gradient(420px 240px at 20% 10%, rgba(245, 196, 0, 0.14), transparent 60%);
          pointer-events: none;
          mix-blend-mode: multiply;
        }
        .swipeHint {
          display: none !important;
          position: absolute;
          left: 50%;
          bottom: 16px;
          transform: translateX(-50%);
          display: none;
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          font-weight: 900;
          font-size: 11px;
          color: rgba(0, 0, 0, 0.62);
          pointer-events: none;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }

        .ph {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.16);
        }

        .imgBadge {
          position: absolute;
          left: 12px;
          bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .b1 {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
          font-size: 12px;
          letter-spacing: 0.02em;
        }
        .bDot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
        }
        .b2 {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.62);
          font-size: 12px;
        }

        .card {
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: var(--shadow2);
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 16px);
          overflow: hidden;
        }
        .card::before {
          content: "";
          position: absolute;
          inset: -2px;
          background: radial-gradient(520px 260px at 30% 0%, rgba(212, 175, 55, 0.14), transparent 60%);
          pointer-events: none;
        }

        .head {
          position: relative;
          display: grid;
          gap: 10px;
        }

        .title {
          font-weight: 950;
          color: #111;
          font-size: 24px;
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .sub {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chip {
          font-weight: 900;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.64);
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
          padding: 10px 12px;
          border-radius: 999px;
        }

        .priceBox {
          position: relative;
          margin-top: 12px;
          display: grid;
          gap: 12px;
          padding: 16px 16px 14px;
          border: 1px solid rgba(212, 175, 55, 0.18);
          background:
            radial-gradient(240px 140px at 0% 0%, rgba(212, 175, 55, 0.14), transparent 72%),
            linear-gradient(180deg, rgba(255, 251, 240, 0.96), rgba(255, 255, 255, 0.98));
          border-radius: 22px;
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.07);
          overflow: hidden;
        }

        .priceNow {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .cur {
          font-weight: 950;
          color: var(--jusp-gold-strong);
          font-size: 22px;
          line-height: 1;
        }
        .num {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.92);
          font-size: clamp(38px, 5vw, 48px);
          line-height: 0.94;
          letter-spacing: -0.045em;
          text-shadow: 0 10px 22px rgba(212, 175, 55, 0.1);
        }

        .priceMeta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .range {
          flex: 1 1 100%;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.56);
          font-size: 12px;
          line-height: 1.45;
        }
        .coupon {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.18);
          background: linear-gradient(180deg, rgba(255, 249, 227, 0.98), rgba(255, 255, 255, 0.96));
        }
        .pillGold {
          display: inline-block;
          margin-left: 0;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.9);
          background: linear-gradient(90deg, var(--jusp-gold), var(--jusp-gold-2));
          border-radius: 999px;
          padding: 6px 10px;
          box-shadow: 0 14px 34px rgba(212, 175, 55, 0.18);
        }
        .before {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.58);
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.84);
        }
        .strike {
          text-decoration: line-through;
          color: rgba(0, 0, 0, 0.45);
          margin-left: 0;
          font-weight: 900;
        }

        .hint {
          position: relative;
          margin-top: 10px;
          border-radius: 16px;
          border: 1px dashed rgba(0, 0, 0, 0.14);
          background: rgba(0, 0, 0, 0.02);
          padding: 11px 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
          font-size: 12px;
        }
        .hint.err {
          border-color: rgba(255, 40, 0, 0.25);
          background: rgba(255, 40, 0, 0.04);
          color: rgba(255, 40, 0, 0.9);
        }

        .stockHint {
          position: relative;
          margin-top: 10px;
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.24);
          background: rgba(212, 175, 55, 0.08);
          padding: 11px 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.8);
          font-size: 12px;
        }
        .stockHint.soldOut {
          border-color: rgba(255, 40, 0, 0.22);
          background: rgba(255, 40, 0, 0.05);
          color: rgba(170, 20, 0, 0.95);
        }

        .deliveryPanel {
          position: relative;
          margin-top: 12px;
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(212, 175, 55, 0.2);
          background:
            radial-gradient(260px 140px at 0% 0%, rgba(212, 175, 55, 0.12), transparent 70%),
            linear-gradient(180deg, rgba(255, 250, 235, 0.94), rgba(255, 255, 255, 0.96));
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
        }
        .deliveryTop {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .deliveryEmoji {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background: linear-gradient(135deg, rgba(245, 196, 0, 0.3), rgba(212, 175, 55, 0.14));
          box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.18);
          flex: 0 0 auto;
        }
        .deliveryDate {
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.02em;
          color: rgba(0, 0, 0, 0.9);
        }

        .blk {
          position: relative;
          margin-top: 14px;
        }
        .lbl {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .colorHead {
          margin-bottom: 10px;
        }
        .colorText {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.66);
          font-size: 13px;
        }
        .colorText b {
          color: #111;
          font-weight: 950;
        }

        .colorGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .colorBtn {
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 16px;
          padding: 12px 12px;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;
        }
        .colorBtn:hover {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
        }
        .colorBtn.on {
          border-color: var(--jusp-gold-mid);
          box-shadow: 0 0 0 3px var(--jusp-gold-soft), 0 18px 44px rgba(0, 0, 0, 0.1);
        }
        .colorName {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
          font-size: 14px;
          letter-spacing: -0.01em;
        }

        .gridOps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .op {
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.96);
          border-radius: 16px;
          padding: 12px 12px;
          cursor: pointer;
          display: grid;
          gap: 6px;
          text-align: left;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;
        }
        .op:hover {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
        }
        .op.on {
          border-color: var(--jusp-gold-mid);
          box-shadow: 0 0 0 3px var(--jusp-gold-soft), 0 18px 44px rgba(0, 0, 0, 0.1);
        }
        .opT {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
          font-size: 14px;
          letter-spacing: -0.01em;
        }

        .shake {
          animation: shake 220ms ease-in-out 1;
        }
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          50% {
            transform: translateX(2px);
          }
          75% {
            transform: translateX(-2px);
          }
          100% {
            transform: translateX(0);
          }
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.86);
          width: fit-content;
        }
        .qbtn {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          cursor: pointer;
          font-weight: 950;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.86);
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, opacity 120ms ease;
        }
        .qbtn:hover {
          background: rgba(0, 0, 0, 0.02);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        .qbtn:active {
          transform: translateY(0);
        }
        .qbtn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .qval {
          min-width: 34px;
          text-align: center;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.86);
        }

        .ctaRow {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: center;
        }

        .ctaAlt {
          width: 100%;
          border-radius: 16px;
          padding: 14px 14px;
          font-weight: 950;
          border: 0;
          cursor: pointer;
          background: linear-gradient(90deg, var(--jusp-gold), var(--jusp-gold-2));
          color: rgba(0, 0, 0, 0.92);
          box-shadow: 0 20px 54px rgba(212, 175, 55, 0.22);
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease, opacity 120ms ease;
        }
        .ctaAlt:hover {
          filter: saturate(1.06);
          transform: translateY(-1px);
          box-shadow: 0 26px 70px rgba(212, 175, 55, 0.28);
        }
        .ctaAlt:active {
          transform: translateY(0);
        }
        .ctaAlt:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          filter: none;
        }

        .ctaBlack {
          width: 100%;
          border-radius: 16px;
          padding: 14px 14px;
          font-weight: 950;
          border: 0;
          cursor: pointer;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.84));
          color: rgba(255, 255, 255, 0.96);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease, opacity 120ms ease;
        }
        .ctaBlack:hover {
          transform: translateY(-1px);
          box-shadow: 0 28px 78px rgba(0, 0, 0, 0.28);
          filter: contrast(1.02);
        }
        .ctaBlack:active {
          transform: translateY(0);
        }
        .ctaBlack:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          filter: none;
        }

        .trustSection {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .trustHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .trustEyebrow {
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.58);
        }
        .trustTitle {
          margin: 8px 0 0;
          font-size: 32px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #111;
          font-weight: 1000;
        }
        .trustLead {
          margin: 8px 0 0;
          font-size: 15px;
          line-height: 1.6;
          color: rgba(0, 0, 0, 0.62);
          font-weight: 850;
        }
        .trustSection.inCard {
          margin-top: 14px;
          padding-top: 0;
        }
        .trustSection.inCard .trustTitle {
          font-size: 22px;
        }
        .trustSection.inCard .trustLead {
          font-size: 13px;
        }
        .shipTrustRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
        }
        .shipTrustRow .deliveryPanel {
          margin-top: 0;
        }
        .trustRail {
          margin-top: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: nowrap;
        }
        .trustLogoBtn {
          border: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
          border-radius: 20px;
          transition:
            transform 0.18s ease,
            filter 0.18s ease;
        }
        .trustLogoBtn:hover,
        .trustLogoBtn:focus-visible {
          transform: translateY(-2px);
        }
        .trustLogoBtn:focus-visible {
          outline: 2px solid rgba(0, 0, 0, 0.14);
          outline-offset: 4px;
        }
        .trustLogoBtn .trustIcon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease,
            color 0.18s ease;
        }
        .trustLogoBtn.gold .trustIcon {
          background:
            radial-gradient(120px 90px at 20% 20%, rgba(245, 196, 0, 0.22), transparent 70%),
            rgba(255, 255, 255, 0.96);
        }
        .trustLogoBtn.mint .trustIcon {
          background:
            radial-gradient(120px 90px at 20% 20%, rgba(21, 128, 61, 0.16), transparent 70%),
            rgba(255, 255, 255, 0.96);
        }
        .trustLogoBtn.lavender .trustIcon {
          background:
            radial-gradient(120px 90px at 20% 20%, rgba(130, 120, 255, 0.16), transparent 70%),
            rgba(255, 255, 255, 0.96);
        }
        .trustLogoBtn.active .trustIcon,
        .trustLogoBtn:hover .trustIcon,
        .trustLogoBtn:focus-visible .trustIcon {
          transform: translateY(-1px) scale(1.03);
          box-shadow:
            0 16px 34px rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(0, 0, 0, 0.09);
        }
        .trustIcon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(0, 0, 0, 0.82);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
        }
        .trustSvg {
          width: 22px;
          height: 22px;
          display: block;
        }
        .trustDetail {
          margin-top: 14px;
          border-radius: 22px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.95);
          padding: 18px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
          min-height: 132px;
        }
        .trustDetail.gold {
          background:
            radial-gradient(220px 130px at 0% 0%, rgba(245, 196, 0, 0.12), transparent 70%),
            rgba(255, 255, 255, 0.96);
        }
        .trustDetail.mint {
          background:
            radial-gradient(220px 130px at 0% 0%, rgba(21, 128, 61, 0.1), transparent 70%),
            rgba(255, 255, 255, 0.96);
        }
        .trustDetail.lavender {
          background:
            radial-gradient(220px 130px at 0% 0%, rgba(130, 120, 255, 0.1), transparent 70%),
            rgba(255, 255, 255, 0.96);
        }
        .trustDetailTop {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .trustCardTitle {
          margin-top: 0;
          font-size: 16px;
          font-weight: 950;
          color: #111;
          letter-spacing: -0.02em;
        }
        .trustCardText {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.65;
          color: rgba(0, 0, 0, 0.66);
          font-weight: 850;
          white-space: pre-line;
        }

        .recoSection {
          margin-top: 34px;
          padding: 26px;
          border-radius: 28px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background:
            radial-gradient(620px 220px at 0% 0%, rgba(212, 175, 55, 0.12), transparent 62%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.08);
        }
        .recoHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }
        .recoHeadCopy {
          display: grid;
          gap: 8px;
        }
        .recoEyebrow {
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.48);
        }
        .recoTitle {
          margin: 0;
          font-size: clamp(28px, 3vw, 40px);
          line-height: 0.98;
          letter-spacing: -0.04em;
          font-weight: 1000;
          color: rgba(0, 0, 0, 0.94);
        }
        .recoSub {
          margin: 0;
          max-width: 720px;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 850;
          color: rgba(0, 0, 0, 0.62);
        }
        .recoStat {
          flex: 0 0 auto;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.88);
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.68);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.06);
        }
        .recoGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .recoCard {
          display: grid;
          grid-template-rows: auto 1fr;
          text-decoration: none;
          color: inherit;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 20px 54px rgba(0, 0, 0, 0.08);
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }
        .recoCard:hover {
          transform: translateY(-3px);
          border-color: rgba(212, 175, 55, 0.32);
          box-shadow: 0 28px 66px rgba(0, 0, 0, 0.12);
        }
        .recoMedia {
          position: relative;
          aspect-ratio: 0.92;
          overflow: hidden;
          background:
            radial-gradient(320px 160px at 20% 0%, rgba(212, 175, 55, 0.18), transparent 60%),
            linear-gradient(180deg, rgba(249, 249, 249, 0.98), rgba(240, 240, 240, 0.94));
        }
        .recoMedia img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .recoPlaceholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-size: 28px;
          font-weight: 1000;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.28);
        }
        .recoBadgeRow {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .recoBadge {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          border-radius: 999px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.76);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .recoBadge.dark {
          color: rgba(255, 255, 255, 0.96);
          background: rgba(0, 0, 0, 0.82);
          border-color: rgba(255, 255, 255, 0.16);
        }
        .recoBody {
          display: grid;
          align-content: start;
          gap: 10px;
          padding: 16px 16px 18px;
        }
        .recoReason {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.42);
        }
        .recoCardTitle {
          margin: 0;
          font-size: 20px;
          line-height: 1.15;
          letter-spacing: -0.03em;
          font-weight: 1000;
          color: rgba(0, 0, 0, 0.92);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .recoMeta {
          font-size: 13px;
          font-weight: 850;
          color: rgba(0, 0, 0, 0.52);
        }
        .recoFoot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 4px;
        }
        .recoPrice {
          font-size: 24px;
          line-height: 1;
          font-weight: 1000;
          letter-spacing: -0.04em;
          color: rgba(0, 0, 0, 0.96);
        }
        .recoFootMeta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .recoMiniPill,
        .recoMatch {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          border-radius: 999px;
          padding: 0 10px;
          font-size: 11px;
          font-weight: 950;
        }
        .recoMiniPill {
          color: rgba(0, 0, 0, 0.84);
          background: rgba(212, 175, 55, 0.18);
          border: 1px solid rgba(212, 175, 55, 0.22);
        }
        .recoMatch {
          color: rgba(0, 0, 0, 0.6);
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .toast {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          top: calc(var(--jusp-header-h, 64px) + 14px);
          width: min(520px, calc(100vw - 22px));
          z-index: 2100;
          border-radius: 18px;
          padding: 12px 12px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.16);
          font-weight: 950;
          color: #111;
          text-align: center;
          user-select: none;
          -webkit-user-select: none;
        }

        .mobileBar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2400;
          display: none;
          padding: 10px 12px 12px;
          background: rgba(255, 255, 255, 0.94);
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .mLeft {
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .mTop {
          display: grid;
          gap: 2px;
        }
        .mLabel {
          font-weight: 900;
          color: rgba(0, 0, 0, 0.6);
          font-size: 11px;
        }
        .mVal {
          font-weight: 950;
          color: rgba(0, 0, 0, 0.9);
          font-size: 14px;
        }
        .mHint {
          font-weight: 950;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.62);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mErr {
          color: rgba(255, 40, 0, 0.88);
        }
        .mBtns {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: nowrap;
        }

        .mBtnAlt {
          border: 0;
          border-radius: 16px;
          padding: 14px 16px;
          font-weight: 950;
          cursor: pointer;
          background: linear-gradient(90deg, var(--jusp-gold), var(--jusp-gold-2));
          color: rgba(0, 0, 0, 0.92);
          box-shadow: 0 18px 50px rgba(212, 175, 55, 0.18);
          min-width: 120px;
        }
        .mBtnBlack {
          border: 0;
          border-radius: 16px;
          padding: 14px 16px;
          font-weight: 950;
          cursor: pointer;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.84));
          color: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 56px rgba(0, 0, 0, 0.22);
          min-width: 120px;
        }
        .mBtnAlt:disabled,
        .mBtnBlack:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 980px) {
          .swipeHint {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .grid {
            grid-template-columns: 1fr;
          }
          .gallery {
            grid-template-columns: 1fr;
          }
          .thumbCol {
            position: relative;
            top: auto;
            display: flex;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            gap: 10px;
            max-height: none;
            padding-right: 0;
            padding-bottom: 4px;
            mask-image: none;
            -webkit-mask-image: none;
            scroll-snap-type: x proximity;
            cursor: auto;
          }
          .thBtn {
            flex: 0 0 auto;
            scroll-snap-align: start;
          }
          .th {
            width: 78px;
            height: 78px;
          }
          .card {
            position: relative;
            top: auto;
          }
          .imgBox {
            min-height: 440px;
          }
          .recoGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (hover: none), (pointer: coarse) {
          .cardZoomViewer {
            display: none;
          }
          .imgBox.zoomReady img {
            cursor: default;
          }
        }

        @media (max-width: 720px) {
          .mobileBar {
            display: flex;
          }
          .recoSection {
            margin-top: 26px;
            padding: 20px;
          }
          .recoHead {
            align-items: stretch;
            flex-direction: column;
          }
          .recoStat {
            align-self: flex-start;
          }
          .recoGrid {
            grid-template-columns: 1fr;
          }
          .recoCardTitle {
            font-size: 18px;
          }
          .recoPrice {
            font-size: 22px;
          }
          .gridOps {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .colorGrid {
            grid-template-columns: 1fr;
          }
          .favBtn {
            min-height: 50px;
            padding: 0 12px;
            top: 12px;
            right: 12px;
          }
          .deliveryTop,
          .trustHead {
            align-items: flex-start;
          }
          .trustTitle {
            font-size: 26px;
          }
          .shipTrustRow {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
          .trustRail {
            gap: 10px;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .trustRail::-webkit-scrollbar {
            display: none;
          }
          .trustLogoBtn .trustIcon {
            width: 50px;
            height: 50px;
          }
          .trustDetail {
            min-height: 148px;
            padding: 16px;
          }
        }

        @media (min-width: 721px) {
          .mobileBar {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}