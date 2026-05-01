import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VisualAIDescription = {
  brands: string[];
  categories: string[];
  genders: string[];
  colors: string[];
  keywords: string[];
  confidence: number;
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function normalizeToken(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanList(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const token = normalizeToken(item);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
    if (out.length >= max) break;
  }

  return out;
}

function normalizeAnalysis(value: unknown): VisualAIDescription {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const confidenceRaw = Number(record.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.max(0, Math.min(1, confidenceRaw))
    : 0.45;

  return {
    brands: cleanList(record.brands, 8),
    categories: cleanList(record.categories, 12),
    genders: cleanList(record.genders, 6),
    colors: cleanList(record.colors, 12),
    keywords: cleanList(record.keywords, 28),
    confidence,
  };
}

function getFileExtension(file: File): string {
  const name = file.name.toLowerCase();
  const match = name.match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function isAllowedImage(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) return true;
  return /^(heic|heif|jpg|jpeg|png|webp|avif|gif)$/.test(getFileExtension(file));
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = getFileExtension(file);
  const mime = file.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function extractFirstJsonObject(text: string): unknown | null {
  const raw = text.trim();
  try {
    return JSON.parse(raw);
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function unique(values: string[], max = 16): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const token = normalizeToken(raw);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
    if (out.length >= max) break;
  }
  return out;
}

function fallbackAnalysisFromFileName(file: File): VisualAIDescription {
  const text = normalizeToken(file.name);
  const brands = ["nike", "adidas", "jordan", "puma", "new balance", "reebok", "converse", "vans", "asics", "under armour", "fila", "crocs"].filter((brand) =>
    text.includes(brand.replace(/\s+/g, " "))
  );

  const colors: string[] = [];
  const colorMap: Record<string, string[]> = {
    black: ["black", "negro"],
    white: ["white", "blanco"],
    red: ["red", "rojo"],
    blue: ["blue", "azul"],
    green: ["green", "verde"],
    gray: ["gray", "grey", "gris"],
    beige: ["beige", "cream", "crema"],
    brown: ["brown", "cafe", "marron"],
    pink: ["pink", "rosa"],
    purple: ["purple", "morado"],
    yellow: ["yellow", "amarillo"],
    orange: ["orange", "naranja"],
  };

  for (const [canonical, aliases] of Object.entries(colorMap)) {
    if (aliases.some((alias) => text.includes(alias))) colors.push(canonical);
  }

  const categories: string[] = [];
  if (/\b(shoe|shoes|sneaker|sneakers|zapatilla|zapatillas|tenis|jordan|air|max|dunk|force|runner|running)\b/.test(text)) categories.push("shoes", "sneakers");
  if (/\b(shirt|camiseta|tshirt|t shirt|top|polo|blusa|tee)\b/.test(text)) categories.push("shirt", "top");
  if (/\b(pants|pantalon|pantalones|legging|leggings|jogger|short|shorts)\b/.test(text)) categories.push("pants");
  if (/\b(hoodie|jacket|chaqueta|buzo|sweater|sudadera)\b/.test(text)) categories.push("jacket", "hoodie");
  if (/\b(cap|gorra|hat|bag|bolso|mochila|backpack)\b/.test(text)) categories.push("accessory");

  const genders = unique([
    /\b(women|woman|mujer|dama|female)\b/.test(text) ? "women" : "",
    /\b(men|man|hombre|caballero|male)\b/.test(text) ? "men" : "",
    /\b(kids|nino|ninos|infantil|boy|girl)\b/.test(text) ? "kids" : "",
  ]);

  return {
    brands,
    categories: unique(categories),
    genders,
    colors: unique(colors),
    keywords: text ? unique(text.split(/\s+/), 18) : [],
    confidence: brands.length || categories.length || colors.length || genders.length ? 0.28 : 0.12,
  };
}

async function analyzeWithVision(file: File): Promise<VisualAIDescription | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
  const dataUrl = await fileToDataUrl(file);

  const prompt = [
    "Analyze this ecommerce product search image for a fashion/footwear catalog.",
    "Return ONLY valid JSON, no markdown.",
    "Use lowercase normalized English tokens.",
    "Do not invent a brand. If the logo/brand is not clearly visible, return brands: [].",
    "Focus on product type, category, gender/use, dominant colors and visible style keywords.",
    "Allowed broad categories examples: shoes, sneakers, slides, sandals, boots, top, shirt, tshirt, hoodie, jacket, pants, leggings, shorts, dress, bag, cap, accessory, underwear, baby, kids.",
    "JSON shape: {\"brands\":[],\"categories\":[],\"genders\":[],\"colors\":[],\"keywords\":[],\"confidence\":0.0}",
  ].join(" ");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 350,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;

  const parsed = extractFirstJsonObject(content);
  if (!parsed) return null;

  return normalizeAnalysis(parsed);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return json({ ok: false, error: "missing_image" }, 400);
    }

    if (!isAllowedImage(file)) {
      return json({ ok: false, error: "unsupported_image" }, 415);
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: "image_too_large", maxBytes: MAX_IMAGE_BYTES }, 413);
    }

    const ai = await analyzeWithVision(file);
    const fallback = fallbackAnalysisFromFileName(file);
    const analysis = ai && ai.confidence >= 0.25 ? ai : fallback;
    const source = ai && ai.confidence >= 0.25 ? "openai" : "free-fallback";

    return json({
      ok: true,
      freeMode: source !== "openai",
      source,
      analysis,
      ...analysis,
    });
  } catch {
    return json({ ok: false, error: "visual_search_failed" }, 500);
  }
}
