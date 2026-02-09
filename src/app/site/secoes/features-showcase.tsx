'use client'

import { useState, useRef, useEffect } from 'react';

import { BarChart3, Zap, Layers, type LucideIcon } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { PhoneMockup } from '@/components/ui/phone-mockup';

interface Feature {
  title: string;
  subtitle: string;
  color: string;
  image: string;
  alt: string;
  icon: LucideIcon;
  useMockup?: boolean;
  statusBarMode?: 'light' | 'dark';
  statusBarColor?: string;
}


const FEATURES: Feature[] = [
  {
    title: 'Analítico',
    subtitle: 'Visão estratégica dos seus ganhos',
    color: 'text-landing-primary',
    image: '/images/site/meus clientes/meus-clientes-light.png',
    alt: 'Comparativo de comissões por cliente e pasta',
    icon: BarChart3,
    useMockup: true,
  },
  {
    title: 'Ágil',
    subtitle: 'Registro de vendas em segundos',
    color: '#67C23A',
    image: '/images/site/valor/valor-light.png',
    alt: 'Lançamento de valor com cálculo de comissão',
    icon: Zap,
    useMockup: true,
  },
  {
    title: 'Flexível',
    subtitle: 'Regras personalizadas para você',
    color: '#E6A23C',
    image: '/images/site/regra/regra-dark.png',
    alt: 'Configuração flexível de regras de comissão',
    icon: Layers,
    useMockup: true,
    statusBarMode: 'dark',
    statusBarColor: '#0a0a0a'
  }
];

export function FeaturesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Autoplay Effect
  useEffect(() => {
    // Only autoplay on mobile and if not manually paused by interaction
    const checkMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
    if (!checkMobile() || isPaused) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      
      const nextIndex = (activeIndex + 1) % FEATURES.length;
      const containerWidth = scrollRef.current.offsetWidth;
      // Item width is 85vw on mobile + gap
      const itemWidth = containerWidth * 0.85;
      
      scrollRef.current.scrollTo({
        left: nextIndex * (itemWidth + 24), // 24 is the gap-6
        behavior: 'smooth'
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIndex, isPaused]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollPosition = scrollRef.current.scrollLeft;
    const containerWidth = scrollRef.current.offsetWidth;
    const isMobile = window.innerWidth < 768;
    const itemWidth = isMobile ? containerWidth * 0.85 : containerWidth / 3;
    const gap = isMobile ? 24 : 0; // gap-6 is 24px
    
    const index = Math.round(scrollPosition / (itemWidth + gap));
    if (index !== activeIndex && index >= 0 && index < FEATURES.length) {
      setActiveIndex(index);
    }
  };

  const stopAutoplay = () => {
    if (!isPaused) setIsPaused(true);
  };


  return (
    <section className="py-10 sm:py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-[1200px]">
        
        {/* Header Centralizado */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <ScrollReveal>
            <p className="text-landing-primary font-medium">Tudo em um só lugar</p>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              Visão analítica, lançamento ágil e regras flexíveis.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
              Sua representação comercial completa. Compare resultados, registre vendas rapidamente e gerencie regras complexas de comissão sem planilhas.
            </p>
          </ScrollReveal>
        </div>



        {/* 3 Colunas Grid (Desktop) / Carousel (Mobile) */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={stopAutoplay}
          onMouseDown={stopAutoplay}
          className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0"
        >

          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className={`relative flex flex-col flex-shrink-0 w-[85vw] md:w-full snap-center bg-gradient-to-b from-background via-muted/20 to-background rounded-3xl overflow-hidden ${
                index === 1 ? 'flex-col-reverse pt-0 pb-6' : 'pt-6 pb-0'
              }`}
              style={{
                aspectRatio: '1 / 1.2',
              }}
            >
              {/* Ícone e Palavra - Pequeno e Discreto */}
              <div className={`flex justify-center px-6 ${index === 1 ? 'mb-0 mt-4' : 'mb-4 mt-0'}`}>
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-muted/50 transition-all duration-300 hover:border-landing-primary/30"
                  style={{ 
                    backgroundColor: feature.color.startsWith('#') ? `${feature.color}08` : 'rgba(var(--landing-primary-rgb), 0.05)',
                  }}
                >
                  <feature.icon 
                    className="w-3.5 h-3.5" 
                    style={{ color: feature.color.startsWith('#') ? feature.color : 'var(--landing-primary)' }} 
                  />
                  <span
                    className="text-[10px] lg:text-xs font-semibold"
                    style={{ color: feature.color.startsWith('#') ? feature.color : 'var(--landing-primary)' }}
                  >
                    {feature.title}
                  </span>
                </div>
              </div>

              {/* Phone Mockup */}
              <div className={`relative w-full flex justify-center ${index === 1 ? 'mb-auto mt-0' : 'mt-auto mb-0'}`}>
                <PhoneMockup
                  images={[{
                    src: feature.image,
                    statusBarMode: feature.statusBarMode || 'light',
                    statusBarColor: feature.statusBarColor || '#f9f9f9'
                  }]}
                  visiblePercent={70}
                  anchor={index === 1 ? 'bottom' : 'top'}
                  sizes="(max-width: 768px) 200px, 240px"
                  className="w-[60%] sm:w-[220px] lg:w-[240px] drop-shadow-2xl"
                />
              </div>
            </div>
          ))}






        </div>

        {/* Indicators (Dots) - Apenas Mobile */}
        <div className="flex justify-center gap-2 mt-8 md:hidden">
          {FEATURES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-8 bg-landing-primary' : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
