import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Database } from 'lucide-react';

const SELOS = [
  {
    icon: Shield,
    label: '100% LGPD Compliant',
  },
  {
    icon: Lock,
    label: 'Criptografia AES-256',
  },
  {
    icon: Database,
    label: 'Dados Privados do Usuário',
  },
];

export function Seguranca() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Título */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Seus dados. Sua carreira.{' '}
              <span className="text-landing-primary">Sua independência.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              O uComis é uma ferramenta privada. Sua empresa não tem acesso.
              Leve seu histórico de vendas e conquistas com você para onde for.
            </p>
          </div>

          {/* Destaque de Privacidade */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-landing-primary/10 to-landing-gradient-end/10 border border-landing-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-landing-primary/20">
                <Shield className="w-8 h-8 text-landing-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Proteção Total</h3>
                <p className="text-muted-foreground">
                  Seus dados são exclusivamente seus. Nenhuma empresa,
                  empregador ou terceiro pode acessar suas informações sem sua
                  autorização explícita.
                </p>
              </div>
            </div>
          </div>

          {/* Selos de Segurança */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            {SELOS.map((selo, index) => {
              const Icon = selo.icon;
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className="px-6 py-3 text-base border-landing-primary/30 bg-landing-primary/5 hover:bg-landing-primary/10 transition-colors"
                >
                  <Icon className="w-5 h-5 mr-2 text-landing-primary" />
                  {selo.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
