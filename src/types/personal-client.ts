export type PersonalClient = {
  id: string
  user_id: string
  name: string
  cpf: string | null
  cnpj: string | null
  phone: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Aggregated fields (from sales join)
  total_sales?: number
  total_gross?: number
  total_commission?: number
  last_sale_date?: string | null
}

export type CreatePersonalClientInput = {
  name: string
  cpf?: string | null
  cnpj?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export type UpdatePersonalClientInput = Partial<CreatePersonalClientInput> & {
  is_active?: boolean
}

