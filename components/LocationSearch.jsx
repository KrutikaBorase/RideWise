import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, X, Loader2, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

const LocationSearch = ({ onLocationSelect, placeholder = "Search location...", value = '', onChange = () => {} }) => {
    const { theme } = useTheme()
    const [query, setQuery] = useState(value || '')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [recentLocations, setRecentLocations] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('recentLocations') || '[]')
        } catch {
            return []
        }
    })
    const searchRef = useRef(null)
    const inputRef = useRef(null)
    const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY

    // All India locations database
    const puneLocations = [
        // Mumbai
        { name: 'Gateway of India, Mumbai', city: 'Mumbai', lat: 18.9220, lon: 72.8347, type: 'landmark', address: 'Gateway of India, South Mumbai' },
        { name: 'Bandra-Worli Sea Link, Mumbai', city: 'Mumbai', lat: 19.0176, lon: 72.8298, type: 'landmark', address: 'Sea Link, Central Mumbai' },
        { name: 'Colaba, Mumbai', city: 'Mumbai', lat: 18.9676, lon: 72.8194, type: 'commercial', address: 'Colaba, South Mumbai' },
        { name: 'BKC, Mumbai', city: 'Mumbai', lat: 19.0760, lon: 72.8670, type: 'business', address: 'Bandra Kurla Complex, Mumbai' },
        // Delhi
        { name: 'India Gate, Delhi', city: 'Delhi', lat: 28.6129, lon: 77.2295, type: 'landmark', address: 'India Gate, New Delhi' },
        { name: 'Red Fort, Delhi', city: 'Delhi', lat: 28.6562, lon: 77.2410, type: 'landmark', address: 'Red Fort, Old Delhi' },
        { name: 'Connaught Place, Delhi', city: 'Delhi', lat: 28.6328, lon: 77.1896, type: 'commercial', address: 'Connaught Place, Central Delhi' },
        { name: 'Cyber City, Gurgaon', city: 'Gurgaon', lat: 28.4595, lon: 77.1019, type: 'business', address: 'Cyber City, Gurgaon' },
        // Bangalore
        { name: 'Vidhana Soudha, Bangalore', city: 'Bangalore', lat: 13.1939, lon: 77.5941, type: 'landmark', address: 'Vidhana Soudha, Bangalore' },
        { name: 'Indiranagar, Bangalore', city: 'Bangalore', lat: 13.3347, lon: 77.6447, type: 'residential', address: 'Indiranagar, East Bangalore' },
        { name: 'Koramangala, Bangalore', city: 'Bangalore', lat: 12.9352, lon: 77.6245, type: 'commercial', address: 'Koramangala, South Bangalore' },
        { name: 'Whitefield, Bangalore', city: 'Bangalore', lat: 13.3675, lon: 77.7597, type: 'business', address: 'Whitefield, East Bangalore' },
        // Hyderabad
        { name: 'Charminar, Hyderabad', city: 'Hyderabad', lat: 17.3629, lon: 78.4785, type: 'landmark', address: 'Charminar, Old Hyderabad' },
        { name: 'Hitech City, Hyderabad', city: 'Hyderabad', lat: 17.4435, lon: 78.4435, type: 'business', address: 'HITEC City, Cyberabad' },
        { name: 'Jubilee Hills, Hyderabad', city: 'Hyderabad', lat: 17.3850, lon: 78.4867, type: 'residential', address: 'Jubilee Hills, Hyderabad' },
        { name: 'Banjara Hills, Hyderabad', city: 'Hyderabad', lat: 17.3732, lon: 78.4524, type: 'residential', address: 'Banjara Hills, Hyderabad' },
        // Kolkata
        { name: 'Victoria Memorial, Kolkata', city: 'Kolkata', lat: 22.5448, lon: 88.3426, type: 'landmark', address: 'Victoria Memorial, Kolkata' },
        { name: 'Park Street, Kolkata', city: 'Kolkata', lat: 22.5516, lon: 88.3668, type: 'commercial', address: 'Park Street, Kolkata' },
        { name: 'Rajarhat, Kolkata', city: 'Kolkata', lat: 22.5726, lon: 88.4689, type: 'residential', address: 'Rajarhat, East Kolkata' },
        { name: 'Salt Lake, Kolkata', city: 'Kolkata', lat: 22.5987, lon: 88.3976, type: 'residential', address: 'Salt Lake City, Kolkata' },
        // Chennai
        { name: 'Marina Beach, Chennai', city: 'Chennai', lat: 13.0499, lon: 80.2824, type: 'landmark', address: 'Marina Beach, Chennai' },
        { name: 'T. Nagar, Chennai', city: 'Chennai', lat: 13.0330, lon: 80.2413, type: 'commercial', address: 'T. Nagar, Chennai' },
        { name: 'OMR, Chennai', city: 'Chennai', lat: 12.8567, lon: 80.2419, type: 'business', address: 'Old Mahabalipuram Road, Chennai' },
        { name: 'Anna Salai, Chennai', city: 'Chennai', lat: 13.0426, lon: 80.2519, type: 'commercial', address: 'Anna Salai, Chennai' },
        // Pune
        { name: 'Hinjewadi IT Park, Pune', city: 'Pune', lat: 18.5912, lon: 73.7389, type: 'landmark', address: 'Hinjewadi, Pune' },
        { name: 'Koregaon Park, Pune', city: 'Pune', lat: 18.5362, lon: 73.8961, type: 'residential', address: 'Koregaon Park, Pune' },
        { name: 'Viman Nagar, Pune', city: 'Pune', lat: 18.5679, lon: 73.9143, type: 'residential', address: 'Viman Nagar, Pune' },
        { name: 'Baner, Pune', city: 'Pune', lat: 18.5590, lon: 73.7814, type: 'residential', address: 'Baner, Pune' },
        // Jaipur
        { name: 'City Palace, Jaipur', city: 'Jaipur', lat: 26.9245, lon: 75.8231, type: 'landmark', address: 'City Palace, Jaipur' },
        { name: 'Hawa Mahal, Jaipur', city: 'Jaipur', lat: 26.9243, lon: 75.8267, type: 'landmark', address: 'Hawa Mahal, Jaipur' },
        { name: 'Bani Park, Jaipur', city: 'Jaipur', lat: 26.9267, lon: 75.8094, type: 'residential', address: 'Bani Park, Jaipur' },
        // Ahmedabad
        { name: 'Sabarmati Ashram, Ahmedabad', city: 'Ahmedabad', lat: 23.1815, lon: 72.5953, type: 'landmark', address: 'Sabarmati Ashram, Ahmedabad' },
        { name: 'Law Garden, Ahmedabad', city: 'Ahmedabad', lat: 23.1835, lon: 72.5890, type: 'commercial', address: 'Law Garden, Ahmedabad' },
        { name: 'Vastrapur, Ahmedabad', city: 'Ahmedabad', lat: 23.0225, lon: 72.5714, type: 'residential', address: 'Vastrapur, Ahmedabad' },
        // Kochi
        { name: 'Fort Kochi, Kochi', city: 'Kochi', lat: 9.9673, lon: 76.2433, type: 'landmark', address: 'Fort Kochi, Kochi' },
        { name: 'Mattancherry, Kochi', city: 'Kochi', lat: 9.9776, lon: 76.2581, type: 'commercial', address: 'Mattancherry, Kochi' },
        { name: 'Kakkanad, Kochi', city: 'Kochi', lat: 10.0353, lon: 76.2936, type: 'business', address: 'IT Park, Kakkanad, Kochi' },
        // Lucknow
        { name: 'Bara Imambara, Lucknow', city: 'Lucknow', lat: 26.2389, lon: 80.9263, type: 'landmark', address: 'Bara Imambara, Lucknow' },
        { name: 'Hazratganj, Lucknow', city: 'Lucknow', lat: 26.8467, lon: 80.9462, type: 'commercial', address: 'Hazratganj, Lucknow' },
        // Chandigarh
        { name: 'Rock Garden, Chandigarh', city: 'Chandigarh', lat: 30.7549, lon: 76.7920, type: 'landmark', address: 'Rock Garden, Chandigarh' },
        { name: 'Sector 17, Chandigarh', city: 'Chandigarh', lat: 30.7406, lon: 76.7865, type: 'commercial', address: 'Sector 17, Chandigarh' },
    ]

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Search for locations
    const searchLocations = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([])
            return
        }

        setLoading(true)
        try {
            // First search in Pune locations
            const puneResults = puneLocations.filter(loc =>
                loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                loc.address.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5)

            if (puneResults.length > 0) {
                setResults(puneResults)
                setShowResults(true)
                setLoading(false)
                return
            }

            // If no Pune results, try API
            if (LOCATIONIQ_KEY) {
                const response = await fetch(
                    `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(searchQuery)}&format=json&limit=5`
                )
                
                if (response.ok) {
                    const data = await response.json()
                    setResults(data.map(item => ({
                        name: item.display_name.split(',')[0],
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                        type: item.type,
                        address: item.display_name.split(',').slice(0, 2).join(',')
                    })))
                    setShowResults(true)
                }
            } else {
                setResults(puneResults)
                setShowResults(true)
            }
        } catch (error) {
            console.error('Location search error:', error)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchLocations(query)
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (location) => {
        setQuery(location.address)
        setShowResults(false)
        onLocationSelect(location)
    }

    const handleClear = () => {
        setQuery('')
        setResults([])
        setShowResults(false)
    }

    return (
        <div ref={searchRef} className="relative w-full">
            <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        onChange(e.target.value)
                        searchLocations(e.target.value)
                    }}
                    placeholder={placeholder}
                    className={`w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all border ${
                        theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    onFocus={() => query.length >= 3 && setShowResults(true)}
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 animate-spin" />
                )}
                {query && !loading && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showResults && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto"
                    >
                        {results.map((location, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelect(location)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-start gap-3 border-b border-gray-700 last:border-b-0"
                            >
                                <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium truncate">{location.address}</div>
                                    <div className="text-gray-400 text-sm truncate">{location.name}</div>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default LocationSearch
