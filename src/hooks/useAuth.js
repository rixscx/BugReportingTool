import { useState, useEffect, useCallback } from 'react'
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

  const fetchUserProfile = useCallback(async (userId, userEmail, userMetadata) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile doesn't exist, create one (for OAuth users)
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              username: userEmail.split('@')[0],
              role: 'user',
              avatar_url: userMetadata?.avatar_url || generateAvatarUrl(userId),
              full_name: userMetadata?.full_name || null,
            })
            .select()
            .single()

          if (insertError) throw insertError
          setUserProfile(newProfile)
        } else {
          throw error
        }
      } else {
        setUserProfile(data)
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        setLoading(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session?.user) {
          fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
        } else {
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const deleteAccount = useCallback(async () => {
    try {
      // Delete profile first
      await supabase
        .from('profiles')
        .delete()
        .eq('id', session.user.id)
      
      // Delete auth user (requires service role key - handled server-side in real app)
      // For now, just sign out
      await supabase.auth.signOut()
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
  }
}
