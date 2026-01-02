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
        // If profile exists but has no avatar_url OR has old DiceBear URL, generate one
        let profileData = data
        const hasOldExternalAvatar = data.avatar_url && (
          data.avatar_url.includes('dicebear.com') || 
          data.avatar_url.startsWith('http')
        )
        
        if (!data.avatar_url || hasOldExternalAvatar) {
          const generatedUrl = generateAvatarUrl(userId)
          profileData = { ...data, avatar_url: generatedUrl }
          
          // Update it in the background (non-critical)
          supabase
            .from('profiles')
            .update({ avatar_url: generatedUrl })
            .eq('id', userId)
            .catch(err => console.error('Failed to save avatar URL:', err))
        }
        setUserProfile(profileData)
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
        await fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata)
      }
    }
  }
}
