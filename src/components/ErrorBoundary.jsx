import React from 'react'

/**
 * PHASE 3 — ERROR BOUNDARY
 * 
 * Minimal Error Boundary to catch render-time exceptions
 * Prevents full white-screen crashes
 * Logs errors clearly without changing UX
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // PHASE 3 — ERROR BOUNDARY: Update state so next render shows fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // PHASE 3 — ERROR BOUNDARY: Log error details for debugging
    console.error('❌ PHASE 3 — ERROR BOUNDARY: Caught render error:', {
      error: error,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // PHASE 3 — ERROR BOUNDARY: Minimal error UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-red-200 p-8 max-w-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
                <p className="text-sm text-slate-500">An unexpected error occurred</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-700 mb-2">
                The application encountered an error and couldn't recover. Please try:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Logging out and back in</li>
              </ul>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <summary className="cursor-pointer font-medium text-sm text-slate-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-xs text-slate-600 space-y-2 font-mono">
                  <div>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
