import { createContext } from 'react'

export type LoadingProgressContextValue = {
  setPageLoading: (isLoading: boolean) => void
}

export const LoadingProgressContext =
  createContext<LoadingProgressContextValue | null>(null)
