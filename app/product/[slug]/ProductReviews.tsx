"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProductReview = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  authorName: string;
  createdAt: string | null;
  verifiedPurchase: boolean;
  orderCode: string | null;
};

type ProductReviewSummary = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

type ProductReviewViewer = {
  loggedIn: boolean;
  canReview: boolean;
  alreadyReviewed: boolean;
  purchaseVerified: boolean;
  reason: string | null;
  reviewerName: string | null;
};

type ReviewsResponse =
  | {
      ok: true;
      reviews: ProductReview[];
      summary: ProductReviewSummary;
      viewer: ProductReviewViewer;
    }
  | {
      ok: false;
      error: string;
    };

type ReviewSubmitResponse =
  | {
      ok: true;
      review: ProductReview;
      summary: ProductReviewSummary;
    }
  | {
      ok: false;
      error: string;
    };

function formatReviewDate(value: string | null) {
  if (!value) return "Fecha reciente";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha reciente";

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderStars(value: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const star = index + 1;
    return (
      <span key={star} aria-hidden="true" className={`star ${star <= value ? "on" : ""}`}>
        ★
      </span>
    );
  });
}

function emptySummary(): ProductReviewSummary {
  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };
}

export default function ProductReviews({
  productId,
  productSlug,
  productTitle,
}: {
  productId: string;
  productSlug?: string;
  productTitle: string;
}) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary>(emptySummary);
  const [viewer, setViewer] = useState<ProductReviewViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [draftRating, setDraftRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [draftComment, setDraftComment] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ productId });
        if (productSlug) params.set("productSlug", productSlug);

        const res = await fetch(`/api/reviews?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        const data = (await res.json().catch(() => null)) as ReviewsResponse | null;

        if (!res.ok || !data || data.ok !== true) {
          const message =
            data && "error" in data && typeof data.error === "string"
              ? data.error
              : "No se pudieron cargar las reseñas.";
          throw new Error(message);
        }

        if (cancelled) return;

        setReviews(data.reviews);
        setSummary(data.summary);
        setViewer(data.viewer);
      } catch (fetchError) {
        if (cancelled) return;
        setError(
          fetchError instanceof Error && fetchError.message
            ? fetchError.message
            : "No se pudieron cargar las reseñas."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [productId, productSlug]);

  const reviewCountLabel = useMemo(() => {
    if (summary.totalReviews === 1) return "1 reseña verificada";
    return `${summary.totalReviews} reseñas verificadas`;
  }, [summary.totalReviews]);

  const canSubmit =
    Boolean(viewer?.canReview) &&
    draftComment.trim().length >= 12 &&
    !sending;

  async function onSubmitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!viewer?.canReview) {
      setSubmitError(viewer?.reason || "No puedes comentar este producto.");
      return;
    }

    setSending(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
          productSlug,
          productTitle,
          rating: draftRating,
          comment: draftComment.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as ReviewSubmitResponse | null;

      if (!res.ok || !data || data.ok !== true) {
        const message =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : "No se pudo guardar tu reseña.";
        throw new Error(message);
      }

      setReviews((current) => [data.review, ...current]);
      setSummary(data.summary);
      setViewer((current) =>
        current
          ? {
              ...current,
              canReview: false,
              alreadyReviewed: true,
              purchaseVerified: true,
              reason: "Ya dejaste una reseña para este producto.",
            }
          : current
      );
      setDraftComment("");
      setDraftRating(5);
      setSuccessMessage("Tu comentario fue publicado con compra verificada.");
    } catch (submitReviewError) {
      setSubmitError(
        submitReviewError instanceof Error && submitReviewError.message
          ? submitReviewError.message
          : "No se pudo guardar tu reseña."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="reviewsSection" aria-labelledby="reviews-title">
      <div className="reviewsHead">
        <div>
          <div className="eyebrow">CLIENTES VERIFICADOS</div>
          <h2 id="reviews-title" className="title">
            Calificación y comentarios
          </h2>
          <p className="lead">
            Solo publicamos reseñas de clientes con compra confirmada de este producto.
          </p>
        </div>
      </div>

      <div className="reviewsGrid">
        <aside className="summaryCard">
          <div className="scoreBlock">
            <div className="score">{summary.averageRating.toFixed(1)}</div>
            <div className="scoreMeta">
              <div className="stars" aria-label={`${summary.averageRating.toFixed(1)} estrellas`}>
                {renderStars(Math.round(summary.averageRating))}
              </div>
              <div className="scoreLabel">{reviewCountLabel}</div>
            </div>
          </div>

          <div className="distList">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = summary.distribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
              const percentage = summary.totalReviews
                ? Math.round((count / summary.totalReviews) * 100)
                : 0;

              return (
                <div key={rating} className="distRow">
                  <span className="distLabel">{rating}★</span>
                  <div className="distBar">
                    <div className="distFill" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="distValue">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="summaryNote">
            Esto ayuda a que nuevos clientes vean experiencias reales antes de comprar.
          </div>
        </aside>

        <div className="contentCol">
          <div className="formCard">
            <div className="formTop">
              <div>
                <div className="formTitle">Deja tu experiencia</div>
                <div className="formHint">
                  {viewer?.purchaseVerified
                    ? "Compra verificada encontrada para este producto."
                    : "Necesitas una compra confirmada para comentar."}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="stateBox">Cargando reseñas...</div>
            ) : error ? (
              <div className="stateBox error">{error}</div>
            ) : viewer?.canReview ? (
              <form onSubmit={onSubmitReview} className="reviewForm">
                <div className="field">
                  <div className="fieldLabel">Tu calificación</div>
                  <div className="starPicker" role="radiogroup" aria-label="Califica este producto">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`starBtn ${star <= draftRating ? "on" : ""}`}
                        onClick={() => setDraftRating(star as 1 | 2 | 3 | 4 | 5)}
                        aria-label={`${star} estrellas`}
                        aria-pressed={star === draftRating}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="fieldLabel" htmlFor="review-comment">
                    Comentario
                  </label>
                  <textarea
                    id="review-comment"
                    className="textarea"
                    value={draftComment}
                    onChange={(event) => setDraftComment(event.target.value)}
                    placeholder="Cuenta cómo te fue con el producto, talla, calidad y entrega."
                    rows={5}
                    maxLength={700}
                  />
                  <div className="charCount">{draftComment.trim().length}/700</div>
                </div>

                {submitError ? <div className="stateBox error">{submitError}</div> : null}
                {successMessage ? <div className="stateBox success">{successMessage}</div> : null}

                <button type="submit" className="submitBtn" disabled={!canSubmit}>
                  {sending ? "Publicando..." : "Publicar comentario"}
                </button>
              </form>
            ) : (
              <div className="lockedBox">
                <div className="lockedTitle">
                  {viewer?.alreadyReviewed ? "Gracias por tu reseña" : "Reseñas con compra verificada"}
                </div>
                <div className="lockedText">
                  {viewer?.reason ||
                    "Solo los clientes con compra confirmada pueden dejar estrellas y comentarios."}
                </div>

                {!viewer?.loggedIn ? (
                  <Link href="/login" className="loginLink">
                    Inicia sesión
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <div className="listCard">
            <div className="listTop">
              <div className="formTitle">Lo que dicen los clientes</div>
              <div className="listHint">{reviewCountLabel}</div>
            </div>

            {loading ? (
              <div className="stateBox">Cargando comentarios...</div>
            ) : reviews.length ? (
              <div className="reviewList">
                {reviews.map((review) => (
                  <article key={review.id} className="reviewItem">
                    <div className="reviewItemTop">
                      <div>
                        <div className="reviewAuthor">{review.authorName}</div>
                        <div className="reviewMeta">
                          <span className="stars compact">{renderStars(review.rating)}</span>
                          <span>{formatReviewDate(review.createdAt)}</span>
                        </div>
                      </div>

                      {review.verifiedPurchase ? (
                        <span className="verifiedBadge">Compra verificada</span>
                      ) : null}
                    </div>

                    <p className="reviewComment">{review.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyBox">
                <div className="lockedTitle">Aun no hay comentarios</div>
                <div className="lockedText">
                  Cuando los primeros clientes dejen su experiencia, apareceran aqui.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .reviewsSection {
          margin-top: 22px;
          display: grid;
          gap: 14px;
        }

        .reviewsHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.12em;
          color: rgba(0, 0, 0, 0.55);
        }

        .title {
          margin: 8px 0 0;
          font-size: 28px;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: #111;
          font-weight: 950;
        }

        .lead {
          margin: 8px 0 0;
          max-width: 760px;
          color: rgba(0, 0, 0, 0.66);
          font-size: 14px;
          line-height: 1.6;
          font-weight: 850;
        }

        .reviewsGrid {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }

        .summaryCard,
        .formCard,
        .listCard {
          border-radius: 24px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.08);
        }

        .summaryCard {
          padding: 18px;
          position: sticky;
          top: calc(var(--jusp-header-h, 64px) + 16px);
        }

        .scoreBlock {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .score {
          font-size: 44px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
          color: rgba(0, 0, 0, 0.9);
        }

        .scoreMeta {
          display: grid;
          gap: 6px;
        }

        .stars {
          display: inline-flex;
          gap: 4px;
          align-items: center;
        }

        .star {
          font-size: 18px;
          color: rgba(0, 0, 0, 0.18);
          text-shadow: 0 8px 18px rgba(212, 175, 55, 0.12);
        }

        .star.on {
          color: #d4af37;
        }

        .stars.compact .star {
          font-size: 14px;
        }

        .scoreLabel,
        .listHint,
        .formHint {
          color: rgba(0, 0, 0, 0.62);
          font-size: 13px;
          font-weight: 850;
        }

        .distList {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        .distRow {
          display: grid;
          grid-template-columns: 36px minmax(0, 1fr) 28px;
          gap: 10px;
          align-items: center;
        }

        .distLabel,
        .distValue {
          font-size: 12px;
          font-weight: 950;
          color: rgba(0, 0, 0, 0.72);
        }

        .distBar {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.08);
        }

        .distFill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #d4af37, #f5c400);
        }

        .summaryNote {
          margin-top: 16px;
          border-radius: 18px;
          border: 1px dashed rgba(0, 0, 0, 0.12);
          background: rgba(212, 175, 55, 0.08);
          padding: 12px;
          color: rgba(0, 0, 0, 0.7);
          font-size: 12px;
          line-height: 1.6;
          font-weight: 850;
        }

        .contentCol {
          display: grid;
          gap: 14px;
        }

        .formCard,
        .listCard {
          padding: 18px;
        }

        .formTop,
        .listTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .formTitle {
          font-size: 20px;
          line-height: 1.1;
          color: #111;
          font-weight: 950;
          letter-spacing: -0.02em;
        }

        .reviewForm {
          margin-top: 14px;
          display: grid;
          gap: 14px;
        }

        .field {
          display: grid;
          gap: 10px;
        }

        .fieldLabel {
          color: rgba(0, 0, 0, 0.72);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 950;
        }

        .starPicker {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .starBtn {
          width: 46px;
          height: 46px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.92);
          color: rgba(0, 0, 0, 0.22);
          font-size: 22px;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, color 140ms ease;
        }

        .starBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
        }

        .starBtn.on {
          border-color: rgba(212, 175, 55, 0.36);
          color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12);
        }

        .textarea {
          width: 100%;
          resize: vertical;
          min-height: 132px;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.96);
          padding: 14px 15px;
          outline: none;
          color: #111;
          font: inherit;
          line-height: 1.6;
          box-sizing: border-box;
        }

        .textarea:focus {
          border-color: rgba(212, 175, 55, 0.52);
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.12);
        }

        .charCount {
          justify-self: end;
          color: rgba(0, 0, 0, 0.5);
          font-size: 12px;
          font-weight: 850;
        }

        .submitBtn,
        .loginLink {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 52px;
          padding: 0 18px;
          border-radius: 16px;
          border: 0;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          text-decoration: none;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.84));
          color: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16);
          transition: transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
        }

        .submitBtn:hover,
        .loginLink:hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 54px rgba(0, 0, 0, 0.2);
        }

        .submitBtn:disabled {
          opacity: 0.48;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .lockedBox,
        .emptyBox,
        .stateBox {
          margin-top: 14px;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.02);
          padding: 14px;
          display: grid;
          gap: 10px;
        }

        .stateBox.error {
          border-color: rgba(190, 20, 20, 0.18);
          background: rgba(190, 20, 20, 0.05);
          color: rgba(140, 10, 10, 0.94);
        }

        .stateBox.success {
          border-color: rgba(21, 128, 61, 0.22);
          background: rgba(21, 128, 61, 0.06);
          color: rgba(21, 128, 61, 0.92);
        }

        .lockedTitle {
          color: #111;
          font-size: 16px;
          font-weight: 950;
        }

        .lockedText {
          color: rgba(0, 0, 0, 0.68);
          font-size: 14px;
          line-height: 1.6;
          font-weight: 850;
        }

        .reviewList {
          margin-top: 14px;
          display: grid;
          gap: 12px;
        }

        .reviewItem {
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.9);
          padding: 14px;
          display: grid;
          gap: 10px;
        }

        .reviewItemTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .reviewAuthor {
          color: #111;
          font-size: 15px;
          font-weight: 950;
        }

        .reviewMeta {
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          color: rgba(0, 0, 0, 0.58);
          font-size: 12px;
          font-weight: 850;
        }

        .reviewComment {
          margin: 0;
          color: rgba(0, 0, 0, 0.78);
          font-size: 14px;
          line-height: 1.7;
          font-weight: 850;
        }

        .verifiedBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.26);
          background: rgba(212, 175, 55, 0.12);
          color: rgba(0, 0, 0, 0.8);
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
        }

        @media (max-width: 980px) {
          .reviewsGrid {
            grid-template-columns: 1fr;
          }

          .summaryCard {
            position: relative;
            top: auto;
          }
        }

        @media (max-width: 720px) {
          .title {
            font-size: 24px;
          }

          .scoreBlock {
            align-items: flex-start;
            flex-direction: column;
          }

          .distRow {
            grid-template-columns: 32px minmax(0, 1fr) 24px;
          }
        }
      `}</style>
    </section>
  );
}
