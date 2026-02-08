'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PhoneMockup } from '@/components/ui/phone-mockup'
import { useEffect, useState } from 'react'

const palavras = ['certa', 'rápida', 'simples', 'precisa', 'segura']

export function Hero() {
  const [palavraAtual, setPalavraAtual] = useState(0)
  const [isChanging, setIsChanging] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Pequeno delay para garantir que o estado inicial seja renderizado
    const mountTimeout = setTimeout(() => {
      setMounted(true)
    }, 100)

    const interval = setInterval(() => {
      setIsChanging(true)
      setTimeout(() => {
        setPalavraAtual((prev) => (prev + 1) % palavras.length)
        setIsChanging(false)
      }, 300)
    }, 3000)

    return () => {
      clearTimeout(mountTimeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <section
      className="relative overflow-hidden pt-32 sm:pt-40 pb-0"
      style={{
        background: 'radial-gradient(at 49.5% 46.4%, rgb(255, 255, 255) 0px, transparent 50%), radial-gradient(at 43% 53.3%, rgb(99 33 255 / 15%) 0px, transparent 50%), radial-gradient(at 56.1% 53.3%, rgb(32 158 254 / 25%) 0px, transparent 50%) rgb(255, 255, 255)',
        mixBlendMode: 'normal'
      }}
    >

      {/* Conteúdo centralizado */}
      <div className="flex flex-col items-center justify-start px-4 sm:px-6 pt-8 sm:pt-12 pb-0">
        <div className="text-center max-w-4xl mx-auto space-y-5">
          {/* Título com palavras rotativas */}
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight transition-all ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDuration: '700ms', transitionDelay: '0ms' }}
          >
            A forma{' '}
            <span
              className={`inline-block min-w-[140px] sm:min-w-[180px] md:min-w-[220px] lg:min-w-[280px] text-left transition-all duration-[400ms] ease ${
                isChanging ? 'blur-[10px] opacity-0' : 'blur-0 opacity-100'
              }`}
            >
              <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                {palavras[palavraAtual]}
              </span>
            </span>
            <br />
            de calcular suas <span className="underline decoration-[rgb(99,33,255)] decoration-[4px] underline-offset-[14px]">comissões</span>
          </h1>

          {/* Descrição */}
          <p
            className={`text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto transition-all ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDuration: '700ms', transitionDelay: '150ms' }}
          >
            Rápido e fácil, organize suas comissões em um só lugar
          </p>

          {/* Botão CTA */}
          <div
            className={`pt-2 transition-all ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDuration: '700ms', transitionDelay: '300ms' }}
          >
            <Button
              asChild
              size="lg"
              className="bg-white hover:bg-white/90 text-landing-primary border-2 border-white rounded-full transition-all duration-300 text-lg px-8 py-6 font-semibold shadow-xl hover:shadow-2xl"
            >
              <Link href="/login">Comece agora</Link>
            </Button>
            <div className="flex items-center justify-center gap-3 mt-[25px] text-xs text-gray-400 uppercase tracking-wide font-bold">
              <span>Sem cartão</span>
              <span>|</span>
              <span>14 dias grátis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Celular centralizado - cortado pela metade */}
      <div
        className={`relative w-full flex justify-center mt-6 sm:mt-8 transition-all ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
        style={{ transitionDuration: '1000ms', transitionDelay: '500ms' }}
      >
        <PhoneMockup
          images={[
            { src: '/images/site/home/home_light.png', statusBarMode: 'light', statusBarColor: '#f9f9f9' },
            { src: '/images/site/home/home_escuro.png', statusBarMode: 'dark', statusBarColor: '#0a0a0a' },
          ]}
          interval={5}
          visiblePercent={60}
          anchor="top"
          sizes="(max-width: 640px) 300px, (max-width: 768px) 340px, (max-width: 1024px) 400px, 450px"
          priority={true}
          className="w-[300px] sm:w-[340px] md:w-[400px] lg:w-[450px] drop-shadow-2xl"
        />
      </div>
    </section>
  )
}
