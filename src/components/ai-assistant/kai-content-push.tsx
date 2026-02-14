'use client'

import { useAiChat } from './ai-chat-context'
import { cn } from '@/lib/utils'

/**
 * Client wrapper for <main> that adds margin-right on desktop only
 * when the Kai panel is open, so only content is pushed (not the header).
 * On mobile, the panel is a fullscreen overlay so no margin is needed.
 */
export function KaiContentPush({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isOpen, panelWidth } = useAiChat()

  return (
    <main
      className={cn(
        'md:transition-[margin] md:duration-300 md:ease-in-out',
        isOpen && (panelWidth === 'wide' ? 'md:mr-[680px]' : 'md:mr-[480px]'),
        className
      )}
    >
      {children}
    </main>
  )
}
