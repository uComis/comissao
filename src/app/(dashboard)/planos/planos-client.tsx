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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqData = [
  {
    question: "O pagamento é seguro? Como funciona a cobrança?",
    answer: "Sim, utilizamos o Asaas, uma das maiores e mais seguras plataformas de pagamento do Brasil. O pagamento é processado por eles e reconhecido automaticamente pelo nosso sistema em instantes, liberando seu acesso de forma imediata e segura."
  },
  {
    question: "Alguém pode ver minha venda além de mim? Como meus dados são utilizados?",
    answer: "Sua privacidade é nossa prioridade. Seus dados são criptografados e apenas você tem acesso às suas vendas e comissões. Não compartilhamos suas informações com terceiros; elas são utilizadas exclusivamente para gerar seus relatórios e cálculos de comissão."
  },
  {
    question: "Posso trocar de plano a qualquer momento?",
    answer: "Com certeza! Você pode fazer o upgrade ou downgrade do seu plano a qualquer momento diretamente pela plataforma. No caso de upgrade, a diferença de valor será calculada proporcionalmente."
  },
  {
    question: "Quais são os limites de vendas e pastas de fornecedores?",
    answer: "O plano Free possui um limite de 30 vendas por mês e 1 pasta de fornecedor. Já os planos pagos (Pro e Ultra) não possuem limite de vendas, permitindo que você escale sua operação sem restrições. O limite de pastas varia conforme o plano escolhido (1 para Pro e ilimitadas para Ultra)."
  },
  {
    question: "Existe algum período de fidelidade ou taxa de cancelamento?",
    answer: "Não, você tem total liberdade. Não exigimos fidelidade e você pode cancelar sua assinatura a qualquer momento sem qualquer taxa oculta ou multa."
  },
  {
    question: "Quais são as formas de pagamento aceitas?",
    answer: "Aceitamos Pix, Cartão de Crédito, Cartão de Débito e Boleto Bancário. No caso do Pix e Cartão, a ativação do seu plano é instantânea após a aprovação."
  },
  {
    question: "Como funciona o suporte se eu precisar de ajuda?",
    answer: "Oferecemos suporte completo para você. Você pode contar com nossa IA treinada, disponível 24/7 para tirar qualquer dúvida instantaneamente. Se preferir algo mais específico, poderá nos enviar um e-mail diretamente pelo sistema através da nossa página de contato."
  }
]

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
    
    features.push(plan.max_suppliers >= 9999 ? 'Pastas Ilimitadas' : `${plan.max_suppliers} ${plan.max_suppliers === 1 ? 'Pasta de fornecedor' : 'Pastas de fornecedor'}`)
    features.push(plan.max_sales_month >= 99999 ? 'Vendas Ilimitadas' : `${plan.max_sales_month} vendas por mês`)
    
    // Data retention: 60 days for FREE, unlimited for paid plans
    if (plan.plan_group === 'free') {
      features.push('Dados mantidos por 60 dias')
    } else {
      features.push('Histórico ilimitado de dados')
    }
    
    if (plan.features.custom_reports) features.push('Relatórios Avançados')
    if (plan.features.api_access && plan.plan_group !== 'ultra') features.push('Acesso via API')
    
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
        <div className="flex justify-center">
          <Card className="p-1 w-fit">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setBillingInterval('month')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all flex-1 min-w-[140px] ${
                  billingInterval === 'month' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Mensal
              </button>
              <button 
                onClick={() => setBillingInterval('year')}
                className={`px-8 py-2 rounded-full text-sm font-medium transition-all flex-1 min-w-[140px] flex items-center justify-center gap-1 ${
                  billingInterval === 'year' 
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
                const isCurrent = currentPlanId === plan.id
                const isRecommended = plan.plan_group === 'pro' || plan.plan_group === 'pro_plus'
                const isUltra = plan.plan_group === 'ultra'

                return (
                  <Card 
                    key={plan.id} 
                    className={`flex flex-col relative transition-all duration-500 backdrop-blur-md min-w-[280px] max-w-[340px] flex-1 ${
                      isRecommended 
                        ? 'border-[#409eff]/40 bg-gradient-to-b from-[#409eff]/5 via-white to-white dark:from-[#409eff]/15 dark:via-[#1a1a2e]/40 dark:to-card/40 shadow-[0_0_40px_rgba(64,158,255,0.05)] dark:shadow-[0_0_40px_rgba(64,158,255,0.1)] dark:border-[#409eff]/50' 
                        : isUltra
                          ? 'border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-white dark:border-white/20 dark:from-white/10 dark:via-card/40 dark:to-card/40 shadow-[0_0_40px_rgba(0,0,0,0.03)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]'
                          : 'border-border/40 bg-card/40 hover:border-primary/20'
                    } ${isCurrent ? 'bg-brand/[0.02] border-brand/10' : ''}`}
                  >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="secondary" className="bg-[#111] text-white hover:bg-[#111] flex items-center gap-1.5 px-3.5 py-1 text-[10px] tracking-widest uppercase font-bold border border-white/10 rounded-full shadow-xl">
                        <span className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">🔥</span> Popular
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
                  {!isCurrent && (
                    <CardFooter className="p-8 pt-0 mt-auto">
                      <Button 
                        className={`w-full font-bold py-6 transition-all duration-300 ${
                          isRecommended 
                            ? 'bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200' 
                            : isUltra
                              ? 'bg-primary text-primary-foreground hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                              : 'bg-transparent border-zinc-200 hover:bg-zinc-50 dark:border-border/40 dark:hover:bg-muted/50'
                        }`}
                        variant={isRecommended || isUltra ? 'default' : 'outline'}
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

        {/* FAQ Section */}
        <div className="pt-20 pb-20 space-y-8 max-w-4xl mx-auto">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Dúvidas Frequentes</h2>
            <p className="text-muted-foreground text-lg">
              Tudo o que você precisa saber sobre nossos planos e o funcionamento da plataforma.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqData.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden transition-all hover:border-primary/30 hover:bg-card/60 data-[state=open]:border-primary/40 data-[state=open]:bg-card/80 group"
              >
                <AccordionTrigger className="text-base font-semibold hover:no-underline px-6 py-6 [&[data-state=open]]:pb-4">
                  <span className="group-hover:text-primary transition-colors">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-foreground text-lg leading-relaxed px-6 pb-8">
                  <div className="pt-2 border-t border-border/10">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
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
