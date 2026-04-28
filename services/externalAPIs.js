// Real-time External API Service
import axios from 'axios'

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY
const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY

// Cache for API responses
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const getCachedData = (key) => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
    }
    cache.delete(key)
    return null
}

const setCachedData = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() })
}

export const externalAPIs = {
    // Get real weather data
    getWeather: async (lat, lon) => {
        const cacheKey = `weather_${lat}_${lon}`
        const cached = getCachedData(cacheKey)
        if (cached) return cached

        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`
            )
            const data = {
                temp: Math.round(response.data.main.temp),
                feelsLike: Math.round(response.data.main.feels_like),
                condition: response.data.weather[0].main,
                description: response.data.weather[0].description,
                humidity: response.data.main.humidity,
                windSpeed: response.data.wind.speed,
                icon: response.data.weather[0].icon,
                real: true
            }
            setCachedData(cacheKey, data)
            return data
        } catch (error) {
            console.error('Weather API error:', error)
            // Fallback demo data
            return {
                temp: 28,
                feelsLike: 30,
                condition: 'Clear',
                description: 'clear sky',
                humidity: 60,
                windSpeed: 3.5,
                real: false
            }
        }
    },

    // Get real traffic data
    getTraffic: async (lat, lon, radius = 5000) => {
        const cacheKey = `traffic_${lat}_${lon}`
        const cached = getCachedData(cacheKey)
        if (cached) return cached

        try {
            const response = await axios.get(
                `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${TOMTOM_KEY}`
            )
            
            const currentSpeed = response.data.flowSegmentData.currentSpeed
            const freeFlowSpeed = response.data.flowSegmentData.freeFlowSpeed
            const congestion = ((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100

            let level = 'low'
            if (congestion > 60) level = 'high'
            else if (congestion > 30) level = 'medium'

            const data = {
                currentSpeed,
                freeFlowSpeed,
                congestion: Math.round(congestion),
                level,
                confidence: response.data.flowSegmentData.confidence,
                real: true
            }
            setCachedData(cacheKey, data)
            return data
        } catch (error) {
            console.error('Traffic API error:', error)
            // Fallback demo data
            return {
                currentSpeed: 45,
                freeFlowSpeed: 60,
                congestion: 25,
                level: 'medium',
                real: false
            }
        }
    },

    // Search locations with autocomplete
    searchLocation: async (query) => {
        if (!query || query.length < 3) return []

        const cacheKey = `location_${query}`
        const cached = getCachedData(cacheKey)
        if (cached) return cached

        try {
            const response = await axios.get(
                `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(query)}&format=json&limit=5`
            )
            const data = response.data.map(item => ({
                name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                type: item.type,
                address: item.display_name.split(',').slice(0, 2).join(','),
                real: true
            }))
            setCachedData(cacheKey, data)
            return data
        } catch (error) {
            console.error('Location search error:', error)
            // Fallback demo locations
            return [
                { name: 'Koregaon Park, Pune', lat: 18.5362, lon: 73.8958, address: 'Koregaon Park', real: false },
                { name: 'Hinjewadi, Pune', lat: 18.5912, lon: 73.7394, address: 'Hinjewadi IT Park', real: false },
                { name: 'Pune Station', lat: 18.5284, lon: 73.8742, address: 'Railway Station', real: false }
            ]
        }
    },

    // Get route information
    getRoute: async (startLat, startLon, endLat, endLon) => {
        const cacheKey = `route_${startLat}_${startLon}_${endLat}_${endLon}`
        const cached = getCachedData(cacheKey)
        if (cached) return cached

        try {
            const response = await axios.get(
                `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json?key=${TOMTOM_KEY}&traffic=true`
            )
            
            const route = response.data.routes[0]
            const data = {
                distance: route.summary.lengthInMeters / 1000, // km
                duration: route.summary.travelTimeInSeconds / 60, // minutes
                trafficDelay: route.summary.trafficDelayInSeconds / 60, // minutes
                arrivalTime: new Date(route.summary.arrivalTime),
                real: true
            }
            setCachedData(cacheKey, data)
            return data
        } catch (error) {
            console.error('Route API error:', error)
            // Calculate approximate distance
            const R = 6371 // Earth radius in km
            const dLat = (endLat - startLat) * Math.PI / 180
            const dLon = (endLon - startLon) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
                     Math.sin(dLon/2) * Math.sin(dLon/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            const distance = R * c

            return {
                distance: distance.toFixed(2),
                duration: Math.round(distance * 3), // Rough estimate: 20km/h avg
                trafficDelay: 5,
                real: false
            }
        }
    },

    // Get air quality data (bonus free API)
    getAirQuality: async (lat, lon) => {
        const cacheKey = `air_${lat}_${lon}`
        const cached = getCachedData(cacheKey)
        if (cached) return cached

        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}`
            )
            
            const aqi = response.data.list[0].main.aqi
            const components = response.data.list[0].components

            const data = {
                aqi, // 1-5 scale
                quality: ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi - 1],
                pm25: components.pm2_5,
                pm10: components.pm10,
                real: true
            }
            setCachedData(cacheKey, data)
            return data
        } catch (error) {
            console.error('Air quality API error:', error)
            return {
                aqi: 2,
                quality: 'Fair',
                pm25: 35,
                pm10: 45,
                real: false
            }
        }
    }
}

// Clear old cache entries every 10 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key)
        }
    }
}, 10 * 60 * 1000)
