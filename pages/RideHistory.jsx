import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { useTheme } from '../context/ThemeContext'
import { History, MapPin, Clock, IndianRupee, Star, MessageSquare, X, Calendar, Filter, User } from 'lucide-react'
import { api, apiExtended } from '../services/api'

export default function RideHistory() {
    const { theme } = useTheme()
    const [rides, setRides] = useState([])
    const [loading, setLoading] = useState(true)
    const [ratingModal, setRatingModal] = useState(null)
    const [driverReviewModal, setDriverReviewModal] = useState(null)
    const [rating, setRating] = useState(5)
    const [feedback, setFeedback] = useState('')
    const [driverRating, setDriverRating] = useState({
        overall: 5,
        safety: 5,
        punctuality: 5,
        behavior: 5,
        review: ''
    })
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        loadRides()
        
        // Listen for ride booking events
        window.addEventListener('rideBooked', loadRides)
        return () => window.removeEventListener('rideBooked', loadRides)
    }, [])

    const loadRides = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('ridewise_user'))
            if (!user?.token) {
                // Load from localStorage if not logged in
                const localRides = JSON.parse(localStorage.getItem('localRides') || '[]')
                setRides(localRides)
                setLoading(false)
                return
            }

            const response = await fetch('http://localhost:5000/api/rides', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            
            const data = await response.json()
            
            if (data.rides && data.rides.length > 0) {
                setRides(data.rides)
            } else {
                // Fallback to localStorage
                const localRides = JSON.parse(localStorage.getItem('localRides') || '[]')
                setRides(localRides.length > 0 ? localRides : [
                    {
                        id: 1,
                        start_location: 'Pune Station',
                        end_location: 'Wagholi',
                        distance_km: 18.5,
                        duration_mins: 28,
                        fare: 280,
                        ride_date: new Date().toISOString().split('T')[0],
                        ride_time: '14:30',
                        status: 'completed',
                        driver_name: 'Raj Kumar',
                        driver_rating: 4.8
                    }
                ])
            }
        } catch (error) {
            console.error("Failed to load rides from server", error)
            // Fallback to localStorage
            const localRides = JSON.parse(localStorage.getItem('localRides') || '[]')
            setRides(localRides)
        } finally {
            setLoading(false)
        }
    }

    const handleRateRide = async () => {
        if (!ratingModal) return

        try {
            await apiExtended.rateRide(ratingModal.id, rating, feedback)
            alert('Rating submitted successfully!')
            setRatingModal(null)
            setRating(5)
            setFeedback('')
            await loadRides()
        } catch (error) {
            alert('Failed to submit rating')
        }
    }

    const handleRateDriver = async () => {
        if (!driverReviewModal) return

        try {
            const user = JSON.parse(localStorage.getItem('ridewise_user'))
            const response = await fetch('http://127.0.0.1:5000/api/driver-review', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    driver_user_id: driverReviewModal.driver_id || 1,
                    user_id: user.id,
                    ride_id: driverReviewModal.id,
                    rating: driverRating.overall,
                    review_text: driverRating.review,
                    safety_rating: driverRating.safety,
                    punctuality_rating: driverRating.punctuality,
                    behavior_rating: driverRating.behavior
                })
            })

            if (response.ok) {
                alert('Driver review submitted successfully!')
                setDriverReviewModal(null)
                setDriverRating({ overall: 5, safety: 5, punctuality: 5, behavior: 5, review: '' })
            } else {
                alert('Failed to submit driver review')
            }
        } catch (error) {
            console.error('Error submitting driver review:', error)
            alert('Failed to submit driver review')
        }
    }

    const handleCancelRide = async (rideId) => {
        if (!confirm('Are you sure you want to cancel this ride?')) return

        try {
            await apiExtended.cancelRide(rideId, 'User requested cancellation')
            alert('Ride cancelled successfully')
            await loadRides()
        } catch (error) {
            alert('Failed to cancel ride')
        }
    }

    const filteredRides = rides.filter(ride => 
        filterStatus === 'all' || ride.status === filterStatus
    )

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/20'
            case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/20'
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/20'
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
        }
    }

    if (loading) {
        return (
            <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <PageWrapper>
                <header className="mb-10 relative">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <History className="w-10 h-10 text-purple-400" />
                            <div>
                                <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Rides</h1>
                                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Track all your completed and upcoming rides</p>
                            </div>
                        </div>

                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm ${
                                    theme === 'dark'
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-white text-gray-900'
                                }`}
                            >
                                <option value="all">All Rides</option>
                                <option value="completed">Completed</option>
                                <option value="active">Active</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </motion.div>
                </header>

                {/* Rides List */}
                {filteredRides.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <History className={`w-16 h-16 mx-auto mb-4 opacity-50 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
                        <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No rides found</p>
                        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Book your first ride to see it here!</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filteredRides.map((ride, idx) => (
                            <motion.div
                                key={ride.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`backdrop-blur-2xl shadow-lg p-6 rounded-2xl hover:shadow-xl transition-all ${
                                    theme === 'dark'
                                        ? 'bg-gray-800/50'
                                        : 'bg-white/80'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(ride.status)}`}>
                                                {ride.status.toUpperCase()}
                                            </span>
                                            <span className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <Calendar className="w-4 h-4" />
                                                {new Date(ride.ride_date).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Route */}
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-5 h-5 text-primary mt-1" />
                                                <div>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Route</p>
                                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{ride.start_location}</p>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>→ {ride.end_location}</p>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-2">
                                                {ride.distance_km && (
                                                    <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Distance:</span>
                                                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{ride.distance_km} km</span>
                                                    </div>
                                                )}
                                                {ride.duration_mins && (
                                                    <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                                        <span>{ride.duration_mins} mins</span>
                                                    </div>
                                                )}
                                                {ride.fare && (
                                                    <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        <IndianRupee className="w-4 h-4 text-green-400" />
                                                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{ride.fare}</span>
                                                    </div>
                                                )}
                                                {ride.city && (
                                                    <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>City:</span>
                                                        <span>{ride.city}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Driver Info */}
                                        {ride.driver_name && (
                                            <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Driver: <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{ride.driver_name}</span>
                                                    {ride.vehicle_number && ` • ${ride.vehicle_number}`}
                                                </p>
                                            </div>
                                        )}

                                        {/* Rating */}
                                        {ride.rating && (
                                            <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{ride.rating}/5</span>
                                                    {ride.feedback && <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>• {ride.feedback}</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        {ride.status === 'completed' && !ride.rating && (
                                            <button
                                                onClick={() => setRatingModal(ride)}
                                                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                                                    theme === 'dark'
                                                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                }`}
                                            >
                                                <Star className="w-4 h-4" />
                                                Rate
                                            </button>
                                        )}
                                        {ride.status === 'completed' && ride.driver_name && (
                                            <button
                                                onClick={() => setDriverReviewModal(ride)}
                                                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                                                    theme === 'dark'
                                                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                }`}
                                            >
                                                <User className="w-4 h-4" />
                                                Rate Driver
                                            </button>
                                        )}
                                        {ride.status === 'active' && (
                                            <button
                                                onClick={() => handleCancelRide(ride.id)}
                                                className={`px-4 py-2 rounded-lg transition-colors ${
                                                    theme === 'dark'
                                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                }`}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            {/* Rating Modal */}
            {ratingModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-2xl p-6 max-w-md w-full shadow-2xl ${
                            theme === 'dark'
                                ? 'bg-gray-800'
                                : 'bg-white'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rate Your Ride</h3>
                            <button
                                onClick={() => setRatingModal(null)}
                                className={`p-2 rounded-lg transition-colors ${
                                    theme === 'dark'
                                        ? 'hover:bg-gray-700'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <X className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {ratingModal.start_location} → {ratingModal.end_location}
                            </p>
                            <div className="flex gap-2 justify-center my-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 ${
                                                star <= rating
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-600'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className={`block text-sm mb-2 flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <MessageSquare className="w-4 h-4 inline mr-1" />
                                Feedback (Optional)
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Share your experience..."
                                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-sm ${
                                    theme === 'dark'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-900'
                                }`}
                                rows="3"
                            />
                        </div>

                        <button
                            onClick={handleRateRide}
                            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
                        >
                            Submit Rating
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Driver Review Modal */}
            {driverReviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl ${
                            theme === 'dark'
                                ? 'bg-gray-800'
                                : 'bg-white'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rate Your Driver</h3>
                            <button
                                onClick={() => setDriverReviewModal(null)}
                                className={`p-2 rounded-lg transition-colors ${
                                    theme === 'dark'
                                        ? 'hover:bg-gray-700'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <X className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Overall Rating */}
                            <div>
                                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Overall Rating</p>
                                <div className="flex gap-2 justify-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setDriverRating({...driverRating, overall: star})}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${
                                                    star <= driverRating.overall
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-600'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Safety Rating */}
                            <div>
                                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Safety</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setDriverRating({...driverRating, safety: star})}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-6 h-6 ${
                                                    star <= driverRating.safety
                                                        ? 'text-blue-400 fill-blue-400'
                                                        : 'text-gray-600'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Punctuality Rating */}
                            <div>
                                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Punctuality</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setDriverRating({...driverRating, punctuality: star})}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-6 h-6 ${
                                                    star <= driverRating.punctuality
                                                        ? 'text-green-400 fill-green-400'
                                                        : 'text-gray-600'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Behavior Rating */}
                            <div>
                                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Behavior</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setDriverRating({...driverRating, behavior: star})}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-6 h-6 ${
                                                    star <= driverRating.behavior
                                                        ? 'text-purple-400 fill-purple-400'
                                                        : 'text-gray-600'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Review Text */}
                            <div>
                                <label className={`block text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <MessageSquare className="w-4 h-4 inline mr-1" />
                                    Write a review (Optional)
                                </label>
                                <textarea
                                    value={driverRating.review}
                                    onChange={(e) => setDriverRating({...driverRating, review: e.target.value})}
                                    placeholder="Share your experience with the driver..."
                                    className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none border ${
                                        theme === 'dark'
                                            ? 'bg-gray-900 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                    rows="3"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleRateDriver}
                            className="w-full mt-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
                        >
                            Submit Review
                        </button>
                    </motion.div>
                </div>
            )}
            </PageWrapper>
        </div>
    )
}
