import type { DisasterEvent } from '../types/event'

type CategoryCount = {
  category: string
  count: number
  percentage: number
}

type CategoryTrend = {
  category: string
  change: number
  previousCount: number
  recentCount: number
  trend: 'decreasing' | 'increasing' | 'stable'
}

type RegionCount = {
  count: number
  region: RegionName
}

type RegionName =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America'

export function generateInsights(events: DisasterEvent[]): string[] {
  const totalEvents = events.length

  if (totalEvents === 0) {
    return []
  }

  const rankedCategories = getRankedCategories(events)
  const rankedRegions = getRankedRegions(events)
  const dominantCategory = rankedCategories[0]

  const insightsByImportance = [
    [`Monitoring ${totalEvents} active global ${pluralize('signal', totalEvents)}.`],
    getDominanceInsights(rankedCategories),
    getGeographicInsights(events, rankedRegions, dominantCategory),
    getTrendInsights(events).slice(0, 1),
    getSecondaryCategoryInsights(rankedCategories),
  ]

  return Array.from(new Set(insightsByImportance.flat())).slice(0, MAX_INSIGHTS)
}

function getRankedCategories(events: DisasterEvent[]): CategoryCount[] {
  const totalEvents = events.length
  const categoryCounts = countEventsByCategory(events)

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: (count / totalEvents) * 100,
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
}

function getDominanceInsights(rankedCategories: CategoryCount[]) {
  const dominantCategory = rankedCategories[0]

  if (!dominantCategory) {
    return []
  }

  if (dominantCategory.percentage > 70) {
    return [
      `${dominantCategory.category} ${getCategoryVerb(dominantCategory.category)} the dominant signal, accounting for over 70% of monitored events.`,
    ]
  }

  if (dominantCategory.percentage >= 40) {
    return [
      `${dominantCategory.category} ${getCategoryVerb(dominantCategory.category)} the leading category in the current signal view.`,
    ]
  }

  return ['Signal distribution is balanced across monitored categories.']
}

function getSecondaryCategoryInsights(rankedCategories: CategoryCount[]) {
  const dominantCategory = rankedCategories[0]
  const secondaryCategory = rankedCategories[1]

  if (!dominantCategory || !secondaryCategory) {
    return []
  }

  const comparison = secondaryCategory.count < dominantCategory.count / 2 ? 'significantly lower than' : 'close behind'

  return [
    `${secondaryCategory.category} ${getCategoryVerb(secondaryCategory.category)} the secondary signal type, ${comparison} ${dominantCategory.category}.`,
  ]
}

function getTrendInsights(events: DisasterEvent[]) {
  const trends = getCategoryTrends(events)

  if (trends.length === 0) {
    return []
  }

  return trends
    .sort((first, second) => {
      return getTrendPriority(second) - getTrendPriority(first) || first.category.localeCompare(second.category)
    })
    .map(getTrendInsight)
}

function getCategoryTrends(events: DisasterEvent[]): CategoryTrend[] {
  const anchorTime = getLatestEventTime(events)

  if (anchorTime === null) {
    return []
  }

  const recentStart = anchorTime - TREND_PERIOD_MS
  const previousStart = anchorTime - TREND_PERIOD_MS * 2
  const categoryCounts = new Map<string, { previousCount: number; recentCount: number }>()

  for (const event of events) {
    const eventTime = Date.parse(event.date)

    if (!Number.isFinite(eventTime) || eventTime <= previousStart || eventTime > anchorTime) {
      continue
    }

    const counts = categoryCounts.get(event.category) ?? {
      previousCount: 0,
      recentCount: 0,
    }

    if (eventTime > recentStart) {
      counts.recentCount += 1
    } else {
      counts.previousCount += 1
    }

    categoryCounts.set(event.category, counts)
  }

  return [...categoryCounts.entries()]
    .map(([category, counts]) => {
      const change = counts.recentCount - counts.previousCount

      return {
        category,
        change,
        previousCount: counts.previousCount,
        recentCount: counts.recentCount,
        trend: getTrendDirection(change, counts.previousCount, counts.recentCount),
      }
    })
    .filter((trend) => {
      return trend.previousCount + trend.recentCount >= 2
    })
}

function getTrendInsight(trend: CategoryTrend) {
  const categoryLabel = getCategoryActivityLabel(trend.category)

  if (trend.trend === 'increasing') {
    return `Trend projection: ${getCategoryActivityLabel(trend.category)} activity may continue to rise.`
  }

  if (trend.trend === 'decreasing') {
    return `Trend projection: ${categoryLabel} activity may continue to ease.`
  }

  return `Trend projection: ${categoryLabel} activity remains stable.`
}

function getTrendDirection(
  change: number,
  previousCount: number,
  recentCount: number,
): CategoryTrend['trend'] {
  if (Math.abs(change) < MINIMUM_TREND_CHANGE) {
    return 'stable'
  }

  if (previousCount === 0) {
    return recentCount >= MINIMUM_TREND_CHANGE ? 'increasing' : 'stable'
  }

  if (recentCount > previousCount * INCREASING_TREND_RATIO) {
    return 'increasing'
  }

  if (recentCount < previousCount * DECREASING_TREND_RATIO) {
    return 'decreasing'
  }

  return 'stable'
}

function getTrendPriority(trend: CategoryTrend) {
  if (trend.trend === 'stable') {
    return 0
  }

  return Math.abs(trend.change)
}

function getGeographicInsights(
  events: DisasterEvent[],
  rankedRegions: RegionCount[],
  dominantCategory: CategoryCount | undefined,
) {
  const dominantCategoryRegion = getDominantCategoryRegion(events, dominantCategory)
  const leadingRegion = dominantCategoryRegion ?? rankedRegions[0]
  const secondaryRegion = rankedRegions.find((region) => {
    return region.region !== leadingRegion?.region
  })

  if (!leadingRegion || leadingRegion.count < 2) {
    return []
  }

  if (!dominantCategoryRegion && secondaryRegion && secondaryRegion.count === leadingRegion.count) {
    return []
  }

  const insights = dominantCategoryRegion
    ? [
        `Significant regional concentration detected in ${leadingRegion.region}, primarily tied to ${dominantCategory?.category}.`,
      ]
    : [
        `Elevated regional activity detected in ${leadingRegion.region}.`,
      ]

  return insights
}

function getDominantCategoryRegion(
  events: DisasterEvent[],
  dominantCategory: CategoryCount | undefined,
) {
  if (!dominantCategory || dominantCategory.percentage <= 70) {
    return null
  }

  const rankedDominantCategoryClusters = getRankedRegionalClusters(
    events.filter((event) => event.category === dominantCategory.category),
  )
  const leadingRegion = rankedDominantCategoryClusters[0]
  const secondaryRegion = rankedDominantCategoryClusters[1]

  if (!leadingRegion) {
    return null
  }

  const minimumDenseClusterSize = Math.max(3, Math.ceil(dominantCategory.count * 0.05))
  const isDenseCluster = leadingRegion.count >= minimumDenseClusterSize
  const hasClearLead = !secondaryRegion || leadingRegion.count > secondaryRegion.count

  return isDenseCluster && hasClearLead ? leadingRegion : null
}

function getRankedRegionalClusters(events: DisasterEvent[]): RegionCount[] {
  const regionCellCounts = events.reduce<Partial<Record<RegionName, Record<string, number>>>>((counts, event) => {
    const region = getEventRegion(event)

    if (!region) {
      return counts
    }

    const cellKey = getMapCellKey(event)
    const regionCells = counts[region] ?? {}

    regionCells[cellKey] = (regionCells[cellKey] ?? 0) + 1
    counts[region] = regionCells

    return counts
  }, {})

  return Object.entries(regionCellCounts)
    .map(([region, cellCounts]) => ({
      count: Math.max(...Object.values(cellCounts ?? {})),
      region: region as RegionName,
    }))
    .filter((region) => Number.isFinite(region.count))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region))
}

function getRankedRegions(events: DisasterEvent[]): RegionCount[] {
  const regionCounts = events.reduce<Partial<Record<RegionName, number>>>((counts, event) => {
    const region = getEventRegion(event)

    if (region) {
      counts[region] = (counts[region] ?? 0) + 1
    }

    return counts
  }, {})

  return Object.entries(regionCounts)
    .map(([region, count]) => ({
      count: count ?? 0,
      region: region as RegionName,
    }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region))
}

function getMapCellKey(event: DisasterEvent) {
  const latitudeCell = Math.floor(event.latitude / 10)
  const longitudeCell = Math.floor(event.longitude / 10)

  return `${latitudeCell}:${longitudeCell}`
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

const TREND_PERIOD_MS = 7 * 24 * 60 * 60 * 1000
const INCREASING_TREND_RATIO = 1.2
const DECREASING_TREND_RATIO = 0.8
const MINIMUM_TREND_CHANGE = 2
const MAX_INSIGHTS = 5

function getLatestEventTime(events: DisasterEvent[]) {
  const eventTimes = events
    .map((event) => Date.parse(event.date))
    .filter(Number.isFinite)

  if (eventTimes.length === 0) {
    return null
  }

  return Math.max(...eventTimes)
}

function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`
}

function getCategoryVerb(category: string) {
  return category.endsWith('s') ? 'are' : 'is'
}

function getCategoryActivityLabel(category: string) {
  return category.endsWith('s') ? category.slice(0, -1) : category
}
