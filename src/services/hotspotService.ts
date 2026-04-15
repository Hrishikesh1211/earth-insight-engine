import type { DisasterEvent } from '../types/event'

export type Hotspot = {
  centerLatitude: number
  centerLongitude: number
  count: number
  dominantCategory: string
  id: string
  intensity: 'high' | 'medium'
  label: string
}

type HotspotCell = {
  categoryCounts: Map<string, number>
  count: number
  latitudeTotal: number
  longitudeTotal: number
}

const HOTSPOT_CELL_SIZE_DEGREES = 10
const HOTSPOT_LIMIT = 5
const MINIMUM_HOTSPOT_EVENTS = 3

export function detectHotspots(events: DisasterEvent[]): Hotspot[] {
  const cells = getHotspotCells(events)
  const populatedCells = [...cells.entries()]

  if (populatedCells.length === 0) {
    return []
  }

  const counts = populatedCells.map(([, cell]) => cell.count)
  const averageCount = getAverage(counts)
  const deviation = getStandardDeviation(counts, averageCount)
  const threshold = Math.max(
    MINIMUM_HOTSPOT_EVENTS,
    Math.ceil(averageCount + deviation),
  )

  return populatedCells
    .filter(([, cell]) => cell.count >= threshold)
    .map(([id, cell]) => {
      const dominantCategory = getDominantCategory(cell.categoryCounts)

      return {
        centerLatitude: cell.latitudeTotal / cell.count,
        centerLongitude: cell.longitudeTotal / cell.count,
        count: cell.count,
        dominantCategory,
        id,
        intensity: cell.count >= threshold * 1.8 ? 'high' : 'medium',
        label: getHotspotLabel(cell.latitudeTotal / cell.count, cell.longitudeTotal / cell.count),
      } satisfies Hotspot
    })
    .sort((first, second) => {
      return second.count - first.count || first.label.localeCompare(second.label)
    })
    .slice(0, HOTSPOT_LIMIT)
}

function getHotspotCells(events: DisasterEvent[]) {
  return events.reduce<Map<string, HotspotCell>>((cells, event) => {
    if (!hasValidCoordinates(event)) {
      return cells
    }

    const latitudeCell = Math.floor((event.latitude + 90) / HOTSPOT_CELL_SIZE_DEGREES)
    const longitudeCell = Math.floor((event.longitude + 180) / HOTSPOT_CELL_SIZE_DEGREES)
    const cellId = `${latitudeCell}:${longitudeCell}`
    const cell = cells.get(cellId) ?? {
      categoryCounts: new Map<string, number>(),
      count: 0,
      latitudeTotal: 0,
      longitudeTotal: 0,
    }

    cell.count += 1
    cell.latitudeTotal += event.latitude
    cell.longitudeTotal += event.longitude
    cell.categoryCounts.set(
      event.category,
      (cell.categoryCounts.get(event.category) ?? 0) + 1,
    )
    cells.set(cellId, cell)

    return cells
  }, new Map())
}

function hasValidCoordinates(event: DisasterEvent) {
  return (
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude) &&
    event.latitude >= -90 &&
    event.latitude <= 90 &&
    event.longitude >= -180 &&
    event.longitude <= 180
  )
}

function getDominantCategory(categoryCounts: Map<string, number>) {
  return [...categoryCounts.entries()].sort((first, second) => {
    return second[1] - first[1] || first[0].localeCompare(second[0])
  })[0]?.[0] ?? 'Mixed activity'
}

function getHotspotLabel(latitude: number, longitude: number) {
  const latitudeLabel = `${Math.abs(Math.round(latitude))}°${latitude >= 0 ? 'N' : 'S'}`
  const longitudeLabel = `${Math.abs(Math.round(longitude))}°${longitude >= 0 ? 'E' : 'W'}`

  return `${latitudeLabel}, ${longitudeLabel}`
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
