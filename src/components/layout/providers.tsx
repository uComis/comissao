'use client'

import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/auth-context'
import { AppDataProvider } from '@/contexts/app-data-context'
import { Toaster } from '@/components/ui/sonner'
import { AuthErrorWatcher } from '@/components/auth/auth-error-watcher'
import { BackgroundPattern } from '@/components/ui/background-pattern'

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
      <AuthProvider>
        <AppDataProvider>
          <Suspense fallback={null}>
            <AuthErrorWatcher />
          </Suspense>
          {children}
          <Toaster />
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
