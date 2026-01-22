'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { AsaasService } from '@/lib/clients/asaas'

export async function updateProfile(input: {
  full_name?: string
  document?: string
  document_type?: 'CPF' | 'CNPJ'
  avatar_url?: string
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
    }, { onConflict: 'user_id' })

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

export type EnvironmentVariable = {
  key: string
  value: string | undefined
  isPublic: boolean
}

export async function getEnvironmentVariables(): Promise<{ success: boolean; data?: EnvironmentVariable[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user)
    return { success: false, error: 'Usuário não autenticado' }

  // Verificar se é super admin no banco
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.is_super_admin) {
    return { success: false, error: 'Acesso negado' }
  }

  // Retornar variáveis de ambiente
  const envVars: EnvironmentVariable[] = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL, isPublic: true },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, isPublic: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY, isPublic: false },
    { key: 'PIPEDRIVE_CLIENT_ID', value: process.env.PIPEDRIVE_CLIENT_ID, isPublic: false },
    { key: 'PIPEDRIVE_CLIENT_SECRET', value: process.env.PIPEDRIVE_CLIENT_SECRET, isPublic: false },
    { key: 'NEXT_PUBLIC_APP_URL', value: process.env.NEXT_PUBLIC_APP_URL, isPublic: true },
    { key: 'ASAAS_API_URL', value: process.env.ASAAS_API_URL, isPublic: false },
    { key: 'ASAAS_API_KEY', value: process.env.ASAAS_API_KEY, isPublic: false },
    { key: 'ASAAS_WEBHOOK_TOKEN', value: process.env.ASAAS_WEBHOOK_TOKEN, isPublic: false },
  ]

  return { success: true, data: envVars }
}

