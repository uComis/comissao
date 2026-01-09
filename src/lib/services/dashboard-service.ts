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
  // Simplified for Recharts: [{ month: 'Jan', 'Client A': 100, 'Client B': 200, ... }, ...]
  evolution_clients: Array<Record<string, string | number>>
  evolution_folders: Array<Record<string, string | number>>
  evolution_names: {
    clients: string[]
    folders: string[]
  }
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
    const startOfSixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

    // 2. Fetch Data
    const [ { data: historicalSales }, { data: lastMonthSales }, { data: prefs } ] = await Promise.all([
      supabase.from('personal_sales')
        .select('gross_value, commission_value, client_name, sale_date, supplier_id, personal_suppliers(name)')
        .eq('user_id', user.id)
        .gte('sale_date', startOfSixMonths)
        .lte('sale_date', endOfMonth),
      supabase.from('personal_sales')
        .select('gross_value, commission_value')
        .eq('user_id', user.id)
        .gte('sale_date', startOfLastMonth)
        .lte('sale_date', endOfLastMonth),
      supabase.from('user_preferences')
        .select('commission_goal')
        .eq('user_id', user.id)
        .single()
    ])

    const allSales = historicalSales || []
    const lastSales = lastMonthSales || []
    const goal = prefs?.commission_goal || 0

    // Filter Current Month
    const currentSales = allSales.filter(s => {
      const d = new Date(s.sale_date)
      return d >= new Date(startOfMonth) && d <= new Date(endOfMonth)
    })

    const calculateTrend = (current: number, last: number) => {
      if (last === 0) return 0
      return Math.round(((current - last) / last) * 100)
    }

    const currentCommission = currentSales.reduce((sum, s) => sum + (Number(s.commission_value) || 0), 0)
    const currentGross = currentSales.reduce((sum, s) => sum + (Number(s.gross_value) || 0), 0)
    const lastGross = lastSales.reduce((sum, s) => sum + (Number(s.gross_value) || 0), 0)

    // --- RANKINGS ---
    const clientMap = new Map<string, number>()
    currentSales.forEach(s => {
      clientMap.set(s.client_name, (clientMap.get(s.client_name) || 0) + (Number(s.gross_value) || 0))
    })
    const topClients = Array.from(clientMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5)
    const topClientNames = topClients.map(c => c[0])

    const supplierMap = new Map<string, number>()
    currentSales.forEach(s => {
      const supplier = s.personal_suppliers as unknown as { name: string } | null
      const name = supplier?.name || 'Outras'
      supplierMap.set(name, (supplierMap.get(name) || 0) + (Number(s.gross_value) || 0))
    })
    const topSuppliers = Array.from(supplierMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5)
    const topSupplierNames = topSuppliers.map(s => s[0])

    // --- EVOLUTION ---
    const getMonthLabel = (date: Date) => date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
    
    // Last 6 months labels
    const monthLabels: string[] = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        monthLabels.push(getMonthLabel(d))
    }

    // Initialize data structures
    const evolutionClients = monthLabels.map(month => ({ month } as Record<string, string | number>))
    const evolutionFolders = monthLabels.map(month => ({ month } as Record<string, string | number>))

    // Fill data
    allSales.forEach(s => {
      const mLabel = getMonthLabel(new Date(s.sale_date))
      const clientIdx = monthLabels.indexOf(mLabel)
      const supplier = s.personal_suppliers as unknown as { name: string } | null
      const supplierName = supplier?.name || 'Outras'
      
      if (clientIdx !== -1) {
        if (topClientNames.includes(s.client_name)) {
          const currentVal = (evolutionClients[clientIdx][s.client_name] as number) || 0
          evolutionClients[clientIdx][s.client_name] = currentVal + (Number(s.commission_value) || 0)
        }
        if (topSupplierNames.includes(supplierName)) {
          const currentVal = (evolutionFolders[clientIdx][supplierName] as number) || 0
          evolutionFolders[clientIdx][supplierName] = currentVal + (Number(s.commission_value) || 0)
        }
      }
    })

    const payload: HomeDashboardData = {
      cards: {
        commission: {
          current: currentCommission, goal,
          progress: goal > 0 ? (currentCommission / goal) * 100 : 0,
          remaining: Math.max(0, goal - currentCommission)
        },
        sales_performed: { value: currentSales.length, trend: calculateTrend(currentSales.length, lastSales.length) },
        sales_paid: { value: currentSales.length, trend: calculateTrend(currentSales.length, lastSales.length) },
        total_sales: { value: currentGross, trend: calculateTrend(currentGross, lastGross) }
      },
      rankings: {
        clients: topClients.map(([name, value]) => ({ name, value })),
        folders: topSuppliers.map(([name, value]) => ({ name, value }))
      },
      evolution_clients: evolutionClients,
      evolution_folders: evolutionFolders,
      evolution_names: {
        clients: topClientNames,
        folders: topSupplierNames
      }
    }

    await CacheService.set(this.CACHE_KEY, payload, 3600)
    return payload
  }
}
