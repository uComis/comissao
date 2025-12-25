'use server'

import { createClient } from '@/lib/supabase-server'
import { PostgrestError } from '@supabase/supabase-js'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'

export interface PlanLimits {
  max_suppliers: number
  max_sales_month: number
  max_users: number
  max_revenue_month: number | null
  features: Record<string, any>
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  plan_snapshot: PlanLimits
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  cancel_at_period_end: boolean
}

export interface UsageStats {
  user_id: string
  sales_count_current_month: number
  suppliers_count: number
  users_count: number
  last_reset_date: string
}

/**
 * Busca todos os planos públicos.
 */
export async function getPlans() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_public', true)
    .order('price', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Action para o UsageWidget e UI de billing.
 */
export async function getBillingUsage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const subscription = await getSubscription(user.id)
  const usage = await getUsageStats(user.id)

  if (!subscription || !usage) return null

  return {
    plan: subscription.plan_snapshot.name || subscription.plan_id.split('_')[0].toUpperCase(),
    vendas: {
      current: usage.sales_count_current_month,
      limit: subscription.plan_snapshot.max_sales_month,
    },
    pastas: {
      current: usage.suppliers_count,
      limit: subscription.plan_snapshot.max_suppliers,
    },
    trialEndsAt: subscription.trial_ends_at,
    status: subscription.status,
  }
}

/**
 * Busca a assinatura ativa do usuário.
 * Se não houver, retorna null.
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data as Subscription
}

/**
 * Busca as estatísticas de uso do usuário.
 */
export async function getUsageStats(userId: string): Promise<UsageStats | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as UsageStats
}

/**
 * Cria uma assinatura trial para um novo usuário.
 */
export async function setupTrialSubscription(userId: string) {
  const supabase = await createClient()

  // 1. Buscar o plano FREE para pegar os limites base
  const { data: freePlan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', 'free_monthly')
    .single()

  if (planError) throw planError

  // 2. Criar a assinatura status trialing
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 7 dias de trial

  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: 'free_monthly',
      status: 'trialing',
      plan_snapshot: {
        name: freePlan.name,
        max_suppliers: freePlan.max_suppliers,
        max_sales_month: freePlan.max_sales_month,
        max_users: freePlan.max_users,
        max_revenue_month: freePlan.max_revenue_month,
        features: freePlan.features
      },
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
    })

  if (subError) throw subError

  // 3. Inicializar usage_stats
  const { error: usageError } = await supabase
    .from('usage_stats')
    .insert({
      user_id: userId,
      sales_count_current_month: 0,
      suppliers_count: 0,
    })

  if (usageError) throw usageError
}

/**
 * Helper para verificar limites antes de uma ação.
 */
export async function checkLimit(
  userId: string, 
  feature: 'sales' | 'suppliers' | 'users'
): Promise<{ allowed: boolean; error?: string }> {
  const subscription = await getSubscription(userId)
  const usage = await getUsageStats(userId)

  if (!subscription || !usage) {
    return { allowed: false, error: 'Assinatura não encontrada. Por favor, entre em contato com o suporte.' }
  }

  const limits = subscription.plan_snapshot

  switch (feature) {
    case 'sales':
      if (usage.sales_count_current_month >= limits.max_sales_month) {
        return { 
          allowed: false, 
          error: `Limite de vendas atingido (${limits.max_sales_month}/${limits.max_sales_month}). Faça um upgrade para continuar.` 
        }
      }
      break
    case 'suppliers':
      if (usage.suppliers_count >= limits.max_suppliers) {
        return { 
          allowed: false, 
          error: `Limite de fornecedores/pastas atingido (${limits.max_suppliers}/${limits.max_suppliers}). Faça um upgrade para continuar.` 
        }
      }
      break
    case 'users':
      if (usage.max_users >= limits.max_users) {
         return { 
          allowed: false, 
          error: `Limite de usuários atingido (${limits.max_users}/${limits.max_users}). Faça um upgrade para continuar.` 
        }
      }
      break
  }

  return { allowed: true }
}

/**
 * Incrementa o uso de uma feature.
 */
export async function incrementUsage(
  userId: string,
  feature: 'sales' | 'suppliers' | 'users'
) {
  const supabase = await createClient()
  
  if (feature === 'sales') {
    await supabase.rpc('increment_sales_usage', { user_id_param: userId })
  } else if (feature === 'suppliers') {
    await supabase.rpc('increment_suppliers_usage', { user_id_param: userId })
  } else {
    await supabase.rpc('increment_users_usage', { user_id_param: userId })
  }
}

/**
 * Decrementa o uso de uma feature (ex: excluir venda).
 */
export async function decrementUsage(
  userId: string,
  feature: 'sales' | 'suppliers' | 'users'
) {
  const supabase = await createClient()
  
  if (feature === 'sales') {
    await supabase.rpc('decrement_sales_usage', { user_id_param: userId })
  } else if (feature === 'suppliers') {
    await supabase.rpc('decrement_suppliers_usage', { user_id_param: userId })
  } else {
    await supabase.rpc('decrement_users_usage', { user_id_param: userId })
  }
}

