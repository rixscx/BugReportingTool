import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { listBugImages } from '../lib/bugImageStorage'
import { useBugMutations } from '../hooks/useBugs'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { SHORTCUT_KEYS } from '../lib/constants'
import { BugDetailSkeleton } from '../components/Skeleton'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { CopyIconButton } from '../components/CopyButton'
import { useToast } from '../components/Toast'
import CommentSection from '../components/CommentSection'
import ActivityTimeline from '../components/ActivityTimeline'
import { formatSmartDate } from '../lib/dateUtils'
import MarkdownRenderer from '../components/MarkdownRenderer'

const priorityDot = { Low: '#4a4a58', Medium: '#eab308', High: '#ef4444' }
const statusDot = { 'Open': '#6366f1', 'In Progress': '#eab308', 'Resolved': '#22c55e' }

export default function BugDetail({ session, isAdmin }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const archiveDialog = useConfirmDialog()
  const deleteDialog = useConfirmDialog()

  const [bug, setBug] = useState(null)
  const [bugImages, setBugImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useKeyboardShortcut(SHORTCUT_KEYS.ESCAPE, () => navigate('/'))
  useKeyboardShortcut(SHORTCUT_KEYS.GO_HOME, () => navigate('/'))

  const fetchBug = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase.from('bugs').select('*').eq('id', id).single()
      if (fetchError) throw fetchError
      const images = await listBugImages(data.user_id, data.id)
      setBug({ ...data, preview_image: images[0] || null })
      setBugImages(images)
    } catch {
      setError('Bug not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchBug() }, [id, fetchBug])

  const { updateStatus: mutateStatus, archiveBug: mutateArchive, unarchiveBug: mutateRestore, deleteBug: mutateDelete, loading: mutationLoading } = useBugMutations()

  const handleUpdateStatus = async (newStatus) => {
    const oldStatus = bug.status
    setBug(prev => ({ ...prev, status: newStatus }))
    const result = await mutateStatus(id, newStatus, session.user.id, session.user.email, oldStatus)
    if (!result.success) {
      setBug(prev => ({ ...prev, status: oldStatus }))
      showToast(result.error || 'Failed', 'error')
    }
  }

  const handleArchive = async () => {
    const confirmed = await archiveDialog.confirm({ title: 'Archive Issue', description: 'Archive this issue?', confirmText: 'Archive', variant: 'warning' })
    if (!confirmed) return
    const result = await mutateArchive(id, session.user.id, session.user.email)
    if (result.success) { showToast('Archived', 'success'); navigate('/') }
    else showToast(result.error || 'Failed', 'error')
  }

  const handleRestore = async () => {
    const result = await mutateRestore(id, session.user.id, session.user.email)
    if (result.success) { showToast('Restored', 'success'); fetchBug() }
    else showToast(result.error || 'Failed', 'error')
  }

  const handleDelete = async () => {
    const canDelete = isAdmin || bug.user_id === session.user.id
    if (!canDelete) { showToast('Permission denied', 'error'); return }
    const confirmed = await deleteDialog.confirm({ title: 'Delete Issue', description: 'Permanently delete this issue?', confirmText: 'Delete', variant: 'danger' })
    if (!confirmed) return
    const result = await mutateDelete(bug, session.user.id, session.user.email, isAdmin)
    if (result.success) { showToast('Deleted', 'success'); navigate('/') }
    else showToast(result.error || 'Failed', 'error')
  }

  if (loading) return <BugDetailSkeleton />

  if (!bug) {
    return (
      <div className="min-h-screen bg-[#06060a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-[rgba(239,68,68,0.03)] blur-[100px]" />
        </div>
        <div className="relative bg-[rgba(12,12,18,0.7)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-10 max-w-md text-center backdrop-blur-xl">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[rgba(239,68,68,0.2)] to-transparent" />
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#f87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#f87171] text-sm mb-6">{error || 'Not found'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-sm font-medium rounded-xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)] transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06060a] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-[rgba(99,102,241,0.03)] blur-[120px] animate-breathe" />
        <div className="absolute bottom-40 left-1/4 w-[400px] h-[400px] rounded-full bg-[rgba(139,92,246,0.02)] blur-[100px] animate-breathe" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-mono text-[#4a4a58] bg-[rgba(12,12,18,0.7)] border border-[rgba(255,255,255,0.06)] px-3 py-1.5 rounded-xl backdrop-blur-xl">#{id.slice(0, 8)}</span>
            <CopyIconButton text={window.location.href} size="sm" title="Copy link" />
          </div>

          <div className="flex items-center gap-1.5">
            {!bug.is_archived && (
              <button 
                onClick={handleArchive} 
                disabled={mutationLoading} 
                className="p-2 text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all duration-200" 
                title="Archive"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            )}
            {bug.is_archived && (
              <button 
                onClick={handleRestore} 
                disabled={mutationLoading} 
                className="p-2 text-[#22c55e] hover:bg-[rgba(34,197,94,0.1)] rounded-xl transition-all duration-200" 
                title="Restore"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            {(isAdmin || session?.user?.id === bug.user_id) && (
              <button 
                onClick={handleDelete} 
                disabled={mutationLoading} 
                className="p-2 text-[#4a4a58] hover:text-[#f87171] hover:bg-[rgba(239,68,68,0.1)] rounded-xl transition-all duration-200" 
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Title & Meta */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#f0f0f5] mb-4 tracking-tight leading-tight">{bug.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[#818cf8]">
              <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: statusDot[bug.status] }}></span>
              {bug.status}
            </span>
            <span className="inline-flex items-center gap-2 text-[#6b6b7b]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityDot[bug.priority] }}></span>
              {bug.priority} priority
            </span>
            {bug.is_archived && (
              <span className="px-3 py-1.5 rounded-full bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)] text-[#eab308]">
                Archived
              </span>
            )}
            <span className="text-[#35354a]">·</span>
            <span className="text-[#4a4a58]">{formatSmartDate(bug.created_at)}</span>
            <span className="text-[#35354a]">·</span>
            <span className="text-[#4a4a58]">{bug.reported_by_name || bug.reported_by_email?.split('@')[0]}</span>
          </div>
        </div>

        <div className="px-2 sm:px-4 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="relative bg-gradient-to-br from-[rgba(12,12,18,0.8)] to-[rgba(15,15,22,0.6)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.15)] to-transparent" />
              <div className="prose prose-invert prose-base max-w-none text-[#a0a0b0] leading-relaxed [&_strong]:text-[#f0f0f5] [&_h1]:text-[#f0f0f5] [&_h2]:text-[#f0f0f5] [&_h3]:text-[#f0f0f5] [&_a]:text-[#818cf8] [&_code]:bg-[rgba(99,102,241,0.1)] [&_code]:text-[#a5b4fc] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-lg [&_p]:mb-4">
                <MarkdownRenderer content={bug.description} />
              </div>
            </div>

            {/* Screenshot */}
            {bug.preview_image && (
              <div className="relative bg-gradient-to-br from-[rgba(12,12,18,0.8)] to-[rgba(15,15,22,0.6)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-8 backdrop-blur-xl">
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.15)] to-transparent" />
                <h3 className="text-xs font-medium text-[#9898a8] mb-5 tracking-wide uppercase">Attachment</h3>
                <div className="relative group overflow-hidden rounded-2xl">
                  <img 
                    src={bug.preview_image} 
                    alt="" 
                    className="max-w-full rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:scale-[1.02]" 
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[rgba(255,255,255,0.05)]" />
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentSection bugId={bug.id} session={session} bugReporterId={bug.user_id} bugReporterName={bug.reported_by_name} bugReporterEmail={bug.reported_by_email} />

            {/* Activity */}
            <div className="relative bg-gradient-to-br from-[rgba(12,12,18,0.8)] to-[rgba(15,15,22,0.6)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-8 backdrop-blur-xl">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.15)] to-transparent" />
              <h3 className="text-xs font-medium text-[#9898a8] mb-5 tracking-wide uppercase">Activity</h3>
              <ActivityTimeline bugId={bug.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="relative bg-gradient-to-br from-[rgba(12,12,18,0.8)] to-[rgba(15,15,22,0.6)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 backdrop-blur-xl">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.15)] to-transparent" />
              <label className="block text-xs font-medium text-[#9898a8] mb-4 tracking-wide uppercase">Status</label>
              <select
                value={bug.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={mutationLoading}
                className="w-full px-4 py-3.5 bg-[#0a0a0f] border border-[rgba(255,255,255,0.08)] rounded-2xl text-sm text-[#f0f0f5] font-medium focus:outline-none focus:border-[rgba(99,102,241,0.5)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] disabled:opacity-50 transition-all duration-200 cursor-pointer appearance-none"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Priority */}
            <div className="relative bg-gradient-to-br from-[rgba(12,12,18,0.8)] to-[rgba(15,15,22,0.6)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 backdrop-blur-xl">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.15)] to-transparent" />
              <label className="block text-xs font-medium text-[#9898a8] mb-4 tracking-wide uppercase">Priority</label>
              <div className="flex items-center gap-3">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: priorityDot[bug.priority],
                    boxShadow: `0 0 12px ${priorityDot[bug.priority]}60`
                  }}
                />
                <span className="text-[#f0f0f5] font-medium">{bug.priority}</span>
              </div>
            </div>

            {/* Reporter */}
            <div className="relative bg-gradient-to-br from-[rgba(12,12,18,0.8)] to-[rgba(15,15,22,0.6)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 backdrop-blur-xl">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.15)] to-transparent" />
              <label className="block text-xs font-medium text-[#9898a8] mb-4 tracking-wide uppercase">Reporter</label>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[rgba(99,102,241,0.3)] to-[rgba(139,92,246,0.2)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#a5b4fc] text-base font-semibold shadow-[0_4px_20px_rgba(99,102,241,0.15)]">
                  {(bug.reported_by_name || bug.reported_by_email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-[#f0f0f5] font-medium">{bug.reported_by_name || bug.reported_by_email?.split('@')[0]}</p>
                  <p className="text-[11px] text-[#6b6b7b] mt-0.5">{formatSmartDate(bug.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="relative bg-gradient-to-br from-[rgba(12,12,18,0.8)] to-[rgba(15,15,22,0.6)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 backdrop-blur-xl">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(99,102,241,0.15)] to-transparent" />
              <label className="block text-xs font-medium text-[#9898a8] mb-4 tracking-wide uppercase">Details</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6b6b7b]">Created</span>
                  <span className="text-[#9898a8]">{formatSmartDate(bug.created_at)}</span>
                </div>
                {bug.updated_at && bug.updated_at !== bug.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6b6b7b]">Updated</span>
                    <span className="text-[#9898a8]">{formatSmartDate(bug.updated_at)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6b6b7b]">ID</span>
                  <span className="text-[#4a4a58] font-mono text-xs">#{id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <ConfirmDialog {...archiveDialog.dialogProps} />
      <ConfirmDialog {...deleteDialog.dialogProps} />
    </div>
  )
}
