'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function BackgroundPattern() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Só renderiza se for dark mode
  if (resolvedTheme !== 'dark') return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
      {/* Padrão de pontos */}
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,transparent_20%,#000_100%)] opacity-[0.07]" />
    </div>
  )
}
