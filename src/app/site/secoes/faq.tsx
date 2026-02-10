'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

const FAQ_ITEMS = [
  {
    question: "Como saber se minha comissão está certa?",
    answer: "Cadastre suas vendas no uComis com as regras de comissão do fornecedor. O sistema calcula automaticamente quanto você deveria receber, permitindo conferir se os valores batem com o que a empresa pagou."
  },
  {
    question: "Como funciona o cálculo de comissões?",
    answer: "Você configura as regras de comissão de cada fornecedor (percentuais, faixas, bonificações) e o sistema aplica automaticamente em cada venda cadastrada, gerando o valor de comissão e as parcelas de recebimento."
  },
  {
    question: "Como calcular comissão de vendas parceladas?",
    answer: "Ao cadastrar uma venda, você informa a condição de pagamento (30/60/90 dias, por exemplo). O uComis gera automaticamente as parcelas de comissão com as datas previstas de recebimento."
  },
  {
    question: "O uComis funciona para quem tem uma só representada?",
    answer: "Sim! A maioria dos nossos usuários trabalha com uma empresa. O uComis resolve a dor principal: saber exatamente quanto você vai receber e quando, sem depender da planilha ou da confiança no financeiro."
  },
  {
    question: "Preciso saber Excel para usar o uComis?",
    answer: "Não. O uComis substitui a planilha. Você cadastra a venda em poucos campos e o sistema faz todo o cálculo. Se você sabe usar WhatsApp, sabe usar o uComis."
  },
  {
    question: "Meus dados ficam visíveis para a empresa?",
    answer: "Não. O uComis é uma ferramenta pessoal do vendedor. Seus dados são criptografados e só você tem acesso. Nem a gente consegue ver suas informações."
  },
  {
    question: "Posso ter mais de uma pasta de fornecedor?",
    answer: "Sim! No plano Free você tem 1 pasta, no Pro também 1 pasta com recursos extras, e no Ultra você tem pastas ilimitadas para gerenciar todos os seus fornecedores."
  },
]

function FaqItem({ question, answer, isOpen, onToggle, index }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <ScrollReveal delay={100 + index * 100}>
      <div className="border-b border-gray-200 py-6">
        <button
          onClick={onToggle}
          className="flex items-start justify-between w-full text-left gap-4"
        >
          <span className="text-lg font-semibold text-gray-900">
            {question}
          </span>
          <span
            className="text-2xl font-bold leading-none mt-0.5 transition-transform duration-200"
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

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-10 sm:py-20 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Coluna esquerda - Título */}
          <ScrollReveal className="flex flex-col justify-start">
            <p className="font-medium mb-4" style={{ color: '#FF5310' }}>Dúvidas</p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-gray-900">
              Perguntas<br />Frequentes
            </h2>
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

            {/* Link "Ver mais" */}
            <ScrollReveal delay={100 + FAQ_ITEMS.length * 100}>
              <Link
                href="/faq"
                className="inline-flex items-center gap-1 font-medium hover:underline mt-6"
                style={{ color: '#FF5310' }}
              >
                Ver mais perguntas
                <span aria-hidden="true">→</span>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
