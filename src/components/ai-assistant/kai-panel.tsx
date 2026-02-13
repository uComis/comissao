'use client'

import { useAiChat } from './ai-chat-context'
import { AiChatWindow } from './ai-chat-window'
import { cn } from '@/lib/utils'

export function KaiPanel() {
  const { isOpen, toggle } = useAiChat()

  return (
    <>
      {/* Desktop: flex child that pushes content */}
      <aside
        className={cn(
          'hidden md:block flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out',
          isOpen ? 'w-[480px] border-l' : 'w-0 border-l-0'
        )}
      >
        <div className="h-full min-w-[480px]">
          <AiChatWindow />
        </div>
      </aside>

      {/* Mobile: fullscreen overlay */}
      {isOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/20 animate-in fade-in duration-200"
            onClick={toggle}
          />
          <div className="fixed inset-0 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <AiChatWindow />
          </div>
        </div>
      )}
    </>
  )
}
