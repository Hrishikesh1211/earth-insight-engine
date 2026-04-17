import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useLoadingTransition } from '../hooks/useLoadingTransition'
import { LiveDataPulse } from './LiveDataPulse'
import { PageLoadingState } from './PageLoadingState'

type AppLayoutProps = {
  children: ReactNode
  isPageLoading?: boolean
  leftPanel?: ReactNode
  rightPanel?: ReactNode
  sidebar?: ReactNode
}

export function AppLayout({
  children,
  isPageLoading = false,
  leftPanel,
  rightPanel,
  sidebar,
}: AppLayoutProps) {
  const {
    contentClassName,
    loadingClassName,
    shouldRenderLoading,
  } = useLoadingTransition(isPageLoading)

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">Earth Insight Engine</p>
          <h1 className="app-header__title">Global Environmental Intelligence Monitor</h1>
        </div>
        <div className="app-header__actions">
          <AppNavigation />
          <LiveDataPulse />
        </div>
      </header>

      {shouldRenderLoading && <PageLoadingState className={loadingClassName} />}

      <main
        className={`app-content ${contentClassName}`}
        aria-hidden={isPageLoading}
      >
        {leftPanel}
        {children}
        {rightPanel ?? sidebar}
      </main>
    </div>
  )
}

export function AppNavigation() {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <NavLink to="/">Monitor</NavLink>
      <NavLink to="/analytics">Signals</NavLink>
      <NavLink to="/intelligence">Intelligence</NavLink>
    </nav>
  )
}
