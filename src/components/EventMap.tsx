import { memo, useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import {
  divIcon,
  latLngBounds,
  point,
  type LatLngExpression,
} from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import {
  getEventCategoryId,
  getEventCategoryStyle,
} from '../data/eventCategories'
import type { DisasterEvent } from '../types/event'

type EventMapProps = {
  events: DisasterEvent[]
  selectedEvent: DisasterEvent | null
  onSelectEvent: (event: DisasterEvent) => void
}

type MarkerClusterLike = {
  getChildCount: () => number
}

const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2
const MIN_ZOOM = 2
const MAX_ZOOM = 12
const SELECTED_ZOOM = 5
const CLUSTER_EXPAND_ZOOM = 8
const WORLD_BOUNDS = latLngBounds([
  [-90, -180],
  [90, 180],
])

export const EventMap = memo(function EventMap({
  events,
  selectedEvent,
  onSelectEvent,
}: EventMapProps) {
  const selectedEventId = selectedEvent?.id ?? null
  const eventsWithCoordinates = useMemo(() => {
    return events.filter(hasValidCoordinates)
  }, [events])
  const legendEntries = useMemo(() => {
    return getMapLegendEntries(eventsWithCoordinates)
  }, [eventsWithCoordinates])
  const markers = useMemo(() => {
    return eventsWithCoordinates.map((event) => {
      const category = getEventCategoryStyle(event.category)
      const isSelected = selectedEventId === event.id

      return (
        <Marker
          eventHandlers={{
            click: () => onSelectEvent(event),
          }}
          icon={createEventMarkerIcon(category.color, isSelected)}
          key={event.id}
          position={[event.latitude, event.longitude]}
        >
          <Tooltip className="event-marker-tooltip" direction="top" offset={[0, -12]} sticky>
            <strong>{event.title}</strong>
            <span>{category.label}</span>
            <span>
              {formatDate(event.date)} - {event.isOpen ? 'Open' : 'Closed'}
            </span>
          </Tooltip>
        </Marker>
      )
    })
  }, [eventsWithCoordinates, onSelectEvent, selectedEventId])

  return (
    <MapContainer
      className="event-map"
      center={DEFAULT_CENTER}
      maxBounds={WORLD_BOUNDS}
      maxBoundsViscosity={1}
      maxZoom={MAX_ZOOM}
      minZoom={MIN_ZOOM}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      worldCopyJump={false}
    >
      <TileLayer
        attribution='Tiles &copy; Esri'
        bounds={WORLD_BOUNDS}
        noWrap
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution=""
        bounds={WORLD_BOUNDS}
        noWrap
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
      />
      <SelectedEventView selectedEvent={selectedEvent} />
      <MarkerClusterGroup
        chunkedLoading
        disableClusteringAtZoom={CLUSTER_EXPAND_ZOOM}
        iconCreateFunction={createClusterIcon}
        maxClusterRadius={46}
        removeOutsideVisibleBounds
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
      >
        {markers}
      </MarkerClusterGroup>
      <MapLegend entries={legendEntries} />
    </MapContainer>
  )
})

type MapLegendEntry = {
  color: string
  id: string
  label: string
}

function MapLegend({ entries }: { entries: MapLegendEntry[] }) {
  if (entries.length === 0) {
    return null
  }

  return (
    <aside className="map-legend" aria-label="Map category legend">
      <h3>Event Types</h3>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <span
              className="map-legend__dot"
              style={getCategoryDotStyle(entry.color)}
            />
            <span>{entry.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function getMapLegendEntries(events: DisasterEvent[]): MapLegendEntry[] {
  const entryMap = new Map<string, MapLegendEntry>()

  for (const event of events) {
    const category = getEventCategoryStyle(event.category)
    const id = getEventCategoryId(category.label)

    if (!entryMap.has(id)) {
      entryMap.set(id, {
        color: category.color,
        id,
        label: category.label,
      })
    }
  }

  return [...entryMap.values()].sort((first, second) => {
    return first.label.localeCompare(second.label)
  })
}

function SelectedEventView({
  selectedEvent,
}: {
  selectedEvent: DisasterEvent | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedEvent || !hasValidCoordinates(selectedEvent)) {
      return
    }

    const selectedPosition: LatLngExpression = WORLD_BOUNDS.contains([
      selectedEvent.latitude,
      selectedEvent.longitude,
    ])
      ? [selectedEvent.latitude, selectedEvent.longitude]
      : WORLD_BOUNDS.getCenter()

    map.flyTo(selectedPosition, SELECTED_ZOOM, {
      animate: true,
      duration: 0.8,
    })
  }, [map, selectedEvent])

  return null
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

function createEventMarkerIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 14 : 10

  return divIcon({
    className: 'event-marker-icon',
    html: `<span class="event-marker-icon__dot" style="--category-color:${color}"></span>`,
    iconAnchor: point(size / 2, size / 2),
    iconSize: point(size, size),
  })
}

function createClusterIcon(cluster: MarkerClusterLike) {
  const count = cluster.getChildCount()
  const size = getClusterIconSize(count)

  return divIcon({
    className: 'event-cluster-icon',
    html: `<span>${count}</span>`,
    iconAnchor: point(size / 2, size / 2),
    iconSize: point(size, size),
  })
}

function getClusterIconSize(count: number) {
  return Math.min(46, 30 + Math.sqrt(count) * 3)
}

function getCategoryDotStyle(color: string): CSSProperties {
  return { '--category-color': color } as CSSProperties
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}
