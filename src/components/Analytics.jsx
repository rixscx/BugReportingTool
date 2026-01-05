import { useMemo } from 'react'

export default function Analytics({ bugs }) {
  const stats = useMemo(() => {
    if (!bugs.length) return null

    const now = new Date()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const statusCounts = bugs.reduce((acc, bug) => {
      acc[bug.status] = (acc[bug.status] || 0) + 1
      return acc
    }, {})
    const priorityCounts = bugs.reduce((acc, bug) => {
      acc[bug.priority] = (acc[bug.priority] || 0) + 1
      return acc
    }, {})
    const bugsOverTime = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = bugs.filter(bug => bug.created_at.split('T')[0] === dateStr).length
      bugsOverTime.push({ date: dateStr, count })
    }
    const recentBugs = bugs.filter(bug => new Date(bug.created_at) > sevenDaysAgo).length
    const resolvedThisWeek = bugs.filter(bug => bug.status === 'Resolved' && new Date(bug.updated_at) > sevenDaysAgo).length
    const resolvedBugs = bugs.filter(b => b.status === 'Resolved')
    const avgResolutionDays = resolvedBugs.length > 0
      ? Math.round(resolvedBugs.reduce((acc, bug) => {
        const created = new Date(bug.created_at)
        const updated = new Date(bug.updated_at)
        return acc + (updated - created) / (1000 * 60 * 60 * 24)
      }, 0) / resolvedBugs.length)
      : 0
    const reporterCounts = bugs.reduce((acc, bug) => {
      const name = bug.reporter?.username || (bug.reporter?.email ? bug.reporter.email.split('@')[0] : 'Unknown')
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    const topReporters = Object.entries(reporterCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return { statusCounts, priorityCounts, bugsOverTime, recentBugs, resolvedThisWeek, avgResolutionDays, topReporters, total: bugs.length }
  }, [bugs])

  if (!stats) {
    return <div className="text-center py-12 text-[#4a4a58] text-[13px]">No data available</div>
  }

  const maxDailyBugs = Math.max(...stats.bugsOverTime.map(d => d.count), 1)
  const statusConfig = {
    'Open': { dot: 'bg-[#6366f1] shadow-[0_0_6px_rgba(99,102,241,0.4)]', bar: 'bg-gradient-to-r from-[#6366f1] to-[#818cf8]' },
    'In Progress': { dot: 'bg-[#a855f7] shadow-[0_0_6px_rgba(168,85,247,0.4)]', bar: 'bg-gradient-to-r from-[#a855f7] to-[#c084fc]' },
    'Resolved': { dot: 'bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]', bar: 'bg-gradient-to-r from-[#22c55e] to-[#4ade80]' },
  }
  const priorityConfig = {
    'High': { dot: 'bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.4)]', bar: 'bg-gradient-to-r from-[#ef4444] to-[#f87171]' },
    'Medium': { dot: 'bg-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.4)]', bar: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]' },
    'Low': { dot: 'bg-[#4a4a58] shadow-[0_0_6px_rgba(74,74,88,0.3)]', bar: 'bg-gradient-to-r from-[#4a4a58] to-[#6b6b7b]' },
  }

  return (
    <div className="space-y-5">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Resolved (7d)', value: stats.resolvedThisWeek },
          { label: 'Avg Resolution', value: `${stats.avgResolutionDays}d` },
          { label: 'New (7d)', value: stats.recentBugs },
        ].map(({ label, value }) => (
          <div key={label} className="group relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 hover:border-[rgba(99,102,241,0.3)] transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative">
              <div className="text-[22px] font-bold text-[#f0f0f5]">{value}</div>
              <div className="text-[11px] text-[#4a4a58] mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Bug Trend Chart */}
        <div className="relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent" />
          <div className="text-[13px] font-medium text-[#9898a8] mb-4">Bug Trend (30 Days)</div>
          <div className="h-28 flex items-end gap-px">
            {stats.bugsOverTime.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-[#6366f1] to-[#8b5cf6] rounded-sm transition-all hover:from-[#818cf8] hover:to-[#a78bfa] hover:shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                  style={{ height: `${(day.count / maxDailyBugs) * 100}%`, minHeight: day.count > 0 ? '2px' : '0' }}
                  title={`${day.date}: ${day.count}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-[#4a4a58]">
            <span>30d ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent" />
          <div className="text-[13px] font-medium text-[#9898a8] mb-4">Status</div>
          <div className="space-y-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = stats.statusCounts[status] || 0
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="flex items-center gap-2 text-[#9898a8]">
                      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                      {status}
                    </span>
                    <span className="text-[#6b6b7b]">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-[#14141c] rounded-full overflow-hidden">
                    <div className={`h-full ${config.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent" />
          <div className="text-[13px] font-medium text-[#9898a8] mb-4">Priority</div>
          <div className="space-y-4">
            {Object.entries(priorityConfig).map(([priority, config]) => {
              const count = stats.priorityCounts[priority] || 0
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={priority}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="flex items-center gap-2 text-[#9898a8]">
                      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                      {priority}
                    </span>
                    <span className="text-[#6b6b7b]">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-[#14141c] rounded-full overflow-hidden">
                    <div className={`h-full ${config.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Reporters */}
        <div className="relative bg-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent" />
          <div className="text-[13px] font-medium text-[#9898a8] mb-4">Top Reporters</div>
          <div className="space-y-3">
            {stats.topReporters.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[rgba(99,102,241,0.05)] transition-colors">
                <span className="text-[11px] text-[#4a4a58] w-4 font-medium">{i + 1}</span>
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[rgba(99,102,241,0.2)] to-[rgba(139,92,246,0.2)] flex items-center justify-center text-[10px] text-[#818cf8] font-semibold">
                  {name[0]?.toUpperCase()}
                </div>
                <span className="text-[12px] text-[#f0f0f5] flex-1 truncate">{name}</span>
                <span className="text-[11px] text-[#4a4a58] font-medium">{count}</span>
              </div>
            ))}
            {stats.topReporters.length === 0 && (
              <div className="text-[12px] text-[#4a4a58] text-center py-4">No data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
