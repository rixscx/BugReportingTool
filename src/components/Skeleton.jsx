/**
 * Skeleton loading components with modern shimmer animations
 * Inspired by shadcn/ui and Mantine skeleton components
 */

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className = '', variant = 'shimmer', ...props }) {
  const variants = {
    pulse: 'animate-pulse bg-gray-200',
    shimmer: 'skeleton-shimmer',
    wave: 'bg-gray-200 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-skeleton-wave',
  }

  return (
    <div
      className={`rounded ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

/**
 * Skeleton for bug cards on the dashboard with stagger animation
 */
export function BugCardSkeleton({ index = 0 }) {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 animate-fade-in card-hover"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

/**
 * Skeleton for dashboard grid with stagger effect
 */
export function DashboardSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BugCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for bug detail page
 */
export function BugDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Skeleton className="h-4 w-32 mb-4" />
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="mb-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>

        <div className="mb-6">
          <Skeleton className="h-4 w-36 mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Comments skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for comments section
 */
export function CommentsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for activity timeline
 */
export function ActivityTimelineSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Inline loading spinner
 */
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  return (
    <svg
      className={`animate-spin text-blue-600 ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Modern full page loading state with multiple animation variants
 */
export function PageLoader({ variant = 'dots', text = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center animate-fade-in">
        {variant === 'dots' && <DotsAnimation />}
        {variant === 'spinner' && <SpinnerAnimation />}
        {variant === 'bars' && <BarsAnimation />}
        {variant === 'pulse' && <PulseAnimation />}
        <p className="text-gray-600 mt-4 animate-pulse">{text}</p>
      </div>
    </div>
  )
}

function DotsAnimation() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-4 h-4 bg-blue-500 rounded-full animate-bounce-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function SpinnerAnimation() {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
      <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

function BarsAnimation() {
  return (
    <div className="flex items-end justify-center gap-1 h-12">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-2 bg-blue-500 rounded-t animate-bars-loader"
          style={{ 
            animationDelay: `${i * 0.12}s`,
            height: '100%'
          }}
        />
      ))}
    </div>
  )
}

function PulseAnimation() {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
      <div className="absolute inset-2 bg-blue-500 rounded-full animate-pulse" />
    </div>
  )
}

/**
 * Inline skeleton text with shimmer
 */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }
  
  return <Skeleton className={`rounded-full ${sizes[size]} ${className}`} />
}

/**
 * Button skeleton
 */
export function SkeletonButton({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  }
  
  return <Skeleton className={`rounded-md ${sizes[size]} ${className}`} />
}
