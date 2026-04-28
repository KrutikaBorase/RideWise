import { useState } from 'react'
import { Calendar, Clock, Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const InteractiveFilters = ({ onFilterChange, initialFilters = {} }) => {
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        date: initialFilters.date || new Date().toISOString().split('T')[0],
        startTime: initialFilters.startTime || '08:00',
        endTime: initialFilters.endTime || '20:00',
        dayOfWeek: initialFilters.dayOfWeek || 'all',
        weatherCondition: initialFilters.weatherCondition || 'all',
        trafficLevel: initialFilters.trafficLevel || 'all'
    })

    const daysOfWeek = [
        { value: 'all', label: 'All Days' },
        { value: '1', label: 'Monday' },
        { value: '2', label: 'Tuesday' },
        { value: '3', label: 'Wednesday' },
        { value: '4', label: 'Thursday' },
        { value: '5', label: 'Friday' },
        { value: '6', label: 'Saturday' },
        { value: '0', label: 'Sunday' }
    ]

    const weatherOptions = [
        { value: 'all', label: 'All Weather' },
        { value: '1', label: 'Clear' },
        { value: '2', label: 'Cloudy' },
        { value: '3', label: 'Light Rain' },
        { value: '4', label: 'Heavy Rain' }
    ]

    const trafficOptions = [
        { value: 'all', label: 'All Traffic' },
        { value: 'low', label: 'Light Traffic' },
        { value: 'medium', label: 'Moderate Traffic' },
        { value: 'high', label: 'Heavy Traffic' }
    ]

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    const handleReset = () => {
        const resetFilters = {
            date: new Date().toISOString().split('T')[0],
            startTime: '08:00',
            endTime: '20:00',
            dayOfWeek: 'all',
            weatherCondition: 'all',
            trafficLevel: 'all'
        }
        setFilters(resetFilters)
        onFilterChange(resetFilters)
    }

    const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length - 3 // Exclude date and times

    return (
        <div className="relative">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
            >
                <Filter className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Filters</span>
                {activeFiltersCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-lg">Filter Options</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Date Picker */}
                            <div>
                                <label className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => handleFilterChange('date', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                                        <Clock className="w-4 h-4" />
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={filters.startTime}
                                        onChange={(e) => handleFilterChange('startTime', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-300 text-sm mb-2 block">End Time</label>
                                    <input
                                        type="time"
                                        value={filters.endTime}
                                        onChange={(e) => handleFilterChange('endTime', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Day of Week */}
                            <div>
                                <label className="text-gray-300 text-sm mb-2 block">Day of Week</label>
                                <select
                                    value={filters.dayOfWeek}
                                    onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {daysOfWeek.map(day => (
                                        <option key={day.value} value={day.value}>{day.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Weather Condition */}
                            <div>
                                <label className="text-gray-300 text-sm mb-2 block">Weather Condition</label>
                                <select
                                    value={filters.weatherCondition}
                                    onChange={(e) => handleFilterChange('weatherCondition', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {weatherOptions.map(weather => (
                                        <option key={weather.value} value={weather.value}>{weather.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Traffic Level */}
                            <div>
                                <label className="text-gray-300 text-sm mb-2 block">Traffic Level</label>
                                <select
                                    value={filters.trafficLevel}
                                    onChange={(e) => handleFilterChange('trafficLevel', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {trafficOptions.map(traffic => (
                                        <option key={traffic.value} value={traffic.value}>{traffic.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default InteractiveFilters
