'use client'

import { GoogleOneTap } from '@/components/google-one-tap'

export function SiteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-geist-sans)' }}>
      <GoogleOneTap />
      {children}
    </div>
  )
}
