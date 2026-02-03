'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useCtx } from '@/components/layout/page-header-context'
import { routeConfigs } from '@/lib/route-config'

/**
 * Sets default page header from static route config.
 * Pages that call useSetPageHeader will override these values.
 */
export function RoutePageHeader() {
  const pathname = usePathname()
  const { set } = useCtx()

  useEffect(() => {
    const config = routeConfigs[pathname]
    if (config) {
      set({ backHref: undefined, taskMode: false, contentMaxWidth: undefined, ...config })
    }
  }, [pathname, set])

  return null
}
