import type { DisasterEvent } from '../types/event'

const EONET_EVENTS_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events'

type GetRecentEventsOptions = {
  days?: number
  limit?: number
  status?: 'open' | 'closed' | 'all'
  signal?: AbortSignal
}

type EonetEvent = {
  id: string
  title: string
  link: string | null
  closed: string | null
  categories: EonetCategory[]
  sources: EonetSource[]
  geometry: EonetGeometry[]
}

type EonetCategory = {
  title: string
}

type EonetSource = {
  id: string
}

type EonetGeometry = {
  date: string
  type: string
  coordinates: unknown
}

type SkipReason =
  | 'invalid category extraction'
  | 'invalid coordinates'
  | 'no geometry'
  | 'no usable point coordinates'

type NormalizeResult =
  | {
      event: DisasterEvent
      skippedReason: null
    }
  | {
      event: null
      skippedReason: SkipReason
    }

export async function getRecentEvents({
  days = 30,
  signal,
  status = 'all',
}: GetRecentEventsOptions = {}): Promise<DisasterEvent[]> {
  try {
    const url = new URL(EONET_EVENTS_URL)
    url.searchParams.set('status', status)
    url.searchParams.set('days', String(days))
    url.searchParams.set('_', String(Date.now()))

    const response = await fetch(url, {
      cache: 'no-store',
      signal,
    })

    if (!response.ok) {
      throw new Error(`EONET request failed with status ${response.status}`)
    }

    const data: unknown = await response.json()
    const rawEvents = getRawEvents(data)
    const events = parseEonetEvents(rawEvents)
    const skipCounts: Record<SkipReason, number> = {
      'invalid category extraction': 0,
      'invalid coordinates': 0,
      'no geometry': 0,
      'no usable point coordinates': 0,
    }

    const normalizedEvents = events.flatMap((event) => {
      const result = normalizeEonetEvent(event)

      if (result.skippedReason) {
        skipCounts[result.skippedReason] += 1
      }

      return result.event ? [result.event] : []
    })

    console.log('EONET raw events fetched:', rawEvents.length)
    console.log(
      'EONET raw category titles:',
      getUniqueRawCategoryTitles(rawEvents),
    )
    console.log('EONET events after normalization:', normalizedEvents.length)
    console.log(
      'EONET normalized categories:',
      getUniqueNormalizedCategories(normalizedEvents),
    )
    console.log('EONET events skipped:', getTotalSkippedEvents(skipCounts))
    console.log('EONET skipped by reason:', skipCounts)

    return normalizedEvents
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    console.error('EONET fetch failed:', error)

    throw new Error('Unable to fetch EONET events.')
  }
}

function getRawEvents(data: unknown): unknown[] {
  if (!isRecord(data) || !Array.isArray(data.events)) {
    return []
  }

  return data.events
}

function parseEonetEvents(rawEvents: unknown[]): EonetEvent[] {
  return rawEvents.flatMap((event) => {
    const parsedEvent = parseEonetEvent(event)

    return parsedEvent ? [parsedEvent] : []
  })
}

function parseEonetEvent(event: unknown): EonetEvent | null {
  if (!isRecord(event) || !isString(event.id) || !isString(event.title)) {
    return null
  }

  return {
    id: event.id,
    title: event.title,
    link: isString(event.link) ? event.link : null,
    closed: isString(event.closed) ? event.closed : null,
    categories: parseCategories(event.categories),
    sources: parseSources(event.sources),
    geometry: parseGeometries(event.geometry),
  }
}

function normalizeEonetEvent(event: EonetEvent): NormalizeResult {
  const category = getPrimaryCategory(event)

  if (!category) {
    return { event: null, skippedReason: 'invalid category extraction' }
  }

  if (event.geometry.length === 0) {
    return { event: null, skippedReason: 'no geometry' }
  }

  const geometry = getLatestUsablePointGeometry(event.geometry)

  if (!geometry) {
    const skippedReason = hasPointGeometry(event.geometry)
      ? 'invalid coordinates'
      : 'no usable point coordinates'

    return { event: null, skippedReason }
  }

  const [longitude, latitude] = geometry.coordinates

  return {
    event: {
      id: event.id,
      title: event.title,
      category,
      date: geometry.date,
      longitude,
      latitude,
      source: event.sources[0]?.id ?? null,
      link: event.link,
      isOpen: event.closed === null,
    },
    skippedReason: null,
  }
}

function getPrimaryCategory(event: EonetEvent): string | null {
  const category = event.categories.find((eventCategory) => {
    return normalizeCategoryKey(eventCategory.title).length > 0
  })

  return category?.title.trim() ?? null
}

function getLatestUsablePointGeometry(
  geometries: EonetGeometry[],
): (EonetGeometry & { coordinates: [number, number] }) | null {
  const sortedGeometries = [...geometries].sort((first, second) => {
    return getSortableTime(second.date) - getSortableTime(first.date)
  })

  for (const geometry of sortedGeometries) {
    if (isUsablePointGeometry(geometry)) {
      return geometry
    }
  }

  return null
}

function isUsablePointGeometry(
  geometry: EonetGeometry,
): geometry is EonetGeometry & { coordinates: [number, number] } {
  if (
    geometry.type !== 'Point' ||
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length < 2
  ) {
    return false
  }

  const [longitude, latitude] = geometry.coordinates

  return isValidLongitude(longitude) && isValidLatitude(latitude)
}

function hasPointGeometry(geometries: EonetGeometry[]) {
  return geometries.some((geometry) => geometry.type === 'Point')
}

function parseCategories(categories: unknown): EonetCategory[] {
  if (!Array.isArray(categories)) {
    return []
  }

  return categories.flatMap((category) => {
    if (!isRecord(category) || !isString(category.title)) {
      return []
    }

    return [{ title: category.title }]
  })
}

function getUniqueRawCategoryTitles(rawEvents: unknown[]) {
  const categories = rawEvents.flatMap((event) => {
    if (!isRecord(event) || !Array.isArray(event.categories)) {
      return []
    }

    return event.categories.flatMap((category) => {
      if (!isRecord(category) || !isString(category.title)) {
        return []
      }

      return [category.title]
    })
  })

  return [...new Set(categories)].sort()
}

function getUniqueNormalizedCategories(events: DisasterEvent[]) {
  return [...new Set(events.map((event) => event.category))].sort()
}

function getTotalSkippedEvents(skipCounts: Record<SkipReason, number>) {
  return Object.values(skipCounts).reduce((total, count) => total + count, 0)
}

function parseSources(sources: unknown): EonetSource[] {
  if (!Array.isArray(sources)) {
    return []
  }

  return sources.flatMap((source) => {
    if (!isRecord(source) || !isString(source.id)) {
      return []
    }

    return [{ id: source.id }]
  })
}

function parseGeometries(geometries: unknown): EonetGeometry[] {
  if (!Array.isArray(geometries)) {
    return []
  }

  return geometries.flatMap((geometry) => {
    if (
      !isRecord(geometry) ||
      !isString(geometry.date) ||
      !isString(geometry.type)
    ) {
      return []
    }

    return [
      {
        date: geometry.date,
        type: geometry.type,
        coordinates: geometry.coordinates,
      },
    ]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isValidLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180
}

function normalizeCategoryKey(category: string) {
  return category.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getTime(date: string) {
  return Date.parse(date)
}

function getSortableTime(date: string) {
  const time = getTime(date)

  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY
}
