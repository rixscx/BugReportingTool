import { useEffect } from 'react'

/**
 * Simple hook that ensures light theme is always applied
 * Dark mode has been removed from this application
 */
export function useTheme() {
  // Ensure light theme on mount
  useEffect(() => {
    // Remove any dark class
    document.documentElement.classList.remove('dark')
    // Clear any stored theme preference
    localStorage.removeItem('theme')
    localStorage.removeItem('bug-tracker-theme')
  }, [])

  return {
    theme: 'light',
    isDark: false,
    isLight: true,
  }
}
