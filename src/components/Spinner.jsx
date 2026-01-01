/**
 * Modern spinner components with multiple animation variants
 * Inspired by shadcn/ui and Mantine loaders
 */

/**
 * Classic oval/ring spinner
 */
export function Spinner({ size = 'md', color = 'blue', className = '' }) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-4',
  }

  const colors = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    green: 'border-green-500',
    red: 'border-red-500',
    white: 'border-white',
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`
        ${sizes[size]} ${colors[color]}
        rounded-full border-t-transparent
        animate-spin
        ${className}
      `}
    />
  )
}

/**
 * Dots loader - three bouncing dots
 */
export function DotsLoader({ size = 'md', color = 'blue', className = '' }) {
  const sizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  const colors = {
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    white: 'bg-white',
  }

  return (
    <div 
      role="status" 
      aria-label="Loading"
      className={`flex items-center gap-1 ${className}`}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizes[size]} ${colors[color]}
            rounded-full animate-bounce-dot
          `}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

/**
 * Bars loader - animated bars
 */
export function BarsLoader({ size = 'md', color = 'blue', className = '' }) {
  const heights = {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-10',
  }

  const widths = {
    xs: 'w-0.5',
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2',
    xl: 'w-2.5',
  }

  const colors = {
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    white: 'bg-white',
  }

  return (
    <div 
      role="status" 
      aria-label="Loading"
      className={`flex items-end gap-0.5 ${heights[size]} ${className}`}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`
            ${widths[size]} ${colors[color]}
            rounded-sm animate-bars-loader
          `}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

/**
 * Pulse loader - expanding/contracting circle
 */
export function PulseLoader({ size = 'md', color = 'blue', className = '' }) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const colors = {
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    white: 'bg-white',
  }

  return (
    <div 
      role="status" 
      aria-label="Loading"
      className={`relative ${sizes[size]} ${className}`}
    >
      <div className={`absolute inset-0 ${colors[color]} rounded-full animate-ping opacity-75`} />
      <div className={`absolute inset-0 ${colors[color]} rounded-full opacity-50`} />
    </div>
  )
}

/**
 * Ring loader - animated SVG ring
 */
export function RingLoader({ size = 'md', color = 'blue', className = '' }) {
  const sizes = {
    xs: 16,
    sm: 20,
    md: 32,
    lg: 44,
    xl: 56,
  }

  const strokeWidths = {
    xs: 2,
    sm: 2.5,
    md: 3,
    lg: 4,
    xl: 5,
  }

  const colors = {
    blue: '#3b82f6',
    gray: '#6b7280',
    green: '#22c55e',
    red: '#ef4444',
    white: '#ffffff',
  }

  const svgSize = sizes[size]
  const strokeWidth = strokeWidths[size]
  const radius = (svgSize - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  return (
    <svg
      role="status"
      aria-label="Loading"
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      className={`animate-spin-slow ${className}`}
    >
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="opacity-20"
      />
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke={colors[color]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.75}
      />
    </svg>
  )
}

/**
 * Gradient spinner - modern gradient rotating loader
 */
export function GradientSpinner({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${sizes[size]} ${className}`}
    >
      <div className="w-full h-full rounded-full bg-gradient-conic animate-spin-slow" />
    </div>
  )
}

/**
 * Button loading state - use inside buttons
 */
export function ButtonSpinner({ size = 'sm', className = '' }) {
  return (
    <Spinner size={size} color="white" className={className} />
  )
}

/**
 * Inline loader - for text/inline content
 */
export function InlineLoader({ text = 'Loading', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size="xs" />
      <span>{text}</span>
    </span>
  )
}

export default Spinner
