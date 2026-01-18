'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

const palavras = ['certo', 'rápido', 'confortável', 'preciso', 'seguro']

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
    <section className="relative overflow-x-hidden bg-white min-h-[60vh] flex items-center">
      <div className="container mx-auto px-6 py-16 lg:py-24 max-w-[1200px] w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Texto à esquerda */}
          <div className="space-y-8 text-center lg:text-left lg:col-span-3 w-full">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-wide w-full">
              O jeito{' '}
              <span
                className={`inline-block min-w-[200px] lg:min-w-[280px] text-left transition-all duration-[400ms] ease ${isChanging ? 'blur-[10px] opacity-0' : 'blur-0 opacity-100'
                  }`}
              >
                <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent">
                  {palavras[palavraAtual]}
                </span>
              </span>
              <br />
              de calcular suas comissoes
            </h1>

            <p className="text-lg lg:text-xl text-gray-600">
              Não faça do controle um segundo emprego não remunerado —<br />poupe tempo
            </p>
            <div className="flex flex-col gap-4 items-center lg:items-start">
              <Button
                asChild
                size="lg"
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 text-lg px-4 py-2 w-fit"
              >
                <Link href="#precos">Comece agora</Link>
              </Button>
            </div>
          </div>

          {/* Celulares à direita - composição com profundidade */}
          <div className="relative flex items-center justify-center lg:justify-end lg:col-span-2">
            {/* iPhone vertical (dark mode) - atrás, menor */}
            <div className="relative z-10 w-[280px] lg:w-[380px] -mr-20 lg:-mr-40">
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
            <div className="relative z-20 w-[550px] lg:w-[1100px]">
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
