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

type ReviewFilter = "all" | "5" | "4";

type ViewerState = {
  badge: string;
  badgeTone: "loading" | "ready" | "locked" | "done";
  title: string;
  text: string;
  helper: string | null;
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

function resolveViewerState(viewer: ProductReviewViewer | null): ViewerState {
  if (!viewer) {
    return {
      badge: "Validando acceso",
      badgeTone: "loading",
      title: "Estamos comprobando tu cuenta",
      text: "Verificamos tu sesión y tus compras para decidir si puedes comentar este producto.",
      helper: null,
    };
  }

  if (viewer.canReview) {
    return {
      badge: "Compra verificada",
      badgeTone: "ready",
      title: "Ya puedes compartir tu experiencia",
      text: "Tu compra fue confirmada. Cuéntales a otros clientes cómo te quedó, qué tal la calidad y cómo llegó.",
      helper: "Tu comentario se publicará como reseña verificada.",
    };
  }

  if (viewer.alreadyReviewed) {
    return {
      badge: "Reseña publicada",
      badgeTone: "done",
      title: "Tu reseña ya quedó registrada",
      text: "Tu comentario ya aparece en este producto y sigue ayudando a otros compradores.",
      helper: viewer.reason,
    };
  }

  if (!viewer.loggedIn) {
    return {
      badge: "Sesión requerida",
      badgeTone: "locked",
      title: "Entra con tu cuenta para revisar acceso",
      text: "Si compraste este producto con tu cuenta, al iniciar sesión podremos habilitar estrellas y comentario.",
      helper: "Solo publicamos reseñas de clientes con compra confirmada.",
    };
  }

  return {
    badge: "Compra requerida",
    badgeTone: "locked",
    title: "Las reseñas están reservadas para compradores",
    text: "Cuando tu cuenta tenga una compra confirmada de este producto, aquí se abrirá el formulario para comentar.",
    helper: viewer.reason,
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
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

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

  useEffect(() => {
    if (!showAllReviews) return;

    const previousOverflow = document.body.style.overflow;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowAllReviews(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showAllReviews]);

  const reviewCountLabel = useMemo(() => {
    if (summary.totalReviews === 1) return "1 reseña verificada";
    return `${summary.totalReviews} reseñas verificadas`;
  }, [summary.totalReviews]);

  const viewerState = useMemo(() => resolveViewerState(viewer), [viewer]);

  const latestReview = reviews[0] ?? null;
  const hasMoreReviews = reviews.length > 1;
  const canOpenReviewsPanel = !loading;
  const fiveStarCount = summary.distribution[5] || 0;
  const fourOrLessCount = Math.max(0, summary.totalReviews - fiveStarCount);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "5") {
      return reviews.filter((review) => review.rating === 5);
    }

    if (reviewFilter === "4") {
      return reviews.filter((review) => review.rating <= 4);
    }

    return reviews;
  }, [reviewFilter, reviews]);

  const accessCardTitle = loading
    ? "Estamos preparando las reseñas"
    : viewer?.canReview
      ? "Comparte cómo te fue"
      : viewer?.alreadyReviewed
        ? "Tu reseña ya está publicada"
        : "Opiniones reales de personas que ya compraron";

  const accessCardHint = loading
    ? "Comprobamos tu sesión y la compra asociada a este producto."
    : viewer?.canReview
      ? "Tu compra ya fue validada. Cuéntales a otros clientes cómo te quedó y cómo llegó."
      : viewer?.alreadyReviewed
        ? "Tu comentario ya aparece en este producto y sigue ayudando a otros compradores."
        : viewerState.text;

  const latestReviewTitle =
    summary.totalReviews > 1
      ? "Reseña más reciente"
      : summary.totalReviews === 1
        ? "Reseña verificada"
        : "Aún sin reseñas";

  const isLoginRequiredState = Boolean(viewer && !viewer.loggedIn);
  const isPurchaseRequiredState = Boolean(
    viewer && viewer.loggedIn && !viewer.canReview && !viewer.alreadyReviewed
  );

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

      setReviews((current) => [
        data.review,
        ...current.filter((review) => review.id !== data.review.id),
      ]);
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
      setReviewFilter("all");
      setShowAllReviews(false);
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
            Este producto es nuevo. Sé de los primeros en recibirlo y compartir tu experiencia.
          </div>
        </aside>

        <div className="contentCol">
          <div className="formCard">
            <div className="formTop">
              <div>
                <div className="panelEyebrow">Tu acceso a reseñas</div>
                <div className="formTitle">{accessCardTitle}</div>
                <div className="formHint">{accessCardHint}</div>
              </div>
              <span className={`statusPill ${loading ? "loading" : viewerState.badgeTone}`}>
                {loading ? "Validando acceso" : viewerState.badge}
              </span>
            </div>

            {loading ? (
              <div className="stateBox">Cargando reseñas...</div>
            ) : error ? (
              <div className="stateBox error">{error}</div>
            ) : viewer?.canReview ? (
              <form onSubmit={onSubmitReview} className="reviewForm">
                <div className="inlineInfo">
                  <span className="miniBadge">Compra confirmada</span>
                  <span>Tu comentario aparecerá con sello de reseña verificada.</span>
                </div>

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
              <div
                className={`lockedBox ${viewer?.alreadyReviewed ? "successTone" : ""} ${
                  isLoginRequiredState ? "compact" : ""
                }`}
              >
                {isLoginRequiredState ? (
                  <>
                    <div className="miniBadge login">Acceso seguro</div>
                    <div className="lockedText">
                      Inicia sesión para revisar si tu cuenta tiene una compra confirmada de este
                      producto.
                    </div>
                    <div className="helperText">
                      Solo habilitamos estrellas y comentarios cuando encontramos una compra
                      válida en tu historial.
                    </div>
                    <Link href="/login" className="loginLink">
                      Iniciar sesión
                    </Link>
                  </>
                ) : isPurchaseRequiredState ? (
                  <>
                    <div className="lockedTitle">Compra requerida para comentar</div>
                    <div className="lockedText">
                      Esta sección se activa automáticamente cuando tu cuenta tenga una compra
                      confirmada de este producto.
                    </div>
                    {viewerState.helper ? <div className="helperText">{viewerState.helper}</div> : null}
                  </>
                ) : (
                  <>
                    <div className="lockedTitle">{viewerState.title}</div>
                    <div className="lockedText">{viewerState.text}</div>
                    {viewerState.helper ? <div className="helperText">{viewerState.helper}</div> : null}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="listCard">
            <div className="listTop">
              <div>
                <div className="panelEyebrow">Lo que dicen los clientes</div>
                <div className="formTitle">{latestReviewTitle}</div>
              </div>
              <div className="listActions">
                <div className="listHint">{reviewCountLabel}</div>
                {canOpenReviewsPanel ? (
                  <button
                    type="button"
                    className="ghostBtn"
                    onClick={() => {
                      setReviewFilter("all");
                      setShowAllReviews(true);
                    }}
                  >
                    Ver todas las reseñas
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="stateBox">Cargando comentarios...</div>
            ) : reviews.length ? (
              <div className="latestWrap">
                {latestReview ? (
                  <article className="reviewItem feature">
                    <div className="reviewItemTop">
                      <div>
                        <div className="reviewAuthor">{latestReview.authorName}</div>
                        <div className="reviewMeta">
                          <span className="stars compact">{renderStars(latestReview.rating)}</span>
                          <span>{formatReviewDate(latestReview.createdAt)}</span>
                        </div>
                      </div>

                      {latestReview.verifiedPurchase ? (
                        <span className="verifiedBadge">Compra verificada</span>
                      ) : null}
                    </div>

                    <p className="reviewComment preview">{latestReview.comment}</p>
                  </article>
                ) : null}

                {hasMoreReviews ? (
                  <div className="moreRow">
                    <div>
                      <div className="moreTitle">Hay más experiencias verificadas</div>
                      <div className="moreHint">
                        Mostramos primero la reseña más reciente para mantener esta página ligera.
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="emptyBox">
                <div className="lockedTitle">Aún no hay comentarios</div>
                <div className="lockedText">
                  Cuando los primeros clientes dejen su experiencia, aparecerán aquí.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAllReviews ? (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reviews-overlay-title"
          onClick={() => setShowAllReviews(false)}
        >
          <div className="overlayPanel" onClick={(event) => event.stopPropagation()}>
            <div className="overlayHead">
              <div>
                <div className="panelEyebrow">Clientes verificados</div>
                <div id="reviews-overlay-title" className="formTitle">
                  Reseñas de usuarios · {summary.totalReviews}
                </div>
                <div className="formHint">
                  Explora todas las experiencias verificadas de este producto.
                </div>
              </div>

              <button
                type="button"
                className="closeBtn"
                onClick={() => setShowAllReviews(false)}
                aria-label="Cerrar reseñas"
              >
                ×
              </button>
            </div>

            <div className="overlayToolbar">
              <div className="filterTabs" role="tablist" aria-label="Filtrar reseñas">
                <button
                  type="button"
                  className={`filterTab ${reviewFilter === "all" ? "active" : ""}`}
                  onClick={() => setReviewFilter("all")}
                >
                  Todas {summary.totalReviews}
                </button>
                <button
                  type="button"
                  className={`filterTab ${reviewFilter === "5" ? "active" : ""}`}
                  onClick={() => setReviewFilter("5")}
                >
                  5 estrellas {fiveStarCount}
                </button>
                <button
                  type="button"
                  className={`filterTab ${reviewFilter === "4" ? "active" : ""}`}
                  onClick={() => setReviewFilter("4")}
                >
                  4 o menos {fourOrLessCount}
                </button>
              </div>

              <div className="overlayHint">Mostrando reseñas reales con compra verificada.</div>
            </div>

            <div className="overlayBody">
              {filteredReviews.length ? (
                <div className="reviewList">
                  {filteredReviews.map((review) => (
                    <article key={review.id} className="reviewItem modal">
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
                  <div className="lockedTitle">No hay reseñas para este filtro</div>
                  <div className="lockedText">
                    Prueba otra vista para revisar el resto de experiencias verificadas.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

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

        .panelEyebrow {
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.42);
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

        .scoreLabel {
          color: rgba(0, 0, 0, 0.62);
          font-size: 13px;
          font-weight: 850;
        }

        .formHint,
        .listHint {
          color: rgba(0, 0, 0, 0.62);
          font-size: 13px;
          line-height: 1.6;
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

        .listActions {
          display: grid;
          justify-items: end;
          gap: 10px;
        }

        .formTitle {
          font-size: 20px;
          line-height: 1.1;
          color: #111;
          font-weight: 950;
          letter-spacing: -0.02em;
        }

        .statusPill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
        }

        .statusPill.loading,
        .statusPill.locked {
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.72);
        }

        .statusPill.ready {
          border: 1px solid rgba(212, 175, 55, 0.28);
          background: rgba(212, 175, 55, 0.12);
          color: rgba(0, 0, 0, 0.82);
        }

        .statusPill.done {
          border: 1px solid rgba(21, 128, 61, 0.2);
          background: rgba(21, 128, 61, 0.08);
          color: rgba(21, 128, 61, 0.94);
        }

        .reviewForm {
          margin-top: 14px;
          display: grid;
          gap: 14px;
        }

        .inlineInfo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid rgba(212, 175, 55, 0.24);
          background: linear-gradient(180deg, rgba(255, 250, 232, 0.96), rgba(255, 255, 255, 0.96));
          color: rgba(0, 0, 0, 0.72);
          font-size: 13px;
          font-weight: 850;
        }

        .miniBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.9);
          color: rgba(255, 255, 255, 0.96);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .miniBadge.login {
          background: rgba(0, 0, 0, 0.08);
          color: rgba(0, 0, 0, 0.74);
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

        .loginLink {
          width: fit-content;
          align-self: start;
        }

        .submitBtn:hover,
        .loginLink:hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 54px rgba(0, 0, 0, 0.2);
        }

        .viewAllBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.92);
          color: rgba(0, 0, 0, 0.86);
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
        }

        .ghostBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.88);
          color: rgba(0, 0, 0, 0.86);
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
        }

        .ghostBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(212, 175, 55, 0.4);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
        }

        .viewAllBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(212, 175, 55, 0.4);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
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

        .lockedBox.successTone {
          border-color: rgba(21, 128, 61, 0.16);
          background: rgba(21, 128, 61, 0.05);
        }

        .lockedBox.compact {
          align-content: start;
          gap: 12px;
          padding: 18px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 245, 245, 0.96));
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

        .helperText {
          color: rgba(0, 0, 0, 0.5);
          font-size: 12px;
          line-height: 1.6;
          font-weight: 850;
        }

        .latestWrap,
        .reviewList {
          margin-top: 14px;
          display: grid;
          gap: 12px;
        }

        .moreRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 244, 235, 0.96));
        }

        .moreTitle {
          color: #111;
          font-size: 15px;
          font-weight: 950;
        }

        .moreHint {
          margin-top: 4px;
          color: rgba(0, 0, 0, 0.58);
          font-size: 13px;
          line-height: 1.6;
          font-weight: 850;
        }

        .reviewItem {
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.9);
          padding: 14px;
          display: grid;
          gap: 10px;
        }

        .reviewItem.feature {
          padding: 18px;
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 245, 236, 0.96));
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.08);
        }

        .reviewItem.modal {
          padding: 18px;
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

        .reviewComment.preview {
          display: -webkit-box;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 5;
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

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: flex;
          justify-content: center;
          align-items: stretch;
          padding: 24px;
          background: rgba(17, 17, 17, 0.32);
          backdrop-filter: blur(12px);
        }

        .overlayPanel {
          width: min(1120px, 100%);
          margin: auto;
          border-radius: 32px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.18);
          padding: 22px;
          display: grid;
          gap: 18px;
        }

        .overlayHead,
        .overlayToolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .overlayHint {
          color: rgba(0, 0, 0, 0.58);
          font-size: 13px;
          line-height: 1.6;
          font-weight: 850;
        }

        .overlayBody {
          max-height: min(68vh, 760px);
          overflow: auto;
          padding-right: 6px;
        }

        .filterTabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filterTab,
        .closeBtn {
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.92);
          color: rgba(0, 0, 0, 0.78);
          font-weight: 950;
        }

        .filterTab {
          min-height: 44px;
          padding: 0 16px;
          font-size: 13px;
          cursor: pointer;
          transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
        }

        .filterTab:hover,
        .closeBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(212, 175, 55, 0.42);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
        }

        .filterTab.active {
          background: rgba(255, 248, 220, 0.96);
          border-color: rgba(212, 175, 55, 0.32);
          color: rgba(0, 0, 0, 0.88);
        }

        .closeBtn {
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 28px;
          line-height: 1;
        }

        @media (max-width: 980px) {
          .reviewsGrid {
            grid-template-columns: 1fr;
          }

          .summaryCard {
            position: relative;
            top: auto;
          }

          .overlay {
            padding: 16px;
          }

          .overlayPanel {
            padding: 18px;
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

          .moreRow,
          .overlayToolbar,
          .listActions {
            align-items: stretch;
          }

          .viewAllBtn,
          .filterTab,
          .ghostBtn {
            width: 100%;
          }

          .overlay {
            padding: 10px;
          }

          .overlayPanel {
            border-radius: 24px;
            padding: 16px;
          }

          .overlayBody {
            max-height: calc(100vh - 220px);
          }
        }
      `}</style>
    </section>
  );
}
