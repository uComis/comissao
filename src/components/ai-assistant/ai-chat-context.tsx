'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AiChatWindow } from './ai-chat-window'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type AiChatContextValue = {
  isOpen: boolean
  toggle: () => void
  conversationId: string | null
  messages: Message[]
  isLoadingHistory: boolean
  setConversationId: (id: string | null) => void
  addMessage: (msg: Message) => void
  updateMessage: (id: string, content: string) => void
  startNewConversation: () => void
}

const AiChatContext = createContext<AiChatContextValue | null>(null)

export function useAiChat() {
  const ctx = useContext(AiChatContext)
  if (!ctx) throw new Error('useAiChat must be inside AiChatProvider')
  return ctx
}

export function AiChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)

  const toggle = () => setIsOpen(prev => !prev)

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages(prev =>
      prev.map(msg => msg.id === id ? { ...msg, content } : msg)
    )
  }, [])

  const startNewConversation = useCallback(() => {
    setConversationId(null)
    setMessages([])
  }, [])

  // Load last conversation on first open
  useEffect(() => {
    if (!isOpen || hasLoadedInitial) return
    setHasLoadedInitial(true)

    async function loadLastConversation() {
      setIsLoadingHistory(true)
      try {
        const res = await fetch('/api/ai/conversations?limit=1')
        if (!res.ok) return

        const conversations = await res.json()
        if (!conversations?.length) return

        const lastConv = conversations[0]
        setConversationId(lastConv.id)

        const msgsRes = await fetch(`/api/ai/conversations/${lastConv.id}/messages`)
        if (!msgsRes.ok) return

        const dbMessages = await msgsRes.json()
        if (dbMessages?.length) {
          setMessages(
            dbMessages.map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            }))
          )
        }
      } catch (err) {
        console.error('Failed to load last conversation:', err)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadLastConversation()
  }, [isOpen, hasLoadedInitial])

  return (
    <AiChatContext.Provider
      value={{
        isOpen,
        toggle,
        conversationId,
        messages,
        isLoadingHistory,
        setConversationId,
        addMessage,
        updateMessage,
        startNewConversation,
      }}
    >
      {children}
      {isOpen && <AiChatWindow onClose={() => setIsOpen(false)} />}
    </AiChatContext.Provider>
  )
}
