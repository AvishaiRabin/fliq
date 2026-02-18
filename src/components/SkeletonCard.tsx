export default function SkeletonCard() {
  return (
    <div className="movie-card skeleton-card">
      <div className="skeleton skeleton-backdrop" />
      <div className="movie-card-content">
        <div className="movie-card-top">
          <div className="skeleton skeleton-poster" />
          <div className="movie-info" style={{ paddingTop: '8px' }}>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-meta" />
            <div className="skeleton-ratings">
              <div className="skeleton skeleton-rating" />
              <div className="skeleton skeleton-rating" />
              <div className="skeleton skeleton-rating" />
            </div>
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton skeleton-line" style={{ width: '60%' }} />
          </div>
        </div>
        <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '2px solid #2a2840' }}>
          <div className="skeleton skeleton-section-label" />
          <div className="skeleton-chips">
            <div className="skeleton skeleton-chip" />
            <div className="skeleton skeleton-chip" />
            <div className="skeleton skeleton-chip" />
          </div>
        </div>
      </div>
    </div>
  )
}
