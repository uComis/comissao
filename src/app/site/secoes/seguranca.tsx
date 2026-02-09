'use client'

import { useState, useRef } from 'react'
import { Lock, ShieldCheck, EyeOff } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

const securityCards = [
  {
    icon: Lock,
    title: 'Criptografia',
    description: 'Seus dados são criptografados com padrão bancário (AES-256).',
  },
  {
    icon: ShieldCheck,
    title: 'Auditado',
    description: 'Infraestrutura certificada SOC 2 Type 2, auditada anualmente.',
  },
  {
    icon: EyeOff,
    title: 'Acesso restrito',
    description: 'Só você vê seus dados. Nem a gente tem acesso.',
  },
]

export function Seguranca() {
  const { ref: revealRef, isVisible } = useScrollReveal({ threshold: 0.1 });
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollPosition = scrollRef.current.scrollLeft;
    const containerWidth = scrollRef.current.offsetWidth;
    const itemWidth = containerWidth * 0.75;
    const gap = 16;
    const index = Math.round(scrollPosition / (itemWidth + gap));
    if (index !== activeIndex && index >= 0 && index < securityCards.length) {
      setActiveIndex(index);
    }
  };

  return (
    <section id="seguranca" className="py-10 sm:py-20 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header centralizado */}
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-8 sm:mb-16 space-y-4 sm:space-y-5">
          <p className="text-[#3B82F6] font-medium">Seguro</p>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
            Seus dados protegidos.<br />
            Sua paz garantida.
          </h1>

          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Usamos a mesma infraestrutura de segurança de grandes empresas de tecnologia.
            Seus dados estão criptografados e protegidos 24 horas por dia.
          </p>
        </ScrollReveal>

        {/* Cards - Desktop: grid / Mobile: peek carousel */}
        <div
          ref={(node) => {
            scrollRef.current = node;
            if (revealRef && typeof revealRef === 'object') {
              (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          onScroll={handleScroll}
          className={`
            flex md:grid md:grid-cols-3 gap-4 md:gap-6
            overflow-x-auto md:overflow-x-visible
            snap-x snap-mandatory scrollbar-hide
            -mx-6 px-[12.5vw] md:mx-0 md:px-0
          `}
        >
          {securityCards.map((card, index) => (
            <div
              key={card.title}
              className={`
                flex-shrink-0 w-[75vw] md:w-full snap-center
                bg-gray-50 rounded-2xl p-6 sm:p-8 text-center
                transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#3B82F6]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{card.title}</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Dots - apenas mobile */}
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          {securityCards.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 bg-[#3B82F6]' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
