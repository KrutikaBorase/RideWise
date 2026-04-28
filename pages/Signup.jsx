import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const API_BASE_URL = 'http://localhost:5000'

export default function Signup() {
    const navigate = useNavigate()
    const { theme } = useTheme()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'rider'
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    const validateStep1 = () => {
        if (!formData.name.trim() || formData.name.length < 2) {
            setError('Full name must be at least 2 characters')
            return false
        }
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please enter a valid email address')
            return false
        }
        return true
    }

    const validateStep2 = () => {
        if (!formData.password || formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return false
        }
        return true
    }

    const handleNext = () => {
        if (validateStep1()) {
            setError('') // Clear any previous errors
            setStep(2)
        }
    }

    const handleSignup = async (e) => {
        e.preventDefault()
        if (!validateStep2()) return

        setLoading(true)

        try {
            // Only include phone if it has a value
            const requestData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            }

            // Add phone only if user entered one
            if (formData.phone && formData.phone.trim()) {
                requestData.phone = formData.phone.trim()
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })

            const data = await response.json()

            if (response.ok) {
                // Store token AND include it in user data (matching Login.jsx)
                const userData = {
                    ...data.user,
                    token: data.token,
                    isAuth: true
                }
                localStorage.setItem('ridewise_token', data.token)
                localStorage.setItem('ridewise_user', JSON.stringify(userData))
                navigate('/dashboard')
            } else {
                setError(data.error || 'Signup failed')
            }
        } catch (err) {
            setError('Connection error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-blue-50'
    const cardClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'
    const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900'
    const inputClass = theme === 'dark'
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    }

    const fieldVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: { delay: i * 0.1, duration: 0.4 }
        })
    }

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`w-full max-w-md ${cardClass} rounded-2xl shadow-2xl border p-8`}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 mb-4"
                    >
                        <User className="text-white" size={32} />
                    </motion.div>
                    <h1 className={`text-3xl font-bold ${textClass} mb-2`}>Create Account</h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Join RideWise today
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg text-sm shadow-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Progress Steps */}
                <div className="flex gap-2 mb-8">
                    {[1, 2].map((s) => (
                        <motion.div
                            key={s}
                            className={`flex-1 h-2 rounded-full transition-all ${s <= step
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                                : theme === 'dark'
                                    ? 'bg-gray-700'
                                    : 'bg-gray-200'
                                }`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: s * 0.1 }}
                        />
                    ))}
                </div>

                <form onSubmit={handleSignup}>
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                        >
                            <motion.div variants={fieldVariants} custom={0} className="mb-4">
                                <label className={`block text-sm font-medium ${textClass} mb-2`}>
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User
                                        className={`absolute left-3 top-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            }`}
                                        size={20}
                                    />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${inputClass}`}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={fieldVariants} custom={1} className="mb-4">
                                <label className={`block text-sm font-medium ${textClass} mb-2`}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail
                                        className={`absolute left-3 top-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            }`}
                                        size={20}
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="you@example.com"
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${inputClass}`}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={fieldVariants} custom={2} className="mb-6">
                                <label className={`block text-sm font-medium ${textClass} mb-2`}>
                                    Account Type
                                </label>
                                <div className="flex gap-4">
                                    {['rider', 'driver'].map((role) => (
                                        <label key={role} className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role}
                                                checked={formData.role === role}
                                                onChange={handleInputChange}
                                                className="mr-2"
                                            />
                                            <span className={`capitalize ${textClass}`}>
                                                {role === 'rider' ? '🚗 Rider' : '🚕 Driver'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.button
                                variants={fieldVariants}
                                custom={3}
                                type="button"
                                onClick={handleNext}
                                className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-105"
                            >
                                Next
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Step 2: Password */}
                    {step === 2 && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                        >
                            <motion.div variants={fieldVariants} custom={0} className="mb-4">
                                <label className={`block text-sm font-medium ${textClass} mb-2`}>
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock
                                        className={`absolute left-3 top-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            }`}
                                        size={20}
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${inputClass}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3"
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    }`}
                                                size={20}
                                            />
                                        ) : (
                                            <Eye
                                                className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    }`}
                                                size={20}
                                            />
                                        )}
                                    </button>
                                </div>
                                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    At least 6 characters
                                </p>
                            </motion.div>

                            <motion.div variants={fieldVariants} custom={1} className="mb-6">
                                <label className={`block text-sm font-medium ${textClass} mb-2`}>
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock
                                        className={`absolute left-3 top-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                            }`}
                                        size={20}
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${inputClass}`}
                                    />
                                </div>
                            </motion.div>

                            <div className="flex gap-3">
                                <motion.button
                                    variants={fieldVariants}
                                    custom={2}
                                    type="button"
                                    onClick={() => {
                                        setError('') // Clear errors when going back
                                        setStep(1)
                                    }}
                                    className={`flex-1 py-2 px-4 border rounded-lg font-semibold transition ${theme === 'dark'
                                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    Back
                                </motion.button>
                                <motion.button
                                    variants={fieldVariants}
                                    custom={3}
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Account'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </form>

                {/* Sign In Link */}
                <p className={`text-center mt-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Already have an account?{' '}
                    <Link to="/login" className="text-purple-500 font-semibold hover:text-blue-500 transition">
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}
