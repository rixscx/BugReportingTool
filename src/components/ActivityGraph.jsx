import { useMemo } from 'react'
import { Link } from 'react-router-dom'

export default function ActivityGraph({ activities }) {
    const userActivities = useMemo(() => {
        if (!activities || activities.length === 0) return []
        const userMap = new Map()

        activities.forEach(act => {
            const userId = act.user_id || act.actor_id
            if (!userId) return
            const userName = act.user?.username || act.actor_email || userId.slice(0, 8)

            if (!userMap.has(userId)) {
                userMap.set(userId, { id: userId, name: userName, activities: [] })
            }
            userMap.get(userId).activities.push({
                id: act.id, action: act.action, bugId: act.bug_id, timestamp: act.created_at
            })
        })

        return Array.from(userMap.values())
            .map(user => ({ ...user, activities: user.activities.slice(0, 5) }))
            .sort((a, b) => (b.activities[0]?.timestamp || '').localeCompare(a.activities[0]?.timestamp || ''))
    }, [activities])

    if (!activities || activities.length === 0) {
        return (
            <div className="relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-12 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.03)] to-transparent pointer-events-none" />
                <div className="relative text-[13px] text-[#4a4a58]">No activity to visualize</div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userActivities.map(user => (
                <div key={user.id} className="group relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-all duration-300 hover:-translate-y-0.5">
                    {/* Top gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[rgba(99,102,241,0.2)] to-[rgba(139,92,246,0.2)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[11px] text-[#818cf8] font-semibold shadow-[0_4px_12px_rgba(99,102,241,0.1)]">
                            {user.name[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-medium text-[#f0f0f5] truncate">{user.name}</div>
                            <div className="text-[10px] text-[#4a4a58]">{user.activities.length} actions</div>
                        </div>
                    </div>
                    <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                        {user.activities.map((act) => (
                            <div key={act.id} className="px-4 py-2.5 hover:bg-[rgba(99,102,241,0.05)] transition-all duration-200">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-[#9898a8]">{act.action.replace(/_/g, ' ')}</span>
                                    <Link to={`/bug/${act.bugId}`} className="text-[10px] font-mono text-[#4a4a58] hover:text-[#818cf8] transition-colors">
                                        #{act.bugId?.slice(0, 5)}
                                    </Link>
                                </div>
                                <div className="text-[10px] text-[#4a4a58] mt-0.5">
                                    {new Date(act.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
