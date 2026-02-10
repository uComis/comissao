'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
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

/** Check Supabase session cookies (for site pages where AuthProvider isn't loaded) */
function hasSessionCookie(): boolean {
  try {
    return document.cookie.split('; ').some(
      (c) => c.split('=')[0].startsWith('sb-') && c.includes('-auth-token')
    )
  } catch {
    return false
  }
}

export function GoogleOneTap() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (loading || user || !clientId || hasSessionCookie()) {
    return null
  }

  const handleScriptReady = () => {
    if (!window.google) return

    import('@/lib/supabase').then(({ createClient }) => {
      const supabase = createClient()
      if (!supabase || !window.google) return

      window.google.accounts.id.initialize({
        client_id: clientId!,
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
