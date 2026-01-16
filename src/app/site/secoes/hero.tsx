'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const ROTATING_WORDS = ['tempo', 'dinheiro', 'foco', 'sono', 'lucro']

export function Hero() {
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % ROTATING_WORDS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Texto */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Sua comissão não é uma promessa.{' '}
              <span className="text-landing-primary">É um fato.</span>
            </h1>

            <p className="text-2xl lg:text-3xl text-muted-foreground">
              Recupere seu{' '}
              <span
                className="inline-block font-bold bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent transition-all duration-500"
                key={currentWord}
              >
                {ROTATING_WORDS[currentWord]}
              </span>{' '}
              em 3 segundos.
            </p>

            <div className="flex gap-4 flex-wrap">
              <Button
                asChild
                size="lg"
                className="bg-landing-primary hover:bg-landing-primary/90 text-white text-lg px-8 py-6"
              >
                <Link href="#precos">Começar Auditoria Grátis</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link href="#solucoes">Ver o uComis em Ação</Link>
              </Button>
            </div>
          </div>

          {/* Placeholder de Vídeo */}
          <div className="relative">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-landing-gradient-start to-landing-gradient-end flex items-center justify-center text-center p-8 shadow-2xl">
              <div className="text-white space-y-2">
                <div className="text-sm font-bold uppercase tracking-wider">🎬 VÍDEO</div>
                <div className="text-lg font-medium">Loop 10 segundos</div>
                <div className="text-sm opacity-90">
                  Dashboard carregando instantaneamente
                  <br />
                  Gráfico &quot;Ganhos Auditados&quot; subindo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
