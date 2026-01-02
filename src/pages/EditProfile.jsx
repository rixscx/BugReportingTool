import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { generateAvatarUrl } from '../lib/avatarUtils'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'

export default function EditProfile() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { userProfile, session, refetchProfile } = useAuth()
  
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load profile data and generate default avatar if needed
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '')
      setFullName(userProfile.full_name || '')
      
      // Use stored avatar or generate default
      if (userProfile.avatar_url) {
        setAvatarUrl(userProfile.avatar_url)
      } else if (session?.user?.id) {
        // Generate default geometric avatar
        const generatedUrl = generateAvatarUrl(session.user.id)
        setAvatarUrl(generatedUrl)
      }
    }
  }, [userProfile, session?.user?.id])

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB')
        return
      }
      
      setAvatarFile(file)
      
      // Preview the uploaded image
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    // Regenerate default avatar
    if (session?.user?.id) {
      const generatedUrl = generateAvatarUrl(session.user.id)
      setAvatarUrl(generatedUrl)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let finalAvatarUrl = avatarUrl

      // If user uploaded a new avatar, upload to Supabase Storage
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('Failed to upload avatar')
        }

        // Get public URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        finalAvatarUrl = data.publicUrl
      }

      // Prepare update data
      const updateData = {
        username,
        full_name: fullName,
        avatar_url: finalAvatarUrl,
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        
        if (updateError.message?.includes('could not find')) {
          throw new Error('Database schema issue. Please contact support.')
        }
        throw updateError
      }

      showToast('Profile updated successfully!', 'success')
      
      // Refetch profile to update navbar and UI
      if (refetchProfile) {
        await refetchProfile()
      }
      
      // Force a full page navigation to ensure all components refresh with new data
      window.location.href = '/'
    } catch (err) {
      const errorMsg = err.message || 'Failed to update profile'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      console.error('Error updating profile:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
          <p className="text-slate-600 mt-2">Customize your profile and avatar</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Avatar Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Your Avatar</h2>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl}
                    alt="Avatar Preview"
                    className="w-32 h-32 rounded-2xl border-4 border-slate-200 shadow-lg object-cover bg-white"
                    onError={(e) => {
                      console.error('Avatar failed to load:', e.message)
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl border-4 border-slate-200 shadow-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                
                {avatarFile && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    title="Remove uploaded avatar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <p className="text-xs text-slate-500 mt-3 text-center">
                {avatarFile ? 'Custom avatar uploaded' : 'Default generated avatar'}
              </p>
            </div>

            {/* Upload Button */}
            <div className="space-y-3">
              <label className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Custom Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              
              <p className="text-xs text-slate-500 text-center">
                JPG, PNG or GIF (max 2MB)
              </p>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Profile Information</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}