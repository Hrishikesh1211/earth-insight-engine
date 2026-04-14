import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppNavigation } from '../components/AppLayout'
import { getEventCategoryStyle } from '../data/eventCategories'
import { getRecentEvents } from '../services/eonetService'
import type { DisasterEvent } from '../types/event'
import '../App.css'

type EventTrendPoint = {
  count: number
  date: string
  label: string
}

type CategoryTrendPoint = {
  date: string
  label: string
} & Record<string, number | string>

type CategoryTrend = {
  color: string
  key: string
  label: string
}

export function AnalyticsPage() {
  const [events, setEvents] = useState<DisasterEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const trendData = useMemo(() => getEventTrendData(events), [events])
  const categoryTrends = useMemo(() => getCategoryTrends(events), [events])
  const categoryTrendData = useMemo(() => {
    return getCategoryTrendData(events, categoryTrends)
  }, [categoryTrends, events])

  useEffect(() => {
    const controller = new AbortController()

    async function loadAnalyticsEvents() {
      try {
        setIsLoading(true)
        setError(null)

        const recentEvents = await getRecentEvents({
          days: 365,
          status: 'all',
          signal: controller.signal,
        })

        setEvents(recentEvents)
      } catch (loadError) {
        if (isAbortError(loadError)) {
          return
        }

        setError('Analytics data could not be loaded.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadAnalyticsEvents()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">Earth Insight Engine</p>
          <h1 className="app-header__title">Event Trends & Analytics</h1>
        </div>
        <div className="app-header__actions">
          <AppNavigation />
          <p className="app-header__status">Ready for live NASA EONET data</p>
        </div>
      </header>

      <main className="analytics-page">
        <section className="analytics-panel" aria-labelledby="analytics-title">
          <div className="panel-header">
            <h2 id="analytics-title">Event Trends & Analytics</h2>
            <p>Track patterns, compare categories, and review event activity over time.</p>
          </div>

          <div className="analytics-sections">
            <section className="analytics-section" aria-labelledby="event-trends-title">
              <div className="analytics-section__header">
                <div>
                  <p className="analytics-section__eyebrow">Analytics</p>
                  <h2 id="event-trends-title">Event Trends</h2>
                </div>
              </div>

              <div className="analytics-charts" aria-label="Event trend charts">
                <article className="analytics-chart-card analytics-chart-card--wide">
                  <h3>Activity Over Time</h3>
                  {isLoading && <p>Loading chart data...</p>}
                  {error && <p>{error}</p>}
                  {!isLoading && !error && trendData.length === 0 && (
                    <p>No event trends available yet.</p>
                  )}
                  {!isLoading && !error && trendData.length > 0 && (
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
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#111a28',
                              border: '1px solid #263246',
                              borderRadius: 8,
                              color: '#edf4f8',
                            }}
                            cursor={{
                              stroke: '#5cc7a7',
                              strokeOpacity: 0.35,
                            }}
                            labelFormatter={(_, payload) => {
                              const point = payload?.[0]?.payload as EventTrendPoint | undefined

                              return point ? formatFullDate(point.date) : ''
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
                            name="Events"
                            stroke="#5cc7a7"
                            strokeLinecap="round"
                            strokeWidth={3.2}
                            type="monotone"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </article>

                <article className="analytics-chart-card">
                  <h3>Category Comparison</h3>
                  {isLoading && <p>Loading chart data...</p>}
                  {error && <p>{error}</p>}
                  {!isLoading && !error && categoryTrendData.length === 0 && (
                    <p>No category trends available yet.</p>
                  )}
                  {!isLoading && !error && categoryTrendData.length > 0 && (
                    <div className="analytics-chart">
                      <ResponsiveContainer height="100%" width="100%">
                        <LineChart
                          data={categoryTrendData}
                          margin={{
                            bottom: 24,
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
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#111a28',
                              border: '1px solid #263246',
                              borderRadius: 8,
                              color: '#edf4f8',
                            }}
                            cursor={{
                              stroke: '#5cc7a7',
                              strokeOpacity: 0.35,
                            }}
                            labelFormatter={(_, payload) => {
                              const point = payload?.[0]?.payload as CategoryTrendPoint | undefined

                              return point ? formatFullDate(point.date) : ''
                            }}
                          />
                          <Legend
                            iconType="circle"
                            wrapperStyle={{
                              color: '#a9b7c6',
                              fontSize: 12,
                              paddingTop: 12,
                            }}
                          />
                          {categoryTrends.map((category) => (
                            <Line
                              activeDot={{
                                fill: category.color,
                                r: 4,
                                stroke: '#0f1724',
                                strokeWidth: 2,
                              }}
                              dataKey={category.key}
                              dot={false}
                              key={category.key}
                              name={category.label}
                              stroke={category.color}
                              strokeLinecap="round"
                              strokeWidth={2.4}
                              type="monotone"
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </article>

                <article className="analytics-chart-card analytics-chart-card--placeholder">
                  <h3>Regional Comparison</h3>
                  <p>Regional activity chart area</p>
                </article>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

function getEventTrendData(events: DisasterEvent[]): EventTrendPoint[] {
  const countsByDate = events.reduce<Record<string, number>>((counts, event) => {
    const dateKey = getDateKey(event.date)

    if (!dateKey) {
      return counts
    }

    counts[dateKey] = (counts[dateKey] ?? 0) + 1
    return counts
  }, {})

  return Object.entries(countsByDate)
    .map(([date, count]) => ({
      count,
      date,
      label: formatShortDate(date),
    }))
    .sort((first, second) => {
      return Date.parse(first.date) - Date.parse(second.date)
    })
}

function getCategoryTrends(events: DisasterEvent[]): CategoryTrend[] {
  const categoryCounts = events.reduce<Record<string, number>>((counts, event) => {
    const category = getEventCategoryStyle(event.category)

    counts[category.label] = (counts[category.label] ?? 0) + 1
    return counts
  }, {})

  return Object.entries(categoryCounts)
    .map(([label, count]) => {
      const category = getEventCategoryStyle(label)

      return {
        color: category.color,
        key: getCategoryTrendKey(category.label),
        label: category.label,
        count,
      }
    })
    .sort((first, second) => {
      return second.count - first.count || first.label.localeCompare(second.label)
    })
    .map(({ color, key, label }) => ({
      color,
      key,
      label,
    }))
}

function getCategoryTrendData(
  events: DisasterEvent[],
  categories: CategoryTrend[],
): CategoryTrendPoint[] {
  const countsByDate = new Map<string, Record<string, number>>()

  for (const event of events) {
    const dateKey = getDateKey(event.date)

    if (!dateKey) {
      continue
    }

    const category = getEventCategoryStyle(event.category)
    const categoryKey = getCategoryTrendKey(category.label)
    const dateCounts = countsByDate.get(dateKey) ?? {}

    dateCounts[categoryKey] = (dateCounts[categoryKey] ?? 0) + 1
    countsByDate.set(dateKey, dateCounts)
  }

  return [...countsByDate.entries()]
    .map(([date, counts]) => {
      const point: CategoryTrendPoint = {
        date,
        label: formatShortDate(date),
      }

      for (const category of categories) {
        point[category.key] = counts[category.key] ?? 0
      }

      return point
    })
    .sort((first, second) => {
      return Date.parse(first.date) - Date.parse(second.date)
    })
}

function getCategoryTrendKey(category: string) {
  return `category-${category.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
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

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'
}
