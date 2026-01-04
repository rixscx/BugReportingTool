import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'

export function QuickActions({ bugs = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const previousFocusRef = useRef(null)
  const modalRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('bugtracker-recent-searches')
    if (saved) {
      try { setRecentSearches(JSON.parse(saved).slice(0, 3)) } catch { }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        previousFocusRef.current = document.activeElement
        setIsOpen(true)
      }
    }
    const handleOpenQuickActions = () => {
      previousFocusRef.current = document.activeElement
      setIsOpen(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-quick-actions', handleOpenQuickActions)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-quick-actions', handleOpenQuickActions)
    }
  }, [])

  useKeyboardShortcut('Escape', () => { if (isOpen) handleClose() })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setTimeout(() => previousFocusRef.current?.focus(), 100)
  }, [])

  const saveToRecent = (label, path) => {
    const newRecent = [{ label, path }, ...recentSearches.filter(r => r.path !== path)].slice(0, 3)
    setRecentSearches(newRecent)
    localStorage.setItem('bugtracker-recent-searches', JSON.stringify(newRecent))
  }

  const quickActions = [
    { id: 'new-bug', label: 'Create new bug', category: 'actions', shortcut: 'N', action: () => navigate('/issue') },
    { id: 'dashboard', label: 'Go to dashboard', category: 'navigation', shortcut: 'G D', action: () => navigate('/') },
    { id: 'logs', label: 'View activity logs', category: 'navigation', shortcut: 'G L', action: () => navigate('/logs') },
    { id: 'shortcuts', label: 'Keyboard shortcuts', category: 'help', shortcut: '?', action: () => { handleClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('open-shortcuts-help')), 100) } },
    { id: 'signout', label: 'Sign out', category: 'account', action: () => { const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'x' }); document.dispatchEvent(event) } },
  ]

  const bugResults = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return bugs
      .filter(bug => bug.title?.toLowerCase().includes(q) || bug.description?.toLowerCase().includes(q) || bug.id?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(bug => ({
        id: `bug-${bug.id}`,
        label: bug.title,
        sublabel: `#${bug.id.slice(0, 8)} · ${bug.status}`,
        category: 'bugs',
        action: () => { saveToRecent(bug.title, `/bug/${bug.id}`); navigate(`/bug/${bug.id}`) },
      }))
  }, [bugs, query, navigate])

  const recentItems = recentSearches.map((item, i) => ({
    id: `recent-${i}`,
    label: item.label,
    category: 'recent',
    action: () => navigate(item.path),
  }))

  const allActions = [...quickActions, ...bugResults]

  const filteredActions = useMemo(() => {
    if (!query) return [...recentItems, ...quickActions]
    return allActions.filter(action => action.label.toLowerCase().includes(query.toLowerCase()) || action.sublabel?.toLowerCase().includes(query.toLowerCase()))
  }, [query, allActions, recentItems, quickActions])

  const groupedActions = useMemo(() => {
    const groups = {}
    filteredActions.forEach(action => {
      const cat = action.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(action)
    })
    return groups
  }, [filteredActions])

  const categoryLabels = { recent: 'Recent', actions: 'Actions', navigation: 'Navigation', bugs: 'Bugs', help: 'Help', account: 'Account' }
  const categoryOrder = ['recent', 'bugs', 'actions', 'navigation', 'help', 'account']
  const flatActions = categoryOrder.flatMap(cat => groupedActions[cat] || [])

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, flatActions.length - 1)); break
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)); break
      case 'Enter': e.preventDefault(); if (flatActions[selectedIndex]) { flatActions[selectedIndex].action(); handleClose() }; break
    }
  }

  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  let globalIndex = -1

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[#06060a]/80 backdrop-blur-xl animate-fade-in" onClick={handleClose} />

      <div className="relative flex items-start justify-center min-h-screen pt-[10vh] px-4 pointer-events-none">
        {/* Ambient glow */}
        <div className="absolute top-[8vh] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[rgba(99,102,241,0.08)] blur-[100px] pointer-events-none" />
        
        <div
          ref={modalRef}
          className="relative w-full max-w-xl bg-[rgba(12,12,18,0.95)] rounded-3xl border border-[rgba(255,255,255,0.08)] overflow-hidden pointer-events-auto shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_120px_rgba(99,102,241,0.1)] animate-scale-in backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Command palette"
        >
          {/* Top gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/40 to-transparent" />
          
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-4">
            <div className="p-2 rounded-xl bg-[rgba(99,102,241,0.1)] text-[#6366f1]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
              onKeyDown={handleKeyDown}
              placeholder="Search bugs or type a command..."
              className="flex-1 text-sm text-[#f0f0f5] placeholder-[#4a4a58] bg-transparent outline-none"
            />
            <kbd className="hidden sm:flex items-center px-2.5 py-1 text-[10px] font-medium text-[#4a4a58] bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.08)]">
              esc
            </kbd>
          </div>

          <div ref={resultsRef} className="max-h-[360px] overflow-y-auto">
            {flatActions.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#9898a8] font-medium">No results found</p>
                <p className="text-xs text-[#4a4a58] mt-1.5">Try a different search term</p>
              </div>
            ) : (
              categoryOrder.map(category => {
                const items = groupedActions[category]
                if (!items || items.length === 0) return null
                return (
                  <div key={category} className="py-2">
                    <div className="px-5 py-2">
                      <span className="text-[10px] font-medium text-[#4a4a58] uppercase tracking-widest">{categoryLabels[category]}</span>
                    </div>
                    {items.map((action) => {
                      globalIndex++
                      const currentIndex = globalIndex
                      const isSelected = currentIndex === selectedIndex
                      return (
                        <button
                          key={action.id}
                          data-index={currentIndex}
                          onClick={() => { action.action(); handleClose() }}
                          className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-all duration-150 ${isSelected ? 'bg-[rgba(99,102,241,0.1)]' : 'hover:bg-[rgba(255,255,255,0.03)]'}`}
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 ${isSelected ? 'bg-[#6366f1] shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-[#35354a]'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] truncate transition-colors ${isSelected ? 'text-[#f0f0f5]' : 'text-[#9898a8]'}`}>{action.label}</p>
                            {action.sublabel && <p className="text-[11px] text-[#4a4a58] truncate mt-0.5">{action.sublabel}</p>}
                          </div>
                          {action.shortcut && (
                            <kbd className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-[#4a4a58] bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.08)]">{action.shortcut}</kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] flex items-center justify-between">
            <div className="flex items-center gap-5 text-[10px] text-[#4a4a58]">
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg font-medium">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg font-medium">↵</kbd>
                select
              </span>
            </div>
            <span className="text-[10px] text-[#4a4a58] font-medium">{flatActions.length} results</span>
          </div>
        </div>
      </div>
    </div>
  )
}
