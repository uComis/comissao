'use server'

import { DashboardService, HomeDashboardData } from '@/lib/services/dashboard-service'

export async function getHomeAnalyticsAction(month?: string): Promise<HomeDashboardData | null> {
  try {
    const referenceDate = month ? new Date(month) : undefined
    return await DashboardService.getHomeAnalytics(referenceDate)
  } catch (error) {
    console.error('Action Error - getHomeAnalyticsAction:', error)
    return null
  }
}
