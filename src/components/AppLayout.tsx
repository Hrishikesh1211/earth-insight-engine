import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type AppLayoutProps = {
  children: ReactNode
  sidebar: ReactNode
}

export function AppLayout({ children, sidebar }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">Earth Insight Engine</p>
          <h1 className="app-header__title">Environmental event dashboard</h1>
        </div>
        <div className="app-header__actions">
          <AppNavigation />
          <p className="app-header__status">Ready for live NASA EONET data</p>
        </div>
      </header>

      <main className="app-content">
        {children}
        {sidebar}
      </main>
    </div>
  )
}

export function AppNavigation() {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/analytics">Analytics</NavLink>
    </nav>
  )
}
