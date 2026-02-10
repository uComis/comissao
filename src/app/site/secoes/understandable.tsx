import Image from 'next/image'
import { FolderOpen, Settings, List } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { PhoneMockup } from '@/components/ui/phone-mockup'

const features = [
  { icon: FolderOpen, label: 'Multi-pasta sem limites' },
  { icon: Settings, label: 'Regras por fornecedor' },
  { icon: List, label: 'Timeline unificada' },
]

export function Understandable() {
  return (
    <section className="py-10 sm:py-16 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          {/* iPhone mockup - Left side */}
          <ScrollReveal variant="slide-right" className="flex-1 flex justify-center">
            <PhoneMockup
              images={[
                { src: '/images/site/minhas-pastas/minhas-pastas-light.png', statusBarMode: 'light', statusBarColor: '#f9f9f9' },
              ]}
              visiblePercent={75}
              anchor="top"
              alt="Tela de pastas de fornecedores para representante comercial"
              sizes="(max-width: 640px) 250px, 286px"
              className="w-[280px] sm:w-[320px] drop-shadow-2xl"
            />
          </ScrollReveal>

          {/* Content - Right side */}
          <ScrollReveal variant="slide-left" delay={150} className="flex-1 space-y-6">
            <p className="text-[#F97316] font-medium">Consolidado</p>

            <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Todas as pastas.<br />
              Um só lugar.
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed max-w-md">
              Representante comercial com várias empresas? Consolide comissões de todos os fornecedores em uma única tela. Sem 5 portais, 5 logins, 5 planilhas.
            </p>

            {/* Features list */}
            <ul className="space-y-3 pt-2">
              {features.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5 text-[#F97316]" />
                  <span className="text-[#F97316] font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>

            {/* Demo card */}
            <button className="flex items-center gap-4 mt-6 group">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/site/minhas-pastas/minhas-pastas-light.png"
                  alt="Consolidação de comissões de múltiplos fornecedores no uComis"
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
                <h5 className="font-semibold text-gray-900">Consolidação de pastas</h5>
                <p className="text-gray-500 text-sm">Veja como funciona</p>
              </div>
            </button>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
