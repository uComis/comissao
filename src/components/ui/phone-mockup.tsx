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
  /** Classes extras para o container externo */
  className?: string
}

export function PhoneMockup({
  images,
  interval = 3,
  visiblePercent = 100,
  anchor = 'top',
  statusBarMode = 'light',
  statusBarColor,
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

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        aspectRatio: `18 / ${37 * clampedPercent / 100}`,
      }}
    >
      {/* Phone frame — posicionado top ou bottom dentro do clip */}
      <div
        className={cn(
          'absolute left-0 right-0 w-full',
          anchor === 'top' ? 'top-0' : 'bottom-0'
        )}
        style={{ aspectRatio: '18 / 37' }}
      >
          {/* Corpo externo — moldura azulada (mx-1 dá espaço pros botões laterais) */}
          <div className="absolute inset-y-0 left-1 right-1 bg-gradient-to-b from-neutral-700 to-neutral-800 border border-neutral-600 p-[0.2rem]" style={{ borderRadius: '17.1%/8.1%' }}>
            {/* Botão direito (power) */}
            <div className="w-1 rounded-r-sm bg-gradient-to-r from-neutral-500 to-neutral-700 border-r border-neutral-600 absolute -right-1" style={{ top: '30%', height: '13.5%' }} />
            {/* Botões esquerdos — silent + volume up + volume down */}
            <div className="w-1 rounded-l-sm bg-gradient-to-l from-neutral-500 to-neutral-700 border-l border-neutral-600 absolute -left-1" style={{ top: '20%', height: '3.4%' }} />
            <div className="w-1 rounded-l-sm bg-gradient-to-l from-neutral-500 to-neutral-700 border-l border-neutral-600 absolute -left-1" style={{ top: '28%', height: '6.8%' }} />
            <div className="w-1 rounded-l-sm bg-gradient-to-l from-neutral-500 to-neutral-700 border-l border-neutral-600 absolute -left-1" style={{ top: '38%', height: '6.8%' }} />

            {/* Inner bezel (preto) — ref: rounded-[2.9rem] */}
            <div className="h-full w-full bg-black p-[0.5rem]" style={{ borderRadius: '17%/7.9%' }}>
              {/* Tela — ref: rounded-[2.4rem] */}
              <div className="h-full w-full overflow-hidden relative flex flex-col" style={{ borderRadius: '14.9%/6.7%' }}>
                {/* Dynamic Island — ref: w-[5rem] h-[1.4rem] mt-[0.5rem] */}
                <div className="absolute top-0 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="w-[27.8%] bg-black rounded-full" style={{ aspectRatio: '3.57 / 1', marginTop: '3.1%' }} />
                </div>

                {/* Status Bar — ref: h-[2.4rem] px-7 */}
                <div
                  className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-[7%] font-[Inter] transition-colors duration-700"
                  style={{ backgroundColor: activeBarColor, height: '6.5%' }}
                >
                  <span className={cn(
                    'text-[11px] font-semibold leading-none -ml-1 transition-colors duration-700',
                    activeBarMode === 'dark' ? 'text-white' : 'text-black'
                  )}>9:41</span>
                  <div className="flex items-center gap-[3px] -mr-1">
                    {/* Cellular */}
                    <svg width="14" height="10" viewBox="0 0 17 12" fill="none" className="opacity-90">
                      <rect x="0" y="9" width="3" height="3" rx="0.5" fill={activeBarMode === 'dark' ? 'white' : 'black'} className="transition-[fill] duration-700" />
                      <rect x="4.5" y="6" width="3" height="6" rx="0.5" fill={activeBarMode === 'dark' ? 'white' : 'black'} className="transition-[fill] duration-700" />
                      <rect x="9" y="3" width="3" height="9" rx="0.5" fill={activeBarMode === 'dark' ? 'white' : 'black'} className="transition-[fill] duration-700" />
                      <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill={activeBarMode === 'dark' ? 'white' : 'black'} className="transition-[fill] duration-700" />
                    </svg>
                    {/* WiFi */}
                    <svg width="12" height="9" viewBox="0 0 15 12" fill="none" className="opacity-90">
                      <path d="M7.5 10.5C8.33 10.5 9 11.17 9 12C9 12.83 8.33 13.5 7.5 13.5C6.67 13.5 6 12.83 6 12C6 11.17 6.67 10.5 7.5 10.5Z" fill={activeBarMode === 'dark' ? 'white' : 'black'} transform="translate(0,-3)" className="transition-[fill] duration-700" />
                      <path d="M4.5 8.5C5.3 7.7 6.35 7.25 7.5 7.25C8.65 7.25 9.7 7.7 10.5 8.5" stroke={activeBarMode === 'dark' ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" transform="translate(0,-3)" className="transition-[stroke] duration-700" />
                      <path d="M2 6C3.45 4.55 5.4 3.75 7.5 3.75C9.6 3.75 11.55 4.55 13 6" stroke={activeBarMode === 'dark' ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" transform="translate(0,-3)" className="transition-[stroke] duration-700" />
                    </svg>
                    {/* Battery */}
                    <svg width="20" height="9" viewBox="0 0 25 12" fill="none" className="opacity-90">
                      <rect x="0" y="1" width="21" height="10" rx="2" stroke={activeBarMode === 'dark' ? 'white' : 'black'} strokeWidth="1" className="transition-[stroke] duration-700" />
                      <rect x="1.5" y="2.5" width="18" height="7" rx="1" fill={activeBarMode === 'dark' ? 'white' : 'black'} className="transition-[fill] duration-700" />
                      <rect x="22" y="4" width="2" height="4" rx="0.5" fill={activeBarMode === 'dark' ? 'white' : 'black'} opacity="0.4" className="transition-[fill] duration-700" />
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
                        alt=""
                        fill
                        className={cn(
                          'object-cover object-top transition-opacity duration-700',
                          i === currentIndex ? 'opacity-100' : 'opacity-0'
                        )}
                        sizes="(max-width: 640px) 280px, 400px"
                        priority={i === 0}
                      />
                    ))}
                  </div>
                  {/* Spacer bottom — safe area do home indicator */}
                  <div className="shrink-0 h-[1.2rem]" />
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center z-20 pointer-events-none pb-[0.4rem]">
                  <div className={cn(
                    'w-[35%] h-[0.25rem] rounded-full transition-colors duration-700',
                    activeBarMode === 'dark' ? 'bg-white/70' : 'bg-black/20'
                  )} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
