/* eslint-disable react-refresh/only-export-components */
import { forwardRef } from 'react'

const buttonVariants = {
  primary: 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#818cf8] hover:to-[#a78bfa] text-white shadow-[0_2px_8px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_24px_rgba(99,102,241,0.4)]',
  secondary: 'bg-gradient-to-b from-[#14141c] to-[#0f0f15] hover:from-[#1a1a24] hover:to-[#14141c] text-[#e4e4eb] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]',
  outline: 'border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.04)] text-[#9898a8] hover:text-[#e4e4eb]',
  ghost: 'hover:bg-[rgba(255,255,255,0.06)] text-[#9898a8] hover:text-[#e4e4eb]',
  danger: 'bg-gradient-to-r from-[#dc2626] to-[#ef4444] hover:from-[#ef4444] hover:to-[#f87171] text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)]',
  success: 'bg-gradient-to-r from-[#059669] to-[#22c55e] hover:from-[#10b981] hover:to-[#4ade80] text-white shadow-[0_2px_8px_rgba(5,150,105,0.3)]',
}

const buttonSizes = {
  xs: 'h-7 px-3 text-[10px] gap-1.5 rounded-lg',
  sm: 'h-8 px-3.5 text-[11px] gap-1.5 rounded-xl',
  md: 'h-9 px-4 text-[12px] gap-2 rounded-xl',
  lg: 'h-10 px-5 text-[13px] gap-2 rounded-2xl',
  xl: 'h-12 px-6 text-[14px] gap-2.5 rounded-2xl',
  icon: 'h-9 w-9 rounded-xl',
  'icon-sm': 'h-7 w-7 rounded-lg',
  'icon-lg': 'h-11 w-11 rounded-2xl',
}

export const Button = forwardRef(({ 
  children, variant = 'primary', size = 'md', loading = false, loadingText, disabled = false, leftIcon, rightIcon, className = '', ...props
}, ref) => {
  const isDisabled = disabled || loading
  const isIconOnly = size.startsWith('icon')
  
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium 
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060a]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        active:scale-[0.97] hover:-translate-y-0.5
        ${buttonVariants[variant]} 
        ${buttonSizes[size]} 
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {loadingText && !isIconOnly && <span className="ml-1.5">{loadingText}</span>}
          {!loadingText && !isIconOnly && children}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0 opacity-80">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0 opacity-80">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export const IconButton = forwardRef(({ icon, loading = false, variant = 'ghost', size = 'icon', ariaLabel, className = '', ...props }, ref) => {
  return (
    <Button ref={ref} variant={variant} size={size} loading={loading} aria-label={ariaLabel} className={className} {...props}>
      {!loading && icon}
    </Button>
  )
})

IconButton.displayName = 'IconButton'

export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex [&>button]:rounded-none [&>button:first-child]:rounded-l-xl [&>button:last-child]:rounded-r-xl [&>button:not(:last-child)]:border-r-0 ${className}`}>
      {children}
    </div>
  )
}

export default Button
