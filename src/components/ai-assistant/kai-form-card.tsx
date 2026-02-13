'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiChat } from './ai-chat-context'

type Props = {
  description?: string
}

export function KaiFormCard({ description }: Props) {
  const { isOpen, toggle } = useAiChat()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Card visible when mounted AND Kai panel is closed
  const visible = mounted && !isOpen

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out mb-3"
      style={{
        maxHeight: visible ? '100px' : '0',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-xs text-muted-foreground">
          {description ?? 'Faça com o Kai — ele preenche para você!'}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs shrink-0"
          onClick={toggle}
        >
          <Sparkles className="mr-1.5 h-3 w-3" />
          Chamar o Kai
        </Button>
      </div>
    </div>
  )
}
