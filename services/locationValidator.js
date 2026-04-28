// Location Validator Service
// Validates and finds EXACT coordinates using LocationIQ API

const VALID_LOCATIONS_CACHE = new Map()

const MAJOR_INDIAN_CITIES = [
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025, state: 'Delhi' },
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
    { name: 'Pune', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, state: 'Telangana' },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
    { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
    { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, state: 'Chandigarh' }
]

export const locationValidator = {
    // Check if location string matches real location database using LocationIQ API
    async validateLocation(locationString) {
        if (!locationString || typeof locationString !== 'string') {
            return { valid: false, error: 'Invalid location' }
        }

        const cleaned = locationString.trim()

        // Check cache first
        if (VALID_LOCATIONS_CACHE.has(cleaned)) {
            return VALID_LOCATIONS_CACHE.get(cleaned)
        }

        // Try LocationIQ API FIRST (for exact location search)
        try {
            const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY
            if (!LOCATIONIQ_KEY) {
                console.warn('LocationIQ API key not configured, using fallback')
                // Fallback to major cities
                return this.fallbackMajorCitiesSearch(cleaned)
            }

            // Call LocationIQ API to get EXACT coordinates
            const response = await fetch(
                `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(cleaned)}&format=json&limit=1&countrycodes=in`
            )

            if (!response.ok) {
                return { valid: false, error: 'Location not found in India' }
            }

            const data = await response.json()
            if (!data || data.length === 0) {
                return { valid: false, error: 'Location not found' }
            }

            const location = data[0]
            const result = {
                valid: true,
                name: location.display_name.split(',')[0].trim(),
                fullName: location.display_name,
                lat: parseFloat(location.lat),
                lon: parseFloat(location.lon),
                source: 'locationiq',
                type: location.type
            }

            VALID_LOCATIONS_CACHE.set(cleaned, result)
            console.log(`✅ LocationIQ found: ${result.name} at (${result.lat}, ${result.lon})`)
            return result
        } catch (error) {
            console.error('LocationIQ API error:', error)
            // Fallback to major cities
            return this.fallbackMajorCitiesSearch(cleaned)
        }
    },

    // Fallback: Check against major Indian cities
    fallbackMajorCitiesSearch(cleaned) {
        for (const city of MAJOR_INDIAN_CITIES) {
            if (cleaned.toLowerCase().includes(city.name.toLowerCase())) {
                const result = {
                    valid: true,
                    name: city.name,
                    lat: city.lat,
                    lon: city.lon,
                    state: city.state,
                    source: 'major_city_fallback'
                }
                VALID_LOCATIONS_CACHE.set(cleaned, result)
                return result
            }
        }

        return { valid: false, error: 'Location not found in India' }
    },

    // Get autocomplete suggestions from LocationIQ
    async getLocationSuggestions(query) {
        if (!query || query.length < 2) return []

        const suggestions = []

        // Try LocationIQ API for suggestions
        try {
            const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY
            if (LOCATIONIQ_KEY) {
                const response = await fetch(
                    `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(query)}&format=json&limit=10&countrycodes=in`
                )

                if (response.ok) {
                    const data = await response.json()
                    for (const item of data) {
                        suggestions.push({
                            name: item.display_name.split(',')[0],
                            fullName: item.display_name,
                            lat: parseFloat(item.lat),
                            lon: parseFloat(item.lon),
                            type: item.type,
                            source: 'locationiq'
                        })
                    }
                }
            }
        } catch (error) {
            console.error('LocationIQ suggestion error:', error)
        }

        // Add major cities that match
        for (const city of MAJOR_INDIAN_CITIES) {
            if (city.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.unshift({
                    name: city.name,
                    lat: city.lat,
                    lon: city.lon,
                    state: city.state,
                    type: 'city',
                    source: 'major_city'
                })
            }
        }

        return suggestions.slice(0, 10)
    },

    // Calculate REAL distance between two locations using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) {
            console.warn('Invalid coordinates for distance calculation')
            return 0
        }

        const R = 6371 // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        console.log(`📍 Distance calculated: ${distance.toFixed(2)} km from (${lat1}, ${lon1}) to (${lat2}, ${lon2})`)
        return Math.round(distance * 100) / 100 // Round to 2 decimals
    },

    // Get major Indian cities (for dropdown)
    getMajorCities() {
        return MAJOR_INDIAN_CITIES.map(city => ({
            name: city.name,
            value: city.name,
            lat: city.lat,
            lon: city.lon
        }))
    }
}

// Export validateLocation individually
export const validateLocation = locationValidator.validateLocation.bind(locationValidator)
export const calculateDistance = locationValidator.calculateDistance.bind(locationValidator)
