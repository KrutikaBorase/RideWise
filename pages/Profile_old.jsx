import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { useTheme } from '../context/ThemeContext'
import { User, Mail, Phone, Calendar, Award, MapPin, Clock, Bike, Edit2, Save, X, TrendingUp, Camera } from 'lucide-react'
import { apiExtended } from '../services/api'

export default function Profile() {
    const { theme } = useTheme()
    const [profile, setProfile] = useState(null)
    const [analytics, setAnalytics] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({ name: '', phone: '', profile_photo: '' })
    const [loading, setLoading] = useState(true)
    const [photoPreview, setPhotoPreview] = useState(null)

    useEffect(() => {
        loadProfile()
        loadAnalytics()
    }, [])

    const loadProfile = async () => {
        try {
            // Get user from localStorage if API fails
            const userStr = localStorage.getItem('ridewise_user')
            if (userStr) {
                const user = JSON.parse(userStr)
                setProfile({ 
                    user: user,
                    stats: {
                        total_rides: 0,
                        total_distance: 0,
                        avg_rating: 0
                    }
                })
                setFormData({ 
                    name: user.name || '', 
                    phone: user.phone || '',
                    profile_photo: user.profile_photo || ''
                })
                setPhotoPreview(user.profile_photo || null)
            }
            
            // Try API call
            try {
                const data = await apiExtended.getProfile()
                if (data && data.user) {
                    setProfile(data)
                    setFormData({ 
                        name: data.user.name || '', 
                        phone: data.user.phone || '',
                        profile_photo: data.user.profile_photo || ''
                    })
                    setPhotoPreview(data.user.profile_photo || null)
                }
            } catch (apiError) {
                console.log("API call failed, using localStorage data")
            }
        } catch (error) {
            console.error("Failed to load profile", error)
        } finally {
            setLoading(false)
        }
    }

    const loadAnalytics = async () => {
        try {
            const data = await apiExtended.getRiderAnalytics()
            setAnalytics(data)
        } catch (error) {
            console.error("Failed to load analytics", error)
        }
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result)
                setFormData({ ...formData, profile_photo: reader.result })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async () => {
        try {
            console.log('Updating profile with:', { 
                name: formData.name, 
                phone: formData.phone, 
                hasPhoto: !!formData.profile_photo 
            })
            
            const result = await apiExtended.updateProfile(formData.name, formData.phone, formData.profile_photo)
            console.log('Update result:', result)
            
            // Update localStorage
            const userStr = localStorage.getItem('ridewise_user')
            if (userStr) {
                const user = JSON.parse(userStr)
                user.name = formData.name
                user.phone = formData.phone
                user.profile_photo = formData.profile_photo
                localStorage.setItem('ridewise_user', JSON.stringify(user))
                
                // Update profile state without reloading
                setProfile(prev => ({
                    ...prev,
                    user: user
                }))
            }
            
            setIsEditing(false)
            alert('Profile updated successfully!')
        } catch (error) {
            console.error('Error updating profile:', error)
            console.error('Error details:', error.response?.data)
            
            if (error.response?.status === 401) {
                alert('Your session has expired. Please login again.')
                localStorage.removeItem('ridewise_user')
                window.location.href = '/login'
                return
            }
            
            alert(`Failed to update profile: ${error.response?.data?.error || error.message}`)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
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
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <span className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/20">
                            <User className="w-6 h-6" />
                        </span>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Profile</h1>
                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} mt-1`}>Manage your account and view your stats</p>
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="lg:col-span-2 glass-card backdrop-blur-2xl border-2 border-purple-500/20 p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Personal Information</h2>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false)
                                            const userStr = localStorage.getItem('ridewise_user')
                                            if (userStr && profile?.user) {
                                                const user = JSON.parse(userStr)
                                                setFormData({ 
                                                    name: user.name || profile.user.name || '', 
                                                    phone: user.phone || profile.user.phone || '',
                                                    profile_photo: user.profile_photo || profile.user.profile_photo || ''
                                                })
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Profile Photo */}
                            <div className="flex items-center gap-4 p-4 bg-background rounded-xl">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-primary" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                                            <Camera className="w-4 h-4 text-white" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm text-text-muted">Profile Photo</label>
                                    <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm`}>{photoPreview ? 'Photo uploaded' : 'No photo uploaded'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-background rounded-xl">
                                <User className="w-5 h-5 text-primary" />
                                <div className="flex-1">
                                    <label className="text-sm text-text-muted">Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'} focus:outline-none focus:ring-2 focus:ring-primary`}
                                        />
                                    ) : (
                                        <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium`}>{profile?.user?.name || 'Not set'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-background rounded-xl">
                                <Mail className="w-5 h-5 text-primary" />
                                <div className="flex-1">
                                    <label className="text-sm text-text-muted">Email</label>
                                    <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium`}>{profile?.user?.email || 'Not set'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-background rounded-xl">
                                <Phone className="w-5 h-5 text-primary" />
                                <div className="flex-1">
                                    <label className="text-sm text-text-muted">Phone</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={`w-full mt-1 px-3 py-2 bg-card border border-border rounded-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'} focus:outline-none focus:ring-2 focus:ring-primary`}
                                            placeholder="+91 98765 43210"
                                        />
                                    ) : (
                                        <p className="text-white font-medium">{profile?.user?.phone || 'Not set'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-background rounded-xl">
                                <Calendar className="w-5 h-5 text-primary" />
                                <div className="flex-1">
                                    <label className="text-sm text-text-muted">Member Since</label>
                                    <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium`}>
                                        {profile?.user?.created_at ? new Date(profile.user.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card backdrop-blur-2xl border-2 border-cyan-500/20 p-6"
                    >
                        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-6`}>Ride Stats</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Bike className="w-5 h-5 text-primary" />
                                    <span className="text-sm text-text-muted">Total Rides</span>
                                </div>
                                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{profile?.stats?.total_rides || 0}</p>
                            </div>

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <MapPin className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm text-text-muted">Distance Traveled</span>
                                </div>
                                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {profile?.stats?.total_distance ? profile.stats.total_distance.toFixed(1) : 0} km
                                </p>
                            </div>

                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Award className="w-5 h-5 text-purple-400" />
                                    <span className="text-sm text-text-muted">Avg Rating</span>
                                </div>
                                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {profile?.stats?.avg_rating ? profile.stats.avg_rating.toFixed(1) : 'N/A'} ⭐
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Analytics Section */}
                {analytics && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Frequent Routes */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin className="w-5 h-5 text-primary" />
                                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Frequent Routes</h2>
                            </div>
                            {analytics.frequent_routes?.length > 0 ? (
                                <div className="space-y-3">
                                    {analytics.frequent_routes.map((route, idx) => (
                                        <div key={idx} className="p-3 bg-background rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium`}>{route.start_location} → {route.end_location}</p>
                                                    <p className="text-sm text-text-muted">{route.trip_count} trips</p>
                                                </div>
                                                <TrendingUp className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-muted text-center py-8">No frequent routes yet</p>
                            )}
                        </div>

                        {/* Peak Hours */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-5 h-5 text-primary" />
                                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Peak Usage Hours</h2>
                            </div>
                            {analytics.peak_hours?.length > 0 ? (
                                <div className="space-y-3">
                                    {analytics.peak_hours.map((hour, idx) => (
                                        <div key={idx} className="p-3 bg-background rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-medium`}>{hour.hour}:00</p>
                                                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                                                    {hour.count} rides
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-muted text-center py-8">No usage data yet</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </PageWrapper>
        </div>
    )
}
