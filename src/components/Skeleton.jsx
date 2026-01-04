export function Skeleton({ className = '', ...props }) {
  return (
    <div 
      className={`rounded-xl bg-gradient-to-r from-[#0a0a0f] via-[#14141c] to-[#0a0a0f] bg-[length:200%_100%] animate-shimmer ${className}`} 
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
      {...props} 
    />
  )
}

export function BugCardSkeleton({ index = 0 }) {
  return (
    <div 
      className="relative bg-[rgba(12,12,18,0.7)] rounded-2xl border border-[rgba(255,255,255,0.06)] p-5 opacity-0 animate-fade-in backdrop-blur-xl" 
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'forwards' }}
    >
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-full mb-1.5" />
      <Skeleton className="h-3 w-2/3 mb-5" />
      <div className="flex justify-between items-center pt-4 border-t border-[rgba(255,255,255,0.04)]">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function DashboardSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => <BugCardSkeleton key={i} index={i} />)}
    </div>
  )
}

export function BugDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Skeleton className="h-4 w-24 mb-6 rounded-xl" />
      <div className="relative bg-[rgba(12,12,18,0.7)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 mb-6 backdrop-blur-xl">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
        <Skeleton className="h-6 w-2/3 mb-5" />
        <Skeleton className="h-4 w-full mb-2.5" />
        <Skeleton className="h-4 w-full mb-2.5" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 relative bg-[rgba(12,12,18,0.7)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 backdrop-blur-xl">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
          <Skeleton className="h-4 w-20 mb-5" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="relative bg-[rgba(12,12,18,0.7)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 backdrop-blur-xl">
          <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
          <Skeleton className="h-4 w-16 mb-4" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function CommentsSkeleton({ count = 2 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
          <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-28 mb-2.5" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivityTimelineSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 opacity-0 animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}>
          <Skeleton className="h-6 w-6 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-16 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5', xl: 'h-8 w-8' }
  return (
    <svg className={`animate-spin text-[#6366f1] ${sizes[size]} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function PageLoader({ text = '' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06060a]">
      <div className="text-center">
        <div className="relative">
          <LoadingSpinner size="xl" className="mx-auto" />
          <div className="absolute inset-0 blur-2xl bg-[#6366f1]/20 rounded-full animate-breathe" />
        </div>
        {text && <p className="text-[#4a4a58] mt-5 text-[12px]">{text}</p>}
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10', xl: 'w-12 h-12' }
  return <Skeleton className={`rounded-xl ${sizes[size]} ${className}`} />
}

export function SkeletonButton({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-16', md: 'h-9 w-20', lg: 'h-10 w-24' }
  return <Skeleton className={`rounded-xl ${sizes[size]} ${className}`} />
}
