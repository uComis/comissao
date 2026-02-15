'use client'

import { TrialBanner } from './trial-banner'
import { RenewalAlert } from './renewal-alert'

export default function BillingBanners() {
  return (
    <>
      <RenewalAlert />
      <TrialBanner />
    </>
  )
}
