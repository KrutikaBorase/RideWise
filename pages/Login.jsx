import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Zap, Lock, Mail, ChevronRight } from 'lucide-react'
import axios from 'axios'

// Auto-detect backend URL based on current host
const getApiBaseUrl = () => {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:5000`
    }
    return 'http://localhost:5000'
}

const API_BASE_URL = getApiBaseUrl()

export default function Login() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({ email: '', password: '' })

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Frontend validation
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address')
            setLoading(false)
            return
        }

        if (!formData.password || formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            // Real API Login
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email: formData.email,
                password: formData.password
            })

            if (response.data.success) {
                // Store token and user data
                const userData = {
                    ...response.data.user,
                    token: response.data.token,
                    isAuth: true
                }
                console.log('Login - User data being saved:', userData)
                localStorage.setItem('ridewise_token', response.data.token)
                localStorage.setItem('ridewise_user', JSON.stringify(userData))

                // Redirect based on role
                if (response.data.user.role === 'admin') {
                    navigate('/dashboard')
                } else {
                    navigate('/dashboard')
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#1A1F2C] items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Cinematic Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-[#9b87f5] to-[#D946EF] opacity-20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-l from-blue-500 to-cyan-400 opacity-15 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-violet-500 to-purple-500 opacity-10 rounded-full blur-[150px] animate-spin" style={{animationDuration: '20s'}}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-sm relative z-10"
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 bg-gradient-to-br from-[#9b87f5] to-[#D946EF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/50"
                    >
                        <Zap className="w-8 h-8 text-white fill-current drop-shadow-2xl" />
                    </motion.div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#9b87f5] via-[#D946EF] to-[#7DD3FC] bg-clip-text text-transparent mb-2">Welcome Back</h1>
                    <p className="text-slate-300">Enter the grid and start your journey</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="glass-card p-6 backdrop-blur-2xl border-2 border-purple-500/20 shadow-2xl shadow-purple-500/20"
                >
                    {/* Error Display */}
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-4 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/30 rounded-xl text-red-300 text-sm font-medium backdrop-blur-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300 ml-1">EMAIL</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/95 border-2 border-purple-300/30 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none font-medium"
                                    placeholder="user@ridewise.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300 ml-1">PASSWORD</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/95 border-2 border-purple-300/30 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 px-6 bg-gradient-to-r from-[#9b87f5] via-[#D946EF] to-[#7DD3FC] text-white font-bold rounded-xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 flex items-center justify-center gap-2 mt-6 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    <span>Signing you in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-purple-500/20">
                        <p className="text-slate-400 text-sm">
                            New to RideWise?{' '}
                            <Link to="/signup" className="text-transparent bg-gradient-to-r from-[#9b87f5] to-[#D946EF] bg-clip-text font-bold hover:from-[#D946EF] hover:to-[#7DD3FC] transition-all">
                                Create Account →
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
