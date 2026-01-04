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
        <div className="min-h-screen bg-[#06060a] flex items-center justify-center p-6 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[rgba(239,68,68,0.06)] blur-[120px] pointer-events-none" />
          
          <div className="relative bg-[rgba(12,12,18,0.95)] backdrop-blur-2xl rounded-3xl border border-[rgba(239,68,68,0.2)] p-8 max-w-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(239,68,68,0.1)]">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ef4444]/40 to-transparent" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[rgba(239,68,68,0.2)] to-[rgba(239,68,68,0.1)] rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(239,68,68,0.15)]">
                <svg className="w-7 h-7 text-[#f87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#f0f0f5]">Something went wrong</h1>
                <p className="text-[14px] text-[#6b6b7b] mt-0.5">An unexpected error occurred</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-[14px] text-[#9898a8] mb-3">
                The application encountered an error and couldn't recover. Please try:
              </p>
              <ul className="list-disc list-inside text-[13px] text-[#6b6b7b] space-y-1.5 ml-2">
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Logging out and back in</li>
              </ul>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-[#0a0a0f] rounded-2xl border border-[rgba(255,255,255,0.06)]">
                <summary className="cursor-pointer font-medium text-[13px] text-[#9898a8] mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-[12px] text-[#6b6b7b] space-y-2 font-mono">
                  <div>
                    <strong className="text-[#9898a8]">Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-[#9898a8]">Component Stack:</strong>
                      <pre className="mt-2 whitespace-pre-wrap overflow-x-auto text-[#4a4a58]">
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
                className="px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[13px] font-medium rounded-xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[rgba(255,255,255,0.05)] text-[#9898a8] text-[13px] font-medium rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200"
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
