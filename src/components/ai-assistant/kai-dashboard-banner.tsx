'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiChat } from './ai-chat-context'
import { useKaiOnboarding } from '@/hooks/use-kai-onboarding'

export function KaiDashboardBanner() {
  const { toggle } = useAiChat()
  const { shouldShowDashboardBanner } = useKaiOnboarding()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!shouldShowDashboardBanner) return
    requestAnimationFrame(() => setMounted(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!shouldShowDashboardBanner) return null

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: mounted ? '100px' : '0',
        opacity: mounted ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-xs text-muted-foreground">
          Experimente o Kai — ele registra vendas, tira dúvidas e mostra seus números.
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={toggle}>
          <Sparkles className="mr-1.5 h-3 w-3" />
          Abrir o Kai
        </Button>
      </div>
    </div>
  )
}
