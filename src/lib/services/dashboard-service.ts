import { createClient } from '../supabase-server'
import { CacheService } from './cache-service'

export interface HomeDashboardData {
  cards: {
    commission: { 
      current: number
      goal: number
      progress: number
      remaining: number
    }
    sales_performed: {
      value: number
      trend: number
    }
    sales_paid: {
      value: number
      trend: number
    }
    total_sales: {
      value: number
      trend: number
    }
  }
  rankings: {
    clients: Array<{ name: string; value: number }>
    folders: Array<{ name: string; value: number }>
  }
  evolution: Array<{ month: string; sales: number; commission: number }>
}

export class DashboardService {
  private static CACHE_KEY = 'home_analytics'

  static async getHomeAnalytics(): Promise<HomeDashboardData | null> {
    const cached = await CacheService.get<HomeDashboardData>(this.CACHE_KEY)
    if (cached) return cached

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 1. Data ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    // 2. Fetch Current Month Stats
    const { data: currentSales } = await supabase
      .from('personal_sales')
      .select('gross_value, commission_value, client_name, supplier_id, personal_suppliers(name)')
      .eq('user_id', user.id)
      .gte('sale_date', startOfMonth)
      .lte('sale_date', endOfMonth)

    // 3. Fetch Last Month Stats (for trends)
    const { data: lastMonthSales } = await supabase
      .from('personal_sales')
      .select('gross_value, commission_value')
      .eq('user_id', user.id)
      .gte('sale_date', startOfLastMonth)
      .lte('sale_date', endOfLastMonth)

    // 4. Fetch Meta
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('commission_goal')
      .eq('user_id', user.id)
      .single()

    // Helper: Calculate Trend
    const calculateTrend = (current: number, last: number) => {
      if (last === 0) return 0
      return Math.round(((current - last) / last) * 100)
    }

    const goal = prefs?.commission_goal || 0
    const sales = currentSales || []
    const lastSales = lastMonthSales || []

    const currentCommission = sales.reduce((sum, s) => sum + (Number(s.commission_value) || 0), 0)
    const currentGross = sales.reduce((sum, s) => sum + (Number(s.gross_value) || 0), 0)
    const lastGross = lastSales.reduce((sum, s) => sum + (Number(s.gross_value) || 0), 0)

    // Aggregate by Client
    const clientMap = new Map<string, number>()
    sales.forEach(s => {
      const val = clientMap.get(s.client_name) || 0
      clientMap.set(s.client_name, val + (Number(s.gross_value) || 0) )
    })
    const clientRanking = Array.from(clientMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5)

    // Aggregate by Supplier (Folder)
    const supplierMap = new Map<string, number>()
    sales.forEach(s => {
      const name = (s.personal_suppliers as any)?.name || 'Outras'
      const val = supplierMap.get(name) || 0
      supplierMap.set(name, val + (Number(s.gross_value) || 0) )
    })
    const supplierRanking = Array.from(supplierMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5)

    const payload: HomeDashboardData = {
      cards: {
        commission: {
          current: currentCommission,
          goal,
          progress: goal > 0 ? (currentCommission / goal) * 100 : 0,
          remaining: Math.max(0, goal - currentCommission)
        },
        sales_performed: {
          value: sales.length,
          trend: calculateTrend(sales.length, lastSales.length)
        },
        sales_paid: {
           // For now, assuming all "performed" are paid if no status column exists
           // or we can add a logic later. Placeholder value.
          value: sales.length, 
          trend: calculateTrend(sales.length, lastSales.length)
        },
        total_sales: {
          value: currentGross,
          trend: calculateTrend(currentGross, lastGross)
        }
      },
      rankings: {
        clients: clientRanking,
        folders: supplierRanking
      },
      evolution: [
        // Dummy data for now, would need a more complex query for 6 months
        { month: "Jan", sales: currentGross, commission: currentCommission }
      ]
    }

    await CacheService.set(this.CACHE_KEY, payload, 3600) // 1 hour cache
    return payload
  }
}
