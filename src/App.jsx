import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth, AuthProvider } from './hooks/useAuth'
import { useBugs } from './hooks/useBugs'
import { ToastProvider } from './components/Toast'
import { PageLoader } from './components/Skeleton'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { QuickActions } from './components/QuickActions'
import { initWatermark } from './lib/watermark'
import ErrorBoundary from './components/ErrorBoundary' // PHASE 3 — ERROR BOUNDARY
import Auth from './components/Auth'
import Navbar from './components/Navbar'
import { AnimatePresence } from './lib/motion'

// Lazy load pages for code splitting
const Notice = lazy(() => import('./pages/Notice'))
const Issue = lazy(() => import('./pages/Issue'))
const BugDetail = lazy(() => import('./pages/BugDetail'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const Logs = lazy(() => import('./pages/Logs'))

if (typeof window !== 'undefined') {
  initWatermark()
}

function AuthenticatedApp({ session, userProfile, isAdmin }) {
  const { bugs } = useBugs()
  const location = useLocation()

  return (
    <>
      <Navbar
        session={session}
        userProfile={userProfile}
        isAdmin={isAdmin}
      />
      <main className="min-h-[calc(100vh-56px)]">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Notice />} />
              <Route path="/issue" element={<Issue session={session} />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route
                path="/bug/:id"
                element={<BugDetail session={session} isAdmin={isAdmin} />}
              />
              <Route path="/logs" element={<Logs />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <KeyboardShortcutsHelp />
      <QuickActions bugs={bugs} />
    </>
  )
}

function AppContent() {
  const { session, userProfile, loading, isAdmin, configError } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  // Show configuration error if Supabase is not set up
  if (configError) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center p-6">
        <div className="bg-[rgba(12,12,18,0.95)] backdrop-blur-2xl rounded-3xl border border-[rgba(239,68,68,0.2)] p-8 max-w-lg text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-[rgba(239,68,68,0.2)] to-[rgba(239,68,68,0.1)] rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-[#f87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#f0f0f5] mb-2">Configuration Error</h1>
          <p className="text-[#9898a8] text-sm mb-4">{configError}</p>
          <p className="text-[#6b6b7b] text-xs">Please check your Vercel environment variables.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/auth/callback" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <AuthenticatedApp
      session={session}
      userProfile={userProfile}
      isAdmin={isAdmin}
    />
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

