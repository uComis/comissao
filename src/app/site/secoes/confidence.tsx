import Image from 'next/image'
import { CheckCircle2, Search, Scale } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

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

          {/* Desktop/Browser Mockup */}
          <div className="relative max-w-5xl mx-auto mt-8 -mb-32 shadow-2xl rounded-t-xl overflow-hidden border border-gray-200/60 bg-white">
             {/* Browser Window Header */}
             <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto bg-white px-3 py-1 rounded-md text-xs text-gray-400 font-medium w-64 text-center border border-gray-200">
                  ucomis.com.br/auditoria
                </div>
             </div>
             
             {/* Content Image */}
             <div className="relative aspect-[16/9] w-full bg-white">
                <Image
                  src="/images/landing/desktop-audit.png"
                  alt="Painel de Auditoria Desktop"
                  width={1200}
                  height={675}
                  className="w-full h-full object-cover object-top opacity-50 grayscale hover:grayscale-0 transition-all duration-700" 
                />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-400 font-medium bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm">
                      Visualização Desktop (Em breve)
                    </p>
                 </div>
             </div>
          </div>

        </ScrollReveal>
      </div>
    </section>
  )
}
