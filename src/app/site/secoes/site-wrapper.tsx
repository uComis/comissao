'use client'

import { useEffect } from 'react'
import { GoogleOneTap } from '@/components/google-one-tap'

export function SiteWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark')
    html.classList.add('light')
    html.setAttribute('data-theme', 'light')
    html.setAttribute('data-site', 'true')
    html.style.colorScheme = 'light'

    const observer = new MutationObserver(() => {
      if (html.classList.contains('dark')) {
        html.classList.remove('dark')
        html.classList.add('light')
      }
      if (!html.hasAttribute('data-site')) {
        html.setAttribute('data-site', 'true')
      }
      if (html.style.colorScheme !== 'light') {
        html.style.colorScheme = 'light'
      }
    })

    observer.observe(html, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    return () => {
      observer.disconnect()
      // Limpa tudo que foi forçado no <html> para não interferir no dashboard
      html.removeAttribute('data-site')
      html.removeAttribute('data-theme')
      html.style.colorScheme = ''
      html.classList.remove('light')
      // next-themes vai re-aplicar o tema correto automaticamente
    }
  }, [])

  return (
    <div className="light" data-theme="light" style={{ colorScheme: 'light', fontFamily: 'var(--font-google-sans)' }}>
      <GoogleOneTap />
      {children}
    </div>
  )
}
