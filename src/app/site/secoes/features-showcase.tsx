import Image from 'next/image';

const FEATURES = [
  {
    label: 'Registre',
    image: '/images/landing/mobile-1.png', // Substituir depois
    alt: 'Registre vendas no uComis'
  },
  {
    label: 'Calcule',
    image: '/images/landing/mobile-2.png', // Substituir depois
    alt: 'Calcule comissões automaticamente'
  },
  {
    label: 'Controle',
    image: '/images/landing/mobile-1.png', // Substituir depois
    alt: 'Controle seus recebíveis'
  }
];

export function FeaturesShowcase() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header */}
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-16 text-center text-foreground">
          Registre, calcule, controle.
          <br />
          Tudo em um só lugar.
        </h1>

        {/* 3 Colunas - Prints de Celular */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-end">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-6"
            >
              {/* Container do Celular - Topo ou parte inferior (centro) */}
              <div className="relative w-full max-w-[380px] lg:max-w-[450px]">
                <div 
                  className="relative aspect-[381/751] overflow-hidden" 
                  style={{ 
                    clipPath: index === 1 ? 'inset(40% 0 0 0)' : 'inset(0 0 40% 0)' 
                  }}
                >
                  {/* Moldura do celular - placeholder */}
                  <div 
                    className={`absolute inset-0 border-l-[8px] border-r-[8px] border-black shadow-2xl ${
                      index === 1 
                        ? 'rounded-b-[2.5rem] border-b-[8px]' 
                        : 'rounded-t-[2.5rem] border-t-[8px]'
                    }`}
                  />
                  
                  {/* Imagem dentro do celular */}
                  <div className={`absolute inset-[8px] overflow-hidden ${
                    index === 1 ? 'rounded-b-[2rem]' : 'rounded-t-[2rem]'
                  }`}>
                    <Image
                      src={feature.image}
                      alt={feature.alt}
                      fill
                      className={`object-cover ${index === 1 ? 'object-bottom' : 'object-top'}`}
                      sizes="(max-width: 768px) 380px, 450px"
                    />
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-landing-primary" />
                <p className="text-lg font-medium text-foreground">
                  {feature.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
