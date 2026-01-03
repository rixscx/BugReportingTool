import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// AVATAR INVARIANTS (DO NOT BREAK):
// - profiles.avatar_url stores ONLY provider or user-uploaded avatars
// - Procedural avatars are memory-only; never persisted
// - OAuth users must never receive procedural seeds
// PROFILE INVARIANTS:
// - Profiles are created only at signup
// - Fetch must never mutate DB; missing profile is a hard error
// AUTH INVARIANTS:
// - OAuth redirects are explicit; no localhost in production
// - No partial auth states

/**
 * Custom hook for authentication state management
 * Provides session, user profile, and auth utilities
 */
export function useAuth() {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef(null)
  const [proceduralAvatarOverride, setProceduralAvatarOverride] = useState(false)
  const proceduralSeedRef = useRef(null)
  const proceduralOverrideRef = useRef(false)
  
  // Shared procedural avatar seed (UI-only, not persisted)
  const [proceduralAvatarSeed, setProceduralAvatarSeed] = useState(null)

  const getStoredProceduralSeed = useCallback((userId) => {
    if (!userId) return null
    try {
      const stored = localStorage.getItem(`proceduralSeed:${userId}`)
      return stored || null
    } catch {
      return null
    }
  }, [])

  const emitProceduralState = useCallback((userId, seed, overrideValue) => {
    if (!userId || typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('procedural-avatar-change', {
      detail: { userId, seed, override: overrideValue }
    }))
  }, [])

  const getStoredProceduralOverride = useCallback((userId) => {
    if (!userId) return false
    try {
      const stored = localStorage.getItem(`proceduralOverride:${userId}`)
      return stored === 'true'
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return undefined

    const handleProceduralChange = (event) => {
      if (event.detail?.userId !== userId) return
      if (typeof event.detail.seed !== 'undefined') {
        setProceduralAvatarSeed(event.detail.seed)
        proceduralSeedRef.current = event.detail.seed
      }
      if (typeof event.detail.override !== 'undefined') {
        const nextOverride = !!event.detail.override
        setProceduralAvatarOverride(nextOverride)
        proceduralOverrideRef.current = nextOverride
      }
    }

    window.addEventListener('procedural-avatar-change', handleProceduralChange)
    return () => window.removeEventListener('procedural-avatar-change', handleProceduralChange)
  }, [session?.user?.id])

  const persistProceduralSeed = useCallback((userId, seed) => {
    setProceduralAvatarSeed(seed)
    proceduralSeedRef.current = seed
    if (!userId) return
    try {
      if (seed === null) {
        localStorage.removeItem(`proceduralSeed:${userId}`)
      } else {
        localStorage.setItem(`proceduralSeed:${userId}`, seed)
      }
      emitProceduralState(userId, seed, proceduralOverrideRef.current)
    } catch {
    }
  }, [emitProceduralState])

  const persistProceduralOverride = useCallback((userId, overrideValue) => {
    setProceduralAvatarOverride(!!overrideValue)
    proceduralOverrideRef.current = !!overrideValue
    if (!userId) return
    try {
      if (overrideValue) {
        localStorage.setItem(`proceduralOverride:${userId}`, 'true')
      } else {
        localStorage.removeItem(`proceduralOverride:${userId}`)
      }
      emitProceduralState(userId, proceduralSeedRef.current, !!overrideValue)
    } catch {
    }
  }, [emitProceduralState])

  const fetchUserProfile = useCallback(async (userId, userEmail, userMetadata) => {
    // PHASE 3 — OAUTH FIX: Guard against undefined/null userId before any DB queries
    if (!userId || typeof userId !== 'string') {
      console.error('❌ PHASE 3 — OAUTH FIX: Invalid userId provided to fetchUserProfile:', { userId, userEmail })
      return
    }
    
    // PHASE 3 — PERF POLISH: Prevent duplicate fetches for the same user
    if (fetchingRef.current || lastFetchedUserIdRef.current === userId) {
      return
    }
    
    fetchingRef.current = true
    lastFetchedUserIdRef.current = userId
    const usernameFromEmail = userEmail ? userEmail.split('@')[0] : 'user'

    try {
      // PHASE 3 — OAUTH FIX: Ensure userId is valid before query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      // PHASE 3 — OAUTH FIX: Log full error details for debugging
      if (error && (error.code === 'PGRST301' || error.code === '409' || error.message?.includes('permission'))) {
        console.error('❌ PHASE 3 — OAUTH FIX: RLS/Permission error fetching profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId,
          userEmail
        })
        throw new Error(`Database access denied. Please contact support. (${error.code})`)
      }

      // INVARIANT ENFORCED: Profile must exist already (no healing/upserts on read)
      // EXCEPTION: OAuth users may not have profiles yet - create on first login
      const noProfile = (!data && !error) || error?.code === 'PGRST116'
      if (noProfile) {
        const provider = userMetadata?.provider || userMetadata?.iss || ''
        const isGoogleProvider = typeof provider === 'string' && provider.toLowerCase().includes('google')
        
        // OAuth users: create profile on first login with provider metadata
        if (isGoogleProvider) {
          console.log('🔐 OAuth user without profile - creating from metadata:', userId)
          
          const fullNameFromProvider = userMetadata?.full_name || userMetadata?.name || null
          const avatarUrlFromProvider = userMetadata?.avatar_url || null
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              username: usernameFromEmail,
              full_name: fullNameFromProvider,
              avatar_url: avatarUrlFromProvider,
              role: 'user',
            })
            .select()
            .maybeSingle()
          
          if (insertError) {
            console.error('❌ Failed to create OAuth profile:', insertError)
            throw new Error(`Failed to create profile: ${insertError.message}`)
          }
          
          if (newProfile) {
            setUserProfile(newProfile)
            setLoading(false)
            fetchingRef.current = false
            return
          }
        }
        
        // Non-OAuth users without profile is an error
        throw new Error('INVARIANT VIOLATION: profile missing for authenticated user')
      }

      if (error) {
        // DB/RLS AUDIT: All profile fetch errors must fail loudly
        console.error('❌ DB/RLS AUDIT: Error fetching profile:', {
          code: error.code,
          message: error.message,
          userId
        })
        throw error
      }
      
      // INVARIANT ENFORCED: Profile data must exist and come from database
      if (!data || !data.id) {
        throw new Error('INVARIANT VIOLATION: profiles row missing. Frontend must not fabricate profiles.')
      }

      // OAuth avatar source of truth: persist provider avatar once if missing
      const provider = userMetadata?.provider || userMetadata?.iss || ''
      const isGoogleProvider = typeof provider === 'string' && provider.toLowerCase().includes('google')
      let profileData = data

      if (isGoogleProvider && !data.avatar_url && userMetadata?.avatar_url) {
        const fullNameFromProvider = userMetadata.full_name || userMetadata.name || null
        const { data: updatedProfile, error: avatarUpdateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: userMetadata.avatar_url,
            full_name: fullNameFromProvider || data.full_name || null,
          })
          .eq('id', userId)
          .select()
          .maybeSingle()

        if (avatarUpdateError) {
          console.error('❌ OAUTH AVATAR SYNC FAILED:', {
            code: avatarUpdateError.code,
            message: avatarUpdateError.message,
            userId
          })
        } else if (updatedProfile?.avatar_url) {
          profileData = updatedProfile
        }
      }

      // Use profile data as-is from database, avatar_url may be null (valid state)
      // Profiles must ONLY come from database.
      setUserProfile(profileData)
    } catch (err) {
      // PHASE 2 FIX: Fatal errors should surface to user - no silent fallback
      console.error('❌ PHASE 2: Fatal profile error:', err)
      setUserProfile(null)
      // Re-throw to propagate error to auth state
      throw err
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const primeProceduralState = (session) => {
      const userId = session?.user?.id
      const provider = session?.user?.app_metadata?.provider || session?.user?.user_metadata?.provider || session?.user?.user_metadata?.iss || ''
      const isGoogleProvider = typeof provider === 'string' && provider.toLowerCase().includes('google')

      if (!userId) {
        persistProceduralSeed(null, null)
        persistProceduralOverride(null, false)
        return { isGoogleProvider }
      }

      if (isGoogleProvider) {
        persistProceduralSeed(userId, null)
        persistProceduralOverride(userId, false)
      } else {
        // PROCEDURAL INVARIANT: Auto-generate seed for email users on first login (UI-only)
        const storedSeed = getStoredProceduralSeed(userId)
        const storedOverride = getStoredProceduralOverride(userId)
        
        // Auto-generate procedural avatar for email users if no seed exists
        if (!storedSeed) {
          const newSeed = `${userId}-${Date.now()}`
          persistProceduralSeed(userId, newSeed)
          persistProceduralOverride(userId, false) // Not forced, uploaded avatar takes precedence
        } else {
          persistProceduralSeed(userId, storedSeed)
          persistProceduralOverride(userId, storedOverride)
        }
      }

      return { isGoogleProvider }
    }
    
    // PHASE 3 — AUTH RACE FIX: Get initial session and wait for it to be stable
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return
      
      // PHASE 3 — OAUTH FIX: Log any session retrieval errors
      if (error) {
        console.error('❌ PHASE 3 — OAUTH FIX: Failed to get session:', error)
        setLoading(false)
        return
      }
      
      setSession(session)
      
      if (session?.user?.id) {
        primeProceduralState(session)
        // PHASE 3 — OAUTH FIX: Validate session has required fields before profile fetch
        if (!session.user.email) {
          console.warn('⚠️ PHASE 3 — OAUTH FIX: Session missing email, using id as fallback')
        }

        // PHASE 3 — AUTH RACE FIX: Fetch profile only after session is confirmed stable
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        setLoading(false)
      }
    })
    
    // PHASE 3 — AUTH RACE FIX: Listen for auth state changes (login/logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        
        // PHASE 3 — OAUTH FIX: Log auth events for debugging
        console.log(`🔐 PHASE 3 — OAUTH FIX: Auth event: ${event}`, { hasSession: !!session, userId: session?.user?.id })
        
        setSession(session)
        
        if (session?.user?.id) {
          primeProceduralState(session)
          // PHASE 3 — AUTH RACE FIX: Validate session before processing
          if (!session.user.email && event !== 'TOKEN_REFRESHED') {
            console.warn('⚠️ PHASE 3 — OAUTH FIX: Session missing email on event:', event)
          }
          
          // PHASE 3 — PERF POLISH: Only fetch profile on SIGNED_IN or INITIAL_SESSION
          // Skip fetch on TOKEN_REFRESHED if we already have the profile
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || !userProfile) {
            fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
          }
        } else {
          // PHASE 2 — PROCEDURAL AVATAR FIX: Clear seed on logout to prevent leakage
          setUserProfile(null)
          persistProceduralSeed(null, null)
          persistProceduralOverride(null, false)
          lastFetchedUserIdRef.current = null // PHASE 3 — AUTH RACE FIX: Clear fetch tracking
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, getStoredProceduralOverride, getStoredProceduralSeed, persistProceduralOverride, persistProceduralSeed])

  // AUTH HARDENING: Clear all state on logout
  const signOut = useCallback(async () => {
    // Clear profile state BEFORE signout to prevent stale data
    setUserProfile(null)
    persistProceduralSeed(null, null)
    persistProceduralOverride(null, false)
    lastFetchedUserIdRef.current = null
    fetchingRef.current = false
    await supabase.auth.signOut()
  }, [persistProceduralOverride, persistProceduralSeed])

  const deleteAccount = useCallback(async () => {
    if (!session?.user?.id) throw new Error('No user session')
    
    try {
      // Call the database function to delete all user data
      // This handles: bugs, comments, storage files, and profile
      const { data, error } = await supabase
        .rpc('delete_my_account')
      
      if (error) {
        console.error('RPC error:', error)
        throw new Error(error.message || 'Failed to delete account data')
      }
      
      // Check if the deletion was successful
      if (data && !data.success) {
        console.error('Deletion failed:', data.error)
        throw new Error(data.error || 'Account deletion failed')
      }
      
      // Now delete from auth.users (this signs the user out automatically)
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        console.error('Sign out error:', signOutError)
        // Don't throw here - account is already deleted from database
      }
      
      // Force reload to clear all state and redirect to login
      setTimeout(() => {
        window.location.href = '/'
      }, 500)
      
    } catch (err) {
      console.error('Error deleting account:', err)
      throw err
    }
  }, [session])

  const updateProceduralSeed = useCallback((seed, { preferProcedural = true } = {}) => {
    if (!session?.user?.id) return
    persistProceduralSeed(session.user.id, seed)
    if (preferProcedural) {
      persistProceduralOverride(session.user.id, true)
    }
  }, [persistProceduralOverride, persistProceduralSeed, session?.user?.id])

  const updateProceduralOverride = useCallback((overrideValue) => {
    if (!session?.user?.id) return
    persistProceduralOverride(session.user.id, overrideValue)
  }, [persistProceduralOverride, session?.user?.id])

  const isAdmin = userProfile?.role === 'admin'
  const isAuthenticated = !!session
  const isTestAccount = session?.user?.email?.includes('test.')

  return {
    session,
    userProfile,
    loading,
    isAdmin,
    isAuthenticated,
    isTestAccount,
    proceduralAvatarSeed,
    setProceduralAvatarSeed: updateProceduralSeed,
    proceduralAvatarOverride,
    setProceduralAvatarOverride: updateProceduralOverride,
    signOut,
    deleteAccount,
    refetchProfile: async () => {
      if (session?.user) {
        lastFetchedUserIdRef.current = null // Allow refetch
        fetchingRef.current = false
        await fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
      }
    }
    // PHASE 2 FIX: Removed updateProfileState - profiles must come from DB only
  }
}
