/**
 * Progress bar component with animations
 * Inspired by Mantine Progress component
 */
import { useState, useEffect } from 'react'

/**
 * Animated progress bar
 */
export function Progress({ 
  value = 0, 
  size = 'md',
  color = 'blue',
  animated = false,
  striped = false,
  showLabel = false,
  label,
  className = '',
  ...props
}) {
  const [width, setWidth] = useState(0)
  
  // Animate progress on mount and value change
  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.min(100, Math.max(0, value)))
    }, 50)
    return () => clearTimeout(timer)
  }, [value])

  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  }

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    gray: 'bg-gray-500',
  }

  const stripedClass = striped || animated
    ? 'bg-stripes'
    : ''

  const animatedClass = animated
    ? 'animate-progress-stripes'
    : ''

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`
        w-full bg-gray-200 rounded-full overflow-hidden
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      <div
        className={`
          h-full rounded-full transition-all duration-500 ease-out
          ${colors[color]} ${stripedClass} ${animatedClass}
          flex items-center justify-center
        `}
        style={{ width: `${width}%` }}
      >
        {showLabel && size !== 'xs' && size !== 'sm' && (
          <span className="text-white text-xs font-medium px-2 truncate">
            {label || `${Math.round(width)}%`}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Multi-section progress bar
 */
export function ProgressStack({ sections = [], size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden flex ${sizes[size]} ${className}`}>
      {sections.map((section, index) => (
        <div
          key={index}
          className={`h-full transition-all duration-500 ease-out ${section.color || 'bg-blue-500'}`}
          style={{ width: `${section.value}%` }}
          title={section.label}
        />
      ))}
    </div>
  )
}

/**
 * Circular progress indicator
 */
export function CircularProgress({ 
  value = 0, 
  size = 'md',
  color = 'blue',
  strokeWidth,
  showValue = false,
  className = '' 
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(Math.min(100, Math.max(0, value)))
    }, 50)
    return () => clearTimeout(timer)
  }, [value])

  const sizes = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  }

  const defaultStrokes = {
    xs: 3,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
  }

  const colors = {
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
    yellow: '#eab308',
    purple: '#a855f7',
    cyan: '#06b6d4',
    gray: '#6b7280',
  }

  const svgSize = sizes[size]
  const stroke = strokeWidth || defaultStrokes[size]
  const radius = (svgSize - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={colors[color]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <span className={`absolute font-semibold ${size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
}

/**
 * Indeterminate progress bar - for unknown progress
 */
export function IndeterminateProgress({ size = 'md', color = 'blue', className = '' }) {
  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  }

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]} ${className}`}>
      <div className={`h-full w-1/3 rounded-full ${colors[color]} animate-indeterminate`} />
    </div>
  )
}

/**
 * Top page progress bar (like YouTube)
 */
export function PageProgress({ isLoading, className = '' }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setProgress(0)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgress(100)
      const timer = setTimeout(() => setProgress(0), 200)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!isLoading && progress === 0) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 h-1 ${className}`}>
      <div
        className="h-full bg-blue-500 transition-all duration-200 ease-out shadow-lg shadow-blue-500/50"
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 200ms, opacity 200ms 200ms' : 'width 200ms'
        }}
      />
    </div>
  )
}

export default Progress
