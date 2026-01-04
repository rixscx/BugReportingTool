/**
 * Motion Utilities - Framer Motion animation variants and components
 * Inspired by developerfolio.js.org and adeolaadeoti.site
 * 
 * Keep animations SUBTLE and PROFESSIONAL - not overboard
 */

import { motion, AnimatePresence } from 'framer-motion'

// ==================== ANIMATION VARIANTS ====================

// Fade in from bottom (subtle)
export const fadeInUp = {
    hidden: {
        opacity: 0,
        y: 20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1] // Smooth ease-out
        }
    }
}

// Fade in only
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' }
    }
}

// Scale in (for cards)
export const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3, ease: 'easeOut' }
    }
}

// Stagger container for children
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
}

// Page transition variants
export const pageTransition = {
    initial: { opacity: 0, y: 8 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15 }
    }
}

// Slide in from left (for timeline items)
export const slideInLeft = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
    }
}

// ==================== MOTION COMPONENTS ====================

// Page wrapper with enter/exit animations
export function PageWrapper({ children, className = '' }) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Stagger container for lists
export function StaggerContainer({ children, className = '', delay = 0 }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                ...staggerContainer,
                visible: {
                    ...staggerContainer.visible,
                    transition: {
                        ...staggerContainer.visible.transition,
                        delayChildren: delay
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Individual stagger item
export function StaggerItem({ children, className = '' }) {
    return (
        <motion.div variants={fadeInUp} className={className}>
            {children}
        </motion.div>
    )
}

// Fade in on scroll (viewport trigger)
export function FadeInView({ children, className = '', delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Hover scale effect for cards
export function HoverCard({ children, className = '', scale = 1.02 }) {
    return (
        <motion.div
            whileHover={{
                scale,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ==================== HOOKS ====================

// Custom hook for stagger delays
export function useStaggerDelay(index, baseDelay = 0.05) {
    return {
        initial: { opacity: 0, y: 12 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                delay: index * baseDelay,
                duration: 0.3,
                ease: 'easeOut'
            }
        }
    }
}

// Re-export AnimatePresence for route transitions
export { motion, AnimatePresence }
