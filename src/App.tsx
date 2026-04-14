import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyticsPage } from './pages/AnalyticsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardPage />} path="/" />
        <Route element={<AnalyticsPage />} path="/analytics" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
