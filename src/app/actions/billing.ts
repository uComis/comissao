'use server'

/**
 * @fileoverview Arquivo de compatibilidade para billing.
 * 
 * Este arquivo re-exporta do novo módulo billing/ para manter
 * compatibilidade com código existente durante a migração.
 * 
 * NOVO CÓDIGO DEVE IMPORTAR DE:
 * import { ... } from '@/app/actions/billing'
 */

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { getCurrentUser } from './user'
import { revalidatePath } from 'next/cache'
import { AsaasService } from '@/lib/clients/asaas'

// =====================================================
// RE-EXPORTS DO NOVO MÓDULO (importando dos arquivos específicos)
// =====================================================

export type {
  PlanGroup,
  UserSubscription,
  TrialInfo,
  RenewalAlert,
  PlanLimits,
  EffectiveSubscription,
  UsageStats,
  CreateSubscriptionResult,
} from './billing/types'

export {
  createSubscription,
  activatePlan,
  verifySubscriptionStatus,
} from './billing/subscriptions'

export {
  getEffectiveSubscription,
  getPlans,
  setupTrial,
  getDataRetentionFilter,
  getUsageStats,
  checkLimit,
  incrementUsage,
  decrementUsage,
} from './billing/plans'

export {
  PLAN_HIERARCHY,
  PLAN_PRICES,
  calculateUpgradeCredit,
  getPlanValue,
  isUpgrade,
  isDowngrade,
} from './billing/utils'

// =====================================================
// IMPORTS INTERNOS PARA FUNÇÕES DE COMPATIBILIDADE
// =====================================================

import { 
  getEffectiveSubscription, 
  setupTrial,
} from './billing/plans'

import { createSubscription } from './billing/subscriptions'

/**
 * @deprecated Use createSubscription() do novo módulo
 * Mantido por compatibilidade - redireciona para nova implementação
 */
export async function createSubscriptionAction(planId: string) {
  const { createSubscription } = await import('./billing')
  return createSubscription(planId)
}

/**
 * @deprecated Use setupTrial() no lugar
 */
export async function setupTrialSubscription(userId: string) {
  return setupTrial(userId)
}

/**
 * Helper: Transforma getCurrentUser() no formato antigo de getBillingUsage()
 * @deprecated Use getCurrentUser() diretamente
 */
export async function getBillingUsage() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.billing || !currentUser?.usage) return null

  const { billing, usage } = currentUser
  const shouldShowTrialAlert = billing.isInTrial && !billing.asaasSubscriptionId

  return {
    plan: billing.effectivePlan.toUpperCase(),
    contractedPlan: billing.planGroup,
    vendas: {
      current: usage.sales_count_current_month,
      limit: billing.limits.max_sales_month,
    },
    pastas: {
      current: usage.suppliers_count,
      limit: billing.limits.max_suppliers,
    },
    trial: {
      ...billing.trial,
      shouldShowAlert: shouldShowTrialAlert,
    },
    renewalAlert: billing.renewalAlert,
    isInTrial: billing.isInTrial,
    isPaidUp: billing.isPaidUp,
  }
}

/**
 * Verifica quais pastas (fornecedores) estão bloqueadas pelo limite do plano.
 */
export async function getBlockedSuppliers(userId?: string): Promise<{
  allowedCount: number
  blockedCount: number
  blockedSupplierIds: string[]
}> {
  const supabase = await createClient()
  
  let effectiveUserId = userId
  if (!effectiveUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { allowedCount: 0, blockedCount: 0, blockedSupplierIds: [] }
    }
    effectiveUserId = user.id
  }
  
  const effectiveSub = await getEffectiveSubscription(effectiveUserId)
  
  if (!effectiveSub) {
    return { allowedCount: 0, blockedCount: 0, blockedSupplierIds: [] }
  }

  const maxSuppliers = effectiveSub.limits.max_suppliers || 1

  const { data: suppliers, error } = await supabase
    .from('personal_suppliers')
    .select('id, created_at')
    .eq('user_id', effectiveUserId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error || !suppliers) {
    return { allowedCount: 0, blockedCount: 0, blockedSupplierIds: [] }
  }

  const totalSuppliers = suppliers.length
  const allowedCount = Math.min(totalSuppliers, maxSuppliers)
  const blockedCount = Math.max(0, totalSuppliers - maxSuppliers)
  
  const blockedSupplierIds = suppliers
    .slice(maxSuppliers)
    .map(s => s.id)

  return {
    allowedCount,
    blockedCount,
    blockedSupplierIds
  }
}

/**
 * Busca todas as cobranças do usuário no Asaas.
 */
export async function getInvoicesAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('asaas_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.asaas_customer_id) return []

  try {
    const payments = await AsaasService.getCustomerPayments(subscription.asaas_customer_id)
    
    return payments.data
      .filter(p => !p.deleted)
      .map(p => ({
        id: p.id,
        status: p.status,
        value: p.value,
        dueDate: p.dueDate,
        invoiceUrl: p.invoiceUrl,
        description: p.description || 'Assinatura uComis'
      }))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
  } catch (error) {
    console.error('Erro ao buscar faturas:', error)
    return []
  }
}

/**
 * Faz a transição de trials expirados para o plano correto.
 * @deprecated Cache inteligente faz isso automaticamente
 */
export async function handleExpiredTrials() {
  const supabase = await createAdminClient()
  
  const { data: allSubs } = await supabase
    .from('user_subscriptions')
    .select('*')
  
  if (!allSubs) return

  for (const sub of allSubs) {
    const now = new Date()
    const trialEnd = new Date(sub.trial_start_date)
    trialEnd.setDate(trialEnd.getDate() + sub.trial_period_days)
    
    if (now > trialEnd && !sub.current_period_end) {
      if (sub.plan_group !== 'free') {
        await supabase
          .from('user_subscriptions')
          .update({ plan_group: 'free' })
          .eq('user_id', sub.user_id)
      }
    }
    
    if (now > trialEnd && sub.current_period_end) {
      const periodEnd = new Date(sub.current_period_end)
      if (now > periodEnd) {
        await supabase
          .from('user_subscriptions')
          .update({ 
            plan_group: 'free',
            current_period_end: null,
            next_billing_date: null
          })
          .eq('user_id', sub.user_id)
      }
    }
  }
}

/**
 * Retorna informações sobre alertas de renovação.
 */
export async function getRenewalAlerts(userId: string) {
  const effectiveSub = await getEffectiveSubscription(userId)
  if (!effectiveSub) return null
  
  return effectiveSub.renewalAlert
}

// =====================================================
// TIPOS ANTIGOS (compatibilidade)
// =====================================================

/**
 * @deprecated Usar EffectiveSubscription no lugar
 */
export type Subscription = {
  id: string
  user_id: string
  plan_id: string
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  plan_snapshot: {
    plan_group: string
    max_suppliers: number
    max_sales_month: number
    max_users: number
    features: Record<string, unknown>
  }
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  cancel_at_period_end: boolean
  notified_plan_id: string | null
}

/**
 * @deprecated Usar getEffectiveSubscription() no lugar
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const effectiveSub = await getEffectiveSubscription(userId)
  if (!effectiveSub) return null
  
  return {
    id: effectiveSub.subscription.user_id,
    user_id: effectiveSub.subscription.user_id,
    plan_id: effectiveSub.effectivePlanGroup + '_monthly',
    status: effectiveSub.isInTrial ? 'trialing' : effectiveSub.isPaidUp ? 'active' : 'past_due',
    plan_snapshot: effectiveSub.limits,
    trial_ends_at: effectiveSub.trial.endsAt,
    current_period_start: effectiveSub.subscription.current_period_start || new Date().toISOString(),
    current_period_end: effectiveSub.subscription.current_period_end,
    asaas_customer_id: effectiveSub.subscription.asaas_customer_id,
    asaas_subscription_id: effectiveSub.subscription.asaas_subscription_id,
    cancel_at_period_end: false,
    notified_plan_id: null,
  }
}

/**
 * @deprecated Função antiga, não faz nada na nova estrutura
 */
export async function checkAndHandleExpiredTrial(userId: string) {
  return
}

/**
 * @deprecated Função antiga, agora é automático
 */
export async function markPlanAsNotifiedAction() {
  revalidatePath('/')
}
