import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const BENEFICIOS = [
  'Setup instantâneo em menos de 2 minutos',
  '14 dias de teste grátis',
  'Todas as funcionalidades liberadas',
  'Sem cartão de crédito necessário',
];

export function CtaFinal() {
  return (
    <section id="precos" className="py-24 bg-gradient-to-br from-landing-gradient-start to-landing-gradient-end text-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="text-center space-y-12">
          {/* Título */}
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl font-bold">
              Pronto para recuperar sua{' '}
              <span className="underline decoration-4 underline-offset-8">
                paz mental?
              </span>
            </h2>
            <p className="text-xl lg:text-2xl opacity-90">
              Pare de perder tempo com planilhas. Comece a confiar nos seus
              números hoje.
            </p>
          </div>

          {/* Benefícios */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {BENEFICIOS.map((beneficio, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-left bg-white/10 backdrop-blur-sm rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{beneficio}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-landing-primary hover:bg-white/90 text-xl px-12 py-8 h-auto font-bold shadow-2xl"
            >
              <Link href="/login">Começar Auditoria Grátis</Link>
            </Button>
            <p className="text-sm opacity-75">
              Cancele quando quiser. Sem pegadinhas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
