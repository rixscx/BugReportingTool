import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { deleteBugImages, listBugImages } from '../lib/bugImageStorage'
import { useBugMutations } from '../hooks/useBugs'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { SHORTCUT_KEYS } from '../lib/constants'
import { BugDetailSkeleton } from '../components/Skeleton'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { CopyIconButton } from '../components/CopyButton'
import { useToast } from '../components/Toast'
import StatusBadge from '../components/StatusBadge'
import CommentSection from '../components/CommentSection'
import ActivityTimeline from '../components/ActivityTimeline'
import { formatSmartDate } from '../lib/dateUtils'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/DropdownMenu'

import MarkdownRenderer from '../components/MarkdownRenderer'

export default function BugDetail({ session, isAdmin }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const archiveDialog = useConfirmDialog()
  const deleteDialog = useConfirmDialog()

  const [bug, setBug] = useState(null)
  const [bugImages, setBugImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  // Keyboard shortcuts
  useKeyboardShortcut(SHORTCUT_KEYS.ESCAPE, () => navigate('/'))
  useKeyboardShortcut(SHORTCUT_KEYS.GO_HOME, () => navigate('/'))

  const fetchBug = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bugs')
        .select(`*`)
        .eq('id', id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const images = await listBugImages(data.user_id, data.id)
      setBug({ ...data, preview_image: images[0] || null })
      setBugImages(images)
    } catch {
      setError('Bug not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBug()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  /* Refactored to useBugMutations hook */
  const {
    updateStatus: mutateStatus,
    archiveBug: mutateArchive,
    unarchiveBug: mutateRestore,
    deleteBug: mutateDelete,
    loading: mutationLoading
  } = useBugMutations()

  const handleUpdateStatus = async (newStatus) => {
    // Optimistic update
    const oldStatus = bug.status
    setBug(prev => ({ ...prev, status: newStatus }))

    const result = await mutateStatus(id, newStatus, session.user.id, session.user.email, oldStatus)

    if (!result.success) {
      setBug(prev => ({ ...prev, status: oldStatus })) // Revert
      showToast(result.error || 'Failed to update status', 'error')
    }
  }

  const handleArchive = async () => {
    // Any authenticated user can archive
    const confirmed = await archiveDialog.confirm({
      title: 'Archive Bug',
      description: 'Archive this bug? It will be hidden from active bugs but can be restored later.',
      confirmText: 'Archive',
      variant: 'warning',
    })

    if (!confirmed) return

    const result = await mutateArchive(id, session.user.id, session.user.email)

    if (result.success) {
      showToast('Bug archived successfully', 'success')
      navigate('/')  // Navigate to dashboard after archive
    } else {
      showToast(result.error || 'Failed to archive bug', 'error')
    }
  }

  const handleRestore = async () => {
    // Any authenticated user can restore
    const result = await mutateRestore(id, session.user.id, session.user.email)

    if (result.success) {
      showToast('Bug restored successfully', 'success')
      fetchBug()
    } else {
      showToast(result.error || 'Failed to restore bug', 'error')
    }
  }

  const handleDelete = async () => {
    // Permission check: Admin OR owner can delete
    const canDelete = isAdmin || bug.user_id === session.user.id
    if (!canDelete) {
      showToast('Permission denied: Only admin or bug reporter can delete', 'error')
      return
    }

    const confirmed = await deleteDialog.confirm({
      title: 'Delete Bug Permanently',
      description: `Are you sure you want to PERMANENTLY DELETE "${bug.title}"? This action cannot be undone. The bug will be archived for audit purposes.`,
      confirmText: 'Delete Forever',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const result = await mutateDelete(bug, session.user.id, session.user.email, isAdmin)

      if (result.success) {
        showToast('Bug permanently deleted', 'success')
        navigate('/')
      } else {
        showToast(result.error || 'Failed to delete bug', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete bug', 'error')
    }
  }

  const priorityColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return <BugDetailSkeleton />
  }

  if (!bug) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Bug</h3>
          <p className="text-slate-500 text-sm mb-6">{error || 'Bug not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                #{id.slice(0, 8)}
              </span>
              <CopyIconButton text={window.location.href} size="sm" title="Copy link" />
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            {({ open, setOpen }) => (
              <>
                <DropdownMenuTrigger
                  onClick={() => setOpen(!open)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent open={open} align="end">
                  {/* Archive - available to ALL authenticated users */}
                  {!bug.is_archived && (
                    <DropdownMenuItem
                      onClick={() => { setOpen(false); handleArchive(); }}
                      disabled={mutationLoading}
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>}
                    >
                      Archive
                    </DropdownMenuItem>
                  )}
                  {/* Restore - available to ALL authenticated users */}
                  {bug.is_archived && (
                    <DropdownMenuItem
                      onClick={() => { setOpen(false); handleRestore(); }}
                      disabled={mutationLoading}
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>}
                    >
                      Restore
                    </DropdownMenuItem>
                  )}
                  {(session.user.id === bug.user_id || isAdmin) && (
                    <DropdownMenuItem
                      onClick={() => { setOpen(false); handleDelete(); }}
                      disabled={mutationLoading}
                      variant="danger"
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </>
            )}
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bug Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 leading-tight">{bug.title}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {bug.is_archived && (
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                      Archived
                    </span>
                  )}
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${priorityColors[bug.priority]}`}>
                    {bug.priority}
                  </span>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <div className="text-slate-600 text-sm leading-relaxed">
                  <MarkdownRenderer content={bug.description} />
                </div>
              </div>

              {bug.steps_to_reproduce && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Steps to Reproduce</h3>
                  <div className="text-slate-600 text-sm leading-relaxed">
                    <MarkdownRenderer content={bug.steps_to_reproduce} />
                  </div>
                </div>
              )}

              {bug.preview_image && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Screenshot</h3>
                  <img
                    src={bug.preview_image}
                    alt="Bug screenshot"
                    className="max-w-full rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Comments Section */}
            <CommentSection
              bugId={bug.id}
              session={session}
              bugReporterId={bug.user_id}
              bugReporterName={bug.reported_by_name}
              bugReporterEmail={bug.reported_by_email}
            />

            {/* Activity Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Activity</h3>
              <ActivityTimeline bugId={bug.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Assignment */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Status</label>
                  <select
                    value={bug.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={updating}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Reporter</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                  {(
                    bug.reported_by_name || (bug.reported_by_email ? bug.reported_by_email.split('@')[0] : null) || 'U'
                  )[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {bug.reported_by_name || bug.reported_by_email || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400" title={new Date(bug.created_at).toLocaleString()}>
                    {formatSmartDate(bug.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - Available to all authenticated users */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Actions</h3>
            <div className="space-y-2">
              {/* Archive - any auth user */}
              <button
                onClick={handleArchive}
                disabled={mutationLoading || bug.is_archived}
                className={`w-full px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors ${bug.is_archived
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {bug.is_archived ? 'Already Archived' : 'Archive Bug'}
              </button>

              {/* Restore - any auth user, only shown when archived */}
              {bug.is_archived && (
                <button
                  onClick={handleRestore}
                  disabled={mutationLoading}
                  className="w-full px-4 py-2.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore Bug
                </button>
              )}

              {/* Delete - only admin or owner */}
              {(isAdmin || session?.user?.id === bug.user_id) && (
                <button
                  onClick={handleDelete}
                  disabled={mutationLoading}
                  className="w-full px-4 py-2.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Permanently
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog {...archiveDialog.dialogProps} />
      <ConfirmDialog {...deleteDialog.dialogProps} />
    </div>
  )
}
