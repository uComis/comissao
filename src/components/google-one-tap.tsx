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

// Gera nonce: retorna [raw, hashedHex]
async function generateNonce(): Promise<[string, string]> {
  const raw = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
  )
  const encoded = new TextEncoder().encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return [raw, hashedNonce]
}

export function GoogleOneTap() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // Não mostra se já logado, ainda carregando, ou sem config
  if (loading || user || !clientId || !supabase) {
    return null
  }

  const handleScriptReady = () => {
    if (!window.google) return

    generateNonce().then(([raw, hashed]) => {
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce: raw,
          })

          if (error) {
            console.error('[GoogleOneTap] Erro ao autenticar:', error.message)
            return
          }

          router.refresh()
        },
        nonce: hashed,
        auto_select: true,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      })

      window.google!.accounts.id.prompt()
    })
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={handleScriptReady}
    />
  )
}
