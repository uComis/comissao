'use client'

import { useState } from 'react'
import { Header } from '../secoes/header'
import { Footer } from '../secoes/footer'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

const FAQ_ITEMS = [
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

function FaqItem({ question, answer, isOpen, onToggle, index }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <ScrollReveal delay={50 + index * 50}>
      <div className="border-b border-gray-200 py-6">
        <button
          onClick={onToggle}
          className="flex items-start justify-between w-full text-left gap-4"
        >
          <span className="text-lg font-semibold text-gray-900">
            {question}
          </span>
          <span
            className="text-2xl font-bold leading-none mt-0.5 transition-transform duration-200 shrink-0"
            style={{ color: '#FF5310' }}
          >
            {isOpen ? '−' : '+'}
          </span>
        </button>
        <div
          className={`grid transition-all duration-300 ease-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <p className="text-gray-600 leading-relaxed">
              {answer}
            </p>
          </div>
        </div>
      </div>
    </ScrollReveal>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div>
      <Header />
      <main className="pt-24">
        <section className="py-20 sm:py-24 bg-white">
          <div className="container mx-auto px-6 max-w-[1200px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
              {/* Coluna esquerda - Título */}
              <ScrollReveal className="flex flex-col justify-start">
                <p className="font-medium mb-4" style={{ color: '#FF5310' }}>Dúvidas</p>
                <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-gray-900">
                  Perguntas<br />Frequentes
                </h1>
                <p className="text-gray-600 mt-4 leading-relaxed">
                  Tudo o que você precisa saber sobre nossos planos e o funcionamento da plataforma.
                </p>
              </ScrollReveal>

              {/* Coluna direita - Perguntas */}
              <div>
                {FAQ_ITEMS.map((item, index) => (
                  <FaqItem
                    key={index}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openIndex === index}
                    onToggle={() => handleToggle(index)}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
