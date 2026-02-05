import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

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
  return (
    <section id="precos" className="py-20 sm:py-24 bg-gray-50 relative overflow-hidden">
      {/* Elementos decorativos sutis - mesmo padrão do problema.tsx */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="text-center space-y-12">
          {/* Título */}
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide">
              Você sabe sua{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                comissão
              </span>
              {' '}desse e dos próximos meses?
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Com o uComis, sua comissão deixa de ser mistério e vira fato.
            </p>
          </div>

          {/* Benefícios */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {BENEFICIOS.map((beneficio, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center bg-white rounded-lg p-5 border border-gray-200 hover:border-landing-primary/30 hover:shadow-md transition-all"
              >
                <CheckCircle2 className="w-6 h-6 mb-3 text-landing-primary" />
                <span className="text-sm font-bold text-foreground">{beneficio.titulo}</span>
                <span className="text-xs text-muted-foreground mt-1">{beneficio.descricao}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button
              asChild
              size="lg"
              className="bg-landing-primary hover:bg-landing-primary/90 text-white text-lg px-6 py-3 h-auto font-bold shadow-xl rounded-full"
            >
              <Link href="/login">Comece agora grátis</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
