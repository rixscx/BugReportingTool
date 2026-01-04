import { useState, useEffect } from 'react'

export function Progress({ value = 0, size = 'md', showLabel = false, label, className = '' }) {
  const [width, setWidth] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), 50)
    return () => clearTimeout(timer)
  }, [value])

  const sizes = {
    xs: 'h-0.5',
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full bg-[#14141c] rounded-full overflow-hidden ${sizes[size]} ${className}`}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.4)]"
        style={{ width: `${width}%` }}
      >
        {showLabel && size === 'lg' && (
          <span className="text-[10px] text-white font-medium px-2 truncate">
            {label || `${Math.round(width)}%`}
          </span>
        )}
      </div>
    </div>
  )
}

export function ProgressStack({ sections = [], size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-0.5',
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }

  return (
    <div className={`w-full bg-[#14141c] rounded-full overflow-hidden flex ${sizes[size]} ${className}`}>
      {sections.map((section, index) => (
        <div
          key={index}
          className={`h-full transition-all duration-500 ease-out ${section.color || 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]'}`}
          style={{ width: `${section.value}%` }}
          title={section.label}
        />
      ))}
    </div>
  )
}

export function PageProgress({ isLoading, className = '' }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress(prev => prev >= 90 ? prev : prev + Math.random() * 10)
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
    <div className={`fixed top-0 left-0 right-0 z-50 h-0.5 ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] transition-all duration-200 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
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
