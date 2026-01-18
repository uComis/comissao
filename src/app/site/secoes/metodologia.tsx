import { Card, CardContent } from '@/components/ui/card';
import { Zap, Cog, Lock } from 'lucide-react';

const PILARES = [
  {
    icon: Zap,
    titulo: 'Captura Instantânea',
    descricao: 'Registre a venda no calor do fechamento.',
  },
  {
    icon: Cog,
    titulo: 'Verificação Contínua',
    descricao: 'O AuditCore™ confere os valores na hora.',
  },
  {
    icon: Lock,
    titulo: 'Trava de Segurança (Truth-Lock)',
    descricao: 'Sua comissão protegida e indiscutível.',
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
              Conheça a{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                Auditoria Cinética™
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              O motor que nunca dorme.
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
