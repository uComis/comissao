'use client'

import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type AnimationVariant = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  variant?: AnimationVariant
  delay?: number // em ms
  duration?: number // em ms
  threshold?: number
  as?: keyof JSX.IntrinsicElements
}

const variantStyles: Record<AnimationVariant, { hidden: string; visible: string }> = {
  fade: {
    hidden: 'opacity-0',
    visible: 'opacity-100'
  },
  'slide-up': {
    hidden: 'opacity-0 translate-y-8',
    visible: 'opacity-100 translate-y-0'
  },
  'slide-down': {
    hidden: 'opacity-0 -translate-y-8',
    visible: 'opacity-100 translate-y-0'
  },
  'slide-left': {
    hidden: 'opacity-0 translate-x-8',
    visible: 'opacity-100 translate-x-0'
  },
  'slide-right': {
    hidden: 'opacity-0 -translate-x-8',
    visible: 'opacity-100 translate-x-0'
  },
  scale: {
    hidden: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100'
  }
}

export function ScrollReveal({
  children,
  className,
  variant = 'slide-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  as: Component = 'div'
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal({ threshold })
  const styles = variantStyles[variant]

  return (
    <Component
      ref={ref as any}
      className={cn(
        'transition-all ease-out',
        isVisible ? styles.visible : styles.hidden,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </Component>
  )
}

// Componente para animar múltiplos filhos com stagger
interface ScrollRevealGroupProps {
  children: ReactNode[]
  className?: string
  variant?: AnimationVariant
  staggerDelay?: number // delay entre cada filho em ms
  duration?: number
  threshold?: number
}

export function ScrollRevealGroup({
  children,
  className,
  variant = 'slide-up',
  staggerDelay = 100,
  duration = 600,
  threshold = 0.1
}: ScrollRevealGroupProps) {
  const { ref, isVisible } = useScrollReveal({ threshold })
  const styles = variantStyles[variant]

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all ease-out',
            isVisible ? styles.visible : styles.hidden
          )}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: `${index * staggerDelay}ms`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
