'use client'

import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/auth-context'
import { AppDataProvider } from '@/contexts/app-data-context'
import { Toaster } from '@/components/ui/sonner'
import { AuthErrorWatcher } from '@/components/auth/auth-error-watcher'
import { BackgroundPattern } from '@/components/ui/background-pattern'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
