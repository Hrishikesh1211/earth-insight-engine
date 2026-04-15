import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppNavigation } from '../components/AppLayout'
import { LiveDataPulse } from '../components/LiveDataPulse'
import { PageLoadingState, useLoadingTransition, usePageLoading } from '../components/PageLoadingState'
import { useTopLoadingProgress } from '../components/TopLoadingProgress'
import { useData } from '../context/DataContext'
import { getEventCategoryStyle } from '../data/eventCategories'
import type { DisasterEvent } from '../types/event'
import '../App.css'

type EventTrendPoint = {
  count: number
  date: string
  dominantCategory: string | null
  label: string
  rawCount: number
  totalCount: number
}

type ChartTooltipPoint = {
  date: string
  dominantCategory: string | null
  totalCount: number
}

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{
    payload?: ChartTooltipPoint
  }>
}

type CategoryDistribution = {
  color: string
  count: number
  label: string
  percentage: number
}

type RegionCount = {
  count: number
  percentage: number
  region: RegionName
}

type RegionName =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America'

const EVENT_TREND_SMOOTHING_WINDOW = 3
const REGION_LIMIT = 5

export function AnalyticsPage() {
  const {
    error,
    events,
    isLoading,
  } = useData()
  const trendData = useMemo(() => getEventTrendData(events), [events])
  const categoryDistribution = useMemo(() => getCategoryDistribution(events), [events])
  const regionCounts = useMemo(() => getRegionCounts(events), [events])
  const analyticsSummaries = useMemo(() => {
    return getAnalyticsSummaries(events, regionCounts)
  }, [events, regionCounts])
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
          <h1 className="app-header__title">Signal Analysis Center</h1>
        </div>
        <div className="app-header__actions">
          <AppNavigation />
          <LiveDataPulse />
        </div>
      </header>

      {shouldRenderLoading && <PageLoadingState className={loadingClassName} />}

      <main className={`analytics-page ${contentClassName}`} aria-hidden={isPageLoading}>
        <section className="analytics-panel" aria-labelledby="analytics-title">
          <div className="panel-header">
            <h2 id="analytics-title">Signal Analysis Center</h2>
            <p>Monitor category movement, regional concentration, and event signal velocity.</p>
          </div>

          <div className="analytics-sections">
            <section className="analytics-section" aria-labelledby="event-trends-title">
              <div className="analytics-section__header">
                <div>
                  <p className="analytics-section__eyebrow">Signal Analysis</p>
                  <h2 id="event-trends-title">Event Signal Trends</h2>
                </div>
              </div>

              {!error && analyticsSummaries.length > 0 && (
                <ul className="analytics-summary-grid" aria-label="Signal analysis summary">
                  {analyticsSummaries.map((summary) => (
                    <li key={summary}>{summary}</li>
                  ))}
                </ul>
              )}

              <div className="analytics-charts" aria-label="Event signal trend charts">
                    <article className="analytics-chart-card analytics-chart-card--wide">
                      <h3>Global Signal Velocity</h3>
                      {error && <p>{error}</p>}
                      {!error && trendData.length === 0 && (
                        <p>No signal trend data available.</p>
                      )}
                      {!error && trendData.length > 0 && (
                        <div className="analytics-chart analytics-chart--large">
                          <ResponsiveContainer height="100%" width="100%">
                            <LineChart
                              data={trendData}
                              margin={{
                                bottom: 18,
                                left: 4,
                                right: 18,
                                top: 12,
                              }}
                            >
                              <CartesianGrid stroke="rgba(129, 144, 163, 0.18)" vertical={false} />
                              <XAxis
                                dataKey="label"
                                interval="preserveStartEnd"
                                minTickGap={28}
                                stroke="#8190a3"
                                tick={{
                                  fill: '#a9b7c6',
                                  fontSize: 12,
                                }}
                                tickLine={false}
                              />
                              <YAxis
                                allowDecimals={false}
                                stroke="#8190a3"
                                tick={{
                                  fill: '#a9b7c6',
                                  fontSize: 12,
                                }}
                                tickFormatter={(value) => formatCount(Number(value))}
                                tickLine={false}
                              />
                              <Tooltip
                                content={<AnalyticsChartTooltip />}
                                cursor={{
                                  stroke: '#5cc7a7',
                                  strokeOpacity: 0.35,
                                }}
                              />
                              <Line
                                activeDot={{
                                  fill: '#7ddfc1',
                                  r: 5,
                                  stroke: '#0f1724',
                                  strokeWidth: 2,
                                }}
                                dataKey="count"
                                dot={false}
                                name="Signals"
                                stroke="#5cc7a7"
                                strokeLinecap="round"
                                strokeWidth={3.2}
                                type="monotone"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <p className="analytics-chart-description">
                        Smoothed daily event volume across the monitored global dataset.
                      </p>
                    </article>

                    <article className="analytics-chart-card">
                      <h3>Category Signal Mix</h3>
                      {error && <p>{error}</p>}
                      {!error && categoryDistribution.length === 0 && (
                        <p>No category signal data available.</p>
                      )}
                      {!error && categoryDistribution.length > 0 && (
                        <ul className="category-distribution-list">
                          {categoryDistribution.map((category, index) => (
                            <li
                              className={index === 0 ? 'category-distribution-list__item--top' : undefined}
                              key={category.label}
                              style={{
                                '--category-color': category.color,
                              } as CSSProperties}
                            >
                              <div className="category-distribution-list__row">
                                <span>{category.label}</span>
                                <strong>
                                  {formatPercent(category.percentage)} / {formatCount(category.count)}
                                </strong>
                              </div>
                              <div className="category-distribution-list__track">
                                <span style={{ width: `${category.percentage}%` }} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="analytics-chart-description">
                        Event share by category, with the dominant signal highlighted.
                      </p>
                    </article>

                    <article className="analytics-chart-card analytics-chart-card--placeholder">
                      <h3>Regional Signal Hotspots</h3>
                      {error && <p>{error}</p>}
                      {!error && regionCounts.length === 0 && (
                        <p>No regional signal data available.</p>
                      )}
                      {!error && regionCounts.length > 0 && (
                        <ul className="region-summary-list">
                          {regionCounts.map((region, index) => (
                            <li
                              className={index === 0 ? 'region-summary-list__item--top' : undefined}
                              key={region.region}
                            >
                              <div className="region-summary-list__row">
                                <span>{region.region}</span>
                                <strong>{region.count} signals</strong>
                              </div>
                              <div className="region-summary-list__track">
                                <span style={{ width: `${region.percentage}%` }} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="analytics-chart-description">
                        Top regions by event count, with the strongest signal concentration highlighted.
                      </p>
                    </article>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

function AnalyticsChartTooltip({ active, payload }: ChartTooltipProps) {
  const point = payload?.[0]?.payload

  if (!active || !point) {
    return null
  }

  return (
    <div className="analytics-tooltip">
      <strong>{formatFullDate(point.date)}</strong>
      <span>Total signals: {formatCount(point.totalCount)}</span>
      <span>Dominant category: {point.dominantCategory ?? 'Mixed signal activity'}</span>
    </div>
  )
}

function getEventTrendData(events: DisasterEvent[]): EventTrendPoint[] {
  const statsByDate = events.reduce<Record<string, {
    categoryCounts: Record<string, number>
    totalCount: number
  }>>((stats, event) => {
    const dateKey = getDateKey(event.date)

    if (!dateKey) {
      return stats
    }

    const category = getEventCategoryStyle(event.category)
    const dateStats = stats[dateKey] ?? {
      categoryCounts: {},
      totalCount: 0,
    }

    dateStats.totalCount += 1
    dateStats.categoryCounts[category.label] = (dateStats.categoryCounts[category.label] ?? 0) + 1
    stats[dateKey] = dateStats

    return stats
  }, {})

  const dailyCounts = Object.entries(statsByDate)
    .map(([date, stats]) => ({
      count: stats.totalCount,
      date,
      dominantCategory: getDominantCategoryFromCounts(stats.categoryCounts),
      label: formatShortDate(date),
      rawCount: stats.totalCount,
      totalCount: stats.totalCount,
    }))
    .sort((first, second) => {
      return Date.parse(first.date) - Date.parse(second.date)
    })

  return applyMovingAverage(dailyCounts, EVENT_TREND_SMOOTHING_WINDOW)
}

function applyMovingAverage(
  points: EventTrendPoint[],
  windowSize: number,
): EventTrendPoint[] {
  const radius = Math.floor(windowSize / 2)

  return points.map((point, index) => {
    const windowStart = Math.max(0, index - radius)
    const windowEnd = Math.min(points.length, index + radius + 1)
    const windowPoints = points.slice(windowStart, windowEnd)
    const averageCount = windowPoints.reduce((total, windowPoint) => {
      return total + windowPoint.rawCount
    }, 0) / windowPoints.length

    return {
      ...point,
      count: averageCount,
    }
  })
}

function getAnalyticsSummaries(
  events: DisasterEvent[],
  regionCounts: RegionCount[],
) {
  if (events.length === 0) {
    return []
  }

  return [
    getOverallTrendSummary(events),
    getDominantCategorySummary(events),
    getRegionalPatternSummary(regionCounts),
  ].filter((summary): summary is string => summary !== null)
}

function getOverallTrendSummary(events: DisasterEvent[]) {
  const latestTime = getLatestEventTime(events)

  if (latestTime === null) {
    return null
  }

  const recentStart = latestTime - SUMMARY_TREND_WINDOW_MS
  const previousStart = latestTime - SUMMARY_TREND_WINDOW_MS * 2
  let recentCount = 0
  let previousCount = 0

  for (const event of events) {
    const eventTime = Date.parse(event.date)

    if (!Number.isFinite(eventTime) || eventTime <= previousStart || eventTime > latestTime) {
      continue
    }

    if (eventTime > recentStart) {
      recentCount += 1
    } else {
      previousCount += 1
    }
  }

  if (recentCount > previousCount * SUMMARY_INCREASE_RATIO && recentCount - previousCount >= SUMMARY_MIN_CHANGE) {
    return 'Overall signal activity is rising versus the previous period.'
  }

  if (recentCount < previousCount * SUMMARY_DECREASE_RATIO && previousCount - recentCount >= SUMMARY_MIN_CHANGE) {
    return 'Overall signal activity is easing versus the previous period.'
  }

  return 'Overall signal activity is stable across the recent window.'
}

function getDominantCategorySummary(events: DisasterEvent[]) {
  const categoryCounts = events.reduce<Record<string, number>>((counts, event) => {
    const category = getEventCategoryStyle(event.category)

    counts[category.label] = (counts[category.label] ?? 0) + 1
    return counts
  }, {})
  const dominantCategory = Object.entries(categoryCounts).sort((first, second) => {
    return second[1] - first[1] || first[0].localeCompare(second[0])
  })[0]

  if (!dominantCategory) {
    return null
  }

  const [category, count] = dominantCategory
  const percentage = Math.round((count / events.length) * 100)

  return `${category} lead the monitored dataset at ${percentage}% of recorded events.`
}

function getRegionalPatternSummary(regionCounts: RegionCount[]) {
  const topRegion = regionCounts[0]

  if (!topRegion) {
    return null
  }

  return `${topRegion.region} is the primary regional concentration with ${topRegion.count} events.`
}

function getCategoryDistribution(events: DisasterEvent[]): CategoryDistribution[] {
  const categoryCounts = events.reduce<Record<string, number>>((counts, event) => {
    const category = getEventCategoryStyle(event.category)

    counts[category.label] = (counts[category.label] ?? 0) + 1
    return counts
  }, {})
  const totalEvents = events.length

  if (totalEvents === 0) {
    return []
  }

  return Object.entries(categoryCounts)
    .map(([label, count]) => {
      const category = getEventCategoryStyle(label)

      return {
        color: category.color,
        count,
        label: category.label,
        percentage: (count / totalEvents) * 100,
      }
    })
    .sort((first, second) => {
      return second.count - first.count || first.label.localeCompare(second.label)
    })
}

function getDominantCategoryFromCounts(categoryCounts: Record<string, number>) {
  const dominantCategory = Object.entries(categoryCounts).sort((first, second) => {
    return second[1] - first[1] || first[0].localeCompare(second[0])
  })[0]

  return dominantCategory?.[0] ?? null
}

function getRegionCounts(events: DisasterEvent[]): RegionCount[] {
  const regionCounts = events.reduce<Partial<Record<RegionName, number>>>((counts, event) => {
    const region = getEventRegion(event)

    if (region) {
      counts[region] = (counts[region] ?? 0) + 1
    }

    return counts
  }, {})
  const maxCount = Math.max(1, ...Object.values(regionCounts))

  return Object.entries(regionCounts)
    .map(([region, count]) => ({
      count: count ?? 0,
      percentage: ((count ?? 0) / maxCount) * 100,
      region: region as RegionName,
    }))
    .sort((first, second) => {
      return second.count - first.count || first.region.localeCompare(second.region)
    })
    .slice(0, REGION_LIMIT)
}

function getEventRegion(event: DisasterEvent): RegionName | null {
  const { latitude, longitude } = event

  if (isInBounds(latitude, longitude, -56, 13, -82, -34)) {
    return 'South America'
  }

  if (isInBounds(latitude, longitude, 5, 83, -170, -52)) {
    return 'North America'
  }

  if (isInBounds(latitude, longitude, 35, 72, -25, 45)) {
    return 'Europe'
  }

  if (isInBounds(latitude, longitude, -35, 38, -18, 52)) {
    return 'Africa'
  }

  if (isInBounds(latitude, longitude, -50, 0, 110, 180)) {
    return 'Oceania'
  }

  if (isInBounds(latitude, longitude, 0, 78, 45, 180)) {
    return 'Asia'
  }

  return null
}

function isInBounds(
  latitude: number,
  longitude: number,
  minLatitude: number,
  maxLatitude: number,
  minLongitude: number,
  maxLongitude: number,
) {
  return (
    latitude >= minLatitude &&
    latitude <= maxLatitude &&
    longitude >= minLongitude &&
    longitude <= maxLongitude
  )
}

function getDateKey(date: string) {
  const eventDate = new Date(date)

  if (Number.isNaN(eventDate.getTime())) {
    return null
  }

  return eventDate.toISOString().slice(0, 10)
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function getLatestEventTime(events: DisasterEvent[]) {
  const eventTimes = events
    .map((event) => Date.parse(event.date))
    .filter(Number.isFinite)

  if (eventTimes.length === 0) {
    return null
  }

  return Math.max(...eventTimes)
}

const SUMMARY_DECREASE_RATIO = 0.8
const SUMMARY_INCREASE_RATIO = 1.2
const SUMMARY_MIN_CHANGE = 2
const SUMMARY_TREND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
