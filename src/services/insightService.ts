import type { DisasterEvent } from '../types/event'

type CategoryCount = {
  category: string
  count: number
  percentage: number
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

  const insights: string[] = [`The dataset includes ${totalEvents} total ${pluralize('event', totalEvents)}.`]

  insights.push(...getDominanceInsights(rankedCategories))
  insights.push(...getSecondaryCategoryInsights(rankedCategories))
  insights.push(...getGeographicInsights(events, rankedRegions, dominantCategory))
  insights.push(...getDistributionInsights(rankedCategories))
  insights.push(...getRareCategoryInsights(rankedCategories))

  return Array.from(new Set(insights)).slice(0, 5)
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
      `${dominantCategory.category} ${getCategoryVerb(dominantCategory.category)} overwhelmingly dominant, making up over 70% of all events.`,
    ]
  }

  if (dominantCategory.percentage >= 40) {
    return [
      `${dominantCategory.category} ${getCategoryVerb(dominantCategory.category)} the leading category, representing a significant portion of events.`,
    ]
  }

  return ['Event distribution is relatively balanced across categories.']
}

function getSecondaryCategoryInsights(rankedCategories: CategoryCount[]) {
  const dominantCategory = rankedCategories[0]
  const secondaryCategory = rankedCategories[1]

  if (!dominantCategory || !secondaryCategory) {
    return []
  }

  const comparison = secondaryCategory.count < dominantCategory.count / 2 ? 'significantly lower than' : 'close behind'

  return [
    `${secondaryCategory.category} ranks as the second most common event type, ${comparison} ${dominantCategory.category}.`,
  ]
}

function getRareCategoryInsights(rankedCategories: CategoryCount[]) {
  return rankedCategories
    .filter((category) => category.percentage < 5)
    .slice(0, 1)
    .map((category) => `${category.category} appear infrequently in the current dataset.`)
}

function getDistributionInsights(rankedCategories: CategoryCount[]) {
  const dominantCategory = rankedCategories[0]

  if (!dominantCategory || dominantCategory.percentage <= 40) {
    return []
  }

  if (dominantCategory.percentage > 70) {
    return ['The dataset is heavily skewed toward a single category.']
  }

  return ['The dataset shows a clear leading category without being completely one-sided.']
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
        `Most visible activity is concentrated in ${leadingRegion.region}, driven by ${dominantCategory?.category}.`,
      ]
    : [
        `Most current activity is concentrated in ${leadingRegion.region}.`,
      ]

  if (secondaryRegion && secondaryRegion.count >= 2) {
    insights.push(`${secondaryRegion.region} is the next most active region in the current dataset.`)
  }

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

function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`
}

function getCategoryVerb(category: string) {
  return category.endsWith('s') ? 'are' : 'is'
}
