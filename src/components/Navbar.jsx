import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import { useConfirmDialog } from './ConfirmDialog'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'
import { NotificationCenter } from './NotificationCenter'

export default function Navbar({ session, userProfile, isAdmin }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isTestAccount, deleteAccount } = useAuth()
  const deleteDialog = useConfirmDialog()
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const handleOpenShortcuts = () => setShowShortcutsHelp(true)
    window.addEventListener('open-shortcuts-help', handleOpenShortcuts)
    return () => window.removeEventListener('open-shortcuts-help', handleOpenShortcuts)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('[data-user-menu]')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleSignOut = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowUserMenu(false)
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch {
    }
  }, [])

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = await deleteDialog.confirm({
      title: 'Delete Account',
      description: 'This action cannot be undone. All your profile data will be permanently deleted. You will not be able to recover your account.',
      confirmText: 'Delete My Account',
      variant: 'danger',
    })
    
    if (!confirmed) return

    try {
      setShowUserMenu(false)
      await deleteAccount()
      showToast('Account deleted successfully', 'success')
      navigate('/')
    } catch (err) {
      showToast('Failed to delete account. Please try again.', 'error')
      console.error('Error deleting account:', err)
    }
  }, [deleteDialog, deleteAccount, showToast, navigate])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        handleSignOut(e)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSignOut])

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left - Logo & Nav */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-800 hidden sm:block">BugTracker</span>
              </Link>

              <div className="hidden sm:flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/') 
                      ? 'bg-slate-100 text-slate-900' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/create"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/create')
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Report Bug
                </Link>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-quick-actions'))}
                className="hidden md:flex items-center gap-2 px-3.5 py-2 text-sm text-slate-500 bg-slate-100/80 hover:bg-slate-200/80 rounded-lg transition-all border border-slate-200/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-medium">Search</span>
                <kbd className="text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 font-semibold">⌘K</kbd>
              </button>

              {/* Notifications */}
              <NotificationCenter userId={session?.user?.id} />

              {/* Help */}
              <button
                onClick={() => setShowShortcutsHelp(true)}
                className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                title="Keyboard shortcuts (Ctrl+/)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Admin Badge */}
              {isAdmin && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-lg border border-purple-200">
                  Admin
                </span>
              )}

              {/* User Menu */}
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
                >
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile.username}
                      className="w-9 h-9 rounded-xl ring-2 ring-white shadow-md"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center ring-2 ring-white shadow-md">
                      <span className="text-white text-sm font-bold">
                        {(userProfile?.username || session?.user?.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in-scale">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt={userProfile.username}
                          className="w-10 h-10 rounded-lg ring-1 ring-slate-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {(userProfile?.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {userProfile?.username || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowShortcutsHelp(true)
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                        </svg>
                        Keyboard Shortcuts
                      </span>
                      <kbd className="text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-semibold">Ctrl+/</kbd>
                    </button>
                    
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </span>
                        <kbd className="text-xs bg-red-100 px-2 py-1 rounded-md text-red-500 font-semibold">Ctrl+Shift+X</kbd>
                      </button>
                      
                      {!isTestAccount && (
                        <button
                          onClick={handleDeleteAccount}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Account
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="sm:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around bg-slate-50">
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-md ${
              isActive('/') ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link
            to="/create"
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-md ${
              isActive('/create') ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-medium">Report</span>
          </Link>
        </div>
      </nav>

      <KeyboardShortcutsHelp 
        isOpen={showShortcutsHelp} 
        onClose={() => setShowShortcutsHelp(false)} 
      />
    </>
  )
}
