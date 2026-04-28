import { useTheme } from '../context/ThemeContext'
import AnimatedVehicles from './AnimatedVehicles'

export default function PageWrapper({ children, showVehicles = true }) {
    const { theme } = useTheme()

    return (
        <div className={`flex-1 md:ml-64 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Animated Background Vehicles */}
            {showVehicles && <AnimatedVehicles />}

            {/* Main Content Area */}
            <div className="relative flex flex-col min-h-screen w-full">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto">
                    <div className={`min-h-screen p-4 md:p-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
