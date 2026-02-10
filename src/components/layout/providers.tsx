'use client'

import { useState, useEffect, type ComponentType, type ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { BackgroundPattern } from '@/components/ui/background-pattern'

const SITE_PAGES = ['/', '/privacidade', '/termos', '/ajuda', '/faq']

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isSitePage = SITE_PAGES.includes(pathname)
  const [AppProviders, setAppProviders] = useState<ComponentType<{ children: ReactNode }> | null>(null)

  useEffect(() => {
    if (!isSitePage) {
      import('./app-providers').then((mod) => {
        setAppProviders(() => mod.default)
      })
    }
  }, [isSitePage])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme={isSitePage ? 'light' : undefined}
      disableTransitionOnChange
    >
      <BackgroundPattern />
      {isSitePage ? children : AppProviders ? <AppProviders>{children}</AppProviders> : null}
      <Toaster />
    </ThemeProvider>
  )
}
