'use client'

import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Toaster } from '@/components/ui/sonner'
import { BackgroundPattern } from '@/components/ui/background-pattern'

const AppProviders = dynamic(() => import('./app-providers'))

const SITE_PAGES = ['/', '/privacidade', '/termos', '/ajuda', '/faq']

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSitePage = SITE_PAGES.includes(pathname)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme={isSitePage ? 'light' : undefined}
      disableTransitionOnChange
    >
      <BackgroundPattern />
      {isSitePage ? (
        children
      ) : (
        <AppProviders>{children}</AppProviders>
      )}
      <Toaster />
    </ThemeProvider>
  )
}
