import { useState, useRef, useEffect } from 'react'
/* eslint-disable react-refresh/only-export-components */

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <div ref={menuRef} className="relative inline-block">
      {typeof children === 'function' ? children({ open, setOpen }) : children}
    </div>
  )
}

export function DropdownMenuTrigger({ children, onClick, ...props }) {
  return (
    <button type="button" onClick={onClick} aria-haspopup="true" {...props}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, open, align = 'end', className = '' }) {
  if (!open) return null

  const alignmentClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }

  return (
    <div
      className={`absolute z-50 mt-2 min-w-[160px] bg-[rgba(12,12,18,0.95)] border border-[rgba(255,255,255,0.08)] rounded-2xl py-2 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] ${alignmentClasses[align]} ${className}`}
      role="menu"
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
      {children}
    </div>
  )
}

export function DropdownMenuItem({ children, onClick, disabled = false, variant = 'default' }) {
  const variantClasses = {
    default: 'text-[#9898a8] hover:text-[#f0f0f5] hover:bg-[rgba(99,102,241,0.1)]',
    danger: 'text-[#f87171] hover:bg-[rgba(239,68,68,0.1)]',
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full px-4 py-2.5 text-[13px] text-left transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]}`}
      role="menuitem"
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-2 h-px bg-[rgba(255,255,255,0.06)] mx-3" role="separator" />
}

export function DropdownMenuLabel({ children }) {
  return (
    <div className="px-4 py-2 text-[10px] font-medium text-[#4a4a58] uppercase tracking-widest">
      {children}
    </div>
  )
}

export const DropdownIcons = {
  MoreHorizontal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
    </svg>
  ),
}
