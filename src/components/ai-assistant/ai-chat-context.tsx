'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AiChatWindow } from './ai-chat-window'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export type ConversationSummary = {
  id: string
  title: string
  updated_at: string
}

type AiChatContextValue = {
  isOpen: boolean
  toggle: () => void
  conversationId: string | null
  messages: Message[]
  conversations: ConversationSummary[]
  isLoadingHistory: boolean
  setConversationId: (id: string | null) => void
  addMessage: (msg: Message) => void
  updateMessage: (id: string, content: string) => void
  startNewConversation: () => void
  loadConversation: (id: string) => Promise<void>
  refreshConversations: () => Promise<void>
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
  const [conversations, setConversations] = useState<ConversationSummary[]>([])

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
    setHasLoadedInitial(true)
  }, [])

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/conversations?limit=10')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setConversations(data)
    } catch (err) {
      console.error('Failed to refresh conversations:', err)
    }
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    setConversationId(id)
    setIsLoadingHistory(true)
    setIsOpen(true)
    try {
      const res = await fetch(`/api/ai/conversations/${id}/messages`)
      if (!res.ok) return
      const dbMessages = await res.json()
      if (dbMessages?.length) {
        setMessages(
          dbMessages.map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        )
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Load last conversation on first open + refresh sidebar list
  useEffect(() => {
    if (!isOpen || hasLoadedInitial) return
    setHasLoadedInitial(true)

    async function loadLastConversation() {
      setIsLoadingHistory(true)
      try {
        const res = await fetch('/api/ai/conversations?limit=1')
        if (!res.ok) return

        const convs = await res.json()
        if (!convs?.length) return

        const lastConv = convs[0]
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
    refreshConversations()
  }, [isOpen, hasLoadedInitial, refreshConversations])

  return (
    <AiChatContext.Provider
      value={{
        isOpen,
        toggle,
        conversationId,
        messages,
        conversations,
        isLoadingHistory,
        setConversationId,
        addMessage,
        updateMessage,
        startNewConversation,
        loadConversation,
        refreshConversations,
      }}
    >
      {children}
      {isOpen && <AiChatWindow onClose={() => setIsOpen(false)} />}
    </AiChatContext.Provider>
  )
}
