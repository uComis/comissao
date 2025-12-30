'use client'

import { Check, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPlans, getSubscription, createSubscriptionAction } from '@/app/actions/billing'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { ProfileCompletionDialog } from './profile-completion-dialog'

interface Plan {
  id: string
  name: string
  price: number
  description: string
  interval: string
  max_suppliers: number
  max_sales_month: number
  max_users: number
  plan_group: string
  features: Record<string, unknown>
}

interface PlanSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlanSelectionDialog({ open, onOpenChange }: PlanSelectionDialogProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [subscribingId, setSubscribingId] = useState<string | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const maxDiscount = plans.reduce((acc, plan) => {
    if (plan.interval === 'year') {
      const monthlyPlan = plans.find(p => p.plan_group === plan.plan_group && p.interval === 'month')
      if (monthlyPlan) {
        const discount = 1 - (plan.price / (monthlyPlan.price * 12))
        return Math.max(acc, Math.round(discount * 100))
      }
    }
    return acc
  }, 0)

  const [hasEverSubscribed, setHasEverSubscribed] = useState(false)

  useEffect(() => {
    if (open && user) {
      async function loadData() {
        try {
          const [plansData, subData] = await Promise.all([
            getPlans(),
            getSubscription(user!.id)
          ])
          setPlans(plansData)
          setCurrentPlanId(subData?.plan_id || null)
          // Se tem assinatura ativa/past_due, já assinou alguma vez
          setHasEverSubscribed(!!subData)
        } catch (error) {
          console.error('Error loading plans:', error)
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [open, user])

  // Filtra por intervalo e esconde FREE se já assinou algum plano
  const filteredPlans = plans
    .filter(p => p.interval === billingInterval)
    .filter(p => hasEverSubscribed ? p.plan_group !== 'free' : true)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getPlanFeatures = (plan: Plan) => {
    const planOrder = ['free', 'pro', 'pro_plus', 'ultra']
    const planNames: Record<string, string> = {
      'free': 'FREE',
      'pro': 'PRO',
      'pro_plus': 'PRO +',
      'ultra': 'ULTRA'
    }

    const features: string[] = []
    const currentIndex = planOrder.indexOf(plan.plan_group)
    
    // Adiciona o prefixo de hierarquia se não for o primeiro plano
    if (currentIndex > 0) {
      features.push(`Tudo do plano ${planNames[planOrder[currentIndex - 1]]}, mais:`)
    }

    features.push(plan.max_users === 1 ? '1 Usuário (Solo)' : `${plan.max_users} Usuários`)
    features.push(plan.max_suppliers >= 9999 ? 'Pastas Ilimitadas' : `${plan.max_suppliers} Pastas de organização`)
    features.push(plan.max_sales_month >= 99999 ? 'Vendas Ilimitadas' : `${plan.max_sales_month} vendas por mês`)
    
    if (plan.features.custom_reports) features.push('Relatórios Avançados')
    if (plan.features.api_access) features.push('Acesso via API')
    
    return features
  }

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribingId(planId)
      const result = await createSubscriptionAction(planId)
      
      if (result.success) {
        toast.success('Fatura gerada! Redirecionando para central de cobranças...')
        
        // Redireciona para a página de cobranças com os parâmetros para abrir o bridge modal
        const params = new URLSearchParams()
        if (result.invoiceId) params.append('invoice_id', result.invoiceId)
        if (result.invoiceUrl) params.append('url', result.invoiceUrl)
        
        window.location.href = `/cobrancas?${params.toString()}`
      } else {
        if (result.error === 'NEEDS_DOCUMENT') {
          setPendingPlanId(planId)
          setShowProfileDialog(true)
        } else {
          throw new Error(result.message || 'Não foi possível gerar o link de pagamento.')
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao assinar:', error)
      const message = error instanceof Error ? error.message : 'Erro ao processar assinatura. Tente novamente.'
      toast.error(message)
    } finally {
      setSubscribingId(null)
    }
  }

  if (!mounted) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-7xl overflow-x-auto overflow-y-auto max-h-[95vh] p-4 md:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl md:text-4xl text-center font-bold">Escolha seu Plano</DialogTitle>
          <DialogDescription className="text-center text-lg max-w-2xl mx-auto">
            Selecione a melhor opção para o seu momento e escale sua operação com controle total.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center gap-4 mb-8">
          <button 
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              billingInterval === 'month' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button 
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              billingInterval === 'year' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Anual {maxDiscount > 0 && (
              <Badge className="ml-1 bg-emerald-600 text-white hover:bg-emerald-600 border-none shadow-sm">
                -{maxDiscount}%
              </Badge>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-4 py-4 min-w-max lg:min-w-0 justify-center items-stretch">
            {filteredPlans.map((plan) => {
              const isCurrent = currentPlanId === plan.id
              const isRecommended = plan.plan_group === 'pro_plus'

              return (
                <Card 
                  key={plan.id} 
                  className={`flex flex-col relative transition-all duration-200 w-full sm:w-[300px] lg:w-full lg:min-w-[260px] xl:min-w-[280px] ${
                    isRecommended ? 'border-primary shadow-2xl ring-2 ring-primary ring-offset-4 ring-offset-background z-10' : 'hover:border-primary/40'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        Recomendado
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-1 p-4 md:p-5">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{plan.description || 'Para impulsionar suas vendas'}</CardDescription>
                    <div className="pt-3">
                      <span className="text-2xl md:text-3xl font-bold tracking-tight">{formatPrice(plan.price)}</span>
                      <span className="text-muted-foreground text-xs ml-1">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 md:p-5 pt-0 md:pt-0">
                    <ul className="space-y-2.5 text-sm">
                      {getPlanFeatures(plan).map((feature) => {
                        const isHeader = feature.includes('Tudo do plano')
                        
                        return (
                          <li key={feature} className={`flex items-start gap-2 leading-tight ${isHeader ? 'mb-1' : ''}`}>
                            {isHeader ? (
                              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 border-primary/30 text-primary bg-primary/5">PLUS</Badge>
                            ) : (
                              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            )}
                            <span className={isHeader ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                              {feature}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-4 md:p-5">
                    <Button 
                      className="w-full font-bold py-6" 
                      variant={isRecommended ? 'default' : 'outline'}
                      disabled={isCurrent || !!subscribingId}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {subscribingId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : isCurrent ? (
                        'Plano Atual'
                      ) : (
                        `Assinar ${plan.name}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <ProfileCompletionDialog 
      open={showProfileDialog}
      onOpenChange={setShowProfileDialog}
      onSuccess={() => {
        setShowProfileDialog(false)
        if (pendingPlanId) handleSubscribe(pendingPlanId)
      }}
    />
    </>
  )
}

