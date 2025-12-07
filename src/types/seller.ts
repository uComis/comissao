export type Seller = {
  id: string
  organization_id: string
  name: string
  email: string | null
  pipedrive_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateSellerInput = {
  organization_id: string
  name: string
  email?: string
  pipedrive_id?: number
}

export type UpdateSellerInput = Partial<Omit<Seller, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>

// Vendedor com regra de comissão
export type SellerWithRule = Seller & {
  commission_rule: {
    id: string
    name: string
    type: 'fixed' | 'tiered'
    percentage: number | null
    is_default: boolean
  } | null
}

