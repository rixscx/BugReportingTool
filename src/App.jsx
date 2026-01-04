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
  const { session, userProfile, loading, isAdmin } = useAuth()

  if (loading) {
    return <PageLoader />
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
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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

