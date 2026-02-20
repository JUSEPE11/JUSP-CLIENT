export default function SkeletonCard() {
  return (
    <div className="jusp-card" style={{ overflow: "hidden" }}>
      <div className="jusp-skeleton-img jusp-shimmer" />
      <div className="jusp-card-pad" style={{ display: "grid", gap: 10 }}>
        <div className="jusp-skeleton-line jusp-shimmer" style={{ width: "78%" }} />
        <div className="jusp-skeleton-line jusp-shimmer" style={{ width: "45%" }} />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <div className="jusp-skeleton-btn jusp-shimmer" />
          <div className="jusp-skeleton-btn jusp-shimmer" style={{ width: 90 }} />
        </div>
      </div>
    </div>
  );
}