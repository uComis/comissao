/**
 * @fileoverview Arquivo de compatibilidade para billing.
 * 
 * Este arquivo re-exporta do novo módulo billing/ para manter
 * compatibilidade com código existente durante a migração.
 * 
 * NOVO CÓDIGO DEVE IMPORTAR DE:
 * import { ... } from '@/app/actions/billing'
 */

// =====================================================
// RE-EXPORTS DO NOVO MÓDULO
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
// RE-EXPORTS DE SERVER ACTIONS (para Client Components)
// =====================================================

export {
  createSubscriptionAction,
  setupTrialSubscription,
  getBillingUsage,
  getBlockedSuppliers,
  getInvoicesAction,
  handleExpiredTrials,
  getRenewalAlerts,
  getSubscription,
  checkAndHandleExpiredTrial,
  markPlanAsNotifiedAction,
} from './billing-actions'

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
