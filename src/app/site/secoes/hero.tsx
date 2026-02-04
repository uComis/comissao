'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

const palavras = ['certa', 'rápida', 'simples', 'precisa', 'segura']

export function Hero() {
  const [palavraAtual, setPalavraAtual] = useState(0)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsChanging(true)
      setTimeout(() => {
        setPalavraAtual((prev) => (prev + 1) % palavras.length)
        setIsChanging(false)
      }, 300) // Tempo do fade durante a transição
    }, 3000) // Muda a cada 3 segundos

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-x-hidden bg-white min-h-[75vh] lg:min-h-[60vh] flex items-center pt-28 pb-16 lg:pt-24">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 lg:py-16 max-w-[1200px] w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {/* Texto à esquerda */}
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left lg:col-span-3 w-full">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-wide w-full">
              A forma{' '}
              <span
                className={`inline-block w-[160px] sm:w-[200px] lg:w-[280px] text-left transition-all duration-[400ms] ease ${isChanging ? 'blur-[10px] opacity-0' : 'blur-0 opacity-100'
                  }`}
              >
                <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                  {palavras[palavraAtual]}
                </span>
              </span>
              <br />
              de calcular suas comissões
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
              Não faça do controle um segundo emprego não remunerado —<br className="hidden sm:block" />poupe tempo
            </p>
            <div className="flex flex-col gap-4 items-center lg:items-start pt-2">
              <Button
                asChild
                size="lg"
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 text-base sm:text-lg px-6 py-2 w-fit"
              >
                <Link href="/login">Comece agora</Link>
              </Button>
            </div>
          </div>

          {/* Celulares à direita - composição com profundidade */}
          <div className="hidden lg:flex relative items-center justify-center lg:justify-end lg:col-span-2 w-full max-w-full overflow-hidden">
            {/* iPhone vertical (dark mode) - atrás, menor */}
            <div className="relative z-10 w-[200px] sm:w-[240px] lg:w-[380px] -mr-8 sm:-mr-12 lg:-mr-40">
              <Image
                src="/images/landing/iphone-dark-vertical.png"
                alt="uComis app modo escuro"
                width={380}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
            {/* Celular diagonal (light mode) - na frente, maior */}
            <div className="relative z-20 w-[300px] sm:w-[400px] lg:w-[1100px]">
              <Image
                src="/images/landing/celular-diagonal-deitado.png"
                alt="uComis app modo claro"
                width={1100}
                height={733}
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
