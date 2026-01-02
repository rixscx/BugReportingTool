import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { generateAvatarUrl } from '../lib/avatarUtils'

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

  const fetchUserProfile = useCallback(async (userId, userEmail, userMetadata) => {
    // Prevent duplicate fetches for the same user
    if (fetchingRef.current || lastFetchedUserIdRef.current === userId) {
      return
    }
    
    fetchingRef.current = true
    lastFetchedUserIdRef.current = userId
    const avatarFromMetadata = userMetadata?.avatar_url || userMetadata?.picture || null
    const fallbackAvatar = generateAvatarUrl(userId)
    const usernameFromEmail = userEmail ? userEmail.split('@')[0] : 'user'

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      // If we get a permission error (RLS blocking), use fallback immediately
      if (error && (error.code === 'PGRST301' || error.message?.includes('permission'))) {
        const fallbackProfile = {
          id: userId,
          email: userEmail,
          username: usernameFromEmail,
          role: 'user',
          avatar_url: avatarFromMetadata || fallbackAvatar,
          full_name: userMetadata?.full_name || null,
          created_at: new Date().toISOString()
        }
        setUserProfile(fallbackProfile)
        setLoading(false)
        return
      }

      // Check if profile doesn't exist (null data and no error, or PGRST116)
      const noProfile = (!data && !error) || error?.code === 'PGRST116'

      if (noProfile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            username: usernameFromEmail,
            role: 'user',
            avatar_url: avatarFromMetadata || fallbackAvatar,
            full_name: userMetadata?.full_name || null,
          })
          .select()
          .single()

        if (insertError) {
          // Profile exists but RLS blocks access, or foreign key error - use fallback
          const isConflict = insertError.code === '23505' || 
                            insertError.message?.includes('duplicate') ||
                            insertError.message?.includes('already exists')
          
          const isForeignKeyError = insertError.code === '23503' ||
                                    insertError.message?.includes('foreign key constraint')
          
          if (isConflict || isForeignKeyError) {
            const fallbackProfile = {
              id: userId,
              email: userEmail,
              username: usernameFromEmail,
              role: 'user',
              avatar_url: avatarFromMetadata || fallbackAvatar,
              full_name: userMetadata?.full_name || null,
              created_at: new Date().toISOString()
            }
            setUserProfile(fallbackProfile)
            setLoading(false)
            return
          }
          
          console.error('Failed to create profile:', insertError)
          throw insertError
        }
        setUserProfile(newProfile)
        return
      }

      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      }

      // If profile exists but has missing fields, heal them
      let profileData = data
      const hasOldExternalAvatar = data.avatar_url && (
        data.avatar_url.includes('dicebear.com') ||
        data.avatar_url.startsWith('http')
      )

      const needsUsername = !data.username || data.username.trim().length === 0
      const needsAvatar = !data.avatar_url || hasOldExternalAvatar

      if (needsUsername || needsAvatar) {
        const generatedUrl = needsAvatar ? (avatarFromMetadata || fallbackAvatar) : data.avatar_url
        const healedData = {
          ...(needsUsername ? { username: usernameFromEmail } : {}),
          ...(needsAvatar ? { avatar_url: generatedUrl } : {}),
        }

        profileData = { ...data, ...healedData }

        // Update in background without blocking
        supabase
          .from('profiles')
          .update(healedData)
          .eq('id', userId)
          .then(result => {
            if (result.error) {
              console.error('Failed to heal profile:', result.error.message)
            }
          })
      }

      setUserProfile(profileData)
    } catch (err) {
      console.error('Error fetching/creating profile:', err)
      setUserProfile(null)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        setLoading(false)
      }
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return
        setSession(session)
        if (session?.user) {
          fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
        } else {
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

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
    signOut,
    deleteAccount,
    refetchProfile: async () => {
      if (session?.user) {
        lastFetchedUserIdRef.current = null // Allow refetch
        fetchingRef.current = false
        await fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
      }
    },
    // Update profile state directly (for fallback profiles that can't be read from DB)
    updateProfileState: (updates) => {
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }))
    }
  }
}
