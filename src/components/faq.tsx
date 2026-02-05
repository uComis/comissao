'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export interface FaqItem {
  question: string
  answer: string
}

// Dados padrão do FAQ - podem ser sobrescritos via props
export const DEFAULT_FAQ_DATA: FaqItem[] = [
  {
    question: "O que são os dias de teste gratuito? Vou perder meus dados quando acabar?",
    answer: "Ao criar sua conta, você ganha 14 dias de teste com acesso ULTRA ilimitado — pastas ilimitadas, vendas ilimitadas e todos os recursos premium. Durante esse período, você pode explorar a plataforma sem qualquer restrição. Se assinar um plano pago durante o teste, você mantém os recursos ULTRA até o fim dos 14 dias (como recompensa por assinar cedo!) e depois os limites do seu plano entram em vigor. Se não assinar, você continua usando o plano Free (1 pasta, 30 vendas/mês, 30 dias de histórico) — sem perder nenhum dado. Tudo fica salvo e você pode fazer upgrade quando quiser."
  },
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

interface FaqSectionProps {
  items?: FaqItem[]
  title?: string
  subtitle?: string
  variant?: 'default' | 'landing'
  className?: string
  maxItems?: number
}

export function FaqSection({
  items = DEFAULT_FAQ_DATA,
  title = "Perguntas Frequentes",
  subtitle = "Tudo o que você precisa saber sobre nossos planos e o funcionamento da plataforma.",
  variant = 'default',
  className = '',
  maxItems,
}: FaqSectionProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items

  const isLanding = variant === 'landing'

  return (
    <div className={`space-y-8 max-w-4xl mx-auto ${className}`}>
      <div className="text-center space-y-3">
        <h2 className={`text-3xl font-bold tracking-tight ${isLanding ? 'text-gray-900' : ''}`}>
          {title}
        </h2>
        <p className={`text-lg ${isLanding ? 'text-gray-600' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {displayItems.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className={`border rounded-2xl overflow-hidden transition-all group ${
              isLanding
                ? 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 data-[state=open]:border-gray-300 data-[state=open]:bg-white'
                : 'border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/30 hover:bg-card/60 data-[state=open]:border-primary/40 data-[state=open]:bg-card/80'
            }`}
          >
            <AccordionTrigger className="text-base font-semibold hover:no-underline px-6 py-6 [&[data-state=open]]:pb-4">
              <span className={`transition-colors text-left ${
                isLanding
                  ? 'text-gray-900 group-hover:text-gray-700'
                  : 'group-hover:text-primary'
              }`}>
                {item.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className={`text-lg leading-relaxed px-6 pb-8 ${
              isLanding ? 'text-gray-600' : 'text-foreground'
            }`}>
              <div className={`pt-2 border-t ${isLanding ? 'border-gray-200' : 'border-border/10'}`}>
                {item.answer}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
