import { useState, useEffect, useCallback, useRef, createContext, useContext, createElement } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * AVATAR SYSTEM INVARIANTS:
 * - avatar_type, avatar_seed, avatar_url stored in profiles table ONLY
 * - No localStorage for avatar state
 * - Avatar resolved from profile data using resolveAvatar()
 * 
 * PROFILE INVARIANTS:
 * - Profiles are created by database trigger on signup
 * - Frontend must never create profiles
 * - Fetch must never mutate DB; missing profile is a hard error
 * 
 * AUTH INVARIANTS:
 * - OAuth redirects are explicit
 * - No partial auth states
 * - Single source of truth via Context
 */

// Create Auth Context - SINGLE SOURCE OF TRUTH for auth state
const AuthContext = createContext(null)

/**
 * Auth Provider component - wrap your app with this
 * All auth state lives here and is shared via context
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef(null)

  const fetchUserProfile = useCallback(async (userId, userEmail, userMetadata) => {
    // Guard against undefined/null userId
    if (!userId || typeof userId !== 'string') {
      console.error('❌ Invalid userId provided to fetchUserProfile:', { userId, userEmail })
      return
    }

    // Prevent duplicate fetches for the same user
    if (fetchingRef.current || lastFetchedUserIdRef.current === userId) {
      return
    }

    fetchingRef.current = true
    lastFetchedUserIdRef.current = userId

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      // Handle RLS/Permission errors
      if (error && (error.code === 'PGRST301' || error.code === '409' || error.message?.includes('permission'))) {
        console.error('❌ RLS/Permission error fetching profile:', {
          code: error.code,
          message: error.message,
          userId
        })
        throw new Error(`Database access denied. Please contact support. (${error.code})`)
      }

      // INVARIANT: Profile must exist (created by database trigger)
      // Retry a few times to handle async trigger race conditions
      const noProfile = (!data && !error) || error?.code === 'PGRST116'
      if (noProfile) {
        const maxRetries = 5
        const retryDelayMs = 300
        let found = null

        for (let i = 0; i < maxRetries; i++) {
          await new Promise((res) => setTimeout(res, retryDelayMs))
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()

          if (retryError && (retryError.code === 'PGRST301' || retryError.message?.includes('permission'))) {
            throw new Error(`Database access denied. (${retryError.code})`)
          }

          if (retryData && retryData.id) {
            found = retryData
            break
          }
        }

        if (found) {
          setUserProfile(found)
          fetchingRef.current = false
          setLoading(false)
          return
        }

        throw new Error('INVARIANT VIOLATION: profile missing for authenticated user')
      }

      if (error) {
        console.error('❌ Error fetching profile:', { code: error.code, message: error.message, userId })
        throw error
      }

      if (!data || !data.id) {
        throw new Error('INVARIANT VIOLATION: profiles row missing')
      }

      setUserProfile(data)
    } catch (err) {
      console.error('❌ Fatal profile error:', err)
      setUserProfile(null)
      throw err
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Track if we have a profile loaded (to avoid closure issues)
  const hasProfileRef = useRef(false)
  useEffect(() => {
    hasProfileRef.current = !!userProfile
  }, [userProfile])

  useEffect(() => {
    let isMounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return

      if (error) {
        console.error('❌ Failed to get session:', error)
        setLoading(false)
        return
      }

      setSession(session)

      if (session?.user?.id) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return

        console.log(`🔐 Auth event: ${event}`, { hasSession: !!session, userId: session?.user?.id })

        setSession(session)

        if (session?.user?.id) {
          // Only fetch profile on SIGNED_IN or INITIAL_SESSION or if no profile loaded
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || !hasProfileRef.current) {
            fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
          }
        } else {
          setUserProfile(null)
          lastFetchedUserIdRef.current = null
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  // Sign out and clear all state
  const signOut = useCallback(async () => {
    setUserProfile(null)
    lastFetchedUserIdRef.current = null
    fetchingRef.current = false
    await supabase.auth.signOut()
  }, [])

  // Delete account
  const deleteAccount = useCallback(async () => {
    if (!session?.user?.id) throw new Error('No user session')

    try {
      const { data, error } = await supabase.rpc('delete_my_account')

      if (error) {
        console.error('RPC error:', error)
        throw new Error(error.message || 'Failed to delete account data')
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Account deletion failed')
      }

      await supabase.auth.signOut()

      setTimeout(() => {
        window.location.href = '/'
      }, 500)

    } catch (err) {
      console.error('Error deleting account:', err)
      throw err
    }
  }, [session])

  // Refetch profile from database
  const refetchProfile = useCallback(async () => {
    if (session?.user) {
      lastFetchedUserIdRef.current = null
      fetchingRef.current = false
      await fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
    }
  }, [fetchUserProfile, session])

  /**
   * OPTIMISTIC UPDATE: Update profile state immediately without refetch
   * Use this for instant UI updates after saving profile changes
   * 
   * @param {Object} updates - Partial profile updates to merge
   */
  const updateProfile = useCallback((updates) => {
    setUserProfile(prevProfile => {
      if (!prevProfile) return prevProfile
      const updated = {
        ...prevProfile,
        ...updates,
      }
      console.log('✅ Profile updated optimistically:', { updates, result: updated })
      return updated
    })
  }, [])

  const isAuthenticated = !!session
  const isTestAccount = session?.user?.email?.includes('test.')
  const isAdmin = !!(userProfile && userProfile.is_admin === true)

  const value = {
    session,
    userProfile,
    loading,
    isAdmin,
    isAuthenticated,
    isTestAccount,
    signOut,
    deleteAccount,
    refetchProfile,
    updateProfile,
  }

  return createElement(AuthContext.Provider, { value }, children)
}

/**
 * Custom hook for authentication state management
 * Must be used within an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
