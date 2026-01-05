import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { formatSmartDate } from '../lib/dateUtils'
import { useAuth } from '../hooks/useAuth'
import { useBugMutations } from '../hooks/useBugs'
import { useToast } from './Toast'
import { cleanMarkdown } from './MarkdownRenderer'

const priorityConfig = {
  High: { dot: 'bg-[#ef4444]', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]', ring: 'ring-[#ef4444]/20' },
  Medium: { dot: 'bg-[#f59e0b]', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]', ring: 'ring-[#f59e0b]/20' },
  Low: { dot: 'bg-[#6b7280]', glow: '', ring: '' },
}

export default function BugCard({ bug }) {
  const hasImage = bug.preview_image
  const { session } = useAuth()
  const { showToast } = useToast()
  const { archiveBug, loading: archiveLoading } = useBugMutations()
  const previewText = cleanMarkdown(bug.description)
  const canArchive = session && !bug.is_archived
  const priority = priorityConfig[bug.priority] || priorityConfig.Medium

  const handleArchive = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      showToast('Sign in required', 'error')
      return
    }
    try {
      const result = await archiveBug(bug.id, session.user.id, session.user.email)
      if (result.success) {
        showToast('Archived', 'success')
        window.dispatchEvent(new CustomEvent('bug-archived', { detail: { id: bug.id } }))
      } else {
        showToast(result.error || 'Failed', 'error')
      }
    } catch {
      showToast('Failed', 'error')
    }
  }

  return (
    <Link to={`/bug/${bug.id}`} className="block group">
      <div className="relative bg-gradient-to-br from-[#0a0a0f] to-[#0f0f15] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[rgba(99,102,241,0.3)] hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(99,102,241,0.1)] group-hover:-translate-y-1.5 group-hover:scale-[1.01]">
        {/* Ambient glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[rgba(99,102,241,0.08)] to-transparent blur-2xl" />
        </div>

        {/* Flowing top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

        {/* Inner glow border */}
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent pointer-events-none" />

        {hasImage && (
          <div className="h-36 bg-[#06060a] overflow-hidden relative">
            <img
              src={bug.preview_image}
              alt=""
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500 ease-out"
              loading="lazy"
            />
            {/* Organic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        )}

        <div className="p-5 flex flex-col flex-grow relative">
          <h3 className="font-semibold text-[#f0f0f5] text-[14px] leading-[1.4] line-clamp-2 group-hover:text-[#818cf8] transition-colors duration-300 mb-3">
            {bug.title}
          </h3>

          <p className="text-[#6b6b7b] text-[12px] line-clamp-2 flex-grow leading-[1.65] mb-5 max-w-prose-sm">
            {previewText}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3">
              <StatusBadge status={bug.status} />
              <span className="flex items-center gap-2 text-[11px] text-[#4a4a58]">
                <span className={`w-[6px] h-[6px] rounded-full ${priority.dot} ${priority.glow}`} />
                {bug.priority}
              </span>
            </div>

            {canArchive && (
              <button
                onClick={handleArchive}
                title="Archive"
                disabled={archiveLoading}
                className="p-2 rounded-xl text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                {archiveLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-3 text-[10px] text-[#4a4a58]">
            <span>{formatSmartDate(bug.created_at)}</span>
            {bug.reporter?.username && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#35354a]" />
                <span className="truncate max-w-[120px]">{bug.reporter.username}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
