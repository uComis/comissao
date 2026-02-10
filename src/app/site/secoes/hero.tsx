'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PhoneMockup } from '@/components/ui/phone-mockup'
import { useEffect, useState } from 'react'

export function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const mountTimeout = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => {
      clearTimeout(mountTimeout)
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
          {/* Título */}
          <h1
            className={`font-bold leading-[1.1] tracking-tight transition-all ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDuration: '700ms', transitionDelay: '0ms' }}
          >
            <span className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl">
              Saiba exatamente quanto e quando vai receber —{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start via-landing-gradient-middle to-landing-gradient-end bg-clip-text text-transparent">
                controle suas comissões
              </span>
            </span>
          </h1>

          {/* Descrição */}
          <p
            className={`hidden sm:block text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto transition-all ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDuration: '700ms', transitionDelay: '150ms' }}
          >
            Cadastre suas vendas, defina as regras do fornecedor e veja comissões e parcelas calculadas automaticamente.
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
              <Link href="/login">Veja quanto você tem a receber</Link>
            </Button>
            <div className="flex items-center justify-center gap-3 mt-6 text-xs text-gray-400 uppercase tracking-wide font-bold">
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
          alt="App uComis mostrando controle de comissões e recebíveis"
          sizes="(max-width: 640px) 300px, (max-width: 768px) 340px, (max-width: 1024px) 400px, 450px"
          priority={true}
          className="w-[300px] sm:w-[340px] md:w-[400px] lg:w-[450px] drop-shadow-2xl"
        />
      </div>
    </section>
  )
}
