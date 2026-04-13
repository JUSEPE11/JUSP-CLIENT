import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

const QUALIFYING_PURCHASE_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
]);

type ReviewRating = 1 | 2 | 3 | 4 | 5;

type ReviewLogMeta = {
  kind?: string;
  product_id?: string;
  product_slug?: string | null;
  product_title?: string | null;
  rating?: number;
  comment?: string;
  author_name?: string | null;
  verified_purchase?: boolean;
  order_code?: string | null;
  purchase_status?: string | null;
  purchased_at?: string | null;
};

type ReviewLogRow = {
  id?: string | null;
  created_at?: string | null;
  user_email?: string | null;
  order_id?: string | null;
  meta?: ReviewLogMeta | null;
};

type ReviewOrderItem = {
  id?: string | null;
  product_id?: string | null;
  name?: string | null;
};

type ReviewOrderRow = {
  id?: string | null;
  order_code?: string | null;
  status?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  user_id?: string | null;
  items?: ReviewOrderItem[] | null;
};

type SessionIdentity = {
  userId: string | null;
  email: string | null;
};

type ProductReviewPurchase = {
  orderId: string | null;
  orderCode: string | null;
  status: string | null;
  customerName: string | null;
  purchasedAt: string | null;
};

type ProductReviewViewerInternal = {
  loggedIn: boolean;
  canReview: boolean;
  alreadyReviewed: boolean;
  purchaseVerified: boolean;
  reason: string | null;
  reviewerName: string | null;
  identity: SessionIdentity | null;
  purchase: ProductReviewPurchase | null;
};

export type ProductReview = {
  id: string;
  rating: ReviewRating;
  comment: string;
  authorName: string;
  userEmail: string | null;
  createdAt: string | null;
  verifiedPurchase: boolean;
  orderCode: string | null;
};

export type ProductReviewSummary = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<ReviewRating, number>;
};

export type ProductReviewViewer = Omit<
  ProductReviewViewerInternal,
  "identity" | "purchase"
>;

export class ProductReviewError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getReviewDbClient() {
  const url =
    normalizeText(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    normalizeText(process.env.SUPABASE_URL);
  const key =
    normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    normalizeText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    throw new ProductReviewError(
      500,
      "Faltan variables de Supabase para cargar las reseñas."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeKey(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function buildProductKeySet(productKeys: string[]) {
  return new Set(
    productKeys
      .map((value) => normalizeKey(value))
      .filter(Boolean)
  );
}

function safeMeta(value: unknown): ReviewLogMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as ReviewLogMeta;
}

function toReviewRating(value: unknown): ReviewRating | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n as ReviewRating;
}

function maskReviewerName(name: string | null, email: string | null) {
  const source = normalizeText(name) || normalizeEmail(email).split("@")[0] || "Cliente";
  const parts = source
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return "Cliente verificado";

  const first = parts[0];
  const restInitial = parts.length > 1 ? `${parts[1][0]}.` : "";

  return [capitalizeWord(first), restInitial].filter(Boolean).join(" ");
}

function capitalizeWord(value: string) {
  const clean = normalizeText(value).toLowerCase();
  if (!clean) return "";
  return clean[0].toUpperCase() + clean.slice(1);
}

function isQualifyingPurchaseStatus(status: unknown) {
  return QUALIFYING_PURCHASE_STATUSES.has(normalizeKey(status));
}

function extractOrderItems(order: ReviewOrderRow) {
  return Array.isArray(order.items) ? order.items : [];
}

function orderContainsProduct(order: ReviewOrderRow, productKeySet: Set<string>) {
  return extractOrderItems(order).some((item) => {
    const candidates = [
      normalizeKey(item?.id),
      normalizeKey(item?.product_id),
      normalizeKey(item?.name),
    ].filter(Boolean);

    return candidates.some((candidate) => productKeySet.has(candidate));
  });
}

function mapReviewRow(row: ReviewLogRow): ProductReview | null {
  const meta = safeMeta(row.meta);
  const rating = toReviewRating(meta.rating);
  const comment = normalizeText(meta.comment);

  if (!rating || !comment) return null;

  return {
    id: normalizeText(row.id) || `${normalizeText(row.order_id)}-${normalizeText(row.created_at)}`,
    rating,
    comment,
    authorName: maskReviewerName(meta.author_name ?? null, row.user_email ?? null),
    userEmail: normalizeEmail(row.user_email) || null,
    createdAt: normalizeText(row.created_at) || null,
    verifiedPurchase: Boolean(meta.verified_purchase),
    orderCode: normalizeText(meta.order_code || row.order_id) || null,
  };
}

async function getSessionIdentity(req: NextRequest): Promise<SessionIdentity | null> {
  const accessToken = req.cookies.get(COOKIE_AT)?.value;
  if (!accessToken) return null;

  try {
    const payload = await verifyAccessToken(accessToken);
    return {
      userId: normalizeText(payload?.sub || payload?.userId || payload?.id) || null,
      email: normalizeEmail(payload?.email || payload?.user?.email) || null,
    };
  } catch {
    return null;
  }
}

export async function listProductReviews(productKeys: string[]) {
  const productKeySet = buildProductKeySet(productKeys);
  if (!productKeySet.size) return [] as ProductReview[];

  const db = getReviewDbClient();
  const { data, error } = await db
    .from("logs")
    .select("id, created_at, user_email, order_id, meta")
    .eq("scope", "product_review")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new ProductReviewError(500, error.message || "No se pudieron cargar las reseñas.");
  }

  const rows = Array.isArray(data) ? (data as ReviewLogRow[]) : [];

  return rows
    .filter((row) => {
      const meta = safeMeta(row.meta);
      const reviewProductKeys = [
        normalizeKey(meta.product_id),
        normalizeKey(meta.product_slug),
      ].filter(Boolean);

      return reviewProductKeys.some((key) => productKeySet.has(key));
    })
    .map(mapReviewRow)
    .filter((review): review is ProductReview => Boolean(review));
}

export function summarizeProductReviews(reviews: ProductReview[]): ProductReviewSummary {
  const distribution: Record<ReviewRating, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (!reviews.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution,
    };
  }

  let total = 0;

  for (const review of reviews) {
    distribution[review.rating] += 1;
    total += review.rating;
  }

  return {
    averageRating: Number((total / reviews.length).toFixed(1)),
    totalReviews: reviews.length,
    distribution,
  };
}

async function resolveReviewViewerInternal(
  req: NextRequest,
  productKeys: string[],
  reviews: ProductReview[]
): Promise<ProductReviewViewerInternal> {
  const identity = await getSessionIdentity(req);

  if (!identity?.email && !identity?.userId) {
    return {
      loggedIn: false,
      canReview: false,
      alreadyReviewed: false,
      purchaseVerified: false,
      reason: "Inicia sesión para dejar tu reseña.",
      reviewerName: null,
      identity: null,
      purchase: null,
    };
  }

  const viewerEmail = normalizeEmail(identity.email);

  if (viewerEmail && reviews.some((review) => normalizeEmail(review.userEmail) === viewerEmail)) {
    return {
      loggedIn: true,
      canReview: false,
      alreadyReviewed: true,
      purchaseVerified: true,
      reason: "Ya dejaste una reseña para este producto.",
      reviewerName: null,
      identity,
      purchase: null,
    };
  }

  const db = getReviewDbClient();
  let query = db
    .from("orders")
    .select("id, order_code, status, paid_at, created_at, customer_name, customer_email, user_id, items")
    .order("created_at", { ascending: false })
    .limit(100);

  if (identity.userId) {
    query = query.eq("user_id", identity.userId);
  } else if (viewerEmail) {
    query = query.eq("customer_email", viewerEmail);
  }

  const { data, error } = await query;

  if (error) {
    throw new ProductReviewError(500, error.message || "No se pudo verificar la compra.");
  }

  const productKeySet = buildProductKeySet(productKeys);
  const orders = Array.isArray(data) ? (data as ReviewOrderRow[]) : [];

  const qualifyingOrder =
    orders.find(
      (order) =>
        isQualifyingPurchaseStatus(order.status) &&
        orderContainsProduct(order, productKeySet)
    ) || null;

  if (!qualifyingOrder) {
    return {
      loggedIn: true,
      canReview: false,
      alreadyReviewed: false,
      purchaseVerified: false,
      reason: "Solo los clientes que compraron este producto pueden dejar comentarios.",
      reviewerName: null,
      identity,
      purchase: null,
    };
  }

  const purchase: ProductReviewPurchase = {
    orderId: normalizeText(qualifyingOrder.id) || null,
    orderCode: normalizeText(qualifyingOrder.order_code) || null,
    status: normalizeText(qualifyingOrder.status) || null,
    customerName: normalizeText(qualifyingOrder.customer_name) || null,
    purchasedAt:
      normalizeText(qualifyingOrder.paid_at) ||
      normalizeText(qualifyingOrder.created_at) ||
      null,
  };

  return {
    loggedIn: true,
    canReview: true,
    alreadyReviewed: false,
    purchaseVerified: true,
    reason: null,
    reviewerName: purchase.customerName || maskReviewerName(null, viewerEmail),
    identity,
    purchase,
  };
}

export async function getProductReviewViewer(
  req: NextRequest,
  productKeys: string[],
  reviews: ProductReview[]
): Promise<ProductReviewViewer> {
  const internal = await resolveReviewViewerInternal(req, productKeys, reviews);

  return {
    loggedIn: internal.loggedIn,
    canReview: internal.canReview,
    alreadyReviewed: internal.alreadyReviewed,
    purchaseVerified: internal.purchaseVerified,
    reason: internal.reason,
    reviewerName: internal.reviewerName,
  };
}

export async function createProductReview(params: {
  req: NextRequest;
  productId: string;
  productSlug?: string | null;
  productTitle?: string | null;
  rating: number;
  comment: string;
}) {
  const productId = normalizeText(params.productId);
  const productSlug = normalizeText(params.productSlug);
  const productTitle = normalizeText(params.productTitle);
  const comment = normalizeText(params.comment);
  const rating = toReviewRating(params.rating);

  if (!productId) {
    throw new ProductReviewError(400, "Falta el producto de la reseña.");
  }

  if (!rating) {
    throw new ProductReviewError(400, "La calificación debe ser entre 1 y 5 estrellas.");
  }

  if (comment.length < 12) {
    throw new ProductReviewError(400, "Escribe al menos 12 caracteres en tu comentario.");
  }

  if (comment.length > 700) {
    throw new ProductReviewError(400, "El comentario es demasiado largo.");
  }

  const productKeys = [productId, productSlug].filter(Boolean);
  const reviews = await listProductReviews(productKeys);
  const viewer = await resolveReviewViewerInternal(params.req, productKeys, reviews);

  if (!viewer.loggedIn || !viewer.identity) {
    throw new ProductReviewError(401, "Debes iniciar sesión para comentar.");
  }

  if (!viewer.purchaseVerified || !viewer.purchase) {
    throw new ProductReviewError(
      403,
      viewer.reason || "Solo los clientes que compraron este producto pueden dejar comentarios."
    );
  }

  if (viewer.alreadyReviewed || !viewer.canReview) {
    throw new ProductReviewError(
      409,
      viewer.reason || "Ya dejaste una reseña para este producto."
    );
  }

  const db = getReviewDbClient();
  const insertPayload = {
    level: "info",
    scope: "product_review",
    message: "Cliente dejó una reseña de producto",
    user_email: viewer.identity.email,
    order_id: viewer.purchase.orderCode || viewer.purchase.orderId,
    meta: {
      kind: "product_review",
      product_id: productId,
      product_slug: productSlug || null,
      product_title: productTitle || null,
      rating,
      comment,
      author_name: viewer.reviewerName,
      verified_purchase: true,
      order_code: viewer.purchase.orderCode,
      purchase_status: viewer.purchase.status,
      purchased_at: viewer.purchase.purchasedAt,
    },
  };

  const { data, error } = await db
    .from("logs")
    .insert(insertPayload)
    .select("id, created_at, user_email, order_id, meta")
    .single();

  if (error) {
    throw new ProductReviewError(500, error.message || "No se pudo guardar la reseña.");
  }

  const review = mapReviewRow(data as ReviewLogRow);

  if (!review) {
    throw new ProductReviewError(500, "La reseña se guardó pero no se pudo leer.");
  }

  return review;
}
