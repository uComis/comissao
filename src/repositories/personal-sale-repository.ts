import { createClient } from '@/lib/supabase'

export type Installment = {
  due_date: string
  amount: number
  status: 'pending' | 'received' | 'overdue' | 'partial'
  paid_at?: string
  received_amount?: number
}

export type PersonalSale = {
  id: string
  user_id: string
  supplier_id: string | null
  client_name: string | null
  gross_value: number | null
  net_value: number | null
  commission_value: number | null
  commission_rate: number | null
  sale_date: string | null
  payment_condition: string | null
  installments: Installment[] | null
  source: 'manual' | 'ocr' | 'api'
  notes: string | null
  created_at: string
  updated_at: string
  supplier?: {
    id: string
    name: string
  }
}

export type CreatePersonalSaleInput = {
  supplier_id?: string
  client_name?: string
  gross_value?: number
  net_value?: number
  commission_value?: number
  commission_rate?: number
  sale_date?: string
  payment_condition?: string
  installments?: Installment[]
  source?: 'manual' | 'ocr' | 'api'
  notes?: string
}

export type UpdatePersonalSaleInput = Partial<CreatePersonalSaleInput>

export async function getPersonalSales(): Promise<PersonalSale[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('personal_sales')
    .select(`
      *,
      supplier:personal_suppliers(id, name)
    `)
    .order('sale_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPersonalSalesBySupplier(supplierId: string): Promise<PersonalSale[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('personal_sales')
    .select(`
      *,
      supplier:personal_suppliers(id, name)
    `)
    .eq('supplier_id', supplierId)
    .order('sale_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPersonalSaleById(id: string): Promise<PersonalSale | null> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('personal_sales')
    .select(`
      *,
      supplier:personal_suppliers(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createPersonalSale(input: CreatePersonalSaleInput): Promise<PersonalSale> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('personal_sales')
    .insert({
      user_id: user.id,
      supplier_id: input.supplier_id || null,
      client_name: input.client_name || null,
      gross_value: input.gross_value || null,
      net_value: input.net_value || null,
      commission_value: input.commission_value || null,
      commission_rate: input.commission_rate || null,
      sale_date: input.sale_date || null,
      payment_condition: input.payment_condition || null,
      installments: input.installments || null,
      source: input.source || 'manual',
      notes: input.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePersonalSale(
  id: string,
  input: UpdatePersonalSaleInput
): Promise<PersonalSale> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.supplier_id !== undefined) updateData.supplier_id = input.supplier_id
  if (input.client_name !== undefined) updateData.client_name = input.client_name
  if (input.gross_value !== undefined) updateData.gross_value = input.gross_value
  if (input.net_value !== undefined) updateData.net_value = input.net_value
  if (input.commission_value !== undefined) updateData.commission_value = input.commission_value
  if (input.commission_rate !== undefined) updateData.commission_rate = input.commission_rate
  if (input.sale_date !== undefined) updateData.sale_date = input.sale_date
  if (input.payment_condition !== undefined) updateData.payment_condition = input.payment_condition
  if (input.installments !== undefined) updateData.installments = input.installments
  if (input.notes !== undefined) updateData.notes = input.notes

  const { data, error } = await supabase
    .from('personal_sales')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePersonalSale(id: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('personal_sales')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getPersonalSalesStats() {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('personal_sales')
    .select('gross_value, net_value, commission_value, sale_date')

  if (error) throw error

  const totalGross = data?.reduce((sum, s) => sum + (s.gross_value || 0), 0) || 0
  const totalNet = data?.reduce((sum, s) => sum + (s.net_value || 0), 0) || 0
  const totalCommission = data?.reduce((sum, s) => sum + (s.commission_value || 0), 0) || 0

  return {
    totalSales: data?.length || 0,
    totalGross,
    totalNet,
    totalCommission,
  }
}

