import { useState, useRef, useEffect } from 'react'

export function Tooltip({ children, content, position = 'top', delay = 200 }) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      
      {visible && content && (
        <div
          role="tooltip"
          className={`absolute z-50 px-3 py-1.5 text-[11px] text-[#f0f0f5] bg-[rgba(12,12,18,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.3)] whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
