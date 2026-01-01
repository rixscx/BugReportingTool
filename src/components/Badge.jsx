/**
 * Badge component for labels and status indicators
 */
export function Badge({
  children,
  variant = 'default', // 'default' | 'outline' | 'secondary'
  color = 'gray', // 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'indigo'
  size = 'sm', // 'xs' | 'sm' | 'md'
  dot = false,
  className = '',
}) {
  const colorClasses = {
    gray: {
      default: 'bg-gray-100 text-gray-700',
      outline: 'border border-gray-300 text-gray-700',
      secondary: 'bg-gray-50 text-gray-600',
    },
    red: {
      default: 'bg-red-100 text-red-700',
      outline: 'border border-red-300 text-red-700',
      secondary: 'bg-red-50 text-red-600',
    },
    green: {
      default: 'bg-green-100 text-green-700',
      outline: 'border border-green-300 text-green-700',
      secondary: 'bg-green-50 text-green-600',
    },
    blue: {
      default: 'bg-blue-100 text-blue-700',
      outline: 'border border-blue-300 text-blue-700',
      secondary: 'bg-blue-50 text-blue-600',
    },
    yellow: {
      default: 'bg-yellow-100 text-yellow-700',
      outline: 'border border-yellow-300 text-yellow-700',
      secondary: 'bg-yellow-50 text-yellow-600',
    },
    purple: {
      default: 'bg-purple-100 text-purple-700',
      outline: 'border border-purple-300 text-purple-700',
      secondary: 'bg-purple-50 text-purple-600',
    },
    indigo: {
      default: 'bg-indigo-100 text-indigo-700',
      outline: 'border border-indigo-300 text-indigo-700',
      secondary: 'bg-indigo-50 text-indigo-600',
    },
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const dotColors = {
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${colorClasses[color][variant]} ${sizeClasses[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
      )}
      {children}
    </span>
  );
}

/**
 * Badge group for displaying multiple badges
 */
export function BadgeGroup({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {children}
    </div>
  );
}
