const statusConfig = {
  'Open': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200', icon: '○' },
  'In Progress': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200', icon: '◐' },
  'Resolved': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', icon: '●' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500', border: 'border-slate-200' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} transition-all hover:shadow-sm`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} ${status === 'In Progress' ? 'animate-pulse' : ''}`}></span>
      {status}
    </span>
  )
}
