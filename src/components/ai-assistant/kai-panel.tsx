'use client'

import { useAiChat } from './ai-chat-context'
import { AiChatWindow } from './ai-chat-window'
import { cn } from '@/lib/utils'

const PANEL_WIDTHS = { normal: 480, wide: 680 } as const

export function KaiPanel() {
  const { isOpen, toggle, panelWidth } = useAiChat()
  const widthPx = PANEL_WIDTHS[panelWidth]

  return (
    <>
      {/* Desktop: fixed right panel — aligned below header via --kai-panel-top */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed right-0 bottom-0 z-40 overflow-hidden bg-background transition-[width] duration-300 ease-in-out',
          isOpen ? 'border-l border-t rounded-tl-xl shadow-lg' : 'w-0'
        )}
        style={{
          width: isOpen ? widthPx : 0,
          top: 'var(--kai-panel-top, 0px)',
        }}
      >
        <div className="h-full flex flex-col" style={{ minWidth: widthPx }}>
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
