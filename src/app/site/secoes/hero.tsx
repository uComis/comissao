import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-x-hidden bg-white min-h-[60vh] flex items-center">
      <div className="container mx-auto px-6 py-16 lg:py-24 max-w-[1200px] w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Texto à esquerda */}
          <div className="space-y-8 text-center lg:text-left lg:col-span-3 w-full">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-wide w-full">
              O jeito certo<br />de calcular suas comissoes
            </h1>

            <p className="text-lg lg:text-xl text-gray-600">
              Não faça do controle um segundo emprego não remunerado —<br />poupe tempo
            </p>
            <div className="flex flex-col gap-4 items-center lg:items-start">
              <Button
                asChild
                size="lg"
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 text-lg px-6 py-3 w-fit"
              >
                <Link href="#precos">Comece agora</Link>
              </Button>
            </div>
          </div>

          {/* Celulares à direita - composição com profundidade */}
          <div className="relative flex items-center justify-center lg:justify-end lg:col-span-2">
            {/* iPhone vertical (dark mode) - atrás, menor */}
            <div className="relative z-10 w-[200px] lg:w-[240px] -mr-16 lg:-mr-24">
              <Image
                src="/images/landing/iphone-dark-vertical.png"
                alt="uComis app modo escuro"
                width={240}
                height={500}
                className="w-full h-auto"
                priority
              />
            </div>
            {/* Celular diagonal (light mode) - na frente, maior */}
            <div className="relative z-20 w-[360px] lg:w-[520px]">
              <Image
                src="/images/landing/celular-diagonal-deitado.png"
                alt="uComis app modo claro"
                width={520}
                height={350}
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
