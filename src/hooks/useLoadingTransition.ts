import { useEffect, useState } from 'react'

const LOADING_TRANSITION_MS = 240

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
