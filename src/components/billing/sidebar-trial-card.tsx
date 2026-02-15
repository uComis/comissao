'use client'

import { useCurrentUser } from '@/contexts/current-user-context'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

function getBarColor(daysRemaining: number): string {
  if (daysRemaining <= 2) return 'bg-orange-500'
  if (daysRemaining <= 5) return 'bg-amber-500'
  return 'bg-primary'
}

export function SidebarTrialCard() {
  const { currentUser } = useCurrentUser()

  if (!currentUser?.billing) return null

  const { billing } = currentUser
  const isInTrial = billing.isInTrial
  const isPaidUp = billing.isPaidUp
  const daysRemaining = billing.trial?.daysRemaining ?? 0
  const totalTrialDays = 14

  // Pago ou trial expirado: não mostra nada
  if (!isInTrial) return null
  if (isPaidUp && !isInTrial) return null

  // Trial ativo → card com barra de progresso
  const progress = ((totalTrialDays - daysRemaining) / totalTrialDays) * 100
  const barColor = getBarColor(daysRemaining)

  return (
    <div className="mx-2 mb-[clamp(0.5rem,1vh,1rem)]">
      <Link href="/planos" className="block group/trial">
        <div className="p-[clamp(0.5rem,1.5vh,0.75rem)] rounded-lg border bg-card shadow-sm group-hover/trial:bg-accent/50 transition-colors cursor-pointer">
          {/* Estado normal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Acesso Ultra
              </span>
              <span className="text-[10px] font-semibold tabular-nums">
                {daysRemaining}d
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${barColor}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Hover: detalhes expandidos com animação */}
          <div className="grid grid-rows-[0fr] group-hover/trial:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
            <div className="overflow-hidden">
              <div className="pt-2 mt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''} de acesso ilimitado
                </p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-primary">
                  Ver planos <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
