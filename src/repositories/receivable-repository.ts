import { createClient } from '@/lib/supabase'

export type Receivable = {
  id: string
  user_id: string
  personal_sale_id: string | null
  supplier_id: string | null
  due_date: string
  expected_amount: number | null
  received_amount: number | null
  status: 'pending' | 'received' | 'overdue' | 'partial'
  received_at: string | null
  created_at: string
  sale?: {
    id: string
    client_name: string | null
  }
  supplier?: {
    id: string
    name: string
  }
}

export type CreateReceivableInput = {
  personal_sale_id?: string
  supplier_id?: string
  due_date: string
  expected_amount: number
}

export type UpdateReceivableInput = {
  received_amount?: number
  status?: Receivable['status']
  received_at?: string
}

export async function getReceivables(): Promise<Receivable[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      sale:personal_sales(id, client_name),
      supplier:personal_suppliers(id, name)
    `)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getReceivablesByStatus(
  status: Receivable['status']
): Promise<Receivable[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      sale:personal_sales(id, client_name),
      supplier:personal_suppliers(id, name)
    `)
    .eq('status', status)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getReceivablesDueInDays(days: number): Promise<Receivable[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + days)

  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      sale:personal_sales(id, client_name),
      supplier:personal_suppliers(id, name)
    `)
    .eq('status', 'pending')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getOverdueReceivables(): Promise<Receivable[]> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      sale:personal_sales(id, client_name),
      supplier:personal_suppliers(id, name)
    `)
    .eq('status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getReceivableById(id: string): Promise<Receivable | null> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      sale:personal_sales(id, client_name),
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

export async function createReceivable(input: CreateReceivableInput): Promise<Receivable> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('receivables')
    .insert({
      user_id: user.id,
      personal_sale_id: input.personal_sale_id || null,
      supplier_id: input.supplier_id || null,
      due_date: input.due_date,
      expected_amount: input.expected_amount,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReceivable(
  id: string,
  input: UpdateReceivableInput
): Promise<Receivable> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const updateData: Record<string, unknown> = {}

  if (input.received_amount !== undefined) updateData.received_amount = input.received_amount
  if (input.status !== undefined) updateData.status = input.status
  if (input.received_at !== undefined) updateData.received_at = input.received_at

  const { data, error } = await supabase
    .from('receivables')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markAsReceived(
  id: string,
  receivedAmount: number
): Promise<Receivable> {
  return updateReceivable(id, {
    received_amount: receivedAmount,
    status: 'received',
    received_at: new Date().toISOString(),
  })
}

export async function deleteReceivable(id: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('receivables')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getReceivablesStats() {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase not configured')

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  const { data, error } = await supabase
    .from('receivables')
    .select('due_date, expected_amount, received_amount, status')

  if (error) throw error

  const pending = data?.filter(r => r.status === 'pending') || []
  const overdue = pending.filter(r => r.due_date < today)
  const dueInSevenDays = pending.filter(
    r => r.due_date >= today && r.due_date <= sevenDaysLater.toISOString().split('T')[0]
  )

  const totalPending = pending.reduce((sum, r) => sum + (r.expected_amount || 0), 0)
  const totalOverdue = overdue.reduce((sum, r) => sum + (r.expected_amount || 0), 0)
  const totalDueInSevenDays = dueInSevenDays.reduce((sum, r) => sum + (r.expected_amount || 0), 0)

  return {
    totalPending,
    totalOverdue,
    totalDueInSevenDays,
    countPending: pending.length,
    countOverdue: overdue.length,
    countDueInSevenDays: dueInSevenDays.length,
  }
}

