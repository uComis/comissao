import { Card, CardContent } from '@/components/ui/card';
import { Zap, Calculator, CalendarCheck } from 'lucide-react';

const PILARES = [
  {
    icon: Zap,
    titulo: 'Registre a venda',
    descricao: 'Poucos campos, sem burocracia. O essencial para o cálculo.',
  },
  {
    icon: Calculator,
    titulo: 'Comissão calculada na hora',
    descricao: 'O sistema aplica as regras do fornecedor e calcula automaticamente.',
  },
  {
    icon: CalendarCheck,
    titulo: 'Parcelas geradas',
    descricao: 'Saiba quanto e quando vai receber, parcela por parcela.',
  },
];

export function Metodologia() {
  return (
    <section id="solucoes" className="py-24 bg-background">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="space-y-16">
          {/* Título */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide">
              Como o{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                uComis
              </span>
              {' '}funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              Três passos. Zero planilha.
            </p>
          </div>

          {/* Os 3 Pilares */}
          <div className="grid md:grid-cols-3 gap-8">
            {PILARES.map((pilar, index) => {
              const Icon = pilar.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-xl hover:border-landing-primary/30 transition-all duration-300"
                >
                  <CardContent className="p-8 space-y-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-landing-primary/10 group-hover:bg-landing-primary/20 transition-colors">
                      <Icon className="w-8 h-8 text-landing-primary" />
                    </div>

                    <h3 className="text-xl font-bold">{pilar.titulo}</h3>

                    <p className="text-muted-foreground">{pilar.descricao}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
