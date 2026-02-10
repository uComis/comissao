'use client'

import { Suspense } from 'react'
import { AuthProvider } from '@/contexts/auth-provider'
import { AppDataProvider } from '@/contexts/app-data-context'
import { AuthErrorWatcher } from '@/components/auth/auth-error-watcher'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Suspense fallback={null}>
          <AuthErrorWatcher />
        </Suspense>
        {children}
      </AppDataProvider>
    </AuthProvider>
  )
}
