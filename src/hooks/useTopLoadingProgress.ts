import { useContext, useEffect } from 'react'
import { LoadingProgressContext } from '../context/loadingProgressContext'

export function useTopLoadingProgress(isLoading: boolean) {
  const context = useContext(LoadingProgressContext)

  useEffect(() => {
    if (!context) {
      return
    }

    context.setPageLoading(isLoading)

    return () => {
      context.setPageLoading(false)
    }
  }, [context, isLoading])
}
