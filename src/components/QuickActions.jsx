import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'

/**
 * Command palette / Quick Actions component (Cmd+K style)
 * Enhanced with categories, recent items, and better UI
 */
export function QuickActions({ bugs = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    const saved = localStorage.getItem('bugtracker-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 3))
      } catch {
      }
    }
  }, [])
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    
    const handleOpenQuickActions = () => setIsOpen(true)
    
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-quick-actions', handleOpenQuickActions)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-quick-actions', handleOpenQuickActions)
    }
  }, [])

  // Close with Escape
  useKeyboardShortcut('Escape', () => {
    if (isOpen) {
      setIsOpen(false)
      setQuery('')
    }
  })

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])
  const saveToRecent = (label, path) => {
    const newRecent = [{ label, path }, ...recentSearches.filter(r => r.path !== path)].slice(0, 3)
    setRecentSearches(newRecent)
    localStorage.setItem('bugtracker-recent-searches', JSON.stringify(newRecent))
  }
  const quickActions = [
    {
      id: 'new-bug',
      label: 'Create New Bug Report',
      category: 'actions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      iconBg: 'bg-emerald-100 text-emerald-600',
      shortcut: 'N',
      action: () => navigate('/create'),
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      category: 'navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      iconBg: 'bg-blue-100 text-blue-600',
      shortcut: 'G',
      action: () => navigate('/'),
    },
    {
      id: 'shortcuts',
      label: 'View Keyboard Shortcuts',
      category: 'help',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        </svg>
      ),
      iconBg: 'bg-purple-100 text-purple-600',
      shortcut: 'Ctrl+/',
      action: () => window.dispatchEvent(new CustomEvent('open-shortcuts-help')),
    },
    {
      id: 'signout',
      label: 'Sign Out',
      category: 'account',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      iconBg: 'bg-red-100 text-red-600',
      shortcut: 'Ctrl+Shift+X',
      action: () => {
        const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'x' })
        document.dispatchEvent(event)
      },
    },
  ]
  const bugResults = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return bugs
      .filter(bug => 
        bug.title?.toLowerCase().includes(q) ||
        bug.description?.toLowerCase().includes(q) ||
        bug.id?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(bug => ({
        id: `bug-${bug.id}`,
        label: bug.title,
        sublabel: `#${bug.id.slice(0, 8)} · ${bug.status} · ${bug.priority}`,
        category: 'bugs',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        iconBg: bug.priority === 'High' ? 'bg-red-100 text-red-600' : 
                bug.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 
                'bg-emerald-100 text-emerald-600',
        status: bug.status,
        priority: bug.priority,
        action: () => {
          saveToRecent(bug.title, `/bug/${bug.id}`)
          navigate(`/bug/${bug.id}`)
        },
      }))
  }, [bugs, query, navigate])
  const recentItems = recentSearches.map((item, i) => ({
    id: `recent-${i}`,
    label: item.label,
    category: 'recent',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-slate-100 text-slate-600',
    action: () => navigate(item.path),
  }))
  const allActions = [...quickActions, ...bugResults]
  
  const filteredActions = useMemo(() => {
    if (!query) {
      // Show recent + quick actions when no query
      return [...recentItems, ...quickActions]
    }
    return allActions.filter(action => 
      action.label.toLowerCase().includes(query.toLowerCase()) ||
      action.sublabel?.toLowerCase().includes(query.toLowerCase())
    )
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

  const categoryLabels = {
    recent: 'Recent',
    actions: 'Quick Actions',
    navigation: 'Navigation',
    bugs: 'Bug Reports',
    help: 'Help',
    account: 'Account',
  }

  const categoryOrder = ['recent', 'bugs', 'actions', 'navigation', 'help', 'account']
  const flatActions = categoryOrder.flatMap(cat => groupedActions[cat] || [])
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, flatActions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (flatActions[selectedIndex]) {
          flatActions[selectedIndex].action()
          setIsOpen(false)
          setQuery('')
        }
        break
    }
  }
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  let globalIndex = -1

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={() => {
          setIsOpen(false)
          setQuery('')
        }}
      />
      
      {/* Modal */}
      <div className="relative flex items-start justify-center min-h-screen pt-[15vh] px-4">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-scale border border-slate-200/50">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 border-b border-slate-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search bugs, actions, or type a command..."
              className="flex-1 py-5 text-lg text-slate-800 placeholder-slate-400 bg-transparent border-none outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200">
              ESC
            </kbd>
          </div>
          
          {/* Results */}
          <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
            {flatActions.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No results found</p>
                <p className="text-sm text-slate-400 mt-1">Try searching for something else</p>
              </div>
            ) : (
              categoryOrder.map(category => {
                const items = groupedActions[category]
                if (!items || items.length === 0) return null
                
                return (
                  <div key={category} className="py-2">
                    <div className="px-5 py-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {categoryLabels[category]}
                      </span>
                    </div>
                    {items.map((action) => {
                      globalIndex++
                      const currentIndex = globalIndex
                      const isSelected = currentIndex === selectedIndex
                      
                      return (
                        <button
                          key={action.id}
                          data-index={currentIndex}
                          onClick={() => {
                            action.action()
                            setIsOpen(false)
                            setQuery('')
                          }}
                          className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-all duration-150 ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-blue-500'
                              : 'hover:bg-slate-50 border-l-2 border-transparent'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                            {action.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                              {action.label}
                            </p>
                            {action.sublabel && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-slate-400 truncate">{action.sublabel}</p>
                                {action.status && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    action.status === 'Open' ? 'bg-blue-100 text-blue-600' :
                                    action.status === 'In Progress' ? 'bg-purple-100 text-purple-600' :
                                    'bg-emerald-100 text-emerald-600'
                                  }`}>
                                    {action.status}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {action.shortcut && (
                            <kbd className="flex-shrink-0 px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200">
                              {action.shortcut}
                            </kbd>
                          )}
                          {isSelected && (
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 text-xs bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-500">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold shadow-sm">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold shadow-sm">↓</kbd>
                <span className="text-slate-400">Navigate</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold shadow-sm">↵</kbd>
                <span className="text-slate-400">Select</span>
              </span>
            </div>
            <span className="text-slate-400">
              {flatActions.length} {flatActions.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
