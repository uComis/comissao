'use client'

import { TrialBanner } from './trial-banner'
import { RenewalAlert } from './renewal-alert'
import { BlockedSuppliersBanner } from './blocked-suppliers-banner'

export default function BillingBanners() {
  return (
    <>
      <RenewalAlert />
      <TrialBanner />
      <BlockedSuppliersBanner />
    </>
  )
}
