export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-2',
    xl: 'w-8 h-8 border-2',
  }

  return (
    <div className="relative">
      <div
        role="status"
        aria-label="Loading"
        className={`${sizes[size]} rounded-full border-[#35354a] border-t-[#6366f1] animate-spin ${className}`}
      />
      <div className={`absolute inset-0 ${sizes[size]} rounded-full blur-sm bg-[#6366f1]/20`} />
    </div>
  )
}

export function DotsLoader({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  return (
    <div role="status" aria-label="Loading" className={`flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizes[size]} bg-[#6366f1] rounded-full animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.4)]`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default Spinner
