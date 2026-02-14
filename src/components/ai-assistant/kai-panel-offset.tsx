'use client'

import { useEffect, useRef } from 'react'

/**
 * Wraps the desktop sticky header and measures its height via ResizeObserver.
 * Sets CSS variable --kai-panel-top on <html> so the KaiPanel can align
 * its top edge with the bottom of the header, not overlapping it.
 */
export function KaiPanelOffset({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      document.documentElement.style.setProperty(
        '--kai-panel-top',
        `${el.offsetHeight}px`
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)

    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--kai-panel-top')
    }
  }, [])

  return (
    <div
      ref={ref}
      className="sticky top-0 z-30 w-full bg-background hidden md:block pointer-events-none"
    >
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>
  )
}
