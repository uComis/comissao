'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { AiChatWindow } from './ai-chat-window'

type AiChatContextValue = {
  isOpen: boolean
  toggle: () => void
}

const AiChatContext = createContext<AiChatContextValue | null>(null)

export function useAiChat() {
  const ctx = useContext(AiChatContext)
  if (!ctx) throw new Error('useAiChat must be inside AiChatProvider')
  return ctx
}

export function AiChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(prev => !prev)

  return (
    <AiChatContext.Provider value={{ isOpen, toggle }}>
      {children}
      {isOpen && <AiChatWindow onClose={() => setIsOpen(false)} />}
    </AiChatContext.Provider>
  )
}
