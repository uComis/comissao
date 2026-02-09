'use client'

import { GoogleOneTap } from '@/components/google-one-tap'

export function SiteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-google-sans)' }}>
      <GoogleOneTap />
      {children}
    </div>
  )
}
