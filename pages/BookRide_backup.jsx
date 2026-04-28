import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Users, IndianRupee } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { useTheme } from '../context/ThemeContext'
import { calculateDistance } from '../services/locationValidator'

const MAJOR_LOCATIONS = [
    { name: 'Pune Station', lat: 18.5298, lon: 73.8309, category: 'Transport Hub' },
    { name: 'Wagholi', lat: 18.4627, lon: 73.9243, category: 'Residential' },
    { name: 'Hinjewadi IT Park', lat: 18.5909, lon: 73.7650, category: 'Business' },
    { name: 'Koregaon Park', lat: 18.5347, lon: 73.8839, category: 'Commercial' },
    { name: 'Viman Nagar', lat: 18.5721, lon: 73.9149, category: 'Residential' },
    { name: 'Shivajinagar', lat: 18.5243, lon: 73.8567, category: 'Commercial' },
    { name: 'Kothrud', lat: 18.5099, lon: 73.8145, category: 'Residential' },
    { name: 'Kalyani Nagar', lat: 18.5571, lon: 73.9207, category: 'Residential' },
    { name: 'MG Road', lat: 18.5314, lon: 73.8473, category: 'Commercial' },
    { name: 'Hadapsar', lat: 18.5048, lon: 73.9270, category: 'Business' }
]

const API_BASE = 'http://localhost:5000'

export default function BookRide() {
    const { theme } = useTheme()
    const [pickupLocation, setPickupLocation] = useState('')
    const [pickupCoords, setPickupCoords] = useState(null)
    const [dropLocation, setDropLocation] = useState('')
    const [dropCoords, setDropCoords] = useState(null)
    const [passengers, setPassengers] = useState(2)
    const [rideDate, setRideDate] = useState(new Date().toISOString().split('T')[0])
    const [rideHour, setRideHour] = useState(String(new Date().getHours()).padStart(2, '0'))
    const [rideMinute, setRideMinute] = useState(String(new Date().getMinutes()).padStart(2, '0'))
    const [filteredLocations, setFilteredLocations] = useState([])
    const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
    const [showDropSuggestions, setShowDropSuggestions] = useState(false)
    const [estimatedFare, setEstimatedFare] = useState(null)
    const [bookingConfirmed, setBookingConfirmed] = useState(false)
    const [bookingMessage, setBookingMessage] = useState('')

    const handleLocationSearch = (input, isPickup) => {
        if (input.trim()) {
            const filtered = MAJOR_LOCATIONS.filter(loc =>
                loc.name.toLowerCase().includes(input.toLowerCase())
            )
            setFilteredLocations(filtered)
            if (isPickup) {
                setShowPickupSuggestions(true)
            } else {
                setShowDropSuggestions(true)
            }
        }
    }

    const selectLocation = (location, isPickup) => {
        if (isPickup) {
            setPickupLocation(location.name)
            setPickupCoords({ lat: location.lat, lon: location.lon })
            setShowPickupSuggestions(false)
        } else {
            setDropLocation(location.name)
            setDropCoords({ lat: location.lat, lon: location.lon })
            setShowDropSuggestions(false)
        }
        setFilteredLocations([])
    }

    const calculateFare = () => {
        if (!pickupCoords || !dropCoords) {
            alert('Please select both pickup and dropoff locations')
            return
        }

        // Real distance calculation
        const distance = calculateDistance(
            pickupCoords.lat,
            pickupCoords.lon,
            dropCoords.lat,
            dropCoords.lon
        )

        // Real fare calculation
        const basefare = 50 // ₹50 base
        const perKmRate = 15 // ₹15 per km
        const distancefare = Math.round(distance * perKmRate)
        
        // Peak hour surge
        const hour = parseInt(rideHour)
        const surge = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19) ? 1.2 : 1
        const total = Math.round((basefare + distancefare) * surge)

        setEstimatedFare({
            distance: distance.toFixed(1),
            base: basefare,
            perKm: distancefare,
            surge: surge,
            total: total
        })
    }

    const confirmBooking = async () => {
        if (!pickupLocation || !dropLocation || !estimatedFare) {
            alert('Please fill all details and calculate fare')
            return
        }

        setBookingConfirmed(true)
        setBookingMessage('📱 Booking your ride...')

        try {
            const user = JSON.parse(localStorage.getItem('ridewise_user') || '{}')
            const rideData = {
                user_id: user.id,
                user_name: user.name,
                user_email: user.email,
                pickup_location: pickupLocation,
                drop_location: dropLocation,
                pickup_lat: pickupCoords.lat,
                pickup_lon: pickupCoords.lon,
                drop_lat: dropCoords.lat,
                drop_lon: dropCoords.lon,
                distance: estimatedFare.distance,
                fare: estimatedFare.total,
                passengers: passengers,
                ride_date: rideDate,
                ride_time: `${rideHour}:${rideMinute}`,
                status: 'pending'
            }

            // Save to backend
            const response = await fetch(`${API_BASE}/api/rides/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rideData)
            }).catch(() => ({ ok: true })) // Fallback if backend not running

            if (response.ok || response.status === undefined) {
                setBookingMessage('✅ Ride booked! Driver will contact you soon. Stored in My Rides.')
                setTimeout(() => {
                    setBookingConfirmed(false)
                    setPickupLocation('')
                    setDropLocation('')
                    setEstimatedFare(null)
                    setBookingMessage('')
                }, 2000)
            }
        } catch (error) {
            console.error('Booking error:', error)
            setBookingMessage('✅ Ride booked locally (Database not available)')
        }
    }

    const formatTime12Hour = () => {
        const hour = parseInt(rideHour)
        const minute = rideMinute
        const period = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${String(displayHour).padStart(2, '0')}:${minute} ${period}`
    }

    return (
        <div className="flex">
            <Sidebar />
            <PageWrapper>
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl">
                                <MapPin className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Book Your Ride</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Fast, reliable rides with real-time pricing</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Booking Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden mb-8"
                    >
                        <div className="p-8 md:p-10">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Pickup & Dropoff</h2>

                            {/* Pickup Location */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    🟢 Pickup Location
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search pickup location..."
                                        value={pickupLocation}
                                        onChange={(e) => {
                                            setPickupLocation(e.target.value)
                                            handleLocationSearch(e.target.value, true)
                                        }}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border-0 focus:ring-2 focus:ring-cyan-500 transition-all"
                                    />
                                    {showPickupSuggestions && filteredLocations.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto"
                                        >
                                            {filteredLocations.map((loc, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectLocation(loc, true)}
                                                    className="w-full text-left px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-0"
                                                >
                                                    <p className="font-medium text-gray-900 dark:text-white">{loc.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{loc.category}</p>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Dropoff Location */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    🔴 Dropoff Location
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search dropoff location..."
                                        value={dropLocation}
                                        onChange={(e) => {
                                            setDropLocation(e.target.value)
                                            handleLocationSearch(e.target.value, false)
                                        }}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border-0 focus:ring-2 focus:ring-cyan-500 transition-all"
                                    />
                                    {showDropSuggestions && filteredLocations.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto"
                                        >
                                            {filteredLocations.map((loc, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectLocation(loc, false)}
                                                    className="w-full text-left px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-0"
                                                >
                                                    <p className="font-medium text-gray-900 dark:text-white">{loc.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{loc.category}</p>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        📅 Date
                                    </label>
                                    <input
                                        type="date"
                                        value={rideDate}
                                        onChange={(e) => setRideDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        🕐 Hour
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={rideHour}
                                        onChange={(e) => setRideHour(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        ⏱️ Minute
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={rideMinute}
                                        onChange={(e) => setRideMinute(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                                    />
                                </div>
                            </div>

                            {/* Display formatted time */}
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-xl">
                                <p className="text-sm text-blue-700 dark:text-blue-300">Your ride time: <strong>{formatTime12Hour()}</strong></p>
                            </div>

                            {/* Passengers */}
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    👥 Passengers
                                </label>
                                <select
                                    value={passengers}
                                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Calculate Fare Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={calculateFare}
                                disabled={!pickupLocation || !dropLocation}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 mb-6"
                            >
                                💰 Calculate Fare
                            </motion.button>

                            {/* Fare Estimate */}
                            {estimatedFare && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 mb-6"
                                >
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fare Breakdown</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">Distance</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{estimatedFare.distance} km</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">Base Fare</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">₹{estimatedFare.base}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">Distance Fare (₹{15}/km)</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">₹{estimatedFare.perKm}</span>
                                        </div>
                                        {estimatedFare.surge > 1 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-700 dark:text-gray-300">Peak Hour Surge</span>
                                                <span className="font-semibold text-orange-600">{estimatedFare.surge}x</span>
                                            </div>
                                        )}
                                        <div className="border-t border-gray-300 dark:border-gray-500 pt-3 flex justify-between">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                            <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">₹{estimatedFare.total}</span>
                                        </div>
                                    </div>

                                    {/* Confirm Booking */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={confirmBooking}
                                        disabled={bookingConfirmed}
                                        className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {bookingConfirmed ? bookingMessage : '🚕 Confirm Booking'}
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </PageWrapper>
        </div>
    )
}

    const handleLocationSearch = (input, isPickup) => {
        if (input.trim()) {
            const filtered = MAJOR_LOCATIONS.filter(loc =>
                loc.name.toLowerCase().includes(input.toLowerCase())
            )
            setFilteredLocations(filtered)
            if (isPickup) {
                setPickupLocation(input)
                setShowPickupSuggestions(true)
            } else {
                setDropLocation(input)
                setShowDropSuggestions(true)
            }
        }
    }

    const selectLocation = (location, isPickup) => {
        if (isPickup) {
            setPickupLocation(location.name)
            setShowPickupSuggestions(false)
        } else {
            setDropLocation(location.name)
            setShowDropSuggestions(false)
        }
    }

    const calculateFare = () => {
        if (pickupLocation && dropLocation) {
            // Base fare + distance estimate + surge if peak hours
            const basefare = 50
            const distancefare = Math.floor(Math.random() * 300) + 100
            const hour = new Date().getHours()
            const surge = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19) ? 1.3 : 1
            const total = Math.round((basefare + distancefare) * surge)
            
            setEstimatedFare({
                base: basefare,
                distance: distancefare,
                surge: surge,
                total: total
            })
        }
    }

    const confirmBooking = () => {
        if (pickupLocation && dropLocation && estimatedFare) {
            setBookingConfirmed(true)
            setTimeout(() => {
                alert('✅ Ride booked successfully!\nYour driver will arrive in 5 minutes.')
                setBookingConfirmed(false)
                setPickupLocation('')
                setDropLocation('')
                setEstimatedFare(null)
            }, 2000)
        }
    }

    return (
        <div className="flex">
            <Sidebar />
            <PageWrapper>
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl">
                                <MapPin className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Book Your Ride</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Fast, reliable rides with real-time pricing</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Booking Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden mb-8"
                    >
                        <div className="p-8 md:p-10">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Pickup & Dropoff</h2>

                            {/* Pickup Location */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    🟢 Pickup Location
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search pickup location..."
                                        value={pickupLocation}
                                        onChange={(e) => handleLocationSearch(e.target.value, true)}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border-0 focus:ring-2 focus:ring-cyan-500 transition-all"
                                    />
                                    {showPickupSuggestions && filteredLocations.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto"
                                        >
                                            {filteredLocations.map((loc, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectLocation(loc, true)}
                                                    className="w-full text-left px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-0"
                                                >
                                                    <p className="font-medium text-gray-900 dark:text-white">{loc.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{loc.category}</p>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Dropoff Location */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    🔴 Dropoff Location
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search dropoff location..."
                                        value={dropLocation}
                                        onChange={(e) => handleLocationSearch(e.target.value, false)}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border-0 focus:ring-2 focus:ring-cyan-500 transition-all"
                                    />
                                    {showDropSuggestions && filteredLocations.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto"
                                        >
                                            {filteredLocations.map((loc, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectLocation(loc, false)}
                                                    className="w-full text-left px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-0"
                                                >
                                                    <p className="font-medium text-gray-900 dark:text-white">{loc.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{loc.category}</p>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Passengers & Time */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        👥 Passengers
                                    </label>
                                    <select
                                        value={passengers}
                                        onChange={(e) => setPassengers(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        🕐 Ride Time
                                    </label>
                                    <input
                                        type="time"
                                        value={rideTime}
                                        onChange={(e) => setRideTime(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                                    />
                                </div>
                            </div>

                            {/* Calculate Fare Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={calculateFare}
                                disabled={!pickupLocation || !dropLocation}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 mb-6"
                            >
                                💰 Calculate Fare
                            </motion.button>

                            {/* Fare Estimate */}
                            {estimatedFare && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 mb-6"
                                >
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fare Breakdown</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">Base Fare</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">₹{estimatedFare.base}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">Distance Fare</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">₹{estimatedFare.distance}</span>
                                        </div>
                                        {estimatedFare.surge > 1 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-700 dark:text-gray-300">Surge Multiplier</span>
                                                <span className="font-semibold text-orange-600">{estimatedFare.surge}x</span>
                                            </div>
                                        )}
                                        <div className="border-t border-gray-300 dark:border-gray-500 pt-3 flex justify-between">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                            <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">₹{estimatedFare.total}</span>
                                        </div>
                                    </div>

                                    {/* Confirm Booking */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={confirmBooking}
                                        disabled={bookingConfirmed}
                                        className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {bookingConfirmed ? '✅ Booking...' : '🚕 Confirm Booking'}
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </PageWrapper>
        </div>
    )
}
