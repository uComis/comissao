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

