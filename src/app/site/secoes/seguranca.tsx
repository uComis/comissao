import { Check, Shield, Lock, Database, KeyRound, Eye } from 'lucide-react';

const RECURSOS_SEGURANCA = [
  'Conformidade LGPD',
  'Criptografia AES-256',
  'Dados Privados',
  'Autenticação Forte',
];

const ICONES_SEGURANCA = [
  { icon: Shield, size: 120, top: '20%', left: '10%', mobileTop: '15%', mobileLeft: '20%', rotation: -15, delay: 0 },
  { icon: Lock, size: 95, top: '72%', left: '55%', mobileTop: '70%', mobileLeft: '63%', rotation: 15, delay: 1.5 },
  { icon: Check, size: 46, top: '75%', left: '30%', mobileTop: '60%', mobileLeft: '15%', rotation: 0, delay: 1 },
  { icon: Database, size: 54, top: '45%', left: '50%', mobileTop: '40%', mobileLeft: '45%', rotation: 0, delay: 0.5 },
  { icon: KeyRound, size: 48, top: '35%', left: '70%', mobileTop: '25%', mobileLeft: '67%', rotation: 0, delay: 0.8 },
  { icon: Eye, size: 52, top: '60%', left: '45%', mobileTop: '70%', mobileLeft: '40%', rotation: 0, delay: 1.2 },
];

export function Seguranca() {
  return (
    <section id="seguranca" className="pt-12 pb-12 lg:py-16 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 max-w-[1200px]">
        <div className="flex flex-col lg:grid lg:grid-cols-[40%_60%] gap-8 lg:gap-16 items-center">
          {/* Ícones flutuantes */}
          <div className="absolute lg:relative -top-[37px] -right-[90px] lg:top-0 lg:right-0 lg:left-0 flex items-center justify-center h-[200px] lg:min-h-[400px] order-2 lg:order-1 w-full lg:w-auto z-0 lg:z-auto">
            {ICONES_SEGURANCA.map((item, index) => {
              const Icon = item.icon;
              const isShield = item.icon === Shield;
              const isLock = item.icon === Lock;
              const mobileSize = isShield ? 'w-16 h-16' : isLock ? 'w-12 h-12' : 'w-9 h-9';
              return (
                <div
                  key={index}
                  className="absolute security-icon"
                  style={{
                    '--top-mobile': item.mobileTop || item.top,
                    '--left-mobile': item.mobileLeft || item.left,
                    '--top-desktop': item.top,
                    '--left-desktop': item.left,
                    top: `var(--top-mobile)`,
                    left: `var(--left-mobile)`,
                    '--rotation': `${item.rotation}deg`,
                    animation: `floatRotate ${3 + index * 0.3}s ease-in-out infinite`,
                    animationDelay: `${item.delay}s`,
                  } as React.CSSProperties & {
                    '--rotation': string;
                    '--top-mobile': string;
                    '--left-mobile': string;
                    '--top-desktop': string;
                    '--left-desktop': string;
                  }}
                >
                  <Icon
                    className={`security-icon-mobile-color ${mobileSize} lg:w-auto lg:h-auto`}
                    size={item.size}
                  />
                </div>
              );
            })}
          </div>

          {/* Conteúdo */}
          <div className="space-y-6 order-1 lg:order-2 relative z-10">
            <p className="text-sm font-medium text-landing-primary">Seguro</p>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide">
              Proteção total.
              <br />
              Privacidade garantida.
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Seu histórico de vendas e conquistas pertence exclusivamente a você.
              Nenhuma empresa, empregador ou terceiro pode acessar suas informações.
            </p>

            {/* Lista de checks */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4">
              {RECURSOS_SEGURANCA.map((recurso, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-landing-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm lg:text-lg text-landing-primary font-medium leading-tight">{recurso}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
