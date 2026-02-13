'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiChat } from './ai-chat-context'
import { useKaiOnboarding } from '@/hooks/use-kai-onboarding'

const ANIMATION_MS = 300

export function KaiDashboardCard() {
  const { toggle } = useAiChat()
  const { shouldShowDashboardCard, markDashboardCardSeen } = useKaiOnboarding()

  const [shouldRender, setShouldRender] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!shouldShowDashboardCard) return
    setShouldRender(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animateOut = (cb?: () => void) => {
    setIsClosing(true)
    setIsVisible(false)
    setTimeout(() => {
      setShouldRender(false)
      cb?.()
    }, ANIMATION_MS)
  }

  const handleDismiss = () => {
    animateOut(() => markDashboardCardSeen())
  }

  const handleCta = () => {
    animateOut(() => {
      markDashboardCardSeen()
      toggle()
    })
  }

  if (!shouldRender) return null

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: isVisible && !isClosing ? '200px' : '0',
        opacity: isVisible && !isClosing ? 1 : 0,
      }}
    >
      <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-4">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-snug">
              O Kai pode registrar vendas por você
            </p>
            <p className="text-xs text-muted-foreground">
              Diga algo como &quot;registrar uma venda de R$ 500 para o cliente
              João&quot;
            </p>
            <Button size="sm" className="mt-2 h-7 text-xs" onClick={handleCta}>
              <Sparkles className="mr-1.5 h-3 w-3" />
              Experimentar o Kai
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
