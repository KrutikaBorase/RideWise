import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function LoadingScreen() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center">
            <div className="text-center">
                {/* Animated Logo */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="flex justify-center mb-8"
                >
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-600 p-4 rounded-full">
                        <Zap className="w-12 h-12 text-white" />
                    </div>
                </motion.div>

                {/* Text */}
                <h1 className="text-4xl font-bold text-white mb-2">RideWise</h1>
                <p className="text-cyan-300 text-lg mb-8">AI Fleet Management System</p>

                {/* Loading Animation */}
                <div className="flex gap-2 justify-center mb-8">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -20, 0] }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-3 h-3 bg-cyan-400 rounded-full"
                        />
                    ))}
                </div>

                <p className="text-gray-400 text-sm">Initializing your experience...</p>
            </div>
        </div>
    )
}
