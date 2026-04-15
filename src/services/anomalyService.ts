import type { DisasterEvent } from '../types/event'

type DailyCount = {
  count: number
  date: string
}

type AnomalyDirection = 'drop' | 'spike'

type AnomalyCandidate = {
  direction: AnomalyDirection
  message: string
  severity: number
}

export function detectAnomalies(events: DisasterEvent[]): string[] {
  if (events.length < MINIMUM_EVENTS_FOR_ANOMALIES) {
    return []
  }

  const dailyCounts = getDailyCounts(events)

  if (dailyCounts.length < MINIMUM_DAYS_FOR_ANOMALIES) {
    return []
  }

  const anomalyCandidates = [
    getOverallAnomaly(dailyCounts),
    ...getCategoryAnomalies(events),
  ].filter((candidate): candidate is AnomalyCandidate => candidate !== null)

  return anomalyCandidates
    .sort((first, second) => second.severity - first.severity)
    .map((candidate) => candidate.message)
    .filter((message, index, messages) => messages.indexOf(message) === index)
    .slice(0, MAX_ANOMALIES)
}

function getOverallAnomaly(dailyCounts: DailyCount[]): AnomalyCandidate | null {
  const anomaly = getDailyCountAnomaly(dailyCounts)

  if (!anomaly) {
    return null
  }

  return {
    direction: anomaly.direction,
    message: anomaly.direction === 'spike'
      ? 'Anomalous spike detected in recent overall signal activity.'
      : 'Recent signal activity is below baseline.',
    severity: anomaly.severity + OVERALL_ANOMALY_PRIORITY,
  }
}

function getCategoryAnomalies(events: DisasterEvent[]): AnomalyCandidate[] {
  const categoryGroups = groupEventsByCategory(events)

  return Object.entries(categoryGroups).flatMap(([category, categoryEvents]) => {
    if (categoryEvents.length < MINIMUM_CATEGORY_EVENTS_FOR_ANOMALIES) {
      return []
    }

    const anomaly = getDailyCountAnomaly(getDailyCounts(categoryEvents))

    if (!anomaly) {
      return []
    }

    return [
      {
        direction: anomaly.direction,
        message: anomaly.direction === 'spike'
          ? `${category} signal activity is elevated above baseline.`
          : `${category} signal activity is below baseline.`,
        severity: anomaly.severity,
      },
    ]
  })
}

function getDailyCountAnomaly(dailyCounts: DailyCount[]) {
  const sortedCounts = [...dailyCounts].sort((first, second) => {
    return Date.parse(first.date) - Date.parse(second.date)
  })
  const recentCounts = sortedCounts.slice(-RECENT_WINDOW_DAYS)
  const baselineCounts = sortedCounts.slice(0, -RECENT_WINDOW_DAYS)

  if (recentCounts.length === 0 || baselineCounts.length < MINIMUM_BASELINE_DAYS) {
    return null
  }

  const baselineValues = baselineCounts.map((day) => day.count)
  const baselineAverage = getAverage(baselineValues)
  const baselineDeviation = getStandardDeviation(baselineValues, baselineAverage)
  const recentAverage = getAverage(recentCounts.map((day) => day.count))
  const threshold = Math.max(MINIMUM_ABSOLUTE_CHANGE, baselineDeviation * STANDARD_DEVIATION_MULTIPLIER)
  const difference = recentAverage - baselineAverage

  if (difference > threshold) {
    return {
      direction: 'spike' as const,
      severity: difference / threshold,
    }
  }

  if (difference < -threshold) {
    return {
      direction: 'drop' as const,
      severity: Math.abs(difference) / threshold,
    }
  }

  return null
}

function getDailyCounts(events: DisasterEvent[]): DailyCount[] {
  const countsByDate = events.reduce<Record<string, number>>((counts, event) => {
    const dateKey = getDateKey(event.date)

    if (!dateKey) {
      return counts
    }

    counts[dateKey] = (counts[dateKey] ?? 0) + 1
    return counts
  }, {})

  return Object.entries(countsByDate).map(([date, count]) => ({
    count,
    date,
  }))
}

function groupEventsByCategory(events: DisasterEvent[]) {
  return events.reduce<Record<string, DisasterEvent[]>>((groups, event) => {
    const categoryEvents = groups[event.category] ?? []

    categoryEvents.push(event)
    groups[event.category] = categoryEvents

    return groups
  }, {})
}

function getDateKey(date: string) {
  const eventDate = new Date(date)

  if (Number.isNaN(eventDate.getTime())) {
    return null
  }

  return eventDate.toISOString().slice(0, 10)
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function getStandardDeviation(values: number[], average: number) {
  if (values.length === 0) {
    return 0
  }

  const variance = getAverage(values.map((value) => (value - average) ** 2))

  return Math.sqrt(variance)
}

const MAX_ANOMALIES = 3
const MINIMUM_ABSOLUTE_CHANGE = 1
const MINIMUM_BASELINE_DAYS = 5
const MINIMUM_CATEGORY_EVENTS_FOR_ANOMALIES = 5
const MINIMUM_DAYS_FOR_ANOMALIES = 8
const MINIMUM_EVENTS_FOR_ANOMALIES = 8
const OVERALL_ANOMALY_PRIORITY = 1
const RECENT_WINDOW_DAYS = 5
const STANDARD_DEVIATION_MULTIPLIER = 1.5
