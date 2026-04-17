import { createContext } from 'react'
import type { DisasterEvent } from '../types/event'

export type DataContextValue = {
  error: string | null
  events: DisasterEvent[]
  isLoading: boolean
  lastUpdatedAt: Date | null
}

export const DataContext = createContext<DataContextValue | null>(null)
