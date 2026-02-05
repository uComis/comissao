'use client'

import Image from 'next/image';
import { FileSpreadsheet, Layers, CalendarCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const FEATURES = [
  {
    label: 'Sem planilha',
    icon: FileSpreadsheet,
    color: 'text-landing-primary', // Azul padrão
    image: '/images/landing/mobile-1.png', // Substituir depois
    alt: 'Cadastro simples, sem planilhas'
  },
  {
    label: 'Várias pastas, 1 tela',
    icon: Layers,
    color: '#67C23A', // Verde
    image: '/images/landing/mobile-2.png', // Substituir depois
    alt: 'Todas as pastas consolidadas em uma tela'
  },
  {
    label: 'Zero surpresas',
    icon: CalendarCheck,
    color: '#E6A23C', // Laranja
    image: '/images/landing/mobile-1.png', // Substituir depois
    alt: 'Saiba exatamente quando vai receber'
  }
];

export function FeaturesShowcase() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section className="py-20 sm:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header */}
        <ScrollReveal>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide mb-16 text-center text-foreground">
            Tudo em um só lugar.
          </h1>
        </ScrollReveal>

        {/* 3 Colunas - Prints de Celular */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className={`relative flex flex-col bg-gradient-to-b from-background via-muted/20 to-background rounded-lg overflow-hidden transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                aspectRatio: '1 / 1',
                transitionDelay: `${index * 150}ms`
              }}
            >
              {/* Título no topo - apenas para esquerda e direita */}
              {index !== 1 && (
                <div className="pt-8 px-10 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <feature.icon
                      className={`w-5 h-5 ${feature.color.startsWith('#') ? '' : feature.color}`}
                      style={feature.color.startsWith('#') ? { color: feature.color } : undefined}
                    />
                    <h3
                      className={`text-base lg:text-lg font-bold ${feature.color.startsWith('#') ? '' : feature.color}`}
                      style={feature.color.startsWith('#') ? { color: feature.color } : undefined}
                    >
                      {feature.label}
                    </h3>
                  </div>
                </div>
              )}

              {/* Celular - pequeno, 60% da largura do card */}
              <div
                className={`relative w-full flex justify-center ${index === 1 ? '' : 'flex-1 mt-auto'}`}
              >
                <div
                  className="relative overflow-hidden w-[60%]"
                  style={{
                    aspectRatio: '381 / 450.6' // 60% da altura original (751 * 0.6)
                  }}
                >
                  {/* Celular completo dentro, cortado visualmente */}
                  <div
                    className={`absolute inset-0 w-full ${index === 1 ? 'bottom-0 top-auto' : 'top-0 bottom-auto'}`}
                    style={{
                      aspectRatio: '381 / 751',
                      clipPath: index === 1 ? 'inset(40% 0 0 0)' : 'inset(0 0 40% 0)',
                      height: '166.67%' // 100% / 0.6 para compensar clipPath
                    }}
                  >
                    {/* Moldura do celular - placeholder */}
                    {index === 1 ? (
                      <div className="absolute inset-0 rounded-b-[2.5rem] border-b-[8px] border-l-[8px] border-r-[8px] border-black shadow-2xl" />
                    ) : (
                      <div className="absolute inset-0 rounded-t-[2.5rem] border-t-[8px] border-l-[8px] border-r-[8px] border-black shadow-2xl" />
                    )}

                    {/* Imagem dentro do celular */}
                    <div className={`absolute inset-[8px] overflow-hidden ${index === 1 ? 'rounded-b-[2rem]' : 'rounded-t-[2rem]'}`}>
                      <Image
                        src={feature.image}
                        alt={feature.alt}
                        fill
                        className={`object-cover ${index === 1 ? 'object-bottom' : 'object-top'}`}
                        sizes="(max-width: 768px) 380px, 450px"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Título embaixo - apenas para centro */}
              {index === 1 && (
                <div className="pb-8 px-10 mt-6">
                  <div className="flex items-center justify-center gap-3">
                    <feature.icon
                      className={`w-5 h-5 ${feature.color.startsWith('#') ? '' : feature.color}`}
                      style={feature.color.startsWith('#') ? { color: feature.color } : undefined}
                    />
                    <h3
                      className={`text-base lg:text-lg font-bold ${feature.color.startsWith('#') ? '' : feature.color}`}
                      style={feature.color.startsWith('#') ? { color: feature.color } : undefined}
                    >
                      {feature.label}
                    </h3>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
