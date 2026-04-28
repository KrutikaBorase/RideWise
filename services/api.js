import axios from 'axios'

// Auto-detect backend URL based on current host
const getApiBaseUrl = () => {
    const hostname = window.location.hostname
    // If accessing via network IP, use that IP for backend too
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:5000`
    }
    return 'http://localhost:5000'
}

const API_BASE_URL = getApiBaseUrl()

// Real Weather API (Open-Meteo)
export const getCoordinates = async (city) => {
    try {
        const response = await axios.get(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
        )
        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0]
        }
        return null
    } catch (error) {
        console.error('Geocoding error:', error)
        return null
    }
}

// API Service for RideWise Backend
export const api = {
    // Helper to get auth token
    getAuthHeaders: () => {
        const user = JSON.parse(localStorage.getItem('ridewise_user') || '{}')
        if (!user.token) {
            console.error('No auth token found')
            window.location.href = '/login'
            throw new Error('Authentication required')
        }
        return {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
        }
    },

    // REAL DATA: Get Ghost Rider profile from Uber Dataset
    getGhostProfile: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/ghost_profile`)
            return response.data
        } catch (error) {
            console.error('Error fetching ghost profile:', error)
            // Fallback for demo
            return {
                source: "Simulated",
                ghost_riders: [
                    { start_location: "Pune Station", miles: 4.2, ghost_rank: "Pro", real_duration_mins: 15 }
                ]
            }
        }
    },

    // REAL DATA: Get Safety stats from Accidents Dataset
    getSafetyData: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/safety_data`)
            return response.data
        } catch (error) {
            console.error('Error fetching safety data:', error)
            return null
        }
    },

    // Predict daily ride demand
    predictDay: async (date) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/predict_day`, {
                date: date // Format: "YYYY-MM-DD"
            })
            return response.data
        } catch (error) {
            console.error('Error predicting daily demand:', error)
            throw error
        }
    },

    // Predict hourly ride demand
    predictHour: async (date, hour) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/predict_hour`, {
                date: date, // Format: "YYYY-MM-DD"
                hour: hour  // 0-23
            })
            return response.data
        } catch (error) {
            console.error('Error predicting hourly demand:', error)
            throw error
        }
    },

    // Unified ride demand prediction
    predictRideDemand: async (params) => {
        try {
            const { date, hour, weather, traffic } = params
            const endpoint = hour !== undefined ? '/predict_hour' : '/predict_day'
            const payload = hour !== undefined 
                ? { date, hour, weather, traffic }
                : { date, weather, traffic }
            
            const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload)
            return response.data
        } catch (error) {
            console.error('Error predicting ride demand:', error)
            return { rides: 'N/A', confidence: 0 }
        }
    },

    // Get multiple predictions for chart
    getPredictions: async (startDate, days = 7) => {
        try {
            const predictions = []
            const date = new Date(startDate)

            for (let i = 0; i < days; i++) {
                const dateStr = date.toISOString().split('T')[0]
                const result = await api.predictDay(dateStr)
                predictions.push({
                    date: dateStr,
                    predicted_rides: result.predicted_rides
                })
                date.setDate(date.getDate() + 1)
            }

            return predictions
        } catch (error) {
            console.error('Error getting predictions:', error)
            throw error
        }
    },

    // Dynamic Pricing
    getDynamicPricing: async (date, hour) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/pricing/dynamic`, {
                date: date,
                hour: hour
            })
            return response.data
        } catch (error) {
            console.error('Error getting dynamic pricing:', error)
            throw error
        }
    },

    // Get hourly predictions for a specific day
    // REAL DATA: Get Fleet Optimization
    optimizeFleet: async (hour, city) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/fleet/optimize`, {
                current_hour: hour,
                city: city,
                num_drivers: 100
            })
            return response.data
        } catch (error) {
            console.error('Error optimizing fleet:', error)
            throw error
        }
    },

    // REAL DATA: Get Safety stats (Enhanced)
    getSafetyData: async (state = 'Maharashtra', hour = 12) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/safety/score`, {
                state: state,
                hour: hour
            })
            return response.data
        } catch (error) {
            console.error('Error fetching safety data:', error)
            // Fallback
            return { score: 75, risk_level: 'Medium', details: 'Offline Estimate' }
        }
    },

    getHourlyPredictions: async (date) => {
        try {
            const predictions = []

            for (let hour = 0; hour < 24; hour++) {
                const result = await api.predictHour(date, hour)
                predictions.push({
                    hour: hour,
                    predicted_rides: result.predicted_rides
                })
            }

            return predictions
        } catch (error) {
            console.error('Error getting hourly predictions:', error)
            throw error
        }
    }
}

export const getWeatherData = async (city = 'Pune') => {
    try {
        // 1. Get Coordinates
        let lat = 18.5912
        let lng = 73.7389
        let locationName = city

        if (city !== 'Pune') {
            const coords = await getCoordinates(city)
            if (coords) {
                lat = coords.latitude
                lng = coords.longitude
                locationName = coords.name
            }
        }

        // 2. Get Weather
        const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`
        )

        const current = response.data.current

        // Map WMO weather codes
        const getWeatherCondition = (code) => {
            if (code === 0) return 'Clear Sky'
            if (code >= 1 && code <= 3) return 'Partly Cloudy'
            if (code >= 51 && code <= 67) return 'Rain'
            if (code >= 71 && code <= 77) return 'Snow'
            if (code >= 95) return 'Thunderstorm'
            return 'Moderate'
        }

        const condition = getWeatherCondition(current.weather_code)

        // Dynamic Alerts
        const alerts = []
        if (current.precipitation > 0) {
            alerts.push({ location: locationName, condition: 'Rain detected', severity: 'medium', time: 'Now' })
        } else if (current.wind_speed_10m > 20) {
            alerts.push({ location: locationName, condition: 'High Winds', severity: 'low', time: 'Now' })
        } else if (current.temperature_2m > 35) {
            alerts.push({ location: locationName, condition: 'Extreme Heat', severity: 'high', time: 'Now' })
        } else {
            alerts.push({ location: locationName, condition: 'Good Weather', severity: 'low', time: 'Now' })
        }

        return {
            current: {
                temp: current.temperature_2m,
                condition: condition,
                humidity: current.relative_humidity_2m,
                windSpeed: current.wind_speed_10m,
                location: locationName
            },
            alerts: alerts
        }
    } catch (error) {
        console.error('Weather API error:', error)
        return null
    }
}

// New API methods for enhanced features
export const apiExtended = {
    // Ride Management
    rateRide: async (rideId, rating, feedback) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/rides/${rideId}/rate`,
                { rating, feedback },
                { headers: api.getAuthHeaders() }
            )
            return response.data
        } catch (error) {
            console.error('Error rating ride:', error)
            throw error
        }
    },

    cancelRide: async (rideId, reason) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/rides/${rideId}/cancel`,
                { reason },
                { headers: api.getAuthHeaders() }
            )
            return response.data
        } catch (error) {
            console.error('Error cancelling ride:', error)
            throw error
        }
    },

    updateRideStatus: async (rideId, status) => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/rides/${rideId}/status`,
                { status },
                { headers: api.getAuthHeaders() }
            )
            return response.data
        } catch (error) {
            console.error('Error updating ride status:', error)
            throw error
        }
    },

    // Notifications
    getNotifications: async (unreadOnly = false, limit = 20) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/notifications?unread_only=${unreadOnly}&limit=${limit}`,
                { headers: api.getAuthHeaders() }
            )
            return response.data.notifications
        } catch (error) {
            console.error('Error fetching notifications:', error)
            return []
        }
    },

    markNotificationRead: async (notificationId) => {
        try {
            await axios.post(
                `${API_BASE_URL}/api/notifications/${notificationId}/read`,
                {},
                { headers: api.getAuthHeaders() }
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    },

    markAllNotificationsRead: async () => {
        try {
            await axios.post(
                `${API_BASE_URL}/api/notifications/read-all`,
                {},
                { headers: api.getAuthHeaders() }
            )
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    },

    // Profile Management
    getProfile: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/profile`,
                { headers: api.getAuthHeaders() }
            )
            return response.data
        } catch (error) {
            console.error('Error fetching profile:', error)
            throw error
        }
    },

    updateProfile: async (name, phone, profile_photo) => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/profile`,
                { name, phone, profile_photo },
                { headers: api.getAuthHeaders() }
            )
            return response.data
        } catch (error) {
            console.error('Error updating profile:', error)
            if (error.response?.status === 401) {
                localStorage.removeItem('ridewise_user')
                window.location.href = '/login'
            }
            throw error
        }
    },

    // Analytics
    getRiderAnalytics: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/analytics`,
                { headers: api.getAuthHeaders() }
            )
            return response.data
        } catch (error) {
            console.error('Error fetching analytics:', error)
            throw error
        }
    },

    // Get locations (Pune areas with zones)
    getLocations: async (zone = null, category = null) => {
        try {
            let url = `${API_BASE_URL}/api/locations`
            const params = new URLSearchParams()
            
            if (zone) params.append('zone', zone)
            if (category) params.append('category', category)
            
            const queryString = params.toString()
            if (queryString) url += `?${queryString}`
            
            const response = await axios.get(url)
            return response.data
        } catch (error) {
            console.error('Error fetching locations:', error)
            // Fallback to default Pune locations
            return {
                city: "Pune",
                state: "Maharashtra",
                total: 15,
                locations: [
                    'Koregaon Park', 'Viman Nagar', 'Hinjewadi', 'Kharadi', 'Baner',
                    'Aundh', 'Wakad', 'Magarpatta', 'Hadapsar', 'Shivajinagar',
                    'Deccan', 'Kothrud', 'Pimpri-Chinchwad', 'Camp', 'Kalyani Nagar'
                ]
            }
        }
    },

    // NEW: Predict accident risk (Model 3)
    predictAccidentRisk: async (hour, location = 'Pune', weather = 'Clear') => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/safety/predict-risk`, {
                hour: hour,
                location: location,
                weather: weather
            })
            return response.data
        } catch (error) {
            console.error('Error predicting accident risk:', error)
            return {
                risk_level: 'Medium',
                risk_score: 50,
                source: 'Error Fallback'
            }
        }
    },

    // NEW: Predict trip duration (Model 4)
    predictTripDuration: async (distance, startLocation, endLocation, hour = null) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/trips/predict-duration`, {
                distance: distance,
                start_location: startLocation,
                end_location: endLocation,
                hour: hour || new Date().getHours()
            })
            return response.data
        } catch (error) {
            console.error('Error predicting trip duration:', error)
            return {
                estimated_minutes: 20,
                source: 'Error Fallback'
            }
        }
    },

    // NEW: Optimize dynamic pricing (Model 5)
    optimizePricing: async (distance, pickup, destination, demandLevel = 'medium') => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/pricing/optimize`, {
                distance: distance,
                pickup_location: pickup,
                destination: destination,
                demand_level: demandLevel,
                hour: new Date().getHours()
            })
            return response.data
        } catch (error) {
            console.error('Error optimizing pricing:', error)
            return {
                base_price: distance * 12,
                final_price: distance * 14,
                source: 'Error Fallback'
            }
        }
    }
}
