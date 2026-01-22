'use server'

import { createClient } from '@/lib/supabase-server'
import { getEffectiveSubscription, PlanLimits, TrialInfo, RenewalAlert } from './billing'

// =====================================================
// TYPES - Estrutura unificada do usuário
// =====================================================

export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  document: string | null
  document_type: 'CPF' | 'CNPJ' | null
  avatar_url: string | null
  is_super_admin: boolean
  updated_at: string
  created_at: string
}

export interface UserPreferences {
  user_mode: 'personal' | 'organization'
  commission_goal: number | null
}

export interface UserUsage {
  user_id: string
  sales_count_current_month: number
  suppliers_count: number
  users_count: number
  last_reset_date: string
}

export interface UserBilling {
  planGroup: 'free' | 'pro' | 'ultra'
  effectivePlan: 'free' | 'pro' | 'ultra'
  isAnnual: boolean
  isInTrial: boolean
  isPaidUp: boolean
  asaasSubscriptionId: string | null
  trial: TrialInfo
  renewalAlert: RenewalAlert | null
  limits: PlanLimits
}

export interface CurrentUser {
  // Auth básico
  id: string
  email: string
  createdAt: string

  // Dados
  profile: UserProfile | null
  preferences: UserPreferences | null
  billing: UserBilling | null
  usage: UserUsage | null
}

// =====================================================
// FUNÇÃO PRINCIPAL - FONTE ÚNICA DA VERDADE
// =====================================================

/**
 * Retorna TODOS os dados do usuário atual em uma única chamada.
 * 
 * Esta é a FONTE ÚNICA DA VERDADE para dados do usuário.
 * Use esta função em vez de múltiplas chamadas separadas.
 * 
 * Equivalente a GET /api/user em arquitetura REST tradicional.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  // 1. Autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Buscar todos os dados em paralelo
  const [profileResult, preferencesResult, usageResult, effectiveSub] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, user_id, full_name, document, document_type, avatar_url, is_super_admin, updated_at, created_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_preferences')
      .select('user_mode, commission_goal')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('usage_stats')
      .select('user_id, sales_count_current_month, suppliers_count, users_count, last_reset_date')
      .eq('user_id', user.id)
      .maybeSingle(),
    getEffectiveSubscription(user.id)
  ])

  // 3. Montar objeto unificado
  const profile: UserProfile | null = profileResult.data ? {
    id: profileResult.data.id,
    user_id: profileResult.data.user_id,
    full_name: profileResult.data.full_name,
    document: profileResult.data.document,
    document_type: profileResult.data.document_type,
    avatar_url: profileResult.data.avatar_url,
    is_super_admin: profileResult.data.is_super_admin ?? false,
    updated_at: profileResult.data.updated_at,
    created_at: profileResult.data.created_at
  } : null

  const preferences: UserPreferences | null = preferencesResult.data ? {
    user_mode: preferencesResult.data.user_mode,
    commission_goal: preferencesResult.data.commission_goal ?? null
  } : null

  const usage: UserUsage | null = usageResult.data ? {
    user_id: usageResult.data.user_id,
    sales_count_current_month: usageResult.data.sales_count_current_month,
    suppliers_count: usageResult.data.suppliers_count,
    users_count: usageResult.data.users_count,
    last_reset_date: usageResult.data.last_reset_date
  } : null

  const billing: UserBilling | null = effectiveSub ? {
    planGroup: effectiveSub.subscription.plan_group,
    effectivePlan: effectiveSub.effectivePlanGroup,
    isAnnual: effectiveSub.subscription.is_annual,
    isInTrial: effectiveSub.isInTrial,
    isPaidUp: effectiveSub.isPaidUp,
    asaasSubscriptionId: effectiveSub.subscription.asaas_subscription_id,
    trial: effectiveSub.trial,
    renewalAlert: effectiveSub.renewalAlert,
    limits: effectiveSub.limits
  } : null

  return {
    id: user.id,
    email: user.email || '',
    createdAt: user.created_at,
    profile,
    preferences,
    billing,
    usage
  }
}

/**
 * Versão simplificada que retorna apenas dados essenciais.
 * Útil para componentes que só precisam de info básica.
 */
export async function getCurrentUserBasic() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return {
    id: user.id,
    email: user.email || ''
  }
}
