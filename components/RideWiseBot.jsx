import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react'
import ragEnhancedLLMService from '../services/ragLLMEnhanced'

export default function RideWiseBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: "👋 Hi! I'm your RideWise AI assistant powered by RAG. Ask me anything about using the app!",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = () => {
        if (!input.trim()) return
        
        try {
            // Add user message
            const userMsg = {
                type: 'user',
                text: input,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, userMsg])
            setSuggestions([])
            setInput('')
            setIsTyping(true)
            
            // Get RAG response with context
            setTimeout(() => {
                try {
                    const botResponse = ragEnhancedLLMService.generateRAGResponse(input)
                    const suggestedQuestions = ragEnhancedLLMService.getSuggestedQuestions(input)
                    
                    const botMsg = {
                        type: 'bot',
                        text: botResponse,
                        timestamp: new Date(),
                        messageId: Date.now()
                    }
                    setMessages(prev => [...prev, botMsg])
                    setSuggestions(suggestedQuestions)
                    setIsTyping(false)
                } catch (err) {
                    console.error('Bot response error:', err)
                    const errorMsg = {
                        type: 'bot',
                        text: 'I encountered an issue generating a response. Please try again.',
                        timestamp: new Date(),
                        messageId: Date.now()
                    }
                    setMessages(prev => [...prev, errorMsg])
                    setIsTyping(false)
                }
            }, 800 + Math.random() * 400)
        } catch (err) {
            console.error('Send message error:', err)
            setIsTyping(false)
        }
    }

    const handleRating = (messageId, rating) => {
        try {
            const lastUserMsg = messages
                .slice()
                .reverse()
                .find(m => m.type === 'user')
            
            if (lastUserMsg && messageId) {
                ragEnhancedLLMService.updateKnowledgeFromFeedback(
                    lastUserMsg.text,
                    messages.find(m => m.messageId === messageId)?.text || '',
                    rating
                )
            }
        } catch (err) {
            console.error('Rating error:', err)
        }
    }

    const handleSuggestion = (suggestion) => {
        setInput(suggestion)
        setTimeout(() => {
            const event = new KeyboardEvent('keypress', { key: 'Enter' })
            document.querySelector('input[placeholder="Ask me anything..."]')?.dispatchEvent(event)
        }, 50)
    }

    const quickQuestions = [
        "How do I book a ride?",
        "What ML models do you have?",
        "How does pricing work?",
        "What are peak hours?"
    ]

    return (
        <>
            {/* Floating Bot Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all"
                >
                    <div className="relative">
                        <Bot className="w-6 h-6" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                        />
                    </div>
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-gray-900 dark:bg-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Bot className="w-8 h-8 text-white" />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute -top-1 -right-1"
                                    >
                                        <Sparkles className="w-4 h-4 text-yellow-300" />
                                    </motion.div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">RideWise AI</h3>
                                    <p className="text-xs text-white/70">RAG-powered assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800/50 dark:bg-gray-800/50">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`${msg.type === 'user' ? 'max-w-[80%]' : 'max-w-[85%]'}`}>
                                        <div className={`rounded-2xl px-4 py-2 ${
                                            msg.type === 'user'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-700 text-white'
                                        }`}>
                                            {msg.type === 'bot' && (
                                                <Bot className="w-4 h-4 inline mr-2 text-indigo-400" />
                                            )}
                                            <span className="text-sm">{msg.text}</span>
                                        </div>
                                        
                                        {/* Rating buttons for bot messages */}
                                        {msg.type === 'bot' && msg.messageId && (
                                            <div className="flex gap-2 mt-2 px-1">
                                                <button
                                                    onClick={() => handleRating(msg.messageId, 1)}
                                                    className="text-xs text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1"
                                                >
                                                    <ThumbsUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleRating(msg.messageId, -1)}
                                                    className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                                                >
                                                    <ThumbsDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-gray-700 rounded-2xl px-4 py-2">
                                        <div className="flex gap-1">
                                            <motion.div
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                className="w-2 h-2 bg-indigo-400 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                className="w-2 h-2 bg-indigo-400 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                                className="w-2 h-2 bg-indigo-400 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="px-4 py-2 bg-gray-800/50 border-t border-white/5">
                                <p className="text-xs text-white/50 mb-2">Follow-up questions:</p>
                                <div className="flex flex-col gap-1">
                                    {suggestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestion(q)}
                                            className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-2 rounded-lg transition-all text-left"
                                        >
                                            💡 {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Questions */}
                        {messages.length === 1 && (
                            <div className="px-4 py-2 bg-gray-800/30 border-t border-white/5">
                                <p className="text-xs text-white/50 mb-2">Quick questions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestion(q)}
                                            className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1 rounded-full transition-all"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 bg-gray-900 dark:bg-gray-900 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-xl transition-all"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
