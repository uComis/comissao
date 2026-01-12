'use client'

import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/auth-context'
import { AppDataProvider } from '@/contexts/app-data-context'
import { Toaster } from '@/components/ui/sonner'
import { AuthErrorWatcher } from '@/components/auth/auth-error-watcher'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
