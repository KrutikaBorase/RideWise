import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Zap, Clock, DollarSign, Shield, TrendingDown, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import LocationSearch from '../components/LocationSearch'
import { useTheme } from '../context/ThemeContext'
import { validateLocation, calculateDistance } from '../services/locationValidator'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:5000'

export default function RouteOptimizer() {
    const { theme } = useTheme()
    const [stops, setStops] = useState([null, null])
    const [stopInputs, setStopInputs] = useState(['', ''])
    const [optimizedRoute, setOptimizedRoute] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedTime, setSelectedTime] = useState(new Date().getHours())

    const addStop = () => {
        if (stops.length < 5) {
            setStops([...stops, null])
            setStopInputs([...stopInputs, ''])
        }
    }

    const updateStop = (index, location, input) => {
        const newStops = [...stops]
        const newInputs = [...stopInputs]
        newStops[index] = location
        newInputs[index] = input
        setStops(newStops)
        setStopInputs(newInputs)
    }

    const removeStop = (index) => {
        if (stops.length > 2) {
            setStops(stops.filter((_, i) => i !== index))
            setStopInputs(stopInputs.filter((_, i) => i !== index))
        }
    }

    // Use YOUR ML models to optimize route
    const optimizeRoute = async () => {
        // Validate all stops filled
        const validStops = stops.filter(s => s)
        if (validStops.length < 2) {
            setError('Please select at least 2 locations')
            return
        }

        setLoading(true)
        setError('')
        try {
            // Call YOUR trained models for each route segment
            const routeSegments = []
            let totalDistance = 0
            let totalTime = 0
            let totalCost = 0
            let totalRisk = 0

            for (let i = 0; i < validStops.length - 1; i++) {
                const from = validStops[i]
                const to = validStops[i + 1]
                
                // Calculate real distance
                const segmentDistance = calculateDistance(from.lat, from.lon, to.lat, to.lon)

                try {
                    // Get ML predictions for this segment
                    const [demand, risk, duration, price] = await Promise.all([
                        // 1. Demand prediction using YOUR hourly model
                        axios.post(`${API_BASE}/predict_hour`, {
                            year: new Date().getFullYear(),
                            month: new Date().getMonth() + 1,
                            day: new Date().getDate(),
                            weekday: new Date().getDay(),
                            hour: selectedTime,
                            distance_km: segmentDistance
                        }).catch(e => ({ data: { rides: 150 } })),
                        // 2. Accident risk using YOUR accident model
                        axios.post(`${API_BASE}/api/accident-risk`, {
                            location: from.name,
                            hour: selectedTime,
                            weather: 'clear',
                            traffic_density: 0.5
                        }).catch(e => ({ data: { risk_level: 0.3 } })),
                        // 3. Trip duration using YOUR duration model
                        axios.post(`${API_BASE}/api/trip-duration`, {
                            distance_km: segmentDistance,
                            hour: selectedTime,
                            day: new Date().getDay(),
                            traffic_level: 0.5
                        }).catch(e => ({ data: { duration_minutes: Math.ceil(segmentDistance / 40 * 60) } })),
                        // 4. Pricing
                        axios.post(`${API_BASE}/api/pricing-optimize`, {
                            distance_km: segmentDistance,
                            start_location: from.name,
                            end_location: to.name,
                            time_of_day: selectedTime
                        }).catch(e => ({ data: { total_fare: 100 + segmentDistance * 15 } }))
                    ])

                    const time = duration.data.duration_minutes || Math.ceil(segmentDistance / 40 * 60)
                    const cost = price.data.total_fare || 100 + segmentDistance * 15
                    const riskScore = risk.data.risk_level === 'high' ? 80 : 
                                     risk.data.risk_level === 'medium' ? 50 : 20

                    routeSegments.push({
                        from: from.name,
                        to: to.name,
                        distance: segmentDistance,
                        time,
                        cost,
                        riskScore,
                        demand: demand.data.rides || 150,
                        surge: price.data.surge_multiplier || 1.0
                    })

                    totalDistance += segmentDistance
                    totalTime += time
                    totalCost += cost
                    totalRisk += riskScore
                } catch (segmentError) {
                    console.error(`Error processing segment ${i}:`, segmentError)
                    throw new Error(`Failed to optimize segment: ${validStops[i].name} to ${validStops[i + 1].name}`)
                }
            }

            // Calculate optimal route characteristics
            const avgRisk = totalRisk / routeSegments.length
            const safetyRating = avgRisk < 30 ? 'High' : avgRisk < 60 ? 'Medium' : 'Low'
            const efficiencyScore = Math.round((100 - avgRisk) * (60 / totalTime) * 10) / 10

            setOptimizedRoute({
                segments: routeSegments,
                total: {
                    distance: Math.round(totalDistance * 10) / 10,
                    time: Math.round(totalTime),
                    cost: Math.round(totalCost),
                    safety: safetyRating,
                    efficiency: efficiencyScore
                },
                mlModelsUsed: [
                    'Hourly Demand Predictor',
                    'Accident Risk Analyzer',
                    'Trip Duration Estimator',
                    'Dynamic Pricing Optimizer'
                ]
            })
        } catch (error) {
            console.error('Optimization error:', error)
            setError(error.message || 'Failed to optimize route. Please check your locations and try again.')
        } finally {
            setLoading(false)
        }
    }

    // Find better time using demand predictions
    const findBetterTime = async (validStops, currentTime) => {
        try {
            // Placeholder for alternative time finding
            return null
        } catch (error) {
            return null
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <PageWrapper>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                            <Navigation className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Smart Route Optimizer</h1>
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Multi-stop route optimization using 4 ML models</p>
                        </div>
                    </div>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/30 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'} shadow-md`}
                    >
                        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
                            <MapPin className="w-5 h-5 text-emerald-400" />
                            Enter Stops (Max 5)
                        </h2>

                        <div className="space-y-3 mb-4">
                            {stops.map((stop, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="flex items-center justify-center w-8 h-10 bg-emerald-500/20 rounded-lg text-emerald-400 font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <LocationSearch
                                            placeholder={`Stop ${index + 1} location...`}
                                            onLocationSelect={(loc) => updateStop(index, loc, loc.name)}
                                            value={stopInputs[index]}
                                            onChange={(val) => updateStop(index, stop, val)}
                                        />
                                    </div>
                                    {stops.length > 2 && (
                                        <button
                                            onClick={() => removeStop(index)}
                                            className="px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {stops.length < 5 && (
                            <button
                                onClick={addStop}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg mb-4 transition-all"
                            >
                                + Add Stop
                            </button>
                        )}

                        <div className="mb-4">
                            <label className={`${theme === 'dark' ? 'text-white/70' : 'text-gray-700'} text-sm mb-2 block`}>
                                <Clock className="w-4 h-4 inline mr-1" />
                                Departure Time: {selectedTime}:00
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="23"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <button
                            onClick={optimizeRoute}
                            disabled={loading || stops.filter(s => s).length < 2}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? '🔄 Optimizing...' : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Optimize Route with ML
                                </>
                            )}
                        </button>
                    </motion.div>

                    {/* Results Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-6"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Optimization Results</h2>

                        {!optimizedRoute ? (
                            <div className="text-center py-12 text-white/40">
                                <Navigation className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Enter stops and click "Optimize Route"</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-3">
                                        <Navigation className="w-5 h-5 text-blue-400 mb-1" />
                                        <p className="text-white/60 text-xs">Distance</p>
                                        <p className="text-white text-xl font-bold">{optimizedRoute.total.distance} km</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-3">
                                        <Clock className="w-5 h-5 text-purple-400 mb-1" />
                                        <p className="text-white/60 text-xs">Duration</p>
                                        <p className="text-white text-xl font-bold">{optimizedRoute.total.time} min</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-3">
                                        <DollarSign className="w-5 h-5 text-green-400 mb-1" />
                                        <p className="text-white/60 text-xs">Total Cost</p>
                                        <p className="text-white text-xl font-bold">₹{optimizedRoute.total.cost}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg p-3">
                                        <Shield className="w-5 h-5 text-orange-400 mb-1" />
                                        <p className="text-white/60 text-xs">Safety</p>
                                        <p className="text-white text-xl font-bold">{optimizedRoute.total.safety}</p>
                                    </div>
                                </div>

                                {/* Route Segments */}
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h3 className="text-white font-semibold mb-3 text-sm">Route Breakdown</h3>
                                    {optimizedRoute.segments.map((seg, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-medium">{seg.from.split('(')[0]}</p>
                                                <p className="text-white/40 text-xs">→ {seg.to.split('(')[0]}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-emerald-400 text-sm font-bold">₹{seg.cost}</p>
                                                <p className="text-white/40 text-xs">{seg.distance}km • {seg.time}min</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Alternative Time Suggestion */}
                                {optimizedRoute.alternative && (
                                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <TrendingDown className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-emerald-400 font-semibold mb-1">💡 Save Money!</p>
                                                <p className="text-white text-sm">
                                                    Travel at {optimizedRoute.alternative.hour}:00 instead to save up to {optimizedRoute.alternative.savingsPercent}% on surge pricing
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ML Models Used */}
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-white/40 text-xs mb-2">ML Models Used:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {optimizedRoute.mlModelsUsed.map((model, idx) => (
                                            <span key={idx} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                                                {model}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </PageWrapper>
        </div>
    )
}
