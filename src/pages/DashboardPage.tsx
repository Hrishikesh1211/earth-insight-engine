import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { EventMap } from '../components/EventMap'
import {
  eventCategories,
  getEventCategoryId,
  getEventCategoryStyle,
} from '../data/eventCategories'
import { getRecentEvents } from '../services/eonetService'
import { generateInsights } from '../services/insightService'
import type { DisasterEvent } from '../types/event'
import '../App.css'

type EventDaysRange = 30 | 90 | 365
type EventStatus = 'all' | 'open' | 'closed'

export function DashboardPage() {
  const requestIdRef = useRef(0)
  const [events, setEvents] = useState<DisasterEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [daysRange, setDaysRange] = useState<EventDaysRange>(30)
  const [eventStatus, setEventStatus] = useState<EventStatus>('all')
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    eventCategories.map((category) => category.id),
  )

  useEffect(() => {
    const controller = new AbortController()
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    function isCurrentRequest() {
      return requestIdRef.current === requestId
    }

    async function loadEvents() {
      try {
        setIsLoading(true)
        setError(null)
        setEvents([])
        setSelectedEvent(null)
        setIsTimelinePlaying(false)

        const recentEvents = await getRecentEvents({
          days: daysRange,
          status: eventStatus,
          signal: controller.signal,
        })

        if (isCurrentRequest()) {
          setEvents(recentEvents)
          setCurrentTime(getLatestEventDate(recentEvents) ?? new Date())
          setIsTimelinePlaying(false)
        }
      } catch (loadError) {
        if (isAbortError(loadError) || !isCurrentRequest()) {
          return
        }

        setError('Recent events could not be loaded.')
      } finally {
        if (!controller.signal.aborted && isCurrentRequest()) {
          setIsLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      controller.abort()
    }
  }, [daysRange, eventStatus, retryCount])

  function handleRetry() {
    setError(null)
    setIsLoading(true)
    setRetryCount((currentRetryCount) => currentRetryCount + 1)
  }

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategories((currentCategories) => {
      if (currentCategories.includes(categoryId)) {
        return currentCategories.filter((id) => id !== categoryId)
      }

      return [...currentCategories, categoryId]
    })
  }

  function handleCategorySelectionToggle() {
    setSelectedCategories((currentCategories) => {
      if (currentCategories.length === eventCategories.length) {
        return []
      }

      return eventCategories.map((category) => category.id)
    })
  }

  const categoryFilteredEvents = events.filter((event) => {
    return selectedCategories.includes(getEventCategoryId(event.category))
  })
  const filteredEvents = filterEventsByCurrentTime(categoryFilteredEvents, currentTime)
  const insights = generateInsights(filteredEvents)
  const eventStats = getEventStats(filteredEvents)
  const categoryFilterOptions = getCategoryFilterOptions(events)
  const timelineRange = getTimelineRange(events)
  const timelineMaxTimestamp = timelineRange?.max.getTime() ?? null
  const sortedFilteredEvents = sortEventsByMostRecentDate(filteredEvents)

  function handleTimelinePlay() {
    if (timelineRange && currentTime.getTime() >= timelineRange.max.getTime()) {
      setCurrentTime(timelineRange.min)
    }

    setIsTimelinePlaying(true)
  }

  useEffect(() => {
    if (!isTimelinePlaying || timelineMaxTimestamp === null) {
      return
    }

    const playbackTimer = window.setInterval(() => {
      setCurrentTime((currentPlaybackTime) => {
        const nextTimestamp = currentPlaybackTime.getTime() + ONE_DAY_IN_MS

        if (nextTimestamp >= timelineMaxTimestamp) {
          setIsTimelinePlaying(false)
          return new Date(timelineMaxTimestamp)
        }

        return new Date(nextTimestamp)
      })
    }, TIMELINE_PLAYBACK_INTERVAL_MS)

    return () => {
      window.clearInterval(playbackTimer)
    }
  }, [isTimelinePlaying, timelineMaxTimestamp])

  useEffect(() => {
    if (
      selectedEvent &&
      !selectedCategories.includes(getEventCategoryId(selectedEvent.category))
    ) {
      setSelectedEvent(null)
    }
  }, [selectedCategories, selectedEvent])

  const hasEvents = events.length > 0
  const hasFilteredEvents = filteredEvents.length > 0
  const isError = !isLoading && error !== null
  const isEmpty = !isLoading && !error && !hasEvents
  const isSuccess = !isLoading && !error && hasEvents
  const areAllCategoriesSelected =
    selectedCategories.length === eventCategories.length

  return (
    <AppLayout
      sidebar={
        <aside className="insights-panel" aria-label="Events and insights">
          <h2>Events and insights</h2>

          {isLoading && <p className="sidebar-message">Loading recent events...</p>}

          {isError && (
            <div className="state-message state-message--error">
              <p>{error}</p>
              <button className="retry-button" onClick={handleRetry} type="button">
                Retry
              </button>
            </div>
          )}

          {isEmpty && (
            <p className="sidebar-message">No recent events with coordinates found.</p>
          )}

          <section className="event-detail sidebar-section" aria-label="Selected event details">
            <h3>Selected Event Details</h3>
            {selectedEvent ? (
              <EventDetails event={selectedEvent} />
            ) : (
              <div className="event-detail__empty">
                <p>No event selected</p>
                <span>Choose an event from the list or map to inspect it.</span>
              </div>
            )}
          </section>

          {isSuccess && (
            <>
              <DatasetControls
                daysRange={daysRange}
                eventStatus={eventStatus}
                onDaysRangeChange={setDaysRange}
                onEventStatusChange={setEventStatus}
              />

              <EventFilters
                areAllCategoriesSelected={areAllCategoriesSelected}
                categoryFilterOptions={categoryFilterOptions}
                onCategorySelectionToggle={handleCategorySelectionToggle}
                onCategoryToggle={handleCategoryToggle}
                selectedCategories={selectedCategories}
              />

              {timelineRange && (
                <TimelineSlider
                  currentTime={currentTime}
                  isPlaying={isTimelinePlaying}
                  maxTime={timelineRange.max}
                  minTime={timelineRange.min}
                  onCurrentTimeChange={setCurrentTime}
                  onPause={() => setIsTimelinePlaying(false)}
                  onPlay={handleTimelinePlay}
                />
              )}

              <EventStatsSummary stats={eventStats} />

              <section className="sidebar-section" aria-label="Event list">
                <h3>Event List</h3>
                {hasFilteredEvents ? (
                  <EventList
                    events={sortedFilteredEvents}
                    onSelectEvent={setSelectedEvent}
                    selectedEvent={selectedEvent}
                  />
                ) : (
                  <p className="sidebar-message">No events match the selected filters.</p>
                )}
              </section>
            </>
          )}
        </aside>
      }
    >
      <section className="map-panel" aria-label="Map workspace">
        <div className="panel-header">
          <h2>Global event map</h2>
          <p>Map integration area for event locations, layers, and filters.</p>
        </div>
        <div className="map-placeholder">
          {isLoading && <MapStateMessage message="Loading map events..." />}

          {isError && (
            <MapStateMessage
              action={
                <button className="retry-button" onClick={handleRetry} type="button">
                  Retry
                </button>
              }
              message="Map events could not be loaded."
            />
          )}

          {!isLoading && !isError && (
            <EventMap
              events={filteredEvents}
              onSelectEvent={setSelectedEvent}
              selectedEvent={selectedEvent}
            />
          )}
        </div>
        {isSuccess && hasFilteredEvents && <InsightSummary insights={insights} />}
      </section>
    </AppLayout>
  )
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'
}

function filterEventsByCurrentTime(events: DisasterEvent[], currentTime: Date) {
  const currentTimestamp = currentTime.getTime()

  return events.filter((event) => {
    const eventTimestamp = Date.parse(event.date)

    return Number.isFinite(eventTimestamp) && eventTimestamp <= currentTimestamp
  })
}

function InsightSummary({ insights }: { insights: string[] }) {
  return (
    <section className="event-insights" aria-label="Insights">
      <h3>Insights</h3>
      <ul className="event-insights__list">
        {insights.map((insight) => (
          <li key={insight}>{insight}</li>
        ))}
      </ul>
    </section>
  )
}

function TimelineSlider({
  currentTime,
  isPlaying,
  maxTime,
  minTime,
  onCurrentTimeChange,
  onPause,
  onPlay,
}: {
  currentTime: Date
  isPlaying: boolean
  maxTime: Date
  minTime: Date
  onCurrentTimeChange: (currentTime: Date) => void
  onPause: () => void
  onPlay: () => void
}) {
  const currentTimestamp = clampTimestamp(
    currentTime.getTime(),
    minTime.getTime(),
    maxTime.getTime(),
  )
  const minTimestamp = minTime.getTime()
  const maxTimestamp = maxTime.getTime()
  const hasTimeRange = minTimestamp < maxTimestamp

  return (
    <section className="timeline-control sidebar-section" aria-label="Timeline replay">
      <h3>Timeline</h3>
      <p className="timeline-control__date">{formatDate(new Date(currentTimestamp).toISOString())}</p>
      <div className="timeline-control__actions">
        <button disabled={!hasTimeRange || isPlaying || currentTimestamp >= maxTimestamp} onClick={onPlay} type="button">
          Play
        </button>
        <button disabled={!isPlaying} onClick={onPause} type="button">
          Pause
        </button>
      </div>
      <input
        aria-label="Current timeline date"
        disabled={!hasTimeRange}
        max={maxTimestamp}
        min={minTimestamp}
        onChange={(event) => {
          onPause()
          onCurrentTimeChange(new Date(Number(event.target.value)))
        }}
        step={ONE_DAY_IN_MS}
        type="range"
        value={currentTimestamp}
      />
      <div className="timeline-control__bounds">
        <span>{formatDate(minTime.toISOString())}</span>
        <span>{formatDate(maxTime.toISOString())}</span>
      </div>
    </section>
  )
}

function DatasetControls({
  daysRange,
  eventStatus,
  onDaysRangeChange,
  onEventStatusChange,
}: {
  daysRange: EventDaysRange
  eventStatus: EventStatus
  onDaysRangeChange: (daysRange: EventDaysRange) => void
  onEventStatusChange: (eventStatus: EventStatus) => void
}) {
  return (
    <section className="dataset-controls sidebar-section" aria-label="Dataset controls">
      <h3>Dataset Controls</h3>
      <div className="dataset-control">
        <h4>Date range</h4>
        <div className="segmented-control">
          {[30, 90, 365].map((days) => (
            <button
              aria-pressed={daysRange === days}
              key={days}
              onClick={() => onDaysRangeChange(days as EventDaysRange)}
              type="button"
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      <div className="dataset-control">
        <h4>Status</h4>
        <div className="segmented-control">
          {(['all', 'open', 'closed'] as EventStatus[]).map((status) => (
            <button
              aria-pressed={eventStatus === status}
              key={status}
              onClick={() => onEventStatusChange(status)}
              type="button"
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

type CategoryCount = {
  categoryId: string
  color: string
  count: number
  label: string
}

type EventStats = {
  categoryCounts: CategoryCount[]
  total: number
}

type CategoryFilterOption = {
  color: string
  count: number
  id: string
  label: string
}

function getCategoryFilterOptions(events: DisasterEvent[]): CategoryFilterOption[] {
  const categoryCounts = getEventStats(events).categoryCounts
  const countByCategoryId = new Map(
    categoryCounts.map((category) => [category.categoryId, category.count]),
  )

  return eventCategories
    .map((category) => ({
      ...category,
      count: countByCategoryId.get(category.id) ?? 0,
    }))
    .sort((first, second) => {
      return second.count - first.count || first.label.localeCompare(second.label)
    })
}

function sortEventsByMostRecentDate(events: DisasterEvent[]) {
  return [...events].sort((first, second) => {
    return getSortableDate(second.date) - getSortableDate(first.date)
  })
}

function getEventStats(events: DisasterEvent[]): EventStats {
  const countMap = new Map<string, CategoryCount>()

  for (const event of events) {
    const categoryId = getEventCategoryId(event.category)
    const category = getEventCategoryStyle(event.category)
    const currentCount = countMap.get(categoryId)?.count ?? 0

    countMap.set(categoryId, {
      categoryId,
      color: category.color,
      count: currentCount + 1,
      label: category.label,
    })
  }

  return {
    categoryCounts: [...countMap.values()].sort((first, second) => {
      return second.count - first.count || first.label.localeCompare(second.label)
    }),
    total: events.length,
  }
}

function EventStatsSummary({ stats }: { stats: EventStats }) {
  return (
    <section className="event-stats sidebar-section" aria-label="Filtered event summary">
      <h3>Stats Summary</h3>
      <div className="event-stats__total">
        <span>Total events</span>
        <strong>{stats.total}</strong>
      </div>

      {stats.categoryCounts.length > 0 && (
        <ul className="event-stats__list">
          {stats.categoryCounts.map((category) => (
            <li key={category.categoryId}>
              <span
                className="event-stats__dot"
                style={getCategoryDotStyle(category.color)}
              />
              <span>{category.label}</span>
              <strong>{category.count}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EventFilters({
  areAllCategoriesSelected,
  categoryFilterOptions,
  onCategorySelectionToggle,
  onCategoryToggle,
  selectedCategories,
}: {
  areAllCategoriesSelected: boolean
  categoryFilterOptions: CategoryFilterOption[]
  onCategorySelectionToggle: () => void
  onCategoryToggle: (categoryId: string) => void
  selectedCategories: string[]
}) {
  return (
    <section className="event-filters sidebar-section" aria-label="Event category filters">
      <div className="event-filters__header">
        <h3>Category Filters</h3>
        <button onClick={onCategorySelectionToggle} type="button">
          {areAllCategoriesSelected ? 'Clear All' : 'Select All'}
        </button>
      </div>

      <div className="event-filters__options">
        {categoryFilterOptions.map((category) => {
          const isSelected = selectedCategories.includes(category.id)
          const isEmpty = category.count === 0

          return (
            <label
              className="filter-option"
              data-empty={isEmpty}
              key={category.id}
            >
              <input
                checked={isSelected}
                onChange={() => onCategoryToggle(category.id)}
                type="checkbox"
              />
              <span
                className="category-badge"
                style={getCategoryBadgeStyle(category.color)}
              >
                {category.label}
              </span>
              <span className="filter-option__count">{category.count}</span>
            </label>
          )
        })}
      </div>
    </section>
  )
}

function EventList({
  events,
  onSelectEvent,
  selectedEvent,
}: {
  events: DisasterEvent[]
  onSelectEvent: (event: DisasterEvent) => void
  selectedEvent: DisasterEvent | null
}) {
  return (
    <ul className="event-list">
      {events.map((event) => {
        const isSelected = selectedEvent?.id === event.id
        const category = getEventCategoryStyle(event.category)

        return (
          <li key={event.id}>
            <button
              className="event-card"
              aria-pressed={isSelected}
              onClick={() => onSelectEvent(event)}
              type="button"
            >
              <span className="event-card__title">{event.title}</span>
              <span
                className="category-badge"
                style={getCategoryBadgeStyle(category.color)}
              >
                {category.label}
              </span>
              <span className="event-card__meta">{formatDate(event.date)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function MapStateMessage({
  action,
  message,
}: {
  action?: ReactNode
  message: string
}) {
  return (
    <div className="map-state">
      <p>{message}</p>
      {action}
    </div>
  )
}

function EventDetails({ event }: { event: DisasterEvent }) {
  const category = getEventCategoryStyle(event.category)

  return (
    <div className="event-detail__content">
      <header className="event-detail__header">
        <h4>{event.title}</h4>
        <div>
          <span
            className="category-badge"
            style={getCategoryBadgeStyle(category.color)}
          >
            {category.label}
          </span>
        </div>
      </header>

      <dl className="event-detail__grid">
        <div>
          <dt>Date</dt>
          <dd>{formatDate(event.date)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{event.isOpen ? 'Open' : 'Closed'}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>{formatCoordinates(event)}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            {event.link ? (
              <a href={event.link} rel="noreferrer" target="_blank">
                Open source
              </a>
            ) : (
              'No source link available'
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatCoordinates(event: DisasterEvent) {
  return `${event.latitude.toFixed(3)}, ${event.longitude.toFixed(3)}`
}

function getSortableDate(date: string) {
  const time = Date.parse(date)

  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const TIMELINE_PLAYBACK_INTERVAL_MS = 400

function getTimelineRange(events: DisasterEvent[]) {
  const eventTimes = events
    .map((event) => Date.parse(event.date))
    .filter(Number.isFinite)

  if (eventTimes.length === 0) {
    return null
  }

  return {
    max: new Date(Math.max(...eventTimes)),
    min: new Date(Math.min(...eventTimes)),
  }
}

function getLatestEventDate(events: DisasterEvent[]) {
  const timelineRange = getTimelineRange(events)

  return timelineRange?.max ?? null
}

function clampTimestamp(timestamp: number, minTimestamp: number, maxTimestamp: number) {
  return Math.min(Math.max(timestamp, minTimestamp), maxTimestamp)
}

function getCategoryBadgeStyle(color: string): CSSProperties {
  return { '--category-color': color } as CSSProperties
}

function getCategoryDotStyle(color: string): CSSProperties {
  return { '--category-color': color } as CSSProperties
}
