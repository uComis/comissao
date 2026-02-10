import Image from 'next/image'
import { Zap, Calculator, Clock } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { PhoneMockup } from '@/components/ui/phone-mockup'

const features = [
  { icon: Zap, label: 'Poucos campos' },
  { icon: Calculator, label: 'Cálculo automático' },
  { icon: Clock, label: 'Parcelas na hora' },
]

export function Seamless() {
  return (
    <section className="py-10 sm:py-16 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          {/* iPhone mockup */}
          <ScrollReveal variant="slide-right" className="flex-1 flex justify-center">
            <PhoneMockup
              images={[
                { src: '/images/site/venda/venda_light.png', statusBarMode: 'light', statusBarColor: '#f9f9f9' },
              ]}
              visiblePercent={75}
              anchor="top"
              alt="Tela de cadastro de venda com cálculo automático de comissão"
              sizes="(max-width: 640px) 250px, 286px"
              className="w-[280px] sm:w-[320px] drop-shadow-2xl"
            />
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal variant="slide-left" delay={150} className="flex-1 space-y-6">
            <p className="text-[#C9A227] font-medium">Rápido</p>

            <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Lance suas vendas.<br />A comissão é calculada na hora.
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Sem formulários intermináveis. Você digita o essencial, o sistema faz o cálculo de comissão e gera as parcelas automaticamente.
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
                  src="/images/site/venda/venda_light.png"
                  alt="Cadastro de venda com cálculo automático de comissão no uComis"
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
