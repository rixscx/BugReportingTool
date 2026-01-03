import { formatSmartDate } from '../lib/dateUtils'

export default function LogsTimeline({ activities }) {
    if (activities.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">No activity recorded yet.</p>
            </div>
        )
    }

    // Group by date
    const grouped = activities.reduce((acc, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString()
        if (!acc[date]) acc[date] = []
        acc[date].push(activity)
        return acc
    }, {})

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([date, dateActivities]) => (
                <div key={date} className="relative">
                    <div className="sticky top-20 z-10 bg-slate-50/95 backdrop-blur py-2 mb-4 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{date}</h3>
                    </div>

                    <div className="space-y-6 ml-4 border-l-2 border-slate-200 pl-6 pb-2">
                        {dateActivities.map((activity) => (
                            <div key={activity.id} className="relative group">
                                {/* Connector Dot */}
                                <div className="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white group-hover:border-blue-500 group-hover:scale-110 transition-all" />

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                {(activity.actor?.username || activity.actor?.email || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-800">
                                                    <span className="font-medium text-slate-900">
                                                        {activity.actor?.username || activity.actor?.email}
                                                    </span>
                                                    {' '}
                                                    <span className="text-slate-600">
                                                        {formatAction(activity)}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(activity.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Metadata badge or ID */}
                                        <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                            Bug #{activity.bug_id.slice(0, 8)}
                                        </div>
                                    </div>

                                    {/* Additional Context */}
                                    {(activity.metadata?.old_status || activity.metadata?.new_status) && (
                                        <div className="mt-3 text-sm flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-flex">
                                            <span className="line-through text-slate-400">{activity.metadata.old_status}</span>
                                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                            <span className="font-medium text-slate-700">{activity.metadata.new_status}</span>
                                        </div>
                                    )}

                                    {activity.action === 'comment_created' && (
                                        <div className="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-100 pl-3">
                                            "Posted a comment"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function formatAction(activity) {
    switch (activity.action) {
        case 'bug_created': return 'reported a new bug'
        case 'bug_status_changed': return 'changed status'
        case 'bug_archived': return 'archived a bug'
        case 'bug_restored': return 'restored a bug'
        case 'deleted': return 'deleted a bug'
        case 'comment_created': return 'commented on'
        case 'comment_updated': return 'edited a comment on'
        case 'comment_deleted': return 'deleted a comment on'
        default: return activity.action.replace(/_/g, ' ')
    }
}
