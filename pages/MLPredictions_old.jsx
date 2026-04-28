import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import AnimatedBackground from '../components/AnimatedBackground'
import LocationSearch from '../components/LocationSearch'
import { Brain, Calendar, Clock, MapPin, IndianRupee, AlertTriangle, Car, TrendingUp, Cloud, Zap, Activity, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import { externalAPIs } from '../services/externalAPIs'
import { locationValidator } from '../services/locationValidator'
import { ragLLMService } from '../services/ragLLMService'

export default function MLPredictions() {
    const [activeModel, setActiveModel] = useState('daily')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [weatherData, setWeatherData] = useState(null)

    // Load weather data
    useEffect(() => {
        const loadWeather = async () => {
            try {
                const weather = await externalAPIs.getWeather(18.5204, 73.8567)
                setWeatherData(weather)
            } catch (error) {
                console.error('Failed to load weather:', error)
            }
        }
        loadWeather()
    }, [])

    // Form states
    const [dailyForm, setDailyForm] = useState({
        date: new Date().toISOString().split('T')[0],
        location: 'Pune',
        selectedLocation: null,
        area: 'Koregaon Park',
        weather: 'Clear',
        dayType: 'weekday'
    })
    const [dailyLocationInput, setDailyLocationInput] = useState('Koregaon Park')
    
    const [hourlyForm, setHourlyForm] = useState({
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours() % 12 || 12,
        period: new Date().getHours() >= 12 ? 'PM' : 'AM',
        location: 'Pune',
        selectedLocation: null,
        area: 'Hinjewadi',
        trafficLevel: 'medium',
        weather: 'Clear'
    })
    const [hourlyLocationInput, setHourlyLocationInput] = useState('Hinjewadi')

    const [accidentForm, setAccidentForm] = useState({
        location: 'Shivajinagar, Pune',
        selectedLocation: null,
        hour: new Date().getHours(),
        weather: 'Clear',
        traffic_density: 'medium'
    })
    const [accidentLocationInput, setAccidentLocationInput] = useState('Shivajinagar, Pune')

    const [tripForm, setTripForm] = useState({
        pickupLocation: 'Pune',
        pickupLocationObj: null,
        dropLocation: 'Mumbai',
        dropLocationObj: null,
        start_hour: 9,
        day_of_week: 1,
        traffic_level: 'medium',
        pickupLat: 18.5204,
        pickupLon: 73.8567,
        dropLat: 19.0760,
        dropLon: 72.8777,
        distance_km: null,
        locationError: null
    })
    const [tripPickupInput, setTripPickupInput] = useState('Pune')
    const [tripDropInput, setTripDropInput] = useState('Mumbai')

    const [pricingForm, setPricingForm] = useState({
        pickupLocation: 'Pune',
        pickupLocationObj: null,
        dropLocation: 'Mumbai',
        dropLocationObj: null,
        time_of_day: 9,
        demand_level: 'medium',
        surge_multiplier: 1.0,
        pickupLat: 18.5204,
        pickupLon: 73.8567,
        dropLat: 19.0760,
        dropLon: 72.8777,
        distance_km: null,
        locationError: null
    })
    const [pricingPickupInput, setPricingPickupInput] = useState('Pune')
    const [pricingDropInput, setPricingDropInput] = useState('Mumbai')

    const [locationSuggestions, setLocationSuggestions] = useState({
        pickup: [],
        drop: [],
        daily: []
    })

    // Validate location in real-time
    const handleLocationValidation = async (location, formType, setForm) => {
        if (!location || location.length < 2) return

        const validation = await locationValidator.validateLocation(location)
        if (!validation.valid) {
            setForm(prev => ({
                ...prev,
                locationError: `Invalid location: ${location}. Please choose a real city.`
            }))
        } else {
            setForm(prev => ({
                ...prev,
                locationError: null
            }))
        }
    }

    const handleDailyPredict = async () => {
        setLoading(true)
        setResult(null)
        
        try {
            // VALIDATE LOCATION FIRST
            const validation = await locationValidator.validateLocation(dailyForm.location)
            if (!validation.valid) {
                setResult({
                    type: 'Error',
                    title: '❌ Invalid Location',
                    value: validation.error,
                    unit: '',
                    confidence: 0,
                    explanation: `"${dailyForm.location}" is not a real location. Please choose from major Indian cities like Mumbai, Delhi, Bangalore, Pune, Hyderabad, etc.`,
                    details: [
                        { label: 'Valid Cities', value: 'Mumbai, Delhi, Bangalore, Pune, Hyderabad, Kolkata, Chennai, Ahmedabad, Jaipur, Chandigarh' }
                    ]
                })
                setLoading(false)
                return
            }

            const lat = validation.lat
            const lon = validation.lon
            
            // Send location + weather to backend
            const response = await fetch('http://127.0.0.1:5000/predict_day_ml', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dailyForm.date,
                    latitude: lat,
                    longitude: lon,
                    weather: dailyForm.weather,
                    location_name: validation.name || dailyForm.location,
                    area: dailyForm.area
                })
            })
            
            const data = await response.json()
            const rideCount = Math.round(data.predicted_rides)
            const dateStr = new Date(dailyForm.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            
            // GET INTELLIGENT CONTEXT using RAG/LLM
            const context = await ragLLMService.getPredictionContext('daily', validation.name, 12, dailyForm.weather)
            const intelligentExplanation = ragLLMService.generateResponse(context, 'daily')
            
            setResult({
                type: 'Daily Demand Forecast',
                title: 'Number of Rides Expected',
                value: rideCount,
                unit: 'rides',
                confidence: data.confidence || 0.85,
                explanation: `On ${dateStr}, we predict around ${rideCount} bike rides in ${dailyForm.area}. ${rideCount > 3000 ? 'High demand expected!' : rideCount > 2000 ? 'Moderate demand.' : 'Lower demand day.'}\n\n📊 AI Analysis: ${intelligentExplanation}`,
                details: [
                    { label: 'Location', value: `${validation.name}, ${dailyForm.area}` },
                    { label: 'Weather', value: dailyForm.weather },
                    { label: 'Traffic Level', value: context.traffic_analysis?.level || 'Normal' },
                    { label: 'Safety Rating', value: `${100 - (context.location_insights?.accident_rate || 30)}% Safe` },
                    { label: 'Accuracy', value: `${((data.confidence || 0.85) * 100).toFixed(0)}% confident` }
                ],
                modelInfo: 'AI Demand Prediction with RAG/LLM Context Analysis',
                recommendations: context.recommendations,
                weatherImpact: data.weather_impact,
                weatherCondition: data.weather_condition,
                location: validation.name
            })
        } catch (error) {
            alert('Unable to get prediction. Please check your connection and try again.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleHourlyPredict = async () => {
        setLoading(true)
        setResult(null)
        
        try {
            // Convert AM/PM to 24-hour format
            let hour24 = hourlyForm.hour
            if (hourlyForm.period === 'PM' && hourlyForm.hour !== 12) {
                hour24 = hourlyForm.hour + 12
            } else if (hourlyForm.period === 'AM' && hourlyForm.hour === 12) {
                hour24 = 0
            }
            
            const response = await api.predictHour(hourlyForm.date, hour24)
            const timeStr = `${hourlyForm.hour}:00 ${hourlyForm.period}`
            const rideCount = Math.round(response.predicted_rides)
            const dateStr = new Date(hourlyForm.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            
            setResult({
                type: 'Hourly Demand Forecast',
                title: 'Rides Expected This Hour',
                value: rideCount,
                unit: 'rides',
                confidence: response.confidence || 0.82,
                explanation: `At ${timeStr} on ${dateStr}, expect around ${rideCount} rides in ${hourlyForm.area}. ${hour24 >= 8 && hour24 <= 10 || hour24 >= 17 && hour24 <= 19 ? 'This is a peak time!' : 'This is an off-peak hour.'}`,
                details: [
                    { label: 'Time Period', value: hour24 < 12 ? 'Morning' : hour24 < 17 ? 'Afternoon' : 'Evening' },
                    { label: 'Traffic', value: hourlyForm.trafficLevel.charAt(0).toUpperCase() + hourlyForm.trafficLevel.slice(1) + ' traffic' },
                    { label: 'Best for', value: hour24 >= 8 && hour24 <= 10 || hour24 >= 17 && hour24 <= 19 ? 'Commuters' : 'Leisure rides' }
                ],
                modelInfo: 'Hourly Demand Prediction AI'
            })
        } catch (error) {
            alert('Unable to get prediction. Please check your connection and try again.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAccidentPredict = async () => {
        setLoading(true)
        setResult(null)
        
        try {
            // Get coordinates for location
            let lat = 18.5204, lon = 73.8567
            try {
                const locations = await externalAPIs.searchLocation(accidentForm.location)
                if (locations && locations.length > 0) {
                    lat = locations[0].lat
                    lon = locations[0].lon
                }
            } catch (error) {
                console.warn('Location search failed for safety check')
            }
            
            // Use new location-aware safety endpoint
            const response = await fetch('http://127.0.0.1:5000/api/accident-risk-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: accidentForm.location,
                    latitude: lat,
                    longitude: lon,
                    hour: accidentForm.hour,
                    weather: accidentForm.weather,
                    traffic_level: accidentForm.traffic_density
                })
            })
            
            const data = await response.json()
            if (data.success) {
                const riskLevel = data.risk_level
                const riskColor = data.risk_color || 'gray'
                const advice = data.advice || 'Check conditions before riding.'
                
                setResult({
                    type: 'Safety Risk Assessment',
                    title: 'Accident Risk Level',
                    value: riskLevel,
                    unit: 'risk',
                    riskColor: riskColor,
                    confidence: data.confidence || 0.82,
                    explanation: `In ${accidentForm.location} at ${accidentForm.hour}:00, the risk is ${riskLevel.toLowerCase()}. ${advice}`,
                    details: [
                        { label: 'Risk Score', value: `${Math.round(data.risk_score)}/100` },
                        { label: 'Time of Day', value: `${accidentForm.hour}:00 (${accidentForm.hour < 12 ? 'Morning' : accidentForm.hour < 17 ? 'Afternoon' : 'Evening'})` },
                        { label: 'Weather', value: accidentForm.weather },
                        { label: 'Location Factor', value: data.factors?.location_accident_history ? `${data.factors.location_accident_history}% based on local accidents` : 'Normal' },
                        { label: 'Advice', value: advice }
                    ],
                    modelInfo: 'Location-Aware Safety Model (Real Accident Data)',
                    factors: data.factors
                })
            } else {
                alert('Unable to assess risk. Please try again.')
            }
        } catch (error) {
            alert('Unable to connect to safety system. Please check your connection.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleTripPredict = async () => {
        setLoading(true)
        setResult(null)
        
        try {
            // VALIDATE BOTH LOCATIONS
            const pickupValidation = await locationValidator.validateLocation(tripForm.pickupLocation)
            const dropValidation = await locationValidator.validateLocation(tripForm.dropLocation)

            if (!pickupValidation.valid) {
                setResult({
                    type: 'Error',
                    title: '❌ Invalid Pickup Location',
                    value: pickupValidation.error,
                    unit: '',
                    confidence: 0,
                    explanation: `"${tripForm.pickupLocation}" is not a valid location. Please select a real city.`
                })
                setLoading(false)
                return
            }

            if (!dropValidation.valid) {
                setResult({
                    type: 'Error',
                    title: '❌ Invalid Drop Location',
                    value: dropValidation.error,
                    unit: '',
                    confidence: 0,
                    explanation: `"${tripForm.dropLocation}" is not a valid location. Please select a real city.`
                })
                setLoading(false)
                return
            }

            const pickupLat = pickupValidation.lat
            const pickupLon = pickupValidation.lon
            const dropLat = dropValidation.lat
            const dropLon = dropValidation.lon

            // CALCULATE REAL DISTANCE between the two locations
            const distance = locationValidator.calculateDistance(pickupLat, pickupLon, dropLat, dropLon)
            
            // Call backend with real locations and distance
            const response = await fetch('http://127.0.0.1:5000/api/trip-duration-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    distance: distance,
                    distance_km: distance,
                    pickup_lat: pickupLat,
                    pickup_lon: pickupLon,
                    drop_lat: dropLat,
                    drop_lon: dropLon,
                    hour: tripForm.start_hour,
                    is_weekend: tripForm.day_of_week === 0 || tripForm.day_of_week === 6,
                    traffic_level: tripForm.traffic_level
                })
            })
            
            const data = await response.json()
            if (data.success) {
                const duration = data.duration_minutes
                const getDurationMessage = (mins) => {
                    if (mins < 15) return 'Quick trip!'
                    if (mins < 30) return 'Short journey.'
                    if (mins < 60) return 'Moderate ride.'
                    return 'Long journey ahead.'
                }
                
                // GET INTELLIGENT CONTEXT using RAG/LLM
                const context = await ragLLMService.getPredictionContext('duration', pickupValidation.name, tripForm.start_hour, 'Clear', distance)
                const intelligentAdvice = ragLLMService.generateResponse(context, 'duration')
                
                setResult({
                    type: 'Trip Duration & Cost Estimate',
                    title: 'Estimated Travel Time & Cost',
                    value: duration,
                    unit: 'minutes',
                    confidence: data.confidence || 0.83,
                    explanation: `Trip from ${pickupValidation.name} to ${dropValidation.name} (${distance.toFixed(1)} km) will take approximately ${duration} minutes. ${getDurationMessage(duration)}\n\n⚡ Smart Insight: ${intelligentAdvice}`,
                    details: [
                        { label: 'Pickup Location', value: pickupValidation.name },
                        { label: 'Drop Location', value: dropValidation.name },
                        { label: 'Distance', value: `${distance.toFixed(1)} km` },
                        { label: 'Travel Time', value: `${duration} minutes` },
                        { label: 'Average Speed', value: `${Math.round((distance / duration) * 60)} km/h` },
                        { label: 'Estimated Cost', value: `₹${Math.round(distance * 10 + (duration / 60) * 50)}` },
                        { label: 'Traffic Level', value: context.traffic_analysis?.level || 'Medium' },
                        { label: 'Safety Rating', value: `${100 - (context.location_insights?.accident_rate || 30)}% Safe` }
                    ],
                    modelInfo: 'Real Location-Based Trip Estimation with RAG/LLM Analysis',
                    recommendations: context.recommendations,
                    trafficLevel: data.traffic_level
                })
            } else {
                alert('Unable to calculate duration. Please try again.')
            }
        } catch (error) {
            alert('Unable to connect. Please check your connection.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handlePricingPredict = async () => {
        setLoading(true)
        setResult(null)
        
        try {
            // VALIDATE BOTH LOCATIONS
            const pickupValidation = await locationValidator.validateLocation(pricingForm.pickupLocation)
            const dropValidation = await locationValidator.validateLocation(pricingForm.dropLocation)

            if (!pickupValidation.valid) {
                setResult({
                    type: 'Error',
                    title: '❌ Invalid Pickup Location',
                    value: pickupValidation.error,
                    unit: '',
                    confidence: 0,
                    explanation: `"${pricingForm.pickupLocation}" is not a valid location. Please select a real city.`
                })
                setLoading(false)
                return
            }

            if (!dropValidation.valid) {
                setResult({
                    type: 'Error',
                    title: '❌ Invalid Drop Location',
                    value: dropValidation.error,
                    unit: '',
                    confidence: 0,
                    explanation: `"${pricingForm.dropLocation}" is not a valid location. Please select a real city.`
                })
                setLoading(false)
                return
            }

            const pickupLat = pickupValidation.lat
            const pickupLon = pickupValidation.lon
            const dropLat = dropValidation.lat
            const dropLon = dropValidation.lon

            // CALCULATE REAL DISTANCE between locations
            const distance = locationValidator.calculateDistance(pickupLat, pickupLon, dropLat, dropLon)

            const response = await fetch('http://127.0.0.1:5000/api/pricing-optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    distance: distance,
                    distance_km: distance,
                    hour: pricingForm.time_of_day,
                    pickup_location: pickupValidation.name,
                    drop_location: dropValidation.name,
                    demand_level: pricingForm.demand_level,
                    pickup_lat: pickupLat,
                    pickup_lon: pickupLon,
                    drop_lat: dropLat,
                    drop_lon: dropLon
                })
            })
            
            const data = await response.json()
            if (data.success || data.optimized_price) {
                const price = data.optimized_price || Math.round(distance * 15 * (pricingForm.surge_multiplier || 1))
                const surge = data.surge_multiplier || pricingForm.surge_multiplier || 1.0
                const getSurgeMessage = (s) => {
                    if (s > 1.5) return 'Peak demand! Prices are higher.'
                    if (s > 1.2) return 'Moderate demand period.'
                    return 'Normal rates apply.'
                }
                
                // GET INTELLIGENT CONTEXT using RAG/LLM
                const context = await ragLLMService.getPredictionContext('pricing', pickupValidation.name, pricingForm.time_of_day, 'Clear')
                const intelligentPricingAdvice = ragLLMService.generateResponse(context, 'pricing')
                
                setResult({
                    type: 'Smart Pricing',
                    title: 'Estimated Ride Cost',
                    value: `₹${price}`,
                    unit: '',
                    confidence: data.confidence || 0.85,
                    explanation: `For your trip from ${pickupValidation.name} to ${dropValidation.name} (${distance.toFixed(1)} km) at ${pricingForm.time_of_day}:00 hours, the estimated cost is ₹${price}. ${getSurgeMessage(surge)}\n\n💡 Recommendation: ${intelligentPricingAdvice}`,
                    details: [
                        { label: 'Pickup Location', value: pickupValidation.name },
                        { label: 'Drop Location', value: dropValidation.name },
                        { label: 'Distance', value: `${distance.toFixed(1)} km` },
                        { label: 'Base Fare', value: `₹${Math.round(price / surge)}` },
                        { label: 'Surge Multiplier', value: `${surge}x (${context.demand_analysis?.message})` },
                        { label: 'Per Kilometer', value: `₹${Math.round(price / distance)}/km` },
                        { label: 'Demand Level', value: context.demand_analysis?.message || 'Standard' }
                    ],
                    modelInfo: 'Smart Pricing with RAG/LLM Demand Analysis',
                    recommendations: context.recommendations
                })
            } else {
                alert('Unable to calculate price. Please try again.')
            }
        } catch (error) {
            alert('Unable to connect. Please check your connection.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'daily', name: 'Daily Rides', icon: Calendar, color: 'from-blue-500 to-cyan-500', description: 'Predict rides for the entire day' },
        { id: 'hourly', name: 'Hourly Rides', icon: Clock, color: 'from-purple-500 to-pink-500', description: 'Predict rides for a specific hour' },
        { id: 'accident', name: 'Safety Check', icon: AlertTriangle, color: 'from-orange-500 to-red-500', description: 'Check accident risk level' },
        { id: 'trip', name: 'Trip Time', icon: Car, color: 'from-green-500 to-emerald-500', description: 'Estimate travel duration' },
        { id: 'pricing', name: 'Price Check', icon: IndianRupee, color: 'from-emerald-500 to-teal-500', description: 'Calculate ride cost' }
    ]

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <PageWrapper showVehicles={true}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center md:text-left"
                >
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                        AI Predictions
                        </h1>
                        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">Get smart predictions powered by machine learning</p>
                        
                        {/* Weather Widget */}
                        {weatherData && weatherData.real && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 rounded-full"
                            >
                                <Cloud className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {weatherData.temp}°C • {weatherData.condition}
                                </span>
                                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Live</span>
                            </motion.div>
                        )}
                    </motion.div>

                {/* Tab Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl shadow-lg border border-border p-3 md:p-4"
                >
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeModel === tab.id
                            
                            return (
                                <motion.button
                                    key={tab.id}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        setActiveModel(tab.id)
                                        setResult(null)
                                    }}
                                    className={`
                                        relative p-3 md:p-4 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? 'bg-gradient-to-br ' + tab.color + ' text-white shadow-lg'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col items-center gap-1.5 md:gap-2">
                                        <Icon className={`w-5 h-5 md:w-6 md:h-6`} />
                                        <span className="text-xs md:text-sm font-semibold">
                                            {tab.name}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </motion.button>
                            )
                        })}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Input Form */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeModel}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-card rounded-2xl shadow-lg border border-border p-4 md:p-6"
                        >
                            <div className="flex items-center gap-2 mb-4 md:mb-6">
                                <Zap className="w-5 h-5 text-cyan-500" />
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {tabs.find(t => t.id === activeModel)?.description || 'Input Parameters'}
                                </h3>
                            </div>

                        {/* Daily Demand Form */}
                        {activeModel === 'daily' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Location/Area
                                    </label>
                                    <LocationSearch
                                        placeholder="Search your area (e.g., Koregaon Park)..."
                                        onLocationSelect={(location) => {
                                            setDailyForm({ ...dailyForm, selectedLocation: location, area: location.name })
                                            setDailyLocationInput(location.name)
                                        }}
                                        value={dailyLocationInput}
                                        onChange={setDailyLocationInput}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Select Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dailyForm.date}
                                        onChange={(e) => setDailyForm({ ...dailyForm, date: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Cloud className="w-4 h-4" /> Weather Condition
                                    </label>
                                    <select
                                        value={dailyForm.weather}
                                        onChange={(e) => setDailyForm({ ...dailyForm, weather: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                    >
                                        <option value="Clear">Clear/Sunny ☀️</option>
                                        <option value="Cloudy">Cloudy ☁️</option>
                                        <option value="Rain">Rainy 🌧️</option>
                                        <option value="Storm">Storm/Heavy Rain ⛈️</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleDailyPredict}
                                    disabled={loading || !dailyForm.selectedLocation}
                                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Predicting...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="w-5 h-5" />
                                            Get Prediction
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Hourly Demand Form */}
                        {activeModel === 'hourly' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Location/Area
                                    </label>
                                    <LocationSearch
                                        placeholder="Search your area (e.g., Hinjewadi Phase 2)..."
                                        onLocationSelect={(location) => {
                                            setHourlyForm({ ...hourlyForm, selectedLocation: location, area: location.name })
                                            setHourlyLocationInput(location.name)
                                        }}
                                        value={hourlyLocationInput}
                                        onChange={setHourlyLocationInput}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Select Date
                                    </label>
                                    <input
                                        type="date"
                                        value={hourlyForm.date}
                                        onChange={(e) => setHourlyForm({ ...hourlyForm, date: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Select Time
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={hourlyForm.hour}
                                            onChange={(e) => setHourlyForm({ ...hourlyForm, hour: parseInt(e.target.value) })}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        >
                                            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                                                <option key={h} value={h}>{h}:00</option>
                                            ))}
                                        </select>
                                        <select
                                            value={hourlyForm.period}
                                            onChange={(e) => setHourlyForm({ ...hourlyForm, period: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        >
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Car className="w-4 h-4" /> Traffic Level
                                    </label>
                                    <select
                                        value={hourlyForm.trafficLevel}
                                        onChange={(e) => setHourlyForm({ ...hourlyForm, trafficLevel: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    >
                                        <option value="low">Low (Free flowing) 🟢</option>
                                        <option value="medium">Medium (Moderate) 🟡</option>
                                        <option value="high">High (Congested) 🔴</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleHourlyPredict}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Predicting...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="w-5 h-5" />
                                            Get Prediction
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Accident Risk Form */}
                        {activeModel === 'accident' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Location
                                    </label>
                                    <LocationSearch
                                        placeholder="Search location (e.g., Shivajinagar)..."
                                        onLocationSelect={(location) => {
                                            setAccidentForm({ ...accidentForm, selectedLocation: location, location: location.name })
                                            setAccidentLocationInput(location.name)
                                        }}
                                        value={accidentLocationInput}
                                        onChange={setAccidentLocationInput}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Time (Hour)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={accidentForm.hour}
                                        onChange={(e) => setAccidentForm({ ...accidentForm, hour: parseInt(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Cloud className="w-4 h-4" /> Weather
                                    </label>
                                    <select
                                        value={accidentForm.weather}
                                        onChange={(e) => setAccidentForm({ ...accidentForm, weather: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                    >
                                        <option value="Clear">Clear ☀️</option>
                                        <option value="Rain">Rain 🌧️</option>
                                        <option value="Fog">Fog 🌫️</option>
                                        <option value="Clouds">Cloudy ☁️</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Car className="w-4 h-4" /> Traffic Level
                                    </label>
                                    <select
                                        value={accidentForm.traffic_density}
                                        onChange={(e) => setAccidentForm({ ...accidentForm, traffic_density: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                    >
                                        <option value="low">Low (Free flowing) 🟢</option>
                                        <option value="medium">Medium (Moderate) 🟡</option>
                                        <option value="high">High (Congested) 🔴</option>
                                        <option value="very_high">Very High (Jammed) ⛔</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAccidentPredict}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-5 h-5" />
                                            Check Safety
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Trip Duration Form */}
                        {activeModel === 'trip' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        📍 Pickup Location *
                                    </label>
                                    <LocationSearch
                                        placeholder="Search pickup location (e.g., Mumbai, Pune)..."
                                        onLocationSelect={(location) => {
                                            setTripForm({ ...tripForm, pickupLocationObj: location, pickupLocation: location.name, pickupLat: location.lat, pickupLon: location.lon })
                                            setTripPickupInput(location.name)
                                        }}
                                        value={tripPickupInput}
                                        onChange={setTripPickupInput}
                                    />
                                    {tripForm.locationError && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {tripForm.locationError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        🎯 Drop Location *
                                    </label>
                                    <LocationSearch
                                        placeholder="Search drop location (e.g., Mumbai, Pune)..."
                                        onLocationSelect={(location) => {
                                            setTripForm({ ...tripForm, dropLocationObj: location, dropLocation: location.name, dropLat: location.lat, dropLon: location.lon })
                                            setTripDropInput(location.name)
                                        }}
                                        value={tripDropInput}
                                        onChange={setTripDropInput}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Distance will be calculated automatically</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Start Time (Hour: 0-23)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={tripForm.start_hour}
                                        onChange={(e) => setTripForm({ ...tripForm, start_hour: parseInt(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Car className="w-4 h-4" /> Traffic Condition
                                    </label>
                                    <select
                                        value={tripForm.traffic_level}
                                        onChange={(e) => setTripForm({ ...tripForm, traffic_level: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                                    >
                                        <option value="low">Light Traffic 🟢</option>
                                        <option value="medium">Moderate Traffic 🟡</option>
                                        <option value="high">Heavy Traffic 🔴</option>
                                        <option value="very_high">Very Heavy Traffic 🔴🔴</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleTripPredict}
                                    disabled={loading || !tripForm.pickupLocationObj || !tripForm.dropLocationObj}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Calculating Distance & Time...
                                        </>
                                    ) : (
                                        <>
                                            <Car className="w-5 h-5" />
                                            Calculate Trip Duration
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400">* Only real Indian cities supported: Mumbai, Delhi, Bangalore, Pune, Hyderabad, Kolkata, Chennai, Ahmedabad, Jaipur, Chandigarh</p>
                            </div>
                        )}

                        {/* Dynamic Pricing Form */}
                        {activeModel === 'pricing' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        📍 Pickup Location *
                                    </label>
                                    <LocationSearch
                                        placeholder="Search pickup location (e.g., Mumbai, Pune)..."
                                        onLocationSelect={(location) => {
                                            setPricingForm({ ...pricingForm, pickupLocationObj: location, pickupLocation: location.name, pickupLat: location.lat, pickupLon: location.lon })
                                            setPricingPickupInput(location.name)
                                        }}
                                        value={pricingPickupInput}
                                        onChange={setPricingPickupInput}
                                    />
                                    {pricingForm.locationError && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {pricingForm.locationError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        🎯 Drop Location *
                                    </label>
                                    <LocationSearch
                                        placeholder="Search drop location (e.g., Mumbai, Pune)..."
                                        onLocationSelect={(location) => {
                                            setPricingForm({ ...pricingForm, dropLocationObj: location, dropLocation: location.name, dropLat: location.lat, dropLon: location.lon })
                                            setPricingDropInput(location.name)
                                        }}
                                        value={pricingDropInput}
                                        onChange={setPricingDropInput}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Distance will be calculated automatically</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Time of Day (Hour: 0-23)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={pricingForm.time_of_day}
                                        onChange={(e) => setPricingForm({ ...pricingForm, time_of_day: parseInt(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        📊 Demand Level
                                    </label>
                                    <select
                                        value={pricingForm.demand_level}
                                        onChange={(e) => setPricingForm({ ...pricingForm, demand_level: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                                    >
                                        <option value="low">Low Demand (Off-peak) 🟢</option>
                                        <option value="medium">Medium Demand 🟡</option>
                                        <option value="high">High Demand (Rush Hour) 🔴</option>
                                        <option value="peak">Peak Demand (Surge) 🔴🔴</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handlePricingPredict}
                                    disabled={loading || !pricingForm.pickupLocationObj || !pricingForm.dropLocationObj}
                                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Calculating Price...
                                        </>
                                    ) : (
                                        <>
                                            <IndianRupee className="w-5 h-5" />
                                            Calculate Ride Cost
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400">* Only real Indian cities supported: Mumbai, Delhi, Bangalore, Pune, Hyderabad, Kolkata, Chennai, Ahmedabad, Jaipur, Chandigarh</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Result Display */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl shadow-lg border border-border p-4 md:p-6"
                >
                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                        <Brain className="w-5 h-5 text-cyan-500" />
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                            Prediction Result
                        </h3>
                    </div>
                    
                    <AnimatePresence mode="wait">
                        {result ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-4"
                                >
                                    {/* Main Result Card */}
                                    <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 shadow-lg">
                                        <div className="flex items-start gap-4">
                                            <Brain className="w-10 h-10 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-1" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    {result.type}
                                                </p>
                                                <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                                    {result.value} {result.unit}
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {result.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    {result.details && result.details.length > 0 && (
                                        <div className="grid grid-cols-1 gap-3">
                                            {result.details.map((detail, idx) => (
                                                <div key={idx} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {detail.label}
                                                        </span>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {detail.value}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Confidence Bar */}
                                    {result.confidence && (
                                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    Confidence Level
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                    {(result.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${result.confidence * 100}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2.5 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Weather Impact */}
                                    {result.weatherImpact && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">Weather Impact</p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">{result.weatherCondition}</p>
                                                </div>
                                                <span className="text-lg font-bold text-blue-900 dark:text-blue-300">{result.weatherImpact}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Model Info */}
                                    <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-800 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <Brain className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-300 mb-1">
                                                    ✓ AI-Powered Prediction
                                                </p>
                                                <p className="text-xs text-cyan-700 dark:text-cyan-400">
                                                    {result.modelInfo || result.modelUsed || 'Based on trained ML models'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-64 md:h-80 text-center"
                                >
                                    <Brain className="w-16 h-16 md:w-20 md:h-20 text-gray-300 dark:text-gray-700 mb-4" />
                                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-xs">
                                        Fill out the form and click the button to see your AI prediction
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </PageWrapper>
        </div>
    )
}
