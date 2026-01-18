import { Check, Shield, Lock, Database, KeyRound, Eye } from 'lucide-react';

const RECURSOS_SEGURANCA = [
  'Conformidade LGPD',
  'Criptografia AES-256',
  'Dados Privados',
  'Sem Acesso Não Autorizado',
  'Autenticação Forte',
];

const ICONES_SEGURANCA = [
  { icon: Shield, size: 84, top: '20%', left: '30%', rotation: -15, delay: 0 },
  { icon: Lock, size: 58, top: '62%', left: '66%', rotation: 15, delay: 1.5 },
  { icon: Check, size: 36, top: '55%', left: '35%', rotation: 0, delay: 1 },
  { icon: Database, size: 44, top: '35%', left: '55%', rotation: 0, delay: 0.5 },
  { icon: KeyRound, size: 38, top: '25%', left: '70%', rotation: 0, delay: 0.8 },
  { icon: Eye, size: 42, top: '50%', left: '50%', rotation: 0, delay: 1.2 },
];

export function Seguranca() {
  return (
    <section id="seguranca" className="py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Ícones flutuantes */}
          <div className="relative flex items-center justify-center min-h-[400px]">
            {ICONES_SEGURANCA.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    top: item.top,
                    left: item.left,
                    '--rotation': `${item.rotation}deg`,
                    animation: `floatRotate ${3 + index * 0.3}s ease-in-out infinite`,
                    animationDelay: `${item.delay}s`,
                  } as React.CSSProperties}
                >
                  <Icon 
                    className="text-landing-primary" 
                    size={item.size}
                  />
                </div>
              );
            })}
          </div>

          {/* Conteúdo */}
          <div className="space-y-6">
            <p className="text-sm font-medium text-landing-primary">Seguro</p>

            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Proteção total.
              <br />
              Privacidade garantida.
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Seu histórico de vendas e conquistas pertence exclusivamente a você. 
              Nenhuma empresa, empregador ou terceiro pode acessar suas informações 
              sem sua permissão explícita.
            </p>

            {/* Lista de checks */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {RECURSOS_SEGURANCA.map((recurso, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-landing-primary flex-shrink-0" />
                  <span className="text-lg text-landing-primary font-medium">{recurso}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
