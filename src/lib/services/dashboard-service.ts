import { createClient } from '../supabase-server'
import { CacheService } from './cache-service'
import { getDataRetentionFilter } from '../../app/actions/billing'

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
    finance: {
      received: number
      pending: number
      overdue: number
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
  static async getHomeAnalytics(referenceDate?: Date): Promise<HomeDashboardData | null> {
    const now = referenceDate || new Date()
    const cacheKey = `home_analytics_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const cached = await CacheService.get<HomeDashboardData>(cacheKey)
    if (cached) return cached

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Aplicar filtro de retenção
    const minDate = await getDataRetentionFilter(user.id)

    // 1. Data ranges
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
    const startOfSixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

    // Se houver retenção, aplicar o limite mais restritivo
    const effectiveStartDate = minDate && new Date(minDate) > new Date(startOfSixMonths)
      ? minDate.toISOString()
      : startOfSixMonths

    // 2. Fetch Data
    const [ { data: historicalSales }, { data: lastMonthSales }, { data: prefs }, { data: receivablesData } ] = await Promise.all([
      supabase.from('personal_sales')
        .select('gross_value, commission_value, client_name, sale_date, supplier_id, personal_suppliers(name)')
        .eq('user_id', user.id)
        .gte('sale_date', effectiveStartDate)
        .lte('sale_date', endOfMonth),
      supabase.from('personal_sales')
        .select('gross_value, commission_value')
        .eq('user_id', user.id)
        .gte('sale_date', startOfLastMonth)
        .lte('sale_date', endOfLastMonth),
      supabase.from('user_preferences')
        .select('commission_goal')
        .eq('user_id', user.id)
        .single(),
      supabase.from('v_receivables')
        .select('status, received_amount, installment_value, due_date, received_at')
        .eq('user_id', user.id)
        .or(`status.eq.overdue, status.eq.received, and(status.eq.pending, due_date.gte.${startOfMonth}, due_date.lte.${endOfMonth})`)
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
      if (last === 0) return current > 0 ? 100 : 0
      return Math.round(((current - last) / last) * 100)
    }

    const currentCommission = currentSales.reduce((sum, s) => sum + (Number(s.commission_value) || 0), 0)
    const currentGross = currentSales.reduce((sum, s) => sum + (Number(s.gross_value) || 0), 0)
    const lastGross = lastSales.reduce((sum, s) => sum + (Number(s.gross_value) || 0), 0)

    // --- RANKINGS (current month for cards) ---
    const clientMap = new Map<string, number>()
    currentSales.forEach(s => {
      clientMap.set(s.client_name, (clientMap.get(s.client_name) || 0) + (Number(s.gross_value) || 0))
    })
    const sortedClients = Array.from(clientMap.entries()).sort((a,b) => b[1] - a[1]) as [string, number][]
    const topClients = sortedClients.slice(0, 5)
    if (sortedClients.length > 5) {
      const othersValue = sortedClients.slice(5).reduce((sum, [, val]) => sum + val, 0)
      topClients.push(['Outros', othersValue])
    }

    const supplierMap = new Map<string, number>()
    currentSales.forEach(s => {
      const supplier = s.personal_suppliers as unknown as { name: string } | null
      const name = supplier?.name || 'Outras'
      supplierMap.set(name, (supplierMap.get(name) || 0) + (Number(s.gross_value) || 0))
    })

    const sortedSuppliers = Array.from(supplierMap.entries()).sort((a,b) => b[1] - a[1]) as [string, number][]
    const topSuppliers = sortedSuppliers.slice(0, 5)
    if (sortedSuppliers.length > 5) {
      const othersValue = sortedSuppliers.slice(5).reduce((sum, [, val]) => sum + val, 0)
      topSuppliers.push(['Outros', othersValue])
    }

    // --- TOP NAMES for evolution (from ALL 6 months, not just current) ---
    const allClientMap = new Map<string, number>()
    allSales.forEach(s => {
      allClientMap.set(s.client_name, (allClientMap.get(s.client_name) || 0) + (Number(s.commission_value) || 0))
    })
    const topClientNames = Array.from(allClientMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5).map(c => c[0])

    const allSupplierMap = new Map<string, number>()
    allSales.forEach(s => {
      const supplier = s.personal_suppliers as unknown as { name: string } | null
      const name = supplier?.name || 'Outras'
      allSupplierMap.set(name, (allSupplierMap.get(name) || 0) + (Number(s.commission_value) || 0))
    })
    const topSupplierNames = Array.from(allSupplierMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5).map(s => s[0])

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
        finance: {
          received: (receivablesData || [])
            .filter(r => r.status === 'received' && r.received_at && new Date(r.received_at) >= new Date(startOfMonth))
            .reduce((sum, r) => sum + (Number(r.received_amount) || 0), 0),
          pending: (receivablesData || [])
            .filter(r => r.status === 'pending')
            .reduce((sum, r) => sum + (Number(r.installment_value) || 0), 0),
          overdue: (receivablesData || [])
            .filter(r => r.status === 'overdue')
            .reduce((sum, r) => sum + (Number(r.installment_value) || 0), 0)
        },
        total_sales: { value: currentGross, trend: calculateTrend(currentGross, lastGross) }
      },
      rankings: {
        clients: topClients.map(([name, value]) => ({ name, value: value as number })),
        folders: topSuppliers.map(([name, value]) => ({ name, value: value as number }))
      },
      evolution_clients: evolutionClients,
      evolution_folders: evolutionFolders,
      evolution_names: {
        clients: topClientNames,
        folders: topSupplierNames
      }
    }

    await CacheService.set(cacheKey, payload, 3600)
    return payload
  }
}
