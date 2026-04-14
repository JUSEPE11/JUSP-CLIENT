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
  product_key?: string | null;
  product_id?: string | null;
  product_slug?: string | null;
  product_title?: string | null;
  rating?: number;
  comment?: string;
  author_name?: string | null;
  user_id?: string | null;
  reviewer_key?: string | null;
  verified_purchase?: boolean;
  order_code?: string | null;
  purchase_status?: string | null;
  purchased_at?: string | null;
};

type ReviewLogRow = {
  id?: string | number | null;
  created_at?: string | null;
  user_email?: string | null;
  order_id?: string | null;
  meta?: ReviewLogMeta | null;
};

type ProductReviewRow = {
  id?: string | number | null;
  created_at?: string | null;
  product_key?: string | null;
  product_id?: string | null;
  product_slug?: string | null;
  product_title?: string | null;
  rating?: number | null;
  comment?: string | null;
  author_name?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  reviewer_key?: string | null;
  verified_purchase?: boolean | null;
  order_id?: string | null;
  order_code?: string | null;
  purchase_status?: string | null;
  purchased_at?: string | null;
};

type ReviewOrderItem = {
  id?: string | null;
  product_id?: string | null;
  slug?: string | null;
  product_slug?: string | null;
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

type AccessTokenPayload = {
  sub?: string | null;
  userId?: string | null;
  id?: string | null;
  email?: string | null;
  user?: {
    email?: string | null;
  } | null;
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

type StoredProductReview = ProductReview & {
  userId: string | null;
  userEmail: string | null;
  reviewerKey: string | null;
  productKey: string;
  orderId: string | null;
};

type DbErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

let productReviewsTableAvailable: boolean | null = null;

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

function buildProductKey(...values: unknown[]) {
  for (const value of values) {
    const key = normalizeKey(value);
    if (key) return key;
  }

  return "";
}

function buildReviewerKey(userId: unknown, email: unknown) {
  const safeUserId = normalizeText(userId);
  if (safeUserId) return `uid:${safeUserId}`;

  const safeEmail = normalizeEmail(email);
  if (safeEmail) return `email:${safeEmail}`;

  return "";
}

function buildProductKeySet(productKeys: string[]) {
  return new Set(
    productKeys
      .map((value) => buildProductKey(value))
      .filter(Boolean)
  );
}

function safeMeta(value: unknown): ReviewLogMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as ReviewLogMeta;
}

function safeAccessTokenPayload(value: unknown): AccessTokenPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const userValue = record.user;
  const user =
    userValue && typeof userValue === "object" && !Array.isArray(userValue)
      ? (userValue as Record<string, unknown>)
      : null;

  return {
    sub: typeof record.sub === "string" ? record.sub : null,
    userId: typeof record.userId === "string" ? record.userId : null,
    id: typeof record.id === "string" ? record.id : null,
    email: typeof record.email === "string" ? record.email : null,
    user: user
      ? {
          email: typeof user.email === "string" ? user.email : null,
        }
      : null,
  };
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
      normalizeKey(item?.slug),
      normalizeKey(item?.product_slug),
      normalizeKey(item?.id),
      normalizeKey(item?.product_id),
      normalizeKey(item?.name),
    ].filter(Boolean);

    return candidates.some((candidate) => productKeySet.has(candidate));
  });
}

function mapProductReviewRow(row: ProductReviewRow): StoredProductReview | null {
  const rating = toReviewRating(row.rating);
  const comment = normalizeText(row.comment);
  const productKey = buildProductKey(row.product_key, row.product_slug, row.product_id);

  if (!rating || !comment || !productKey) return null;

  const userEmail = normalizeEmail(row.user_email) || null;
  const userId = normalizeText(row.user_id) || null;

  return {
    id:
      normalizeText(row.id) ||
      `${productKey}-${normalizeText(row.order_code || row.order_id)}-${normalizeText(row.created_at)}`,
    rating,
    comment,
    authorName: maskReviewerName(normalizeText(row.author_name) || null, userEmail),
    createdAt: normalizeText(row.created_at) || null,
    verifiedPurchase: row.verified_purchase !== false,
    orderCode: normalizeText(row.order_code || row.order_id) || null,
    userId,
    userEmail,
    reviewerKey: normalizeText(row.reviewer_key) || buildReviewerKey(userId, userEmail) || null,
    productKey,
    orderId: normalizeText(row.order_id) || null,
  };
}

function mapLegacyReviewRow(row: ReviewLogRow): StoredProductReview | null {
  const meta = safeMeta(row.meta);
  const rating = toReviewRating(meta.rating);
  const comment = normalizeText(meta.comment);
  const productKey = buildProductKey(meta.product_key, meta.product_slug, meta.product_id);

  if (!rating || !comment || !productKey) return null;

  const userEmail = normalizeEmail(row.user_email) || null;
  const userId = normalizeText(meta.user_id) || null;

  return {
    id:
      normalizeText(row.id) ||
      `${productKey}-${normalizeText(meta.order_code || row.order_id)}-${normalizeText(row.created_at)}`,
    rating,
    comment,
    authorName: maskReviewerName(meta.author_name ?? null, userEmail),
    createdAt: normalizeText(row.created_at) || null,
    verifiedPurchase: meta.verified_purchase !== false,
    orderCode: normalizeText(meta.order_code || row.order_id) || null,
    userId,
    userEmail,
    reviewerKey:
      normalizeText(meta.reviewer_key) || buildReviewerKey(userId, userEmail) || null,
    productKey,
    orderId: normalizeText(row.order_id) || null,
  };
}

export function toPublicProductReview(review: StoredProductReview): ProductReview {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    authorName: review.authorName,
    createdAt: review.createdAt,
    verifiedPurchase: review.verifiedPurchase,
    orderCode: review.orderCode,
  };
}

async function getSessionIdentity(req: NextRequest): Promise<SessionIdentity | null> {
  const accessToken = req.cookies.get(COOKIE_AT)?.value;
  if (!accessToken) return null;

  try {
    const payload = safeAccessTokenPayload(await verifyAccessToken(accessToken));
    return {
      userId: normalizeText(payload?.sub || payload?.userId || payload?.id) || null,
      email: normalizeEmail(payload?.email || payload?.user?.email) || null,
    };
  } catch {
    return null;
  }
}

function isMissingProductReviewsTableError(error: DbErrorLike | null | undefined) {
  const text = [
    normalizeText(error?.code),
    normalizeText(error?.message),
    normalizeText(error?.details),
    normalizeText(error?.hint),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("product_reviews") &&
    (
      text.includes("does not exist") ||
      text.includes("relation") ||
      text.includes("could not find the table") ||
      text.includes("42p01") ||
      text.includes("pgrst205")
    )
  );
}

function isDuplicateProductReviewError(error: DbErrorLike | null | undefined) {
  const text = [
    normalizeText(error?.code),
    normalizeText(error?.message),
    normalizeText(error?.details),
    normalizeText(error?.hint),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("product_reviews_one_per_reviewer_product_idx") ||
    text.includes("product_reviews_unique_reviewer_product") ||
    (
      text.includes("duplicate key value violates unique constraint") &&
      text.includes("product_reviews")
    )
  );
}

async function hasProductReviewsTable() {
  if (productReviewsTableAvailable !== null) {
    return productReviewsTableAvailable;
  }

  const db = getReviewDbClient();
  const { error } = await db
    .from("product_reviews")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (error) {
    if (isMissingProductReviewsTableError(error)) {
      productReviewsTableAvailable = false;
      return false;
    }

    throw new ProductReviewError(
      500,
      error.message || "No se pudo verificar la tabla de reseñas."
    );
  }

  productReviewsTableAvailable = true;
  return true;
}

async function listLegacyStoredProductReviews(productKeys: string[]) {
  const productKeySet = buildProductKeySet(productKeys);
  if (!productKeySet.size) return [] as StoredProductReview[];

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
    .map(mapLegacyReviewRow)
    .filter((review): review is StoredProductReview => Boolean(review))
    .filter((review) => productKeySet.has(review.productKey));
}

export async function listStoredProductReviews(productKeys: string[]) {
  const productKeySet = buildProductKeySet(productKeys);
  if (!productKeySet.size) return [] as StoredProductReview[];

  if (!(await hasProductReviewsTable())) {
    return listLegacyStoredProductReviews(productKeys);
  }

  const db = getReviewDbClient();
  const { data, error } = await db
    .from("product_reviews")
    .select(
      "id, created_at, product_key, product_id, product_slug, product_title, rating, comment, author_name, user_id, user_email, reviewer_key, verified_purchase, order_id, order_code, purchase_status, purchased_at"
    )
    .in("product_key", Array.from(productKeySet))
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (isMissingProductReviewsTableError(error)) {
      productReviewsTableAvailable = false;
      return listLegacyStoredProductReviews(productKeys);
    }

    throw new ProductReviewError(500, error.message || "No se pudieron cargar las reseñas.");
  }

  const rows = Array.isArray(data) ? (data as ProductReviewRow[]) : [];

  return rows
    .map(mapProductReviewRow)
    .filter((review): review is StoredProductReview => Boolean(review));
}

export async function listProductReviews(productKeys: string[]) {
  const reviews = await listStoredProductReviews(productKeys);
  return reviews.map(toPublicProductReview);
}

export function summarizeProductReviews(
  reviews: readonly Pick<ProductReview, "rating">[]
): ProductReviewSummary {
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

async function fetchOrdersByField(
  field: "user_id" | "customer_email",
  value: string
) {
  const db = getReviewDbClient();
  const { data, error } = await db
    .from("orders")
    .select("id, order_code, status, paid_at, created_at, customer_name, customer_email, user_id, items")
    .eq(field, value)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new ProductReviewError(500, error.message || "No se pudo verificar la compra.");
  }

  return Array.isArray(data) ? (data as ReviewOrderRow[]) : [];
}

async function listCandidateOrders(identity: SessionIdentity) {
  const tasks: Array<Promise<ReviewOrderRow[]>> = [];
  const safeUserId = normalizeText(identity.userId);
  const safeEmail = normalizeEmail(identity.email);

  if (safeUserId) {
    tasks.push(fetchOrdersByField("user_id", safeUserId));
  }

  if (safeEmail) {
    tasks.push(fetchOrdersByField("customer_email", safeEmail));
  }

  if (!tasks.length) {
    return [] as ReviewOrderRow[];
  }

  const groups = await Promise.all(tasks);
  const merged = new Map<string, ReviewOrderRow>();

  for (const rows of groups) {
    for (const row of rows) {
      const key =
        normalizeText(row.id) ||
        normalizeText(row.order_code) ||
        `${normalizeEmail(row.customer_email)}-${normalizeText(row.created_at)}`;

      if (!key || merged.has(key)) continue;
      merged.set(key, row);
    }
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

async function resolveReviewViewerInternal(
  req: NextRequest,
  productKeys: string[],
  reviews: StoredProductReview[]
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
  const reviewerKey = buildReviewerKey(identity.userId, viewerEmail);

  if (
    reviews.some((review) => {
      if (reviewerKey && review.reviewerKey === reviewerKey) return true;
      if (identity.userId && normalizeText(review.userId) === normalizeText(identity.userId)) return true;
      if (viewerEmail && normalizeEmail(review.userEmail) === viewerEmail) return true;
      return false;
    })
  ) {
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

  const productKeySet = buildProductKeySet(productKeys);
  const orders = await listCandidateOrders(identity);

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
  reviews: StoredProductReview[]
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

async function insertDedicatedProductReview(
  review: StoredProductReview,
  productId: string,
  productSlug: string,
  productTitle: string,
  purchase: ProductReviewPurchase
) {
  const db = getReviewDbClient();
  const insertPayload = {
    product_key: review.productKey,
    product_id: productId,
    product_slug: productSlug || null,
    product_title: productTitle || null,
    rating: review.rating,
    comment: review.comment,
    author_name: review.authorName,
    user_id: review.userId,
    user_email: review.userEmail,
    reviewer_key: review.reviewerKey,
    verified_purchase: true,
    order_id: review.orderId,
    order_code: purchase.orderCode,
    purchase_status: purchase.status,
    purchased_at: purchase.purchasedAt,
  };

  const { data, error } = await db
    .from("product_reviews")
    .insert(insertPayload)
    .select(
      "id, created_at, product_key, product_id, product_slug, product_title, rating, comment, author_name, user_id, user_email, reviewer_key, verified_purchase, order_id, order_code, purchase_status, purchased_at"
    )
    .single();

  if (error) {
    if (isMissingProductReviewsTableError(error)) {
      productReviewsTableAvailable = false;
      return null;
    }

    if (isDuplicateProductReviewError(error)) {
      throw new ProductReviewError(409, "Ya dejaste una reseña para este producto.");
    }

    throw new ProductReviewError(500, error.message || "No se pudo guardar la reseña.");
  }

  const stored = mapProductReviewRow(data as ProductReviewRow);
  if (!stored) {
    throw new ProductReviewError(500, "La reseña se guardó pero no se pudo leer.");
  }

  return stored;
}

async function insertLegacyProductReview(
  review: StoredProductReview,
  productId: string,
  productSlug: string,
  productTitle: string,
  purchase: ProductReviewPurchase
) {
  const db = getReviewDbClient();
  const insertPayload = {
    level: "info",
    scope: "product_review",
    message: "Cliente dejó una reseña de producto",
    user_email: review.userEmail,
    order_id: purchase.orderCode || purchase.orderId,
    meta: {
      kind: "product_review",
      product_key: review.productKey,
      product_id: productId,
      product_slug: productSlug || null,
      product_title: productTitle || null,
      rating: review.rating,
      comment: review.comment,
      author_name: review.authorName,
      user_id: review.userId,
      reviewer_key: review.reviewerKey,
      verified_purchase: true,
      order_code: purchase.orderCode,
      purchase_status: purchase.status,
      purchased_at: purchase.purchasedAt,
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

  const stored = mapLegacyReviewRow(data as ReviewLogRow);
  if (!stored) {
    throw new ProductReviewError(500, "La reseña se guardó pero no se pudo leer.");
  }

  return stored;
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
  const productKey = buildProductKey(productSlug, productId);

  if (!productId) {
    throw new ProductReviewError(400, "Falta el producto de la reseña.");
  }

  if (!productKey) {
    throw new ProductReviewError(400, "No se pudo resolver el producto de la reseña.");
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
  const reviews = await listStoredProductReviews(productKeys);
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

  const reviewerKey = buildReviewerKey(viewer.identity.userId, viewer.identity.email);

  if (!reviewerKey) {
    throw new ProductReviewError(401, "No se pudo validar tu identidad para comentar.");
  }

  const draftReview: StoredProductReview = {
    id: "",
    rating,
    comment,
    authorName: viewer.reviewerName || "Cliente verificado",
    createdAt: null,
    verifiedPurchase: true,
    orderCode: viewer.purchase.orderCode || viewer.purchase.orderId,
    userId: viewer.identity.userId,
    userEmail: normalizeEmail(viewer.identity.email) || null,
    reviewerKey,
    productKey,
    orderId: viewer.purchase.orderId,
  };

  let storedReview: StoredProductReview | null = null;

  if (await hasProductReviewsTable()) {
    storedReview = await insertDedicatedProductReview(
      draftReview,
      productId,
      productSlug,
      productTitle,
      viewer.purchase
    );
  }

  if (!storedReview) {
    storedReview = await insertLegacyProductReview(
      draftReview,
      productId,
      productSlug,
      productTitle,
      viewer.purchase
    );
  }

  return toPublicProductReview(storedReview);
}
