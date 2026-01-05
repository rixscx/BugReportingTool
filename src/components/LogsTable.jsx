import { Link } from 'react-router-dom'

// Canonical action config from activity_logs.action enum
const actionConfig = {
    bug_created: { label: 'Created', color: '#22c55e' },
    bug_updated: { label: 'Updated', color: '#6366f1' },
    bug_status_changed: { label: 'Status', color: '#6366f1' },
    bug_assigned: { label: 'Assigned', color: '#8b5cf6' },
    comment_added: { label: 'Comment', color: '#8b5cf6' },
    comment_edited: { label: 'Edited', color: '#4a4a58' },
    comment_deleted: { label: 'Removed', color: '#ef4444' },
    profile_updated: { label: 'Profile', color: '#4a4a58' },
}

export default function LogsTable({ activities }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#4a4a58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="text-[14px] text-[#6b6b7b]">No logs found</div>
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)]">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[rgba(12,12,18,0.6)] text-[10px] text-[#4a4a58] uppercase tracking-widest">
                            <th className="px-5 py-4 text-left font-medium">Time</th>
                            <th className="px-5 py-4 text-left font-medium">User</th>
                            <th className="px-5 py-4 text-left font-medium">Action</th>
                            <th className="px-5 py-4 text-left font-medium">Issue</th>
                            <th className="px-5 py-4 text-left font-medium">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((log, idx) => {
                            const config = actionConfig[log.action] || { label: log.action, color: '#4a4a58' }
                            return (
                                <tr
                                    key={log.id}
                                    className={`hover:bg-[rgba(99,102,241,0.04)] transition-colors ${idx !== activities.length - 1 ? 'border-b border-[rgba(255,255,255,0.04)]' : ''}`}
                                >
                                    <td className="px-5 py-4">
                                        <div className="text-[12px] text-[#9898a8]">{new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                        <div className="text-[10px] text-[#4a4a58] font-mono mt-0.5">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 flex items-center justify-center text-[10px] font-semibold text-[#818cf8]">
                                                {(log.actor?.username || log.actor?.email?.split('@')[0] || 'S')[0].toUpperCase()}
                                            </div>
                                            <span className="text-[12px] text-[#f0f0f5] font-medium">{log.actor?.username || log.actor?.email?.split('@')[0] || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                                            style={{ backgroundColor: `${config.color}15`, color: config.color }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                                            {config.label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {log.entity_type === 'bug' && log.entity_id ? (
                                            <Link
                                                to={`/bug/${log.entity_id}`}
                                                className="text-[11px] font-mono px-2 py-1 bg-[rgba(99,102,241,0.1)] text-[#818cf8] rounded-lg hover:bg-[rgba(99,102,241,0.2)] transition-colors"
                                            >
                                                #{log.entity_id?.slice(0, 6)}
                                            </Link>
                                        ) : (
                                            <span className="text-[11px] text-[#35354a]">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {log.action === 'bug_status_changed' && log.metadata?.from && log.metadata?.to ? (
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <span className="px-2 py-1 bg-[rgba(255,255,255,0.03)] rounded-lg text-[#4a4a58] line-through">{log.metadata.from}</span>
                                                <svg className="w-3.5 h-3.5 text-[#4a4a58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                                <span className="px-2 py-1 bg-[rgba(99,102,241,0.1)] rounded-lg text-[#9898a8]">{log.metadata.to}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-[#35354a]">—</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
