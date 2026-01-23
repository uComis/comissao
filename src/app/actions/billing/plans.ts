'use server'

import { createClient } from '@/lib/supabase-server'
import { verifySubscriptionStatus } from './subscriptions'
import type { 
  UserSubscription, 
  PlanGroup, 
  TrialInfo, 
  RenewalAlert, 
  PlanLimits, 
  EffectiveSubscription,
  UsageStats
} from './types'

// =====================================================
// getEffectiveSubscription() - Cache Inteligente
// =====================================================

/**
 * Retorna a assinatura efetiva do usuário com cache inteligente.
 * 
 * Cache:
 * - Pendentes: verifica a cada 1h
 * - Pagos: verifica a cada 8h
 * 
 * Esta é a FONTE ÚNICA DA VERDADE para verificação de plano/trial.
 */
export async function getEffectiveSubscription(userId: string): Promise<EffectiveSubscription | null> {
  const supabase = await createClient()
  
  // 1. Buscar do banco (cache)
  const { data: sub, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !sub) return null

  const subscription = sub as UserSubscription
  
  // 2. Verificar se precisa reconciliar com Asaas
  if (shouldVerifySubscription(subscription)) {
    console.log('[Cache] Verificando com Asaas...')
    await verifySubscriptionStatus(userId, subscription)
    
    // Buscar dados atualizados
    const { data: freshSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (freshSub) {
      return calculateEffectiveState(freshSub as UserSubscription, supabase)
    }
  }
  
  // 3. Cache válido
  return calculateEffectiveState(subscription, supabase)
}

/**
 * Decide se precisa verificar com Asaas.
 */
function shouldVerifySubscription(sub: UserSubscription): boolean {
  const now = new Date()
  const lastVerified = new Date(sub.last_verified_at)
  const hoursSince = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60)
  
  const hasPendingInvoice = sub.asaas_subscription_id && !sub.current_period_end
  const hasPaidPlan = sub.current_period_end !== null
  
  // Pendentes: verifica a cada 1h
  if (hasPendingInvoice && hoursSince > 1) {
    return true
  }
  
  // Pagos: verifica a cada 8h (detecta inadimplência)
  if (hasPaidPlan && hoursSince > 8) {
    return true
  }
  
  return false
}

/**
 * Calcula o estado efetivo da assinatura.
 */
async function calculateEffectiveState(
  sub: UserSubscription, 
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<EffectiveSubscription> {
  const now = new Date()
  
  // Trial ativo?
  let isInTrial = false
  let trialEnd = new Date()
  
  if (sub.trial_start_date && sub.trial_period_days) {
    trialEnd = new Date(sub.trial_start_date)
    trialEnd.setDate(trialEnd.getDate() + sub.trial_period_days)
    isInTrial = now < trialEnd
  }
  
  // Pago?
  const isPaidUp = sub.current_period_end 
    ? now <= new Date(sub.current_period_end) 
    : false
  
  // Plano efetivo
  let effectivePlanGroup: PlanGroup = 'free'
  if (isInTrial) effectivePlanGroup = 'ultra'
  else if (isPaidUp) effectivePlanGroup = sub.plan_group
  else effectivePlanGroup = 'free'
  
  // Info de trial
  const daysRemaining = isInTrial 
    ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  const trial: TrialInfo = {
    isActive: isInTrial,
    daysRemaining,
    endsAt: trialEnd.toISOString()
  }
  
  // Alerta de renovação
  let renewalAlert: RenewalAlert | null = null
  if (sub.plan_group !== 'free' && sub.current_period_end) {
    const daysUntilRenewal = Math.ceil(
      (new Date(sub.current_period_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilRenewal <= 1) {
      renewalAlert = { needsAlert: true, daysRemaining: daysUntilRenewal, urgencyLevel: 'urgent' }
    } else if (daysUntilRenewal <= 3) {
      renewalAlert = { needsAlert: true, daysRemaining: daysUntilRenewal, urgencyLevel: 'warning' }
    } else {
      renewalAlert = { needsAlert: false, daysRemaining: daysUntilRenewal, urgencyLevel: null }
    }
  }
  
  // Limites do plano efetivo
  const { data: planLimits } = await supabase
    .from('plans')
    .select('plan_group, max_suppliers, max_sales_month, max_users, features')
    .eq('plan_group', effectivePlanGroup)
    .limit(1)
    .single()
  
  const limits: PlanLimits = planLimits || {
    plan_group: 'free',
    max_suppliers: 1,
    max_sales_month: 30,
    max_users: 1,
    features: {}
  }
  
  return {
    subscription: sub,
    effectivePlanGroup,
    isInTrial,
    isPaidUp,
    trial,
    renewalAlert,
    limits
  }
}

// =====================================================
// OUTRAS FUNÇÕES DE PLANS
// =====================================================

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
 * Cria uma assinatura trial para um novo usuário.
 */
export async function setupTrial(userId: string) {
  const supabase = await createClient()

  // Buscar o plano ULTRA para pegar trial_days
  const { data: ultraPlan } = await supabase
    .from('plans')
    .select('trial_days')
    .eq('id', 'ultra_monthly')
    .single()

  const trialDays = ultraPlan?.trial_days || 14

  // Verificar se já existe
  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (!existingSub) {
    // Criar registro
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_group: 'free',
        is_annual: false,
        trial_start_date: new Date().toISOString(),
        trial_period_days: trialDays,
        last_verified_at: new Date().toISOString(),
      })

    if (subError) throw subError
  }

  // Inicializar usage_stats
  const { error: usageError } = await supabase
    .from('usage_stats')
    .upsert({
      user_id: userId,
      sales_count_current_month: 0,
      suppliers_count: 0,
      users_count: 0,
    }, { onConflict: 'user_id' })

  if (usageError) throw usageError
}

/**
 * Retorna a data mínima permitida para consulta de vendas baseada no plano.
 */
export async function getDataRetentionFilter(userId: string): Promise<Date | null> {
  const effectiveSub = await getEffectiveSubscription(userId)
  if (!effectiveSub) return null

  const retentionDays = effectiveSub.limits.features?.data_retention_days
  
  if (retentionDays === null || retentionDays === undefined) {
    return null
  }

  if (typeof retentionDays === 'number' && retentionDays > 0) {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - retentionDays)
    return minDate
  }

  return null
}

/**
 * Busca usage_stats do usuário.
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
 * Verifica limite antes de uma ação.
 */
export async function checkLimit(
  userId: string, 
  feature: 'sales' | 'suppliers' | 'users'
): Promise<{ allowed: boolean; error?: string }> {
  let effectiveSub = await getEffectiveSubscription(userId)
  let usage = await getUsageStats(userId)

  // Defensive: criar se não existir
  if (!effectiveSub || !usage) {
    try {
      await setupTrial(userId)
      effectiveSub = await getEffectiveSubscription(userId)
      usage = await getUsageStats(userId)
    } catch (err) {
      console.error('Erro ao criar subscription automática:', err)
      return { allowed: false, error: 'Assinatura não encontrada.' }
    }
  }

  if (!effectiveSub || !usage) {
    return { allowed: false, error: 'Assinatura não encontrada.' }
  }

  const limits = effectiveSub.limits

  switch (feature) {
    case 'sales':
      if (usage.sales_count_current_month >= limits.max_sales_month) {
        return { 
          allowed: false, 
          error: `Limite de vendas atingido (${limits.max_sales_month}/${limits.max_sales_month}). Faça um upgrade.` 
        }
      }
      break
    case 'suppliers':
      if (usage.suppliers_count >= limits.max_suppliers) {
        return { 
          allowed: false, 
          error: `Limite de fornecedores atingido (${limits.max_suppliers}/${limits.max_suppliers}). Faça um upgrade.` 
        }
      }
      break
    case 'users':
      if (usage.users_count >= limits.max_users) {
        return { 
          allowed: false, 
          error: `Limite de usuários atingido (${limits.max_users}/${limits.max_users}). Faça um upgrade.` 
        }
      }
      break
  }

  return { allowed: true }
}

/**
 * Incrementa uso de uma feature.
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
 * Decrementa uso de uma feature.
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
