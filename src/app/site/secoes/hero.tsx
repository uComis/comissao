import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-white">
      <div className="container mx-auto px-6 py-24 max-w-[1200px]">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Texto à esquerda */}
          <div className="space-y-8 text-center lg:text-left lg:col-span-3 w-full">
            <h1 className="text-4xl lg:text-6xl font-bold leading-none tracking-wide w-full">
              O jeito certo de calcular suas comissoes
            </h1>

            <p className="text-lg lg:text-xl text-gray-600">
              Suas vendas em tempo real garantindo a precisão absoluta da sua receita
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

          {/* Celulares à direita - composição com profundidade */}
          <div className="relative flex items-center justify-center lg:justify-end min-h-[700px] lg:col-span-2">
            {/* iPhone vertical (dark mode) - atrás, menor */}
            <div className="relative z-10 w-[160px] lg:w-[180px] -mr-8 lg:-mr-12">
              <Image
                src="/images/landing/iphone-dark-vertical.png"
                alt="uComis app modo escuro"
                width={180}
                height={400}
                className="w-full h-auto"
                priority
              />
            </div>
            {/* Celular diagonal (light mode) - na frente, maior */}
            <div className="relative z-20 w-[280px] lg:w-[380px]">
              <Image
                src="/images/landing/celular-diagonal-deitado.png"
                alt="uComis app modo claro"
                width={380}
                height={250}
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
