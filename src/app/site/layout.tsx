'use client'

import { useEffect } from 'react'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Força light mode removendo dark e adicionando light
    const html = document.documentElement
    html.classList.remove('dark')
    html.classList.add('light')
    html.setAttribute('data-theme', 'light')
    html.setAttribute('data-site', 'true')
    html.style.colorScheme = 'light'
    
    // Previne que o ThemeProvider mude o tema
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
      attributeFilter: ['class'],
    })
    
    // Monitora mudanças no style também
    const styleObserver = new MutationObserver(() => {
      if (html.style.colorScheme !== 'light') {
        html.style.colorScheme = 'light'
      }
    })
    
    styleObserver.observe(html, {
      attributes: true,
      attributeFilter: ['style'],
    })
    
    return () => {
      observer.disconnect()
      styleObserver.disconnect()
    }
  }, [])

  return (
    <div className="light" data-theme="light" style={{ colorScheme: 'light', fontFamily: 'var(--font-google-sans)' }}>
      {children}
    </div>
  )
}
