import { useState, useEffect, useCallback, createContext, useContext } from 'react'

/* eslint-disable react-refresh/only-export-components */

const ToastContext = createContext(null)

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

const toastConfig = {
  success: {
    bg: 'bg-gradient-to-r from-[#0a0a0f]/95 to-[#0f0f15]/95',
    border: 'border-[#22c55e]/25',
    dot: 'bg-[#22c55e]',
    dotGlow: 'shadow-[0_0_12px_rgba(34,197,94,0.6)]',
    text: 'text-[#f0f0f5]',
    glow: 'shadow-[0_8px_32px_rgba(34,197,94,0.15)]',
  },
  error: {
    bg: 'bg-gradient-to-r from-[#0a0a0f]/95 to-[#0f0f15]/95',
    border: 'border-[#ef4444]/25',
    dot: 'bg-[#ef4444]',
    dotGlow: 'shadow-[0_0_12px_rgba(239,68,68,0.6)]',
    text: 'text-[#f0f0f5]',
    glow: 'shadow-[0_8px_32px_rgba(239,68,68,0.15)]',
  },
  warning: {
    bg: 'bg-gradient-to-r from-[#0a0a0f]/95 to-[#0f0f15]/95',
    border: 'border-[#f59e0b]/25',
    dot: 'bg-[#f59e0b]',
    dotGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]',
    text: 'text-[#f0f0f5]',
    glow: 'shadow-[0_8px_32px_rgba(245,158,11,0.15)]',
  },
  info: {
    bg: 'bg-gradient-to-r from-[#0a0a0f]/95 to-[#0f0f15]/95',
    border: 'border-[#6366f1]/25',
    dot: 'bg-[#6366f1]',
    dotGlow: 'shadow-[0_0_12px_rgba(99,102,241,0.6)]',
    text: 'text-[#f0f0f5]',
    glow: 'shadow-[0_8px_32px_rgba(99,102,241,0.15)]',
  },
}

function Toast({ id, message, type, onRemove }) {
  const [isExiting, setIsExiting] = useState(false)
  const config = toastConfig[type] || toastConfig.info

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onRemove(id), 150)
    }, 3500)
    return () => clearTimeout(timer)
  }, [id, onRemove])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(id), 150)
  }

  return (
    <div
      className={`
        relative flex items-center gap-3.5 px-4 py-3 
        ${config.bg} border ${config.border} rounded-2xl 
        ${config.glow}
        backdrop-blur-2xl
        transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}
        toast-enter
      `}
      role="alert"
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
      
      <span className={`w-2 h-2 rounded-full ${config.dot} ${config.dotGlow} flex-shrink-0`} />
      <span className={`flex-1 text-[13px] font-medium ${config.text}`}>{message}</span>
      <button 
        onClick={handleRemove} 
        className="p-1.5 hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-all duration-150 text-[#4a4a58] hover:text-[#9898a8]"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} id={toast.id} message={toast.message} type={toast.type} onRemove={removeToast} />
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = TOAST_TYPES.INFO) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = {
    success: (message) => addToast(message, TOAST_TYPES.SUCCESS),
    error: (message) => addToast(message, TOAST_TYPES.ERROR),
    warning: (message) => addToast(message, TOAST_TYPES.WARNING),
    info: (message) => addToast(message, TOAST_TYPES.INFO),
    remove: removeToast,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  
  const showToast = (message, type = 'info') => {
    switch (type) {
      case 'success': return context.success(message)
      case 'error': return context.error(message)
      case 'warning': return context.warning(message)
      default: return context.info(message)
    }
  }
  
  return { ...context, showToast }
}
