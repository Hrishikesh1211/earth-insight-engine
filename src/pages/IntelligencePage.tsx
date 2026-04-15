import { useMemo } from 'react'
import { AppNavigation } from '../components/AppLayout'
import { LiveDataPulse } from '../components/LiveDataPulse'
import { PageLoadingState, useLoadingTransition, usePageLoading } from '../components/PageLoadingState'
import { useTopLoadingProgress } from '../components/TopLoadingProgress'
import { useData } from '../context/DataContext'
import { detectAnomalies } from '../services/anomalyService'
import { detectHotspots } from '../services/hotspotService'
import type { Hotspot } from '../services/hotspotService'
import { generateInsights } from '../services/insightService'
import { assessRisk } from '../services/riskService'
import type { DisasterEvent } from '../types/event'
import '../App.css'

export function IntelligencePage() {
  const {
    error,
    events,
    isLoading,
    lastUpdatedAt,
  } = useData()
  const anomalies = useMemo(() => detectAnomalies(events), [events])
  const hotspots = useMemo(() => detectHotspots(events), [events])
  const insights = useMemo(() => generateInsights(events), [events])
  const predictionInsights = useMemo(() => {
    return insights.filter((insight) => {
      return insight.startsWith('Trend projection:')
    })
  }, [insights])
  const riskAssessment = useMemo(() => assessRisk(events), [events])
  const topCategoryShare = useMemo(() => getTopCategoryShare(events), [events])
  const isPageLoading = usePageLoading(isLoading)
  useTopLoadingProgress(isPageLoading)
  const {
    contentClassName,
    loadingClassName,
    shouldRenderLoading,
  } = useLoadingTransition(isPageLoading)

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">Earth Insight Engine</p>
          <h1 className="app-header__title">Intelligence Operations Layer</h1>
        </div>
        <div className="app-header__actions">
          <AppNavigation />
          <LiveDataPulse />
        </div>
      </header>

      {shouldRenderLoading && <PageLoadingState className={loadingClassName} />}

      <main className={`analytics-page ${contentClassName}`} aria-hidden={isPageLoading}>
        <section className="analytics-panel" aria-labelledby="intelligence-title">
          <div className="panel-header">
            <div className="intelligence-panel-header">
              <div>
                <h2 id="intelligence-title">Intelligence Operations Layer</h2>
                <p>Monitor anomalies, projected signals, and risk posture.</p>
              </div>
              {lastUpdatedAt && (
                <p className="last-updated">
                  <span>Last Updated</span>
                  <time dateTime={lastUpdatedAt.toISOString()}>
                    {formatFreshnessTime(lastUpdatedAt)}
                  </time>
                </p>
              )}
            </div>
          </div>

          <div className="intelligence-sections">
            {error && <p className="sidebar-message">{error}</p>}

            {!error && (
              <>
                <section className="intelligence-section" aria-labelledby="anomaly-title">
                  <div className="analytics-section__header">
                    <div>
                      <p className="analytics-section__eyebrow">Detection</p>
                      <h2 id="anomaly-title">Anomaly Watch</h2>
                    </div>
                  </div>
                  <IntelligenceCardList
                    variant="signal"
                    emptyMessage="No anomalous signal detected against the current baseline."
                    items={anomalies}
                  />
                </section>

                <section className="intelligence-section" aria-labelledby="prediction-title">
                  <div className="analytics-section__header">
                    <div>
                      <p className="analytics-section__eyebrow">Forecast</p>
                      <h2 id="prediction-title">Signal Projections</h2>
                    </div>
                  </div>
                  <IntelligenceCardList
                    variant="prediction"
                    emptyMessage="No projection signal available."
                    items={predictionInsights}
                  />
                </section>

                <section className="intelligence-section" aria-labelledby="hotspot-title">
                  <div className="analytics-section__header">
                    <div>
                      <p className="analytics-section__eyebrow">Geospatial</p>
                      <h2 id="hotspot-title">Hotspot Detection</h2>
                    </div>
                  </div>
                  <HotspotCardList hotspots={hotspots} />
                </section>

                <section className="intelligence-section" aria-labelledby="global-risk-title">
                  <div className="analytics-section__header">
                    <div>
                      <p className="analytics-section__eyebrow">Risk</p>
                      <h2 id="global-risk-title">Global Risk Posture</h2>
                    </div>
                    <span
                      className="risk-level"
                      data-level={riskAssessment.overallRisk.toLowerCase()}
                    >
                      {riskAssessment.overallRisk}
                    </span>
                  </div>

                  <div className="intelligence-risk-card">
                    <div className="intelligence-risk-meter">
                      <div className="intelligence-risk-meter__header">
                        <span>Overall risk posture</span>
                        <strong>{getRiskScoreLabel(riskAssessment.overallRisk)}%</strong>
                      </div>
                      <div
                        className="intelligence-risk-meter__track"
                        data-level={riskAssessment.overallRisk.toLowerCase()}
                      >
                        <span
                          style={{
                            width: `${getRiskScoreLabel(riskAssessment.overallRisk)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {topCategoryShare && (
                      <p className="intelligence-risk-card__dominance">
                        {topCategoryShare.category} account for {topCategoryShare.percentage}% of monitored events.
                      </p>
                    )}

                    <p>{riskAssessment.overallReason}</p>
                    <ul className="intelligence-risk-list">
                      {riskAssessment.categoryRisk.slice(0, 6).map((risk) => (
                        <li data-level={risk.level.toLowerCase()} key={risk.category}>
                          <div className="risk-overview__row">
                            <strong>{risk.category}</strong>
                            <span
                              className="risk-level"
                              data-level={risk.level.toLowerCase()}
                            >
                              {risk.level}
                            </span>
                          </div>
                          <p>{risk.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function IntelligenceCardList({
  emptyMessage,
  items,
  variant = 'default',
}: {
  emptyMessage: string
  items: string[]
  variant?: 'default' | 'prediction' | 'signal'
}) {
  if (items.length === 0) {
    return <p className="intelligence-empty">{emptyMessage}</p>
  }

  return (
    <ul className="intelligence-card-list">
      {items.slice(0, 3).map((item) => (
        <li data-variant={variant} key={item}>
          {variant !== 'default' && (
            <span className="intelligence-card-list__icon" aria-hidden="true" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function HotspotCardList({ hotspots }: { hotspots: Hotspot[] }) {
  if (hotspots.length === 0) {
    return <p className="intelligence-empty">No unusually dense clusters detected.</p>
  }

  return (
    <ul className="intelligence-card-list">
      {hotspots.slice(0, 4).map((hotspot) => (
        <li data-variant="signal" key={hotspot.id}>
          <span className="intelligence-card-list__icon" aria-hidden="true" />
          <span>
            {hotspot.label}: {hotspot.count} clustered signals, led by {hotspot.dominantCategory}.
          </span>
        </li>
      ))}
    </ul>
  )
}

function getTopCategoryShare(events: DisasterEvent[]) {
  if (events.length === 0) {
    return null
  }

  const categoryCounts = events.reduce<Record<string, number>>((counts, event) => {
    counts[event.category] = (counts[event.category] ?? 0) + 1
    return counts
  }, {})
  const topCategory = Object.entries(categoryCounts).sort((first, second) => {
    return second[1] - first[1] || first[0].localeCompare(second[0])
  })[0]

  if (!topCategory) {
    return null
  }

  return {
    category: topCategory[0],
    percentage: Math.round((topCategory[1] / events.length) * 100),
  }
}

function getRiskScoreLabel(risk: ReturnType<typeof assessRisk>['overallRisk']) {
  if (risk === 'High') {
    return 90
  }

  if (risk === 'Medium') {
    return 58
  }

  return 28
}

function formatFreshnessTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
