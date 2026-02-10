'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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
  const [isVisible, setIsVisible] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sources = videoSources || (videoSrc ? [videoSrc] : [])
  const hasVideoSequence = sources.length > 0

  // Lazy load: só carrega vídeos quando o componente fica visível
  useEffect(() => {
    if (!hasVideoSequence || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [hasVideoSequence])

  // Lógica para carrossel de IMAGENS
  useEffect(() => {
    if (hasVideoSequence || !images || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval * 1000)

    return () => clearInterval(timer)
  }, [images, interval, hasVideoSequence])

  const playNext = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)

    pauseTimerRef.current = setTimeout(() => {
      if (sources.length <= 1) {
        // Vídeo único: reiniciar
        const video = videoRefs.current[0]
        if (video) {
          video.currentTime = 0
          video.play()
        }
      } else {
        setCurrentVideoIndex((prev) => {
          const next = (prev + 1) % sources.length
          // Play do próximo vídeo (já está carregado, sem novo download)
          const nextVideo = videoRefs.current[next]
          if (nextVideo) {
            nextVideo.currentTime = 0
            nextVideo.play()
          }
          return next
        })
      }
    }, videoPauseInterval * 1000)
  }, [sources, videoPauseInterval])

  // Attach ended event em todos os vídeos
  useEffect(() => {
    const cleanups: (() => void)[] = []

    videoRefs.current.forEach((video) => {
      if (!video) return
      video.addEventListener('ended', playNext)
      cleanups.push(() => video.removeEventListener('ended', playNext))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [playNext])

  // Autoplay do primeiro vídeo — só quando visível
  useEffect(() => {
    if (!hasVideoSequence || !isVisible) return
    const first = videoRefs.current[0]
    if (first) {
      first.preload = 'auto'
      first.load()
      first.play().catch(() => {})
    }
  }, [hasVideoSequence, isVisible])

  // Preload do próximo vídeo quando o atual começa a tocar
  useEffect(() => {
    if (sources.length <= 1) return
    const nextIdx = (currentVideoIndex + 1) % sources.length
    const nextVideo = videoRefs.current[nextIdx]
    if (nextVideo && nextVideo.preload === 'none') {
      nextVideo.preload = 'auto'
      nextVideo.load()
    }
  }, [currentVideoIndex, sources.length])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className={cn('relative max-w-5xl mx-auto shadow-2xl rounded-t-xl overflow-hidden border border-gray-200/60 bg-white', className)}>
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
      <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full bg-white overflow-hidden">
        {hasVideoSequence ? (
          sources.map((src, i) => (
            <video
              key={src}
              ref={(el) => { videoRefs.current[i] = el }}
              src={src}
              muted
              playsInline
              preload="none"
              className={cn(
                'absolute inset-0 w-full h-full object-cover sm:object-top transition-opacity duration-500',
                i === currentVideoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              )}
            >
              <track kind="captions" src="/captions/empty.vtt" srcLang="pt-BR" label="Português" default />
            </video>
          ))
        ) : (
          images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt="Dashboard Preview"
              fill
              className={cn(
                'w-full h-full object-cover sm:object-top transition-opacity duration-1000',
                i === currentIndex ? 'opacity-100' : 'opacity-0'
              )}
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority={i === 0}
            />
          ))
        )}
      </div>
    </div>
  )
}
