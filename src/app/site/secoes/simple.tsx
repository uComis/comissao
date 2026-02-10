import Image from 'next/image'
import { PieChart, Clock, CalendarCheck } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { PhoneMockup } from '@/components/ui/phone-mockup'

const features = [
  { icon: PieChart, label: 'Receita por fornecedor' },
  { icon: Clock, label: 'Parcelas pendentes' },
  { icon: CalendarCheck, label: 'Próximos recebimentos' },
]

export function Simple() {
  return (
    <section className="py-10 sm:py-16 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Content - Left side */}
          <ScrollReveal variant="slide-right" className="flex-1 space-y-6">
            <p className="text-[#22C55E] font-medium">Visível</p>

            <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Saiba quanto vai<br />
              receber. Agora.
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Abandone a planilha de comissão. Tenha um dashboard com todos os seus recebíveis: quanto, quando e de qual fornecedor.
            </p>

            {/* Features list */}
            <ul className="space-y-3 pt-2">
              {features.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5 text-[#22C55E]" />
                  <span className="text-[#22C55E] font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>

            {/* Demo card */}
            <button className="flex items-center gap-4 mt-6 group">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/site/minhas-vendas/minhas_vendas_dark.png"
                  alt="Dashboard de comissões e recebíveis do uComis"
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
                <span className="font-semibold text-gray-900">Dashboard em tempo real</span>
                <p className="text-gray-500 text-sm">Veja como funciona</p>
              </div>
            </button>
          </ScrollReveal>

          {/* iPhone mockup - Right side */}
          <ScrollReveal variant="slide-left" delay={150} className="flex-1 flex justify-center">
            <PhoneMockup
              images={[
                { src: '/images/site/minhas-vendas/minhas_vendas_dark_cropped.png', statusBarMode: 'dark', statusBarColor: '#0a0a0a' },
              ]}
              visiblePercent={75}
              anchor="top"
              alt="Dashboard de comissões com recebíveis por fornecedor"
              sizes="(max-width: 640px) 250px, 286px"
              className="w-[280px] sm:w-[320px] drop-shadow-2xl"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
