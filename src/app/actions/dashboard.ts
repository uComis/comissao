'use server'

import { DashboardService, HomeDashboardData } from '@/lib/services/dashboard-service'

export async function getHomeAnalyticsAction(): Promise<HomeDashboardData | null> {
  try {
    return await DashboardService.getHomeAnalytics()
  } catch (error) {
    console.error('Action Error - getHomeAnalyticsAction:', error)
    return null
  }
}
