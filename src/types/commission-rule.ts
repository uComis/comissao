export type CommissionRuleType = 'fixed' | 'tiered'

export type CommissionTier = {
  min: number
  max: number | null // null = sem limite superior
  percentage: number
}

export type CommissionRule = {
  id: string
  organization_id: string | null // null se pertence a personal_supplier
  personal_supplier_id: string | null // null se pertence a organization
  name: string
  type: CommissionRuleType
  percentage: number | null // usado quando type = 'fixed'
  tiers: CommissionTier[] | null // usado quando type = 'tiered'
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateCommissionRuleInput = {
  organization_id?: string
  personal_supplier_id?: string
  name: string
  type: CommissionRuleType
  percentage?: number
  tiers?: CommissionTier[]
  is_default?: boolean
}

export type UpdateCommissionRuleInput = Partial<
  Omit<CommissionRule, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
>

// Relacionamento vendedor-regra
export type SellerCommissionRule = {
  id: string
  seller_id: string
  rule_id: string
  organization_id: string
  created_at: string
}

export type CreateSellerCommissionRuleInput = {
  seller_id: string
  rule_id: string
  organization_id: string
}

// View com dados expandidos
export type CommissionRuleWithSellers = CommissionRule & {
  sellers: Array<{
    id: string
    name: string
  }>
}

