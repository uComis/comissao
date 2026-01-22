'use client'

import { TrialBanner } from './trial-banner'
import { RenewalAlert } from './renewal-alert'
import { BlockedSuppliersBanner } from './blocked-suppliers-banner'
import { BillingNotificationProvider } from './billing-notification-provider'

export default function BillingBanners() {
  // Componentes agora usam useCurrentUser() diretamente do Context
  // Não precisa mais fazer chamadas ao servidor aqui
  return (
    <BillingNotificationProvider>
      <RenewalAlert />
      <TrialBanner />
      <BlockedSuppliersBanner />
    </BillingNotificationProvider>
  )
}
