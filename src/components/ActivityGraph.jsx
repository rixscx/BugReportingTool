import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'

// Helper: color for action
function getActionColor(action) {
    if (action.includes('deleted')) return 'bg-red-500/20 text-red-400 border-red-500/30'
    if (action.includes('comment')) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (action.includes('status')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    if (action.includes('created')) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    if (action.includes('archive')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

export default function ActivityGraph({ activities }) {
    // Group activities by user, keep last 5 per user
    const userActivities = useMemo(() => {
        if (!activities || activities.length === 0) return []

        const userMap = new Map()

        activities.forEach(act => {
            const userId = act.user_id || act.actor_id
            if (!userId) return

            const userName = act.user?.username || act.actor_email || userId.slice(0, 12)
            const userAvatar = userName?.[0]?.toUpperCase() || '?'

            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    id: userId,
                    name: userName,
                    avatar: userAvatar,
                    activities: []
                })
            }

            userMap.get(userId).activities.push({
                id: act.id,
                action: act.action,
                bugId: act.bug_id,
                timestamp: act.created_at,
                metadata: act.metadata
            })
        })

        // Limit to last 5 activities per user and sort users by most recent activity
        return Array.from(userMap.values())
            .map(user => ({
                ...user,
                activities: user.activities.slice(0, 5) // Already sorted by created_at desc from useActivity
            }))
            .sort((a, b) => {
                const aTime = a.activities[0]?.timestamp || ''
                const bTime = b.activities[0]?.timestamp || ''
                return bTime.localeCompare(aTime)
            })
    }, [activities])

    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                No activity logs to visualize. Perform some actions first!
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userActivities.map(user => (
                <div
                    key={user.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    {/* User Header */}
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                            {user.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-900 truncate">{user.name}</div>
                            <div className="text-xs text-slate-500">Last {user.activities.length} activities</div>
                        </div>
                    </div>

                    {/* Activity List */}
                    <div className="divide-y divide-slate-100">
                        {user.activities.map((act, i) => (
                            <div key={act.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    {/* Timeline dot */}
                                    <div className="relative pt-1.5">
                                        <div className={`w-2 h-2 rounded-full ${act.action.includes('deleted') ? 'bg-red-500' :
                                                act.action.includes('comment') ? 'bg-green-500' :
                                                    act.action.includes('status') ? 'bg-blue-500' :
                                                        'bg-slate-400'
                                            }`}></div>
                                        {i < user.activities.length - 1 && (
                                            <div className="absolute left-1/2 top-3 w-px h-[calc(100%+0.75rem)] bg-slate-200 -translate-x-1/2"></div>
                                        )}
                                    </div>

                                    {/* Activity Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getActionColor(act.action)}`}>
                                                {act.action}
                                            </span>
                                            <Link
                                                to={`/bug/${act.bugId}`}
                                                className="text-xs text-blue-600 hover:underline truncate max-w-[120px]"
                                            >
                                                #{act.bugId?.slice(0, 8)}
                                            </Link>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            {new Date(act.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
