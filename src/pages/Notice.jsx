import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBugs, useBugMutations } from '../hooks/useBugs'
import { useDebounce } from '../hooks/useDebounce'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { DashboardSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { useToast } from '../components/Toast'
import BugCard from '../components/BugCard'
import Analytics from '../components/Analytics'
import KanbanBoard from '../components/KanbanBoard'
import { ExportMenu } from '../lib/exportUtils.jsx'
import {
  BUG_STATUS_LIST,
  BUG_PRIORITY_LIST,
  PRIORITY_ORDER,
  SHORTCUT_KEYS,
} from '../lib/constants'
import { motion, PageWrapper } from '../lib/motion'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const exportMenuRef = useRef(null)
  const { showToast } = useToast()
  const { session, isAdmin } = useAuth()

  const [viewMode, setViewMode] = useState('grid')
  const [showExportMenu, setShowExportMenu] = useState(false)

  // ============================================
  // SINGLE SOURCE OF TRUTH - All bugs from DB
  // ============================================
  const { bugs: allBugs, loading, error, refetch } = useBugs({ includeArchived: true })
  const { unarchiveBug, loading: mutationLoading } = useBugMutations()

  // ============================================
  // CENTRALIZED FILTER STATE - One object rules all
  // ============================================
  const [filters, setFilters] = useState({
    archived: false,      // false = Active tab, true = Archived tab
    status: '',           // '' | 'Open' | 'In Progress' | 'Resolved'
    priority: '',         // '' | 'Low' | 'Medium' | 'High'
    search: '',           // search query
  })

  const debouncedSearch = useDebounce(filters.search, 300)

  // ============================================
  // DERIVED STATE - Computed from source of truth
  // ============================================

  // Active bugs (not archived) - for stats
  const activeBugs = useMemo(() =>
    allBugs.filter(bug => !bug.is_archived),
    [allBugs]
  )

  // Archived bugs - for stats  
  const archivedBugs = useMemo(() =>
    allBugs.filter(bug => bug.is_archived),
    [allBugs]
  )

  // Stats computed from active bugs only
  const stats = useMemo(() => {
    const open = activeBugs.filter(b => b.status === 'Open').length
    const inProgress = activeBugs.filter(b => b.status === 'In Progress').length
    const resolved = activeBugs.filter(b => b.status === 'Resolved').length
    return { open, inProgress, resolved, total: activeBugs.length }
  }, [activeBugs])

  // ============================================
  // SINGLE DERIVATION FUNCTION - This fixes everything
  // ============================================
  const visibleBugs = useMemo(() => {
    return allBugs
      .filter(bug => {
        // Filter by archived status (tab)
        if (filters.archived !== bug.is_archived) return false
        // Filter by status
        if (filters.status && bug.status !== filters.status) return false
        // Filter by priority
        if (filters.priority && bug.priority !== filters.priority) return false
        // Filter by search
        if (debouncedSearch) {
          const query = debouncedSearch.toLowerCase()
          const matchesTitle = bug.title?.toLowerCase().includes(query)
          const matchesDescription = bug.description?.toLowerCase().includes(query)
          const reporterName = bug.reported_by_name || (bug.reported_by_email ? bug.reported_by_email.split('@')[0] : '')
          const matchesReporter = reporterName.toLowerCase().includes(query) ||
            (bug.reported_by_email || '').toLowerCase().includes(query)
          if (!matchesTitle && !matchesDescription && !matchesReporter) return false
        }
        return true
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [allBugs, filters.archived, filters.status, filters.priority, debouncedSearch])

  // Total bugs in current tab (before other filters)
  const bugsInCurrentTab = useMemo(() =>
    filters.archived ? archivedBugs.length : activeBugs.length,
    [filters.archived, archivedBugs.length, activeBugs.length]
  )

  const hasActiveFilters = filters.status || filters.priority || filters.search

  // ============================================
  // FILTER ACTIONS - Replace, don't stack
  // ============================================
  const setTab = useCallback((tab) => {
    setFilters(f => ({
      ...f,
      archived: tab === 'archived',
      status: '',
      priority: '',
      search: '',
    }))
  }, [])

  const setStatusFilter = useCallback((status) => {
    setFilters(f => ({ ...f, status }))
  }, [])

  const setPriorityFilter = useCallback((priority) => {
    setFilters(f => ({ ...f, priority }))
  }, [])

  const setSearchQuery = useCallback((search) => {
    setFilters(f => ({ ...f, search }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(f => ({
      ...f,
      status: '',
      priority: '',
      search: '',
    }))
  }, [])

  // Close export menu on outside click or ESC
  useEffect(() => {
    if (!showExportMenu) return

    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false)
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowExportMenu(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showExportMenu])

  useKeyboardShortcut(SHORTCUT_KEYS.NEW_BUG, () => navigate('/issue'))
  useKeyboardShortcut(SHORTCUT_KEYS.SEARCH, () => searchInputRef.current?.focus())
  useKeyboardShortcut(SHORTCUT_KEYS.GO_HOME, () => navigate('/'))

  const handleUnarchive = async (bugId) => {
    const result = await unarchiveBug(bugId, session?.user?.id, session?.user?.email)
    if (result.success) {
      showToast('Bug restored', 'success')
      refetch()
    } else {
      showToast('Failed to restore', 'error')
    }
  }

  useEffect(() => {
    const handleBugArchived = () => refetch()
    window.addEventListener('bug-archived', handleBugArchived)
    return () => window.removeEventListener('bug-archived', handleBugArchived)
  }, [refetch])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060a] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DashboardSkeleton count={6} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center p-6">
        <div className="relative bg-gradient-to-b from-[#0f0f15] to-[#0a0a0f] border border-[rgba(255,255,255,0.08)] rounded-3xl p-10 max-w-md text-center shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          {/* Ambient glow */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgba(239,68,68,0.1)] to-transparent rounded-3xl blur-2xl opacity-50" />

          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#ef4444]/20 to-[#ef4444]/5 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#ef4444] text-[14px] mb-5">{error}</p>
          <button onClick={refetch} className="px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[13px] font-medium rounded-xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all duration-300">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper className="min-h-screen bg-[#06060a]">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[rgba(99,102,241,0.08)] rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[rgba(139,92,246,0.06)] rounded-full blur-3xl animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[28px] font-bold text-[#f0f0f5] tracking-[-0.03em]">Issues</h1>
            <p className="text-[14px] text-[#6b6b7b] mt-1.5">{stats.total} total · Track and manage bugs</p>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="hidden md:flex items-center bg-[#0a0a0f] border border-[rgba(255,255,255,0.06)] rounded-2xl p-1.5">
              {[
                { id: 'grid', icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z', label: 'Grid' },
                { id: 'kanban', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Board' },
                { id: 'analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Stats' },
              ].map(({ id, icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`p-2 rounded-xl transition-all duration-200 ${viewMode === id
                    ? 'bg-gradient-to-br from-[#14141c] to-[#1a1a24] text-[#f0f0f5] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                    : 'text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                  </svg>
                </button>
              ))}
            </div>

            {/* Export */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2.5 text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.04)] rounded-xl transition-all duration-200"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              {showExportMenu && <ExportMenu bugs={activeBugs} onClose={() => setShowExportMenu(false)} />}
            </div>

            {/* New Issue */}
            <Link
              to="/issue"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[13px] font-semibold rounded-2xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Issue</span>
            </Link>
          </div>
        </div>

        {/* Analytics View */}
        {viewMode === 'analytics' && <Analytics bugs={activeBugs} />}

        {/* Kanban View */}
        {viewMode === 'kanban' && <KanbanBoard bugs={activeBugs} onUpdate={refetch} />}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <>
            {/* Stats Bar - Fluid pills */}
            {stats.total > 0 && (
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => setStatusFilter(filters.status === 'Open' ? '' : 'Open')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${filters.status === 'Open' ? 'bg-[rgba(99,102,241,0.15)] text-[#f0f0f5] scale-105 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-[#6b6b7b] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] hover:scale-102 active:scale-95'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <span className="text-[13px] font-medium">{stats.open} Open</span>
                </button>
                <button
                  onClick={() => setStatusFilter(filters.status === 'In Progress' ? '' : 'In Progress')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${filters.status === 'In Progress' ? 'bg-[rgba(245,158,11,0.15)] text-[#f0f0f5] scale-105 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'text-[#6b6b7b] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] hover:scale-102 active:scale-95'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  <span className="text-[13px] font-medium">{stats.inProgress} In Progress</span>
                </button>
                <button
                  onClick={() => setStatusFilter(filters.status === 'Resolved' ? '' : 'Resolved')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${filters.status === 'Resolved' ? 'bg-[rgba(34,197,94,0.15)] text-[#f0f0f5] scale-105 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'text-[#6b6b7b] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] hover:scale-102 active:scale-95'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-[13px] font-medium">{stats.resolved} Resolved</span>
                </button>
                {filters.status && (
                  <button onClick={() => setStatusFilter('')} className="text-[#4a4a58] hover:text-[#9898a8] text-[12px] ml-auto">
                    Clear filter
                  </button>
                )}
              </div>
            )}

            {/* Filters - Organic glass panel */}
            <div className="relative bg-gradient-to-b from-[#0a0a0f] to-[#0f0f15] border border-[rgba(255,255,255,0.06)] rounded-3xl mb-8 overflow-hidden">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent" />

              {/* Tabs */}
              <div className="flex border-b border-[rgba(255,255,255,0.05)]">
                <button
                  onClick={() => setTab('active')}
                  className={`relative px-6 py-4 text-[13px] font-medium transition-all duration-200 ${!filters.archived ? 'text-[#f0f0f5]' : 'text-[#6b6b7b] hover:text-[#9898a8]'
                    }`}
                >
                  Active
                  {activeBugs.length > 0 && <span className="ml-2 text-[12px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#6b6b7b]">{activeBugs.length}</span>}
                  {!filters.archived && <span className="absolute bottom-0 left-6 right-6 h-[3px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full" />}
                </button>
                <button
                  onClick={() => setTab('archived')}
                  className={`relative px-6 py-4 text-[13px] font-medium transition-all duration-200 ${filters.archived ? 'text-[#f0f0f5]' : 'text-[#6b6b7b] hover:text-[#9898a8]'
                    }`}
                >
                  Archived
                  {archivedBugs.length > 0 && <span className="ml-2 text-[12px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[#6b6b7b]">{archivedBugs.length}</span>}
                  {filters.archived && <span className="absolute bottom-0 left-6 right-6 h-[3px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full" />}
                </button>
              </div>

              {/* Search & Filters */}
              <div className="p-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative group">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a58] group-focus-within:text-[#6366f1] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={filters.search}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search issues..."
                    className="w-full pl-11 pr-4 py-3 bg-[#06060a] border border-[rgba(255,255,255,0.06)] rounded-2xl text-[13px] text-[#f0f0f5] placeholder-[#4a4a58] focus:outline-none focus:border-[#6366f1] focus:bg-[#0a0a0f] transition-all duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filters.priority}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-3 bg-[#06060a] border border-[rgba(255,255,255,0.06)] rounded-2xl text-[13px] text-[#9898a8] focus:outline-none focus:border-[#6366f1] transition-all duration-200 cursor-pointer appearance-none"
                  >
                    <option value="">Priority</option>
                    {BUG_PRIORITY_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-[#06060a] border border-[rgba(255,255,255,0.06)] rounded-2xl text-[13px] text-[#9898a8] focus:outline-none focus:border-[#6366f1] transition-all duration-200 cursor-pointer appearance-none"
                  >
                    <option value="">Status</option>
                    {BUG_STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="px-4 py-2 text-[13px] text-[#6b6b7b] hover:text-[#9898a8] transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="px-5 pb-4 text-[12px] text-[#4a4a58]">
                {visibleBugs.length} of {bugsInCurrentTab} issues
              </div>
            </div>

            {/* Issues Grid */}
            <div className="px-2 sm:px-4 lg:px-8 xl:px-12">
              {bugsInCurrentTab === 0 ? (
                filters.archived ? (
                  <EmptyState icon="Archive" title="No archived issues" description="Archived issues will appear here." />
                ) : (
                  <div className="relative bg-gradient-to-b from-[#0a0a0f] to-[#0f0f15] border border-[rgba(255,255,255,0.06)] rounded-3xl p-20 text-center overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-[rgba(99,102,241,0.1)] to-[rgba(139,92,246,0.05)] rounded-full blur-3xl" />

                    <div className="relative">
                      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#14141c] to-[#0a0a0f] flex items-center justify-center border border-[rgba(255,255,255,0.06)]">
                        <svg className="w-7 h-7 text-[#4a4a58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-[#6b6b7b] text-[14px] mb-6">No issues yet</p>
                      <Link to="/issue" className="inline-flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[13px] font-semibold rounded-2xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Issue
                      </Link>
                    </div>
                  </div>
                )
              ) : visibleBugs.length === 0 ? (
                <div className="relative bg-gradient-to-b from-[#0a0a0f] to-[#0f0f15] border border-[rgba(255,255,255,0.06)] rounded-3xl p-20 text-center">
                  <p className="text-[#6b6b7b] text-[14px] mb-4">No matching issues</p>
                  <button onClick={clearFilters} className="text-[#6366f1] text-[13px] hover:underline">Clear filters</button>
                </div>
              ) : (
                <motion.div
                  key={`grid-${filters.archived}-${filters.status || 'all'}-${filters.priority || 'all'}-${debouncedSearch || ''}`}
                  className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {visibleBugs.map((bug) => (
                    <motion.div
                      key={bug.id}
                      className="relative"
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
                      }}
                    >
                      {filters.archived && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnarchive(bug.id) }}
                          disabled={mutationLoading}
                          className="absolute -top-2 -right-2 z-10 px-3 py-1.5 text-[11px] font-semibold bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-full hover:shadow-[0_4px_20px_rgba(34,197,94,0.4)] disabled:opacity-50 transition-all duration-200"
                        >
                          Restore
                        </button>
                      )}
                      <BugCard bug={bug} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  )
}
