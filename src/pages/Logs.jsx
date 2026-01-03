import { useState } from 'react'
import { useActivity } from '../hooks/useActivity'
import LogsTimeline from '../components/LogsTimeline'
import LogsTable from '../components/LogsTable'
import ActivityGraph from '../components/ActivityGraph'
import { PageLoader } from '../components/Skeleton'

export default function Logs() {
    const [viewMode, setViewMode] = useState('timeline') // timeline, table, graph
    const { activities, loading } = useActivity({ limit: 100 })

    if (loading) return <PageLoader />

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Logs</h1>
                    <p className="text-slate-500 mt-1">Real-time audit log of all bug activity</p>
                </div>

                <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Table
                    </button>
                    <button
                        onClick={() => setViewMode('graph')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'graph' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Visual Relations
                    </button>
                </div>
            </div>

            <div className={viewMode === 'timeline' ? 'block' : 'hidden'}>
                <LogsTimeline activities={activities} />
            </div>
            <div className={viewMode === 'table' ? 'block' : 'hidden'}>
                <LogsTable activities={activities} />
            </div>
            <div className={viewMode === 'graph' ? 'block' : 'hidden'}>
                <ActivityGraph activities={activities} />
            </div>
        </div>
    )
}
