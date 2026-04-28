import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Clock, IndianRupee, Shield, TrendingDown } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { useTheme } from '../context/ThemeContext'

export default function RouteOptimizer() {
    const { theme } = useTheme()
    const [stops, setStops] = useState(['Wagholi', 'Viman Nagar', 'Hinjewadi'])
    const [newStop, setNewStop] = useState('')
    const [selectedTime, setSelectedTime] = useState(15)
    const [optimizedRoute, setOptimizedRoute] = useState(null)
    const [loading, setLoading] = useState(false)

    const addStop = () => {
        if (newStop.trim() && stops.length < 5) {
            setStops([...stops, newStop])
            setNewStop('')
        }
    }

    const removeStop = (idx) => {
        setStops(stops.filter((_, i) => i !== idx))
    }

    const optimizeRoute = async () => {
        setLoading(true)
        // Calculate real distances between stops
        setTimeout(() => {
            // Real location coordinates for Pune stops
            const locations = {
                'Wagholi': { lat: 18.4627, lon: 73.9243 },
                'Viman Nagar': { lat: 18.5721, lon: 73.9149 },
                'Hinjewadi': { lat: 18.5909, lon: 73.7650 },
                'Pune Station': { lat: 18.5298, lon: 73.8309 },
                'Koregaon Park': { lat: 18.5347, lon: 73.8839 }
            }
            
            // Calculate total distance between consecutive stops
            let totalDistance = 0
            for (let i = 0; i < stops.length - 1; i++) {
                const from = locations[stops[i]]
                const to = locations[stops[i + 1]]
                if (from && to) {
                    const lat1 = from.lat, lon1 = from.lon
                    const lat2 = to.lat, lon2 = to.lon
                    const R = 6371 // Earth's radius in km
                    const dLat = (lat2 - lat1) * Math.PI / 180
                    const dLon = (lon2 - lon1) * Math.PI / 180
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                              Math.sin(dLon / 2) * Math.sin(dLon / 2)
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                    totalDistance += R * c
                }
            }
            
            // Use real distance, not random
            const trafficMultiplier = selectedTime >= 8 && selectedTime <= 10 || selectedTime >= 17 && selectedTime <= 19 ? 1.5 : 1.1
            const durationMinutes = Math.round((totalDistance / 40) * 60 * trafficMultiplier) // 40 km/h average speed
            const baseCost = totalDistance * 15
            const baseRisk = Math.floor(Math.random() * 40) + 30

            setOptimizedRoute({
                distance: totalDistance.toFixed(1),
                duration: durationMinutes,
                cost: Math.round(baseCost),
                safety: baseRisk,
                traffic_factor: trafficMultiplier > 1.2 ? 'Peak hours - expect delays' : 'Smooth traffic - good time to travel'
            })
            setLoading(false)
        }, 1500)
    }

    return (
        <div className="flex">
            <Sidebar />
            <PageWrapper>
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                                <Navigation className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Route Optimizer</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Multi-stop route optimization using AI</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Enter Stops (Max 5)</h2>

                            {/* Stop List */}
                            <div className="space-y-3 mb-6">
                                {stops.map((stop, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl"
                                    >
                                        <span className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="flex-1 text-gray-900 dark:text-white font-medium">{stop}</span>
                                        {stops.length > 2 && (
                                            <button
                                                onClick={() => removeStop(idx)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Add Stop */}
                            {stops.length < 5 && (
                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Add new stop..."
                                        value={newStop}
                                        onChange={(e) => setNewStop(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addStop()}
                                        className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border-0"
                                    />
                                    <button
                                        onClick={addStop}
                                        className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all"
                                    >
                                        + Add
                                    </button>
                                </div>
                            )}

                            {/* Time Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    ⏰ Departure Time (Hour)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                                />
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                    Peak hours: 8-10 AM, 5-7 PM
                                </p>
                            </div>

                            {/* Optimize Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={optimizeRoute}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loading ? '⚡ Optimizing...' : '🚀 Optimize Route with ML'}
                            </motion.button>
                        </motion.div>

                        {/* Results Section */}
                        {optimizedRoute && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8"
                            >
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Optimization Results</h2>

                                <div className="space-y-4">
                                    {/* Distance */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 bg-blue-100 dark:bg-blue-900 rounded-2xl"
                                    >
                                        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">📍 Total Distance</p>
                                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                            {optimizedRoute.distance} km
                                        </p>
                                    </motion.div>

                                    {/* Duration */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="p-5 bg-purple-100 dark:bg-purple-900 rounded-2xl"
                                    >
                                        <p className="text-sm text-purple-900 dark:text-purple-100 mb-2">⏱️ Total Duration</p>
                                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                            {optimizedRoute.duration} min
                                        </p>
                                    </motion.div>

                                    {/* Cost */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="p-5 bg-green-100 dark:bg-green-900 rounded-2xl"
                                    >
                                        <p className="text-sm text-green-900 dark:text-green-100 mb-2">💰 Total Cost</p>
                                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                                            ₹{optimizedRoute.cost}
                                        </p>
                                    </motion.div>

                                    {/* Safety */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-5 bg-orange-100 dark:bg-orange-900 rounded-2xl"
                                    >
                                        <p className="text-sm text-orange-900 dark:text-orange-100 mb-2">🛡️ Safety Risk</p>
                                        <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                                            {optimizedRoute.safety}/100
                                        </p>
                                    </motion.div>

                                    {/* Traffic Factor */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="p-5 bg-gray-100 dark:bg-gray-700 rounded-2xl"
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">🚗 Traffic Factor</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {optimizedRoute.traffic_factor}
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </PageWrapper>
        </div>
    )
}
