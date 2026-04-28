import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { useTheme } from '../context/ThemeContext'
import { MapPin, Calendar, Clock, Users, Heart, ArrowRight, Navigation, ChevronDown, CheckCircle, AlertCircle, Loader2, Map, DollarSign, TrendingUp } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:5000'

export default function BookRide() {
    const { theme } = useTheme()
    const [step, setStep] = useState(1)
    const [pickupAddress, setPickupAddress] = useState('')
    const [dropAddress, setDropAddress] = useState('')
    const [pickupSuggestions, setPickupSuggestions] = useState([])
    const [dropSuggestions, setDropSuggestions] = useState([])
    const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
    const [showDropSuggestions, setShowDropSuggestions] = useState(false)
    const [rideDate, setRideDate] = useState(new Date().toISOString().split('T')[0])
    const [rideTime, setRideTime] = useState('10:00')
    const [passengers, setPassengers] = useState(1)
    const [specialNotes, setSpecialNotes] = useState('')
    const [priceDetails, setPriceDetails] = useState(null)
    const [loading, setLoading] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState(false)
    const [error, setError] = useState('')
    const [gpsLoading, setGpsLoading] = useState(false)
    const searchTimeoutRef = useRef(null)

    // All India locations database
    const allLocations = [
        // Pune
        { city: 'Pune', name: 'Hinjewadi', area: 'IT Park', lat: 18.5912, lon: 73.7389 },
        { city: 'Pune', name: 'Koregaon Park', area: 'Residential', lat: 18.5362, lon: 73.8961 },
        { city: 'Pune', name: 'Viman Nagar', area: 'Business', lat: 18.5679, lon: 73.9143 },
        { city: 'Pune', name: 'Baner', area: 'Residential', lat: 18.5590, lon: 73.7814 },
        { city: 'Pune', name: 'Wakad', area: 'Residential', lat: 18.5978, lon: 73.7650 },
        // Mumbai
        { city: 'Mumbai', name: 'Gateway of India', area: 'Landmark', lat: 18.9520, lon: 72.8347 },
        { city: 'Mumbai', name: 'Bandra', area: 'Residential', lat: 19.0596, lon: 72.8295 },
        { city: 'Mumbai', name: 'Worli', area: 'Business', lat: 19.0176, lon: 72.8194 },
        { city: 'Mumbai', name: 'BKC', area: 'IT Hub', lat: 19.0760, lon: 72.8670 },
        // Bangalore
        { city: 'Bangalore', name: 'Whitefield', area: 'IT Hub', lat: 12.9698, lon: 77.7499 },
        { city: 'Bangalore', name: 'Indiranagar', area: 'Residential', lat: 12.9716, lon: 77.6412 },
        { city: 'Bangalore', name: 'Koramangala', area: 'Commercial', lat: 12.9352, lon: 77.6245 },
        { city: 'Bangalore', name: 'Vidhana Soudha', area: 'Landmark', lat: 12.9916, lon: 77.5897 },
        // Delhi
        { city: 'Delhi', name: 'Connaught Place', area: 'Commercial', lat: 28.6328, lon: 77.1896 },
        { city: 'Delhi', name: 'Cyber City', area: 'Business', lat: 28.4595, lon: 77.3910 },
        { city: 'Delhi', name: 'India Gate', area: 'Landmark', lat: 28.6129, lon: 77.2295 },
        { city: 'Delhi', name: 'Red Fort', area: 'Landmark', lat: 28.6562, lon: 77.2410 },
        // Hyderabad
        { city: 'Hyderabad', name: 'HITEC City', area: 'IT Hub', lat: 17.3550, lon: 78.3794 },
        { city: 'Hyderabad', name: 'Jubilee Hills', area: 'Residential', lat: 17.3780, lon: 78.4010 },
        { city: 'Hyderabad', name: 'Charminar', area: 'Landmark', lat: 17.3597, lon: 78.4733 },
        // Kolkata
        { city: 'Kolkata', name: 'Salt Lake', area: 'Business', lat: 22.5726, lon: 88.4071 },
        { city: 'Kolkata', name: 'Park Street', area: 'Commercial', lat: 22.5541, lon: 88.3669 },
        { city: 'Kolkata', name: 'Victoria Memorial', area: 'Landmark', lat: 22.5450, lon: 88.3432 },
        // Chennai
        { city: 'Chennai', name: 'Marina Beach', area: 'Landmark', lat: 13.0499, lon: 80.2824 },
        { city: 'Chennai', name: 'OMR', area: 'IT Hub', lat: 12.8556, lon: 80.2420 },
        { city: 'Chennai', name: 'T. Nagar', area: 'Commercial', lat: 13.0342, lon: 80.2404 },
    ]

    const searchLocation = (query, isPickup = true) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

        searchTimeoutRef.current = setTimeout(() => {
            const suggestions = allLocations.filter(loc =>
                loc.name.toLowerCase().includes(query.toLowerCase()) ||
                loc.city.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 6)

            if (isPickup) {
                setPickupSuggestions(suggestions)
            } else {
                setDropSuggestions(suggestions)
            }
        }, 200)
    }

    const selectLocation = (location, isPickup = true) => {
        const formattedAddress = `${location.name}, ${location.city}`
        if (isPickup) {
            setPickupAddress(formattedAddress)
            setShowPickupSuggestions(false)
        } else {
            setDropAddress(formattedAddress)
            setShowDropSuggestions(false)
        }
    }

    const detectLocation = () => {
        setGpsLoading(true)
        if (!navigator.geolocation) {
            setError('GPS not supported')
            setGpsLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                const locationStr = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                setPickupAddress(locationStr)
                setError('')
                setGpsLoading(false)
            },
            () => {
                setError('Unable to detect location. Please enable GPS.')
                setGpsLoading(false)
            }
        )
    }

    const calculatePrice = async () => {
        if (!pickupAddress || !dropAddress) {
            setError('Please enter both pickup and drop locations')
            return
        }

        if (pickupAddress === dropAddress) {
            setError('Pickup and drop locations cannot be the same')
            return
        }

        setLoading(true)
        setError('')
        try {
            const [hours] = rideTime.split(':')
            const response = await axios.post(`${API_BASE}/api/calculate-price`, {
                pickup_address: pickupAddress,
                drop_address: dropAddress,
                date: rideDate,
                hour: parseInt(hours),
                passengers: passengers
            })
            setPriceDetails(response.data)
            setStep(2)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to calculate price')
        } finally {
            setLoading(false)
        }
    }

    const bookRide = async () => {
        if (!priceDetails) {
            setError('Please calculate price first')
            return
        }

        setLoading(true)
        setError('')
        try {
            const user = JSON.parse(localStorage.getItem('ridewise_user') || '{}')
            await axios.post(`${API_BASE}/api/book-ride`, {
                pickup_address: pickupAddress,
                drop_address: dropAddress,
                scheduled_date: rideDate,
                scheduled_time: rideTime,
                passengers: passengers,
                special_notes: specialNotes,
                estimated_price: priceDetails.final_price || priceDetails.estimated_fare
            }, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })

            setBookingSuccess(true)
            setTimeout(() => {
                setBookingSuccess(false)
                setStep(1)
                setPickupAddress('')
                setDropAddress('')
                setPriceDetails(null)
                setPassengers(1)
                setSpecialNotes('')
            }, 3000)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to book ride')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <PageWrapper>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Book Your Ride
                    </h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Fast, reliable rides with real-time pricing
                    </p>
                </motion.div>

                {bookingSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 mb-6 border-2 rounded-xl flex items-center gap-3 ${
                            theme === 'dark'
                                ? 'border-green-500/30 bg-green-500/10'
                                : 'border-green-300 bg-green-50'
                        }`}
                    >
                        <CheckCircle className={`w-6 h-6 flex-shrink-0 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                        <div>
                            <h3 className={`font-bold ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>Ride Booked!</h3>
                            <p className={`text-sm ${theme === 'dark' ? 'text-green-300/70' : 'text-green-600'}`}>Check your ride history for details</p>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Booking Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`lg:col-span-2 border rounded-xl p-6 ${
                            theme === 'dark'
                                ? 'bg-gray-800/50 border-gray-700'
                                : 'bg-white border-gray-200'
                        }`}
                    >
                        <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {step === 1 ? 'Pickup & Dropoff' : step === 2 ? 'Confirm Booking' : 'Review'}
                        </h2>

                        {step === 1 && (
                            <div className="space-y-5">
                                {/* Pickup Location */}
                                <div>
                                    <label className={`block font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <MapPin className="w-4 h-4 inline mr-2 text-green-500" />
                                        Pickup Location
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={pickupAddress}
                                                onChange={(e) => {
                                                    setPickupAddress(e.target.value)
                                                    searchLocation(e.target.value, true)
                                                }}
                                                onFocus={() => setShowPickupSuggestions(true)}
                                                placeholder="Enter pickup location..."
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition ${
                                                    theme === 'dark'
                                                        ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-500'
                                                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500'
                                                }`}
                                            />
                                            {showPickupSuggestions && pickupSuggestions.length > 0 && (
                                                <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto ${
                                                    theme === 'dark' ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-200'
                                                }`}>
                                                    {pickupSuggestions.map((loc, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => selectLocation(loc, true)}
                                                            className={`w-full text-left px-4 py-3 border-b last:border-0 transition ${
                                                                theme === 'dark'
                                                                    ? 'hover:bg-gray-800 text-white border-gray-700'
                                                                    : 'hover:bg-gray-50 text-gray-900 border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="font-medium">{loc.name}</div>
                                                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{loc.city} • {loc.area}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={detectLocation}
                                            disabled={gpsLoading}
                                            className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                                                gpsLoading
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : theme === 'dark'
                                                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                            }`}
                                        >
                                            {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Dropoff Location */}
                                <div>
                                    <label className={`block font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <MapPin className="w-4 h-4 inline mr-2 text-red-500" />
                                        Dropoff Location
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={dropAddress}
                                            onChange={(e) => {
                                                setDropAddress(e.target.value)
                                                searchLocation(e.target.value, false)
                                            }}
                                            onFocus={() => setShowDropSuggestions(true)}
                                            placeholder="Enter dropoff location..."
                                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition ${
                                                theme === 'dark'
                                                    ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-500'
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500'
                                            }`}
                                        />
                                        {showDropSuggestions && dropSuggestions.length > 0 && (
                                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto ${
                                                theme === 'dark' ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-200'
                                            }`}>
                                                {dropSuggestions.map((loc, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => selectLocation(loc, false)}
                                                        className={`w-full text-left px-4 py-3 border-b last:border-0 transition ${
                                                            theme === 'dark'
                                                                ? 'hover:bg-gray-800 text-white border-gray-700'
                                                                : 'hover:bg-gray-50 text-gray-900 border-gray-200'
                                                        }`}
                                                    >
                                                        <div className="font-medium">{loc.name}</div>
                                                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{loc.city} • {loc.area}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Passengers */}
                                <div>
                                    <label className={`block font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Users className="w-4 h-4 inline mr-2" />
                                        Number of Passengers
                                    </label>
                                    <select
                                        value={passengers}
                                        onChange={(e) => setPassengers(parseInt(e.target.value))}
                                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition ${
                                            theme === 'dark'
                                                ? 'bg-gray-900 border-gray-600 text-white focus:border-cyan-500'
                                                : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                                        }`}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <Calendar className="w-4 h-4 inline mr-2" />
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={rideDate}
                                            onChange={(e) => setRideDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition ${
                                                theme === 'dark'
                                                    ? 'bg-gray-900 border-gray-600 text-white focus:border-cyan-500'
                                                    : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <Clock className="w-4 h-4 inline mr-2" />
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            value={rideTime}
                                            onChange={(e) => setRideTime(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition ${
                                                theme === 'dark'
                                                    ? 'bg-gray-900 border-gray-600 text-white focus:border-cyan-500'
                                                    : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Special Notes */}
                                <div>
                                    <label className={`block font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={specialNotes}
                                        onChange={(e) => setSpecialNotes(e.target.value)}
                                        placeholder="Any special instructions..."
                                        rows="3"
                                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none resize-none transition ${
                                            theme === 'dark'
                                                ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500'
                                        }`}
                                    />
                                </div>

                                {error && (
                                    <div className={`p-4 rounded-lg border flex items-center gap-3 ${
                                        theme === 'dark' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                                    }`}>
                                        <AlertCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                        <p className={theme === 'dark' ? 'text-red-300' : 'text-red-700'}>{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={calculatePrice}
                                    disabled={loading || !pickupAddress || !dropAddress}
                                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                                        loading || !pickupAddress || !dropAddress
                                            ? 'opacity-50 cursor-not-allowed'
                                            : theme === 'dark'
                                            ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                    }`}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Fare Estimate'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {step === 2 && priceDetails && (
                            <div className="space-y-4">
                                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Review your booking details below
                                </p>
                                
                                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                    <div className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <p><strong className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>From:</strong> {pickupAddress}</p>
                                        <p><strong className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>To:</strong> {dropAddress}</p>
                                        <p><strong className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Date:</strong> {rideDate} at {rideTime}</p>
                                        <p><strong className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Passengers:</strong> {passengers}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className={`flex-1 py-3 rounded-lg font-medium transition ${
                                            theme === 'dark'
                                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                        }`}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={bookRide}
                                        disabled={loading}
                                        className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                                            loading
                                                ? 'opacity-50 cursor-not-allowed'
                                                : theme === 'dark'
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Fare Details Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`border rounded-xl p-6 h-fit ${
                            theme === 'dark'
                                ? 'bg-gray-800/50 border-gray-700'
                                : 'bg-white border-gray-200'
                        }`}
                    >
                        <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            <DollarSign className="w-5 h-5" />
                            Fare Details
                        </h3>

                        {!priceDetails ? (
                            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Enter locations to see fare estimate</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Base Fare</p>
                                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        ₹{priceDetails.base_price || 0}
                                    </p>
                                </div>

                                {priceDetails.surge_percent > 0 && (
                                    <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                                        theme === 'dark'
                                            ? 'bg-orange-500/10 border-orange-500/30'
                                            : 'bg-orange-50 border-orange-200'
                                    }`}>
                                        <TrendingUp className={`w-4 h-4 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                                        <div>
                                            <p className={`text-xs ${theme === 'dark' ? 'text-orange-300/60' : 'text-orange-700'}`}>Surge Pricing</p>
                                            <p className={`text-sm font-bold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>+{priceDetails.surge_percent}%</p>
                                        </div>
                                    </div>
                                )}

                                <div className={`pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Fare</p>
                                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                        ₹{priceDetails.final_price || priceDetails.estimated_fare || 0}
                                    </p>
                                </div>

                                {priceDetails.distance && (
                                    <div className={`text-center text-xs py-2 px-3 rounded-lg ${
                                        theme === 'dark' ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-600'
                                    }`}>
                                        ~{priceDetails.distance} km
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </PageWrapper>
        </div>
    )
}
