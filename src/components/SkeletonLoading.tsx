type SkeletonBlockProps = {
  className?: string
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return <span className={`skeleton-block animate-pulse ${className}`} aria-hidden="true" />
}

export function ChartSkeleton({ isLarge = false }: { isLarge?: boolean }) {
  return (
    <div
      className={`skeleton-chart animate-pulse ${isLarge ? 'skeleton-chart--large' : ''}`}
      aria-hidden="true"
    >
      <SkeletonBlock className="skeleton-chart__line skeleton-chart__line--short" />
      <SkeletonBlock className="skeleton-chart__body" />
      <div className="skeleton-chart__axis">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="skeleton-card animate-pulse" aria-hidden="true">
      <SkeletonBlock className="skeleton-card__title" />
      <SkeletonBlock />
      <SkeletonBlock className="skeleton-card__line" />
    </div>
  )
}

export function AnalyticsSkeleton() {
  return (
    <>
      <ul className="analytics-summary-grid skeleton-summary-grid" aria-hidden="true">
        <li><CardSkeleton /></li>
        <li><CardSkeleton /></li>
        <li><CardSkeleton /></li>
      </ul>

      <div className="analytics-charts" aria-hidden="true">
        <article className="analytics-chart-card analytics-chart-card--wide">
          <SkeletonBlock className="skeleton-heading" />
          <ChartSkeleton isLarge />
          <SkeletonBlock className="skeleton-description" />
        </article>

        <article className="analytics-chart-card">
          <SkeletonBlock className="skeleton-heading" />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <SkeletonBlock className="skeleton-description" />
        </article>

        <article className="analytics-chart-card analytics-chart-card--placeholder">
          <SkeletonBlock className="skeleton-heading" />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <SkeletonBlock className="skeleton-description" />
        </article>
      </div>
    </>
  )
}

export function IntelligenceSkeleton() {
  return (
    <div className="intelligence-skeleton" aria-hidden="true">
      <section className="intelligence-section">
        <SkeletonSectionHeader />
        <div className="intelligence-card-list">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>

      <section className="intelligence-section">
        <SkeletonSectionHeader />
        <div className="intelligence-card-list">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>

      <section className="intelligence-section">
        <SkeletonSectionHeader />
        <div className="intelligence-risk-card">
          <ChartSkeleton />
          <CardSkeleton />
          <div className="intelligence-risk-list">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </section>
    </div>
  )
}

function SkeletonSectionHeader() {
  return (
    <div className="analytics-section__header">
      <div>
        <SkeletonBlock className="skeleton-eyebrow" />
        <SkeletonBlock className="skeleton-heading" />
      </div>
    </div>
  )
}
