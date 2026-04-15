import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getRecentEvents } from '../services/eonetService'
import type { DisasterEvent } from '../types/event'

type DataContextValue = {
  error: string | null
  events: DisasterEvent[]
  isLoading: boolean
  lastUpdatedAt: Date | null
}

const DataContext = createContext<DataContextValue | null>(null)

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

export function useData() {
  const context = useContext(DataContext)

  if (!context) {
    throw new Error('useData must be used within DataProvider.')
  }

  return context
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError'
}
