import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { resolveAvatar, generateNewAvatarSeed, generateAvatarFromSeed, prepareAvatarUpdate } from '../lib/avatarUtils'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { AvatarCropper } from '../components/AvatarCropper'

export default function EditProfile() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { userProfile, session, updateProfile, loading: profileLoading } = useAuth()
  const modalRef = useRef(null)

  const provider = session?.user?.app_metadata?.provider || session?.user?.user_metadata?.provider || ''
  const isOAuthGoogle = typeof provider === 'string' && provider.toLowerCase().includes('google')

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [pendingAvatarType, setPendingAvatarType] = useState(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const [pendingAvatarSeed, setPendingAvatarSeed] = useState(null)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [showCropper, setShowCropper] = useState(false)

  const currentAvatar = resolveAvatar(userProfile)
  const [initialValues, setInitialValues] = useState({})

  useEffect(() => {
    if (profileLoading || !userProfile) return
    const initial = {
      username: userProfile.username || (session?.user?.email?.split('@')[0] || ''),
      fullName: userProfile.full_name || '',
    }
    setUsername(initial.username)
    setFullName(initial.fullName)
    setInitialValues(initial)
    setAvatarPreview(currentAvatar.src)
  }, [userProfile, session?.user?.email, profileLoading, currentAvatar.src])

  const hasChanges = username !== initialValues.username || fullName !== initialValues.fullName || !!pendingAvatarType

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        showToast('Please upload a JPG or PNG image', 'error')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image must be less than 2MB', 'error')
        return
      }
      setRawImageFile(file)
      setShowCropper(true)
    }
    e.target.value = ''
  }

  const handleCropComplete = (croppedBlob) => {
    const croppedFile = new File([croppedBlob], 'avatar.png', { type: 'image/png' })
    setPendingAvatarType('uploaded')
    setPendingAvatarFile(croppedFile)
    setPendingAvatarSeed(null)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(croppedBlob)
    setShowCropper(false)
    setRawImageFile(null)
  }

  const handleGenerateAvatar = useCallback(() => {
    if (!session?.user?.id || isOAuthGoogle) return
    const newSeed = generateNewAvatarSeed(session.user.id)
    setPendingAvatarType('generated')
    setPendingAvatarSeed(newSeed)
    setPendingAvatarFile(null)
    setAvatarPreview(generateAvatarFromSeed(newSeed))
  }, [session?.user?.id, isOAuthGoogle])

  const handleSave = async (e) => {
    e?.preventDefault()
    if (!hasChanges) return
    setSaving(true)

    try {
      const updateData = { username, full_name: fullName }

      if (pendingAvatarType === 'uploaded' && pendingAvatarFile) {
        const filePath = `${session.user.id}/avatar.png`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, pendingAvatarFile, { upsert: true, contentType: 'image/png' })
        if (uploadError) throw new Error('Failed to upload avatar')
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        if (!publicUrlData?.publicUrl) throw new Error('Failed to get avatar URL')
        Object.assign(updateData, prepareAvatarUpdate('uploaded', { url: publicUrlData.publicUrl }))
      } else if (pendingAvatarType === 'generated' && pendingAvatarSeed) {
        Object.assign(updateData, prepareAvatarUpdate('generated', { seed: pendingAvatarSeed }))
      }

      const { error: updateError } = await supabase.from('profiles').update(updateData).eq('id', session.user.id)
      if (updateError) throw updateError

      updateProfile(updateData)
      setPendingAvatarType(null)
      setPendingAvatarFile(null)
      setPendingAvatarSeed(null)
      showToast('Profile updated', 'success')
      setTimeout(() => navigate('/'), 400)
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Close on ESC key or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCropper) {
          setShowCropper(false)
          setRawImageFile(null)
        } else {
          navigate('/')
        }
      }
    }
    
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && !showCropper) {
        navigate('/')
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [navigate, showCropper])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (profileLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#06060a] flex items-center justify-center">
        <div className="relative">
          <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 blur-xl bg-[#6366f1]/20 rounded-full animate-breathe" />
        </div>
      </div>
    )
  }

  const initials = (fullName || username || session?.user?.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[#06060a]/80 backdrop-blur-xl" />
      
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[rgba(99,102,241,0.06)] blur-[100px] pointer-events-none" />

      {showCropper && rawImageFile && (
        <AvatarCropper
          imageFile={rawImageFile}
          onCropComplete={handleCropComplete}
          onCancel={() => { setShowCropper(false); setRawImageFile(null) }}
        />
      )}

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div ref={modalRef} className="w-full max-w-sm bg-[rgba(12,12,18,0.95)] rounded-3xl border border-[rgba(255,255,255,0.08)] overflow-hidden backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_80px_rgba(99,102,241,0.08)]">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/40 to-transparent" />
          
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#f0f0f5]">Edit Profile</span>
            <button onClick={() => navigate('/')} className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all duration-150 text-[#4a4a58] hover:text-[#9898a8]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="pt-8 pb-5 flex flex-col items-center">
            <div className="relative">
              <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${saving ? 'opacity-50' : ''}`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarPreview(null)} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[rgba(99,102,241,0.2)] to-[rgba(139,92,246,0.2)] flex items-center justify-center">
                    <span className="text-[16px] font-semibold text-[#818cf8]">{initials}</span>
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] rounded-xl flex items-center justify-center cursor-pointer border border-[rgba(255,255,255,0.1)] transition-all duration-200 hover:-translate-y-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarUpload} className="hidden" disabled={saving} />
              </label>
            </div>
            {!isOAuthGoogle && (
              <button type="button" onClick={handleGenerateAvatar} disabled={saving} className="mt-4 text-[12px] text-[#6366f1] hover:text-[#818cf8] font-medium disabled:opacity-50 transition-colors">
                Generate avatar
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="px-5 pb-5 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#4a4a58] mb-2 tracking-wide">Display name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isOAuthGoogle || saving}
                className={`w-full px-4 py-3 border border-[rgba(255,255,255,0.06)] rounded-xl text-[13px] text-[#f0f0f5] focus:outline-none focus:border-[rgba(99,102,241,0.5)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200 ${isOAuthGoogle ? 'bg-[#0a0a0f]/50 text-[#4a4a58] cursor-not-allowed' : 'bg-[#0a0a0f]'}`}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#4a4a58] mb-2 tracking-wide">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[rgba(255,255,255,0.06)] rounded-xl text-[13px] text-[#f0f0f5] focus:outline-none focus:border-[rgba(99,102,241,0.5)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                placeholder="Username"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button type="button" onClick={() => navigate('/')} className="px-4 py-2.5 text-[12px] text-[#4a4a58] hover:text-[#9898a8] font-medium transition-colors rounded-xl hover:bg-[rgba(255,255,255,0.05)]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || saving}
                className={`relative px-5 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-300 ${hasChanges && !saving ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:-translate-y-0.5' : 'bg-[rgba(255,255,255,0.05)] text-[#4a4a58] cursor-not-allowed'}`}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
