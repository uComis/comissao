'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

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

export type ReceivablePreviewItem = {
  personal_sale_id: string
  sale_number: number | null
  installment_number: number
  total_installments: number
  client_name: string | null
  supplier_name: string | null
  due_date: string
  expected_commission: number
  status: 'pending' | 'overdue'
}

export type ToolCallData = {
  name: string
  preview?: SalePreview
  receivables?: ReceivablePreviewItem[]
  status: 'pending' | 'confirmed' | 'cancelled' | 'error'
  result?: { sale_id?: string; count?: number; totalAmount?: number }
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
    result?: ToolCallData['result'],
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolResults = new Map<string, Record<string, any>>()

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
        const payload = JSON.parse(toolCallMatch[2])
        const result = toolResults.get(toolName)

        if (toolName === 'register_payment') {
          messages.push({
            id: m.id,
            role: m.role,
            content: '',
            toolCall: {
              name: toolName,
              receivables: payload as ReceivablePreviewItem[],
              status: result?.success ? 'confirmed' : result ? 'error' : 'pending',
              result: result?.count !== undefined ? { count: result.count, totalAmount: result.totalAmount } : undefined,
              error: result?.error,
            },
          })
        } else {
          messages.push({
            id: m.id,
            role: m.role,
            content: '',
            toolCall: {
              name: toolName,
              preview: payload as SalePreview,
              status: result?.success ? 'confirmed' : result ? 'error' : 'pending',
              result: result?.sale_id ? { sale_id: result.sale_id } : undefined,
              error: result?.error,
            },
          })
        }
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
      result?: ToolCallData['result'],
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

  // Ctrl+K / Cmd+K to toggle Kai
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
    </AiChatContext.Provider>
  )
}
