import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useBugs } from './hooks/useBugs'
import { ToastProvider } from './components/Toast'
import { PageLoader } from './components/Skeleton'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { QuickActions } from './components/QuickActions'
import { initWatermark } from './lib/watermark'
import Auth from './components/Auth'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import CreateBug from './pages/CreateBug'
import BugDetail from './pages/BugDetail'

if (typeof window !== 'undefined') {
  initWatermark()
}

function AuthenticatedApp({ session, userProfile, isAdmin }) {
  const { bugs } = useBugs()

  return (
    <>
      <Navbar 
        session={session} 
        userProfile={userProfile} 
        isAdmin={isAdmin} 
      />
      <main className="min-h-[calc(100vh-56px)]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateBug session={session} />} />
          <Route
            path="/bug/:id"
            element={<BugDetail session={session} isAdmin={isAdmin} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
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
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
