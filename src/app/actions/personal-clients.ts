'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { PersonalClient, CreatePersonalClientInput } from '@/types'

// Schemas
const createClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos').nullable().optional(),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos').nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  notes: z.string().nullable().optional(),
}).refine(
  (data) => !(data.cpf && data.cnpj),
  { message: 'Informe CPF ou CNPJ, não ambos' }
)

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// =====================================================
// QUERIES
// =====================================================

export async function getPersonalClients(): Promise<PersonalClient[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .rpc('get_personal_clients_with_stats', { p_user_id: user.id })

  if (error) throw error
  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    total_sales: Number(row.total_sales) || 0,
    total_gross: Number(row.total_gross) || 0,
    total_commission: Number(row.total_commission) || 0,
  })) as PersonalClient[]
}

export async function searchPersonalClients(search: string): Promise<PersonalClient[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('personal_clients')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .ilike('name', `%${search}%`)
    .order('name', { ascending: true })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function getPersonalClientById(id: string): Promise<PersonalClient | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personal_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

// =====================================================
// MUTATIONS
// =====================================================

export async function createPersonalClient(
  input: CreatePersonalClientInput
): Promise<ActionResult<PersonalClient>> {
  const parsed = createClientSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Limpar documento (apenas números)
    const cpf = parsed.data.cpf?.replace(/\D/g, '') || null
    const cnpj = parsed.data.cnpj?.replace(/\D/g, '') || null

    const { data, error } = await supabase
      .from('personal_clients')
      .insert({
        user_id: user.id,
        name: parsed.data.name.trim(),
        cpf: cpf && cpf.length === 11 ? cpf : null,
        cnpj: cnpj && cnpj.length === 14 ? cnpj : null,
        phone: parsed.data.phone?.trim() || null,
        email: parsed.data.email?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/minhasvendas')
    revalidatePath('/clientes')
    return { success: true, data }
  } catch (err) {
    console.error('Error creating client:', err)
    return { success: false, error: 'Erro ao criar cliente' }
  }
}

export async function updatePersonalClient(
  id: string,
  input: Partial<CreatePersonalClientInput>
): Promise<ActionResult<PersonalClient>> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.cpf !== undefined) {
      const cpf = input.cpf?.replace(/\D/g, '') || null
      updateData.cpf = cpf && cpf.length === 11 ? cpf : null
    }
    if (input.cnpj !== undefined) {
      const cnpj = input.cnpj?.replace(/\D/g, '') || null
      updateData.cnpj = cnpj && cnpj.length === 14 ? cnpj : null
    }
    if (input.phone !== undefined) updateData.phone = input.phone?.trim() || null
    if (input.email !== undefined) updateData.email = input.email?.trim() || null
    if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null

    const { data, error } = await supabase
      .from('personal_clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/clientes')
    return { success: true, data }
  } catch (err) {
    console.error('Error updating client:', err)
    return { success: false, error: 'Erro ao atualizar cliente' }
  }
}

export async function deletePersonalClient(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    // Soft delete
    const { error } = await supabase
      .from('personal_clients')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/clientes')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error deleting client:', err)
    return { success: false, error: 'Erro ao excluir cliente' }
  }
}

