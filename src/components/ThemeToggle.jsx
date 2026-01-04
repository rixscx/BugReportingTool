/**
 * Theme Toggle component with smooth animations
 */
export function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative p-2.5 rounded-xl hover:bg-[rgba(99,102,241,0.1)] transition-all duration-200 group"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 text-[#fbbf24] transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        
        {/* Moon icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 text-[#818cf8] transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
    </button>
  )
}

/**
 * Advanced theme toggle with system option
 */
export function ThemeToggleAdvanced({ isDark, onLight, onDark, onSystem }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[#0a0a0f] rounded-xl border border-[rgba(255,255,255,0.06)]">
      <button
        onClick={onLight}
        className={`p-2 rounded-lg transition-all duration-200 ${
          !isDark ? 'bg-[rgba(99,102,241,0.15)] shadow-[0_0_10px_rgba(99,102,241,0.2)] text-[#fbbf24]' : 'text-[#4a4a58] hover:text-[#9898a8]'
        }`}
        aria-label="Light mode"
        title="Light mode"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
      
      <button
        onClick={onSystem}
        className="p-2 rounded-lg text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200"
        aria-label="System preference"
        title="System preference"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
      
      <button
        onClick={onDark}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isDark ? 'bg-[rgba(99,102,241,0.15)] shadow-[0_0_10px_rgba(99,102,241,0.2)] text-[#818cf8]' : 'text-[#4a4a58] hover:text-[#9898a8]'
        }`}
        aria-label="Dark mode"
        title="Dark mode"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>
  )
}
