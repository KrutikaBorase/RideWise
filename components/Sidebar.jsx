import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    LogOut,
    Menu,
    BarChart3,
    X,
    User,
    History,
    MapPin,
    Car,
    Navigation,
    TrendingUp,
    Brain,
    Settings,
    Sun,
    Moon
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function Sidebar() {
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [userRole, setUserRole] = useState('user')

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('ridewise_user') || '{}')
        setUserRole(user.role || 'user')
    }, [location.pathname])

    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

    const baseMenuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/ml-predictions', label: 'AI Predictions', icon: Brain },
        { path: '/demand-heatmap', label: 'Heatmap', icon: TrendingUp },
        { path: '/book-ride', label: 'Book Ride', icon: Car },
        { path: '/ride-history', label: 'My Rides', icon: History },
        { path: '/traffic-monitor', label: 'Traffic', icon: Navigation },
        { path: '/route-optimizer', label: 'Routes', icon: MapPin },
        { path: '/profile', label: 'Profile', icon: User },
    ]

    const driverMenuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/driver-profile', label: 'Driver Profile', icon: User },
        { path: '/ml-predictions', label: 'AI Predictions', icon: Brain },
        { path: '/demand-heatmap', label: 'Heatmap', icon: TrendingUp },
        { path: '/ride-history', label: 'Ride History', icon: History },
        { path: '/traffic-monitor', label: 'Traffic', icon: Navigation },
        { path: '/route-optimizer', label: 'Routes', icon: MapPin },
    ]

    const menuItems = userRole === 'driver' ? driverMenuItems : baseMenuItems

    const handleLogout = () => {
        localStorage.removeItem('ridewise_user')
        localStorage.removeItem('ridewise_token')
        window.location.href = '/login'
    }

    return (
        <>
            {/* Mobile Menu Trigger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-card border border-border rounded-xl shadow-sm text-foreground transition-transform active:scale-95"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/50 z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`
                    ${mobileOpen ? 'fixed' : 'hidden md:flex'} md:fixed md:left-0 md:top-0
                    flex flex-col z-50 bg-card border-r border-border
                    w-64 h-screen
                    overflow-y-auto custom-scrollbar
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Navigation</h2>
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden p-2 hover:bg-secondary rounded-lg text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Menu */}
                <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon

                        return (
                            <Link to={item.path} key={item.path}>
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                        }
                                    `}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </motion.div>
                            </Link>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t space-y-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group ${
                            theme === 'dark'
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-700'
                        }`}
                        title="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-5 h-5" />
                                <span className="text-sm font-medium">Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-5 h-5" />
                                <span className="text-sm font-medium">Dark Mode</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group ${
                            theme === 'dark'
                                ? 'text-red-400 hover:bg-red-950/20'
                                : 'text-red-600 hover:bg-red-50'
                        }`}
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>

                    <div className={`text-center text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        v2.0.4 • RideWise Inc.
                    </div>
                </div>
            </motion.div>
        </>
    )
}
