import { useState, useEffect, useRef, useCallback } from 'react'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { KEYBOARD_SHORTCUTS } from '../lib/constants'

export function KeyboardShortcutsHelp({ isOpen: externalOpen, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const previousFocusRef = useRef(null)
  const modalRef = useRef(null)

  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen

  const handleClose = useCallback(() => {
    if (isControlled && onClose) onClose()
    else setInternalOpen(false)
    setTimeout(() => previousFocusRef.current?.focus(), 100)
  }, [isControlled, onClose])

  const handleOpen = useCallback(() => {
    previousFocusRef.current = document.activeElement
    if (!isControlled) setInternalOpen(true)
  }, [isControlled])

  useEffect(() => {
    const handleOpenEvent = () => {
      previousFocusRef.current = document.activeElement
      if (!isControlled) setInternalOpen(true)
    }
    window.addEventListener('open-shortcuts-help', handleOpenEvent)
    return () => window.removeEventListener('open-shortcuts-help', handleOpenEvent)
  }, [isControlled])

  useKeyboardShortcut('ctrl+/', () => { if (open) handleClose(); else handleOpen() }, { preventDefault: true })
  useKeyboardShortcut('Escape', () => { if (open) handleClose() }, { ignoreInputs: false })

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => modalRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const shortcutGroups = [
    { title: 'Navigation', shortcuts: [
      { keys: ['N'], description: KEYBOARD_SHORTCUTS.NEW_BUG },
      { keys: ['/'], description: KEYBOARD_SHORTCUTS.SEARCH },
      { keys: ['G', 'D'], description: 'Go to dashboard' },
      { keys: ['G', 'L'], description: 'Go to logs' },
      { keys: ['Ctrl', 'K'], description: KEYBOARD_SHORTCUTS.QUICK_ACTIONS },
    ]},
    { title: 'Actions', shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save / Submit form' },
      { keys: ['Ctrl', 'Enter'], description: 'Quick submit' },
    ]},
    { title: 'Account', shortcuts: [
      { keys: ['Ctrl', 'Shift', 'X'], description: 'Sign out' },
    ]},
    { title: 'General', shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: KEYBOARD_SHORTCUTS.CLOSE },
    ]},
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[#06060a]/80 backdrop-blur-xl" onClick={handleClose} />

      <div className="relative flex items-center justify-center min-h-screen p-4 pointer-events-none">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[rgba(99,102,241,0.06)] blur-[100px] pointer-events-none" />
        
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative w-full max-w-md bg-[rgba(12,12,18,0.95)] rounded-3xl border border-[rgba(255,255,255,0.08)] overflow-hidden pointer-events-auto backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_80px_rgba(99,102,241,0.08)]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/40 to-transparent" />
          
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <h2 id="shortcuts-title" className="text-[15px] font-semibold text-[#f0f0f5]">Keyboard shortcuts</h2>
            <button onClick={handleClose} className="p-1.5 text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all duration-150" aria-label="Close">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-5 max-h-[60vh] overflow-y-auto space-y-5">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[10px] font-medium text-[#4a4a58] uppercase tracking-widest mb-3">{group.title}</h3>
                <div className="space-y-1.5">
                  {group.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                      <span className="text-[12px] text-[#9898a8]">{shortcut.description}</span>
                      <div className="flex items-center gap-1.5">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="min-w-[24px] px-2 py-1 text-[10px] font-medium text-[#9898a8] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-center">{key}</kbd>
                            {keyIndex < shortcut.keys.length - 1 && <span className="text-[#4a4a58] text-[10px]">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] flex items-center justify-between">
            <span className="text-[10px] text-[#4a4a58] flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg">/</kbd>
              to toggle
            </span>
            <span className="text-[10px] text-[#4a4a58]">esc to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
