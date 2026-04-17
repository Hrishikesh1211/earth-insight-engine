import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getRecentEvents } from '../services/eonetService'
import type { DisasterEvent } from '../types/event'
import { DataContext } from './DataContextStore'

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<DisasterEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadEvents() {
      try {
        setIsLoading(true)
        setError(null)

        const recentEvents = await getRecentEvents({
          days: 365,
          status: 'all',
          signal: controller.signal,
        })

        setEvents(recentEvents)
        setLastUpdatedAt(new Date())
      } catch (loadError) {
        if (isAbortError(loadError)) {
          return
        }

        setError('Global event stream could not be loaded.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      controller.abort()
    }
  }, [])

  const contextValue = useMemo(() => {
    return {
      error,
      events,
      isLoading,
      lastUpdatedAt,
    }
  }, [error, events, isLoading, lastUpdatedAt])

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'
}
