export function Badge({ children, variant = 'default', size = 'sm', dot = false, className = '' }) {
  const variantClasses = {
    default: 'bg-[#14141c] text-[#9898a8] border border-[rgba(255,255,255,0.08)]',
    outline: 'border border-[rgba(255,255,255,0.1)] text-[#9898a8]',
    secondary: 'bg-[rgba(99,102,241,0.1)] text-[#818cf8] border border-[rgba(99,102,241,0.2)]',
    accent: 'bg-gradient-to-r from-[rgba(99,102,241,0.15)] to-[rgba(139,92,246,0.15)] text-[#a78bfa] border border-[rgba(99,102,241,0.2)]',
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-[12px]',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-lg ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
      {children}
    </span>
  )
}

export function BadgeGroup({ children, className = '' }) {
  return <div className={`flex flex-wrap gap-1.5 ${className}`}>{children}</div>
}
