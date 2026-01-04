import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(isSupabaseConfigured ? null : 'Application not configured. Please contact administrator.')
  const [success, setSuccess] = useState(null)

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' }
    let score = 0
    if (pass.length >= 6) score++
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' }
    if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' }
    if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-500' }
    return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!supabase) {
      setError('Application not configured')
      return
    }
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      })

      if (error) throw error

      setSuccess('Password reset link sent! Check your email inbox.')
      setIsForgotPassword(false)
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError('Application not configured')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // PHASE A – OAuth Redirect Hardening: Detect localhost vs production
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const redirectUrl = isLocalhost ? window.location.origin + '/' : 'https://bugtracker-vercel.vercel.app/'

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
      // Note: Profile creation happens in useAuth after OAuth callback via session listener
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (!supabase) {
      setError('Application not configured')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        // IDENTITY INVARIANT: Never query by email; Supabase auth.signUp handles duplicates
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        })

        if (signUpError) throw signUpError

        if (data.user && !data.user.identities?.length) {
          throw new Error('ACCOUNT_EXISTS')
        }

        if (data.user) {
          // Profiles are created by DB trigger; do not insert from frontend.
          setSuccess('Account created! You can now sign in.')
          setIsSignUp(false)
          setEmail('')
          setPassword('')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
      }
    } catch (err) {
      let message = err.message || 'An unexpected error occurred'

      if (message === 'ACCOUNT_EXISTS' || message.includes('User already registered')) {
        message = 'An account with this email already exists. Please sign in instead.'
      } else if (message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please try again.'
      } else if (message.includes('Password should be') || message.includes('at least')) {
        message = 'Password must be at least 6 characters long.'
      } else if (message.includes('valid email')) {
        message = 'Please enter a valid email address.'
      } else if (message.includes('pwned') || message.includes('leaked') || message.includes('breach')) {
        message = 'This password has been found in a data breach. Please choose a different password.'
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06060a] flex relative overflow-hidden">
      {/* Full-page ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-[rgba(99,102,241,0.08)] to-transparent rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3 animate-breathe" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-[rgba(139,92,246,0.06)] to-transparent rounded-full blur-[120px] translate-x-1/4 translate-y-1/4 animate-breathe" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[rgba(99,102,241,0.03)] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Left side - Branding (fluid, no box) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 xl:p-16 flex-col justify-between relative">
        {/* Flowing gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.05)] via-transparent to-[rgba(139,92,246,0.03)]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo-buggy.svg" alt="Cpt Buggy" className="w-14 h-14" />
            <span className="text-2xl font-bold text-[#f0f0f5] tracking-tight">Cpt Buggy</span>
          </div>
        </div>

        <div className="space-y-10 relative z-10 max-w-lg">
          <div className="space-y-6">
            <h1 className="text-5xl xl:text-6xl font-bold text-[#f0f0f5] leading-[1.1] tracking-tight">
              Squash bugs,<br />
              <span className="bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#eab308] bg-clip-text text-transparent">sail smooth.</span>
            </h1>
            <p className="text-lg text-[#6b6b7b] leading-relaxed">
              A flashy and powerful bug tracking tool for crews who want to conquer the Grand Line of software.
            </p>
          </div>

          {/* Floating stats - no boxes, just organic layout */}
          <div className="flex gap-12 pt-6">
            <div>
              <div className="text-4xl font-bold text-[#f0f0f5]">99%</div>
              <div className="text-sm text-[#4a4a58] mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#f0f0f5]">10k+</div>
              <div className="text-sm text-[#4a4a58] mt-1">Bugs Squashed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#f0f0f5]">500+</div>
              <div className="text-sm text-[#4a4a58] mt-1">Crews</div>
            </div>
          </div>
        </div>

        <div className="text-[#3a3a48] text-sm relative z-10">
          © 2026 Cpt Buggy. All rights reserved.
        </div>
      </div>

      {/* Right side - Form (fluid, minimal container) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img src="/logo-buggy.svg" alt="Cpt Buggy" className="w-12 h-12" />
            <span className="text-xl font-bold text-[#f0f0f5] tracking-tight">Cpt Buggy</span>
          </div>

          {/* Form area - minimal styling, fluid */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#f0f0f5] tracking-tight">
                {isForgotPassword ? 'Reset password' : isSignUp ? 'Create account' : 'Welcome back'}
              </h2>
              <p className="text-[#6b6b7b] mt-3">
                {isForgotPassword ? "We'll send you a reset link" : isSignUp ? 'Start tracking bugs today' : 'Sign in to continue'}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.12)] text-[#f87171] text-sm animate-shake">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.12)] text-[#4ade80] text-sm animate-pop">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Forgot Password Form */}
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-[#9898a8] mb-2.5 tracking-wide">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-[rgba(12,12,18,0.6)] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[#f0f0f5] placeholder-[#4a4a58] text-[15px] focus:outline-none focus:border-[rgba(99,102,241,0.4)] focus:bg-[rgba(12,12,18,0.8)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all duration-300"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative px-6 py-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-sm font-medium rounded-2xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#818cf8] to-[#a78bfa] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2.5">
                    {loading && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false)
                    setError(null)
                  }}
                  className="w-full text-[#6b6b7b] hover:text-[#9898a8] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to sign in
                </button>
              </form>
            ) : (
              /* Sign In / Sign Up Form */
              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-[#9898a8] mb-2.5 tracking-wide">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-[rgba(12,12,18,0.6)] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[#f0f0f5] placeholder-[#4a4a58] text-[15px] focus:outline-none focus:border-[rgba(99,102,241,0.4)] focus:bg-[rgba(12,12,18,0.8)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all duration-300"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-xs font-medium text-[#9898a8] tracking-wide">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true)
                          setError(null)
                          setSuccess(null)
                        }}
                        className="text-xs text-[#818cf8] hover:text-[#a5b4fc] font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-4 pr-12 bg-[rgba(12,12,18,0.6)] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[#f0f0f5] placeholder-[#4a4a58] text-[15px] focus:outline-none focus:border-[rgba(99,102,241,0.4)] focus:bg-[rgba(12,12,18,0.8)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all duration-300"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a4a58] hover:text-[#6b6b7b] p-1.5 rounded-xl transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {isSignUp && password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.score <= 1 ? 'text-red-400' :
                          passwordStrength.score <= 2 ? 'text-orange-400' :
                            passwordStrength.score <= 3 ? 'text-yellow-400' :
                              'text-green-400'
                          }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#4a4a58]">
                        Use 8+ characters with uppercase, numbers & symbols
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative px-6 py-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-sm font-medium rounded-2xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 flex items-center justify-center gap-2.5 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#818cf8] to-[#a78bfa] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2.5">
                    {loading && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                  </span>
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(255,255,255,0.06)]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-[#06060a] text-[#4a4a58]">or continue with</span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full px-5 py-4 bg-[rgba(12,12,18,0.6)] border border-[rgba(255,255,255,0.08)] text-[#9898a8] rounded-2xl text-sm font-medium hover:bg-[rgba(12,12,18,0.8)] hover:border-[rgba(255,255,255,0.15)] hover:text-[#f0f0f5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
              </form>
            )}

            {!isForgotPassword && (
              <div className="pt-6 text-center">
                <span className="text-[#6b6b7b] text-sm">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                </span>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setSuccess(null)
                    setPassword('')
                  }}
                  className="text-[#818cf8] hover:text-[#a5b4fc] text-sm font-medium transition-colors"
                >
                  {isSignUp ? 'Sign In' : 'Create one'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
