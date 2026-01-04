import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { uploadBugImage } from '../lib/bugImageStorage'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { useBugs } from '../hooks/useBugs'
import { useAuth } from '../hooks/useAuth'
import { SHORTCUT_KEYS } from '../lib/constants'
import { useToast } from '../components/Toast'
import { DuplicateDetector } from '../components/BugHelpers'
import { PageWrapper } from '../lib/motion'

export default function Issue({ session }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { userProfile } = useAuth()
  const { bugs: existingBugs } = useBugs({ includeArchived: false })
  const titleInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    priority: 'Medium',
    category: 'Bug',
    browser: '',
    os: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Auto-detect environment
  useEffect(() => {
    const ua = navigator.userAgent
    let browser = 'Unknown', browserVersion = '', os = 'Unknown', osVersion = ''
    if (ua.includes('Edg/')) { browser = 'Edge'; browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || '' }
    else if (ua.includes('Chrome/')) { browser = 'Chrome'; browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || '' }
    else if (ua.includes('Firefox/')) { browser = 'Firefox'; browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || '' }
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) { browser = 'Safari'; browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || '' }
    if (ua.includes('Windows NT')) { os = 'Windows'; const v = ua.match(/Windows NT ([\d.]+)/)?.[1]; osVersion = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' }[v] || v || '' }
    else if (ua.includes('Mac OS X')) { os = 'macOS'; osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '' }
    else if (ua.includes('Linux')) { os = 'Linux' }
    setFormData(prev => ({ ...prev, browser: browserVersion ? `${browser} ${browserVersion.split('.')[0]}` : browser, os: osVersion ? `${os} ${osVersion}` : os }))
  }, [])

  useEffect(() => { titleInputRef.current?.focus() }, [])
  useKeyboardShortcut(SHORTCUT_KEYS.ESCAPE, () => { if (!loading) navigate('/') })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading && formData.title && formData.description) {
        document.querySelector('form')?.requestSubmit()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [loading, formData])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) return 'Only images allowed.'
    if (file.size > 2 * 1024 * 1024) return 'Max 2MB.'
    return null
  }

  const handleImageChange = (e) => { if (e.target.files?.[0]) processFile(e.target.files[0], e.target) }
  const processFile = (file, inputElement = null) => {
    const validationError = validateFile(file)
    if (validationError) { setError(validationError); setImageFile(null); if (inputElement) inputElement.value = ''; return }
    setError(null); setImageFile(file)
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true); setLoading(true); setError(null)
    let createdBugId = null

    try {
      if (!userProfile) { setError('Profile not ready'); setLoading(false); setSubmitting(false); return }
      
      let fullDescription = formData.description
      if (formData.steps_to_reproduce?.trim()) fullDescription += `\n\n---\n\n**Steps to Reproduce:**\n\n${formData.steps_to_reproduce.trim()}`
      if (formData.expected_behavior || formData.actual_behavior) {
        fullDescription += '\n\n---'
        if (formData.expected_behavior) fullDescription += `\n\n**Expected:** ${formData.expected_behavior}`
        if (formData.actual_behavior) fullDescription += `\n\n**Actual:** ${formData.actual_behavior}`
      }
      if (formData.browser || formData.os) {
        fullDescription += `\n\n**Environment:** ${formData.browser} / ${formData.os}`
      }

      const { data: inserted, error: insertError } = await supabase
        .from('bugs')
        .insert({
          title: formData.title,
          description: fullDescription,
          priority: formData.priority,
          status: 'Open',
          is_archived: false,
          user_id: session.user.id,
          reported_by_email: session.user.email,
          reported_by_name: userProfile?.full_name || userProfile?.username || null,
        })
        .select('id, user_id')
        .single()

      if (insertError) throw new Error(insertError.message)
      createdBugId = inserted?.id

      if (imageFile && createdBugId) {
        try {
          await uploadBugImage(imageFile, createdBugId, formData.title, {
            full_name: userProfile.full_name,
            username: userProfile.username,
            email: session?.user?.email
          })
        } catch (uploadErr) {
          await supabase.from('bugs').delete().eq('id', createdBugId)
          throw uploadErr
        }
      }

      showToast('Issue created', 'success')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to submit')
      showToast(err.message || 'Failed', 'error')
    } finally {
      setLoading(false); setSubmitting(false)
    }
  }

  const categories = ['Bug', 'Feature Request', 'Improvement', 'Documentation', 'Question']
  const priorities = [
    { value: 'Low', color: '#6b7280', label: 'Low priority' },
    { value: 'Medium', color: '#f59e0b', label: 'Medium priority' },
    { value: 'High', color: '#ef4444', label: 'Urgent' },
  ]

  return (
    <PageWrapper className="min-h-screen bg-[#06060a]">
      {/* Subtle ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[rgba(99,102,241,0.03)] blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[rgba(139,92,246,0.02)] blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-10">
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-[#f0f0f5] tracking-tight">New Issue</h1>
            <p className="text-sm text-[#6b6b7b] mt-1">Describe the problem or suggestion</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 text-[#6b6b7b] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-8 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-[#f87171] text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title - Clean underline style */}
          <div>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-transparent border-0 border-b border-[rgba(255,255,255,0.1)] text-[#f0f0f5] text-xl font-medium placeholder-[#3a3a48] py-3 focus:outline-none focus:border-[#6366f1] transition-colors"
              placeholder="Issue title"
              required
            />
            <DuplicateDetector title={formData.title} bugs={existingBugs} onSelect={(bug) => navigate(`/bug/${bug.id}`)} />
          </div>

          {/* Description - Simple textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#6b6b7b] font-medium">Description</label>
              <span className="text-[10px] text-[#4a4a58]">{formData.description.length}/2000</span>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl text-[#e0e0e5] text-sm leading-relaxed placeholder-[#3a3a48] focus:outline-none focus:border-[rgba(99,102,241,0.3)] focus:bg-[rgba(255,255,255,0.03)] transition-all resize-none"
              placeholder="What's happening? Be as specific as possible..."
              required
            />
          </div>

          {/* Priority & Category - Inline row */}
          <div className="flex flex-wrap gap-6">
            {/* Priority Pills */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-[#6b6b7b] font-medium mb-3 block">Priority</label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      formData.priority === p.value
                        ? 'bg-[rgba(255,255,255,0.08)] text-[#f0f0f5]'
                        : 'text-[#6b6b7b] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: p.color,
                        boxShadow: formData.priority === p.value ? `0 0 8px ${p.color}` : 'none'
                      }}
                    />
                    {p.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-[#6b6b7b] font-medium mb-3 block">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg text-[#9898a8] text-sm focus:outline-none focus:border-[rgba(99,102,241,0.3)] transition-all appearance-none cursor-pointer"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Collapsible Details Section */}
          <details className="group">
            <summary className="flex items-center gap-2 text-sm text-[#6b6b7b] cursor-pointer hover:text-[#9898a8] transition-colors list-none">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
              Additional details
            </summary>
            
            <div className="mt-6 space-y-6 pl-6 border-l border-[rgba(255,255,255,0.05)]">
              {/* Steps to reproduce */}
              <div>
                <label className="text-xs text-[#6b6b7b] font-medium mb-2 block">Steps to reproduce</label>
                <textarea
                  name="steps_to_reproduce"
                  value={formData.steps_to_reproduce}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl text-[#e0e0e5] text-sm placeholder-[#3a3a48] focus:outline-none focus:border-[rgba(99,102,241,0.3)] transition-all resize-none"
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                />
              </div>

              {/* Expected vs Actual */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#6b6b7b] font-medium mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    Expected behavior
                  </label>
                  <textarea
                    name="expected_behavior"
                    value={formData.expected_behavior}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl text-[#e0e0e5] text-sm placeholder-[#3a3a48] focus:outline-none focus:border-[rgba(34,197,94,0.3)] transition-all resize-none"
                    placeholder="What should happen"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b6b7b] font-medium mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                    Actual behavior
                  </label>
                  <textarea
                    name="actual_behavior"
                    value={formData.actual_behavior}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl text-[#e0e0e5] text-sm placeholder-[#3a3a48] focus:outline-none focus:border-[rgba(239,68,68,0.3)] transition-all resize-none"
                    placeholder="What actually happens"
                  />
                </div>
              </div>

              {/* Environment */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#6b6b7b] font-medium mb-2 block">Browser</label>
                  <input
                    type="text"
                    name="browser"
                    value={formData.browser}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg text-[#9898a8] text-sm placeholder-[#3a3a48] focus:outline-none focus:border-[rgba(99,102,241,0.3)] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b6b7b] font-medium mb-2 block">Operating System</label>
                  <input
                    type="text"
                    name="os"
                    value={formData.os}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg text-[#9898a8] text-sm placeholder-[#3a3a48] focus:outline-none focus:border-[rgba(99,102,241,0.3)] transition-all"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Attachment - Compact */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-xl p-4 transition-all ${
              isDragging 
                ? 'border-2 border-dashed border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.05)]' 
                : imageFile 
                  ? 'border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.03)]'
                  : 'border border-dashed border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            {imageFile ? (
              <div className="flex items-center gap-3">
                <img src={URL.createObjectURL(imageFile)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e0e0e5] truncate">{imageFile.name}</p>
                  <p className="text-[10px] text-[#6b6b7b]">{(imageFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setImageFile(null)}
                  className="p-1 text-[#6b6b7b] hover:text-[#f87171] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 text-sm">
                <svg className="w-5 h-5 text-[#4a4a58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[#6b6b7b]">
                  <label className="text-[#818cf8] hover:text-[#a5b4fc] cursor-pointer font-medium">
                    Upload
                    <input type="file" accept="image/*" onChange={handleImageChange} disabled={loading} className="sr-only" />
                  </label>
                  {' '}or drag an image
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[rgba(255,255,255,0.05)]">
            <div className="hidden sm:flex items-center gap-4 text-[11px] text-[#4a4a58]">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded text-[10px]">Esc</kbd>
                Cancel
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded text-[10px]">⌘↵</kbd>
                Submit
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm text-[#6b6b7b] hover:text-[#9898a8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || submitting || !formData.title || !formData.description}
                className="px-5 py-2 bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {(loading || submitting) ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Issue'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  )
}

