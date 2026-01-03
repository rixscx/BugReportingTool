import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { formatSmartDate } from '../lib/dateUtils'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { deleteBugImages } from '../lib/bugImageStorage'
import { ConfirmDialog, useConfirmDialog } from './ConfirmDialog'
import { useToast } from './Toast'

const priorityConfig = {
  High: { color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', ring: 'ring-red-200', border: 'border-red-100' },
  Medium: { color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500', ring: 'ring-amber-200', border: 'border-amber-100' },
  Low: { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', ring: 'ring-emerald-200', border: 'border-emerald-100' },
}

export default function BugCard({ bug }) {
  const priority = priorityConfig[bug.priority] || priorityConfig.Medium
  const hasImage = bug.preview_image
  const { session } = useAuth()
  const deleteDialog = useConfirmDialog()
  const { showToast } = useToast()

  const handleDelete = async () => {
    const confirmed = await deleteDialog.confirm({
      title: 'Delete Bug',
      description: 'Permanently delete this bug? This action cannot be undone.',
      confirmLabel: 'Delete Forever',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    })

    if (!confirmed) return

    try {
      // Log activity before deletion for audit
      if (session && session.user) {
        await supabase.from('bug_activity').insert({
          bug_id: bug.id,
          actor_id: session.user.id,
          actor_email: session.user.email,
          action: 'deleted',
          metadata: { deleted_at: new Date().toISOString() },
        })
      }

      const { error } = await supabase.from('bugs').delete().eq('id', bug.id)
      if (error) throw error

      // Cleanup storage (best-effort)
      const cleanup = await deleteBugImages(bug.user_id, bug.id)
      if (!cleanup.success) {
        console.error('BugCard: failed to cleanup images', cleanup.error)
      }

      showToast('Bug deleted', 'success')
      // Emit event so lists can refresh via listeners or realtime
      window.dispatchEvent(new CustomEvent('bug-deleted', { detail: { id: bug.id } }))
    } catch (err) {
      console.error('Failed to delete bug from card', err)
      showToast('Failed to delete bug', 'error')
    }
  }

  return (
    <Link to={`/bug/${bug.id}`} className="block group">
      <div className={`bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden ${bug.priority === 'High' ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
        {/* Image Preview */}
        {hasImage && (
          <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden relative">
            <img 
              src={bug.preview_image} 
              alt="" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        
        <div className="p-5 flex flex-col flex-grow">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {bug.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.color} border ${priority.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot} animate-pulse`}></span>
                {bug.priority}
              </span>
              {session && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                  title="Delete bug"
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow leading-relaxed">
            {bug.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <StatusBadge status={bug.status} />
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatSmartDate(bug.created_at)}
            </span>
            {(bug.reported_by_name || bug.reported_by_email) && (
              <span className="truncate ml-2 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {bug.reported_by_name || (bug.reported_by_email ? bug.reported_by_email.split('@')[0] : '')}
              </span>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog {...deleteDialog.dialogProps} />
    </Link>
  )
}
