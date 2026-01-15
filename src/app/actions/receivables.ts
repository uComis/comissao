'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

// =====================================================
// TYPES
// =====================================================

export type ReceivableRow = {
  id: string // composição: sale_id-installment_number
  user_id: string
  personal_sale_id: string
  sale_number: number | null // Numeric ID for user-friendly filtering
  supplier_id: string | null
  installment_number: number
  total_installments: number
  sale_date: string
  due_date: string
  installment_value: number
  expected_commission: number
  client_name: string | null
  sale_gross_value: number
  sale_commission_value: number
  commission_rate: number | null
  received_payment_id: string | null
  received_at: string | null
  received_amount: number | null
  notes: string | null
  status: 'pending' | 'received' | 'overdue'
  supplier_name: string | null
}

export type ReceivablesStats = {
  totalPending: number
  totalOverdue: number
  totalReceived: number
  countPending: number
  countOverdue: number
  countReceived: number
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// =====================================================
// QUERIES
// =====================================================

export async function getReceivables(): Promise<ReceivableRow[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('v_receivables')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  if (error) throw error

  // Buscar notes e sale_number das vendas
  const saleIds = [...new Set((data || []).map(r => r.personal_sale_id))]
  
  if (saleIds.length === 0) {
    return (data || []).map(row => ({
      ...row,
      sale_number: null
    }))
  }

  const { data: salesData } = await supabase
    .from('personal_sales')
    .select('id, notes, sale_number')
    .in('id', saleIds)

  const notesMap = new Map(salesData?.map(s => [s.id, s.notes]) || [])
  const saleNumberMap = new Map(salesData?.map(s => [s.id, s.sale_number]) || [])

  return (data || []).map(row => ({
    ...row,
    notes: notesMap.get(row.personal_sale_id) || row.notes,
    sale_number: saleNumberMap.get(row.personal_sale_id) ?? null
  }))
}

export async function getReceivablesStats(): Promise<ReceivablesStats> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('v_receivables')
    .select('status, expected_commission')
    .eq('user_id', user.id)

  if (error) throw error

  const rows = data || []
  
  const pending = rows.filter(r => r.status === 'pending')
  const overdue = rows.filter(r => r.status === 'overdue')
  const received = rows.filter(r => r.status === 'received')

  return {
    totalPending: pending.reduce((sum, r) => sum + (r.expected_commission || 0), 0),
    totalOverdue: overdue.reduce((sum, r) => sum + (r.expected_commission || 0), 0),
    totalReceived: received.reduce((sum, r) => sum + (r.expected_commission || 0), 0),
    countPending: pending.length,
    countOverdue: overdue.length,
    countReceived: received.length,
  }
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Marca uma parcela como recebida.
 * Insere registro na tabela received_payments.
 */
export async function markReceivableAsReceived(
  personalSaleId: string,
  installmentNumber: number,
  receivedAmount: number,
  receivedAt?: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const finalReceivedAt = receivedAt || new Date().toISOString()

    // Inserir marcação de recebimento
    const { error } = await supabase
      .from('received_payments')
      .insert({
        user_id: user.id,
        personal_sale_id: personalSaleId,
        installment_number: installmentNumber,
        received_amount: receivedAmount,
        received_at: finalReceivedAt,
      })

    if (error) {
      // Se já existe (UNIQUE constraint), tenta update
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('received_payments')
          .update({
            received_amount: receivedAmount,
            received_at: finalReceivedAt,
          })
          .eq('personal_sale_id', personalSaleId)
          .eq('installment_number', installmentNumber)
          .eq('user_id', user.id)

        if (updateError) throw updateError
      } else {
        throw error
      }
    }

    revalidatePath('/recebiveis')
    revalidatePath('/home')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error marking receivable as received:', err)
    return { success: false, error: 'Erro ao marcar como recebido' }
  }
}

/**
 * Desfaz a marcação de recebimento.
 * Remove registro da tabela received_payments.
 */
export async function undoReceivableReceived(
  personalSaleId: string,
  installmentNumber: number
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { error } = await supabase
      .from('received_payments')
      .delete()
      .eq('personal_sale_id', personalSaleId)
      .eq('installment_number', installmentNumber)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/recebiveis')
    revalidatePath('/home')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error undoing receivable received:', err)
    return { success: false, error: 'Erro ao desfazer recebimento' }
  }
}

/**
 * Atualiza observação de um recebimento.
 */
export async function updateReceivableNotes(
  personalSaleId: string,
  installmentNumber: number,
  notes: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Precisa existir um received_payment para adicionar nota
    // Se não existe, cria um com received_amount = 0 (parcela pendente com nota)
    const { data: existing } = await supabase
      .from('received_payments')
      .select('id')
      .eq('personal_sale_id', personalSaleId)
      .eq('installment_number', installmentNumber)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('received_payments')
        .update({ notes })
        .eq('personal_sale_id', personalSaleId)
        .eq('installment_number', installmentNumber)
        .eq('user_id', user.id)

      if (error) throw error
    } else {
      // Buscar valor esperado da view para criar o registro
      const { data: receivable } = await supabase
        .from('v_receivables')
        .select('expected_commission')
        .eq('personal_sale_id', personalSaleId)
        .eq('installment_number', installmentNumber)
        .eq('user_id', user.id)
        .single()

      const { error } = await supabase
        .from('received_payments')
        .insert({
          user_id: user.id,
          personal_sale_id: personalSaleId,
          installment_number: installmentNumber,
          received_amount: receivable?.expected_commission || 0,
          notes,
        })

      if (error) throw error
    }

    revalidatePath('/recebiveis')
    revalidatePath('/home')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error updating receivable notes:', err)
    return { success: false, error: 'Erro ao atualizar observação' }
  }
}
