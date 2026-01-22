'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { useCurrentUser } from '@/contexts/current-user-context'

export function UsageWidget() {
  const router = useRouter()
  const { currentUser } = useCurrentUser()

  if (!currentUser?.billing || !currentUser?.usage) return null

  const { billing, usage: usageStats } = currentUser
  const plan = billing.effectivePlan.toUpperCase()
  const vendas = {
    current: usageStats.sales_count_current_month,
    limit: billing.limits.max_sales_month,
  }
  const pastas = {
    current: usageStats.suppliers_count,
    limit: billing.limits.max_suppliers,
  }
  
  const vendasProgress = (vendas.current / vendas.limit) * 100
  const isNearLimit = vendasProgress >= 80

  if (plan === 'ULTRA') return null // Ultra não tem limites visíveis assim

  return (
    <div className="mx-2 mb-[clamp(0.5rem,1vh,1rem)] p-[clamp(0.5rem,1.5vh,0.75rem)] rounded-lg border bg-card shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Uso do Plano {plan}
        </span>
        {isNearLimit && <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Vendas (mês)</span>
          <span className={isNearLimit ? 'text-amber-500 font-bold' : ''}>
            {vendas.current}/{vendas.limit}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
              isNearLimit ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${vendasProgress}%` }}
          />
        </div>
      </div>

      {isNearLimit ? (
        <Button 
          size="sm" 
          variant="default" 
          className="w-full h-7 text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => router.push('/planos')}
        >
          Fazer Upgrade
        </Button>
      ) : (
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full h-7 text-[10px] border-primary/20 hover:border-primary/50"
          onClick={() => router.push('/planos')}
        >
          <Sparkles className="h-3 w-3 mr-1 text-primary" />
          Ver Planos
        </Button>
      )}
    </div>
  )
}

