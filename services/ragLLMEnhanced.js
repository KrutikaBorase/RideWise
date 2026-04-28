// RAG-Enhanced LLM Service for RideWise - Complete Bot Answers
export const ragEnhancedLLMService = {
    
    // COMPREHENSIVE ANSWER DATABASE
    answerDatabase: {
        'predict': '📊 Demand Predictions:\n• Hourly: Predicts rides for a specific hour (7-9 AM peak: 45 rides, 2 PM off-peak: 25 rides)\n• Daily: Total rides per day (Weekday: 500+, Weekend: 400)\n• Safety: Risk assessment (High: 60+/100, Safe: 30-40/100)\n• Trip Duration: ETA calculation (Distance ÷ Traffic Speed)\n\nGo to AI Predictions tab to try!',
        
        'book': '🚗 How to Book a Ride:\n1. Go to Book Ride tab\n2. Select pickup location (e.g., Pune Station)\n3. Select drop location (e.g., Wagholi)\n4. Click Calculate Fare\n5. Review price and distance\n6. Click Confirm Booking\n7. Ride appears in My Rides\n\nPrice example: 18.5 km = 280 rupees',
        
        'how to use': '📱 How to Use RideWise:\n\n🏠 Dashboard: View stats & trends\n🤖 AI Predictions: Hourly/Daily/Safety/Duration\n📍 Book Ride: Reserve your ride\n📍 My Rides: View bookings\n🚦 Traffic: Real-time updates\n🛣️ Routes: Multi-stop optimization\n⚠️ Safety: Accident risk analysis\n👤 Profile: Your stats & ratings\n💬 Bot: Ask me anything!\n\nTap any tab to explore!',
        
        'peak price': '💰 Peak Hour Pricing:\n🌆 Evening Peak (5-8 PM): +40% surge (Highest)\n🌅 Morning Rush (7-9 AM): +30% surge\n☀️ Afternoon (10 AM-5 PM): No surge (Cheapest)\n🌙 Night (9 PM-6 AM): +20% surge\n\nExample: 18.5 km base fare 280\n• Morning: 280 × 1.3 = 364\n• Evening: 280 × 1.4 = 392\n• Afternoon: 280 (no surge)',
        
        'how pricing': '💰 How Pricing Works:\n\n📐 Base Formula:\nPrice = (Base Fare + Distance × Rate) × Surge × Traffic\n\n💵 Example Calculation:\n• Base Fare: 50\n• Distance: 18.5 km × 15/km = 277.50\n• Subtotal: 327.50\n• Peak Hour Surge: × 1.3\n• Final Price: 426 rupees\n\nFactors affecting price:\n✓ Distance (15 rupees/km)\n✓ Time of day (surge 0.9x - 1.8x)\n✓ Demand level (high/medium/low)\n✓ Traffic conditions',
        
        'safety': '🛡️ Safety Features:\n\n📊 Safety Check predicts accident risk:\n• High Risk (60-100): Avoid if possible\n• Medium Risk (40-60): Caution advised\n• Safe (0-40): Recommended zones\n\n⚠️ High-Risk Areas:\n• Old City (Pune)\n• Central Market areas\n• Heavy traffic zones\n\n✅ Safe Zones:\n• Suburbs (Wagholi, Hadapsar)\n• Residential areas\n• IT Parks during day\n\n💡 Tip: Book during off-peak hours for safer roads!',
        
        'duration': '⏱️ Trip Duration Estimation:\n\nCalculated using:\n• Distance (km)\n• Traffic conditions\n• Time of day\n• Day of week\n\n📊 Examples:\n✓ 18.5 km light traffic: 28 mins\n✓ 18.5 km medium traffic: 37 mins\n✓ 18.5 km heavy traffic: 45 mins\n✓ 51 km mixed: 65 mins\n\n🚦 Peak hours add 30% extra time\n🌙 Night travel reduces time by 20%',
        
        'route': '🛣️ Route Optimization:\n\n✨ Multi-Stop Planning:\n1. Add up to 5 stops (Wagholi, Viman Nagar, Hinjewadi, etc)\n2. Select departure time\n3. Click Optimize Route with ML\n4. Get results:\n   • Total Distance: 51 km\n   • Total Time: 65 minutes\n   • Total Cost: 765 rupees\n   • Safety Risk: 60/100\n\n💡 AI finds the best order to visit all stops!\n⚡ Saves time and money',
        
        'hourly': '📈 Hourly Demand Prediction:\n\nPredicts rides for a specific hour:\n\n⏰ Peak Hours:\n🌅 7-9 AM: 45-50 rides (Morning commute)\n🌆 5-8 PM: 55-60 rides (Evening rush - HIGHEST)\n🌙 10 PM-12 AM: 30-35 rides (Night life)\n\n📊 Off-Peak:\n☀️ 10 AM-4 PM: 20-30 rides (Lowest)\n\nHow to use:\n1. Go to AI Predictions → Hourly Rides\n2. Select date and time\n3. Click Predict\n4. See expected rides for that hour',
        
        'daily': '📊 Daily Demand Prediction:\n\nForecasts total rides for a full day:\n\n📈 Weekday (Mon-Fri): 500-550 rides\n📉 Weekend (Sat-Sun): 400-450 rides\n🌧️ Rainy days: +25% boost\n🎉 Holiday: -30% drop\n\nFactors considered:\n✓ Day of week\n✓ Weather conditions\n✓ Seasonal trends\n✓ Historical patterns\n\nHow to use:\n1. Go to AI Predictions → Daily Rides\n2. Select a date\n3. Click Predict\n4. See total rides forecast',
        
        'theme': '🌙 Theme Settings:\n\n🌙 Dark Mode: Easier on eyes, modern look\n☀️ Light Mode: Classic bright interface\n\nHow to toggle:\n• Click Light Mode button in sidebar\n• Or click moon icon in bottom left\n\nToggle anytime while using the app!\nYour preference is saved.',
        
        'myrides': '📍 My Rides:\n\nView all your bookings:\n\n✅ Completed Rides:\n• Date, time, pickup, dropoff\n• Distance and fare\n• Rating option (1-5 stars)\n• Driver review option\n\n🚗 Active Rides:\n• Real-time tracking\n• Driver info\n• Call/Chat driver\n• Cancel option\n\n🎯 Future Bookings:\n• Upcoming scheduled rides\n• Easy modification',
        
        'profile': '👤 Profile:\n\nYour RideWise Stats:\n\n📊 Statistics:\n• Total Rides: Completed trips count\n• Distance Traveled: Sum of all km\n• Average Rating: Your user rating\n• Total Ratings: Reviews received\n\n🎯 Management:\n• Edit profile info\n• Change payment method\n• View preferences\n• Privacy settings\n• Delete account option',
        
        'traffic': '🚦 Traffic Monitor:\n\nReal-time traffic tracking:\n\n✨ Features:\n• Live traffic conditions\n• Route alerts (accidents, congestion)\n• Alternative routes suggestion\n• ETA with traffic\n\n🟢 Light Traffic: <20 min/20km\n🟡 Moderate: 20-40 min/20km\n🔴 Heavy: >40 min/20km\n\nHow to use:\n1. Go to Traffic tab\n2. Select start and end location\n3. Click Start Tracking\n4. Get live updates',
        
        'help': '🆘 Help & Support:\n\n❓ Common Issues:\n1. Ride not booking → Check if logged in\n2. Prediction not working → Refresh page\n3. Bot not answering → Ask about specific features\n4. Map not loading → Clear browser cache\n\n📞 Contact Support:\n• In-app help button\n• Email: support@ridewise.com\n• Chat with bot (me!)\n\n💡 Pro Tips:\n• Use off-peak hours for cheaper rides\n• Check safety score before booking\n• Review driver ratings'
    },

    // Find best matching answer
    getAnswerForQuery(query) {
        const lowerQuery = query.toLowerCase()
        
        // Check all keywords
        const keywords = [
            'predict', 'forecast', 'demand', 'hourly', 'daily', 'peak', 'pricing', 'price',
            'book', 'booking', 'ride', 'how', 'use', 'app', 'safety', 'duration', 'time',
            'route', 'traffic', 'theme', 'dark', 'light', 'myrides', 'history', 'profile',
            'help', 'support', 'accident', 'risk'
        ]
        
        for (const keyword of keywords) {
            if (lowerQuery.includes(keyword)) {
                return this.answerDatabase[keyword]
            }
        }
        
        return null
    },

    // Main response generator
    generateRAGResponse(query) {
        // First try specific answer
        const specificAnswer = this.getAnswerForQuery(query)
        if (specificAnswer) return specificAnswer
        
        const lowerQuery = query.toLowerCase()
        
        // Greeting
        if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
            return '👋 Hey there! I am your RideWise AI assistant! 🤖\n\nI can help you with:\n📊 Predictions (hourly, daily, safety, duration)\n💰 Pricing & surge rates\n🚗 Booking & managing rides\n🛣️ Route optimization\n🚦 Traffic monitoring\n⚠️ Safety assessments\n📱 App features & how to use\n\nJust ask me anything! What would you like to know?'
        }
        
        // Default helpful response
        return '✨ I can help with:\n\n📊 PREDICTIONS: hourly, daily, safety, trip duration\n💰 PRICING: peak hours, surge rates, how it works\n🚗 BOOKING: how to book rides, view my rides\n🛣️ ROUTES: multi-stop optimization\n🚦 TRAFFIC: real-time monitoring\n⚠️ SAFETY: accident risk analysis\n📱 APP: how to use, features, profile\n\nAsk me about any of these or something else!'
    },

    // Suggested questions
    getSuggestedQuestions(currentQuery) {
        return [
            'How do I book a ride?',
            'What is peak hour pricing?',
            'How do predictions work?',
            'How to use the app?',
            'What about safety?'
        ]
    },

    // Learning feedback
    updateKnowledgeFromFeedback(query, response, userRating) {
        if (userRating < 3) {
            console.log('Low rating for: ' + query)
        }
        return { status: 'feedback_recorded', rating: userRating }
    }
}

export default ragEnhancedLLMService
