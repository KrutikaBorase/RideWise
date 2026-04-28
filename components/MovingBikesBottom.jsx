import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

export default function MovingBikesBottom() {
    const { theme } = useTheme()

    // Animation variants for bikes moving across screen at bottom
    const bikeVariants = {
        animate: (direction) => ({
            x: direction === 'left' ? ['-100vw', '100vw'] : ['100vw', '-100vw'],
            transition: {
                duration: Math.random() * 4 + 8, // 8-12 seconds
                repeat: Infinity,
                ease: 'linear'
            }
        })
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden">
            {/* Bikes moving left to right */}
            <motion.div
                custom="right"
                variants={bikeVariants}
                animate="animate"
                className="absolute bottom-4 left-0 text-5xl opacity-10"
            >
                🚴
            </motion.div>

            <motion.div
                custom="right"
                variants={bikeVariants}
                animate="animate"
                className="absolute bottom-4 left-0 text-6xl opacity-15"
                initial={{ x: '-200vw' }}
                style={{ animationDelay: '2s' }}
            >
                🏍️
            </motion.div>

            {/* Bikes moving right to left */}
            <motion.div
                custom="left"
                variants={bikeVariants}
                animate="animate"
                className="absolute bottom-6 right-0 text-5xl opacity-10"
                initial={{ x: '100vw' }}
            >
                🚴‍♂️
            </motion.div>

            <motion.div
                custom="left"
                variants={bikeVariants}
                animate="animate"
                className="absolute bottom-3 right-0 text-6xl opacity-15"
                initial={{ x: '200vw' }}
                style={{ animationDelay: '3s' }}
            >
                🏍️
            </motion.div>

            {/* Third bike for visual variety */}
            <motion.div
                custom="right"
                variants={bikeVariants}
                animate="animate"
                className="absolute bottom-5 left-0 text-5xl opacity-12"
                initial={{ x: '-150vw' }}
                style={{ animationDelay: '1s' }}
            >
                🚴‍♀️
            </motion.div>
        </div>
    )
}
