'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { getBillingUsage } from '@/app/actions/billing'

export function UsageWidget() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<{
    plan: string
    vendas: { current: number; limit: number }
    pastas: { current: number; limit: number }
    status: string
  } | null>(null)

  useEffect(() => {
    async function loadUsage() {
      try {
        const data = await getBillingUsage()
        if (data) {
          setUsage({
            plan: data.plan,
            vendas: data.vendas,
            pastas: data.pastas,
            status: data.status,
          })
        }
      } catch (error) {
        console.error('Error loading usage:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUsage()
  }, [])

  if (loading) return null

  if (!usage) return null
  
  const vendasProgress = (usage.vendas.current / usage.vendas.limit) * 100
  const isNearLimit = vendasProgress >= 80

  if (usage.plan === 'ULTRA') return null // Ultra não tem limites visíveis assim

  return (
    <div className="mx-2 mb-[clamp(0.5rem,1vh,1rem)] p-[clamp(0.5rem,1.5vh,0.75rem)] rounded-lg border bg-card shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Uso do Plano {usage.plan}
        </span>
        {isNearLimit && <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Vendas (mês)</span>
          <span className={isNearLimit ? 'text-amber-500 font-bold' : ''}>
            {usage.vendas.current}/{usage.vendas.limit}
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

