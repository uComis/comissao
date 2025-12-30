'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSubscription, type Subscription } from '@/app/actions/billing'
import { useAuth } from '@/contexts/auth-context'
import { UpgradeCelebrationModal } from './upgrade-celebration-modal'

export function BillingNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const refreshSubscription = useCallback(async () => {
    if (!user) return
    try {
      const sub = await getSubscription(user.id)
      setSubscription(sub)
    } catch (err) {
      console.error('Erro ao atualizar assinatura no provider:', err)
    }
  }, [user])

  useEffect(() => {
    const init = async () => {
      await refreshSubscription()
    }
    init()

    // 1. Detecção via Visibility API (quando volta para a aba)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        init()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 2. Polling suave (opcional, para quando o usuário fica na aba aberta)
    // Se estiver com assinatura unpaid ou past_due, checa a cada 10 segundos
    const interval = setInterval(() => {
      if (subscription?.status === 'unpaid' || subscription?.status === 'past_due') {
        init()
      }
    }, 10000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [refreshSubscription, subscription?.status])

  return (
    <>
      <UpgradeCelebrationModal subscription={subscription} />
      {children}
    </>
  )
}

