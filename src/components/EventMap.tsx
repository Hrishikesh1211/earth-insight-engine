import { useEffect } from 'react'
import { latLngBounds, type LatLngExpression } from 'leaflet'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getEventCategoryStyle } from '../data/eventCategories'
import type { DisasterEvent } from '../types/event'

type EventMapProps = {
  events: DisasterEvent[]
  selectedEvent: DisasterEvent | null
  onSelectEvent: (event: DisasterEvent) => void
}

const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2
const MIN_ZOOM = 2
const MAX_ZOOM = 12
const SELECTED_ZOOM = 5
const WORLD_BOUNDS = latLngBounds([
  [-90, -180],
  [90, 180],
])

export function EventMap({
  events,
  selectedEvent,
  onSelectEvent,
}: EventMapProps) {
  const eventsWithCoordinates = events.filter(hasValidCoordinates)

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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        bounds={WORLD_BOUNDS}
        noWrap
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SelectedEventView selectedEvent={selectedEvent} />
      {eventsWithCoordinates.map((event) => {
        const category = getEventCategoryStyle(event.category)
        const isSelected = selectedEvent?.id === event.id

        return (
          <CircleMarker
            center={[event.latitude, event.longitude]}
            color={category.color}
            eventHandlers={{
              click: () => onSelectEvent(event),
            }}
            fillColor={category.color}
            fillOpacity={isSelected ? 0.82 : 0.7}
            key={event.id}
            opacity={isSelected ? 1 : 0.82}
            radius={isSelected ? 10 : 6}
            weight={isSelected ? 4 : 1}
          >
            <Tooltip direction="top" offset={[0, -4]} sticky>
              <strong>{event.title}</strong>
              <br />
              {category.label}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
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
