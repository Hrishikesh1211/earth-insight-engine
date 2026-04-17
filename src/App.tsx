import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { TopLoadingProgressProvider } from './components/TopLoadingProgress'
import { DataProvider } from './context/DataContext'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { IntelligencePage } from './pages/IntelligencePage'

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <DataProvider>
          <TopLoadingProgressProvider>
            <Routes>
              <Route element={<DashboardPage />} path="/" />
              <Route element={<AnalyticsPage />} path="/analytics" />
              <Route element={<IntelligencePage />} path="/intelligence" />
            </Routes>
          </TopLoadingProgressProvider>
        </DataProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}

export default App
