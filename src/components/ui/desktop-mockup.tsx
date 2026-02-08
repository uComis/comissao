'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface DesktopMockupProps {
  /** Array de strings com os paths das imagens */
  images: string[]
  /** Segundos por imagem no carrossel (padrão: 5) */
  interval?: number
  /** URL fake para exibir na barra de endereços */
  url?: string
  /** Classes extras para o container externo */
  className?: string
}

export function DesktopMockup({
  images,
  interval = 5,
  url = 'ucomis.com.br/dashboard',
  className,
}: DesktopMockupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval * 1000)

    return () => clearInterval(timer)
  }, [images.length, interval])

  return (
    <div className={cn('relative max-w-5xl mx-auto shadow-2xl rounded-t-xl overflow-hidden border border-gray-200/60 bg-white', className)}>
      {/* Browser Window Header */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto bg-white px-3 py-1 rounded-md text-xs text-gray-400 font-medium w-64 text-center border border-gray-200 truncate">
          {url}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="relative aspect-[16/9] w-full bg-white overflow-hidden">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt="Dashboard Preview"
            fill
            className={cn(
              'w-full h-full object-cover object-top transition-opacity duration-1000',
              i === currentIndex ? 'opacity-100' : 'opacity-0'
            )}
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority={i === 0}
          />
        ))}
      </div>
    </div>
  )
}
