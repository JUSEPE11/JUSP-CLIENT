// components/Header.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "./store";

type MegaKey =
  | "hombre"
  | "mujer"
  | "ninos"
  | "accesorios"
  | "snkrs"
  | "jordan"
  | "ofertas"
  | "drophype"
  | "exclusivo"
  | null;

type MegaSection = { title: string; items: { label: string; href: string }[] };
type MegaConfig = {
  label: string;
  href: string;
  key: Exclude<MegaKey, null>;
  highlight?: boolean;
  columns: MegaSection[];
};

type Suggestion = { label: string; href: string; kind: "suggest" | "recent" | "quick" };

type SearchProduct = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  price?: number | string;
  compareAt?: number | string;
  href: string;
  matchLabel?: "Exacto" | "Muy similar" | "Similar";
  matchScore?: number;
};

type SearchCatalogProduct = Record<string, any>;
type ImageFeature = {
  r: number;
  g: number;
  b: number;
  brightness: number;
  variance: number;
  aspect: number;
  hash: string;
  centerHash: string;
  edgeBalance: number;
  saturation: number;
  warmness: number;
  cropFill: number;
  foregroundCoverage: number;
  backgroundRemoved: number;
  dominantColorPurity: number;
  histogram: number[];
  colorHistogram: number[];
  centerHistogram: number[];
  rowProfile: number[];
  colProfile: number[];
};
type VisualIntent = {
  brands: string[];
  categories: string[];
  genders: string[];
  colors: string[];
  shapes: string[];
};

type ProductVisualClass = "shoe" | "top" | "bottom" | "outerwear" | "accessory" | "garment" | "unknown";

type CatalogVisualIndexEntry = {
  product: SearchCatalogProduct;
  images: string[];
  features: { src: string; feature: ImageFeature; imageIndex: number }[];
  primaryFeature: ImageFeature | null;
};

type RankedVisualProduct = {
  product: SearchCatalogProduct;
  images: string[];
  score: number;
  bestImageIndex: number;
  bestFeature: ImageFeature | null;
};

function normalizeSearchText(value: unknown): string {
  let text = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!text) return "";

  const extra: string[] = [];

  if (/\bmujer\b/.test(text)) extra.push("women woman female dama ladies");
  if (/\bwomen\b|\bwoman\b|\bfemale\b|\bladies\b/.test(text)) extra.push("mujer dama");

  if (/\bhombre\b/.test(text)) extra.push("men man male caballero");
  if (/\bmen\b|\bman\b|\bmale\b/.test(text)) extra.push("hombre caballero");

  if (/\bninos\b|\bnino\b|\bkids\b|\bkid\b|\bboys\b|\bgirls\b/.test(text))
    extra.push("ninos nino kids kid boys girls infantil");
  if (/\bpants\b/.test(text)) extra.push("pantalon pantalones leggings jogger trousers");
  if (/\bpantalon\b|\bpantalones\b|\bleggings\b|\bjogger\b/.test(text))
    extra.push("pants trousers");
  if (/\bzapatillas\b/.test(text)) extra.push("shoes sneakers");
  if (/\bshoes\b|\bsneakers\b/.test(text)) extra.push("zapatillas tenis");

  if (extra.length) text = `${text} ${extra.join(" ")}`.trim();
  return text.replace(/\s+/g, " ");
}

function tokenizeSearch(value: string): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

function formatMoney(value: unknown): string | undefined {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return undefined;
  try {
    return new Intl.NumberFormat("es-CO").format(n);
  } catch {
    return String(Math.round(n));
  }
}

function hasPositiveMoney(value: unknown): boolean {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0;
}

function pushSearchValues(target: string[], value: unknown) {
  if (Array.isArray(value)) {
    for (const item of value) pushSearchValues(target, item);
    return;
  }
  const s = String(value ?? "").trim();
  if (!s) return;
  target.push(s);
}

function buildSearchHaystack(product: SearchCatalogProduct): string {
  const values: string[] = [];
  pushSearchValues(values, product.title);
  pushSearchValues(values, product.name);
  pushSearchValues(values, product.brand);
  pushSearchValues(values, product.category);
  pushSearchValues(values, product.gender);
  pushSearchValues(values, product.kind);
  pushSearchValues(values, product.colors);
  pushSearchValues(values, product.tags);
  pushSearchValues(values, product.sport);
  pushSearchValues(values, product.collections);
  pushSearchValues(values, product.models);
  pushSearchValues(values, product.slug);
  if (Array.isArray(product.variants)) {
    for (const variant of product.variants) {
      pushSearchValues(values, variant?.color);
      pushSearchValues(values, variant?.size);
    }
  }
  return normalizeSearchText(values.join(" "));
}

function scoreCatalogProduct(product: SearchCatalogProduct, query: string): number {
  const tokens = tokenizeSearch(query);
  if (!tokens.length) return 0;

  const haystack = buildSearchHaystack(product);
  if (!haystack) return 0;

  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
  }

  const title = normalizeSearchText(product.title || product.name || "");
  const brand = normalizeSearchText(product.brand || "");
  const kind = normalizeSearchText(product.kind || "");
  const category = normalizeSearchText(product.category || "");
  const queryNorm = normalizeSearchText(query);

  let score = 0;

  if (title === queryNorm) score += 1000;
  if (title.startsWith(queryNorm)) score += 500;
  if (title.includes(queryNorm)) score += 250;
  if (brand === queryNorm) score += 180;
  if (brand.startsWith(queryNorm)) score += 120;
  if (kind === queryNorm) score += 90;
  if (category === queryNorm) score += 70;

  for (const token of tokens) {
    if (title.startsWith(token)) score += 70;
    else if (title.includes(token)) score += 40;

    if (brand.startsWith(token)) score += 35;
    else if (brand.includes(token)) score += 20;

    if (kind.includes(token)) score += 18;
    if (category.includes(token)) score += 12;
    if (haystack.includes(token)) score += 8;
  }

  score += Math.min(tokens.length * 10, 40);
  return score;
}

function getCatalogProductImages(product: SearchCatalogProduct): string[] {
  const values: string[] = [];
  const seen = new Set<string>();
  const imageUrlPattern = /(?:^data:image\/|\.(?:png|jpe?g|webp|gif|avif)(?:[?#].*)?$|\/image\/|\/images\/|\/media\/|cdn|cloudinary|shopify|supabase)/i;

  function pushUrl(value: unknown) {
    const url = String(value ?? "").trim();
    if (!url || seen.has(url)) return;
    if (!imageUrlPattern.test(url)) return;
    seen.add(url);
    values.push(url);
  }

  function walk(value: unknown, depth = 0) {
    if (depth > 4 || value == null) return;

    if (typeof value === "string") {
      pushUrl(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1);
      return;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const priorityKeys = [
        "image",
        "src",
        "url",
        "thumbnail",
        "thumb",
        "mainImage",
        "main_image",
        "featuredImage",
        "featured_image",
        "images",
        "gallery",
        "media",
        "photos",
        "pictures",
        "variants",
      ];

      for (const key of priorityKeys) {
        if (key in record) walk(record[key], depth + 1);
      }

      for (const [key, nested] of Object.entries(record)) {
        if (priorityKeys.includes(key)) continue;
        if (/image|img|photo|picture|media|gallery|variant|thumbnail|thumb/i.test(key)) {
          walk(nested, depth + 1);
        }
      }
    }
  }

  walk(product);
  return values.slice(0, 12);
}
function loadImageElement(src: string, crossOrigin: "anonymous" | "none" = "anonymous"): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    if (crossOrigin === "anonymous") img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = src;
  });
}

function getNextImageProxyUrl(src: string): string | null {
  const clean = String(src || "").trim();
  if (!clean || clean.startsWith("data:") || clean.startsWith("blob:")) return null;
  if (clean.startsWith("/_next/image")) return null;
  try {
    const absolute = clean.startsWith("http://") || clean.startsWith("https://")
      ? clean
      : typeof window !== "undefined"
      ? new URL(clean, window.location.origin).toString()
      : clean;
    return `/_next/image?url=${encodeURIComponent(absolute)}&w=128&q=60`;
  } catch {
    return null;
  }
}

function getImageAnalysisSources(src: string): string[] {
  const clean = String(src || "").trim();
  const sources: string[] = [];
  if (clean) sources.push(clean);
  const proxied = getNextImageProxyUrl(clean);
  if (proxied && !sources.includes(proxied)) sources.unshift(proxied);
  return sources;
}

type ForegroundExtraction = {
  x: number;
  y: number;
  width: number;
  height: number;
  bgR: number;
  bgG: number;
  bgB: number;
  threshold: number;
  foregroundRatio: number;
  confidence: number;
};

function getPixelDistance(r: number, g: number, b: number, bgR: number, bgG: number, bgB: number): number {
  return Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));
}

function getPixelSaturation(r: number, g: number, b: number): number {
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  return maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;
}

function isForegroundPixel(
  r: number,
  g: number,
  b: number,
  alpha: number,
  extraction: ForegroundExtraction,
  localGradient = 0
): boolean {
  if (alpha < 8) return false;

  const lum = (r + g + b) / 3;
  const bgLum = (extraction.bgR + extraction.bgG + extraction.bgB) / 3;
  const colorDistance = getPixelDistance(r, g, b, extraction.bgR, extraction.bgG, extraction.bgB);
  const lumDistance = Math.abs(lum - bgLum);
  const saturation = getPixelSaturation(r, g, b);
  const bgSaturation = getPixelSaturation(extraction.bgR, extraction.bgG, extraction.bgB);
  const saturationDistance = Math.abs(saturation - bgSaturation);

  const baseThreshold = extraction.threshold;
  const strongColor = colorDistance >= baseThreshold;
  const strongLuma = lumDistance >= Math.max(14, baseThreshold * 0.38);
  const strongSaturation = saturationDistance >= 0.12 && colorDistance >= Math.max(18, baseThreshold * 0.48);
  const strongEdge = localGradient >= 24 && colorDistance >= Math.max(14, baseThreshold * 0.34);

  return strongColor || strongLuma || strongSaturation || strongEdge;
}

function extractForegroundModel(
  image: CanvasImageSource,
  width: number,
  height: number
): ForegroundExtraction {
  const fallback: ForegroundExtraction = {
    x: 0,
    y: 0,
    width,
    height,
    bgR: 255,
    bgG: 255,
    bgB: 255,
    threshold: 28,
    foregroundRatio: 1,
    confidence: 0,
  };

  if (typeof document === "undefined") return fallback;

  const probeCanvas = document.createElement("canvas");
  probeCanvas.width = 72;
  probeCanvas.height = 72;
  const probeCtx = probeCanvas.getContext("2d", { willReadFrequently: true });
  if (!probeCtx) return fallback;

  probeCtx.clearRect(0, 0, probeCanvas.width, probeCanvas.height);
  probeCtx.drawImage(image, 0, 0, probeCanvas.width, probeCanvas.height);
  const data = probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height).data;

  const borderPixels: Array<[number, number, number]> = [];
  for (let y = 0; y < probeCanvas.height; y += 1) {
    for (let x = 0; x < probeCanvas.width; x += 1) {
      const isBorder = x < 5 || y < 5 || x >= probeCanvas.width - 5 || y >= probeCanvas.height - 5;
      if (!isBorder) continue;
      const idx = (y * probeCanvas.width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 8) continue;
      borderPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  if (!borderPixels.length) return fallback;

  const avg = borderPixels.reduce(
    (acc, pixel) => {
      acc[0] += pixel[0];
      acc[1] += pixel[1];
      acc[2] += pixel[2];
      return acc;
    },
    [0, 0, 0]
  );

  let bgR = avg[0] / borderPixels.length;
  let bgG = avg[1] / borderPixels.length;
  let bgB = avg[2] / borderPixels.length;

  const stableBorder = borderPixels.filter(([r, g, b]) => getPixelDistance(r, g, b, bgR, bgG, bgB) <= 38);

  if (stableBorder.length >= Math.max(18, borderPixels.length * 0.42)) {
    const stableAvg = stableBorder.reduce(
      (acc, pixel) => {
        acc[0] += pixel[0];
        acc[1] += pixel[1];
        acc[2] += pixel[2];
        return acc;
      },
      [0, 0, 0]
    );
    bgR = stableAvg[0] / stableBorder.length;
    bgG = stableAvg[1] / stableBorder.length;
    bgB = stableAvg[2] / stableBorder.length;
  }

  const bgLum = (bgR + bgG + bgB) / 3;
  const borderVariance =
    borderPixels.reduce((acc, [r, g, b]) => acc + getPixelDistance(r, g, b, bgR, bgG, bgB), 0) /
    borderPixels.length;
  const brightNeutralBg = bgLum >= 190 && Math.max(bgR, bgG, bgB) - Math.min(bgR, bgG, bgB) <= 42;
  const threshold = Math.max(22, Math.min(54, (brightNeutralBg ? 26 : 32) + borderVariance * 0.42));

  let minX = probeCanvas.width;
  let minY = probeCanvas.height;
  let maxX = -1;
  let maxY = -1;
  let foregroundCount = 0;
  const modelForPixel: ForegroundExtraction = {
    x: 0,
    y: 0,
    width,
    height,
    bgR,
    bgG,
    bgB,
    threshold,
    foregroundRatio: 1,
    confidence: 1,
  };

  for (let y = 0; y < probeCanvas.height; y += 1) {
    for (let x = 0; x < probeCanvas.width; x += 1) {
      const idx = (y * probeCanvas.width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 8) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const rightIdx = (y * probeCanvas.width + Math.min(probeCanvas.width - 1, x + 1)) * 4;
      const downIdx = (Math.min(probeCanvas.height - 1, y + 1) * probeCanvas.width + x) * 4;
      const lum = (r + g + b) / 3;
      const rightLum = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
      const downLum = (data[downIdx] + data[downIdx + 1] + data[downIdx + 2]) / 3;
      const localGradient = Math.abs(lum - rightLum) + Math.abs(lum - downLum);

      if (!isForegroundPixel(r, g, b, alpha, modelForPixel, localGradient)) continue;

      foregroundCount += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const foregroundRatio = foregroundCount / (probeCanvas.width * probeCanvas.height);
  if (maxX <= minX || maxY <= minY || foregroundRatio < 0.018) {
    return {
      ...fallback,
      bgR,
      bgG,
      bgB,
      threshold,
      foregroundRatio,
      confidence: 0.18,
    };
  }

  const rawW = maxX - minX + 1;
  const rawH = maxY - minY + 1;
  const padX = Math.max(3, Math.round(rawW * 0.1));
  const padY = Math.max(3, Math.round(rawH * 0.1));

  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(probeCanvas.width - 1, maxX + padX);
  maxY = Math.min(probeCanvas.height - 1, maxY + padY);

  const boxArea = ((maxX - minX + 1) * (maxY - minY + 1)) / (probeCanvas.width * probeCanvas.height);
  const confidence = Math.max(0.2, Math.min(1, foregroundRatio / Math.max(0.08, boxArea) + (brightNeutralBg ? 0.12 : 0)));

  return {
    x: (minX / probeCanvas.width) * width,
    y: (minY / probeCanvas.height) * height,
    width: ((maxX - minX + 1) / probeCanvas.width) * width,
    height: ((maxY - minY + 1) / probeCanvas.height) * height,
    bgR,
    bgG,
    bgB,
    threshold,
    foregroundRatio,
    confidence,
  };
}

function computeImageFeatureFromImage(image: CanvasImageSource, width: number, height: number): ImageFeature | null {
  if (typeof document === "undefined") return null;

  const extraction = extractForegroundModel(image, width, height);
  const cropX = Math.max(0, extraction.x);
  const cropY = Math.max(0, extraction.y);
  const cropWidth = Math.max(1, extraction.width);
  const cropHeight = Math.max(1, extraction.height);

  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const foregroundMask = new Array<boolean>(canvas.width * canvas.height).fill(false);

  let foregroundPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % canvas.width;
    const y = Math.floor(pixelIndex / canvas.width);
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    const rightIndex = (y * canvas.width + Math.min(canvas.width - 1, x + 1)) * 4;
    const downIndex = (Math.min(canvas.height - 1, y + 1) * canvas.width + x) * 4;
    const lum = (r + g + b) / 3;
    const rightLum = (data[rightIndex] + data[rightIndex + 1] + data[rightIndex + 2]) / 3;
    const downLum = (data[downIndex] + data[downIndex + 1] + data[downIndex + 2]) / 3;
    const localGradient = Math.abs(lum - rightLum) + Math.abs(lum - downLum);
    const keep = extraction.confidence >= 0.2 ? isForegroundPixel(r, g, b, alpha, extraction, localGradient) : alpha >= 8;

    if (keep) {
      foregroundMask[pixelIndex] = true;
      foregroundPixels += 1;
    }
  }

  if (foregroundPixels < 8) {
    foregroundMask.fill(true);
    foregroundPixels = canvas.width * canvas.height;
  } else {
    const expandedMask = foregroundMask.slice();
    for (let y = 1; y < canvas.height - 1; y += 1) {
      for (let x = 1; x < canvas.width - 1; x += 1) {
        const index = y * canvas.width + x;
        if (foregroundMask[index]) continue;
        const neighbors =
          Number(foregroundMask[index - 1]) +
          Number(foregroundMask[index + 1]) +
          Number(foregroundMask[index - canvas.width]) +
          Number(foregroundMask[index + canvas.width]);
        if (neighbors >= 3) expandedMask[index] = true;
      }
    }
    for (let i = 0; i < foregroundMask.length; i += 1) foregroundMask[i] = expandedMask[i];
  }

  let count = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumSaturation = 0;
  const histogram = new Array<number>(16).fill(0);
  const colorHistogram = new Array<number>(48).fill(0);
  const rowProfile = new Array<number>(canvas.height).fill(0);
  const colProfile = new Array<number>(canvas.width).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const pixelIndex = i / 4;
    if (alpha < 8 || !foregroundMask[pixelIndex]) continue;
    const x = pixelIndex % canvas.width;
    const y = Math.floor(pixelIndex / canvas.width);
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    sumR += pr;
    sumG += pg;
    sumB += pb;
    const maxChannel = Math.max(pr, pg, pb);
    const minChannel = Math.min(pr, pg, pb);
    sumSaturation += maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;
    const bucket = Math.max(0, Math.min(15, Math.floor(((pr + pg + pb) / 3) / 16)));
    histogram[bucket] += 1;
    colorHistogram[Math.max(0, Math.min(15, Math.floor(pr / 16)))] += 1;
    colorHistogram[16 + Math.max(0, Math.min(15, Math.floor(pg / 16)))] += 1;
    colorHistogram[32 + Math.max(0, Math.min(15, Math.floor(pb / 16)))] += 1;
    rowProfile[y] += 1;
    colProfile[x] += 1;
    count += 1;
  }

  if (!count) return null;

  const r = sumR / count;
  const g = sumG / count;
  const b = sumB / count;
  const brightness = (r + g + b) / 3;
  const saturation = sumSaturation / count;
  const warmness = (r - b) / 255;
  const cropFill = Math.max(0, Math.min(1, count / (canvas.width * canvas.height)));
  const foregroundCoverage = Math.max(0, Math.min(1, extraction.foregroundRatio));
  const backgroundRemoved = Math.max(0, Math.min(1, 1 - cropFill));

  let varianceAccumulator = 0;
  let dominantColorHits = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const pixelIndex = i / 4;
    if (alpha < 8 || !foregroundMask[pixelIndex]) continue;
    const localBrightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    varianceAccumulator += Math.pow(localBrightness - brightness, 2);
    const distanceToAverage = getPixelDistance(data[i], data[i + 1], data[i + 2], r, g, b);
    if (distanceToAverage <= 52) dominantColorHits += 1;
  }

  const variance = Math.sqrt(varianceAccumulator / count) / 255;
  const dominantColorPurity = dominantColorHits / count;

  const hashCanvas = document.createElement("canvas");
  hashCanvas.width = 9;
  hashCanvas.height = 8;
  const hashCtx = hashCanvas.getContext("2d", { willReadFrequently: true });
  if (!hashCtx) return null;

  hashCtx.clearRect(0, 0, hashCanvas.width, hashCanvas.height);
  hashCtx.drawImage(canvas, 0, 0, hashCanvas.width, hashCanvas.height);
  const hashData = hashCtx.getImageData(0, 0, hashCanvas.width, hashCanvas.height).data;
  const rows: number[][] = [];

  for (let y = 0; y < hashCanvas.height; y += 1) {
    const row: number[] = [];
    for (let x = 0; x < hashCanvas.width; x += 1) {
      const sourceX = Math.max(0, Math.min(canvas.width - 1, Math.round((x / (hashCanvas.width - 1)) * (canvas.width - 1))));
      const sourceY = Math.max(0, Math.min(canvas.height - 1, Math.round((y / (hashCanvas.height - 1)) * (canvas.height - 1))));
      const sourceIndex = sourceY * canvas.width + sourceX;
      const idx = (y * hashCanvas.width + x) * 4;
      const lum = foregroundMask[sourceIndex]
        ? (hashData[idx] + hashData[idx + 1] + hashData[idx + 2]) / 3
        : brightness;
      row.push(lum);
    }
    rows.push(row);
  }

  let hash = "";
  let edgeBalance = 0;
  for (const row of rows) {
    for (let x = 0; x < 8; x += 1) {
      const bit = row[x] > row[x + 1] ? "1" : "0";
      hash += bit;
      if (bit === "1") edgeBalance += 1;
    }
  }

  const centerCanvas = document.createElement("canvas");
  centerCanvas.width = 9;
  centerCanvas.height = 8;
  const centerCtx = centerCanvas.getContext("2d", { willReadFrequently: true });
  if (!centerCtx) return null;

  centerCtx.clearRect(0, 0, centerCanvas.width, centerCanvas.height);
  centerCtx.drawImage(
    canvas,
    Math.max(0, canvas.width * 0.16),
    Math.max(0, canvas.height * 0.16),
    Math.max(1, canvas.width * 0.68),
    Math.max(1, canvas.height * 0.68),
    0,
    0,
    centerCanvas.width,
    centerCanvas.height
  );
  const centerData = centerCtx.getImageData(0, 0, centerCanvas.width, centerCanvas.height).data;
  let centerHash = "";
  const centerHistogram = new Array<number>(16).fill(0);
  const centerRows: number[][] = [];

  for (let y = 0; y < centerCanvas.height; y += 1) {
    const row: number[] = [];
    for (let x = 0; x < centerCanvas.width; x += 1) {
      const idx = (y * centerCanvas.width + x) * 4;
      const lum = (centerData[idx] + centerData[idx + 1] + centerData[idx + 2]) / 3;
      row.push(lum);
      const bucket = Math.max(0, Math.min(15, Math.floor(lum / 16)));
      centerHistogram[bucket] += 1;
    }
    centerRows.push(row);
  }

  for (const row of centerRows) {
    for (let x = 0; x < 8; x += 1) {
      centerHash += row[x] > row[x + 1] ? "1" : "0";
    }
  }

  return {
    r,
    g,
    b,
    brightness,
    variance,
    aspect: cropWidth > 0 && cropHeight > 0 ? cropWidth / cropHeight : 1,
    hash,
    centerHash,
    edgeBalance,
    saturation,
    warmness,
    cropFill,
    foregroundCoverage,
    backgroundRemoved,
    dominantColorPurity,
    histogram: histogram.map((value) => value / count),
    colorHistogram: colorHistogram.map((value) => value / count),
    centerHistogram: centerHistogram.map((value) => value / (centerCanvas.width * centerCanvas.height)),
    rowProfile: rowProfile.map((value) => value / canvas.width),
    colProfile: colProfile.map((value) => value / canvas.height),
  };
}

async function computeImageFeatureFromFile(file: File): Promise<ImageFeature | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    return computeImageFeatureFromImage(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function inferVisualTokens(feature: ImageFeature): string[] {
  const tokens: string[] = [];
  const { r, g, b, brightness } = feature;

  if (brightness <= 78) tokens.push("black", "negro");
  if (brightness >= 214) tokens.push("white", "blanco");

  if (r > g + 26 && r > b + 26) {
    if (brightness > 150) tokens.push("pink", "rosa", "rosado");
    else tokens.push("red", "rojo");
  }

  if (b > r + 18 && b > g + 12) tokens.push("blue", "azul");
  if (g > r + 18 && g > b + 12) tokens.push("green", "verde");
  if (r > 150 && g > 120 && b < 110) tokens.push("orange", "naranja");
  if (r > 155 && g > 145 && b < 90) tokens.push("yellow", "amarillo");
  if (r > 118 && g > 82 && b < 72 && feature.warmness > 0.18) tokens.push("brown", "cafe", "marron");
  if (r > 118 && g > 92 && b > 70 && Math.abs(r - g) < 46 && Math.abs(g - b) < 46) tokens.push("beige", "cream", "crema");
  if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && brightness >= 90 && brightness <= 190) {
    tokens.push("grey", "gray", "gris");
  }

  return [...new Set(tokens)];
}

function inferIntentFromImage(fileName: string, feature: ImageFeature): VisualIntent {
  const text = normalizeSearchText(fileName);
  const brands = new Set<string>();
  const categories = new Set<string>();
  const genders = new Set<string>();
  const colors = new Set<string>(inferVisualTokens(feature));
  const shapes = new Set<string>();

  const brandMatchers = [
    ["nike", ["nike", "jordan", "jumpman"]],
    ["jordan", ["jordan", "jumpman"]],
    ["puma", ["puma"]],
    ["adidas", ["adidas"]],
    ["new-balance", ["new balance", "newbalance", "nb"]],
  ] as const;

  for (const [brand, terms] of brandMatchers) {
    if (terms.some((term) => text.includes(normalizeSearchText(term)))) brands.add(brand);
  }

  const categoryMatchers = [
    ["sports-bra", ["bra", "sports bra", "sujetador", "top", "support", "tank", "padde", "padded"]],
    ["shirt", ["shirt", "camiseta", "tee", "polo", "playera"]],
    ["pants", ["pants", "pant", "pantalon", "leggings", "jogger", "trouser"]],
    ["shorts", ["short", "shorts"]],
    ["jacket", ["jacket", "chaqueta", "hoodie", "sudadera"]],
    ["cap", ["cap", "gorra", "hat"]],
    ["shoes", ["shoe", "shoes", "zapatilla", "zapatillas", "sneaker", "tenis"]],
  ] as const;

  for (const [category, terms] of categoryMatchers) {
    if (terms.some((term) => text.includes(normalizeSearchText(term)))) categories.add(category);
  }

  if (/\bmujer\b|\bwomen\b|\bladies\b|\bfemale\b/.test(text)) genders.add("women");
  if (/\bhombre\b|\bmen\b|\bmale\b/.test(text)) genders.add("men");
  if (/\bninos\b|\bnino\b|\bkids\b|\bgirls\b|\bboys\b/.test(text)) genders.add("kids");

  const visualClass = inferImageVisualClass(feature);
  if (visualClass === "shoe") {
    categories.add("shoes");
    shapes.add("wide-low");
  } else if (visualClass === "top") {
    categories.add("shirt");
    shapes.add("upper-garment");
  } else if (visualClass === "bottom") {
    categories.add("pants");
    shapes.add("lower-garment");
  } else if (visualClass === "outerwear") {
    categories.add("jacket");
    shapes.add("outerwear");
  }

  if (feature.saturation < 0.12) shapes.add("neutral-color");
  if (feature.cropFill > 0.82) shapes.add("full-frame");

  return {
    brands: [...brands],
    categories: [...categories],
    genders: [...genders],
    colors: [...colors],
    shapes: [...shapes],
  };
}

function hammingDistance(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return Math.max(a.length, b.length, 64);
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) diff += 1;
  }
  return diff;
}

function histogramDistance(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let total = 0;
  for (let i = 0; i < length; i += 1) {
    total += Math.abs(a[i] - b[i]);
  }
  return total;
}

function profileDistance(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (!length) return 1;

  let total = 0;
  for (let i = 0; i < length; i += 1) {
    total += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  }

  return total / length;
}

function scoreIntentMatch(product: SearchCatalogProduct, intent: VisualIntent): number {
  const haystack = buildSearchHaystack(product);
  const brand = normalizeSearchText(product.brand || "");
  const gender = normalizeSearchText(product.gender || "");
  const category = normalizeSearchText(`${product.kind || ""} ${product.category || ""} ${product.title || ""}`);
  const title = normalizeSearchText(product.title || product.name || "");
  let score = 0;

  if (intent.brands.length) {
    const matchesBrand = intent.brands.some((token) => brand.includes(token) || haystack.includes(token));
    // Only penalize brand mismatch if we have high confidence in the brand (multiple brand tokens)
    // A single inferred brand from filename is unreliable — don't penalize hard on mismatch
    const brandConfident = intent.brands.length >= 1;
    score += matchesBrand ? 68 : (brandConfident ? -18 : 0);
  }

  if (intent.genders.length) {
    const matchesGender = intent.genders.some((token) => gender.includes(token) || haystack.includes(token));
    score += matchesGender ? 24 : -12;
  }

  if (intent.categories.length) {
    const categoryMap: Record<string, string[]> = {
      "sports-bra": ["bra", "sujetador", "top", "support", "tank", "sports bra"],
      shirt: ["shirt", "camiseta", "tee", "polo", "playera"],
      pants: ["pants", "pantalon", "leggings", "jogger", "trouser"],
      shorts: ["short", "shorts"],
      jacket: ["jacket", "chaqueta", "hoodie", "sudadera"],
      cap: ["cap", "gorra", "hat"],
      shoes: ["shoe", "shoes", "zapatilla", "zapatillas", "sneaker", "tenis"],
    };

    let bestCategoryScore = -30;
    for (const token of intent.categories) {
      const terms = categoryMap[token] || [token];
      const match = terms.some((term) => category.includes(normalizeSearchText(term)) || haystack.includes(normalizeSearchText(term)));
      if (match) {
        bestCategoryScore = Math.max(bestCategoryScore, 64);
      }
    }
    score += bestCategoryScore;
  }

  if (intent.colors.length) {
    let colorHits = 0;
    for (const token of intent.colors.slice(0, 3)) {
      if (haystack.includes(normalizeSearchText(token))) colorHits += 1;
    }
    score += colorHits * 16;
  }

  if (intent.shapes.includes("wide-low")) {
    const looksLikeShoe =
      title.includes("dunk") ||
      title.includes("air force") ||
      title.includes("air max") ||
      title.includes("shoe") ||
      title.includes("sneaker") ||
      title.includes("zapatilla") ||
      title.includes("tenis") ||
      category.includes("shoes");
    score += looksLikeShoe ? 28 : -22;
  }

  if (intent.shapes.includes("square-garment")) {
    const looksLikeBra =
      title.includes("bra") ||
      title.includes("sujetador") ||
      title.includes("top") ||
      title.includes("tank") ||
      title.includes("support");
    score += looksLikeBra ? 34 : 0;
  }

  return score;
}

function scoreTextAffinity(product: SearchCatalogProduct, intent: VisualIntent, source: ImageFeature) {
  const haystack = buildSearchHaystack(product);
  const title = normalizeSearchText(product.title || product.name || "");
  let score = 0;

  const visualTokens = new Set([...intent.colors, ...inferVisualTokens(source)]);
  for (const token of visualTokens) {
    if (haystack.includes(normalizeSearchText(token))) score += 14;
  }

  if (intent.categories.includes("sports-bra")) {
    if (/\b(bra|sujetador|top|tank|support)\b/.test(title)) score += 54;
    if (/\b(shoe|sneaker|zapatilla|dunk|force|max)\b/.test(title)) score -= 58;
  }

  if (intent.categories.includes("shoes")) {
    if (/\b(shoe|sneaker|zapatilla|tenis|dunk|force|max|jordan)\b/.test(title)) score += 54;
    if (/\b(bra|sujetador|top|shirt|camiseta|pants|legging)\b/.test(title)) score -= 48;
  }

  if (intent.categories.includes("pants")) {
    if (/\b(pants|pantalon|legging|jogger|trouser)\b/.test(title)) score += 46;
    if (/\b(shoe|sneaker|zapatilla|bra|sujetador)\b/.test(title)) score -= 38;
  }

  if (intent.genders.includes("women") && /\b(women|woman|mujer|female|dama)\b/.test(haystack)) score += 18;
  if (intent.genders.includes("men") && /\b(men|hombre|male|caballero)\b/.test(haystack)) score += 18;
  if (intent.genders.includes("kids") && /\b(kids|ninos|nino|infantil|boys|girls)\b/.test(haystack)) score += 18;

  return score;
}

function getVisualFamily(feature: ImageFeature): "shoe" | "garment" | "compact" | "wide" | "unknown" {
  if (feature.aspect >= 1.62 && feature.cropFill <= 0.86) return "shoe";
  if (feature.aspect >= 0.52 && feature.aspect <= 1.48) return "garment";
  if (feature.aspect > 1.48) return "wide";
  if (feature.aspect < 0.52) return "compact";
  return "unknown";
}

function getCatalogProductFamily(product: SearchCatalogProduct): "shoe" | "garment" | "accessory" | "unknown" {
  const classes = getCatalogProductVisualClasses(product);
  if (classes.includes("shoe")) return "shoe";
  if (classes.some((item) => item === "top" || item === "bottom" || item === "outerwear" || item === "garment")) return "garment";
  if (classes.includes("accessory")) return "accessory";
  return "unknown";
}

function getCatalogProductVisualClasses(product: SearchCatalogProduct): ProductVisualClass[] {
  const text = normalizeSearchText(
    String(product.title || "") + " " +
      String(product.name || "") + " " +
      String(product.brand || "") + " " +
      String(product.gender || "") + " " +
      String(product.kind || "") + " " +
      String(product.category || "") + " " +
      String(product.subcategory || "") + " " +
      String(product.tags || "")
  );

  const classes = new Set<ProductVisualClass>();

  if (/\b(shoe|shoes|sneaker|sneakers|zapatilla|zapatillas|tenis|dunk|jordan|air force|air max|trainer|running)\b/.test(text)) {
    classes.add("shoe");
  }

  if (/\b(bra|sports bra|sujetador|top|tank|shirt|camiseta|tee|t shirt|polo|playera|blusa|jersey)\b/.test(text)) {
    classes.add("top");
  }

  if (/\b(pants|pant|pantalon|pantalones|legging|leggings|jogger|trouser|short|shorts|falda|skirt)\b/.test(text)) {
    classes.add("bottom");
  }

  if (/\b(hoodie|jacket|chaqueta|sudadera|coat|abrigo|windrunner|fleece)\b/.test(text)) {
    classes.add("outerwear");
  }

  if (/\b(cap|gorra|hat|bag|bolso|mochila|backpack|accessory|accesorio|sock|socks|medias)\b/.test(text)) {
    classes.add("accessory");
  }

  if (!classes.size && /\b(apparel|ropa|clothing|wear)\b/.test(text)) {
    classes.add("garment");
  }

  return classes.size ? [...classes] : ["unknown"];
}

function inferImageVisualClass(feature: ImageFeature): ProductVisualClass {
  const aspect = feature.aspect;
  const fill = feature.cropFill;
  const rowTop = feature.rowProfile.slice(0, 6).reduce((a, b) => a + b, 0);
  const rowMid = feature.rowProfile.slice(7, 17).reduce((a, b) => a + b, 0);
  const rowBottom = feature.rowProfile.slice(18).reduce((a, b) => a + b, 0);
  const colLeft = feature.colProfile.slice(0, 7).reduce((a, b) => a + b, 0);
  const colMid = feature.colProfile.slice(8, 16).reduce((a, b) => a + b, 0);
  const colRight = feature.colProfile.slice(17).reduce((a, b) => a + b, 0);
  const verticalBalance = Math.abs(rowTop - rowBottom);
  const horizontalSpread = colLeft + colRight;
  const centerMass = rowMid + colMid;

  // Shoes: distinctly wide aspect ratio, mass distributed horizontally at edges
  // Relaxed threshold: 1.45 (was 1.58) to catch shoes that aren't perfectly side-profile
  if (aspect >= 1.45 && fill <= 0.92 && horizontalSpread > centerMass * 0.45) return "shoe";

  // Bottom garments: taller than wide
  if (aspect <= 0.78 && fill >= 0.45) return "bottom";

  // Tops: near-square to slightly portrait, reasonable fill
  // Widened range to catch more folded/flat garment photos
  if (aspect >= 0.68 && aspect <= 1.45 && fill >= 0.38 && verticalBalance <= 5.0) return "top";

  // Outerwear: similar to top but more variance (texture, pockets, zippers)
  if (aspect >= 0.58 && aspect <= 1.3 && fill >= 0.55 && feature.variance > 0.038) return "outerwear";

  // Small/thin items
  if (aspect < 0.55 || (fill < 0.32 && aspect < 1.40)) return "accessory";

  // Wide-but-not-shoe (bags, accessories)
  if (aspect >= 0.55 && aspect <= 1.5) return "garment";

  return "unknown";
}

function areVisualClassesCompatible(sourceClass: ProductVisualClass, candidateClass: ProductVisualClass): boolean {
  if (sourceClass === "unknown" || candidateClass === "unknown") return true;
  if (sourceClass === candidateClass) return true;
  if (sourceClass === "garment" && ["top", "bottom", "outerwear"].includes(candidateClass)) return true;
  if (candidateClass === "garment" && ["top", "bottom", "outerwear"].includes(sourceClass)) return true;
  return false;
}

function productMatchesSourceClass(product: SearchCatalogProduct, sourceClass: ProductVisualClass): boolean {
  if (sourceClass === "unknown") return true;
  const classes = getCatalogProductVisualClasses(product);
  if (classes.includes("unknown")) return true;
  return classes.some((candidateClass) => areVisualClassesCompatible(sourceClass, candidateClass));
}

function scoreVisualMatch(product: SearchCatalogProduct, source: ImageFeature, candidate: ImageFeature): number {
  const colorDistance = Math.sqrt(
    Math.pow(source.r - candidate.r, 2) +
      Math.pow(source.g - candidate.g, 2) +
      Math.pow(source.b - candidate.b, 2)
  );
  const hashDistance = hammingDistance(source.hash, candidate.hash);
  const centerHashDistance = hammingDistance(source.centerHash, candidate.centerHash);
  const colorHistogramDelta = histogramDistance(source.colorHistogram, candidate.colorHistogram);
  const centerHistogramDelta = histogramDistance(source.centerHistogram, candidate.centerHistogram);
  const luminanceHistogramDelta = histogramDistance(source.histogram, candidate.histogram);
  const rowShapeDistance = profileDistance(source.rowProfile, candidate.rowProfile);
  const colShapeDistance = profileDistance(source.colProfile, candidate.colProfile);
  const shapeProfileDistance = rowShapeDistance * 0.58 + colShapeDistance * 0.42;
  const aspectRatioDistance = Math.abs(Math.log(Math.max(0.12, source.aspect) / Math.max(0.12, candidate.aspect)));
  const saturationDistance = Math.abs(source.saturation - candidate.saturation);
  const fillDistance = Math.abs(source.cropFill - candidate.cropFill);
  const varianceDistance = Math.abs(source.variance - candidate.variance);
  const foregroundDistance = Math.abs(source.foregroundCoverage - candidate.foregroundCoverage);
  const backgroundRemovalDistance = Math.abs(source.backgroundRemoved - candidate.backgroundRemoved);
  const colorPurityDistance = Math.abs(source.dominantColorPurity - candidate.dominantColorPurity);
  const edgeDistance = Math.abs(source.edgeBalance - candidate.edgeBalance) / 64;

  // Weights calibrated to be robust against catalog image padding/crop differences.
  // colorHistogram and centerHash carry the most signal; variance and shapeProfile
  // are too sensitive to background removal quality so they are down-weighted.
  let score =
    1000 -
    colorDistance * 0.72 -
    hashDistance * 5.4 -
    centerHashDistance * 7.2 -
    colorHistogramDelta * 240 -
    centerHistogramDelta * 200 -
    luminanceHistogramDelta * 90 -
    shapeProfileDistance * 140 -     // was 280 — too punishing for differently-cropped catalog images
    aspectRatioDistance * 160 -      // was 235 — relaxed, aspect alone should not kill a match
    saturationDistance * 72 -
    fillDistance * 80 -              // was 120 — fill varies a lot between studio shots
    varianceDistance * 90 -          // was 180 — variance is too noisy across different backgrounds
    foregroundDistance * 60 -
    backgroundRemovalDistance * 50 -
    colorPurityDistance * 46 -
    edgeDistance * 80;

  const sourceFamily = getVisualFamily(source);
  const candidateFamily = getVisualFamily(candidate);
  const productFamily = getCatalogProductFamily(product);
  const sourceClass = inferImageVisualClass(source);
  const candidateClass = inferImageVisualClass(candidate);

  if (sourceFamily !== "unknown" && candidateFamily !== "unknown" && sourceFamily !== candidateFamily) {
    // Only penalize hard for shoe vs non-shoe, not for other family mismatches
    score -= sourceFamily === "shoe" || candidateFamily === "shoe" ? 200 : 80;
  }

  if (!areVisualClassesCompatible(sourceClass, candidateClass)) {
    score -= sourceClass === "shoe" || candidateClass === "shoe" ? 240 : 130;
  } else if (sourceClass !== "unknown" && candidateClass !== "unknown") {
    score += sourceClass === candidateClass ? 65 : 28;
  }

  if (!productMatchesSourceClass(product, sourceClass)) {
    score -= sourceClass === "shoe" ? 280 : 160;
  }

  if (sourceFamily === "shoe" && productFamily === "garment") score -= 220;
  if (sourceFamily === "garment" && productFamily === "shoe") score -= 220;

  const sourceTokens = inferVisualTokens(source);
  const candidateTokens = inferVisualTokens(candidate);
  const sharedColor = sourceTokens.some((token) => candidateTokens.includes(token));
  if (sourceTokens.length && candidateTokens.length && !sharedColor) score -= 95;
  if (sharedColor) score += 38;

  if (aspectRatioDistance > 0.52) score -= 85;    // was 0.48 / 125 — too aggressive
  if (shapeProfileDistance > 0.38) score -= 70;   // was 0.34 / 115
  if (foregroundDistance > 0.38) score -= 45;     // was 0.32 / 70
  if (hashDistance > 30 && centerHashDistance > 26) score -= 60; // was 27/23/90

  return Math.max(0, Math.min(1000, score));
}
function mapCatalogProductToSearchProduct(product: SearchCatalogProduct): SearchProduct {
  const subtitleParts = [product.brand, product.gender, product.kind || product.category]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const allImages = getCatalogProductImages(product);
  const image =
    typeof product.image === "string" && product.image.trim()
      ? product.image.trim()
      : Array.isArray(product.images) && typeof product.images[0] === "string"
      ? product.images[0]
      : allImages[0];

  const slug = String(product.slug || product.id || "").trim();
  const href = slug ? `/product/${slug}` : `/products?q=${encodeURIComponent(String(product.title || product.name || ""))}`;

  return {
    id: String(product.id || slug || product.title || Math.random()),
    title: String(product.title || product.name || "Producto"),
    subtitle: subtitleParts.join(" · "),
    image,
    price: formatMoney(product.price),
    compareAt: formatMoney(product.compareAt || product.compare_at),
    href,
  };
}

type SessionUser = {
  id?: string;
  email?: string;
  role?: string;
  profile?: any | null;
};

const RECENTS_KEY = "jusp_search_recents_v1";
const IMAGE_FEATURE_CACHE_PREFIX = "jusp_visual_feature_v5:";
const IMAGE_FEATURE_CACHE_LIMIT = 420;
const VISUAL_INDEX_VERSION = "v5-bg-clean-product-id";


function getStableProductKey(product: SearchCatalogProduct): string {
  return String(product.id || product.slug || product.sku || product.title || product.name || "product").trim();
}

function getCatalogVisualSignature(catalog: SearchCatalogProduct[]): string {
  const compact = catalog
    .map((product) => getStableProductKey(product) + ":" + getCatalogProductImages(product).slice(0, 4).join("|"))
    .join("//");
  let hash = 0;
  for (let i = 0; i < compact.length; i += 1) {
    hash = (hash * 31 + compact.charCodeAt(i)) >>> 0;
  }
  return VISUAL_INDEX_VERSION + ":" + catalog.length + ":" + hash.toString(36);
}

function isImageFeatureLike(value: unknown): value is ImageFeature {
  if (!value || typeof value !== "object") return false;
  const feature = value as ImageFeature;
  return (
    typeof feature.r === "number" &&
    typeof feature.g === "number" &&
    typeof feature.b === "number" &&
    typeof feature.hash === "string" &&
    typeof feature.centerHash === "string" &&
    Array.isArray(feature.histogram) &&
    Array.isArray(feature.colorHistogram) &&
    Array.isArray(feature.rowProfile) &&
    Array.isArray(feature.colProfile)
  );
}

function getImageFeatureStorageKey(src: string): string {
  let hash = 0;
  for (let i = 0; i < src.length; i += 1) {
    hash = (hash * 33 + src.charCodeAt(i)) >>> 0;
  }
  return IMAGE_FEATURE_CACHE_PREFIX + hash.toString(36);
}

function readStoredImageFeature(src: string): ImageFeature | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(getImageFeatureStorageKey(src));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { version?: string; feature?: unknown };
    if (parsed?.version !== VISUAL_INDEX_VERSION || !isImageFeatureLike(parsed.feature)) return undefined;
    return parsed.feature;
  } catch {
    return undefined;
  }
}

function writeStoredImageFeature(src: string, feature: ImageFeature | null) {
  if (typeof window === "undefined" || !feature) return;
  try {
    window.localStorage.setItem(
      getImageFeatureStorageKey(src),
      JSON.stringify({ version: VISUAL_INDEX_VERSION, savedAt: Date.now(), feature })
    );
  } catch {
    try {
      const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(IMAGE_FEATURE_CACHE_PREFIX));
      keys.slice(0, Math.max(1, keys.length - IMAGE_FEATURE_CACHE_LIMIT + 24)).forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch {}
      });
      window.localStorage.setItem(
        getImageFeatureStorageKey(src),
        JSON.stringify({ version: VISUAL_INDEX_VERSION, savedAt: Date.now(), feature })
      );
    } catch {}
  }
}

function getScoreThreshold(sourceClass: ProductVisualClass, deep: boolean) {
  // Thresholds lowered — original values were filtering too many valid matches
  // because scoreVisualMatch with the old weights rarely reached 535+
  if (sourceClass === "shoe") return deep ? 420 : 460;
  if (sourceClass === "top" || sourceClass === "bottom" || sourceClass === "outerwear") return deep ? 380 : 420;
  if (sourceClass === "accessory") return deep ? 360 : 400;
  return deep ? 350 : 385;
}

function getMatchLabel(score: number): SearchProduct["matchLabel"] {
  // Adjusted to match recalibrated score ranges (max ~850 instead of 1000)
  if (score >= 700) return "Exacto";
  if (score >= 520) return "Muy similar";
  return "Similar";
}

function getVisualSearchFallbackResults(
  catalog: SearchCatalogProduct[],
  sourceFeature: ImageFeature,
  limit = 12
): SearchProduct[] {
  const sourceClass = inferImageVisualClass(sourceFeature);
  const sourceColors = inferVisualTokens(sourceFeature);

  return catalog
    .map((product) => {
      const images = getCatalogProductImages(product);
      const haystack = buildSearchHaystack(product);
      const productClasses = getCatalogProductVisualClasses(product);
      let score = images.length ? 120 : 0;

      if (productMatchesSourceClass(product, sourceClass)) score += 420;
      else if (sourceClass !== "unknown" && !productClasses.includes("unknown")) score -= 260;

      for (const color of sourceColors) {
        if (haystack.includes(color)) score += 55;
      }

      if (images.length >= 2) score += 35;
      if (hasPositiveMoney(product.price)) score += 20;

      return { product, score };
    })
    .filter((entry) => entry.score > 0 && getCatalogProductImages(entry.product).length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => {
      const mapped = mapCatalogProductToSearchProduct(entry.product);
      return {
        ...mapped,
        matchScore: Math.max(330, Math.min(620, Math.round(entry.score))),
        matchLabel: "Similar" as const,
      };
    });
}

function safeLoadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === "string").slice(0, 8);
  } catch {
    return [];
  }
}

function safeSaveRecent(q: string) {
  const s = q.trim();
  if (!s) return;
  try {
    const prev = safeLoadRecents();
    const next = [s, ...prev.filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, 8);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {}
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickAccountLabel(user: SessionUser | null) {
  const prof = user?.profile ?? null;
  const email = typeof user?.email === "string" ? user.email : "";
  const segment = prof && typeof prof?.segment === "string" ? String(prof.segment) : "";
  if (segment)
    return segment === "hombre"
      ? "Hombre"
      : segment === "mujer"
      ? "Mujer"
      : segment === "ninos"
      ? "Niños"
      : "Cuenta";
  if (email) return email.length > 22 ? `${email.slice(0, 20)}…` : email;
  return "Mi cuenta";
}

function isFridayInSantiago(now = new Date()) {
  try {
    const weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "America/Santiago",
    }).format(now);

    return weekday.toLowerCase().startsWith("fri");
  } catch {
    return now.getDay() === 5;
  }
}

function DrawerIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: "jusp-mdrawer-ico",
  } as const;

  switch (name) {
    case "search":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M10.5 18.5a8 8 0 1 1 5.66-2.34l4.09 4.09a1 1 0 0 1-1.41 1.41l-4.09-4.09A7.97 7.97 0 0 1 10.5 18.5Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "hombre":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M14.5 5h4.5v4.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 5l-5.1 5.1"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 10.5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "mujer":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 3.5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13.5v7"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9.5 18h5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "ninos":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M8.5 10.5a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 11.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.8 20a4.7 4.7 0 0 1 9.4 0"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.2 19.8a3.9 3.9 0 0 1 7 0"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "colecciones":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 2.8 20 7.1v9.8L12 21.2 4 16.9V7.1L12 2.8Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 7.1l8 4.4 8-4.4"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 11.5v9.7"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.6 5.1 15.4 8.8"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.65"
          />
        </svg>
      );
    case "snkrs":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M4.5 16.2c2.3-2.4 4.4-2 6.5-1.2c2.2.9 4.3 1.6 6.9-1.2c.8-.8 1.8-1.3 3.2-1.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 18.8h12.7c1.4 0 2.3-.9 2.3-2.2V12"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 16.2V12.5c0-2.3 1.2-4 3.6-4.7"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "accesorios":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M8 7V6a4 4 0 0 1 8 0v1"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 9h12l-1 11H7L6 9Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 12v1M15 12v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "exclusivo":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 3l2.3 6.1L21 9.8l-5 4.1L17.7 21L12 17.6L6.3 21L8 13.9l-5-4.1l6.7-.7L12 3Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "ofertas":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M20 13l-7 7a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1-.6-1.4V6a2 2 0 0 1 2-2h6.2a2 2 0 0 1 1.4.6L20 11.8A2 2 0 0 1 20 13Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M7.5 7.5h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );
    case "drophype":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 3l2.2 4.9 5.3.5-4 3.7 1.1 5.2L12 14.8 7.4 17.3l1.1-5.2-4-3.7 5.3-.5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 12h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function iconNameForKey(key: Exclude<MegaKey, null>, label: string): string {
  if (key === "hombre") return "hombre";
  if (key === "mujer") return "mujer";
  if (key === "ninos") return "ninos";
  if (key === "snkrs") return "snkrs";
  if (key === "accesorios") return "accesorios";
  if (key === "exclusivo") return "exclusivo";
  if (key === "ofertas") return "ofertas";
  if (key === "drophype") return "drophype";
  if (label.toLowerCase().includes("colecciones") || key === "jordan") return "colecciones";
  return "colecciones";
}

export default function Header() {
  const { cartCount, openCart, closePanel, state } = useStore();

  const prevCartCount = useRef<number>(cartCount);
  const [cartBump, setCartBump] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleCartPanel = () => {
    if (state.ui.panel === "cart") {
      closePanel();
      return;
    }
    openCart();
  };

  useEffect(() => {
    const prev = prevCartCount.current;
    prevCartCount.current = cartCount;
    if (cartCount > prev) {
      setCartBump(true);
      const t = window.setTimeout(() => setCartBump(false), 260);
      return () => window.clearTimeout(t);
    }
  }, [cartCount]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [active, setActive] = useState<MegaKey>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageSearchInputRef = useRef<HTMLInputElement | null>(null);
  const imageFeatureCacheRef = useRef<Map<string, ImageFeature | null>>(new Map());
  const visualIndexRef = useRef<{ signature: string; entries: CatalogVisualIndexEntry[]; deep: boolean } | null>(null);
  const lastImageFileRef = useRef<File | null>(null);
  const [imageSearchLabel, setImageSearchLabel] = useState("");
  const [imageSearchMode, setImageSearchMode] = useState<"idle" | "image" | "error">("idle");
  const [imageSearchCanDeep, setImageSearchCanDeep] = useState(false);
  const [imageSearchIndexedCount, setImageSearchIndexedCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const lastReq = useRef(0);
  const lastImageReq = useRef(0);
  const searchAbortRef = useRef<AbortController | null>(null);
  const catalogRef = useRef<SearchCatalogProduct[] | null>(null);

  const [accountOpen, setAccountOpen] = useState(false);

  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const isAuthed = !!user && user?.profile !== undefined;
  const hasProfile = !!user && user?.profile != null;
  const accountTitle = useMemo(() => pickAccountLabel(user), [user]);
  const [dropHypeFriday, setDropHypeFriday] = useState(false);

  useEffect(() => {
    setDropHypeFriday(isFridayInSantiago());
  }, []);

  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setIsCoarsePointer(!!mq.matches);
    apply();
    try {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } catch {
      mq.addListener(apply);
      return () => mq.removeListener(apply);
    }
  }, []);

  const accountCloseT = useRef<number | null>(null);
  const cancelAccountClose = () => {
    if (accountCloseT.current) {
      window.clearTimeout(accountCloseT.current);
      accountCloseT.current = null;
    }
  };
  const scheduleAccountClose = () => {
    cancelAccountClose();
    accountCloseT.current = window.setTimeout(() => setAccountOpen(false), 220);
  };

  const closeTimerRef = useRef<number | null>(null);
  const cancelHoverClose = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleHoverClose = () => {
    cancelHoverClose();
    closeTimerRef.current = window.setTimeout(() => {
      setActive(null);
    }, 260);
  };

  const [mobileOpen, setMobileOpen] = useState(false);

  const cartSwipeStartYRef = useRef<number | null>(null);
  const cartSwipeStartXRef = useRef<number | null>(null);
  const cartSwipeLockedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    if (!isTouchDevice) return;

    const cartSwipeSelector = [
      "[data-cart-sheet]",
      "[data-cart-drawer]",
      "[data-cart-panel]",
      "[data-cart]",
      ".jusp-cart-sheet",
      ".jusp-cart-drawer",
      ".jusp-cart-panel",
      ".cart-sheet",
      ".cart-drawer",
      ".cart-panel",
      "[aria-label*='carrito' i]",
      "[aria-labelledby*='carrito' i]",
      "[id*='cart' i]",
    ].join(",");

    const getCartTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      return target.closest(cartSwipeSelector);
    };

    const resetSwipe = () => {
      cartSwipeStartYRef.current = null;
      cartSwipeStartXRef.current = null;
      cartSwipeLockedRef.current = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      const cartTarget = getCartTarget(event.target);
      if (!cartTarget) {
        resetSwipe();
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      cartSwipeStartYRef.current = touch.clientY;
      cartSwipeStartXRef.current = touch.clientX;
      cartSwipeLockedRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (cartSwipeStartYRef.current == null || cartSwipeStartXRef.current == null || cartSwipeLockedRef.current) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - cartSwipeStartYRef.current;
      const deltaX = Math.abs(touch.clientX - cartSwipeStartXRef.current);

      if (deltaY > 72 && deltaX < 44) {
        cartSwipeLockedRef.current = true;
        openCart();
        resetSwipe();
      }
    };

    const onTouchEnd = () => {
      resetSwipe();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [openCart]);

  const menus: MegaConfig[] = useMemo(
    () => [
      {
        label: "Hombre",
        href: "/products?cat=hombre",
        key: "hombre",
        columns: [
          {
            title: "Destacados",
            items: [
              { label: "Lo nuevo", href: "/products?cat=hombre&tag=nuevo" },
              { label: "Trending hoy", href: "/products?cat=hombre&tag=trending" },
              { label: "Best sellers", href: "/products?cat=hombre&tag=bestseller" },
              { label: "Ofertas", href: "/products?cat=hombre&tag=ofertas" },
            ],
          },
          {
            title: "Zapatillas",
            items: [
              { label: "Lifestyle", href: "/products?cat=hombre&sub=zapatillas&sport=lifestyle" },
              { label: "Running", href: "/products?cat=hombre&sub=zapatillas&sport=running" },
              { label: "Training", href: "/products?cat=hombre&sub=zapatillas&sport=training" },
              { label: "Fútbol", href: "/products?cat=hombre&sub=zapatillas&sport=futbol" },
            ],
          },
          {
            title: "Ropa",
            items: [
              { label: "Poleras", href: "/products?cat=hombre&sub=ropa&kind=poleras" },
              { label: "Pantalones", href: "/products?cat=hombre&sub=ropa&kind=pantalones" },
              { label: "Shorts", href: "/products?cat=hombre&sub=ropa&kind=shorts" },
              { label: "Chaquetas", href: "/products?cat=hombre&sub=ropa&kind=chaquetas" },
            ],
          },
          {
            title: "Comprar por deporte",
            items: [
              { label: "Running", href: "/products?cat=hombre&sport=running" },
              { label: "Gym", href: "/products?cat=hombre&sport=gym" },
              { label: "Outdoor", href: "/products?cat=hombre&sport=outdoor" },
              { label: "Básquetbol", href: "/products?cat=hombre&sport=basquet" },
            ],
          },
        ],
      },
      {
        label: "Mujer",
        href: "/products?cat=mujer",
        key: "mujer",
        columns: [
          {
            title: "Destacados",
            items: [
              { label: "Lo nuevo", href: "/products?cat=mujer&tag=nuevo" },
              { label: "Trending hoy", href: "/products?cat=mujer&tag=trending" },
              { label: "Best sellers", href: "/products?cat=mujer&tag=bestseller" },
              { label: "Ofertas", href: "/products?cat=mujer&tag=ofertas" },
            ],
          },
          {
            title: "Zapatillas",
            items: [
              { label: "Lifestyle", href: "/products?cat=mujer&sub=zapatillas&sport=lifestyle" },
              { label: "Running", href: "/products?cat=mujer&sub=zapatillas&sport=running" },
              { label: "Training", href: "/products?cat=mujer&sub=zapatillas&sport=training" },
              { label: "Tennis", href: "/products?cat=mujer&sub=zapatillas&sport=tennis" },
            ],
          },
          {
            title: "Ropa",
            items: [
              { label: "Tops", href: "/products?cat=mujer&sub=ropa&kind=tops" },
              { label: "Leggings", href: "/products?cat=mujer&sub=ropa&kind=leggings" },
              { label: "Shorts", href: "/products?cat=mujer&sub=ropa&kind=shorts" },
              { label: "Chaquetas", href: "/products?cat=mujer&sub=ropa&kind=chaquetas" },
            ],
          },
          {
            title: "Comprar por deporte",
            items: [
              { label: "Running", href: "/products?cat=mujer&sport=running" },
              { label: "Gym", href: "/products?cat=mujer&sport=gym" },
              { label: "Yoga", href: "/products?cat=mujer&sport=yoga" },
              { label: "Outdoor", href: "/products?cat=mujer&sport=outdoor" },
            ],
          },
        ],
      },
      {
        label: "Niños",
        href: "/products?cat=ninos",
        key: "ninos",
        columns: [
          {
            title: "Destacados",
            items: [
              { label: "Lo nuevo", href: "/products?cat=ninos&tag=nuevo" },
              { label: "Zapatillas cole", href: "/products?cat=ninos&tag=escolares" },
              { label: "Ofertas", href: "/products?cat=ninos&tag=ofertas" },
              { label: "Ropa deportiva", href: "/products?cat=ninos&tag=deporte" },
            ],
          },
          {
            title: "Zapatillas",
            items: [
              { label: "Lifestyle", href: "/products?cat=ninos&sub=zapatillas&sport=lifestyle" },
              { label: "Running", href: "/products?cat=ninos&sub=zapatillas&sport=running" },
              { label: "Fútbol", href: "/products?cat=ninos&sub=zapatillas&sport=futbol" },
              { label: "Sandalias", href: "/products?cat=ninos&sub=zapatillas&sport=sandalias" },
            ],
          },
          {
            title: "Ropa",
            items: [
              { label: "Poleras", href: "/products?cat=ninos&sub=ropa&kind=poleras" },
              { label: "Pantalones", href: "/products?cat=ninos&sub=ropa&kind=pantalones" },
              { label: "Shorts", href: "/products?cat=ninos&sub=ropa&kind=shorts" },
              { label: "Buzos", href: "/products?cat=ninos&sub=ropa&kind=buzos" },
            ],
          },
          {
            title: "Accesorios",
            items: [
              { label: "Mochilas", href: "/products?cat=ninos&sub=accesorios&kind=mochilas" },
              { label: "Gorras", href: "/products?cat=ninos&sub=accesorios&kind=gorras" },
              { label: "Calcetines", href: "/products?cat=ninos&sub=accesorios&kind=calcetines" },
              { label: "Balones", href: "/products?cat=ninos&sub=accesorios&kind=balones" },
            ],
          },
        ],
      },
      {
        label: "Accesorios",
        href: "/products?cat=accesorios",
        key: "accesorios",
        columns: [
          {
            title: "Esenciales",
            items: [
              { label: "Gorras", href: "/products?cat=accesorios&kind=gorras" },
              { label: "Bolsos", href: "/products?cat=accesorios&kind=bolsos" },
              { label: "Calcetines", href: "/products?cat=accesorios&kind=calcetines" },
              { label: "Mochilas", href: "/products?cat=accesorios&kind=mochilas" },
            ],
          },
          {
            title: "Premium",
            items: [
              { label: "Leather / cuero", href: "/products?cat=accesorios&tag=cuero" },
              { label: "Edición limitada", href: "/products?cat=accesorios&tag=limited" },
              { label: "Best sellers", href: "/products?cat=accesorios&tag=bestseller" },
              { label: "Novedades", href: "/products?cat=accesorios&tag=nuevo" },
            ],
          },
        ],
      },
      {
        label: "Ofertas",
        href: "/products?cat=ofertas",
        key: "ofertas",
        highlight: true,
        columns: [
          {
            title: "Top deals",
            items: [
              { label: "Hasta -50%", href: "/products?cat=ofertas&tag=50" },
              { label: "Zapatillas", href: "/products?cat=ofertas&sub=zapatillas" },
              { label: "Ropa", href: "/products?cat=ofertas&sub=ropa" },
              { label: "Accesorios", href: "/products?cat=ofertas&sub=accesorios" },
            ],
          },
          {
            title: "Compra rápida",
            items: [
              { label: "Trending en oferta", href: "/products?cat=ofertas&tag=trending" },
              { label: "Best sellers", href: "/products?cat=ofertas&tag=bestseller" },
              { label: "Novedades", href: "/products?cat=ofertas&tag=nuevo" },
              { label: "Últimas unidades", href: "/products?cat=ofertas&tag=last" },
            ],
          },
        ],
      },
      ...(dropHypeFriday
        ? [
            {
              label: "Drop-Hype",
              href: isAuthed ? "/drops" : "/login?next=%2Fdrops",
              key: "drophype" as const,
              highlight: true,
              columns: [
                {
                  title: "Flash 24H",
                  items: [
                    {
                      label: isAuthed ? "Entrar al Drop-Hype" : "Iniciar sesión para entrar",
                      href: isAuthed ? "/drops" : "/login?next=%2Fdrops",
                    },
                    { label: "Solo disponible los viernes", href: isAuthed ? "/drops" : "/login?next=%2Fdrops" },
                    { label: "Productos flash 24H", href: isAuthed ? "/drops" : "/login?next=%2Fdrops" },
                    { label: "Acceso con tu cuenta", href: isAuthed ? "/drops" : "/login?next=%2Fdrops" },
                  ],
                },
              ],
            },
          ]
        : []),
    ],
    [dropHypeFriday, isAuthed]
  );

  const activeMenu = useMemo(() => menus.find((m) => m.key === active) || null, [menus, active]);

  const suggestions: Suggestion[] = useMemo(() => {
    const trimmed = q.trim();
    const lower = trimmed.toLowerCase();
    const quick: Suggestion[] = [
      { kind: "quick", label: "Dunk", href: "/products?q=dunk" },
      { kind: "quick", label: "Air Force 1", href: "/products?q=air%20force%201" },
      { kind: "quick", label: "Air Max", href: "/products?q=air%20max" },
      { kind: "quick", label: "Colecciones", href: "/products?cat=colecciones" },
      { kind: "quick", label: "Exclusivo", href: "/products?cat=exclusivo" },
    ];
    const rec: Suggestion[] = recents.map((r) => ({
      kind: "recent",
      label: r,
      href: `/products?q=${encodeURIComponent(r)}`,
    }));
    if (!trimmed) return [...rec, ...quick].slice(0, 8);
    const tokens = [
      trimmed,
      `${trimmed} hombre`,
      `${trimmed} mujer`,
      `${trimmed} niños`,
      `${trimmed} premium`,
      `${trimmed} original`,
    ]
      .map((x) => x.trim())
      .filter((x, i, arr) => arr.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
    const sug: Suggestion[] = tokens.map((t) => ({
      kind: "suggest",
      label: t,
      href: `/products?q=${encodeURIComponent(t)}`,
    }));
    const recMatch = rec.filter((x) => x.label.toLowerCase().includes(lower));
    const merged = [...recMatch, ...sug, ...quick].slice(0, 10);
    const seen = new Set<string>();
    return merged.filter((x) => {
      const k = x.href;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [q, recents]);

  function openSearch() {
    setSearchOpen(true);
    setActive(null);
    setAccountOpen(false);
    setMobileOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
    void loadCatalog().catch(() => undefined);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQ("");
    setProducts([]);
    setImageSearchLabel("");
    setImageSearchMode("idle");
    setLoading(false);
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
  }

  function submitSearch(text: string) {
    const s = text.trim();
    if (!s) return;
    setImageSearchLabel("");
    setImageSearchMode("idle");
    safeSaveRecent(s);
    setRecents(safeLoadRecents());
    window.location.href = `/products?q=${encodeURIComponent(s)}`;
  }

  function openImageSearchPicker() {
    imageSearchInputRef.current?.click();
  }

  async function loadCatalog(signal?: AbortSignal): Promise<SearchCatalogProduct[]> {
    if (catalogRef.current) return catalogRef.current;
    const res = await fetch(`/api/products?__search=${Date.now()}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new Error("catalog_fetch_failed");
    const json = await res.json();
    const items = Array.isArray(json) ? json : Array.isArray(json?.products) ? json.products : [];
    catalogRef.current = items;
    return items;
  }

  async function fetchProducts(query: string) {
    const s = query.trim();
      if (!s) {
        if (imageSearchLabel) {
          setLoading(false);
          return;
        }
        setProducts([]);
        setImageSearchLabel("");
        setImageSearchMode("idle");
        setLoading(false);
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
        searchAbortRef.current = null;
      }
      return;
    }

    if (searchAbortRef.current) searchAbortRef.current.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;
    const reqId = Date.now();
    lastReq.current = reqId;
    setLoading(true);

    try {
      const catalog = await loadCatalog(ctrl.signal);
      if (ctrl.signal.aborted || lastReq.current !== reqId) return;

      const ranked = catalog
        .map((product) => ({
          product,
          score: scoreCatalogProduct(product, s),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((entry) => mapCatalogProductToSearchProduct(entry.product));

      if (ctrl.signal.aborted || lastReq.current !== reqId) return;
      setProducts(ranked);
    } catch {
      if (ctrl.signal.aborted || lastReq.current !== reqId) return;
      setProducts([]);
    } finally {
      if (!ctrl.signal.aborted && lastReq.current === reqId) setLoading(false);
    }
  }

  async function getCachedImageFeature(src: string): Promise<ImageFeature | null> {
    const cached = imageFeatureCacheRef.current.get(src);
    if (cached !== undefined) return cached;

    const stored = readStoredImageFeature(src);
    if (stored !== undefined) {
      imageFeatureCacheRef.current.set(src, stored);
      return stored;
    }

    for (const source of getImageAnalysisSources(src)) {
      try {
        const img = await loadImageElement(source, "anonymous");
        const feature = computeImageFeatureFromImage(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        if (feature) {
          imageFeatureCacheRef.current.set(src, feature);
          writeStoredImageFeature(src, feature);
          return feature;
        }
      } catch {}
    }

    imageFeatureCacheRef.current.set(src, null);
    return null;
  }

  async function buildCatalogVisualIndex(catalog: SearchCatalogProduct[], deep: boolean): Promise<CatalogVisualIndexEntry[]> {
    const signature = getCatalogVisualSignature(catalog);
    const cachedIndex = visualIndexRef.current;
    if (cachedIndex && cachedIndex.signature === signature && (cachedIndex.deep || !deep)) {
      setImageSearchIndexedCount(cachedIndex.entries.reduce((count, entry) => count + entry.features.length, 0));
      return cachedIndex.entries;
    }

    const productsWithImages = catalog
      .map((product) => ({ product, images: getCatalogProductImages(product) }))
      .filter((entry) => entry.images.length > 0);

    const imageLimit = deep ? 12 : 4;
    const entries = await mapWithConcurrency(productsWithImages, deep ? 4 : 7, async (entry) => {
      const uniqueImages = entry.images.slice(0, imageLimit);
      const features: CatalogVisualIndexEntry["features"] = [];

      for (let imageIndex = 0; imageIndex < uniqueImages.length; imageIndex += 1) {
        const src = uniqueImages[imageIndex];
        const feature = await getCachedImageFeature(src);
        if (feature) features.push({ src, feature, imageIndex });
      }

      return {
        product: entry.product,
        images: entry.images,
        features,
        primaryFeature: features[0]?.feature ?? null,
      };
    });

    const validEntries = entries.filter((entry) => entry.features.length > 0);
    visualIndexRef.current = { signature, entries: validEntries, deep };
    setImageSearchIndexedCount(validEntries.reduce((count, entry) => count + entry.features.length, 0));
    return validEntries;
  }

  function rankIndexedProducts(
    entries: CatalogVisualIndexEntry[],
    sourceFeature: ImageFeature,
    options: { deep: boolean; limit?: number; intent?: VisualIntent }
  ): RankedVisualProduct[] {
    const sourceVisualClass = inferImageVisualClass(sourceFeature);
    const threshold = getScoreThreshold(sourceVisualClass, options.deep);

    return entries
      .map((entry) => {
        let bestScore = 0;
        let bestImageIndex = 0;
        let bestFeature: ImageFeature | null = null;
        let confirmationHits = 0;

        for (const item of entry.features) {
          const rawScore = scoreVisualMatch(entry.product, sourceFeature, item.feature);
          const classCompatible = productMatchesSourceClass(entry.product, sourceVisualClass);
          const primaryBoost = item.imageIndex === 0 ? 22 : item.imageIndex <= 2 ? 12 : 0;
          const classBoost = classCompatible ? 52 : -180; // was -220, slightly relaxed
          const score = Math.max(0, Math.min(1000, rawScore + primaryBoost + classBoost));

          if (score >= threshold - 60) confirmationHits += 1;
          if (score > bestScore) {
            bestScore = score;
            bestImageIndex = item.imageIndex;
            bestFeature = item.feature;
          }
        }

        const catalogClasses = getCatalogProductVisualClasses(entry.product);
        if (!catalogClasses.includes("unknown") && !productMatchesSourceClass(entry.product, sourceVisualClass)) {
          bestScore -= sourceVisualClass === "shoe" || catalogClasses.includes("shoe") ? 200 : 110;
        }

        // Hybrid boost: add intent affinity score (capped) on top of visual score
        if (options.intent) {
          const intentScore = scoreIntentMatch(entry.product, options.intent);
          // Cap intent contribution to avoid it overriding visual mismatch
          bestScore += Math.max(-40, Math.min(80, intentScore * 0.55));
        }

        if (confirmationHits >= 2) bestScore += options.deep ? 35 : 22;
        if (bestImageIndex === 0) bestScore += 12;

        return {
          product: entry.product,
          images: entry.images,
          score: Math.max(0, Math.min(1000, bestScore)),
          bestImageIndex,
          bestFeature,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit ?? entries.length);
  }

  async function runImageSearch(file: File, options: { deep?: boolean } = {}) {
    if (!file.type.startsWith("image/")) {
      setImageSearchLabel("Archivo no compatible");
      setImageSearchMode("error");
      setImageSearchCanDeep(false);
      setProducts([]);
      return;
    }

    const deep = !!options.deep;
    const reqId = Date.now();
    lastImageReq.current = reqId;
    lastImageFileRef.current = file;
    setQ("");
    setImageSearchLabel(deep ? file.name + " · precisión alta" : file.name);
    setImageSearchMode("image");
    setImageSearchCanDeep(false);
    setProducts([]);
    setLoading(true);

    try {
      const [catalog, sourceFeature] = await Promise.all([loadCatalog(), computeImageFeatureFromFile(file)]);
      if (lastImageReq.current !== reqId) return;
      if (!sourceFeature) {
        setProducts([]);
        setImageSearchMode("error");
        return;
      }

      const intent = inferIntentFromImage(file.name, sourceFeature);
      const sourceVisualClass = inferImageVisualClass(sourceFeature);
      const quickIndex = await buildCatalogVisualIndex(catalog, false);
      if (lastImageReq.current !== reqId) return;

      if (!quickIndex.length) {
        const fallbackMatches = getVisualSearchFallbackResults(catalog, sourceFeature, 12);
        setProducts(fallbackMatches);
        setImageSearchCanDeep(false);
        if (!fallbackMatches.length) setImageSearchMode("error");
        return;
      }

      const quickRank = rankIndexedProducts(quickIndex, sourceFeature, { deep: false, intent });
      const sameFamilyQuick = quickRank.filter((entry) => productMatchesSourceClass(entry.product, sourceVisualClass));
      const quickPool = (sameFamilyQuick.length >= 10 ? sameFamilyQuick : quickRank)
        .filter((entry) => entry.score >= 240) // was 280 — lowered to not lose valid matches early
        .slice(0, deep ? Math.min(54, Math.max(18, Math.ceil(quickIndex.length * 0.24))) : Math.min(32, Math.max(12, Math.ceil(quickIndex.length * 0.16))));

      let rankSource = quickPool;

      if (deep) {
        const deepProducts = new Set(quickPool.map((entry) => getStableProductKey(entry.product)));
        const deepCatalog = catalog.filter((product) => deepProducts.has(getStableProductKey(product)));
        const deepIndex = await buildCatalogVisualIndex(deepCatalog.length ? deepCatalog : catalog, true);
        if (lastImageReq.current !== reqId) return;
        rankSource = rankIndexedProducts(deepIndex, sourceFeature, { deep: true, intent }).slice(0, 36);
      } else {
        const candidateProducts = new Set(quickPool.map((entry) => getStableProductKey(entry.product)));
        const candidateEntries = quickIndex.filter((entry) => candidateProducts.has(getStableProductKey(entry.product)));
        rankSource = rankIndexedProducts(candidateEntries, sourceFeature, { deep: false, intent }).slice(0, 24);
      }

      const threshold = getScoreThreshold(sourceVisualClass, deep);
      const strictMatches = rankSource
        .filter((entry) => entry.score >= threshold && productMatchesSourceClass(entry.product, sourceVisualClass))
        .sort((a, b) => b.score - a.score);

      const softMatches = rankSource
        .filter((entry) => entry.score >= threshold - 70 && productMatchesSourceClass(entry.product, sourceVisualClass))
        .sort((a, b) => b.score - a.score);

      const honestFallback = rankSource
        .filter((entry) => entry.score >= 260) // was 330 — lower to show something useful
        .sort((a, b) => b.score - a.score);

      const selected = strictMatches.length >= 4 ? strictMatches : softMatches.length >= 4 ? softMatches : honestFallback;

      let finalMatches: SearchProduct[] = selected.slice(0, 12).map((entry) => {
        const mapped = mapCatalogProductToSearchProduct(entry.product);
        const roundedScore = Math.round(entry.score);
        return {
          ...mapped,
          matchScore: roundedScore,
          matchLabel: getMatchLabel(roundedScore),
        };
      });

      if (!finalMatches.length) {
        finalMatches = getVisualSearchFallbackResults(catalog, sourceFeature, 12);
      }

      if (lastImageReq.current !== reqId) return;
      setProducts(finalMatches);
      setImageSearchCanDeep(!deep && finalMatches.length > 0 && quickIndex.length > 0);
    } catch {
      if (lastImageReq.current !== reqId) return;
      setProducts([]);
      setImageSearchMode("error");
      setImageSearchCanDeep(false);
    } finally {
      if (lastImageReq.current === reqId) setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    (async () => {
      setSessionLoading(true);
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: ctrl.signal,
        });
        const json = await safeJson(res);
        if (!alive) return;
        if (res.ok && json?.ok === true) {
          const u = (json?.user ?? {}) as SessionUser;
          setUser({
            id: u?.id,
            email: u?.email,
            role: u?.role,
            profile: u?.profile ?? null,
          });
        } else {
          setUser(null);
        }
      } catch {
        if (!alive) return;
        setUser(null);
      } finally {
        if (!alive) return;
        setSessionLoading(false);
      }
    })();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  async function doLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include", cache: "no-store" });
    } catch {
    } finally {
      setUser(null);
      setAccountOpen(false);
      setActive(null);
      setMobileOpen(false);
      setSearchOpen(false);
      window.location.assign("/login");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const initialQ = (params.get("q") || "").trim();
      if (initialQ) {
        setQ(initialQ);
        setSearchOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    } catch {}
  }, []);

  useEffect(() => {
    setRecents(safeLoadRecents());
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
        if (mobileOpen) setMobileOpen(false);
        setActive(null);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, mobileOpen]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchProducts(q);
    }, clamp(q.trim().length ? 140 : 220, 120, 260));
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    return () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, []);

  return (
    <header
      className={`jusp-header ${isScrolled ? "jusp-header-scrolled" : ""}`}
      onMouseEnter={cancelHoverClose}
      onMouseLeave={scheduleHoverClose}
    >
      <div className="jusp-header-inner">
        <Link href="/" className="jusp-logo" aria-label="JUSP Home">
          JUSP
        </Link>

        <nav className="jusp-nav" aria-label="Main" onMouseEnter={cancelHoverClose} onMouseLeave={scheduleHoverClose}>
          {menus.map((m) => (
            <div
              key={m.key}
              className="jusp-nav-item"
              onMouseEnter={() => setActive(m.key)}
              onFocus={() => setActive(m.key)}
              onMouseDown={cancelHoverClose}
            >
              <Link href={m.href} className={m.highlight ? "jusp-nav-link jusp-nav-sale" : "jusp-nav-link"}>
                {m.label}
              </Link>
            </div>
          ))}
        </nav>

        <div className="jusp-actions">
          <button className="jusp-icon jusp-search-ico-btn" onClick={openSearch} aria-label="Buscar (/)">
            ⌕<span className="sr-only">Buscar</span>
          </button>

          {!sessionLoading && isAuthed ? (
            <Link href="/favorites" className="jusp-icon" aria-label="Favoritos">
              ♡
            </Link>
          ) : null}

          <button
            type="button"
            className={`jusp-icon jusp-cart-ico ${cartBump ? "bump" : ""}`}
            aria-label="Carrito"
            onClick={toggleCartPanel}
            title="Carrito"
          >
            🛒
            {cartCount > 0 ? <span className="jusp-cart-badge">{cartCount}</span> : null}
          </button>

          <div
            className="jusp-account-wrap"
            onMouseEnter={() => {
              if (isCoarsePointer) return;
              cancelHoverClose();
              cancelAccountClose();
              setAccountOpen(true);
              setActive(null);
            }}
            onMouseLeave={() => {
              if (isCoarsePointer) return;
              scheduleAccountClose();
              scheduleHoverClose();
            }}
          >
            <button
              className={`jusp-icon jusp-account-ico ${accountOpen ? "active" : ""}`}
              aria-label="Mi cuenta"
              type="button"
              onClick={() => {
                if (isCoarsePointer) {
                  setAccountOpen((v) => !v);
                  setActive(null);
                  setMobileOpen(false);
                  setSearchOpen(false);
                }
              }}
            >
              <span className="jusp-ico-glyph" aria-hidden="true">
                👤
              </span>
              {!sessionLoading && isAuthed ? <span className="jusp-dot" aria-hidden="true" /> : null}
            </button>

            {accountOpen ? (
              <div
                className="jusp-account-mega"
                role="dialog"
                aria-label="Cuenta"
                onMouseEnter={() => {
                  if (isCoarsePointer) return;
                  cancelHoverClose();
                  cancelAccountClose();
                }}
                onMouseLeave={() => {
                  if (isCoarsePointer) return;
                  scheduleAccountClose();
                  scheduleHoverClose();
                }}
              >
                <div className="jusp-account-head">
                  <div className="jusp-account-title">Cuenta</div>
                  <button
                    className="jusp-account-close"
                    onClick={() => setAccountOpen(false)}
                    aria-label="Cerrar"
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                <div className="jusp-account-sub">
                  {sessionLoading ? (
                    <span className="jusp-account-chip muted">Verificando sesión…</span>
                  ) : isAuthed ? (
                    <span className="jusp-account-chip ok">{accountTitle}</span>
                  ) : (
                    <span className="jusp-account-chip muted">No has iniciado sesión</span>
                  )}
                  {!sessionLoading && isAuthed && !hasProfile ? (
                    <span className="jusp-account-chip warn">Falta completar perfil</span>
                  ) : null}
                </div>

                <div className="jusp-account-grid">
                  <div className="jusp-account-col">
                    <div className="jusp-account-coltitle">Acceso</div>

                    {!sessionLoading && !isAuthed ? (
                      <>
                        <Link className="jusp-account-link strong" href="/login" onClick={() => setAccountOpen(false)}>
                          Iniciar sesión
                        </Link>
                        <Link className="jusp-account-link" href="/register" onClick={() => setAccountOpen(false)}>
                          Registrarse
                        </Link>
                      </>
                    ) : null}

                    {!sessionLoading && isAuthed ? (
                      <>
                        <Link className="jusp-account-link strong" href="/account" onClick={() => setAccountOpen(false)}>
                          Mi cuenta
                        </Link>
                        {!hasProfile ? (
                          <Link className="jusp-account-link" href="/onboarding" onClick={() => setAccountOpen(false)}>
                            Terminar registro
                          </Link>
                        ) : null}
                        <Link className="jusp-account-link" href="/orders" onClick={() => setAccountOpen(false)}>
                          Mis pedidos
                        </Link>
                        <Link className="jusp-account-link" href="/mis-facturas" onClick={() => setAccountOpen(false)}>
                          Mis facturas
                        </Link>
                        <Link className="jusp-account-link" href="/mis-cupones" onClick={() => setAccountOpen(false)}>
                          Mis cupones
                        </Link>
                        {dropHypeFriday ? (
                          <Link className="jusp-account-link" href="/drops" onClick={() => setAccountOpen(false)}>
                            Drop-Hype del viernes
                          </Link>
                        ) : null}
                        <Link className="jusp-account-link" href="/favorites" onClick={() => setAccountOpen(false)}>
                          Favoritos
                        </Link>
                        <button
                          className="jusp-account-link danger"
                          type="button"
                          onClick={() => {
                            void doLogout();
                          }}
                        >
                          Cerrar sesión
                        </button>
                      </>
                    ) : null}

                    {sessionLoading ? (
                      <>
                        <span className="jusp-account-skel" />
                        <span className="jusp-account-skel" />
                        <span className="jusp-account-skel" />
                      </>
                    ) : null}
                  </div>

                  <div className="jusp-account-col">
                    <div className="jusp-account-coltitle">Ventajas JUSP</div>
                    <div className="jusp-account-benefits">
                      <div className="jusp-benefit">Originalidad verificada</div>
                      <div className="jusp-benefit">Envío cross-border</div>
                      <div className="jusp-benefit">Garantía y soporte</div>
                      <div className="jusp-benefit">Guía de tallas</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <button
            className="jusp-burger"
            onClick={() => {
              setMobileOpen((v) => !v);
              setActive(null);
              setAccountOpen(false);
              setSearchOpen(false);
            }}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            type="button"
          >
            ☰
          </button>
        </div>
      </div>

      <div
        className={activeMenu ? "jusp-mega open" : "jusp-mega"}
        onMouseEnter={cancelHoverClose}
        onMouseLeave={scheduleHoverClose}
      >
        {activeMenu ? (
          <div className="jusp-mega-inner">
            <div className="jusp-mega-top">
              <div className="jusp-mega-title">{activeMenu.label}</div>
              <Link
                className="jusp-mega-viewall"
                href={activeMenu.href}
                onMouseDown={cancelHoverClose}
                onClick={() => setActive(null)}
              >
                Ver todo
              </Link>
            </div>

            <div
              className="jusp-mega-grid"
              style={{ gridTemplateColumns: `repeat(${Math.min(activeMenu.columns.length, 4)}, minmax(0, 1fr))` }}
            >
              {activeMenu.columns.slice(0, 4).map((col) => (
                <div key={col.title} className="jusp-mega-col">
                  <div className="jusp-mega-col-title">{col.title}</div>
                  <div className="jusp-mega-links">
                    {col.items.map((it) => (
                      <Link
                        key={it.href}
                        href={it.href}
                        className="jusp-mega-link"
                        onMouseDown={cancelHoverClose}
                        onClick={() => setActive(null)}
                      >
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {searchOpen ? (
        <div className="jusp-search-overlay" role="dialog" aria-modal="true">
          <div className="jusp-search-panel">
            <div className="jusp-search-top">
              <div className="jusp-search-brand">JUSP</div>

              <div className="jusp-search-inputwrap">
                <div className="jusp-search-ico" aria-hidden="true">
                  ⌕
                </div>
                <button
                  className="jusp-search-camera"
                  type="button"
                  onClick={openImageSearchPicker}
                  aria-label="Buscar por imagen"
                  title="Buscar por imagen"
                >
                  📷
                </button>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    if (imageSearchLabel) {
                      setImageSearchLabel("");
                      setImageSearchMode("idle");
                    }
                  }}
                  placeholder="Buscar productos, marcas, estilos…"
                  className="jusp-search-input"
                  aria-label="Buscar"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch(q);
                  }}
                />
                <input
                  ref={imageSearchInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="jusp-search-fileinput"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void runImageSearch(file);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <button className="jusp-search-cancel" onClick={closeSearch} aria-label="Cancelar" type="button">
                Cancelar
              </button>
            </div>

            <div className="jusp-search-body">
              <div className="jusp-search-cols nike">
                <div className="jusp-search-col">
                  <div className="jusp-search-coltitle">
                    {q.trim() ? "Sugerencias" : recents.length ? "Recientes" : "Sugerencias"}
                  </div>
                  <div className="jusp-search-list">
                    {suggestions.map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        className="jusp-search-item"
                        onClick={() => {
                          if (s.kind === "recent" || s.kind === "suggest") safeSaveRecent(s.label);
                          setRecents(safeLoadRecents());
                          setSearchOpen(false);
                        }}
                      >
                        <span className="jusp-search-itemkind">
                          {s.kind === "recent" ? "↻" : s.kind === "quick" ? "★" : "→"}
                        </span>
                        <span className="jusp-search-itemlabel">{s.label}</span>
                      </Link>
                    ))}
                  </div>

                  {recents.length ? (
                    <button
                      className="jusp-search-clear"
                      onClick={() => {
                        try {
                          localStorage.removeItem(RECENTS_KEY);
                        } catch {}
                        setRecents([]);
                      }}
                      type="button"
                    >
                      Borrar recientes
                    </button>
                  ) : null}
                </div>

                <div className="jusp-search-col">
                  <div className="jusp-search-coltitle">
                    {imageSearchLabel ? `Resultados por imagen: ${imageSearchLabel}` : "Resultados"}
                  </div>
                  <div className="jusp-search-results">
                    {imageSearchLabel ? (
                      <div className={`jusp-search-image-status ${imageSearchMode === "error" ? "error" : ""}`}>
                        {imageSearchMode === "error"
                          ? "No se pudo leer esa imagen. Prueba otra foto mas clara."
                          : loading
                          ? "Limpiando fondo, creando índice visual y comparando producto contra catálogo..."
                          : products.length
                          ? `Resultados por similitud visual real${imageSearchIndexedCount ? ` · ${imageSearchIndexedCount} imágenes analizadas/cacheadas` : ""}.`
                          : "No encontramos coincidencias fuertes. Sube una imagen centrada, con el producto completo."}
                      </div>
                    ) : null}
                    {loading ? <div className="jusp-search-loading">Buscando…</div> : null}
                    {!loading && imageSearchCanDeep && lastImageFileRef.current ? (
                      <button
                        className="jusp-search-deep"
                        type="button"
                        onClick={() => {
                          const file = lastImageFileRef.current;
                          if (file) void runImageSearch(file, { deep: true });
                        }}
                      >
                        Buscar otra vez con más precisión
                      </button>
                    ) : null}
                    {!loading && q.trim() && products.length === 0 ? (
                      <div className="jusp-search-empty">Sin resultados aún. Presiona Enter para ver todo.</div>
                    ) : null}

                    <div className="jusp-search-grid">
                      {products.map((p) => (
                        <Link key={p.id} href={p.href} className="jusp-prod" onClick={() => setSearchOpen(false)}>
                          <div className="jusp-prod-img">
                            {p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : <div className="jusp-prod-ph" />}
                            {p.matchLabel ? <span className="jusp-prod-match">{p.matchLabel}</span> : null}
                          </div>
                          <div className="jusp-prod-meta">
                            <div className="jusp-prod-title">{p.title}</div>
                            {p.subtitle ? <div className="jusp-prod-sub">{p.subtitle}</div> : null}
                            {p.price != null ? (
                              <div className="jusp-prod-price">
                                <span className="jusp-prod-now">${String(p.price)}</span>
                              </div>
                            ) : null}
                          </div>
                          <div className="jusp-prod-fav" aria-hidden="true">
                            ♡
                          </div>
                        </Link>
                      ))}
                    </div>

                    {q.trim() ? (
                      <button className="jusp-search-viewall" onClick={() => submitSearch(q)} type="button">
                        Ver todos los resultados
                      </button>
                    ) : null}
                  </div>

                  <div className="jusp-search-quickrow">
                    <div className="jusp-search-coltitle small">Rápido</div>
                    <div className="jusp-search-chips">
                      {[
                        { label: "Novedades", href: "/products?tab=new" },
                        { label: "Trending", href: "/products?tab=trending" },
                        { label: "Exclusivo", href: "/products?cat=exclusivo" },
                        { label: "Hombre", href: "/products?cat=hombre" },
                        { label: "Mujer", href: "/products?cat=mujer" },
                        { label: "Niños", href: "/products?cat=ninos" },
                      ].map((c) => (
                        <Link key={c.href} href={c.href} className="jusp-chip" onClick={() => setSearchOpen(false)}>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                    <div className="jusp-search-hint">
                      Tip: presiona <span className="jusp-kbd">/</span> para buscar, <span className="jusp-kbd">ESC</span> para cerrar.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className="jusp-search-backdrop" aria-label="Cerrar búsqueda" onClick={closeSearch} type="button" />
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="jusp-mdrawer-wrap" role="dialog" aria-modal="true">
          <button
            className="jusp-mdrawer-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar"
            type="button"
          />
          <div className="jusp-mdrawer">
            <div className="jusp-mdrawer-top">
              <div className="jusp-mdrawer-title">Menú</div>
              <button className="jusp-mdrawer-close" onClick={() => setMobileOpen(false)} aria-label="Cerrar" type="button">
                ✕
              </button>
            </div>

            <button className="jusp-mdrawer-search" onClick={openSearch} type="button">
              <span className="jusp-mdrawer-left">
                <span className="jusp-mdrawer-icobubble" aria-hidden="true">
                  <DrawerIcon name="search" />
                </span>
                <span className="jusp-mdrawer-linktext">Buscar</span>
              </span>
              <span className="jusp-mdrawer-arrow" aria-hidden="true">
                →
              </span>
            </button>

            <div className="jusp-mdrawer-links">
              {menus.map((m) => {
                const iconName = iconNameForKey(m.key, m.label);
                const isCollections = m.key === "jordan" && m.label === "Colecciones";
                return (
                  <Link
                    key={m.key}
                    href={m.href}
                    className={[
                      m.highlight ? "jusp-mdrawer-link jusp-nav-sale" : "jusp-mdrawer-link",
                      isCollections ? "jusp-mdrawer-collections" : "",
                    ].join(" ")}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="jusp-mdrawer-left">
                      <span className="jusp-mdrawer-icobubble" aria-hidden="true">
                        <DrawerIcon name={iconName} />
                      </span>
                      <span className="jusp-mdrawer-linktext">{m.label}</span>
                    </span>
                    <span className="jusp-mdrawer-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="jusp-mdrawer-actions">
              {!sessionLoading && isAuthed ? (
                <Link href="/mis-facturas" onClick={() => setMobileOpen(false)}>
                  Mis facturas
                </Link>
              ) : null}

              {!sessionLoading && isAuthed ? (
                <Link href="/mis-cupones" onClick={() => setMobileOpen(false)}>
                  Mis cupones
                </Link>
              ) : null}

              {!sessionLoading && isAuthed ? (
                <Link href="/favorites" onClick={() => setMobileOpen(false)}>
                  Favoritos
                </Link>
              ) : null}

              {!sessionLoading && isAuthed && dropHypeFriday ? (
                <Link href="/drops" onClick={() => setMobileOpen(false)}>
                  Drop-Hype del viernes
                </Link>
              ) : null}

              <button
                type="button"
                className="jusp-mdrawer-cartbtn"
                onClick={() => {
                  setMobileOpen(false);
                  openCart();
                }}
              >
                Carrito
                {cartCount > 0 ? <span className="jusp-mdrawer-cartbadge">{cartCount}</span> : null}
              </button>

              {!sessionLoading && isAuthed ? (
                <button
                  className="jusp-mdrawer-logout"
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void doLogout();
                  }}
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Iniciar sesión
                </Link>
              )}

              {!sessionLoading && isAuthed ? (
                <Link href="/account" onClick={() => setMobileOpen(false)}>
                  Mi cuenta
                </Link>
              ) : (
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  Registrarse
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        :root {
          --jusp-header-h: 64px;
          --jusp-ease: cubic-bezier(0.16, 1, 0.3, 1);
          --jusp-fast: 160ms;
          --jusp-mid: 220ms;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .jusp-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 2000;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(12px) saturate(1.08);
          -webkit-backdrop-filter: blur(12px) saturate(1.08);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          transition: background var(--jusp-mid) var(--jusp-ease), box-shadow var(--jusp-mid) var(--jusp-ease),
            border-color var(--jusp-mid) var(--jusp-ease);
          will-change: background, box-shadow;
        }

        .jusp-header.jusp-header-scrolled {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(18px) saturate(1.16);
          -webkit-backdrop-filter: blur(18px) saturate(1.16);
          border-bottom-color: rgba(0, 0, 0, 0.08);
          box-shadow: 0 10px 34px rgba(0, 0, 0, 0.07);
        }

        .jusp-header-inner {
          height: var(--jusp-header-h);
          max-width: 1180px;
          margin: 0 auto;
          padding: 12px 16px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          transition: padding var(--jusp-mid) var(--jusp-ease);
        }

        .jusp-header.jusp-header-scrolled .jusp-header-inner {
          padding-top: 10px;
          padding-bottom: 10px;
        }

        .jusp-logo {
          font-weight: 800;
          letter-spacing: 0.12em;
          text-decoration: none;
          color: #111;
        }

        .jusp-nav {
          display: flex;
          gap: 14px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .jusp-nav-item {
          position: relative;
        }

        .jusp-nav-link {
          font-size: 13px;
          text-decoration: none;
          color: #111;
          padding: 6px 8px;
          border-radius: 10px;
          transition: background var(--jusp-fast) var(--jusp-ease), transform var(--jusp-fast) var(--jusp-ease),
            opacity var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-nav-link:hover {
          background: rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }

        .jusp-nav-sale {
          color: #c61f1f;
          font-weight: 700;
        }

        .jusp-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-self: end;
        }

        .jusp-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.94);
          text-decoration: none;
          color: #111;
          cursor: pointer;
          position: relative;
          transition: transform var(--jusp-fast) var(--jusp-ease), background var(--jusp-fast) var(--jusp-ease),
            box-shadow var(--jusp-fast) var(--jusp-ease), border-color var(--jusp-fast) var(--jusp-ease),
            opacity var(--jusp-fast) var(--jusp-ease);
          will-change: transform, box-shadow, opacity;
        }

        .jusp-icon:hover {
          background: rgba(255, 255, 255, 0.98);
          transform: scale(1.03);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
        }

        .jusp-icon:active {
          transform: scale(0.985);
        }

        .jusp-search-ico-btn {
          font-size: 16px;
          line-height: 1;
        }

        .jusp-cart-ico {
          position: relative;
          border: 1px solid rgba(0, 0, 0, 0.12);
        }

        .jusp-cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          font-size: 11px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .jusp-cart-ico.bump {
          animation: juspCartBump 240ms var(--jusp-ease);
        }

        @keyframes juspCartBump {
          0% {
            transform: scale(1);
          }
          35% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        .jusp-account-ico {
          color: #111 !important;
          border-color: rgba(0, 0, 0, 0.12);
        }

        .jusp-account-ico.active {
          border-color: rgba(34, 197, 94, 0.55);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
        }

        .jusp-ico-glyph {
          color: #111 !important;
          filter: saturate(0) brightness(0.1);
        }

        .jusp-dot {
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.95);
          border: 2px solid #fff;
        }

        .jusp-account-wrap {
          position: relative;
        }

        .jusp-account-mega {
          position: absolute;
          top: 100%;
          right: 0;
          width: 380px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.14);
          border-radius: 16px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
          padding: 14px;
          margin-top: 10px;
          transform-origin: top right;
          animation: juspPop var(--jusp-fast) var(--jusp-ease) both;
        }

        @keyframes juspPop {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .jusp-account-mega::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: -10px;
          height: 10px;
        }

        @media (max-width: 920px) {
          .jusp-account-mega {
            position: fixed;
            top: calc(var(--jusp-header-h) + 10px);
            left: 12px;
            right: 12px;
            width: auto;
            margin-top: 0;
            z-index: 2100;
            box-shadow: 0 22px 60px rgba(0, 0, 0, 0.18);
          }
        }

        .jusp-account-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .jusp-account-title {
          font-weight: 800;
          font-size: 16px;
        }

        .jusp-account-close {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.7;
          transition: opacity var(--jusp-fast) var(--jusp-ease), transform var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-account-close:hover {
          opacity: 1;
          transform: scale(1.05);
        }

        .jusp-account-sub {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .jusp-account-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.75);
        }

        .jusp-account-chip.ok {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.22);
          color: rgba(0, 0, 0, 0.78);
        }

        .jusp-account-chip.warn {
          background: rgba(255, 214, 0, 0.18);
          border-color: rgba(255, 214, 0, 0.35);
          color: rgba(0, 0, 0, 0.78);
        }

        .jusp-account-chip.muted {
          opacity: 0.75;
        }

        .jusp-account-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 520px) {
          .jusp-account-grid {
            grid-template-columns: 1fr;
          }
        }

        .jusp-account-coltitle {
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .jusp-account-link {
          display: block;
          width: 100%;
          text-align: left;
          text-decoration: none;
          color: #111;
          padding: 8px 10px;
          border-radius: 12px;
          background: transparent;
          border: 0;
          cursor: pointer;
          font: inherit;
          transition: background var(--jusp-fast) var(--jusp-ease), transform var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-account-link:hover {
          background: rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }

        .jusp-account-link.strong {
          font-weight: 800;
        }

        .jusp-account-link.danger {
          color: rgba(198, 31, 31, 0.95);
          font-weight: 900;
        }

        .jusp-account-benefits {
          display: grid;
          gap: 8px;
        }

        .jusp-benefit {
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.03);
          transition: transform var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-benefit:hover {
          transform: translateY(-1px);
        }

        .jusp-account-skel {
          display: block;
          height: 36px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.05);
          margin-bottom: 8px;
          position: relative;
          overflow: hidden;
        }

        .jusp-account-skel::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-60%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          animation: juspShimmer 1.1s linear infinite;
        }

        @keyframes juspShimmer {
          to {
            transform: translateX(60%);
          }
        }

        .jusp-burger {
          display: none;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          border-radius: 12px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          transition: transform var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-burger:active {
          transform: scale(0.985);
        }

        .jusp-mega {
          position: absolute;
          left: 0;
          right: 0;
          top: 100%;
          padding: 0 16px;
          z-index: 60;
          pointer-events: none;
          opacity: 0;
          transform: translateY(-6px) scale(0.995);
          transition: opacity var(--jusp-fast) var(--jusp-ease), transform var(--jusp-fast) var(--jusp-ease);
          will-change: opacity, transform;
        }

        .jusp-mega.open {
          pointer-events: auto;
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .jusp-mega-inner {
          max-width: 1180px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-top: 0;
          border-radius: 0 0 18px 18px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.1);
          padding: 16px;
          max-height: calc(100vh - 86px);
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .jusp-mega-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .jusp-mega-title {
          font-weight: 800;
          font-size: 16px;
        }

        .jusp-mega-viewall {
          text-decoration: none;
          font-size: 13px;
          opacity: 0.75;
          color: #111;
          transition: opacity var(--jusp-fast) var(--jusp-ease), transform var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-mega-viewall:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        .jusp-mega-grid {
          display: grid;
          gap: 14px;
        }

        .jusp-mega-col-title {
          font-size: 12px;
          font-weight: 800;
          opacity: 0.7;
          margin-bottom: 8px;
        }

        .jusp-mega-link {
          display: block;
          text-decoration: none;
          color: #111;
          padding: 6px 8px;
          border-radius: 12px;
          font-size: 13px;
          transition: background var(--jusp-fast) var(--jusp-ease), transform var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-mega-link:hover {
          background: rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }

        .jusp-search-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
        }

        .jusp-search-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(10px);
          border: 0;
          opacity: 0;
          animation: juspFadeIn var(--jusp-fast) var(--jusp-ease) forwards;
        }

        .jusp-search-panel {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: #fff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: auto;
          transform: translateY(10px) scale(0.995);
          opacity: 0;
          animation: juspPanelIn var(--jusp-fast) var(--jusp-ease) forwards;
          will-change: transform, opacity;
        }

        @keyframes juspFadeIn {
          to {
            opacity: 1;
          }
        }

        @keyframes juspPanelIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.995);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jusp-mega,
          .jusp-search-panel,
          .jusp-search-backdrop,
          .jusp-mdrawer,
          .jusp-mdrawer-backdrop {
            transition: none !important;
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }

        .jusp-search-top {
          position: sticky;
          top: 0;
          z-index: 4;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 28px 42px 20px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .jusp-search-brand {
          font-weight: 900;
          letter-spacing: 0.12em;
          font-size: 18px;
        }

        .jusp-search-inputwrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 56px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 999px;
          background: #f7f7f7;
          padding: 10px 18px 10px 64px;
          transition: box-shadow var(--jusp-fast) var(--jusp-ease), border-color var(--jusp-fast) var(--jusp-ease), background var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-search-inputwrap:focus-within {
          background: #fff;
          border-color: rgba(0, 0, 0, 0.18);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }

        .jusp-search-ico {
          display: none;
        }

        .jusp-search-camera {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(17, 17, 17, 0.1);
          background: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(17, 17, 17, 0.06);
          transition: transform var(--jusp-fast) var(--jusp-ease), box-shadow var(--jusp-fast) var(--jusp-ease), border-color var(--jusp-fast) var(--jusp-ease);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .jusp-search-camera:hover {
          transform: translateY(calc(-50% - 1px));
          border-color: rgba(17, 17, 17, 0.18);
          box-shadow: 0 12px 26px rgba(17, 17, 17, 0.1);
        }

        .jusp-search-fileinput {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .jusp-search-input {
          width: 100%;
          border: 0;
          outline: none;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #111;
          background: transparent;
        }

        .jusp-search-input::placeholder {
          color: rgba(17, 17, 17, 0.34);
          font-weight: 600;
        }

        .jusp-search-cancel {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 800;
          font-size: 18px;
          opacity: 0.9;
          transition: opacity var(--jusp-fast) var(--jusp-ease), transform var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-search-cancel:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        .jusp-search-body {
          flex: 1;
          background: #fff;
          padding: 30px 42px 42px;
          overflow: visible;
        }

        .jusp-search-cols.nike {
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 42px;
          align-items: start;
        }

        .jusp-search-col {
          min-width: 0;
        }

        .jusp-search-col:first-child {
          position: sticky;
          top: 116px;
          align-self: start;
        }

        .jusp-search-coltitle {
          font-size: 14px;
          font-weight: 900;
          color: rgba(17, 17, 17, 0.62);
          margin-bottom: 18px;
          letter-spacing: 0.01em;
          text-transform: none;
        }

        .jusp-search-coltitle.small {
          margin-bottom: 10px;
        }

        .jusp-search-list {
          display: grid;
          gap: 12px;
        }

        .jusp-search-item {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #111;
          font-size: 18px;
          line-height: 1.15;
          padding: 14px 16px;
          border-radius: 18px;
          background: #f6f6f6;
          transition: transform var(--jusp-fast) var(--jusp-ease), background var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-search-item:hover {
          background: #efefef;
          transform: translateY(-1px);
        }

        .jusp-search-itemkind {
          display: inline-flex;
          width: 18px;
          justify-content: center;
          color: rgba(17, 17, 17, 0.45);
          flex: 0 0 18px;
          margin-top: 1px;
        }

        .jusp-search-itemlabel {
          font-weight: 500;
        }

        .jusp-search-clear {
          margin-top: 14px;
          border: 0;
          background: transparent;
          padding: 0;
          color: rgba(17, 17, 17, 0.58);
          font-weight: 700;
          cursor: pointer;
        }

        .jusp-search-results {
          min-height: 320px;
          display: block;
          min-width: 0;
        }

        .jusp-search-loading,
        .jusp-search-empty {
          color: rgba(17, 17, 17, 0.56);
          font-size: 14px;
          margin-bottom: 14px;
        }

        .jusp-search-image-status {
          margin-bottom: 14px;
          padding: 10px 12px;
          border-radius: 12px;
          background: #f6f6f6;
          color: rgba(17, 17, 17, 0.66);
          font-size: 13px;
          font-weight: 800;
          line-height: 1.35;
        }

        .jusp-search-image-status.error {
          background: #fff1f1;
          color: #9f1d1d;
        }

        .jusp-search-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(220px, 1fr));
          gap: 24px 20px;
          align-items: stretch;
          align-content: start;
          min-width: 0;
        }

        .jusp-prod {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100%;
          text-decoration: none;
          color: #111;
          background: #fff;
          border: 1px solid rgba(17, 17, 17, 0.08);
          border-radius: 22px;
          padding: 12px;
          box-shadow: 0 10px 30px rgba(17, 17, 17, 0.04);
          transition: transform var(--jusp-fast) var(--jusp-ease), box-shadow var(--jusp-fast) var(--jusp-ease), border-color var(--jusp-fast) var(--jusp-ease);
          overflow: hidden;
        }

        .jusp-prod:hover {
          transform: translateY(-2px);
          border-color: rgba(17, 17, 17, 0.14);
          box-shadow: 0 18px 40px rgba(17, 17, 17, 0.08);
        }

        .jusp-prod-img {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #f5f5f5;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .jusp-prod-img img,
        .jusp-prod-ph {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .jusp-prod-match {
          position: absolute;
          left: 10px;
          bottom: 10px;
          max-width: calc(100% - 20px);
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.9);
          color: #fff;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .jusp-prod-ph {
          background: linear-gradient(180deg, #f6f6f6 0%, #ececec 100%);
        }

        .jusp-prod-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .jusp-prod-title {
          font-size: 18px;
          line-height: 1.18;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }

        .jusp-prod-sub {
          font-size: 14px;
          color: rgba(17, 17, 17, 0.55);
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }

        .jusp-prod-price {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          margin-top: auto;
        }

        .jusp-prod-compare {
          text-decoration: line-through;
          color: rgba(17, 17, 17, 0.45);
        }

        .jusp-prod-now {
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .jusp-prod-fav {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.1);
          font-size: 18px;
          z-index: 1;
        }

        .jusp-search-viewall {
          margin-top: 24px;
          border: 0;
          background: transparent;
          padding: 0;
          color: #111;
          font-weight: 900;
          font-size: 16px;
          cursor: pointer;
        }

        .jusp-search-deep {
          margin: 0 0 16px;
          border: 1px solid rgba(17, 17, 17, 0.16);
          background: #111;
          color: #fff;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(17, 17, 17, 0.12);
        }

        .jusp-search-deep:hover {
          transform: translateY(-1px);
        }

        .jusp-search-quickrow {
          margin-top: 34px;
          padding-top: 8px;
        }

        .jusp-search-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .jusp-chip {
          display: inline-flex;
          align-items: center;
          height: 42px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid rgba(17, 17, 17, 0.12);
          text-decoration: none;
          color: #111;
          font-weight: 700;
          background: #fff;
          transition: transform var(--jusp-fast) var(--jusp-ease), background var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-chip:hover {
          background: #f6f6f6;
          transform: translateY(-1px);
        }

        .jusp-search-hint {
          margin-top: 16px;
          color: rgba(17, 17, 17, 0.54);
          font-size: 13px;
        }

        .jusp-search-overlay .jusp-header,
        .jusp-search-overlay .jusp-header-inner {
          display: none !important;
        }

        .jusp-kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 6px;
          background: #f5f5f5;
          border: 1px solid rgba(17, 17, 17, 0.1);
          color: #111;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 1100px) {
          .jusp-search-top {
            padding: 24px 24px 18px;
          }

          .jusp-search-body {
            padding: 24px;
          }

          .jusp-search-grid {
            grid-template-columns: repeat(3, minmax(200px, 1fr));
            gap: 22px 18px;
          }

          .jusp-prod-title {
            font-size: 17px;
          }

          .jusp-prod-sub {
            font-size: 13px;
          }

          .jusp-prod-price {
            font-size: 16px;
          }
        }

        @media (max-width: 860px) {
          .jusp-search-panel {
            min-height: 100dvh;
            overflow: hidden;
          }

          .jusp-search-top {
            grid-template-columns: 1fr auto;
            gap: 12px;
            padding: 20px 18px 16px;
          }

          .jusp-search-brand {
            display: none;
          }

          .jusp-search-body {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 20px 18px 28px;
          }

          .jusp-search-cols.nike {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .jusp-search-col:first-child,
          .jusp-search-quickrow {
            display: none;
          }

          .jusp-search-col:last-child {
            display: flex;
            flex-direction: column;
            min-height: 100%;
          }

          .jusp-search-col:last-child .jusp-search-coltitle {
            margin-bottom: 10px;
            font-size: 13px;
            color: rgba(17, 17, 17, 0.5);
          }

          .jusp-search-results {
            min-height: 0;
          }

          .jusp-search-input {
            font-size: 20px;
          }

          .jusp-search-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px 14px;
          }

          .jusp-prod {
            border-radius: 20px;
            padding: 10px;
          }

          .jusp-prod-img {
            border-radius: 16px;
            margin-bottom: 12px;
          }

          .jusp-prod-fav {
            top: 16px;
            right: 16px;
          }
        }

        @media (max-width: 560px) {
          .jusp-search-top {
            padding: 16px 14px 12px;
          }

          .jusp-search-inputwrap {
            min-height: 50px;
            padding-left: 62px;
          }

          .jusp-search-input {
            font-size: 18px;
          }

          .jusp-search-cancel {
            font-size: 16px;
          }

          .jusp-search-body {
            padding: 16px 14px 24px;
          }

          .jusp-search-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px 12px;
          }

          .jusp-search-item {
            font-size: 16px;
            padding: 12px 14px;
          }

          .jusp-prod {
            border-radius: 18px;
            padding: 8px;
          }

          .jusp-prod-img {
            border-radius: 14px;
            margin-bottom: 10px;
          }

          .jusp-prod-title {
            font-size: 15px;
            margin-bottom: 4px;
          }

          .jusp-prod-sub {
            font-size: 12px;
            margin-bottom: 8px;
          }

          .jusp-prod-price {
            font-size: 15px;
          }

          .jusp-prod-fav {
            top: 12px;
            right: 12px;
            width: 34px;
            height: 34px;
            font-size: 16px;
          }
        }


        @media (max-width: 380px) {
          .jusp-search-grid {
            grid-template-columns: 1fr;
          }
        }

        .jusp-mdrawer-wrap {
          position: fixed;
          inset: 0;
          z-index: 90;
        }

        .jusp-mdrawer-backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(20px) saturate(1.2);
          -webkit-backdrop-filter: blur(20px) saturate(1.2);
          opacity: 0;
          animation: juspFadeIn var(--jusp-fast) var(--jusp-ease) forwards;
        }

        .jusp-mdrawer {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(380px, 92vw);
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(24px) saturate(1.3);
          -webkit-backdrop-filter: blur(24px) saturate(1.3);
          border-left: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: -28px 0 90px rgba(0, 0, 0, 0.18);
          padding: 12px 14px 16px;
          transform: translateX(12px) scale(0.995);
          opacity: 0;
          animation: juspDrawerIn var(--jusp-fast) var(--jusp-ease) forwards;
          will-change: transform, opacity;
          isolation: isolate;
          color: rgba(0, 0, 0, 0.88);
        }

        @keyframes juspDrawerIn {
          0% {
            opacity: 0;
            transform: translateX(12px) scale(0.995);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .jusp-mdrawer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .jusp-mdrawer-title {
          font-weight: 950;
          letter-spacing: 0.02em;
          color: rgba(0, 0, 0, 0.9);
        }

        .jusp-mdrawer-close {
          border: 0;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          font-size: 18px;
          color: rgba(0, 0, 0, 0.82);
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          display: grid;
          place-items: center;
          transition: transform var(--jusp-fast) var(--jusp-ease), background var(--jusp-fast) var(--jusp-ease);
        }

        .jusp-mdrawer-close:active {
          transform: scale(0.985);
        }

        .jusp-mdrawer-search {
          margin-top: 10px;
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.10);
          border-radius: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.9);
          transition: transform var(--jusp-fast) var(--jusp-ease), background var(--jusp-fast) var(--jusp-ease),
            border-color var(--jusp-fast) var(--jusp-ease), box-shadow var(--jusp-fast) var(--jusp-ease);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .jusp-mdrawer-search:active {
          transform: translateY(1px);
        }

        .jusp-mdrawer-left {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .jusp-mdrawer-icobubble {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.07);
          flex: 0 0 auto;
        }

        .jusp-mdrawer-ico {
          color: rgba(0, 0, 0, 0.86);
        }

        .jusp-mdrawer-arrow {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.07);
          color: rgba(0, 0, 0, 0.70);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.05);
          flex: 0 0 auto;
        }

        .jusp-mdrawer-linktext {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.88);
          font-weight: 950;
          letter-spacing: 0.01em;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .jusp-mdrawer-links {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .jusp-mdrawer-link {
          padding: 10px 10px;
          border-radius: 16px;
          text-decoration: none;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.50);
          transition: transform var(--jusp-fast) var(--jusp-ease), background var(--jusp-fast) var(--jusp-ease),
            border-color var(--jusp-fast) var(--jusp-ease), box-shadow var(--jusp-fast) var(--jusp-ease);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .jusp-mdrawer-link:hover {
          background: rgba(255, 255, 255, 0.66);
          border-color: rgba(0, 0, 0, 0.10);
          transform: translateY(-1px);
        }

        .jusp-mdrawer-link.jusp-nav-sale {
          border-color: rgba(198, 31, 31, 0.22);
          background: rgba(255, 255, 255, 0.56);
        }

        .jusp-mdrawer-link.jusp-nav-sale .jusp-mdrawer-linktext {
          background: rgba(198, 31, 31, 0.08);
          border-color: rgba(198, 31, 31, 0.18);
          color: rgba(198, 31, 31, 0.95);
        }

        .jusp-mdrawer-link.jusp-nav-sale .jusp-mdrawer-arrow {
          background: rgba(198, 31, 31, 0.06);
          border-color: rgba(198, 31, 31, 0.12);
          color: rgba(198, 31, 31, 0.85);
        }

        .jusp-mdrawer-link.jusp-mdrawer-collections {
          border-color: rgba(0, 0, 0, 0.14);
          background: rgba(255, 255, 255, 0.62);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.09);
        }

        .jusp-mdrawer-link.jusp-mdrawer-collections .jusp-mdrawer-icobubble {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.12);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.09);
        }

        .jusp-mdrawer-link.jusp-mdrawer-collections .jusp-mdrawer-linktext {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.12);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
        }

        .jusp-mdrawer-link.jusp-mdrawer-collections .jusp-mdrawer-arrow {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.12);
          color: rgba(0, 0, 0, 0.78);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.08);
        }

        .jusp-mdrawer-actions {
          margin-top: 16px;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          flex-wrap: wrap;
          align-items: center;
        }

        .jusp-mdrawer-actions a {
          text-decoration: none;
          color: rgba(0, 0, 0, 0.88);
          font-weight: 900;
        }

        .jusp-mdrawer-actions a:hover {
          color: rgba(0, 0, 0, 1);
        }

        .jusp-mdrawer-cartbtn {
          border: 0;
          background: transparent;
          font-weight: 950;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(0, 0, 0, 0.88);
        }

        .jusp-mdrawer-cartbadge {
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: rgba(17, 17, 17, 0.92);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 950;
          font-size: 11px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .jusp-mdrawer-logout {
          border: 0;
          background: transparent;
          color: rgba(198, 31, 31, 0.92);
          font-weight: 950;
          cursor: pointer;
          padding: 0;
        }

        .jusp-mdrawer-logout:hover {
          color: rgba(198, 31, 31, 1);
        }

        @media (max-width: 920px) {
          .jusp-nav {
            display: none;
          }
          .jusp-burger {
            display: inline-grid;
            place-items: center;
          }
        }
      `}</style>
    </header>
  );
}