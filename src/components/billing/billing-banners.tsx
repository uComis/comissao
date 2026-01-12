'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { TrialBanner } from './trial-banner'
import { BlockedSuppliersBanner } from './blocked-suppliers-banner'
import { BillingNotificationProvider } from './billing-notification-provider'
import { getBillingUsage, getBlockedSuppliers, getSubscription } from '@/app/actions/billing'

type BillingData = {
  usage: Awaited<ReturnType<typeof getBillingUsage>> | null
  blocked: Awaited<ReturnType<typeof getBlockedSuppliers>> | null
  subscription: Awaited<ReturnType<typeof getSubscription>> | null
}

export default function BillingBanners() {
  const { user } = useAuth()
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadBillingData() {
      if (!user) return
      
      try {
        // ✅ Cache localStorage com TTL de 5 minutos
        const cacheKey = `billing_data_${user.id}`
        const cacheTimeKey = `billing_data_time_${user.id}`
        
        const cached = localStorage.getItem(cacheKey)
        const cacheTime = localStorage.getItem(cacheTimeKey)
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime)
          if (age < 5 * 60 * 1000) { // 5 min
            setData(JSON.parse(cached))
            setLoading(false)
            return
          }
        }

        // ✅ Fetch em paralelo apenas se cache expirou
        const [usage, blocked, subscription] = await Promise.all([
          getBillingUsage(),
          getBlockedSuppliers(user.id),
          getSubscription(user.id)
        ])

        const billingData: BillingData = { usage, blocked, subscription }
        
        setData(billingData)
        
        // Salvar no cache
        localStorage.setItem(cacheKey, JSON.stringify(billingData))
        localStorage.setItem(cacheTimeKey, Date.now().toString())
        
      } catch (error) {
        console.error('Error loading billing data:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadBillingData()
  }, [user])

  // Não renderiza enquanto carrega
  if (loading || !data) return null

  return (
    <BillingNotificationProvider>
      <TrialBanner />
      <BlockedSuppliersBanner />
    </BillingNotificationProvider>
  )
}
