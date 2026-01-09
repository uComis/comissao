'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AiChatWindowProps {
  onClose: () => void
}

export function AiChatWindow({ onClose }: AiChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Sou seu assistente de comissões. Como posso ajudar você hoje?',
    },
  ])
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsStreaming(false)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Read the stream
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
            
            if (data === '[DONE]') {
              break
            }

            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.error) {
                throw new Error(parsed.error)
              }

              if (parsed.text) {
                // On first chunk, remove loading and create message
                if (!assistantMessageId) {
                  setIsLoading(false)
                  setIsStreaming(true)
                  
                  assistantMessageId = (Date.now() + 1).toString()
                  const initialMessage: Message = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: '',
                  }
                  setMessages((prev) => [...prev, initialMessage])
                }
                
                // Add new characters from this chunk
                const newText = parsed.text
                fullText += newText
                
                // Type out each character quickly and uniformly
                for (let i = 0; i < newText.length; i++) {
                  await new Promise((resolve) => setTimeout(resolve, 8)) // 8ms per character (metade do tempo)
                  displayedText += newText[i]
                  
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: displayedText } : msg
                    )
                  )
                }
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete chunks
              console.warn('Parse error:', parseError)
            }
          }
        }
      }

      // If no message was created (empty response), show error
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
          // Mobile: Full screen
          'inset-0 md:inset-auto',
          // Desktop: Bottom-right panel - Aumentado!
          'md:bottom-6 md:right-6 md:h-[50vh] md:min-h-[500px] md:max-h-[700px] md:w-[480px] md:rounded-xl',
          // Animações
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
              <h3 className="font-semibold text-base">Assistente AI</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      message.role === 'assistant'
                        ? 'bg-primary'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>

                       {/* Message Bubble */}
                       <div
                         className={cn(
                           'rounded-lg px-4 py-2 max-w-[80%]',
                           message.role === 'assistant'
                             ? 'bg-muted'
                             : 'bg-primary text-primary-foreground'
                         )}
                       >
                         <p className="text-sm whitespace-pre-wrap">
                           {message.content}
                           {/* Typing cursor for streaming messages */}
                           {isStreaming && message.role === 'assistant' && message.id === messages[messages.length - 1]?.id && (
                             <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                           )}
                         </p>
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
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </>
  )
}
