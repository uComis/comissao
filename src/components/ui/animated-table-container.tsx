'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedTableContainerProps {
  /** Key that triggers fade transition (e.g. page number) */
  transitionKey: string | number
  /** Minimum height to prevent pagination from jumping (e.g. pageSize * rowHeight + headerHeight) */
  minHeight?: number
  children: React.ReactNode
}

export function AnimatedTableContainer({
  transitionKey,
  minHeight,
  children,
}: AnimatedTableContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  const measureHeight = useCallback(() => {
    if (contentRef.current) {
      const measured = contentRef.current.offsetHeight
      setHeight(minHeight ? Math.max(measured, minHeight) : measured)
    }
  }, [minHeight])

  return (
    <motion.div
      animate={{ height }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      onAnimationComplete={() => setHeight('auto')}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          ref={contentRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onAnimationStart={measureHeight}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
