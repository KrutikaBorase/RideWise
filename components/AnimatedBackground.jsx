import { motion } from 'framer-motion'
import { Bike, Car } from 'lucide-react'

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none opacity-10 overflow-hidden">
            {/* Animated Bikes */}
            <motion.div
                animate={{ x: [-100, window.innerWidth + 100], y: [100, 80, 100] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4"
            >
                <Bike className="w-12 h-12 text-cyan-500" />
            </motion.div>
            
            <motion.div
                animate={{ x: [-100, window.innerWidth + 100], y: [300, 320, 300] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 5 }}
                className="absolute top-1/2"
            >
                <Car className="w-16 h-16 text-blue-500" />
            </motion.div>
            
            <motion.div
                animate={{ x: [-100, window.innerWidth + 100], y: [500, 480, 500] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 10 }}
                className="absolute top-3/4"
            >
                <Bike className="w-10 h-10 text-purple-500" />
            </motion.div>
        </div>
    )
}
