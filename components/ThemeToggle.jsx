import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        // Check initial preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
            setIsDark(true)
        } else {
            document.documentElement.classList.remove('dark')
            setIsDark(false)
        }
    }, [])

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark')
            localStorage.theme = 'light'
            setIsDark(false)
        } else {
            document.documentElement.classList.add('dark')
            localStorage.theme = 'dark'
            setIsDark(true)
        }
    }

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative w-14 h-8 rounded-full flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50
        ${isDark ? 'bg-slate-700' : 'bg-blue-200'}
      `}
            aria-label="Toggle Theme"
        >
            <motion.div
                className={`w-6 h-6 rounded-full shadow-md transform flex items-center justify-center transition-transform duration-300 ${isDark ? 'translate-x-7 bg-[#1A1F2C]' : 'translate-x-1 bg-white'}`}
                layout
            >
                {isDark ? (
                    <Moon className="w-3 h-3 text-[#9b87f5]" />
                ) : (
                    <Sun className="w-3 h-3 text-orange-500" />
                )}
            </motion.div>
        </button>
    )
}
