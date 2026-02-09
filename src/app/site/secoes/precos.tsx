'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

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

interface PrecosProps {
  plans: Plan[]
}

export function Precos({ plans }: PrecosProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year')

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

  return (
    <section id="precos" className="py-10 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header */}
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-12 space-y-4 sm:space-y-5">
          <p className="text-landing-primary font-medium">Preços</p>

          <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Simples e transparente.
          </h2>

          <p className="text-gray-600 text-lg leading-relaxed">
            Comece grátis por 14 dias. Sem cartão de crédito.
          </p>
        </ScrollReveal>

        {/* Billing Interval Toggle */}
        <ScrollReveal className="flex justify-center mb-6 sm:mb-10" delay={100}>
          <Card className="rounded-full p-2 w-fit border-gray-200">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all flex-1 min-w-[140px] ${billingInterval === 'month'
                  ? 'bg-landing-primary text-white shadow-sm'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all flex-1 min-w-[140px] flex items-center justify-center gap-1 ${billingInterval === 'year'
                  ? 'bg-landing-primary text-white shadow-sm'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
              >
                <span>Anual</span>
                {maxDiscount > 0 && (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-none shadow-sm text-[10px]">
                    -{maxDiscount}%
                  </Badge>
                )}
              </button>
            </div>
          </Card>
        </ScrollReveal>

        {/* Plans Grid */}
        <div className="flex flex-wrap justify-center gap-6 py-4 w-full">
          {filteredPlans.map((plan, index) => {
            const isRecommended = plan.plan_group === 'pro'
            const isUltra = plan.plan_group === 'ultra'
            const isFree = plan.plan_group === 'free'

            return (
              <ScrollReveal
                key={plan.id}
                delay={150 + index * 100}
                className="w-full xs:min-w-[280px] sm:max-w-[340px] flex-1"
              >
                <Card
                  className={`flex flex-col relative h-full transition-all duration-500 backdrop-blur-md ${isRecommended
                    ? 'border-landing-primary/40 bg-gradient-to-b from-landing-primary/5 via-white to-white shadow-[0_0_40px_rgba(255,107,0,0.05)]'
                    : isUltra
                      ? 'border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-white shadow-[0_0_40px_rgba(0,0,0,0.03)]'
                      : 'border-gray-200 bg-white hover:border-landing-primary/20'
                    }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 flex items-center gap-1.5 px-4 py-1.5 text-[11px] tracking-widest uppercase font-bold border border-orange-400/30 rounded-full shadow-[0_4px_20px_rgba(249,115,22,0.4)]">
                        <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">🔥</span> Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-1 p-8">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {plan.name.replace(' Mensal', '').replace(' Anual', '')}
                    </CardTitle>
                    <CardDescription className="line-clamp-1 text-gray-500">
                      {plan.description === 'Para representante profissional e equipes'
                        ? 'Para representante multipasta'
                        : (plan.description || 'Para impulsionar suas vendas')}
                    </CardDescription>
                    <div className="pt-4 flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-1 overflow-hidden">
                        <span className="text-3xl md:text-4xl font-bold tracking-tight">
                          {billingInterval === 'year' && plan.price > 0
                            ? formatPrice(plan.price / 12)
                            : formatPrice(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">/mês</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-8 pt-2">
                    <ul className="space-y-4 text-sm">
                      {getPlanFeatures(plan).map((feature) => (
                        <li key={feature} className="flex items-start gap-3 leading-snug">
                          <Check className="h-4 w-4 text-landing-primary shrink-0 mt-0.5" />
                          <span className="text-gray-600 font-medium">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-8 pt-0 mt-auto">
                    <Button
                      asChild
                      className={`w-full font-bold py-6 transition-all duration-300 ${isRecommended
                        ? 'bg-zinc-900 text-white hover:bg-black'
                        : isUltra
                          ? 'bg-landing-primary text-white hover:opacity-90'
                          : 'bg-transparent border-zinc-200 text-gray-700 hover:bg-zinc-50'
                        }`}
                      variant={isRecommended || isUltra ? 'default' : 'outline'}
                    >
                      <Link href="/login">
                        {isFree ? 'Comece grátis' : 'Comece grátis por 14 dias'}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
