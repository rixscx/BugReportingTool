import { useClipboard } from '../hooks/useClipboard'

export function CopyButton({ value, timeout = 2000, children }) {
  const { copy, copied } = useClipboard({ timeout })
  return children({ copy: () => copy(value), copied })
}

export function CopyIconButton({ value, timeout = 2000, size = 'sm', className = '' }) {
  const { copy, copied } = useClipboard({ timeout })
  const sizeClasses = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-9 h-9' }
  const iconSizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 ${sizeClasses[size]} ${
        copied ? 'bg-[rgba(99,102,241,0.15)] text-[#818cf8] shadow-[0_0_8px_rgba(99,102,241,0.2)]' : 'text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.06)]'
      } ${className}`}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? (
        <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
    </button>
  )
}

export function CopyTextButton({ value, label = 'copy', copiedLabel = 'copied', timeout = 2000, className = '' }) {
  const { copy, copied } = useClipboard({ timeout })

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all duration-200 ${
        copied ? 'text-[#818cf8]' : 'text-[#4a4a58] hover:text-[#9898a8]'
      } ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
