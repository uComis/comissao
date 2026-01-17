import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-white">
      <div className="container mx-auto px-6 py-24 max-w-[1200px]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
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
          <div className="flex flex-col gap-4 items-center">
            <Button
              asChild
              size="lg"
              className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 text-lg px-8 py-6 w-fit"
            >
              <Link href="#precos">Comece agora</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
