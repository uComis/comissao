'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, X, Loader2, SquarePen, Menu, MessageSquare, PanelRight, Square, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAppData } from '@/contexts'
import { useAiChat } from './ai-chat-context'
import { getSuggestionsForRoute } from './kai-suggestions'
import { SaleConfirmationCard } from './sale-confirmation-card'
import { PaymentConfirmationCard } from './payment-confirmation-card'
import type { SalePreview, ReceivablePreviewItem } from './ai-chat-context'

const AVATAR_COLORS = [
  '#E11D48', '#9333EA', '#2563EB', '#0891B2',
  '#059669', '#D97706', '#DC2626', '#7C3AED',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const WELCOME_MESSAGES = [
  (n: string) =>
    `Oi ${n}! Sou o Kai, seu assistente no uComis. Pode me perguntar qualquer coisa — desde como cadastrar uma venda até quanto falta pra bater sua meta.`,
  (n: string) =>
    `E aí ${n}, tudo certo? Sou o Kai! Tô por dentro das suas comissões, vendas e de como tudo funciona por aqui. O que precisa?`,
  (n: string) =>
    `Oi ${n}! Aqui é o Kai. Posso te ajudar com dúvidas sobre o sistema, suas vendas, comissões ou recebíveis. Manda ver!`,
  (n: string) =>
    `Fala ${n}! Sou o Kai, e conheço bem suas pastas, vendas e recebíveis. Quer saber alguma coisa?`,
  (n: string) =>
    `Olá ${n}! Eu sou o Kai. Precisa de ajuda com alguma funcionalidade ou quer dar uma olhada nos seus números?`,
  (n: string) =>
    `Oi ${n}, aqui é o Kai! Sei tudo sobre suas comissões e como o uComis funciona. Como posso te ajudar?`,
  (n: string) =>
    `${n}, beleza? Sou o Kai! Pode perguntar sobre suas vendas, recebíveis, regras de comissão ou qualquer dúvida do sistema.`,
  (n: string) =>
    `Oi ${n}! Sou o Kai, seu parceiro de comissões. Me pergunta qualquer coisa — dos seus números até como usar cada tela.`,
  (n: string) =>
    `E aí ${n}! Kai aqui. Quer saber como anda sua meta do mês, tirar dúvida sobre uma regra, ou precisa de ajuda com alguma tela?`,
  (n: string) =>
    `Oi ${n}! Sou o Kai. Posso te mostrar seus resultados, explicar como funciona qualquer parte do sistema ou te guiar passo a passo. O que vai ser?`,
]

function getWelcomeMessage(name: string): string {
  const firstName = name.split(' ')[0]
  const idx = Math.floor(Math.random() * WELCOME_MESSAGES.length)
  return WELCOME_MESSAGES[idx](firstName)
}

export function AiChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { profile } = useAppData()
  const {
    conversationId,
    messages,
    conversations,
    isLoadingHistory,
    toggle,
    panelWidth,
    setPanelWidth,
    setConversationId,
    addMessage,
    updateMessage,
    updateToolCallStatus,
    startNewConversation,
    loadConversation,
    refreshConversations,
  } = useAiChat()

  const userName = profile?.name || 'Usuário'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || profile?.email?.[0].toUpperCase() || 'U'
  const userAvatarColor = getAvatarColor(userName)

  const welcomeText = useMemo(
    () => getWelcomeMessage(profile?.name || 'pessoal'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const pathname = usePathname()
  const suggestions = useMemo(() => getSuggestionsForRoute(pathname), [pathname])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executingToolId, setExecutingToolId] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleToolConfirm = async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId)
    if (!msg?.toolCall) return

    setExecutingToolId(messageId)
    try {
      const isPayment = msg.toolCall.name === 'register_payment'

      const body: Record<string, unknown> = {
        tool_name: msg.toolCall.name,
        conversation_id: conversationId,
      }
      if (isPayment) {
        body.receivables = msg.toolCall.receivables
      } else {
        body.preview = msg.toolCall.preview
      }

      const res = await fetch('/api/ai/tool-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (isPayment) {
        if (data.success) {
          updateToolCallStatus(messageId, 'confirmed', {
            count: data.count,
            totalAmount: data.totalAmount,
          })
        } else {
          updateToolCallStatus(messageId, 'error', undefined, data.error || 'Erro ao registrar recebimento')
        }
      } else {
        if (data.success && data.sale_id) {
          updateToolCallStatus(messageId, 'confirmed', { sale_id: data.sale_id })
          router.push(`/minhasvendas/${data.sale_id}`)
        } else {
          updateToolCallStatus(messageId, 'error', undefined, data.error || 'Erro ao criar venda')
        }
      }
    } catch {
      updateToolCallStatus(messageId, 'error', undefined, 'Erro de conexão. Tente novamente.')
    } finally {
      setExecutingToolId(null)
    }
  }

  const handleToolCancel = (messageId: string) => {
    updateToolCallStatus(messageId, 'cancelled')
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    try { localStorage.setItem('kai_has_used', '1') } catch {}

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text.trim(),
    }

    addMessage(userMessage)
    setIsLoading(true)
    setIsStreaming(false)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversation_id: conversationId,
        }),
      })

      if (!response.ok) throw new Error('Falha ao enviar mensagem')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let displayedText = ''
      let assistantMessageId: string | null = null
      let receivedToolCall = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') break
            if (!data) continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.error) throw new Error(parsed.error)

              // Handle conversation_id event (first SSE event)
              if (parsed.conversation_id) {
                setConversationId(parsed.conversation_id)
                refreshConversations()
                continue
              }

              // Handle tool_call event
              if (parsed.tool_call) {
                receivedToolCall = true

                if (parsed.tool_call.name === 'register_payment') {
                  const toolCallMsg = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant' as const,
                    content: fullText ? '' : '',
                    toolCall: {
                      name: 'register_payment' as string,
                      receivables: parsed.tool_call.receivables as ReceivablePreviewItem[],
                      status: 'pending' as const,
                    },
                  }
                  addMessage(toolCallMsg)
                } else {
                  // create_sale or other tool calls
                  const friendlyContent = fullText
                    ? ''
                    : 'Montei a venda aqui! Confirma no card abaixo ou edita no formulário ao lado.'

                  const toolCallMsg = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant' as const,
                    content: friendlyContent,
                    toolCall: {
                      name: parsed.tool_call.name as string,
                      preview: parsed.tool_call.preview as SalePreview,
                      status: 'pending' as const,
                    },
                  }
                  addMessage(toolCallMsg)

                  // Navigate to the pre-filled form
                  if (parsed.navigate) {
                    router.push(parsed.navigate)
                  }
                }

                continue
              }

              // Handle standalone navigate event (from navigate_to tool)
              if (parsed.navigate && !parsed.tool_call) {
                router.push(parsed.navigate)
              }

              if (parsed.text) {
                if (!assistantMessageId) {
                  setIsLoading(false)
                  setIsStreaming(true)

                  assistantMessageId = (Date.now() + 1).toString()
                  addMessage({
                    id: assistantMessageId,
                    role: 'assistant',
                    content: '',
                  })
                }

                const newText = parsed.text
                fullText += newText

                // Render chunks — 3 chars per tick for smooth fast typing
                const CHARS_PER_TICK = 3
                for (let i = 0; i < newText.length; i += CHARS_PER_TICK) {
                  displayedText += newText.slice(i, i + CHARS_PER_TICK)
                  updateMessage(assistantMessageId, displayedText)
                  await new Promise((resolve) => setTimeout(resolve, 2))
                }
              }
            } catch (parseError) {
              console.warn('Parse error:', parseError)
            }
          }
        }
      }

      // Allow empty text responses when there was a tool call
      if (!assistantMessageId && !displayedText && !receivedToolCall) {
        throw new Error('Resposta vazia do servidor')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  const showWelcome = messages.length === 0 && !isLoadingHistory

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header — Gemini-style: [Menu] [Icon] [Kai] ... [Size ▾] [X] */}
      <div className="flex items-center gap-2 px-4 py-4">
        {/* Conversations menu */}
        <DropdownMenu onOpenChange={(open) => { if (open) refreshConversations() }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Conversas">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
            <DropdownMenuItem onClick={() => { startNewConversation(); if (!open) toggle() }}>
              <SquarePen className="h-4 w-4 mr-2" />
              Nova conversa
            </DropdownMenuItem>
            {conversations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Recentes
                </DropdownMenuLabel>
                {conversations.map((conv) => (
                  <DropdownMenuItem
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      'cursor-pointer',
                      conv.id === conversationId && 'bg-accent'
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs">{conv.title}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Kai name */}
        <span className="font-semibold text-sm select-none">Kai</span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* New conversation — visible button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={startNewConversation}
          className="h-8 w-8 shrink-0"
          title="Nova conversa"
        >
          <SquarePen className="h-4 w-4" />
        </Button>

        {/* Panel size toggle (desktop only) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-0.5 px-1.5 shrink-0 hidden md:inline-flex"
              title="Tamanho do painel"
            >
              {panelWidth === 'wide'
                ? <Square className="h-4 w-4" />
                : <PanelRight className="h-4 w-4" />
              }
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setPanelWidth('normal')} className="cursor-pointer">
              <PanelRight className="h-4 w-4 mr-2" />
              Lateral
              {panelWidth === 'normal' && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPanelWidth('wide')} className="cursor-pointer">
              <Square className="h-4 w-4 mr-2" />
              Larga
              {panelWidth === 'wide' && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-9 w-9 shrink-0"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden pt-2 relative">
          {/* Dot pattern decoration — only in messages area */}
          <div className="absolute inset-0 pointer-events-none select-none bg-[radial-gradient(#00000030_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff38_1px,transparent_1px)] [background-size:16px_16px]" />
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {/* Loading history skeleton */}
              {isLoadingHistory && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              {/* Welcome message (static, when no messages) */}
              {showWelcome && (
                <>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted">
                      <div className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-1">
                        <ReactMarkdown>{welcomeText}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  {/* Route-aware suggestions */}
                  <div
                    key={pathname}
                    className="flex flex-col items-center gap-2 pt-4 animate-in fade-in duration-200"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={s.label}
                        onClick={() => sendMessage(s.prompt)}
                        disabled={isLoading}
                        style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'both' }}
                        className="w-full max-w-xs flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors disabled:opacity-50 animate-in fade-in slide-in-from-bottom-1 duration-200"
                      >
                        <s.icon className="h-4 w-4 shrink-0 text-primary" />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  {/* Avatar */}
                  {message.role === 'assistant' ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                      <AvatarFallback
                        className="text-white font-semibold text-xs"
                        style={{ backgroundColor: userAvatarColor }}
                      >
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}

                       {/* Message Bubble */}
                       <div
                         className={cn(
                           'max-w-[80%]',
                           message.role === 'assistant'
                             ? ''
                             : 'rounded-lg px-4 py-2 bg-primary text-primary-foreground'
                         )}
                       >
                         {message.role === 'assistant' ? (
                           <>
                             {/* Text content */}
                             {message.content && (
                               <div className="rounded-lg px-4 py-2 bg-muted">
                                 <div className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-sm prose-strong:text-foreground">
                                   <ReactMarkdown>{message.content}</ReactMarkdown>
                                   {isStreaming && message.id === messages[messages.length - 1]?.id && (
                                     <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse align-text-bottom" />
                                   )}
                                 </div>
                               </div>
                             )}

                             {/* Tool call card */}
                             {message.toolCall && message.toolCall.name === 'register_payment' && (
                               <div className={message.content ? 'mt-2' : ''}>
                                 <PaymentConfirmationCard
                                   toolCall={message.toolCall}
                                   isExecuting={executingToolId === message.id}
                                   onConfirm={() => handleToolConfirm(message.id)}
                                   onCancel={() => handleToolCancel(message.id)}
                                 />
                               </div>
                             )}
                             {message.toolCall && message.toolCall.name !== 'register_payment' && (
                               <div className={message.content ? 'mt-2' : ''}>
                                 <SaleConfirmationCard
                                   toolCall={message.toolCall}
                                   isExecuting={executingToolId === message.id}
                                   onConfirm={() => handleToolConfirm(message.id)}
                                   onCancel={() => handleToolCancel(message.id)}
                                 />
                               </div>
                             )}
                           </>
                         ) : (
                           <p className="text-sm whitespace-pre-wrap">
                             {message.content}
                           </p>
                         )}
                       </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Auto-scroll anchor */}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="border-t p-4 bg-muted/30">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input?.trim() || isLoading || isStreaming}
              className="shrink-0"
            >
              {isLoading || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Pressione Enter para enviar
          </p>
        </div>
    </div>
  )
}
