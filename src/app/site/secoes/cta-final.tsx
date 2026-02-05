'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const BENEFICIOS = [
  {
    titulo: 'Sem setup, zero configuração',
    descricao: 'Clique e use'
  },
  {
    titulo: '14 dias de teste grátis',
    descricao: 'Todas as funcionalidades liberadas'
  },
  {
    titulo: 'Sem cartão de crédito',
    descricao: 'Sem compromisso pra começar'
  }
];

export function CtaFinal() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section id="precos" className="py-20 sm:py-24 relative overflow-hidden bg-gradient-to-br from-[#1a1033] via-[#0f1a2e] to-[#0a0a0a]">
      {/* Elementos decorativos sutis */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="text-center space-y-12">
          {/* Título */}
          <ScrollReveal className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide text-white">
              Você sabe sua{' '}
              <span className="bg-gradient-to-r from-[#a78bfa] via-[#60a5fa] to-[#38bdf8] bg-clip-text text-transparent">
                comissão
              </span>
              {' '}desse e dos próximos meses?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Com o uComis, sua comissão deixa de ser mistério e vira fato.
            </p>
          </ScrollReveal>

          {/* Benefícios */}
          <div ref={ref} className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {BENEFICIOS.map((beneficio, index) => (
              <div
                key={index}
                className={`flex flex-col items-center text-center bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CheckCircle2 className="w-6 h-6 mb-3 text-[#60a5fa]" />
                <span className="text-sm font-bold text-white">{beneficio.titulo}</span>
                <span className="text-xs text-gray-400 mt-1">{beneficio.descricao}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <ScrollReveal delay={300} variant="scale">
            <Button
              asChild
              size="lg"
              className="bg-white hover:bg-gray-100 text-gray-900 text-lg px-8 py-3 h-auto font-bold shadow-xl rounded-full"
            >
              <Link href="/login">Comece agora grátis</Link>
            </Button>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
