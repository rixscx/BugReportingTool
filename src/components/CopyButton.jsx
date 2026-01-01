import { useClipboard } from '../hooks/useClipboard';

/**
 * CopyButton component for copying text to clipboard
 * Inspired by Mantine's CopyButton pattern
 */
export function CopyButton({ value, timeout = 2000, children }) {
  const { copy, copied } = useClipboard({ timeout });

  return children({ copy: () => copy(value), copied });
}

/**
 * Pre-styled copy button with icon
 */
export function CopyIconButton({ 
  value, 
  timeout = 2000, 
  size = 'sm',
  className = ''
}) {
  const { copy, copied } = useClipboard({ timeout });

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={`inline-flex items-center justify-center rounded-md transition-colors ${sizeClasses[size]} ${
        copied 
          ? 'bg-green-100 text-green-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

/**
 * Copy button that shows text
 */
export function CopyTextButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied!',
  timeout = 2000,
  variant = 'default', // 'default' | 'outline' | 'ghost'
  className = '',
}) {
  const { copy, copied } = useClipboard({ timeout });

  const variantClasses = {
    default: copied 
      ? 'bg-green-600 text-white' 
      : 'bg-blue-600 text-white hover:bg-blue-700',
    outline: copied
      ? 'border-green-600 text-green-600 bg-green-50'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: copied
      ? 'text-green-600 bg-green-50'
      : 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
        variant === 'outline' ? 'border' : 'border-transparent'
      } ${variantClasses[variant]} ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {copiedLabel}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
