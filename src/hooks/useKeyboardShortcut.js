import { useEffect, useCallback } from 'react'

/**
 * Custom hook for keyboard shortcuts
 * Inspired by Mantine's useHotkeys hook
 * 
 * @param {string} key - The key to listen for (e.g., 'n', 'Escape', 'ctrl+s', 'shift+/')
 * @param {Function} callback - Function to call when key is pressed
 * @param {Object} options - Configuration options
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = true,
  } = options

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return

      // Ignore if typing in input, textarea, or contenteditable
      if (ignoreInputs) {
        const target = event.target
        const tagName = target.tagName.toLowerCase()
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable
        ) {
          // Allow Escape key even in inputs
          if (event.key !== 'Escape') {
            return
          }
        }
      }

      // Parse the key combination
      const keys = key.toLowerCase().split('+')
      const mainKey = keys[keys.length - 1]
      const requireCtrl = keys.includes('ctrl') || keys.includes('control')
      const requireShift = keys.includes('shift')
      const requireAlt = keys.includes('alt')
      const requireMeta = keys.includes('meta') || keys.includes('cmd')

      // Check if modifiers match
      // For '?' key, shift is implicitly required (Shift+/)
      const isQuestionMark = mainKey === '?'
      const ctrlMatch = requireCtrl === (event.ctrlKey || event.metaKey)
      const shiftMatch = isQuestionMark ? true : (requireShift === event.shiftKey)
      const altMatch = requireAlt === event.altKey
      const metaMatch = requireMeta === event.metaKey

      // Check if the main key matches (case insensitive for letters, exact for special keys)
      const eventKey = event.key
      let keyMatch = false
      
      // Handle special cases
      if (mainKey === 'escape') {
        keyMatch = eventKey === 'Escape'
      } else if (mainKey === '?') {
        // ? is produced by Shift+/ on most keyboards
        // event.key will be '?' when the key combo is pressed correctly
        keyMatch = eventKey === '?'
      } else if (mainKey === '/') {
        keyMatch = eventKey === '/' && !event.shiftKey
      } else {
        keyMatch = eventKey.toLowerCase() === mainKey
      }

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        if (preventDefault) {
          event.preventDefault()
        }
        callback(event)
      }
    },
    [key, callback, enabled, preventDefault, ignoreInputs]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

/**
 * Hook for multiple keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
  const { enabled = true, ignoreInputs = true } = options

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return

      // Ignore if typing in input, textarea, or contenteditable
      if (ignoreInputs) {
        const target = event.target
        const tagName = target.tagName.toLowerCase()
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable
        ) {
          // Allow Escape key even in inputs
          if (event.key !== 'Escape') {
            return
          }
        }
      }

      for (const [key, callback] of shortcuts) {
        const keys = key.toLowerCase().split('+')
        const mainKey = keys[keys.length - 1]
        const requireCtrl = keys.includes('ctrl') || keys.includes('control')
        const requireShift = keys.includes('shift')
        const requireAlt = keys.includes('alt')

        const isQuestionMark = mainKey === '?'
        const ctrlMatch = requireCtrl === (event.ctrlKey || event.metaKey)
        const shiftMatch = isQuestionMark ? true : (requireShift === event.shiftKey)
        const altMatch = requireAlt === event.altKey
        
        // Handle special keys
        const eventKey = event.key
        let keyMatch = false
        if (mainKey === 'escape') {
          keyMatch = eventKey === 'Escape'
        } else if (mainKey === '?') {
          keyMatch = eventKey === '?'
        } else if (mainKey === '/') {
          keyMatch = eventKey === '/' && !event.shiftKey
        } else {
          keyMatch = eventKey.toLowerCase() === mainKey
        }

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault()
          callback(event)
          break
        }
      }
    },
    [shortcuts, enabled, ignoreInputs]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}
