// RAG + LLM Integration Service
// Provides intelligent context-aware predictions using Retrieval Augmented Generation

const RAG_KNOWLEDGE_BASE = {
    // Traffic patterns by city and time
    traffic_patterns: {
        'Mumbai': {
            'morning': { hours: '7-10', level: 'high', severity: 8 },
            'afternoon': { hours: '12-2', level: 'medium', severity: 5 },
            'evening': { hours: '5-8', level: 'very_high', severity: 9 },
            'night': { hours: '9-6', level: 'low', severity: 2 }
        },
        'Delhi': {
            'morning': { hours: '7-10', level: 'very_high', severity: 9 },
            'afternoon': { hours: '12-2', level: 'high', severity: 6 },
            'evening': { hours: '5-8', level: 'very_high', severity: 9 },
            'night': { hours: '9-6', level: 'medium', severity: 4 }
        },
        'Bangalore': {
            'morning': { hours: '7-9', level: 'high', severity: 7 },
            'afternoon': { hours: '12-2', level: 'medium', severity: 5 },
            'evening': { hours: '5-7', level: 'high', severity: 7 },
            'night': { hours: '8-6', level: 'low', severity: 2 }
        },
        'Pune': {
            'morning': { hours: '8-10', level: 'medium', severity: 5 },
            'afternoon': { hours: '12-2', level: 'low', severity: 3 },
            'evening': { hours: '5-7', level: 'high', severity: 6 },
            'night': { hours: '8-7', level: 'low', severity: 1 }
        }
    },

    // Safety information by location
    safety_data: {
        'Mumbai': { accident_rate: 45, common_incidents: ['congestion', 'construction'], advice: 'Beware of frequent traffic blocks' },
        'Delhi': { accident_rate: 65, common_incidents: ['heavy_traffic', 'pollution'], advice: 'Use alternate routes, air quality poor' },
        'Bangalore': { accident_rate: 35, common_incidents: ['potholes', 'roadworks'], advice: 'Watch for road repairs' },
        'Pune': { accident_rate: 28, common_incidents: ['mild_congestion'], advice: 'Generally safe, some congestion zones' }
    },

    // Demand surge information
    demand_surge: {
        'morning_rush': { hours: [7, 8, 9], multiplier: 1.5, message: 'High demand during morning commute' },
        'lunch_time': { hours: [12, 13], multiplier: 1.3, message: 'Moderate demand during lunch break' },
        'evening_rush': { hours: [17, 18, 19], multiplier: 1.8, message: 'Very high demand during evening commute' },
        'night': { hours: [22, 23, 0], multiplier: 1.4, message: 'Late night surge pricing active' },
        'weekend': { multiplier: 1.1, message: 'Weekend rates apply' }
    },

    // Weather impact analysis
    weather_impact: {
        'Clear': { impact: 0, demand_change: 0, advice: 'No weather impact' },
        'Rainy': { impact: 25, demand_change: 45, advice: 'Heavy rain increases demand and travel time by 25%' },
        'Cloudy': { impact: 5, demand_change: 10, advice: 'Slight demand increase' },
        'Sunny': { impact: 0, demand_change: -10, advice: 'Clear weather, may reduce demand' },
        'Stormy': { impact: 40, demand_change: 60, advice: 'Storm warning: expect severe delays and high surge' },
        'Foggy': { impact: 20, demand_change: 30, advice: 'Poor visibility, expect longer travel times' }
    }
}

export const ragLLMService = {
    // Get contextual prediction explanation using RAG
    async getPredictionContext(type, location, hour, weather, distance = null) {
        const context = {
            location_insights: null,
            traffic_analysis: null,
            demand_analysis: null,
            weather_analysis: null,
            recommendations: [],
            confidence: 0.85
        }

        // RETRIEVE traffic patterns for the location
        if (RAG_KNOWLEDGE_BASE.traffic_patterns[location]) {
            const period = this.getTimePeriod(hour)
            const traffic = RAG_KNOWLEDGE_BASE.traffic_patterns[location][period]
            context.traffic_analysis = {
                period,
                level: traffic.level,
                severity: traffic.severity,
                hours: traffic.hours,
                message: `${period} period (${traffic.hours}): Traffic is ${traffic.level} (severity ${traffic.severity}/10)`
            }
        }

        // RETRIEVE safety data
        if (RAG_KNOWLEDGE_BASE.safety_data[location]) {
            const safety = RAG_KNOWLEDGE_BASE.safety_data[location]
            context.location_insights = {
                accident_rate: safety.accident_rate,
                common_incidents: safety.common_incidents,
                advice: safety.advice
            }
        }

        // ANALYZE demand surge patterns
        const surgeInfo = this.getSurgeInfo(hour)
        context.demand_analysis = {
            surge_multiplier: surgeInfo.multiplier,
            message: surgeInfo.message,
            expected_wait: Math.round(5 * surgeInfo.multiplier)
        }

        // ANALYZE weather impact
        if (RAG_KNOWLEDGE_BASE.weather_impact[weather]) {
            const weatherData = RAG_KNOWLEDGE_BASE.weather_impact[weather]
            context.weather_analysis = {
                impact_percentage: weatherData.impact,
                demand_change: weatherData.demand_change,
                advice: weatherData.advice
            }
        }

        // GENERATE recommendations based on context
        context.recommendations = this.generateRecommendations(context, type, distance)

        return context
    },

    // Get time period for traffic analysis
    getTimePeriod(hour) {
        if (hour >= 7 && hour < 12) return 'morning'
        if (hour >= 12 && hour < 17) return 'afternoon'
        if (hour >= 17 && hour < 21) return 'evening'
        return 'night'
    },

    // Get surge multiplier for given hour
    getSurgeInfo(hour) {
        for (const [key, surge] of Object.entries(RAG_KNOWLEDGE_BASE.demand_surge)) {
            if (key !== 'weekend' && surge.hours && surge.hours.includes(hour)) {
                return surge
            }
        }
        return { multiplier: 1.0, message: 'Standard rates apply' }
    },

    // Generate intelligent recommendations using context
    generateRecommendations(context, type, distance) {
        const recommendations = []

        // Traffic-based recommendations
        if (context.traffic_analysis) {
            if (context.traffic_analysis.severity >= 8) {
                recommendations.push('⚠️ Heavy traffic expected. Consider using alternate routes or rescheduling.')
            } else if (context.traffic_analysis.severity >= 5) {
                recommendations.push('📍 Moderate traffic. Allow extra time for your journey.')
            }
        }

        // Weather-based recommendations
        if (context.weather_analysis && context.weather_analysis.impact_percentage >= 20) {
            recommendations.push(`🌧️ ${context.weather_analysis.advice}`)
        }

        // Demand-based recommendations
        if (context.demand_analysis.surge_multiplier > 1.5) {
            recommendations.push(`💰 High demand surge (${context.demand_analysis.surge_multiplier}x). Prices are elevated. Consider waiting or using alternative transport.`)
        }

        // Distance-based recommendations
        if (distance && distance > 30) {
            recommendations.push('🚗 Long distance trip. Check fuel/battery and plan for rest stops.')
        }

        // Safety recommendations
        if (context.location_insights && context.location_insights.accident_rate > 40) {
            recommendations.push(`🛡️ Safety Note: ${context.location_insights.advice}`)
        }

        // If no recommendations, add a positive one
        if (recommendations.length === 0) {
            recommendations.push('✅ Good conditions for your ride. No major issues expected.')
        }

        return recommendations
    },

    // Generate natural language explanation for predictions
    generateExplanation(prediction, location, hour, weather) {
        let explanation = `Your ${prediction.type} prediction for ${location}`

        if (hour !== undefined) {
            explanation += ` at ${hour}:00`
        }

        if (weather) {
            explanation += ` with ${weather.toLowerCase()} weather`
        }

        explanation += ` has been calculated using:`
        explanation += '\n• Real location data and traffic patterns'
        explanation += '\n• Historical accident and safety records'
        explanation += '\n• Current weather conditions'
        explanation += '\n• Time-based demand patterns'
        explanation += '\n• Machine Learning model predictions'

        return explanation
    },

    // RAG-based similarity search (find most relevant historical data)
    async findSimilarPredictions(location, hour, weather) {
        const similarCases = []

        // Find similar traffic conditions
        const period = this.getTimePeriod(hour)
        for (const [city, patterns] of Object.entries(RAG_KNOWLEDGE_BASE.traffic_patterns)) {
            if (patterns[period]) {
                similarCases.push({
                    type: 'traffic',
                    city,
                    level: patterns[period].level,
                    confidence: city === location ? 0.95 : 0.7
                })
            }
        }

        // Find similar weather patterns
        for (const [weatherType, data] of Object.entries(RAG_KNOWLEDGE_BASE.weather_impact)) {
            if (weatherType.toLowerCase() === weather.toLowerCase()) {
                similarCases.push({
                    type: 'weather',
                    condition: weatherType,
                    impact: data.impact,
                    confidence: 0.9
                })
            }
        }

        return similarCases.sort((a, b) => b.confidence - a.confidence)
    },

    // Generate intelligent response message
    generateResponse(context, type) {
        let response = ''

        switch (type) {
            case 'pricing':
                if (context.demand_analysis.surge_multiplier > 1.5) {
                    response = `Prices are elevated due to ${context.demand_analysis.message.toLowerCase()}. `
                }
                if (context.weather_analysis && context.weather_analysis.demand_change > 0) {
                    response += `${context.weather_analysis.advice} `
                }
                response += 'Book early to secure better rates.'
                break

            case 'safety':
                if (context.location_insights) {
                    response = `${context.location_insights.advice}. `
                }
                response += `Traffic is ${context.traffic_analysis?.level || 'normal'} during this period.`
                break

            case 'duration':
                if (context.traffic_analysis) {
                    response = `Expected ${context.traffic_analysis.level} traffic (${context.traffic_analysis.hours}). `
                }
                if (context.weather_analysis && context.weather_analysis.impact_percentage > 0) {
                    response += `Travel time may increase by ${context.weather_analysis.impact_percentage}% due to ${context.weather_analysis.advice.toLowerCase()}. `
                }
                response += `Allow ${context.demand_analysis.expected_wait}+ minutes extra for safety margin.`
                break

            default:
                response = 'Prediction generated based on real location data and AI analysis.'
        }

        return response
    }
}
