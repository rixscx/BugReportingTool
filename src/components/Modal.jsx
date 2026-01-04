import { useEffect, useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Modal({
    isOpen,
    onClose,
    children,
    className = '',
    size = 'md',
    showCloseButton = true,
    closeOnEsc = true,
    closeOnOutsideClick = true,
}) {
    const modalRef = useRef(null)
    const previousActiveElement = useRef(null)

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-[90vw] max-h-[90vh]',
    }

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement
            document.body.style.overflow = 'hidden'
            setTimeout(() => modalRef.current?.focus(), 50)
        } else {
            document.body.style.overflow = ''
            previousActiveElement.current?.focus?.()
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen || !closeOnEsc) return
        const handleKeyDown = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeOnEsc, onClose])

    const handleBackdropClick = useCallback((e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) onClose()
    }, [closeOnOutsideClick, onClose])

    const handleModalClick = useCallback((e) => { e.stopPropagation() }, [])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleBackdropClick}
                >
                    {/* Backdrop with frosted glass effect */}
                    <motion.div
                        className="absolute inset-0 bg-[#06060a]/70 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Ambient glow behind modal */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <div className="w-96 h-96 bg-gradient-to-br from-[rgba(99,102,241,0.15)] to-[rgba(139,92,246,0.1)] rounded-full blur-3xl" />
                    </motion.div>

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        tabIndex={-1}
                        className={`
                            relative w-full ${sizeClasses[size]} 
                            bg-gradient-to-b from-[#0f0f15] to-[#0a0a0f]
                            rounded-3xl 
                            border border-[rgba(255,255,255,0.08)] 
                            shadow-[0_32px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]
                            overflow-hidden
                            ${className}
                        `}
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        onClick={handleModalClick}
                    >
                        {/* Gradient accent line at top */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent opacity-60" />
                        
                        {/* Inner glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent pointer-events-none" />
                        
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.06)] rounded-xl transition-all duration-200 z-10"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export function ModalHeader({ children, className = '' }) {
    return (
        <div className={`px-6 py-5 border-b border-[rgba(255,255,255,0.06)] ${className}`}>
            {children}
        </div>
    )
}

export function ModalBody({ children, className = '' }) {
    return <div className={`px-6 py-6 ${className}`}>{children}</div>
}

export function ModalFooter({ children, className = '' }) {
    return (
        <div className={`px-6 py-5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-3 bg-[rgba(255,255,255,0.02)] ${className}`}>
            {children}
        </div>
    )
}

export function useModal(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState)
    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggle = useCallback(() => setIsOpen(prev => !prev), [])
    return { isOpen, open, close, toggle }
}

export default Modal
