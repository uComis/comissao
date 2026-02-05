'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

export function GoogleOneTap() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (loading || user || !clientId || !supabase) {
    return null
  }

  const handleScriptReady = () => {
    if (!window.google) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        })

        if (error) {
          console.error('[GoogleOneTap] Erro ao autenticar:', error.message)
          return
        }

        router.refresh()
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
    })

    window.google.accounts.id.prompt()
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={handleScriptReady}
    />
  )
}
