const statusConfig = {
  'Open': {
    dot: 'bg-[#6366f1]',
    glow: 'shadow-[0_0_10px_rgba(99,102,241,0.5)]',
    bg: 'bg-[rgba(99,102,241,0.1)]',
    border: 'border-[rgba(99,102,241,0.2)]',
    text: 'text-[#818cf8]',
  },
  'In Progress': {
    dot: 'bg-[#f59e0b]',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    bg: 'bg-[rgba(245,158,11,0.1)]',
    border: 'border-[rgba(245,158,11,0.2)]',
    text: 'text-[#fbbf24]',
  },
  'Resolved': {
    dot: 'bg-[#22c55e]',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
    bg: 'bg-[rgba(34,197,94,0.1)]',
    border: 'border-[rgba(34,197,94,0.2)]',
    text: 'text-[#4ade80]',
  },
}

export default function StatusBadge({ status, size = 'sm', variant = 'minimal' }) {
  const config = statusConfig[status] || {
    dot: 'bg-[#4a4a58]',
    glow: '',
    bg: 'bg-[rgba(255,255,255,0.05)]',
    border: 'border-[rgba(255,255,255,0.1)]',
    text: 'text-[#6b6b7b]'
  }

  const sizeClasses = {
    xs: 'text-[9px] gap-1.5 px-2 py-0.5',
    sm: 'text-[10px] gap-1.5 px-2.5 py-1',
    md: 'text-[11px] gap-2 px-3 py-1.5',
  }

  if (variant === 'pill') {
    return (
      <span className={`inline-flex items-center rounded-full font-medium transition-all duration-300 hover:scale-105 ${sizeClasses[size]} ${config.bg} border ${config.border} ${config.text}`}>
        <span className={`w-[6px] h-[6px] rounded-full ${config.dot} ${config.glow}`} />
        {status}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] text-[#6b6b7b]`}>
      <span className={`w-[6px] h-[6px] rounded-full ${config.dot} ${config.glow}`} />
      {status}
    </span>
  )
}
