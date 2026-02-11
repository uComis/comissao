'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, X, Loader2, SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAppData } from '@/contexts'
import { useAiChat } from './ai-chat-context'

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

interface AiChatWindowProps {
  onClose: () => void
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

export function AiChatWindow({ onClose }: AiChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { profile } = useAppData()
  const {
    conversationId,
    messages,
    isLoadingHistory,
    setConversationId,
    addMessage,
    updateMessage,
    startNewConversation,
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

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
    }

    addMessage(userMessage)
    setInput('')
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
                continue
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

                for (let i = 0; i < newText.length; i++) {
                  await new Promise((resolve) => setTimeout(resolve, 8))
                  displayedText += newText[i]
                  updateMessage(assistantMessageId, displayedText)
                }
              }
            } catch (parseError) {
              console.warn('Parse error:', parseError)
            }
          }
        }
      }

      if (!assistantMessageId || !displayedText) {
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

  const showWelcome = messages.length === 0 && !isLoadingHistory

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Chat Window */}
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-background border shadow-2xl',
          'inset-0 md:inset-auto',
          'md:bottom-6 md:right-6 md:h-[50vh] md:min-h-[500px] md:max-h-[700px] md:w-[480px] md:rounded-xl',
          'animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 fade-in duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-sm">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Kai</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewConversation}
              className="h-8 w-8 rounded-full hover:bg-muted"
              title="Nova conversa"
            >
              <SquarePen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
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
                           'rounded-lg px-4 py-2 max-w-[80%]',
                           message.role === 'assistant'
                             ? 'bg-muted'
                             : 'bg-primary text-primary-foreground'
                         )}
                       >
                         {message.role === 'assistant' ? (
                           <div className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-sm prose-strong:text-foreground">
                             <ReactMarkdown>{message.content}</ReactMarkdown>
                             {isStreaming && message.id === messages[messages.length - 1]?.id && (
                               <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse align-text-bottom" />
                             )}
                           </div>
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
    </>
  )
}
