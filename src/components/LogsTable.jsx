import { Link } from 'react-router-dom'

export default function LogsTable({ activities }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                No logs found matching criteria
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider">
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Actor</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Entity / Target</th>
                            <th className="px-6 py-4">Metadata</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activities.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                {/* Timestamp */}
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>

                                {/* Actor */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {(log.user?.username?.[0] || log.actor_email?.[0] || log.user_id?.[0] || 'U').toUpperCase()}
                                        </div>
                                        <div>
                                            {/* Name Priority: Username -> Email (prefix) -> UID -> 'System' */}
                                            <div className="font-medium text-slate-700 text-sm">
                                                {log.user?.username || log.actor_email || log.user_id || 'System'}
                                            </div>
                                            {/* Subtext: ID and Email (if not main) */}
                                            <div className="text-slate-400 text-[10px] font-mono">
                                                UID: {(log.user_id || log.actor_id)?.slice(0, 8)}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Action */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded border ${log.action.includes('deleted') ? 'bg-red-50 text-red-700 border-red-100' :
                                        log.action.includes('status') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            log.action.includes('comment') ? 'bg-green-50 text-green-700 border-green-100' :
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>

                                {/* Target */}
                                <td className="px-6 py-4 font-mono text-slate-500">
                                    <Link to={`/bug/${log.bug_id}`} className="hover:text-blue-600 hover:underline">
                                        {log.bug_id?.slice(0, 8)}...
                                    </Link>
                                </td>

                                {/* Metadata */}
                                <td className="px-6 py-4 max-w-xs">
                                    <pre className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto">
                                        {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
