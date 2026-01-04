/* eslint-disable react-refresh/only-export-components */

const icons = {
  Archive: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  Search: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Bug: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  Comment: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
}

export function EmptyState({ icon, title, description, action, className = '' }) {
  const IconComponent = icon && icons[icon]
  
  return (
    <div className={`relative flex flex-col items-center justify-center py-20 px-4 text-center ${className}`}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[rgba(99,102,241,0.04)] blur-[80px] pointer-events-none" />
      
      {IconComponent && (
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(99,102,241,0.15)] to-[rgba(139,92,246,0.1)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-6 text-[#6366f1] shadow-[0_8px_32px_rgba(99,102,241,0.1)]">
          {IconComponent}
        </div>
      )}
      {title && <h3 className="relative text-[15px] font-medium text-[#f0f0f5] mb-2">{title}</h3>}
      {description && <p className="relative text-[13px] text-[#6b6b7b] max-w-sm mb-6 leading-relaxed">{description}</p>}
      {action && <div className="relative">{action}</div>}
    </div>
  )
}
