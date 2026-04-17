import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LoadingProgressContext } from '../context/loadingProgressContext'

const MINIMUM_ROUTE_PROGRESS_MS = 260
const PROGRESS_COMPLETE_MS = 280

export function TopLoadingProgressProvider({ children }: { children: ReactNode }) {
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isMinimumElapsed, setIsMinimumElapsed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const completionTimerRef = useRef<number | null>(null)
  const minimumTimerRef = useRef<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPageLoading) {
      return
    }

    clearTimer(completionTimerRef)
    clearTimer(minimumTimerRef)
    clearTimer(progressTimerRef)

    setIsVisible(true)
    setIsMinimumElapsed(false)
    setProgress(8)

    progressTimerRef.current = window.setTimeout(() => {
      setProgress(76)
    }, 30)

    minimumTimerRef.current = window.setTimeout(() => {
      setIsMinimumElapsed(true)
    }, MINIMUM_ROUTE_PROGRESS_MS)
  }, [isPageLoading])

  useEffect(() => {
    return () => {
      clearTimer(completionTimerRef)
      clearTimer(minimumTimerRef)
      clearTimer(progressTimerRef)
    }
  }, [])

  useEffect(() => {
    if (isPageLoading || !isMinimumElapsed) {
      return
    }

    setProgress(100)
    completionTimerRef.current = window.setTimeout(() => {
      setIsVisible(false)
      setProgress(0)
    }, PROGRESS_COMPLETE_MS)

    return () => {
      clearTimer(completionTimerRef)
    }
  }, [isMinimumElapsed, isPageLoading])

  const contextValue = useMemo(() => {
    return { setPageLoading: setIsPageLoading }
  }, [])

  return (
    <LoadingProgressContext.Provider value={contextValue}>
      <div
        className={`top-loading-progress ${isVisible ? 'top-loading-progress--visible' : 'top-loading-progress--hidden'}`}
        aria-hidden="true"
      >
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      {children}
    </LoadingProgressContext.Provider>
  )
}

function clearTimer(timerRef: React.MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }
}
