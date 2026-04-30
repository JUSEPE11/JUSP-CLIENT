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
  query: string;
  searchQuery: string;
  terms: string[];
  source: "openai" | "anthropic" | "fallback";
};

const VISION_SYSTEM_PROMPT = `You are a sportswear product classifier for an ecommerce visual search.
Return ONLY a JSON object, no markdown.
Schema:
{
  "brands": string[],
  "categories": string[],
  "genders": string[],
  "colors": string[],
  "keywords": string[],
  "confidence": number
}
Use these category values when possible: shoes, sneakers, shirt, t-shirt, pants, shorts, jacket, sports-bra, hoodie, cap, bag, socks, dress, leggings.
Use these gender values when possible: women, men, kids, unisex.
Include visible logos, product family words, material, silhouette, shape clues, sport type, and visual details in keywords.
Prefer ecommerce searchable words.`;

const BRAND_ALIASES: Record<string, string[]> = {
  nike: ["nike", "air", "jordan", "swoosh", "dunk", "airforce", "air-force", "air max", "airmax"],
  adidas: ["adidas", "yeezy", "boost", "ultraboost", "samba", "gazelle", "campus", "three stripes"],
  puma: ["puma", "suede", "rs-x", "rsx"],
  reebok: ["reebok", "club c", "classic leather"],
  converse: ["converse", "chuck", "all star", "all-star"],
  vans: ["vans", "old skool", "sk8", "authentic"],
  newbalance: ["new balance", "newbalance", "nb", "550", "574", "9060", "2002r"],
  asics: ["asics", "gel", "gel-lyte", "gel kayano"],
  lacoste: ["lacoste"],
  underarmour: ["under armour", "underarmour"],
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  shoes: [
    "shoe",
    "shoes",
    "sneaker",
    "sneakers",
    "tenis",
    "zapato",
    "zapatos",
    "zapatilla",
    "zapatillas",
    "calzado",
    "trainer",
    "running",
    "basketball",
    "air force",
    "dunk",
  ],
  shirt: ["shirt", "tshirt", "t-shirt", "camiseta", "camisa", "polo", "top"],
  pants: ["pants", "pantalon", "pantalones", "jogger", "joggers", "sweatpants"],
  shorts: ["short", "shorts", "bermuda", "bermudas"],
  jacket: ["jacket", "chaqueta", "windbreaker", "cortaviento", "coat"],
  hoodie: ["hoodie", "buzo", "sudadera", "capota", "pullover"],
  cap: ["cap", "gorra", "hat"],
  bag: ["bag", "bolso", "maleta", "backpack", "morral"],
  socks: ["socks", "medias", "calcetines"],
  leggings: ["leggings", "licra", "mallas"],
  dress: ["dress", "vestido"],
};

const COLOR_ALIASES: Record<string, string[]> = {
  black: ["black", "negro", "negra"],
  white: ["white", "blanco", "blanca"],
  red: ["red", "rojo", "roja"],
  blue: ["blue", "azul"],
  green: ["green", "verde"],
  yellow: ["yellow", "amarillo", "amarilla"],
  pink: ["pink", "rosado", "rosada", "rosa"],
  purple: ["purple", "morado", "morada", "violet", "violeta"],
  orange: ["orange", "naranja"],
  gray: ["gray", "grey", "gris"],
  brown: ["brown", "cafe", "marron"],
  beige: ["beige", "cream", "crema"],
  navy: ["navy", "azul marino"],
  gold: ["gold", "dorado", "dorada"],
  silver: ["silver", "plateado", "plateada"],
};

function cleanText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_./\\()[\]{}+]+/g, " ")
    .replace(/[^a-z0-9 -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueList(values: string[], limit = 12): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const clean = cleanText(value);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
    if (result.length >= limit) break;
  }

  return result;
}

function normalizeList(value: unknown, limit = 10): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueList(
    value
      .map((item) => cleanText(item))
      .filter(Boolean),
    limit
  );
}

function detectFromText(text: string, aliases: Record<string, string[]>): string[] {
  const clean = cleanText(text);
  const found: string[] = [];

  for (const [key, words] of Object.entries(aliases)) {
    if (words.some((word) => clean.includes(cleanText(word)))) {
      found.push(key);
    }
  }

  return uniqueList(found);
}

function buildSearchTerms(input: {
  brands?: string[];
  categories?: string[];
  genders?: string[];
  colors?: string[];
  keywords?: string[];
}): string[] {
  return uniqueList(
    [
      ...(input.brands || []),
      ...(input.categories || []),
      ...(input.genders || []),
      ...(input.colors || []),
      ...(input.keywords || []),
    ],
    18
  );
}

function toSearchQuery(terms: string[]): string {
  return uniqueList(terms, 10).join(" ").trim();
}

function normalizeVisionDescription(
  value: unknown,
  source: VisualAIDescription["source"]
): VisualAIDescription | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;

  const brands = normalizeList(raw.brands, 8);
  const categories = normalizeList(raw.categories, 8);
  const genders = normalizeList(raw.genders, 6);
  const colors = normalizeList(raw.colors, 8);
  const keywords = normalizeList(raw.keywords, 14);

  const terms = buildSearchTerms({
    brands,
    categories,
    genders,
    colors,
    keywords,
  });

  const confidence =
    typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
      ? Math.max(0, Math.min(1, raw.confidence))
      : source === "fallback"
        ? 0.25
        : 0.55;

  const searchQuery = toSearchQuery(terms);

  return {
    brands,
    categories,
    genders,
    colors,
    keywords,
    confidence,
    query: searchQuery,
    searchQuery,
    terms,
    source,
  };
}

function extractJsonObject(text: string): unknown | null {
  try {
    const clean = String(text || "").replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : clean);
  } catch {
    return null;
  }
}

function getOpenAIText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;

  const chunks: string[] = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") chunks.push(content.text);
    }
  }

  return chunks.join("\n");
}

async function classifyWithOpenAI(dataUrl: string): Promise<VisualAIDescription | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: VISION_SYSTEM_PROMPT },
              { type: "input_image", image_url: dataUrl },
            ],
          },
        ],
        max_output_tokens: 420,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const parsed = extractJsonObject(getOpenAIText(data));

    return normalizeVisionDescription(parsed, "openai");
  } catch {
    return null;
  }
}

async function classifyWithAnthropic(
  base64: string,
  mediaType: string
): Promise<VisualAIDescription | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_VISION_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 420,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: "Classify this product image for ecommerce visual search.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data?.content?.find((item: any) => item?.type === "text")?.text || "";
    const parsed = extractJsonObject(text);

    return normalizeVisionDescription(parsed, "anthropic");
  } catch {
    return null;
  }
}

function createFallbackDescription(file: File): VisualAIDescription {
  const filename = cleanText(file.name || "");
  const detectedBrands = detectFromText(filename, BRAND_ALIASES);
  const detectedCategories = detectFromText(filename, CATEGORY_ALIASES);
  const detectedColors = detectFromText(filename, COLOR_ALIASES);

  const filenameWords = uniqueList(
    filename
      .split(" ")
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !["jpg", "jpeg", "png", "webp", "image", "foto"].includes(word)),
    10
  );

  const brands = detectedBrands;
  const categories = detectedCategories.length ? detectedCategories : ["shoes"];
  const genders: string[] = [];
  const colors = detectedColors;
  const keywords = uniqueList(
    [
      ...filenameWords,
      ...detectedBrands,
      ...detectedCategories,
      ...detectedColors,
      "original",
      "product",
      "catalog",
    ],
    14
  );

  const terms = buildSearchTerms({
    brands,
    categories,
    genders,
    colors,
    keywords,
  });

  const searchQuery = toSearchQuery(terms);

  return {
    brands,
    categories,
    genders,
    colors,
    keywords,
    confidence: 0.25,
    query: searchQuery,
    searchQuery,
    terms,
    source: "fallback",
  };
}

function enrichDescription(description: VisualAIDescription, file: File): VisualAIDescription {
  const filename = cleanText(file.name || "");
  const filenameBrands = detectFromText(filename, BRAND_ALIASES);
  const filenameCategories = detectFromText(filename, CATEGORY_ALIASES);
  const filenameColors = detectFromText(filename, COLOR_ALIASES);

  const brands = uniqueList([...description.brands, ...filenameBrands], 8);
  const categories = uniqueList([...description.categories, ...filenameCategories], 8);
  const colors = uniqueList([...description.colors, ...filenameColors], 8);
  const genders = uniqueList(description.genders, 6);

  const keywords = uniqueList(
    [
      ...description.keywords,
      ...filename.split(" ").filter((word) => word.length >= 3),
      ...brands,
      ...categories,
      ...colors,
    ],
    16
  );

  const terms = buildSearchTerms({
    brands,
    categories,
    genders,
    colors,
    keywords,
  });

  const searchQuery = toSearchQuery(terms);

  return {
    ...description,
    brands,
    categories,
    genders,
    colors,
    keywords,
    terms,
    query: searchQuery,
    searchQuery,
  };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "invalid_image",
          brands: [],
          categories: [],
          genders: [],
          colors: [],
          keywords: [],
          confidence: 0,
          query: "",
          searchQuery: "",
          terms: [],
          source: "fallback",
        },
        { status: 400 }
      );
    }

    if (file.size > 7 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "image_too_large",
          brands: [],
          categories: [],
          genders: [],
          colors: [],
          keywords: [],
          confidence: 0,
          query: "",
          searchQuery: "",
          terms: [],
          source: "fallback",
        },
        { status: 413 }
      );
    }

    const mediaType = file.type || "image/jpeg";
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mediaType};base64,${base64}`;

    const aiDescription =
      (await classifyWithOpenAI(dataUrl)) || (await classifyWithAnthropic(base64, mediaType));

    const description = enrichDescription(aiDescription || createFallbackDescription(file), file);

    return NextResponse.json(description, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "vision_failed",
        brands: [],
        categories: ["shoes"],
        genders: [],
        colors: [],
        keywords: ["product", "catalog", "original"],
        confidence: 0.2,
        query: "shoes product catalog original",
        searchQuery: "shoes product catalog original",
        terms: ["shoes", "product", "catalog", "original"],
        source: "fallback",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}