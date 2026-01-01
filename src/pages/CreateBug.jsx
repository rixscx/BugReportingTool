import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { useBugs } from '../hooks/useBugs'
import { SHORTCUT_KEYS } from '../lib/constants'
import { useToast } from '../components/Toast'
import { DuplicateDetector, LabelSelector } from '../components/BugHelpers'

export default function CreateBug({ session }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { bugs: existingBugs } = useBugs({ includeArchived: false })
  const titleInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedLabels, setSelectedLabels] = useState([])
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
    version: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let browserVersion = ''
    let os = 'Unknown'
    let osVersion = ''
    if (ua.includes('Edg/')) {
      browser = 'Edge'
      browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || ''
    } else if (ua.includes('Chrome/')) {
      browser = 'Chrome'
      browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || ''
    } else if (ua.includes('Firefox/')) {
      browser = 'Firefox'
      browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || ''
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      browser = 'Safari'
      browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || ''
    } else if (ua.includes('Opera') || ua.includes('OPR/')) {
      browser = 'Opera'
      browserVersion = ua.match(/(?:Opera|OPR)\/([\d.]+)/)?.[1] || ''
    }
    if (ua.includes('Windows NT')) {
      os = 'Windows'
      const ntVersion = ua.match(/Windows NT ([\d.]+)/)?.[1]
      const winVersions = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' }
      osVersion = winVersions[ntVersion] || ntVersion || ''
    } else if (ua.includes('Mac OS X')) {
      os = 'macOS'
      osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || ''
    } else if (ua.includes('Linux')) {
      os = 'Linux'
      if (ua.includes('Ubuntu')) osVersion = 'Ubuntu'
      else if (ua.includes('Fedora')) osVersion = 'Fedora'
      else if (ua.includes('Android')) {
        os = 'Android'
        osVersion = ua.match(/Android ([\d.]+)/)?.[1] || ''
      }
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      os = ua.includes('iPad') ? 'iPadOS' : 'iOS'
      osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || ''
    }
    const browserStr = browserVersion ? `${browser} ${browserVersion.split('.')[0]}` : browser
    const osStr = osVersion ? `${os} ${osVersion}` : os
    
    setFormData(prev => ({ ...prev, browser: browserStr, os: osStr }))
  }, [])

  useEffect(() => {
    titleInputRef.current?.focus()
  }, [])

  useKeyboardShortcut(SHORTCUT_KEYS.ESCAPE, () => {
    if (!loading) navigate('/')
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
        const form = document.querySelector('form')
        if (form && formData.title && formData.description) {
          form.requestSubmit()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [loading, formData])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 2 * 1024 * 1024
    if (!allowedTypes.includes(file.type)) return 'Only images (JPEG, PNG, GIF, WebP) are allowed.'
    if (file.size > maxSize) return 'File size must be less than 2MB.'
    return null
  }

  const handleImageChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0], e.target)
  }

  const processFile = (file, inputElement = null) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setImageFile(null)
      if (inputElement) inputElement.value = ''
      return
    }
    setError(null)
    setImageFile(file)
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0])
  }

  const uploadImage = async () => {
    if (!imageFile) return null
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('Bug images').upload(fileName, imageFile)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('Bug images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let imageUrl = null
      if (imageFile) imageUrl = await uploadImage()

      let fullDescription = formData.description
      if (formData.expected_behavior || formData.actual_behavior) {
        fullDescription += '\n\n---'
        if (formData.expected_behavior) fullDescription += `\n\n**Expected:** ${formData.expected_behavior}`
        if (formData.actual_behavior) fullDescription += `\n\n**Actual:** ${formData.actual_behavior}`
      }
      if (formData.browser || formData.os || formData.version) {
        fullDescription += `\n\n**Environment:** ${formData.browser} / ${formData.os}${formData.version ? ` / v${formData.version}` : ''}`
      }

      const { error: insertError } = await supabase.from('bugs').insert({
        title: formData.title,
        description: fullDescription,
        steps_to_reproduce: formData.steps_to_reproduce,
        priority: formData.priority,
        status: 'Open',
        image_url: imageUrl,
        reported_by: session.user.id,
      })

      if (insertError) throw insertError
      showToast('Bug report submitted!', 'success')
      navigate('/')
    } catch (err) {
      setError(err.message)
      showToast('Failed to submit bug report', 'error')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['Bug', 'Feature Request', 'Improvement', 'Documentation', 'Question']

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Report a Bug</h1>
          <p className="text-slate-500 text-sm mt-1">Help us improve by reporting issues you encounter</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-6">
          
            {/* Main Form - Left Side */}
            <div className="col-span-12 lg:col-span-8 space-y-5">
            
            {/* Title */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Bug Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
                placeholder="Enter a clear, descriptive title for the issue"
                required
              />
              
              {/* Duplicate Detection */}
              <DuplicateDetector 
                title={formData.title} 
                bugs={existingBugs} 
                onSelect={(bug) => navigate(`/bug/${bug.id}`)}
              />
            </div>

            {/* Description & Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {formData.description.length}/2000
                  </span>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={7}
                  maxLength={2000}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  placeholder="Describe the bug in detail. What happened? When did it occur?"
                  required
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Steps to Reproduce
                </label>
                <textarea
                  name="steps_to_reproduce"
                  value={formData.steps_to_reproduce}
                  onChange={handleChange}
                  rows={7}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  placeholder={"1. Navigate to the page...\n2. Click on the button...\n3. Fill in the form...\n4. Submit and observe..."}
                />
              </div>
            </div>

            {/* Expected & Actual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-slate-700">Expected Behavior</label>
                </div>
                <textarea
                  name="expected_behavior"
                  value={formData.expected_behavior}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/80 border border-emerald-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                  placeholder="What should have happened?"
                />
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-slate-700">Actual Behavior</label>
                </div>
                <textarea
                  name="actual_behavior"
                  value={formData.actual_behavior}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/80 border border-red-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                  placeholder="What actually happened instead?"
                />
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                Attachments <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                  isDragging ? 'border-blue-500 bg-blue-50' :
                  imageFile ? 'border-emerald-400 bg-emerald-50' :
                  'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                {imageFile ? (
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">{imageFile.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{(imageFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="mt-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-all"
                      >
                        Remove file
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                      <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-medium">
                      <label className="cursor-pointer text-blue-600 hover:text-blue-700 transition-colors">
                        Click to upload
                        <input type="file" accept="image/*" onChange={handleImageChange} disabled={loading} className="sr-only" />
                      </label>
                      {' '}or drag and drop
                    </p>
                    <p className="mt-2 text-sm text-slate-400">PNG, JPG, GIF, WebP up to 2MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            
            {/* Classification */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                Classification
              </h3>
              
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Labels
                </label>
                <LabelSelector selected={selectedLabels} onChange={setSelectedLabels} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'Low', color: 'emerald', desc: 'Minor issue, workaround exists' },
                    { value: 'Medium', color: 'amber', desc: 'Causes inconvenience' },
                    { value: 'High', color: 'red', desc: 'Critical, blocks workflow' },
                  ].map((p) => (
                    <label
                      key={p.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.priority === p.value
                          ? p.color === 'emerald' ? 'border-emerald-500 bg-emerald-50' :
                            p.color === 'amber' ? 'border-amber-500 bg-amber-50' :
                            'border-red-500 bg-red-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p.value}
                        checked={formData.priority === p.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded-full ${
                        p.color === 'emerald' ? 'bg-emerald-500' :
                        p.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800">{p.value}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                      </div>
                      {formData.priority === p.value && (
                        <svg className={`w-5 h-5 ${
                          p.color === 'emerald' ? 'text-emerald-500' :
                          p.color === 'amber' ? 'text-amber-500' : 'text-red-500'
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Environment */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                Environment
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Browser
                  </label>
                  <input
                    type="text"
                    name="browser"
                    value={formData.browser}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Chrome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    OS
                  </label>
                  <input
                    type="text"
                    name="os"
                    value={formData.os}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Windows"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  App Version
                </label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g., 1.2.3"
                />
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Pro Tips
              </h3>
              <ul className="space-y-3">
                {[
                  'Be specific about what you were doing',
                  'Include exact error messages',
                  'Screenshots help us understand faster',
                  'List clear steps to reproduce',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600 font-bold">{i + 1}</span>
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reporter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {session?.user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Reporting as</p>
                  <p className="text-sm text-slate-800 font-medium truncate max-w-[200px]">
                    {session?.user?.email || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-400 mr-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs">Esc</kbd>
              <span>Cancel</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs">Ctrl+↵</kbd>
              <span>Submit</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.description}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

