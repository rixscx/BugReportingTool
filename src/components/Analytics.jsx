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
      const count = bugs.filter(bug => 
        bug.created_at.split('T')[0] === dateStr
      ).length
      bugsOverTime.push({ date: dateStr, count })
    }
    const recentBugs = bugs.filter(bug => new Date(bug.created_at) > sevenDaysAgo).length
    const resolvedThisWeek = bugs.filter(bug => 
      bug.status === 'Resolved' && new Date(bug.updated_at) > sevenDaysAgo
    ).length
    const resolvedBugs = bugs.filter(b => b.status === 'Resolved')
    const avgResolutionDays = resolvedBugs.length > 0
      ? Math.round(resolvedBugs.reduce((acc, bug) => {
          const created = new Date(bug.created_at)
          const updated = new Date(bug.updated_at)
          return acc + (updated - created) / (1000 * 60 * 60 * 24)
        }, 0) / resolvedBugs.length)
      : 0
    const reporterCounts = bugs.reduce((acc, bug) => {
      const name = bug.reported_by_name || (bug.reported_by_email ? bug.reported_by_email.split('@')[0] : 'Unknown')
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    const topReporters = Object.entries(reporterCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      statusCounts,
      priorityCounts,
      bugsOverTime,
      recentBugs,
      resolvedThisWeek,
      avgResolutionDays,
      topReporters,
      total: bugs.length
    }
  }, [bugs])

  if (!stats) {
    return (
      <div className="text-center py-12 text-slate-500">
        No data available for analytics
      </div>
    )
  }

  const maxDailyBugs = Math.max(...stats.bugsOverTime.map(d => d.count), 1)
  const statusColors = {
    'Open': { bg: 'bg-blue-500', light: 'bg-blue-100' },
    'In Progress': { bg: 'bg-purple-500', light: 'bg-purple-100' },
    'Resolved': { bg: 'bg-green-500', light: 'bg-green-100' },
  }
  const priorityColors = {
    'High': { bg: 'bg-red-500', light: 'bg-red-100' },
    'Medium': { bg: 'bg-amber-500', light: 'bg-amber-100' },
    'Low': { bg: 'bg-emerald-500', light: 'bg-emerald-100' },
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Bugs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.resolvedThisWeek}</p>
              <p className="text-sm text-slate-500">Resolved This Week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.avgResolutionDays}d</p>
              <p className="text-sm text-slate-500">Avg Resolution</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.recentBugs}</p>
              <p className="text-sm text-slate-500">New This Week</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bug Trend Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Bug Trend (Last 30 Days)</h3>
          <div className="h-40 flex items-end gap-1">
            {stats.bugsOverTime.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${(day.count / maxDailyBugs) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                  title={`${day.date}: ${day.count} bugs`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Status Distribution</h3>
          <div className="space-y-4">
            {Object.entries(statusColors).map(([status, colors]) => {
              const count = stats.statusCounts[status] || 0
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{status}</span>
                    <span className="font-medium text-slate-800">{count} ({percentage}%)</span>
                  </div>
                  <div className={`h-2 ${colors.light} rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Priority Breakdown</h3>
          <div className="flex items-center justify-center gap-8">
            {Object.entries(priorityColors).map(([priority, colors]) => {
              const count = stats.priorityCounts[priority] || 0
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={priority} className="text-center">
                  <div className={`w-20 h-20 ${colors.light} rounded-full flex items-center justify-center mb-2 mx-auto relative`}>
                    <svg className="w-20 h-20 absolute" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${percentage}, 100`}
                        className={priority === 'High' ? 'text-red-500' : priority === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}
                      />
                    </svg>
                    <span className="text-lg font-bold text-slate-800">{count}</span>
                  </div>
                  <p className="text-sm text-slate-600">{priority}</p>
                  <p className="text-xs text-slate-400">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Reporters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Bug Reporters</h3>
          <div className="space-y-3">
            {stats.topReporters.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{name}</p>
                </div>
                <div className="text-sm text-slate-500">{count} bugs</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
