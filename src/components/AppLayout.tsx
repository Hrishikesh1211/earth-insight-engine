import type { ReactNode } from 'react'

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
        <p className="app-header__status">Ready for live NASA EONET data</p>
      </header>

      <main className="app-content">
        {children}
        {sidebar}
      </main>
    </div>
  )
}
