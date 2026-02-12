'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AiChatWindow } from './ai-chat-window'

export type SalePreview = {
  supplier_id: string
  supplier_name: string
  client_id: string
  client_name: string
  sale_date: string
  gross_value: number
  tax_rate: number
  net_value: number
  commission_rate: number
  commission_value: number
  payment_condition: string | null
  notes: string | null
}

export type ToolCallData = {
  name: string
  preview: SalePreview
  status: 'pending' | 'confirmed' | 'cancelled' | 'error'
  result?: { sale_id: string }
  error?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCall?: ToolCallData
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
  updateToolCallStatus: (
    messageId: string,
    status: ToolCallData['status'],
    result?: { sale_id: string },
    error?: string
  ) => void
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

// Parse persisted messages with [TOOL_CALL:...] and [TOOL_RESULT:...] prefixes
function parsePersistedMessages(
  dbMessages: { id: string; role: 'user' | 'assistant'; content: string }[]
): Message[] {
  const messages: Message[] = []
  // Track tool results to update tool call statuses
  const toolResults = new Map<string, { success: boolean; sale_id?: string; error?: string }>()

  // First pass: collect tool results
  for (const m of dbMessages) {
    const resultMatch = m.content.match(/^\[TOOL_RESULT:(\w+)\](.+)$/)
    if (resultMatch) {
      try {
        const data = JSON.parse(resultMatch[2])
        toolResults.set(resultMatch[1], data)
      } catch { /* ignore parse errors */ }
    }
  }

  // Second pass: build messages
  for (const m of dbMessages) {
    const toolCallMatch = m.content.match(/^\[TOOL_CALL:(\w+)\](.+)$/)
    const resultMatch = m.content.match(/^\[TOOL_RESULT:(\w+)\]/)

    if (toolCallMatch) {
      try {
        const toolName = toolCallMatch[1]
        const preview = JSON.parse(toolCallMatch[2]) as SalePreview
        const result = toolResults.get(toolName)

        messages.push({
          id: m.id,
          role: m.role,
          content: '',
          toolCall: {
            name: toolName,
            preview,
            status: result?.success ? 'confirmed' : result ? 'error' : 'pending',
            result: result?.sale_id ? { sale_id: result.sale_id } : undefined,
            error: result?.error,
          },
        })
      } catch {
        messages.push({ id: m.id, role: m.role, content: m.content })
      }
    } else if (resultMatch) {
      // Skip standalone tool result messages — already merged into tool call
      continue
    } else {
      messages.push({ id: m.id, role: m.role, content: m.content })
    }
  }

  return messages
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

  const updateToolCallStatus = useCallback(
    (
      messageId: string,
      status: ToolCallData['status'],
      result?: { sale_id: string },
      error?: string
    ) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id !== messageId || !msg.toolCall) return msg
          return {
            ...msg,
            toolCall: { ...msg.toolCall, status, result, error },
          }
        })
      )
    },
    []
  )

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
        setMessages(parsePersistedMessages(dbMessages))
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
          setMessages(parsePersistedMessages(dbMessages))
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
        updateToolCallStatus,
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
