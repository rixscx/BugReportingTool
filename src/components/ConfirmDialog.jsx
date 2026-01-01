import { useState, useEffect, useRef } from 'react';
/* eslint-disable react-refresh/only-export-components */
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

/**
 * A reusable confirmation dialog component
 * Inspired by shadcn/ui AlertDialog pattern
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  onConfirm,
  loading = false,
}) {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  useKeyboardShortcut('Escape', () => {
    if (open && !loading) {
      onOpenChange(false);
    }
  }, { enabled: open });
  useEffect(() => {
    if (open && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [open]);
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

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 animate-fade-in" />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-xl p-6 mx-4 animate-slide-in"
      >
        <h2
          id="dialog-title"
          className="text-lg font-semibold text-gray-900 mb-2"
        >
          {title}
        </h2>
        
        <p
          id="dialog-description"
          className="text-sm text-gray-600 mb-6"
        >
          {description}
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${variantStyles[confirmVariant]}`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing confirm dialog state
 */
export function useConfirmDialog() {
  const [state, setState] = useState({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmVariant: 'danger',
    onConfirm: () => {},
    loading: false,
  });

  const confirm = ({
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger',
  }) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        description,
        confirmLabel,
        cancelLabel,
        confirmVariant,
        onConfirm: () => {
          resolve(true);
          setState((s) => ({ ...s, open: false }));
        },
        loading: false,
      });
    });
  };

  const close = () => {
    setState((s) => ({ ...s, open: false }));
  };

  const setLoading = (loading) => {
    setState((s) => ({ ...s, loading }));
  };

  return {
    dialogProps: {
      ...state,
      onOpenChange: (open) => setState((s) => ({ ...s, open })),
    },
    confirm,
    close,
    setLoading,
  };
}
