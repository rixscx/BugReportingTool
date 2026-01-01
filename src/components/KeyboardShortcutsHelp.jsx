import { useState, useEffect } from 'react';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { KEYBOARD_SHORTCUTS } from '../lib/constants';

/**
 * Modal that displays available keyboard shortcuts
 * Opens with '?' key (Shift + /) or via external control
 * Click outside to close
 * 
 * @param {boolean} isOpen - External control for opening the modal
 * @param {function} onClose - Callback when modal is closed
 */
export function KeyboardShortcutsHelp({ isOpen: externalOpen, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  
  const handleClose = () => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };
  
  const handleOpen = () => {
    if (isControlled && onClose) {
      // If controlled, we can't open from keyboard - parent needs to handle it
      // But we'll try to dispatch a custom event
      window.dispatchEvent(new CustomEvent('open-shortcuts-help'));
    } else {
      setInternalOpen(true);
    }
  };
  useKeyboardShortcut('ctrl+/', () => {
    if (open) {
      handleClose();
    } else {
      handleOpen();
    }
  }, { preventDefault: true });
  useKeyboardShortcut('Escape', () => {
    if (open) handleClose();
  }, { ignoreInputs: false });
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const shortcutGroups = [
    {
      title: 'Navigation',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      shortcuts: [
        { keys: ['N'], description: KEYBOARD_SHORTCUTS.NEW_BUG },
        { keys: ['/'], description: KEYBOARD_SHORTCUTS.SEARCH },
        { keys: ['G'], description: KEYBOARD_SHORTCUTS.GO_HOME },
        { keys: ['Ctrl', 'K'], description: KEYBOARD_SHORTCUTS.QUICK_ACTIONS },
      ],
    },
    {
      title: 'Actions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      shortcuts: [
        { keys: ['Ctrl', 'S'], description: 'Save / Submit form' },
        { keys: ['Ctrl', 'Enter'], description: 'Quick submit' },
      ],
    },
    {
      title: 'Account',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      shortcuts: [
        { keys: ['Ctrl', 'Shift', 'X'], description: 'Sign out' },
      ],
    },
    {
      title: 'General',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      shortcuts: [
        { keys: ['Ctrl', '/'], description: KEYBOARD_SHORTCUTS.HELP },
        { keys: ['Esc'], description: KEYBOARD_SHORTCUTS.CLOSE },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      {/* Backdrop - Click to close */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" 
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl mx-4 animate-fade-in-scale overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-lg font-bold text-slate-800">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500">Navigate faster with shortcuts</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-all"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-slate-400">{group.icon}</span>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300 rounded-lg shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-slate-300 text-xs font-medium">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-white border border-slate-300 rounded">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 text-xs font-semibold bg-white border border-slate-300 rounded">/</kbd> to toggle
            </p>
            <p className="text-xs text-slate-400">Click outside to close</p>
          </div>
        </div>
      </div>
    </div>
  );
}
