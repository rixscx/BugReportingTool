import { useState } from 'react'
import { useActivity } from '../hooks/useActivity'
import LogsTimeline from '../components/LogsTimeline'
import LogsTable from '../components/LogsTable'
import ActivityGraph from '../components/ActivityGraph'
import { PageLoader } from '../components/Skeleton'
import { PageWrapper } from '../lib/motion'

export default function Logs() {
    const [viewMode, setViewMode] = useState('timeline')
    const { activities, loading } = useActivity({ limit: 100 })

    if (loading) return <PageLoader />

    const stats = [
        { label: 'Total Events', value: activities.length, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: '#6366f1' },
        { label: 'Created', value: activities.filter(a => a.action === 'bug_created').length, icon: 'M12 4v16m8-8H4', color: '#22c55e' },
        { label: 'Status Changes', value: activities.filter(a => a.action === 'bug_status_changed').length, icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: '#f59e0b' },
        { label: 'Comments', value: activities.filter(a => a.action.includes('comment')).length, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#8b5cf6' },
    ]

    const viewModes = [
        { id: 'timeline', label: 'Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'table', label: 'Table', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
        { id: 'graph', label: 'Graph', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ]

    return (
        <PageWrapper className="w-full px-4 sm:px-6 py-8 bg-[#06060a] min-h-screen relative overflow-hidden">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-40 right-1/4 w-[500px] h-[500px] rounded-full bg-[rgba(99,102,241,0.03)] blur-[120px] animate-breathe" />
                <div className="absolute bottom-20 left-1/3 w-[400px] h-[400px] rounded-full bg-[rgba(139,92,246,0.02)] blur-[100px] animate-breathe" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/10 flex items-center justify-center border border-[rgba(99,102,241,0.2)]">
                            <svg className="w-6 h-6 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-[#f0f0f5] tracking-tight">Activity</h1>
                            <p className="text-sm text-[#6b6b7b]">Recent events and changes</p>
                        </div>
                    </div>
                    
                    {/* View mode toggle - pill style */}
                    <div className="flex items-center gap-1 p-1 bg-[rgba(12,12,18,0.6)] rounded-xl border border-[rgba(255,255,255,0.06)]">
                        {viewModes.map(view => (
                            <button
                                key={view.id}
                                onClick={() => setViewMode(view.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 ${
                                    viewMode === view.id
                                        ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-[0_4px_20px_rgba(99,102,241,0.25)]'
                                        : 'text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.04)]'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={view.icon} />
                                </svg>
                                <span className="hidden sm:inline">{view.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats - Flowing cards */}
                <div className="px-2 sm:px-4 lg:px-8 xl:px-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map(({ label, value, icon, color }) => (
                        <div 
                            key={label} 
                            className="group relative p-5 rounded-2xl bg-[rgba(12,12,18,0.5)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-3xl font-bold text-[#f0f0f5] group-hover:text-[#818cf8] transition-colors">{value}</div>
                                    <div className="text-[11px] text-[#4a4a58] mt-1.5 uppercase tracking-wider">{label}</div>
                                </div>
                                <div 
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                    style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                                >
                                    <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                </div>

                {/* Content */}
                {viewMode === 'timeline' && <LogsTimeline activities={activities} />}
                {viewMode === 'table' && <LogsTable activities={activities} />}
                {viewMode === 'graph' && <ActivityGraph activities={activities} />}
            </div>
        </PageWrapper>
    )
}
