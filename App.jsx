import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import RideHistory from './pages/RideHistory'
import BookRide from './pages/BookRide'
import TrafficMonitor from './pages/TrafficMonitor'
import MLPredictions from './pages/MLPredictions'
import DriverProfile from './pages/DriverProfile'
import DemandHeatmap from './pages/DemandHeatmap'
import RouteOptimizer from './pages/RouteOptimizer'
import RideWiseBot from './components/RideWiseBot'
import AnimatedVehicleBackground from './components/AnimatedVehicleBackground'
import MovingBikesBottom from './components/MovingBikesBottom'

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('ridewise_user')
  if (!isAuth) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const isAuth = localStorage.getItem('ridewise_user')

  return (
    <ThemeProvider>
      <AnimatedVehicleBackground />
      <MovingBikesBottom />
      <Router>
        {isAuth && <RideWiseBot />}
        <Routes>
          <Route path="/" element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/login" element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={isAuth ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ride-history" element={<ProtectedRoute><RideHistory /></ProtectedRoute>} />
          <Route path="/book-ride" element={<ProtectedRoute><BookRide /></ProtectedRoute>} />
          <Route path="/traffic-monitor" element={<ProtectedRoute><TrafficMonitor /></ProtectedRoute>} />
          <Route path="/ml-predictions" element={<ProtectedRoute><MLPredictions /></ProtectedRoute>} />
          <Route path="/driver-profile" element={<ProtectedRoute><DriverProfile /></ProtectedRoute>} />
          <Route path="/demand-heatmap" element={<ProtectedRoute><DemandHeatmap /></ProtectedRoute>} />
          <Route path="/route-optimizer" element={<ProtectedRoute><RouteOptimizer /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}
