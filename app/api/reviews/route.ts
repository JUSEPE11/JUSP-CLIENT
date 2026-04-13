import { NextRequest, NextResponse } from "next/server";
import {
  ProductReviewError,
  createProductReview,
  getProductReviewViewer,
  listProductReviews,
  summarizeProductReviews,
} from "@/lib/productReviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function getProductKeys(req: NextRequest) {
  const productId = clean(req.nextUrl.searchParams.get("productId"));
  const productSlug = clean(req.nextUrl.searchParams.get("productSlug"));

  return {
    productId,
    productSlug,
    productKeys: [productId, productSlug].filter(Boolean),
  };
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { productId, productKeys } = getProductKeys(req);

    if (!productId) {
      return noStoreJson({ ok: false, error: "Falta productId." }, 400);
    }

    const reviews = await listProductReviews(productKeys);
    const summary = summarizeProductReviews(reviews);
    const viewer = await getProductReviewViewer(req, productKeys, reviews);

    return noStoreJson({
      ok: true,
      reviews,
      summary,
      viewer,
    });
  } catch (error) {
    if (error instanceof ProductReviewError) {
      return noStoreJson({ ok: false, error: error.message }, error.status);
    }

    const message =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : "No se pudieron cargar las reseñas.";

    return noStoreJson(
      { ok: false, error: message },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const productId = clean(body?.productId);
    const productSlug = clean(body?.productSlug);
    const productTitle = clean(body?.productTitle);
    const rating = Number(body?.rating);
    const comment = clean(body?.comment);

    const review = await createProductReview({
      req,
      productId,
      productSlug,
      productTitle,
      rating,
      comment,
    });

    const reviews = await listProductReviews([productId, productSlug].filter(Boolean));
    const summary = summarizeProductReviews(reviews);

    return noStoreJson({
      ok: true,
      review,
      summary,
    });
  } catch (error) {
    if (error instanceof ProductReviewError) {
      return noStoreJson({ ok: false, error: error.message }, error.status);
    }

    const message =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : "No se pudo guardar la reseña.";

    return noStoreJson(
      { ok: false, error: message },
      500
    );
  }
}
