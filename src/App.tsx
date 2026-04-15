import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TopLoadingProgressProvider } from './components/TopLoadingProgress'
import { DataProvider } from './context/DataContext'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { IntelligencePage } from './pages/IntelligencePage'

function App() {
  return (
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
  )
}

export default App
