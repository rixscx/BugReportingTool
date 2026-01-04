import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { resolveAvatar } from '../lib/avatarUtils'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import { ConfirmDialog, useConfirmDialog } from './ConfirmDialog'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'

export default function Navbar({ session, userProfile, isAdmin }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isTestAccount, deleteAccount, loading: profileLoading = false } = useAuth()
  const deleteDialog = useConfirmDialog()
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const avatarData = resolveAvatar(userProfile)
  const resolvedAvatarUrl = avatarData.src

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
      description: (
        <div className="space-y-3 text-left">
          <p className="text-[#ef4444]">This action cannot be undone.</p>
          <p className="text-sm text-[#9898a8]">Deleting your account will permanently remove all your data including bugs, comments, and profile.</p>
        </div>
      ),
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      setShowUserMenu(false)
      showToast('Deleting account...', 'info')
      await deleteAccount()
      showToast('Account deleted successfully', 'success')
    } catch (err) {
      console.error('Delete account error:', err)
      showToast(err.message || 'Failed to delete account', 'error')
    }
  }, [deleteDialog, deleteAccount, showToast])

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

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`relative px-4 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 ${
        isActive(to)
          ? 'text-[#f0f0f5] bg-[rgba(255,255,255,0.06)]'
          : 'text-[#6b6b7b] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      {children}
      {isActive(to) && (
        <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full" />
      )}
    </Link>
  )

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.05)]">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-[#06060a]/70 backdrop-blur-2xl" />
        
        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(99,102,241,0.03)] via-transparent to-[rgba(139,92,246,0.03)] pointer-events-none" />
        
        <div className="relative w-full px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav - pushed to left edge */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img 
                  src="/logo-buggy.svg" 
                  alt="Cpt Buggy" 
                  className="w-10 h-10 group-hover:scale-105 transition-transform duration-300"
                />
                <span className="text-[16px] font-semibold text-[#f0f0f5] hidden sm:block tracking-[-0.02em]">Cpt Buggy</span>
              </Link>

              <nav className="hidden sm:flex items-center gap-1">
                <NavLink to="/">Notice</NavLink>
                <NavLink to="/issue">Issue</NavLink>
                <NavLink to="/logs">Activity</NavLink>
              </nav>
            </div>

            {/* Right: Actions - pushed to right edge */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-quick-actions'))}
                className="hidden md:flex items-center gap-3 h-9 px-4 text-[12px] text-[#6b6b7b] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] rounded-2xl transition-all duration-200"
              >
                <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
                <kbd className="text-[10px] px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded-lg text-[#4a4a58] font-medium">⌘K</kbd>
              </button>

              {isAdmin && (
                <span className="hidden sm:inline-flex px-3 py-1 text-[10px] font-semibold text-[#6366f1] bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)] rounded-full">
                  Admin
                </span>
              )}

              {/* User Menu */}
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200"
                >
                  {profileLoading ? (
                    <div className="w-8 h-8 rounded-xl bg-[#14141c] animate-pulse" />
                  ) : resolvedAvatarUrl ? (
                    <img src={resolvedAvatarUrl} alt="" className="w-8 h-8 rounded-xl ring-2 ring-[rgba(255,255,255,0.08)]" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-[12px] font-semibold text-white ring-2 ring-[rgba(255,255,255,0.08)]">
                      {(userProfile?.username || session?.user?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <svg className={`w-3.5 h-3.5 text-[#4a4a58] transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-60 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] py-2 animate-slide-up-spring overflow-hidden">
                    {/* Gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.4)] to-transparent" />
                    
                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                      <p className="text-[13px] font-semibold text-[#f0f0f5] truncate">{userProfile?.username || 'User'}</p>
                      <p className="text-[11px] text-[#6b6b7b] truncate mt-0.5">{session?.user?.email}</p>
                    </div>

                    <div className="py-1.5">
                      <button
                        onClick={() => { navigate('/edit-profile'); setShowUserMenu(false) }}
                        className="w-full px-4 py-2.5 text-left text-[12px] text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f5] transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      <button
                        onClick={() => { setShowShortcutsHelp(true); setShowUserMenu(false) }}
                        className="w-full px-4 py-2.5 text-left text-[12px] text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f5] transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-3">
                          <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                          </svg>
                          Shortcuts
                        </span>
                        <kbd className="text-[10px] px-2 py-0.5 bg-[rgba(255,255,255,0.05)] rounded-lg text-[#4a4a58]">?</kbd>
                      </button>
                    </div>

                    <div className="border-t border-[rgba(255,255,255,0.06)] py-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-left text-[12px] text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f0f0f5] transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                      {!isTestAccount && (
                        <button
                          onClick={handleDeleteAccount}
                          className="w-full px-4 py-2.5 text-left text-[12px] text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete account
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
        <div className="relative sm:hidden border-t border-[rgba(255,255,255,0.05)] px-2 py-2 flex justify-around bg-[#06060a]/90 backdrop-blur-xl">
          <Link to="/" className={`flex flex-col items-center py-2 px-5 rounded-xl transition-all duration-200 ${isActive('/') ? 'text-[#f0f0f5] bg-[rgba(255,255,255,0.06)]' : 'text-[#4a4a58]'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[10px] mt-1 font-medium">Notice</span>
          </Link>
          <Link to="/issue" className={`flex flex-col items-center py-2 px-5 rounded-xl transition-all duration-200 ${isActive('/issue') ? 'text-[#f0f0f5] bg-[rgba(255,255,255,0.06)]' : 'text-[#4a4a58]'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] mt-1 font-medium">Issue</span>
          </Link>
          <Link to="/logs" className={`flex flex-col items-center py-2 px-5 rounded-xl transition-all duration-200 ${isActive('/logs') ? 'text-[#f0f0f5] bg-[rgba(255,255,255,0.06)]' : 'text-[#4a4a58]'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] mt-1 font-medium">Activity</span>
          </Link>
        </div>
      </header>

      <KeyboardShortcutsHelp isOpen={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />
      <ConfirmDialog {...deleteDialog.dialogProps} />
    </>
  )
}
