import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar, Edit, Star } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { useTheme } from '../context/ThemeContext'

export default function Profile() {
    const { theme } = useTheme()
    const [isEditing, setIsEditing] = useState(false)
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        joinDate: '',
        totalRides: 0,
        distanceTraveled: 0,
        avgRating: 0,
        totalRatings: 0
    })

    const [editData, setEditData] = useState(profile)

    // Load user data from localStorage on mount
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('ridewise_user') || '{}')
        const createdAt = userData.created_at ? new Date(userData.created_at) : new Date()
        const joinDate = createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

        const userProfile = {
            name: userData.name || 'User',
            email: userData.email || '',
            phone: userData.phone || 'Not provided',
            joinDate: joinDate,
            totalRides: 0,
            distanceTraveled: 0,
            avgRating: 0,
            totalRatings: 0
        }
        setProfile(userProfile)
        setEditData(userProfile)
    }, [])

    const handleSave = () => {
        setProfile(editData)
        setIsEditing(false)
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
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account information</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                {isEditing ? '💾 Save' : '✏️ Edit Profile'}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden mb-8"
                    >
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-32 md:h-40"></div>
                        <div className="px-6 md:px-10 pb-10">
                            {/* Profile Photo */}
                            <div className="flex items-end gap-6 -mt-24 mb-8">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                                    <span className="text-6xl">👤</span>
                                </div>
                                <div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="text-3xl font-bold bg-transparent text-gray-900 dark:text-white border-b-2 border-purple-500 pb-2"
                                        />
                                    ) : (
                                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                                    )}
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">Active Member</p>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                {/* Email */}
                                <div className="p-5 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Mail className="w-5 h-5 text-purple-500" />
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-600 px-3 py-2 rounded-lg text-gray-900 dark:text-white border-0"
                                        />
                                    ) : (
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.email}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="p-5 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Phone className="w-5 h-5 text-purple-500" />
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-600 px-3 py-2 rounded-lg text-gray-900 dark:text-white border-0"
                                        />
                                    ) : (
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.phone}</p>
                                    )}
                                </div>

                                {/* Join Date */}
                                <div className="p-5 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Calendar className="w-5 h-5 text-purple-500" />
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Member Since</label>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.joinDate}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Rides */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0 }}
                            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl p-6 shadow-lg"
                        >
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3 font-semibold">🚗 Total Rides</p>
                            <p className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2">{profile.totalRides}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Completed rides</p>
                        </motion.div>

                        {/* Distance */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-6 shadow-lg"
                        >
                            <p className="text-sm text-green-700 dark:text-green-300 mb-3 font-semibold">📍 Distance Traveled</p>
                            <p className="text-4xl font-bold text-green-900 dark:text-green-100 mb-2">{profile.distanceTraveled} km</p>
                            <p className="text-xs text-green-600 dark:text-green-400">Total distance</p>
                        </motion.div>

                        {/* Average Rating */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-2xl p-6 shadow-lg"
                        >
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3 font-semibold">⭐ Average Rating</p>
                            <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">{profile.avgRating}</p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Out of 5.0</p>
                        </motion.div>

                        {/* Total Ratings */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-6 shadow-lg"
                        >
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3 font-semibold">👥 Total Ratings</p>
                            <p className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">{profile.totalRatings}</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">From riders</p>
                        </motion.div>
                    </div>
                </div>
            </PageWrapper>
        </div>
    )
}
