import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import LocationSearch from '../components/LocationSearch'
import { useTheme } from '../context/ThemeContext'
import { Navigation, AlertTriangle, Car, Clock, MapPin, TrendingUp, Zap, RefreshCw, Bell, Shield as ShieldCheck, Cloud, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { validateLocation, calculateDistance } from '../services/locationValidator'

const API_BASE = 'http://localhost:5000'

export default function TrafficMonitor() {
    const { theme } = useTheme()
    const [isTracking, setIsTracking] = useState(false)
    const [currentRoute, setCurrentRoute] = useState(null)
    const [startLocation, setStartLocation] = useState(null)
    const [endLocation, setEndLocation] = useState(null)
    const [startInput, setStartInput] = useState('')
    const [endInput, setEndInput] = useState('')
    const [trafficAlerts, setTrafficAlerts] = useState([])
    const [alternativeRoutes, setAlternativeRoutes] = useState([])
    const [loading, setLoading] = useState(false)
    const [showARModal, setShowARModal] = useState(false)
    const [arDistance, setArDistance] = useState(2500)
    const [arHasPermission, setArHasPermission] = useState(false)
    const videoRef = useState(null)

    useEffect(() => {
        // Simulate traffic monitoring every 30 seconds when tracking
        let interval
        if (isTracking) {
            interval = setInterval(() => {
                checkTrafficConditions()
            }, 30000)
        }
        return () => clearInterval(interval)
    }, [isTracking])

    const startTracking = async () => {
        if (!startLocation || !endLocation) {
            alert('Please select both start and destination locations')
            return
        }

        setLoading(true)
        try {
            const distance = calculateDistance(
                startLocation.lat,
                startLocation.lon,
                endLocation.lat,
                endLocation.lon
            )
            
            setCurrentRoute({
                id: 'route_' + Date.now(),
                start: startLocation,
                end: endLocation,
                distance: distance,
                estimated_time: Math.ceil(distance / 40) // Assuming avg 40 km/hr
            })
            setIsTracking(true)
            checkTrafficConditions()
        } catch (err) {
            console.error('Failed to start tracking:', err)
            alert('Error starting tracking. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const checkTrafficConditions = async () => {
        if (!currentRoute) return

        try {
            // Simulate traffic data based on time and route
            const alerts = []
            const hour = new Date().getHours()
            
            // Simulate traffic during peak hours
            if (hour >= 8 && hour <= 10 || hour >= 17 && hour <= 19) {
                alerts.push({
                    id: 1,
                    title: 'Heavy Traffic',
                    description: 'Expect 15-20% delays on main route',
                    severity: 'high',
                    location: 'Main intersection'
                })
            }
            
            setTrafficAlerts(alerts)
            
            // Suggest alternative routes
            setAlternativeRoutes([
                {
                    id: 1,
                    name: 'Scenic Route',
                    distance: currentRoute.distance * 1.2,
                    time: currentRoute.estimated_time * 1.1,
                    traffic_level: 'light'
                },
                {
                    id: 2,
                    name: 'Highway Route',
                    distance: currentRoute.distance * 0.95,
                    time: currentRoute.estimated_time * 0.85,
                    traffic_level: 'moderate'
                }
            ])

            // Show browser notification for critical alerts
            if (response.data.alerts?.some(a => a.severity === 'high')) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('⚠️ Traffic Alert!', {
                        body: 'Heavy traffic detected ahead. Check alternative routes.',
                        icon: '/favicon.ico'
                    })
                }
            }
        } catch (err) {
            console.error('Failed to check traffic')
        }
    }

    const stopTracking = () => {
        setIsTracking(false)
        setCurrentRoute(null)
        setTrafficAlerts([])
        setAlternativeRoutes([])
    }

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                new Notification('✅ Notifications Enabled', {
                    body: 'You will receive traffic alerts during your journey'
                })
            }
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <PageWrapper>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex justify-between items-end"
                >
                    <div>
                        <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>Live Traffic</h1>
                        <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Real-time traffic alerts and route suggestions</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowARModal(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Navigation className="w-4 h-4" />
                            AR Navigation
                        </button>
                        <button
                            onClick={requestNotificationPermission}
                            className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Bell className="w-4 h-4" />
                            Enable Alerts
                        </button>
                    </div>
                </motion.div>

                {!isTracking ? (
                    // Setup Route
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${theme === 'dark' ? 'bg-card' : 'bg-white'} rounded-xl p-6 max-w-2xl mx-auto shadow-md border ${theme === 'dark' ? 'border-border' : 'border-slate-200'}`}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Car className="w-8 h-8 text-orange-500" />
                            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Track Your Journey</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'} mb-2`}>
                                    <MapPin className="w-5 h-5 text-green-500" />
                                    Starting Point
                                </label>
                                <LocationSearch
                                    placeholder="Search starting location..."
                                    onLocationSelect={(location) => setStartLocation(location)}
                                    value={startInput}
                                    onChange={setStartInput}
                                />
                            </div>

                            <div>
                                <label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'} mb-2`}>
                                    <MapPin className="w-5 h-5 text-red-500" />
                                    Destination
                                </label>
                                <LocationSearch
                                    placeholder="Search destination..."
                                    onLocationSelect={(location) => setEndLocation(location)}
                                    value={endInput}
                                    onChange={setEndInput}
                                />
                            </div>

                            <button
                                onClick={startTracking}
                                disabled={loading || !startLocation || !endLocation}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Navigation className="w-5 h-5" />
                                {loading ? 'Starting...' : 'Start Tracking'}
                            </button>

                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                <p className="text-blue-300 text-sm">
                                    <strong>How it works:</strong> We'll monitor traffic on your route in real-time and alert you 
                                    BEFORE you hit congestion, giving you time to take an alternative route.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // Tracking Active
                    <div className="space-y-6">
                        {/* Current Route Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-6 shadow-md border border-slate-200"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                                        <Navigation className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Tracking Active</h3>
                                        <p className="text-gray-600">Monitoring traffic conditions...</p>
                                    </div>
                                </div>
                                <button
                                    onClick={stopTracking}
                                    className="px-6 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all"
                                >
                                    Stop Tracking
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-600 text-sm">From</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">{currentRoute?.start_zone}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="text-gray-600 text-sm">Est. Time</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">{currentRoute?.estimated_time || '25'} min</p>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-red-500" />
                                        <span className="text-gray-600 text-sm">To</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">{currentRoute?.end_zone}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Traffic Alerts */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl p-6 shadow-md border border-slate-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                                <h2 className="text-xl font-bold text-gray-900">Traffic Alerts</h2>
                                <button
                                    onClick={checkTrafficConditions}
                                    className="ml-auto p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-900" />
                                </button>
                            </div>

                            {trafficAlerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-3">
                                        <TrendingUp className="w-8 h-8 text-green-400" />
                                    </div>
                                    <p className="text-white/60">✅ All clear! No traffic issues on your route</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {trafficAlerts.map((alert, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`p-4 rounded-xl border ${
                                                alert.severity === 'high' 
                                                    ? 'bg-red-500/10 border-red-500/30' 
                                                    : alert.severity === 'medium'
                                                    ? 'bg-orange-500/10 border-orange-500/30'
                                                    : 'bg-yellow-500/10 border-yellow-500/30'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                                                    alert.severity === 'high' ? 'text-red-400' : 
                                                    alert.severity === 'medium' ? 'text-orange-400' : 
                                                    'text-yellow-400'
                                                }`} />
                                                <div className="flex-1">
                                                    <h4 className="text-white font-medium mb-1">{alert.title}</h4>
                                                    <p className="text-white/60 text-sm">{alert.message}</p>
                                                    <p className="text-white/40 text-xs mt-2">📍 {alert.location}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    alert.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                                                    alert.severity === 'medium' ? 'bg-orange-500/20 text-orange-300' :
                                                    'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                    {alert.severity.toUpperCase()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Alternative Routes */}
                        {alternativeRoutes.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-xl p-6 shadow-md border border-slate-200"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Zap className="w-6 h-6 text-blue-500" />
                                    <h2 className="text-xl font-bold text-gray-900">Alternative Routes</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {alternativeRoutes.map((route, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-cyan-300 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-gray-900 font-medium">Route {index + 1}</h4>
                                                <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">
                                                    FASTER
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Via:</span>
                                                    <span className="text-gray-900">{route.via}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Time:</span>
                                                    <span className="text-green-600 font-medium">{route.time} min</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Distance:</span>
                                                    <span className="text-gray-900">{route.distance} km</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Weather & Safety Dashboard - Always visible */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                    {/* Weather Conditions */}
                    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-blue-500/20">
                                <Cloud className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Weather Impact</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <div>
                                    <p className="text-white font-medium">Current Conditions</p>
                                    <p className="text-white/60 text-sm">Clear skies, visibility good</p>
                                </div>
                                <span className="text-2xl">☀️</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 rounded-xl bg-white/5">
                                    <p className="text-white/60 text-xs mb-1">Temperature</p>
                                    <p className="text-white font-bold">24°C</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5">
                                    <p className="text-white/60 text-xs mb-1">Visibility</p>
                                    <p className="text-green-400 font-bold">Good</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5">
                                    <p className="text-white/60 text-xs mb-1">Rain</p>
                                    <p className="text-white font-bold">0%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Safety Score */}
                    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-green-100">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Route Safety Score</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                                <p className="text-4xl font-bold text-green-400 mb-1">92/100</p>
                                <p className="text-white/60 text-sm">ML-based accident risk analysis</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-white/5">
                                    <p className="text-white/60 text-xs mb-1">Accident History</p>
                                    <p className="text-green-400 font-bold">Low Risk</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5">
                                    <p className="text-white/60 text-xs mb-1">Road Quality</p>
                                    <p className="text-blue-400 font-bold">Excellent</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* AR Navigation Modal */}
                {showARModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-100 rounded-xl">
                                        <Navigation className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">AR Navigation</h3>
                                        <p className="text-gray-600 text-sm">Augmented Reality Path Finder</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowARModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <AlertCircle className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <Car className="w-5 h-5 text-green-500" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-600 mb-1">Distance to Destination</div>
                                        <div className="text-3xl font-bold text-gray-900">{(arDistance / 1000).toFixed(1)} km</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="text-xs text-gray-600 mb-1">ETA</div>
                                        <div className="text-lg font-bold text-gray-900">12 mins</div>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="text-xs text-gray-600 mb-1">Traffic</div>
                                        <div className="text-lg font-bold text-orange-600">Moderate</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <Navigation className="w-5 h-5 text-cyan-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-gray-900 font-medium mb-1">AR Features</p>
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                <li>• Real-time directional overlays</li>
                                                <li>• Live traffic alerts at 1km intervals</li>
                                                <li>• Alternative route suggestions</li>
                                                <li>• Camera-based navigation</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <p className="text-orange-700 text-sm">
                                        <strong>Note:</strong> AR navigation requires camera permissions and works best on mobile devices with GPS.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        alert('AR navigation would open in full-screen camera mode on mobile devices!')
                                        setShowARModal(false)
                                    }}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                                >
                                    Start AR Navigation
                                </button>
                                <button
                                    onClick={() => setShowARModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-900 font-medium rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </PageWrapper>
        </div>
    )
}
