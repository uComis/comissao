'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface DesktopMockupProps {
  /** Path do vídeo demonstrativo (opcional) */
  videoSrc?: string
  /** Array de caminhos de vídeo para sequência (ex: light -> dark) */
  videoSources?: string[]
  /** Segundos de pausa no final de cada vídeo (padrão: 3) */
  videoPauseInterval?: number
  /** Array de strings com os paths das imagens (especial se videoSrc/videoSources não forem usados) */
  images?: string[]
  /** Segundos por imagem no carrossel (padrão: 5) */
  interval?: number
  /** URL fake para exibir na barra de endereços */
  url?: string
  /** Classes extras para o container externo */
  className?: string
}

export function DesktopMockup({
  videoSrc,
  videoSources,
  videoPauseInterval = 3,
  images = [],
  interval = 5,
  url = 'ucomis.com.br/dashboard',
  className,
}: DesktopMockupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 })
  
  const sources = videoSources || (videoSrc ? [videoSrc] : [])
  const hasVideoSequence = sources.length > 0

  // Lógica para carrossel de IMAGENS
  useEffect(() => {
    if (hasVideoSequence || !images || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval * 1000)

    return () => clearInterval(timer)
  }, [images, interval, hasVideoSequence])

  const handleVideoEnded = () => {
    if (sources.length <= 1 && !videoSources) return
    
    setTimeout(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % sources.length)
    }, videoPauseInterval * 1000)
  }

  return (
    <div ref={ref} className={cn('relative max-w-5xl mx-auto shadow-2xl rounded-t-xl overflow-hidden border border-gray-200/60 bg-white', className)}>
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
        {isVisible && (
          hasVideoSequence ? (
            <AnimatePresence mode="wait">
              <motion.video
                key={sources[currentVideoIndex]}
                src={sources[currentVideoIndex]}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnded}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full h-full object-cover object-top"
              />
            </AnimatePresence>
          ) : (
            images.map((src, i) => (
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
            ))
          )
        )}
      </div>
    </div>
  )
}
