export type Commission = {
  id: string
  organization_id: string
  seller_id: string
  sale_id: string
  rule_id: string | null
  base_value: number
  percentage_applied: number
  amount: number
  period: string // formato: "2025-01"
  created_at: string
  updated_at: string
}

export type CreateCommissionInput = {
  organization_id: string
  seller_id: string
  sale_id: string
  rule_id?: string
  base_value: number
  percentage_applied: number
  amount: number
  period: string
}

export type UpdateCommissionInput = Partial<
  Omit<Commission, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
>

// Commission com dados expandidos
export type CommissionWithDetails = Commission & {
  seller: {
    id: string
    name: string
  }
  sale: {
    id: string
    client_name: string
    gross_value: number
    sale_date: string
  }
  rule: {
    id: string
    name: string
    type: 'fixed' | 'tiered'
  } | null
}

// Resumo de comissões por período
export type CommissionSummary = {
  period: string
  total_sales: number
  total_gross_value: number
  total_net_value: number
  total_commission: number
  sellers_count: number
}

// Resumo completo do dashboard (totais + por vendedor)
export type DashboardSummary = CommissionSummary & {
  sellers: SellerCommissionSummary[]
}

// Resumo por vendedor
export type SellerCommissionSummary = {
  seller_id: string
  seller_name: string
  period: string
  sales_count: number
  total_gross_value: number
  total_net_value: number
  total_commission: number
}

// Histórico para gráficos (múltiplos períodos)
export type DashboardHistory = {
  periods: CommissionSummary[]
  sellers: SellerHistoryEntry[]
}

export type SellerHistoryEntry = {
  seller_id: string
  seller_name: string
  data: { period: string; commission: number }[]
}

