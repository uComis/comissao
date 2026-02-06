'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface PhoneMockupProps {
  /** Array de imagens para exibir na tela do celular */
  images: string[]
  /** Segundos por imagem no carrossel (padrão: 3) */
  interval?: number
  /** Porcentagem visível do celular (1-100, padrão: 100) */
  visiblePercent?: number
  /** Qual parte do celular fica visível (padrão: 'top') */
  anchor?: 'top' | 'bottom'
  /** Cor dos ícones/texto da status bar (padrão: 'light') */
  statusBarMode?: 'light' | 'dark'
  /** Cor de fundo da status bar (padrão: transparente) */
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
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval * 1000)

    return () => clearInterval(timer)
  }, [images.length, interval])

  const clampedPercent = Math.min(100, Math.max(1, visiblePercent))

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
          <div className="absolute inset-y-0 left-1 right-1 bg-gradient-to-b from-blue-100 to-blue-200 border border-blue-300 rounded-[3rem] p-[0.2rem]">
            {/* Botão direito (power) */}
            <div className="w-1 h-20 rounded-r-sm bg-gradient-to-r from-neutral-400 via-blue-300 to-blue-300 border-r border-blue-100 absolute -right-1 top-[30%]" />
            {/* Botões esquerdos (volume + silent) */}
            <div className="w-1 h-10 rounded-l-sm bg-gradient-to-l from-neutral-400 via-blue-300 to-blue-300 border-l border-blue-100 absolute -left-1 top-[38%]" />
            <div className="w-1 h-10 rounded-l-sm bg-gradient-to-l from-neutral-400 via-blue-300 to-blue-300 border-l border-blue-100 absolute -left-1 top-[28%]" />
            <div className="w-1 h-5 rounded-l-sm bg-gradient-to-l from-neutral-400 via-blue-300 to-blue-300 border-l border-blue-100 absolute -left-1 top-[20%]" />

            {/* Inner bezel (preto) */}
            <div className="h-full w-full bg-black rounded-[2.9rem] p-[0.5rem]">
              {/* Tela */}
              <div className="h-full w-full rounded-[2.4rem] overflow-hidden relative flex flex-col">
                {/* Dynamic Island */}
                <div className="absolute top-0 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="w-[5rem] h-[1.4rem] bg-black mt-[0.5rem] rounded-full" />
                </div>

                {/* Status Bar */}
                <div
                  className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between h-[2.4rem] px-7 font-[Inter]"
                  style={{ backgroundColor: statusBarColor }}
                >
                  <span className={cn(
                    'text-[10px] font-semibold -ml-1',
                    statusBarMode === 'dark' ? 'text-white' : 'text-black'
                  )}>9:41</span>
                  <div className="flex items-center gap-[3px] -mr-1">
                    {/* WiFi */}
                    <svg width="12" height="9" viewBox="0 0 15 12" fill="none" className="opacity-90">
                      <path d="M7.5 10.5C8.33 10.5 9 11.17 9 12C9 12.83 8.33 13.5 7.5 13.5C6.67 13.5 6 12.83 6 12C6 11.17 6.67 10.5 7.5 10.5Z" fill={statusBarMode === 'dark' ? 'white' : 'black'} transform="translate(0,-3)" />
                      <path d="M4.5 8.5C5.3 7.7 6.35 7.25 7.5 7.25C8.65 7.25 9.7 7.7 10.5 8.5" stroke={statusBarMode === 'dark' ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" transform="translate(0,-3)" />
                      <path d="M2 6C3.45 4.55 5.4 3.75 7.5 3.75C9.6 3.75 11.55 4.55 13 6" stroke={statusBarMode === 'dark' ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" transform="translate(0,-3)" />
                    </svg>
                    {/* Battery */}
                    <svg width="20" height="9" viewBox="0 0 25 12" fill="none" className="opacity-90">
                      <rect x="0" y="1" width="21" height="10" rx="2" stroke={statusBarMode === 'dark' ? 'white' : 'black'} strokeWidth="1" />
                      <rect x="1.5" y="2.5" width="18" height="7" rx="1" fill={statusBarMode === 'dark' ? 'white' : 'black'} />
                      <rect x="22" y="4" width="2" height="4" rx="0.5" fill={statusBarMode === 'dark' ? 'white' : 'black'} opacity="0.4" />
                    </svg>
                  </div>
                </div>

                {/* Conteúdo — carrossel de imagens */}
                <div className="relative w-full h-full bg-white flex flex-col">
                  {/* Spacer topo — empurra abaixo da status bar */}
                  <div className="shrink-0 h-[2.4rem]" />
                  <div className="relative flex-1">
                    {images.map((src, i) => (
                      <Image
                        key={src}
                        src={src}
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
                    'w-[35%] h-[0.25rem] rounded-full',
                    statusBarMode === 'dark' ? 'bg-white/70' : 'bg-black/20'
                  )} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
