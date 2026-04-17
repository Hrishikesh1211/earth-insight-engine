import { useEffect, useState } from 'react'

const PAGE_LOADING_DELAY_MS = 400

export function usePageLoading(isDataLoading: boolean) {
  const [isMinimumLoading, setIsMinimumLoading] = useState(isDataLoading)

  useEffect(() => {
    if (!isDataLoading) {
      setIsMinimumLoading(false)
      return
    }

    setIsMinimumLoading(true)

    const loadingTimer = window.setTimeout(() => {
      setIsMinimumLoading(false)
    }, PAGE_LOADING_DELAY_MS)

    return () => {
      window.clearTimeout(loadingTimer)
    }
  }, [isDataLoading])

  return isDataLoading || isMinimumLoading
}
