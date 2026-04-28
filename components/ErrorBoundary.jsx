import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-red-200 dark:border-red-900">
                        <div className="flex justify-center mb-4">
                            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
                                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                            We encountered an unexpected error. Don't worry, we're on it!
                        </p>
                        
                        {this.state.error && (
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4 max-h-32 overflow-auto">
                                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-words">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>
                            <a
                                href="/"
                                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                <Home className="w-5 h-5" />
                                Go to Home
                            </a>
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                            Error ID: {Date.now()}
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
