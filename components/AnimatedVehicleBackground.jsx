import { motion } from 'framer-motion'
import { Bike, Car } from 'lucide-react'

export default function AnimatedVehicleBackground() {
    const bikes = Array.from({ length: 3 }, (_, i) => ({
        id: `bike-${i}`,
        delay: i * 4,
        duration: 8 + i,
        size: 24 + i * 4
    }))

    const cars = Array.from({ length: 2 }, (_, i) => ({
        id: `car-${i}`,
        delay: i * 5 + 1,
        duration: 10 + i,
        size: 32 + i * 4
    }))

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Bikes */}
            {bikes.map(bike => (
                <motion.div
                    key={bike.id}
                    className="absolute opacity-5 dark:opacity-8"
                    initial={{ x: -100, y: Math.random() * 30 + '%' }}
                    animate={{ x: '110vw', y: Math.random() * 30 + '%' }}
                    transition={{
                        duration: bike.duration,
                        delay: bike.delay,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <Bike 
                        size={bike.size} 
                        className="text-cyan-500 dark:text-cyan-400"
                        strokeWidth={1.5}
                    />
                </motion.div>
            ))}

            {/* Cars */}
            {cars.map(car => (
                <motion.div
                    key={car.id}
                    className="absolute opacity-4 dark:opacity-6"
                    initial={{ x: -150, y: Math.random() * 40 + 40 + '%' }}
                    animate={{ x: '110vw', y: Math.random() * 40 + 40 + '%' }}
                    transition={{
                        duration: car.duration,
                        delay: car.delay,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <Car 
                        size={car.size} 
                        className="text-blue-500 dark:text-blue-400"
                        strokeWidth={1.5}
                    />
                </motion.div>
            ))}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/0 dark:via-gray-900/0 to-white dark:to-gray-950" />
        </div>
    )
}
