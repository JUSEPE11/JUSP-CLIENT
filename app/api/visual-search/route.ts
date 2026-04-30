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
Use these category values when possible: shoes, shirt, pants, shorts, jacket, sports-bra, hoodie, cap, bag, socks, dress, leggings.
Use these gender values when possible: women, men, kids, unisex.
Include visible logos, product family words, and shape clues in keywords.`;

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      String(item ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeVisionDescription(value: unknown): VisualAIDescription | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  return {
    brands: normalizeList(raw.brands),
    categories: normalizeList(raw.categories),
    genders: normalizeList(raw.genders),
    colors: normalizeList(raw.colors),
    keywords: normalizeList(raw.keywords),
    confidence:
      typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
        ? Math.max(0, Math.min(1, raw.confidence))
        : 0.45,
  };
}

function extractJsonObject(text: string): unknown {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : clean);
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
      max_output_tokens: 320,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return normalizeVisionDescription(extractJsonObject(getOpenAIText(data)));
}

async function classifyWithAnthropic(base64: string, mediaType: string): Promise<VisualAIDescription | null> {
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
      max_tokens: 320,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "Classify this product image for ecommerce search." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.content?.find((item: any) => item?.type === "text")?.text || "";
  return normalizeVisionDescription(extractJsonObject(text));
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "invalid_image" }, { status: 400 });
    }

    if (file.size > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "image_too_large" }, { status: 413 });
    }

    const mediaType = file.type || "image/jpeg";
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mediaType};base64,${base64}`;

    const description =
      (await classifyWithOpenAI(dataUrl)) || (await classifyWithAnthropic(base64, mediaType));

    if (!description) {
      return NextResponse.json({ error: "vision_unavailable" }, { status: 503 });
    }

    return NextResponse.json(description);
  } catch {
    return NextResponse.json({ error: "vision_failed" }, { status: 500 });
  }
}
