import type { DisasterEvent } from '../types/event'

type RiskLevel = 'Low' | 'Medium' | 'High'

type CategoryRisk = {
  category: string
  count: number
  level: RiskLevel
  reason: string
}

type CategorySummary = {
  category: string
  count: number
  hasRegionalConcentration: boolean
  percentage: number
  trend: TrendDirection
}

type RegionName =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America'

type TrendDirection = 'falling' | 'rising' | 'stable'

export function assessRisk(events: DisasterEvent[]): {
  overallRisk: RiskLevel
  overallReason: string
  categoryRisk: CategoryRisk[]
} {
  if (events.length === 0) {
    return {
      overallRisk: 'Low',
      overallReason: 'Overall risk is low because no monitored events are available for assessment.',
      categoryRisk: [],
    }
  }

  const categorySummaries = getCategorySummaries(events)
  const categoryRisk = categorySummaries
    .map(getCategoryRisk)
    .sort((first, second) => {
      return (
        getRiskLevelRank(second.level) - getRiskLevelRank(first.level) ||
        second.count - first.count ||
        first.category.localeCompare(second.category)
      )
    })
  const overallRisk = getOverallRisk(categoryRisk)

  return {
    overallRisk,
    overallReason: getOverallRiskReason(events, categorySummaries[0], overallRisk),
    categoryRisk,
  }
}

function getCategorySummaries(events: DisasterEvent[]): CategorySummary[] {
  const totalEvents = events.length
  const categoryCounts = countEventsByCategory(events)

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      hasRegionalConcentration: hasRegionalConcentration(
        events.filter((event) => event.category === category),
      ),
      percentage: (count / totalEvents) * 100,
      trend: getCategoryTrend(events, category),
    }))
    .sort((first, second) => {
      return second.count - first.count || first.category.localeCompare(second.category)
    })
}

function getCategoryRisk(summary: CategorySummary): CategoryRisk {
  const riskScore = getRiskScore(summary)
  const level = getRiskLevel(riskScore)

  return {
    category: summary.category,
    count: summary.count,
    level,
    reason: getRiskReason(summary, level),
  }
}

function getRiskScore(summary: CategorySummary) {
  let score = 0

  if (summary.count >= 50) {
    score += 2
  } else if (summary.count >= 10) {
    score += 1
  }

  if (summary.percentage >= 50) {
    score += 2
  } else if (summary.percentage >= 20) {
    score += 1
  }

  if (summary.trend === 'rising') {
    score += 1
  }

  if (summary.hasRegionalConcentration) {
    score += 1
  }

  return score
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 4) {
    return 'High'
  }

  if (score >= 2) {
    return 'Medium'
  }

  return 'Low'
}

function getRiskLevelRank(level: RiskLevel) {
  if (level === 'High') {
    return 3
  }

  if (level === 'Medium') {
    return 2
  }

  return 1
}

function getRiskReason(summary: CategorySummary, level: RiskLevel) {
  const volumeSignal = getVolumeSignal(summary)
  const shareSignal = getShareSignal(summary)
  const trendSignal = getTrendSignal(summary)
  const geographySignal = getGeographySignal(summary)

  if (level === 'High') {
    if (shareSignal && trendSignal && geographySignal) {
      return `${summary.category} are high risk because ${shareSignal}, ${trendSignal}, and ${geographySignal}.`
    }

    if (shareSignal && geographySignal) {
      return `${summary.category} are high risk because ${shareSignal} and ${geographySignal}.`
    }

    if (volumeSignal && trendSignal) {
      return `${summary.category} are high risk with ${volumeSignal} and ${trendSignal}.`
    }

    return `${summary.category} are high risk because activity is broad and frequent.`
  }

  if (level === 'Medium') {
    if (trendSignal && geographySignal) {
      return `${summary.category} indicate moderate risk because ${trendSignal} and ${geographySignal}.`
    }

    if (trendSignal) {
      return `${summary.category} indicate moderate risk as ${trendSignal}.`
    }

    if (geographySignal) {
      return `${summary.category} indicate moderate risk because signals cluster geographically despite limited volume.`
    }

    return `${summary.category} indicate moderate risk but remain below the leading categories.`
  }

  if (summary.trend === 'falling') {
    return `${summary.category} indicate low risk with limited activity and a softer recent trend.`
  }

  if (summary.count === 1) {
    return `${summary.category} appear once in the current signal view.`
  }

  return `${summary.category} indicate low risk with sparse signal activity.`
}

function getVolumeSignal(summary: CategorySummary) {
  if (summary.count >= 50) {
    return 'sustained signal volume'
  }

  if (summary.count >= 10) {
    return 'steady signal volume'
  }

  return null
}

function getShareSignal(summary: CategorySummary) {
  if (summary.percentage >= 50) {
    return 'they make up a large share of monitored events'
  }

  if (summary.percentage >= 20) {
    return 'they represent a meaningful share of signal activity'
  }

  return null
}

function getTrendSignal(summary: CategorySummary) {
  if (summary.trend === 'rising') {
    return 'recent activity is rising'
  }

  if (summary.trend === 'falling') {
    return 'recent activity is easing'
  }

  return null
}

function getGeographySignal(summary: CategorySummary) {
  return summary.hasRegionalConcentration ? 'signals are geographically concentrated' : null
}

function getOverallRisk(categoryRisk: CategoryRisk[]): RiskLevel {
  if (categoryRisk.some((risk) => risk.level === 'High')) {
    return 'High'
  }

  if (categoryRisk.some((risk) => risk.level === 'Medium')) {
    return 'Medium'
  }

  return 'Low'
}

function getOverallRiskReason(
  events: DisasterEvent[],
  dominantCategory: CategorySummary | undefined,
  overallRisk: RiskLevel,
) {
  if (!dominantCategory) {
    return 'Overall risk is low because monitored activity is limited.'
  }

  const volumePhrase = getOverallVolumePhrase(events.length)
  const categoryPhrase = `${dominantCategory.category} make up ${Math.round(dominantCategory.percentage)}% of monitored events`

  if (overallRisk === 'High') {
    if (dominantCategory.hasRegionalConcentration) {
      return `Overall risk is high because ${volumePhrase}, ${categoryPhrase}, and activity is geographically concentrated.`
    }

    return `Overall risk is high because ${volumePhrase} and ${categoryPhrase}.`
  }

  if (overallRisk === 'Medium') {
    if (dominantCategory.hasRegionalConcentration) {
      return `Overall risk is moderate because ${categoryPhrase} with some geographic concentration.`
    }

    return `Overall risk is moderate because ${volumePhrase}, with no extreme single signal.`
  }

  return `Overall risk is low because ${volumePhrase} and category activity remains limited.`
}

function getOverallVolumePhrase(totalEvents: number) {
  if (totalEvents >= 100) {
    return 'monitored signal volume is elevated'
  }

  if (totalEvents >= 25) {
    return 'monitored signal volume is steady'
  }

  return 'monitored signal volume is limited'
}

function getCategoryTrend(events: DisasterEvent[], category: string): TrendDirection {
  const anchorTime = getLatestEventTime(events)

  if (anchorTime === null) {
    return 'stable'
  }

  const recentStart = anchorTime - TREND_PERIOD_MS
  const previousStart = anchorTime - TREND_PERIOD_MS * 2
  let recentCount = 0
  let previousCount = 0

  for (const event of events) {
    if (event.category !== category) {
      continue
    }

    const eventTime = Date.parse(event.date)

    if (!Number.isFinite(eventTime) || eventTime <= previousStart || eventTime > anchorTime) {
      continue
    }

    if (eventTime > recentStart) {
      recentCount += 1
    } else {
      previousCount += 1
    }
  }

  if (recentCount > previousCount * INCREASING_TREND_RATIO && recentCount - previousCount >= MINIMUM_TREND_CHANGE) {
    return 'rising'
  }

  if (recentCount < previousCount * DECREASING_TREND_RATIO && previousCount - recentCount >= MINIMUM_TREND_CHANGE) {
    return 'falling'
  }

  return 'stable'
}

function hasRegionalConcentration(events: DisasterEvent[]) {
  if (events.length < MINIMUM_CONCENTRATION_EVENTS) {
    return false
  }

  const regionCounts = events.reduce<Partial<Record<RegionName, number>>>((counts, event) => {
    const region = getEventRegion(event)

    if (region) {
      counts[region] = (counts[region] ?? 0) + 1
    }

    return counts
  }, {})
  const largestRegionCount = Math.max(0, ...Object.values(regionCounts))

  return largestRegionCount / events.length >= REGIONAL_CONCENTRATION_RATIO
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

function countEventsByCategory(events: DisasterEvent[]) {
  return events.reduce<Record<string, number>>((counts, event) => {
    counts[event.category] = (counts[event.category] ?? 0) + 1
    return counts
  }, {})
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

const TREND_PERIOD_MS = 7 * 24 * 60 * 60 * 1000
const INCREASING_TREND_RATIO = 1.2
const DECREASING_TREND_RATIO = 0.8
const MINIMUM_TREND_CHANGE = 2
const MINIMUM_CONCENTRATION_EVENTS = 5
const REGIONAL_CONCENTRATION_RATIO = 0.5
