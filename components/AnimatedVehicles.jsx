import { motion } from 'framer-motion'
import { Bike, Car } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function AnimatedVehicles() {
    const { theme } = useTheme()
    
    const vehicles = [
        { id: 1, type: 'bike', delay: 0, duration: 20, yPos: 15 },
        { id: 2, type: 'car', delay: 3, duration: 24, yPos: 35 },
        { id: 3, type: 'bike', delay: 6, duration: 22, yPos: 55 },
        { id: 4, type: 'car', delay: 9, duration: 26, yPos: 75 },
        { id: 5, type: 'bike', delay: 12, duration: 20, yPos: 85 },
    ]

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {vehicles.map((vehicle) => (
                <motion.div
                    key={vehicle.id}
                    initial={{ x: '-100px', y: `${vehicle.yPos}%`, opacity: 0 }}
                    animate={{
                        x: 'calc(100vw + 100px)',
                        opacity: [0, 0.25, 0.25, 0],
                    }}
                    transition={{
                        duration: vehicle.duration,
                        delay: vehicle.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className={`absolute ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`}
                >
                    {vehicle.type === 'bike' ? (
                        <div className="flex flex-col items-center">
                            <Bike className="w-10 h-10 mb-1" strokeWidth={1.5} />
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Bike</div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Car className="w-12 h-12 mb-1" strokeWidth={1.5} />
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Car</div>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    )
}
