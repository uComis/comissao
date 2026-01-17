import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-white">
      <div className="container mx-auto px-6 py-24 max-w-[1200px]">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Texto à esquerda */}
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Sua comissão não é uma promessa, é um{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent font-bold">
                fato
              </span>
            </h1>

            <p className="text-2xl lg:text-4xl text-gray-600">
              Suas vendas em tempo real garantindo a{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent font-semibold">
                precisão absoluta
              </span>{' '}
              da sua receita
            </p>
            <div className="flex flex-col gap-4 items-center lg:items-start">
              <Button
                asChild
                size="lg"
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 text-lg px-8 py-6 w-fit"
              >
                <Link href="#precos">Comece agora</Link>
              </Button>
            </div>
          </div>

          {/* Imagens dos celulares à direita - sobrepostos */}
          <div className="relative flex items-center justify-center lg:justify-end min-h-[700px]">
            {/* Celular 1 - esquerda (light mode, menor, atrás) */}
            <div className="relative z-10 w-[260px] mr-16">
              <Image
                src="/images/landing/mobile1.png"
                alt="Mobile modo claro"
                width={300}
                height={600}
                className="w-full h-auto"
                priority
              />
            </div>
            {/* Celular 2 - direita (dark mode, maior, na frente) */}
            <div className="absolute z-20 w-[340px] top-12 -left-12">
              <Image
                src="/images/landing/mobile2.png"
                alt="Mobile modo escuro"
                width={300}
                height={600}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
