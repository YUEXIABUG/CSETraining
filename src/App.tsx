import { Navigate, Route, Routes } from 'react-router-dom'
import AboutPage from './pages/AboutPage'
import HomePage from './pages/HomePage'
import StatsPage from './pages/StatsPage'
import TrainingPage from './pages/TrainingPage'

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/train/:type" element={<TrainingPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
