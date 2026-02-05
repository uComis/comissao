import Image from 'next/image'
import { Zap, Calculator, Clock } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

const features = [
  { icon: Zap, label: 'Poucos campos' },
  { icon: Calculator, label: 'Cálculo automático' },
  { icon: Clock, label: 'Parcelas na hora' },
]

export function Seamless() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          {/* iPhone mockup */}
          <ScrollReveal variant="slide-right" className="flex-1 flex justify-center">
            <div className="bg-[#f5f5f7] rounded-[40px] rounded-b-none pt-4 sm:pt-6 px-8 sm:px-12 pb-0 overflow-hidden h-[500px] sm:h-[580px]">
              <div className="relative w-[340px] sm:w-[400px]">
                <Image
                  src="/images/landing/iphone-dark-vertical.png"
                  alt="Cadastro rápido de vendas"
                  width={450}
                  height={920}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal variant="slide-left" delay={150} className="flex-1 space-y-6">
            <p className="text-[#C9A227] font-medium">Rápido</p>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Cadastre uma venda<br />em 30 segundos.
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Sem formulários intermináveis. Você digita o essencial, o sistema calcula o resto. Comissão e parcelas geradas automaticamente.
            </p>

            {/* Features list */}
            <ul className="space-y-3 pt-2">
              {features.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5 text-[#C9A227]" />
                  <span className="text-[#C9A227] font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>

            {/* Demo card */}
            <button className="flex items-center gap-4 mt-6 group">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/landing/iphone-dark-vertical.png"
                  alt="Cadastro de venda"
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="text-left">
                <h5 className="font-semibold text-gray-900">Cadastro de venda</h5>
                <p className="text-gray-500 text-sm">Veja como funciona</p>
              </div>
            </button>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
