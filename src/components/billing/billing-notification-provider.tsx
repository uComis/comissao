'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getSubscription, getBlockedSuppliers, type Subscription } from '@/app/actions/billing'
import { useAuth } from '@/contexts/auth-context'
import { UpgradeCelebrationModal } from './upgrade-celebration-modal'

type BillingData = {
  subscription: Subscription | null
  blockedCount: number
  blockedSupplierIds: string[]
  loading: boolean
}

const BillingContext = createContext<BillingData>({
  subscription: null,
  blockedCount: 0,
  blockedSupplierIds: [],
  loading: true,
})

export function useBillingData() {
  return useContext(BillingContext)
}

export function BillingNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [blockedCount, setBlockedCount] = useState(0)
  const [blockedSupplierIds, setBlockedSupplierIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const statusRef = useRef<string | null>(null)
  const isFetching = useRef(false)

  const refresh = useCallback(async () => {
    if (!user || isFetching.current) return
    isFetching.current = true
    try {
      const [sub, blocked] = await Promise.all([
        getSubscription(user.id),
        getBlockedSuppliers(user.id),
      ])
      statusRef.current = (sub as Subscription | null)?.status ?? null
      setSubscription(sub as Subscription | null)
      setBlockedCount(blocked.blockedCount)
      setBlockedSupplierIds(blocked.blockedSupplierIds)
    } catch (err) {
      console.error('Erro ao carregar dados de billing:', err)
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [user])

  useEffect(() => {
    refresh()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const interval = setInterval(() => {
      if (statusRef.current === 'unpaid' || statusRef.current === 'past_due') {
        refresh()
      }
    }, 10000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [refresh])

  return (
    <BillingContext.Provider value={{ subscription, blockedCount, blockedSupplierIds, loading }}>
      <UpgradeCelebrationModal subscription={subscription} />
      {children}
    </BillingContext.Provider>
  )
}
