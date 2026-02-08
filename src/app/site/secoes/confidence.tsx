import { CheckCircle2, Search, Scale } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { DesktopMockup } from '@/components/ui/desktop-mockup'

const features = [
  { icon: Search, label: 'Rastreabilidade total' },
  { icon: Scale, label: 'Auditoria de valores' },
  { icon: CheckCircle2, label: 'Confirmação de pagamentos' },
]

export function Confidence() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        
        {/* Centralized Card */}
        <ScrollReveal className="bg-gray-50 rounded-[40px] px-8 py-16 sm:p-20 text-center overflow-hidden relative">
          
          <div className="max-w-3xl mx-auto relative z-10">
            <p className="text-[#6366F1] font-medium mb-6">Confiável</p>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-8">
              Sua auditoria pessoal.
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
              Erros acontecem. Com múltiplas vendas e representadas, é difícil acompanhar tudo. 
              Tenha clareza e a certeza de que está recebendo corretamente por cada negócio fechado.
            </p>

            {/* Features list - Horizontal on Desktop */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-16">
              {features.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <span className="text-gray-900 font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <DesktopMockup
            images={[
              '/images/site/desktop/faturamento-lightpng.png',
              '/images/site/desktop/faturamento-dark.png',
            ]}
            interval={5}
            url="ucomis.com.br/recebiveis"
            className="mt-8 -mb-32"
          />

        </ScrollReveal>
      </div>
    </section>
  )
}
