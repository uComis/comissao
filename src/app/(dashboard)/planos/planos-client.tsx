'use client'

import { Check, Loader2, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useCurrentUser } from '@/contexts/current-user-context'
import { DowngradeModal } from '@/components/billing/downgrade-modal'
import { FaqSection, DEFAULT_FAQ_DATA, type FaqItem } from '@/components/faq'

const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  pro: 1,
  ultra: 2,
}

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

interface PlanosPageClientProps {
  initialPlans: Plan[]
}

export function PlanosPageClient({ initialPlans }: PlanosPageClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { currentUser, refresh } = useCurrentUser()
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year')
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false)
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<Plan | null>(null)

  const loading = !user

  // Buscar plano FREE para customizar FAQ com valores dinâmicos
  const freePlan = initialPlans?.find(p => p.plan_group === 'free')

  // Customiza a pergunta sobre limites com dados reais do plano FREE
  const faqItems: FaqItem[] = DEFAULT_FAQ_DATA.map(item => {
    if (item.question.includes('limites de vendas')) {
      return {
        ...item,
        answer: `O plano Free possui um limite de ${freePlan?.max_sales_month || 30} vendas por mês e ${freePlan?.max_suppliers || 1} pasta de fornecedor. Já os planos pagos (Pro e Ultra) não possuem limite de vendas, permitindo que você escale sua operação sem restrições. O limite de pastas varia conforme o plano escolhido (1 para Pro e ilimitadas para Ultra).`
      }
    }
    return item
  })

  const maxDiscount = initialPlans.reduce((acc, plan) => {
    if (plan.interval === 'year') {
      const monthlyPlan = initialPlans.find(p => p.plan_group === plan.plan_group && p.interval === 'month')
      if (monthlyPlan) {
        const discount = 1 - (plan.price / (monthlyPlan.price * 12))
        return Math.max(acc, Math.round(discount * 100))
      }
    }
    return acc
  }, 0)

  // Filtra por intervalo, mas sempre mostra FREE (que só existe como mensal)
  const filteredPlans = initialPlans
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

    features.push(plan.max_suppliers >= 9999 ? 'Pastas Ilimitadas' : `${plan.max_suppliers} ${plan.max_suppliers === 1 ? 'Pasta de fornecedor' : 'Pastas de fornecedor'}`)
    features.push(plan.max_sales_month >= 99999 ? 'Vendas Ilimitadas' : `${plan.max_sales_month} vendas por mês`)

    // Data retention: specific days for FREE, unlimited for paid plans
    const retentionDays = plan.features.data_retention_days as number | null | undefined
    if (retentionDays && retentionDays > 0) {
      features.push(`Dados mantidos por ${retentionDays} dias`)
    } else {
      features.push('Histórico ilimitado de dados')
    }

    if (plan.features.custom_reports) features.push('Relatórios Avançados')

    return features
  }

  const handleSubscribe = async (planId: string) => {
    const selectedPlan = initialPlans.find(p => p.id === planId)
    if (!selectedPlan) return

    const billing = currentUser?.billing
    const currentPlanGroup = billing?.planGroup || 'free'
    const newPlanGroup = selectedPlan.plan_group

    // Check if it's a downgrade
    const currentLevel = PLAN_HIERARCHY[currentPlanGroup] || 0
    const newLevel = PLAN_HIERARCHY[newPlanGroup] || 0
    const isDowngrade = newLevel < currentLevel && billing?.currentPeriodEnd

    if (isDowngrade) {
      // Open downgrade modal instead of redirecting
      setSelectedDowngradePlan(selectedPlan)
      setDowngradeModalOpen(true)
      return
    }

    // Normal flow: redirect to confirmation page
    const params = new URLSearchParams({
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      plan_price: selectedPlan.price.toString(),
      plan_interval: selectedPlan.interval,
      plan_group: selectedPlan.plan_group,
    })

    router.push(`/planos/confirmar?${params.toString()}`)
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
            <h1 className="text-3xl md:text-4xl font-bold">Planos</h1>
            <p className="text-muted-foreground mt-2 text-lg">
            </p>
          </div>
        </div>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center">
          <Card className="rounded-full p-2 w-fit">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all flex-1 min-w-[140px] ${billingInterval === 'month'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all flex-1 min-w-[140px] flex items-center justify-center gap-1 ${billingInterval === 'year'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <span>Anual</span>
                {maxDiscount > 0 && (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-none shadow-sm">
                    -{maxDiscount}%
                  </Badge>
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 py-4 w-full">
            {filteredPlans.map((plan) => {
              const billing = currentUser?.billing
              const isCurrent = billing?.planGroup === plan.plan_group
              const isTrialingUltra = plan.plan_group === 'ultra' && billing?.isInTrial
              const isRecommended = plan.plan_group === 'pro'
              const isUltra = plan.plan_group === 'ultra'

              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col relative transition-all duration-500 backdrop-blur-md min-w-[280px] max-w-[340px] flex-1 ${isRecommended
                    ? 'border-[#409eff]/40 bg-gradient-to-b from-[#409eff]/5 via-white to-white dark:from-[#409eff]/15 dark:via-[#1a1a2e]/40 dark:to-card/40 shadow-[0_0_40px_rgba(64,158,255,0.05)] dark:shadow-[0_0_40px_rgba(64,158,255,0.1)] dark:border-[#409eff]/50'
                    : isUltra
                      ? 'border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-white dark:border-white/20 dark:from-white/10 dark:via-card/40 dark:to-card/40 shadow-[0_0_40px_rgba(0,0,0,0.03)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]'
                      : 'border-border/40 bg-card/40 hover:border-primary/20'
                    } ${isCurrent ? 'bg-brand/[0.02] border-brand/10' : ''}`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 flex items-center gap-1.5 px-4 py-1.5 text-[11px] tracking-widest uppercase font-bold border border-orange-400/30 rounded-full shadow-[0_4px_20px_rgba(249,115,22,0.4)]">
                        <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">🔥</span> Popular
                      </Badge>
                    </div>
                  )}
                  {isTrialingUltra && (
                    <div className="absolute top-4 right-8 z-10">
                      <Badge variant="secondary" className="bg-emerald-600/80 text-emerald-50 hover:bg-emerald-600/90 flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-wide uppercase font-medium border border-emerald-500/20 rounded-md shadow-sm">
                        <span>✨</span> Degustação Ativa
                      </Badge>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-4 left-8 z-10">
                      <span className="text-[10.5px] text-brand/80 font-bold uppercase tracking-[0.15em] block animate-in fade-in slide-in-from-top-1 duration-700">
                        Este é o seu plano
                      </span>
                    </div>
                  )}
                  <CardHeader className="space-y-1 p-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {plan.name.replace(' Mensal', '').replace(' Anual', '')}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {plan.description === 'Para representante profissional e equipes'
                        ? 'Para representante multipasta'
                        : (plan.description || 'Para impulsionar suas vendas')}
                    </CardDescription>
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
                  {(!isCurrent && plan.plan_group !== 'free') && (
                    <CardFooter className="p-8 pt-0 mt-auto">
                      <Button
                        className={`w-full font-bold py-6 transition-all duration-300 ${isRecommended
                          ? 'bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                          : isUltra
                            ? 'bg-primary text-primary-foreground hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                            : 'bg-transparent border-zinc-200 hover:bg-zinc-50 dark:border-border/40 dark:hover:bg-muted/50'
                          }`}
                        variant={isRecommended || isUltra ? 'default' : 'outline'}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        Escolher plano
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* FAQ Section */}
        <FaqSection
          items={faqItems}
          title="Dúvidas Frequentes"
          className="pt-20 pb-20"
        />
      </div>

      {/* Downgrade Modal */}
      {selectedDowngradePlan && (
        <DowngradeModal
          open={downgradeModalOpen}
          onOpenChange={setDowngradeModalOpen}
          currentPlan={currentUser?.billing?.planGroup?.toUpperCase() || 'Atual'}
          newPlan={{
            id: selectedDowngradePlan.id,
            name: selectedDowngradePlan.name,
            price: selectedDowngradePlan.price,
            interval: selectedDowngradePlan.interval,
            max_suppliers: selectedDowngradePlan.max_suppliers,
            max_sales_month: selectedDowngradePlan.max_sales_month,
          }}
          periodEnd={currentUser?.billing?.currentPeriodEnd || null}
          onSuccess={() => {
            refresh?.()
          }}
        />
      )}
    </>
  )
}
