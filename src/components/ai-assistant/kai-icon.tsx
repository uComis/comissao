'use client'

import { cn } from '@/lib/utils'

const sparkleKeyframes = `
@keyframes kai-sparkle {
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  30% { opacity: 1; transform: scale(1.15) rotate(8deg); }
  60% { opacity: 0.55; transform: scale(0.85) rotate(-4deg); }
}
`

type KaiIconProps = {
  size?: 16 | 20 | 24 | 32
  className?: string
  animate?: boolean
}

const sizeConfig = {
  16: {
    orb: { width: 13, height: 13 },
    orbHighlight: { width: 3, height: 3, top: 2, left: 3 },
    star: { width: 11, height: 11, top: -1, right: -1 },
  },
  20: {
    orb: { width: 16, height: 16 },
    orbHighlight: { width: 3.5, height: 3.5, top: 3, left: 3 },
    star: { width: 14, height: 14, top: -2, right: -2 },
  },
  24: {
    orb: { width: 19, height: 19 },
    orbHighlight: { width: 4, height: 4, top: 3, left: 4 },
    star: { width: 17, height: 17, top: -2, right: -2 },
  },
  32: {
    orb: { width: 25, height: 25 },
    orbHighlight: { width: 5, height: 5, top: 4, left: 5 },
    star: { width: 22, height: 22, top: -2, right: -3 },
  },
}

export function KaiIcon({ size = 20, className, animate = true }: KaiIconProps) {
  const config = sizeConfig[size]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sparkleKeyframes }} />
      <span
        className={cn('relative inline-flex items-center justify-center flex-shrink-0', className)}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {/* Orb */}
        <span
          className="absolute bottom-0 left-0 rounded-full"
          style={{
            width: config.orb.width,
            height: config.orb.height,
            background: 'radial-gradient(circle at 40% 35%, #4a9af5 0%, #2a6fd4 40%, #1550a8 80%, #0d3a80 100%)',
            boxShadow:
              'inset 0 -2px 4px rgba(5, 20, 60, 0.5), inset 0 2px 3px rgba(140, 200, 255, 0.2), 0 2px 8px rgba(30, 100, 220, 0.4)',
          }}
        >
          {/* Specular highlight */}
          <span
            className="absolute rounded-full"
            style={{
              width: config.orbHighlight.width,
              height: config.orbHighlight.height,
              top: config.orbHighlight.top,
              left: config.orbHighlight.left,
              background: 'rgba(255, 255, 255, 0.7)',
            }}
          />
        </span>

        {/* Sparkle star */}
        <span
          className="absolute z-[2]"
          style={{
            width: config.star.width,
            height: config.star.height,
            top: config.star.top,
            right: config.star.right,
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))',
            animation: animate ? 'kai-sparkle 2.8s ease-in-out infinite' : 'none',
          }}
        >
          <svg viewBox="0 0 40 40" fill="none" style={{ display: 'block', width: '100%', height: '100%' }}>
            <path
              d="M20 0 C21 15, 25 19, 40 20 C25 21, 21 25, 20 40 C19 25, 15 21, 0 20 C15 19, 19 15, 20 0Z"
              fill="white"
              fillOpacity="0.95"
            />
          </svg>
        </span>
      </span>
    </>
  )
}
