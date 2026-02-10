'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface PhoneImage {
  src: string
  statusBarMode?: 'light' | 'dark'
  statusBarColor?: string
}

interface PhoneMockupProps {
  /** Array de imagens (string ou objeto com config de status bar) */
  images: (string | PhoneImage)[]
  /** Segundos por imagem no carrossel (padrão: 3) */
  interval?: number
  /** Porcentagem visível do celular (1-100, padrão: 100) */
  visiblePercent?: number
  /** Qual parte do celular fica visível (padrão: 'top') */
  anchor?: 'top' | 'bottom'
  /** Cor padrão dos ícones/texto da status bar (padrão: 'light') */
  statusBarMode?: 'light' | 'dark'
  /** Cor padrão de fundo da status bar (padrão: transparente) */
  statusBarColor?: string
  /** Hint de tamanho para o browser (padrão: '(max-width: 640px) 280px, 400px') */
  sizes?: string
  /** Se a primeira imagem deve carregar com prioridade (LCP) */
  priority?: boolean
  /** Texto alt para as imagens (acessibilidade e SEO) */
  alt?: string
  /** Classes extras para o container externo */
  className?: string
}

export function PhoneMockup({
  images,
  interval = 3,
  visiblePercent = 100,
  anchor = 'top',
  statusBarMode = 'light',
  sizes = '(max-width: 640px) 250px, 357px',
  statusBarColor,
  priority = false,
  alt = '',
  className,
}: PhoneMockupProps) {
  // Normaliza para PhoneImage[]
  const normalizedImages: PhoneImage[] = images.map((img) =>
    typeof img === 'string' ? { src: img } : img
  )

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (normalizedImages.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % normalizedImages.length)
    }, interval * 1000)

    return () => clearInterval(timer)
  }, [normalizedImages.length, interval])

  const clampedPercent = Math.min(100, Math.max(1, visiblePercent))

  // Status bar resolve por imagem, fallback para props globais
  const currentImage = normalizedImages[currentIndex]
  const activeBarMode = currentImage?.statusBarMode ?? statusBarMode
  const activeBarColor = currentImage?.statusBarColor ?? statusBarColor

  const barFill = activeBarMode === 'dark' ? 'white' : 'black'

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        aspectRatio: `18 / ${37 * clampedPercent / 100}`,
      }}
    >
      {/* Phone frame — container query para escala proporcional */}
      <div
        className={cn(
          'absolute left-0 right-0 w-full',
          anchor === 'top' ? 'top-0' : 'bottom-0'
        )}
        style={{ aspectRatio: '18 / 37', containerType: 'inline-size' }}
      >
          {/* Corpo externo — moldura (cqw escala com largura do frame) */}
          <div
            className="absolute inset-y-0 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600"
            style={{ left: '1.4cqw', right: '1.4cqw', padding: '1.1cqw', borderRadius: '17.1%/8.1%' }}
          >
            {/* Botão direito (power) */}
            <div
              className="rounded-r-sm bg-gradient-to-r from-neutral-500 to-neutral-700 border-r border-neutral-600 absolute"
              style={{ width: '1.4cqw', right: '-1.4cqw', top: '30%', height: '13.5%' }}
            />
            {/* Botões esquerdos — silent + volume up + volume down */}
            <div
              className="rounded-l-sm bg-gradient-to-l from-neutral-500 to-neutral-700 border-l border-neutral-600 absolute"
              style={{ width: '1.4cqw', left: '-1.4cqw', top: '20%', height: '3.4%' }}
            />
            <div
              className="rounded-l-sm bg-gradient-to-l from-neutral-500 to-neutral-700 border-l border-neutral-600 absolute"
              style={{ width: '1.4cqw', left: '-1.4cqw', top: '28%', height: '6.8%' }}
            />
            <div
              className="rounded-l-sm bg-gradient-to-l from-neutral-500 to-neutral-700 border-l border-neutral-600 absolute"
              style={{ width: '1.4cqw', left: '-1.4cqw', top: '38%', height: '6.8%' }}
            />

            {/* Inner bezel (preto) */}
            <div className="h-full w-full bg-black" style={{ padding: '2.85cqw', borderRadius: '17%/7.9%' }}>
              {/* Tela */}
              <div className="h-full w-full overflow-hidden relative flex flex-col" style={{ borderRadius: '14.9%/6.7%' }}>
                {/* Dynamic Island */}
                <div className="absolute top-0 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="w-[27.8%] bg-black rounded-full" style={{ aspectRatio: '3.57 / 1', marginTop: '3.1%' }} />
                </div>

                {/* Status Bar */}
                <div
                  className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-[7%] font-[Inter] transition-colors duration-700"
                  style={{ backgroundColor: activeBarColor, height: '6.5%' }}
                >
                  <span
                    className={cn(
                      'font-semibold leading-none transition-colors duration-700',
                      activeBarMode === 'dark' ? 'text-white' : 'text-black'
                    )}
                    style={{ fontSize: '3.9cqw', marginLeft: '-0.4cqw' }}
                  >9:41</span>
                  <div className="flex items-center" style={{ gap: '1cqw', marginRight: '-0.4cqw' }}>
                    {/* Cellular */}
                    <svg viewBox="0 0 17 12" fill="none" className="opacity-90" style={{ width: '5cqw', height: '3.6cqw' }}>
                      <rect x="0" y="9" width="3" height="3" rx="0.5" fill={barFill} className="transition-[fill] duration-700" />
                      <rect x="4.5" y="6" width="3" height="6" rx="0.5" fill={barFill} className="transition-[fill] duration-700" />
                      <rect x="9" y="3" width="3" height="9" rx="0.5" fill={barFill} className="transition-[fill] duration-700" />
                      <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill={barFill} className="transition-[fill] duration-700" />
                    </svg>
                    {/* WiFi */}
                    <svg viewBox="0 0 15 12" fill="none" className="opacity-90" style={{ width: '4.3cqw', height: '3.2cqw' }}>
                      <path d="M7.5 10.5C8.33 10.5 9 11.17 9 12C9 12.83 8.33 13.5 7.5 13.5C6.67 13.5 6 12.83 6 12C6 11.17 6.67 10.5 7.5 10.5Z" fill={barFill} transform="translate(0,-3)" className="transition-[fill] duration-700" />
                      <path d="M4.5 8.5C5.3 7.7 6.35 7.25 7.5 7.25C8.65 7.25 9.7 7.7 10.5 8.5" stroke={barFill} strokeWidth="1.3" strokeLinecap="round" transform="translate(0,-3)" className="transition-[stroke] duration-700" />
                      <path d="M2 6C3.45 4.55 5.4 3.75 7.5 3.75C9.6 3.75 11.55 4.55 13 6" stroke={barFill} strokeWidth="1.3" strokeLinecap="round" transform="translate(0,-3)" className="transition-[stroke] duration-700" />
                    </svg>
                    {/* Battery */}
                    <svg viewBox="0 0 25 12" fill="none" className="opacity-90" style={{ width: '7.1cqw', height: '3.2cqw' }}>
                      <rect x="0" y="1" width="21" height="10" rx="2" stroke={barFill} strokeWidth="1" className="transition-[stroke] duration-700" />
                      <rect x="1.5" y="2.5" width="18" height="7" rx="1" fill={barFill} className="transition-[fill] duration-700" />
                      <rect x="22" y="4" width="2" height="4" rx="0.5" fill={barFill} opacity="0.4" className="transition-[fill] duration-700" />
                    </svg>
                  </div>
                </div>

                {/* Conteúdo — carrossel de imagens */}
                <div className="relative w-full h-full bg-white flex flex-col">
                  {/* Spacer topo — empurra abaixo da status bar */}
                  <div className="shrink-0" style={{ height: '6.5%' }} />
                  <div className="relative flex-1">
                    {normalizedImages.map((img, i) => (
                      <Image
                        key={img.src}
                        src={img.src}
                        alt={alt}
                        fill
                        className={cn(
                          'object-cover transition-opacity duration-700',
                          anchor === 'top' ? 'object-top' : 'object-bottom',
                          i === currentIndex ? 'opacity-100' : 'opacity-0'
                        )}

                        sizes={sizes}
                        priority={priority && i === 0}
                      />
                    ))}
                  </div>
                  {/* Spacer bottom — safe area do home indicator */}
                  <div className="shrink-0" style={{ height: '6.85cqw' }} />
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center z-20 pointer-events-none" style={{ paddingBottom: '2.3cqw' }}>
                  <div
                    className={cn(
                      'w-[35%] rounded-full transition-colors duration-700',
                      activeBarMode === 'dark' ? 'bg-white/70' : 'bg-black/20'
                    )}
                    style={{ height: '1.4cqw' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
