import { useState, useRef, useMemo } from 'react'
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

export default function Dashboard() {
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const { showToast } = useToast()
  
  const [activeTab, setActiveTab] = useState('active')
  const [viewMode, setViewMode] = useState('grid') // grid, kanban, analytics
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  const { bugs: activeBugs, loading: activeLoading, error: activeError, refetch: refetchActive } = useBugs({ includeArchived: false })
  const { bugs: archivedBugs, loading: archivedLoading, error: archivedError, refetch: refetchArchived } = useBugs({ includeArchived: true })
  
  const { unarchiveBug, loading: mutationLoading } = useBugMutations()
  
  const bugs = activeTab === 'active' ? activeBugs : archivedBugs.filter(b => b.is_archived)
  const loading = activeTab === 'active' ? activeLoading : archivedLoading
  const error = activeTab === 'active' ? activeError : archivedError
  const refetch = activeTab === 'active' ? refetchActive : refetchArchived
  
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  useKeyboardShortcut(SHORTCUT_KEYS.NEW_BUG, () => navigate('/create'))
  useKeyboardShortcut(SHORTCUT_KEYS.SEARCH, () => searchInputRef.current?.focus())
  useKeyboardShortcut(SHORTCUT_KEYS.GO_HOME, () => navigate('/'))
  
  const handleUnarchive = async (bugId) => {
    const result = await unarchiveBug(bugId)
    if (result.success) {
      showToast('Bug restored successfully', 'success')
      refetchActive()
      refetchArchived()
    } else {
      showToast('Failed to restore bug', 'error')
    }
  }

  const filteredBugs = useMemo(() => {
    return bugs
      .filter((bug) => {
        if (priorityFilter && bug.priority !== priorityFilter) return false
        if (statusFilter && bug.status !== statusFilter) return false
        if (debouncedSearch) {
          const query = debouncedSearch.toLowerCase()
          const matchesTitle = bug.title?.toLowerCase().includes(query)
          const matchesDescription = bug.description?.toLowerCase().includes(query)
          const reporterName = (bug.reported_by_name) || (bug.reported_by_email ? bug.reported_by_email.split('@')[0] : '')
          const matchesReporter = (reporterName || '').toLowerCase().includes(query) ||
            (bug.reported_by_email || '').toLowerCase().includes(query)
          if (!matchesTitle && !matchesDescription && !matchesReporter) return false
        }
        return true
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [bugs, priorityFilter, statusFilter, debouncedSearch])

  const stats = useMemo(() => {
    const open = activeBugs.filter(b => b.status === 'Open').length
    const inProgress = activeBugs.filter(b => b.status === 'In Progress').length
    const resolved = activeBugs.filter(b => b.status === 'Resolved').length
    const highPriority = activeBugs.filter(b => b.priority === 'High').length
    return { open, inProgress, resolved, highPriority, total: activeBugs.length }
  }, [activeBugs])

  const archivedCount = archivedBugs.filter(b => b.is_archived).length
  const hasActiveFilters = priorityFilter || statusFilter || searchQuery

  const clearFilters = () => {
    setPriorityFilter('')
    setStatusFilter('')
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <DashboardSkeleton count={8} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 p-6 max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Data</h3>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={refetch} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Track and manage all reported bugs
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="Kanban Board"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'analytics' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="Analytics"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 hover:border-slate-300 transition-colors"
                title="Export"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              {showExportMenu && (
                <ExportMenu bugs={activeBugs} onClose={() => setShowExportMenu(false)} />
              )}
            </div>

            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report Bug
            </Link>
          </div>
        </div>

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <Analytics bugs={activeBugs} />
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <KanbanBoard bugs={activeBugs} onUpdate={refetchActive} />
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <>
        {/* Stats */}
        {activeTab === 'active' && stats.total > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button onClick={() => setStatusFilter('Open')} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all text-left">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">{stats.open}</span>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-1">Open</p>
            </button>
            <button onClick={() => setStatusFilter('In Progress')} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-purple-300 hover:shadow-sm transition-all text-left">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">{stats.inProgress}</span>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-1">In Progress</p>
            </button>
            <button onClick={() => setStatusFilter('Resolved')} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-green-300 hover:shadow-sm transition-all text-left">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">{stats.resolved}</span>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-1">Resolved</p>
            </button>
            <button onClick={() => setPriorityFilter('High')} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-red-300 hover:shadow-sm transition-all text-left">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">{stats.highPriority}</span>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-1">High Priority</p>
            </button>
          </div>
        )}

        {/* Filters & Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('active'); clearFilters() }}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Active
              {activeBugs.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {activeBugs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('archived'); clearFilters() }}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'archived'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Archived
              {archivedCount > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'archived' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {archivedCount}
                </span>
              )}
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bugs..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                {BUG_PRIORITY_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {BUG_STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-3 py-2.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="px-4 pb-3 text-xs text-slate-500">
            Showing {filteredBugs.length} of {bugs.length} bugs
            {hasActiveFilters && ' (filtered)'}
          </div>
        </div>

        {/* Bug Grid */}
        {bugs.length === 0 ? (
          activeTab === 'archived' ? (
            <EmptyState
              icon="Archive"
              title="No archived bugs"
              description="Archived bugs will appear here."
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No bugs yet</h3>
              <p className="text-slate-500 text-sm mb-6">Get started by reporting your first bug</p>
              <Link to="/create" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Report Bug
              </Link>
            </div>
          )
        ) : filteredBugs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No results found</h3>
            <p className="text-slate-500 text-sm mb-4">Try adjusting your filters</p>
            <button onClick={clearFilters} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBugs.map((bug) => (
              <div key={bug.id} className="relative">
                {activeTab === 'archived' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnarchive(bug.id)
                    }}
                    disabled={mutationLoading}
                    className="absolute -top-2 -right-2 z-10 flex items-center gap-1 px-2.5 py-1 text-xs bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Restore
                  </button>
                )}
                <BugCard bug={bug} />
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}
