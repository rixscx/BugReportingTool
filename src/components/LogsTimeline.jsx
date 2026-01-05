import { useState } from 'react'

// Canonical action config from activity_logs.action enum
const actionConfig = {
    bug_created: { label: 'created', dot: 'bg-[#22c55e]', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.5)]' },
    bug_updated: { label: 'updated', dot: 'bg-[#6366f1]', glow: 'shadow-[0_0_12px_rgba(99,102,241,0.5)]' },
    bug_status_changed: { label: 'changed status', dot: 'bg-[#6366f1]', glow: 'shadow-[0_0_12px_rgba(99,102,241,0.5)]' },
    bug_assigned: { label: 'assigned', dot: 'bg-[#8b5cf6]', glow: 'shadow-[0_0_12px_rgba(139,92,246,0.5)]' },
    comment_added: { label: 'commented', dot: 'bg-[#8b5cf6]', glow: 'shadow-[0_0_12px_rgba(139,92,246,0.5)]' },
    comment_edited: { label: 'edited comment', dot: 'bg-[#4a4a58]', glow: '' },
    comment_deleted: { label: 'deleted comment', dot: 'bg-[#ef4444]', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]' },
    profile_updated: { label: 'updated profile', dot: 'bg-[#4a4a58]', glow: '' },
}

export default function LogsTimeline({ activities }) {
    const [expandedDates, setExpandedDates] = useState({})

    if (activities.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#4a4a58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="text-[14px] text-[#6b6b7b]">No activity yet</div>
                <div className="text-[12px] text-[#4a4a58] mt-1">Events will appear here as they happen</div>
            </div>
        )
    }

    const grouped = activities.reduce((acc, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        if (!acc[date]) acc[date] = []
        acc[date].push(activity)
        return acc
    }, {})

    const toggleDate = (date) => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))
    const isExpanded = (date) => expandedDates[date] !== false

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([date, dateActivities]) => (
                <div key={date}>
                    {/* Date header - floating pill */}
                    <button
                        onClick={() => toggleDate(date)}
                        className="w-full flex items-center gap-3 mb-3 group"
                    >
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-[rgba(12,12,18,0.6)] rounded-xl border border-[rgba(255,255,255,0.06)] group-hover:border-[rgba(255,255,255,0.1)] transition-all">
                            <span className="text-[13px] font-medium text-[#f0f0f5]">{date}</span>
                            <span className="text-[10px] text-[#4a4a58] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full">{dateActivities.length}</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-[rgba(255,255,255,0.06)] to-transparent" />
                        <svg className={`w-4 h-4 text-[#4a4a58] transition-transform duration-300 ${isExpanded(date) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isExpanded(date) && (
                        <div className="ml-4 space-y-2 relative">
                            {/* Vertical line */}
                            <div className="absolute left-[5px] top-3 bottom-3 w-px bg-gradient-to-b from-[rgba(99,102,241,0.3)] via-[rgba(99,102,241,0.1)] to-transparent" />

                            {dateActivities.map((activity) => {
                                const config = actionConfig[activity.action] || { label: activity.action.replace(/_/g, ' '), dot: 'bg-[#4a4a58]', glow: '' }
                                return (
                                    <div
                                        key={activity.id}
                                        className="relative pl-8 py-3 hover:bg-[rgba(255,255,255,0.02)] rounded-xl transition-colors group"
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute left-0 top-[18px] w-[11px] h-[11px] rounded-full ${config.dot} ${config.glow} ring-2 ring-[#06060a] transition-transform group-hover:scale-125`} />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className="text-[13px] font-medium text-[#f0f0f5]">
                                                    {activity.actor?.username || activity.actor?.email?.split('@')[0] || 'User'}
                                                </span>
                                                <span className="text-[12px] text-[#6b6b7b]">{config.label}</span>
                                                <a
                                                    href={`/bug/${activity.entity_id}`}
                                                    className="text-[11px] font-mono px-2 py-0.5 bg-[rgba(99,102,241,0.1)] text-[#818cf8] rounded-lg hover:bg-[rgba(99,102,241,0.2)] transition-colors"
                                                >
                                                    #{activity.entity_id?.slice(0, 6)}
                                                </a>
                                            </div>
                                            <span className="text-[11px] text-[#4a4a58] tabular-nums">
                                                {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {activity.action === 'bug_status_changed' && activity.metadata?.from && activity.metadata?.to && (
                                            <div className="mt-2 flex items-center gap-2 text-[12px]">
                                                <span className="px-2 py-1 bg-[rgba(255,255,255,0.03)] rounded-lg text-[#4a4a58] line-through">{activity.metadata.from}</span>
                                                <svg className="w-4 h-4 text-[#4a4a58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                                <span className="px-2 py-1 bg-[rgba(99,102,241,0.1)] rounded-lg text-[#9898a8]">{activity.metadata.to}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
