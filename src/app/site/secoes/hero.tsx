'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
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
    <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden bg-white">
      <div className="container mx-auto px-6 py-24 max-w-[1200px]">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Texto */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Sua comissão não é uma promessa, é um{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent font-bold">
                fato
              </span>
            </h1>

            <p className="text-2xl lg:text-3xl text-gray-600">
              Suas vendas em tempo real garantindo a{' '}
              <span className="bg-gradient-to-r from-landing-gradient-start to-landing-gradient-end bg-clip-text text-transparent font-semibold">
                precisão absoluta
              </span>{' '}
              da sua receita
            </p>
            <div className="flex flex-col gap-4">
              <Button
                asChild
                size="lg"
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 text-lg px-8 py-6 w-fit"
              >
                <Link href="#precos">Comece agora</Link>
              </Button>
            </div>
          </div>

          {/* Imagem Principal */}
          <div className="relative">
            <div className="aspect-video rounded-2xl overflow-hidden">
              <Image
                src="https://cdn.prod.website-files.com/64b698ed7445c8249cfdee49/655bc7ce594d1d938fea7cf2_main_image.webp"
                alt="Dashboard uComis"
                width={1200}
                height={675}
                className="w-full h-full object-contain object-top"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
