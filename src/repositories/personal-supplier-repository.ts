import { createClient } from '@/lib/supabase'

export type PersonalSupplier = {
  id: string
  user_id: string
  name: string
  cnpj: string | null
  commission_rules: CommissionRules | null
  organization_id: string | null
  match_status: 'unlinked' | 'suggested' | 'linked' | 'rejected'
  matched_at: string | null
  matched_by: 'auto_cnpj' | 'auto_name' | 'manual' | null
  created_at: string
  updated_at: string
}

export type CommissionRules = {
  default_rate?: number
  payment_delay_days?: number
  rules?: Array<{
    condition: string
    rate: number
  }>
}

export type CreatePersonalSupplierInput = {
  name: string
  cnpj?: string
  commission_rules?: CommissionRules
}

export type UpdatePersonalSupplierInput = Partial<CreatePersonalSupplierInput> & {
  organization_id?: string
  match_status?: PersonalSupplier['match_status']
}

export async function getPersonalSuppliers(): Promise<PersonalSupplier[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('personal_suppliers')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPersonalSupplierById(id: string): Promise<PersonalSupplier | null> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('personal_suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createPersonalSupplier(
  input: CreatePersonalSupplierInput
): Promise<PersonalSupplier> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('personal_suppliers')
    .insert({
      user_id: user.id,
      name: input.name,
      cnpj: input.cnpj || null,
      commission_rules: input.commission_rules || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePersonalSupplier(
  id: string,
  input: UpdatePersonalSupplierInput
): Promise<PersonalSupplier> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updateData.name = input.name
  if (input.cnpj !== undefined) updateData.cnpj = input.cnpj
  if (input.commission_rules !== undefined) updateData.commission_rules = input.commission_rules
  if (input.organization_id !== undefined) updateData.organization_id = input.organization_id
  if (input.match_status !== undefined) {
    updateData.match_status = input.match_status
    if (input.match_status === 'linked') {
      updateData.matched_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('personal_suppliers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePersonalSupplier(id: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('personal_suppliers')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function searchPersonalSuppliersByName(query: string): Promise<PersonalSupplier[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('personal_suppliers')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(10)

  if (error) throw error
  return data || []
}

