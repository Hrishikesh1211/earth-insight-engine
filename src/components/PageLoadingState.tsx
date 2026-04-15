import { useEffect, useState } from 'react'
import { LoadingScreen } from './LoadingScreen'

const PAGE_LOADING_DELAY_MS = 400
const LOADING_TRANSITION_MS = 240

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

export function useLoadingTransition(isLoading: boolean) {
  const [shouldRenderLoading, setShouldRenderLoading] = useState(isLoading)

  useEffect(() => {
    if (isLoading) {
      setShouldRenderLoading(true)
      return
    }

    const transitionTimer = window.setTimeout(() => {
      setShouldRenderLoading(false)
    }, LOADING_TRANSITION_MS)

    return () => {
      window.clearTimeout(transitionTimer)
    }
  }, [isLoading])

  return {
    contentClassName: isLoading
      ? 'loading-transition__content loading-transition__content--hidden'
      : 'loading-transition__content loading-transition__content--visible',
    loadingClassName: isLoading
      ? 'loading-transition__loading loading-transition__loading--visible'
      : 'loading-transition__loading loading-transition__loading--hidden',
    shouldRenderLoading,
  }
}

export function PageLoadingState({ className = '' }: { className?: string }) {
  return <LoadingScreen className={className} />
}
