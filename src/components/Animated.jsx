/**
 * Animated components for dynamic UI effects
 * Numbers, text reveals, transitions
 */
import { useState, useEffect, useRef } from 'react'

/**
 * AnimatedNumber - Smooth counting animation
 */
export function AnimatedNumber({ 
  value, 
  duration = 1000, 
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef(0)
  const animationRef = useRef(null)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = Number(value)
    const startTime = performance.now()
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const current = startValue + (endValue - startValue) * eased
      setDisplayValue(current)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        previousValue.current = endValue
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  const formatted = displayValue.toFixed(decimals)
  
  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

/**
 * CountUp - Simple count up component
 */
export function CountUp({ 
  end, 
  start = 0,
  duration = 2000,
  delay = 0,
  separator = ',',
  className = ''
}) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      const startTime = performance.now()
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.floor(start + (end - start) * eased)
        
        setCount(current)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timer)
  }, [end, start, duration, delay])

  const formatted = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)

  return (
    <span className={`tabular-nums ${isAnimating ? 'animate-count-up' : ''} ${className}`}>
      {formatted}
    </span>
  )
}

/**
 * AnimatedPresence - Animate items entering/leaving
 */
/* eslint-disable react-hooks/rules-of-hooks */
export function AnimatedPresence({ 
  children, 
  show = true,
  animation = 'fade',
  duration = 300,
  className = ''
}) {
  const [shouldRender, setShouldRender] = useState(show)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      // Use setTimeout instead of requestAnimationFrame to avoid state sync issues
      const timer = setTimeout(() => setIsAnimating(true), 0)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!shouldRender) return null

  const animations = {
    fade: {
      enter: 'opacity-100',
      exit: 'opacity-0',
      base: 'transition-opacity',
    },
    scale: {
      enter: 'opacity-100 scale-100',
      exit: 'opacity-0 scale-95',
      base: 'transition-all',
    },
    slideUp: {
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 translate-y-4',
      base: 'transition-all',
    },
    slideDown: {
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 -translate-y-4',
      base: 'transition-all',
    },
  }

  const anim = animations[animation]

  return (
    <div 
      className={`
        ${anim.base} 
        ${isAnimating ? anim.enter : anim.exit}
        ${className}
      `}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * TypeWriter - Text typing animation
 */
export function TypeWriter({ 
  text, 
  speed = 50, 
  delay = 0,
  cursor = true,
  className = ''
}) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    setDisplayText('')
    setIsTyping(false)
    
    const startTimer = setTimeout(() => {
      setIsTyping(true)
      let index = 0
      
      const typeInterval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1))
          index++
        } else {
          clearInterval(typeInterval)
          setIsTyping(false)
        }
      }, speed)
      
      return () => clearInterval(typeInterval)
    }, delay)

    return () => clearTimeout(startTimer)
  }, [text, speed, delay])

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <span className={`${isTyping ? 'animate-pulse' : ''}`}>|</span>
      )}
    </span>
  )
}

/**
 * Stagger animation wrapper for lists
 */
export function StaggeredList({ 
  children, 
  staggerDelay = 100,
  animation = 'slideUp',
  className = ''
}) {
  const animations = {
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    fadeIn: 'animate-fade-in',
    pop: 'animate-pop',
  }

  return (
    <div className={className}>
      {Array.isArray(children) ? children.map((child, index) => (
        <div
          key={index}
          className={animations[animation]}
          style={{ 
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'backwards'
          }}
        >
          {child}
        </div>
      )) : children}
    </div>
  )
}

/* eslint-disable react-refresh/only-export-components */

/**
 * Hook for intersection observer animations
 */
export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (!options.repeat) {
            setHasAnimated(true)
          }
        } else if (options.repeat) {
          setIsInView(false)
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px',
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin, options.repeat])

  return { ref, isInView: isInView || hasAnimated }
}

/**
 * AnimateOnScroll - Animate element when it comes into view
 */
export function AnimateOnScroll({ 
  children, 
  animation = 'fadeIn',
  threshold = 0.1,
  className = ''
}) {
  const { ref, isInView } = useInView({ threshold })

  const animations = {
    fadeIn: 'opacity-0 transition-opacity duration-700',
    slideUp: 'opacity-0 translate-y-8 transition-all duration-700',
    slideLeft: 'opacity-0 translate-x-8 transition-all duration-700',
    scale: 'opacity-0 scale-95 transition-all duration-700',
  }

  return (
    <div
      ref={ref}
      className={`
        ${animations[animation]}
        ${isInView ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

/**
 * Pulse indicator for real-time updates
 */
export function PulseIndicator({ 
  active = true, 
  color = 'green',
  size = 'md',
  className = ''
}) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const colors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
  }

  if (!active) return null

  return (
    <span className={`relative flex ${sizes[size]} ${className}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${sizes[size]} ${colors[color]}`} />
    </span>
  )
}

export default AnimatedNumber
