import { useState, useEffect, useRef } from 'react';
/* eslint-disable react-refresh/only-export-components */
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', confirmVariant = 'danger', onConfirm, loading = false }) {
  const confirmButtonRef = useRef(null);
  
  useKeyboardShortcut('Escape', () => { if (open && !loading) onOpenChange(false); }, { enabled: open });
  
  useEffect(() => { if (open && confirmButtonRef.current) confirmButtonRef.current.focus(); }, [open]);
  
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const variantStyles = {
    danger: 'bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:shadow-[0_8px_30px_rgba(239,68,68,0.3)]',
    primary: 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)]',
    warning: 'bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:shadow-[0_8px_30px_rgba(234,179,8,0.3)]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget && !loading) onOpenChange(false); }} role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-[#06060a]/80 backdrop-blur-xl" />
      
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[rgba(239,68,68,0.05)] blur-[100px] pointer-events-none" />
      
      <div className="relative z-50 w-full max-w-sm bg-[rgba(12,12,18,0.95)] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 mx-4 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        {/* Top gradient line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
        
        <h2 className="text-[15px] font-semibold text-[#f0f0f5] mb-2">{title}</h2>
        <p className="text-[13px] text-[#6b6b7b] mb-6 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => onOpenChange(false)} disabled={loading} className="px-4 py-2.5 text-[12px] font-medium text-[#9898a8] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f0f0f5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {cancelLabel}
          </button>
          <button ref={confirmButtonRef} type="button" onClick={onConfirm} disabled={loading} className={`px-4 py-2.5 text-[12px] font-medium text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 ${variantStyles[confirmVariant]}`}>
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState({ open: false, title: '', description: '', confirmLabel: 'Confirm', cancelLabel: 'Cancel', confirmVariant: 'danger', onConfirm: () => {}, loading: false });

  const confirm = ({ title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', confirmVariant = 'danger' }) => {
    return new Promise((resolve) => {
      setState({ open: true, title, description, confirmLabel, cancelLabel, confirmVariant, onConfirm: () => { resolve(true); setState((s) => ({ ...s, open: false })); }, loading: false });
    });
  };

  const close = () => setState((s) => ({ ...s, open: false }));
  const setLoading = (loading) => setState((s) => ({ ...s, loading }));

  return { dialogProps: { ...state, onOpenChange: (open) => setState((s) => ({ ...s, open })) }, confirm, close, setLoading };
}
