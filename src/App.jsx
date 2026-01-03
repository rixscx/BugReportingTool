import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useBugs } from './hooks/useBugs'
import { ToastProvider } from './components/Toast'
import { PageLoader } from './components/Skeleton'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { QuickActions } from './components/QuickActions'
import { initWatermark } from './lib/watermark'
import ErrorBoundary from './components/ErrorBoundary' // PHASE 3 — ERROR BOUNDARY
import Auth from './components/Auth'
import Navbar from './components/Navbar'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CreateBug = lazy(() => import('./pages/CreateBug'))
const BugDetail = lazy(() => import('./pages/BugDetail'))
const EditProfile = lazy(() => import('./pages/EditProfile'))

if (typeof window !== 'undefined') {
  initWatermark()
}

function AuthenticatedApp({ session, userProfile }) {
  const { bugs } = useBugs()

  return (
    <>
      <Navbar 
        session={session} 
        userProfile={userProfile} 
        isAdmin={userProfile?.is_admin === true}
      />
      <main className="min-h-[calc(100vh-56px)]">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateBug session={session} />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route
              path="/bug/:id"
              element={<BugDetail session={session} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

