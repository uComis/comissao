'use client'

import { Check, Loader2, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPlans, getSubscription, createSubscriptionAction } from '@/app/actions/billing'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { ProfileCompletionDialog } from '@/components/billing/profile-completion-dialog'

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

export function PlanosPageClient() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [subscribingId, setSubscribingId] = useState<string | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)

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



  useEffect(() => {
    if (user) {
      async function loadData() {
        try {
          const [plansData, subData] = await Promise.all([
            getPlans(),
            getSubscription(user!.id)
          ])
          setPlans(plansData)
          setCurrentPlanId(subData?.plan_id || null)
        } catch (error) {
          console.error('Error loading plans:', error)
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [user])

  // Filtra por intervalo, mas sempre mostra FREE (que só existe como mensal)
  const filteredPlans = plans
    .filter(p => p.interval === billingInterval || p.plan_group === 'free')

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getPlanFeatures = (plan: Plan) => {
    const features: string[] = []
    
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

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">Escolha seu Plano</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Selecione a melhor opção para o seu momento e escale sua operação com controle total.
            </p>
          </div>
        </div>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center items-center gap-4">
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

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 py-4 w-full">
            {filteredPlans.map((plan) => {
                const isCurrent = currentPlanId === plan.id
                const isRecommended = plan.plan_group === 'pro' || plan.plan_group === 'pro_plus'

                return (
                  <Card 
                    key={plan.id} 
                    className={`flex flex-col relative transition-all duration-500 border-border/40 bg-card/40 backdrop-blur-md min-w-[280px] max-w-[340px] flex-1 ${
                      isRecommended ? 'border-[#409eff]/40 shadow-[0_0_15px_rgba(64,158,255,0.05)]' : 'hover:border-primary/20'
                    } ${isCurrent ? 'bg-brand/[0.02] border-brand/10' : ''}`}
                  >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="secondary" className="bg-[#409eff] text-white hover:bg-[#409eff] flex items-center gap-1.5 px-4 py-1 text-[10px] tracking-widest uppercase font-black border-none shadow-[0_2px_10px_rgba(64,158,255,0.3)]">
                        🔥 Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-1 p-8">
                    {isCurrent && (
                      <span className="text-[10.5px] text-brand/80 font-bold uppercase tracking-[0.15em] mb-3 block animate-in fade-in slide-in-from-top-1 duration-700">
                        Este é o seu plano
                      </span>
                    )}
                    <CardTitle className="text-xl flex items-center gap-2">
                       {plan.name.replace(' Mensal', '').replace(' Anual', '')}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">{plan.description || 'Para impulsionar suas vendas'}</CardDescription>
                    <div className="pt-4 flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
                        <span className="text-3xl md:text-4xl font-bold tracking-tight">
                          {billingInterval === 'year' && plan.price > 0 
                            ? formatPrice(plan.price / 12) 
                            : formatPrice(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">/mês</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-8 pt-2">
                    <ul className="space-y-4 text-sm">
                      {getPlanFeatures(plan).map((feature) => (
                        <li key={feature} className="flex items-start gap-3 leading-snug">
                          <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                          <span className="text-muted-foreground/90 font-medium">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  {!isCurrent && (
                    <CardFooter className="p-8 pt-0 mt-auto">
                      <Button 
                        className={`w-full font-bold py-6 transition-all duration-300 ${
                          isRecommended 
                            ? 'bg-[#409eff] text-white hover:bg-[#409eff]/90' 
                            : 'bg-transparent border-border/40 hover:bg-muted/50'
                        }`}
                        variant={isRecommended ? 'default' : 'outline'}
                        disabled={!!subscribingId}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {subscribingId === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          `Escolher plano`
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

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
