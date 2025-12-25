'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { AsaasService } from '@/lib/clients/asaas'

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  document: string | null
  document_type: 'CPF' | 'CNPJ' | null
  updated_at: string
  created_at: string
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function updateProfile(input: {
  full_name?: string
  document?: string
  document_type?: 'CPF' | 'CNPJ'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      ...input,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Erro ao atualizar perfil')
  }

  // Sincronizar com Asaas se o usuário já tiver uma assinatura vinculada
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('asaas_customer_id')
      .eq('user_id', user.id)
      .not('asaas_customer_id', 'is', null)
      .maybeSingle()

    if (sub?.asaas_customer_id && (input.full_name || input.document)) {
      await AsaasService.updateCustomer(sub.asaas_customer_id, {
        name: input.full_name,
        cpfCnpj: input.document,
      })
    }
  } catch (asaasError) {
    console.error('Erro ao sincronizar perfil com Asaas:', asaasError)
    // Não travamos o fluxo aqui, apenas logamos
  }

  revalidatePath('/minhaconta')
  return { success: true }
}

