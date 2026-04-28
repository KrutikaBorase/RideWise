import { useState, useEffect } from 'react'
import { Car, Upload, Star, AlertCircle, CheckCircle, Clock, Camera, User } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function DriverProfile() {
    const [driverData, setDriverData] = useState({
        name: '',
        email: '',
        phone: '',
        license_number: '',
        vehicle_number: '',
        vehicle_type: 'sedan',
        vehicle_model: '',
        vehicle_color: '',
        vehicle_photo: '',
        license_expiry: '',
        insurance_number: '',
        insurance_expiry: '',
        aadhar_number: '',
        pan_number: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        years_experience: 0
    })
    
    const [existingProfile, setExistingProfile] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [profilePhoto, setProfilePhoto] = useState(null)
    const [vehiclePhoto, setVehiclePhoto] = useState(null)

    useEffect(() => {
        fetchDriverProfile()
        fetchDriverReviews()
    }, [])

    const fetchDriverProfile = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('ridewise_user'))
            
            // Set basic user info from localStorage
            setDriverData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }))
            
            const response = await fetch(`http://127.0.0.1:5000/api/driver-profile/${user.id}`)
            if (response.ok) {
                const data = await response.json()
                if (data.profile) {
                    setExistingProfile(data.profile)
                    setDriverData({
                        ...data.profile,
                        name: user.name || data.profile.name || '',
                        email: user.email || data.profile.email || '',
                        phone: user.phone || data.profile.phone || ''
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching driver profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDriverReviews = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('ridewise_user'))
            const response = await fetch(`http://127.0.0.1:5000/api/driver-reviews/${user.id}`)
            if (response.ok) {
                const data = await response.json()
                setReviews(data.reviews || [])
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
        }
    }

    const handleProfilePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePhoto(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleVehiclePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setVehiclePhoto(reader.result)
                setDriverData({...driverData, vehicle_photo: reader.result})
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setMessage({ type: '', text: '' })

        try {
            const user = JSON.parse(localStorage.getItem('ridewise_user'))
            const response = await fetch('http://127.0.0.1:5000/api/driver-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...driverData, user_id: user.id })
            })

            const data = await response.json()
            if (response.ok) {
                setMessage({ type: 'success', text: 'Driver profile submitted successfully! Awaiting verification.' })
                fetchDriverProfile()
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit profile' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' })
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: Clock },
            verified: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircle },
            rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: AlertCircle }
        }
        const badge = badges[status] || badges.pending
        const Icon = badge.icon
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="w-4 h-4" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-lg text-muted-foreground">Loading...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto md:ml-64">
                <div className="p-6 max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Car className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Driver Profile</h1>
                                <p className="text-muted-foreground">Manage your driver credentials and vehicle details</p>
                            </div>
                        </div>
                        {existingProfile && (
                            <div className="mt-4 flex items-center justify-between bg-card p-4 rounded-lg border border-border">
                                <div>
                                    <p className="text-sm text-muted-foreground">Profile Status</p>
                                    <div className="mt-1">{getStatusBadge(existingProfile.status)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-2xl font-bold text-foreground">
                                            {existingProfile.rating?.toFixed(1) || '0.0'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{existingProfile.total_ratings || 0} reviews</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information from Registration */}
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Personal Information
                            </h2>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={driverData.name}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 text-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">From registration</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={driverData.email}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 text-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">From registration</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={driverData.phone}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background/50 text-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">From registration</p>
                                </div>
                            </div>
                        </div>

                        {/* Photos Section */}
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Photos</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Profile Photo */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Profile Photo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center overflow-hidden border-2 border-blue-500/30">
                                                {profilePhoto ? (
                                                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-12 h-12 text-blue-500" />
                                                )}
                                            </div>
                                            <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                                                <Camera className="w-4 h-4 text-white" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleProfilePhotoChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">Upload your profile photo</p>
                                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG (Max 5MB)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Photo */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Vehicle Photo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-lg bg-blue-500/10 flex items-center justify-center overflow-hidden border-2 border-blue-500/30">
                                                {vehiclePhoto ? (
                                                    <img src={vehiclePhoto} alt="Vehicle" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Car className="w-12 h-12 text-blue-500" />
                                                )}
                                            </div>
                                            <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                                                <Camera className="w-4 h-4 text-white" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleVehiclePhotoChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">Upload your vehicle photo</p>
                                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG (Max 5MB)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* License Information */}
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4">License Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">License Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driverData.license_number}
                                        onChange={(e) => setDriverData({...driverData, license_number: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        placeholder="MH12-20230001234"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">License Expiry Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={driverData.license_expiry}
                                        onChange={(e) => setDriverData({...driverData, license_expiry: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Years of Experience *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={driverData.years_experience}
                                        onChange={(e) => setDriverData({...driverData, years_experience: parseInt(e.target.value)})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Vehicle Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Vehicle Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={driverData.vehicle_number}
                                        onChange={(e) => setDriverData({...driverData, vehicle_number: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        placeholder="MH12AB1234"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Vehicle Type *</label>
                                    <select
                                        required
                                        value={driverData.vehicle_type}
                                        onChange={(e) => setDriverData({...driverData, vehicle_type: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="sedan">Sedan</option>
                                        <option value="suv">SUV</option>
                                        <option value="hatchback">Hatchback</option>
                                        <option value="auto">Auto Rickshaw</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Vehicle Model</label>
                                    <input
                                        type="text"
                                        value={driverData.vehicle_model}
                                        onChange={(e) => setDriverData({...driverData, vehicle_model: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        placeholder="Honda City 2022"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Vehicle Color</label>
                                    <input
                                        type="text"
                                        value={driverData.vehicle_color}
                                        onChange={(e) => setDriverData({...driverData, vehicle_color: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        placeholder="White"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Insurance Information */}
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Insurance Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Insurance Number</label>
                                    <input
                                        type="text"
                                        value={driverData.insurance_number}
                                        onChange={(e) => setDriverData({...driverData, insurance_number: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Insurance Expiry Date</label>
                                    <input
                                        type="date"
                                        value={driverData.insurance_expiry}
                                        onChange={(e) => setDriverData({...driverData, insurance_expiry: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personal Documents */}
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Personal Documents</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Aadhar Number</label>
                                    <input
                                        type="text"
                                        value={driverData.aadhar_number}
                                        onChange={(e) => setDriverData({...driverData, aadhar_number: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        placeholder="XXXX-XXXX-XXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">PAN Number</label>
                                    <input
                                        type="text"
                                        value={driverData.pan_number}
                                        onChange={(e) => setDriverData({...driverData, pan_number: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        placeholder="ABCDE1234F"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                                    <textarea
                                        value={driverData.address}
                                        onChange={(e) => setDriverData({...driverData, address: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Emergency Contact</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={driverData.emergency_contact}
                                        onChange={(e) => setDriverData({...driverData, emergency_contact: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={driverData.emergency_phone}
                                        onChange={(e) => setDriverData({...driverData, emergency_phone: e.target.value})}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : existingProfile ? 'Update Profile' : 'Submit for Verification'}
                        </button>
                    </form>

                    {/* Reviews Section */}
                    {reviews.length > 0 && (
                        <div className="mt-8 bg-card p-6 rounded-xl border border-border">
                            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Reviews</h2>
                            <div className="space-y-4">
                                {reviews.slice(0, 5).map((review) => (
                                    <div key={review.id} className="p-4 bg-background rounded-lg border border-border">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{review.rating}/5</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {review.review_text && (
                                            <p className="text-sm text-muted-foreground">{review.review_text}</p>
                                        )}
                                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                            {review.safety_rating && <span>Safety: {review.safety_rating}/5</span>}
                                            {review.punctuality_rating && <span>Punctuality: {review.punctuality_rating}/5</span>}
                                            {review.behavior_rating && <span>Behavior: {review.behavior_rating}/5</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
