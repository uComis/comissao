// =====================================================
// TYPES - Tipos compartilhados do billing
// =====================================================

export type PlanGroup = 'free' | 'pro' | 'ultra'

export interface UserSubscription {
  user_id: string
  plan_group: PlanGroup
  is_annual: boolean
  trial_start_date: string
  trial_period_days: number
  subscription_started_at: string | null
  last_payment_date: string | null
  current_period_start: string | null
  current_period_end: string | null
  next_billing_date: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  last_verified_at: string
  created_at: string
  updated_at: string
}

export interface TrialInfo {
  isActive: boolean
  daysRemaining: number
  endsAt: string | null
}

export interface RenewalAlert {
  needsAlert: boolean
  daysRemaining: number | null
  urgencyLevel: 'urgent' | 'warning' | null
}

export interface PlanLimits {
  plan_group: PlanGroup
  max_suppliers: number
  max_sales_month: number
  max_users: number
  features: Record<string, unknown>
}

export interface EffectiveSubscription {
  subscription: UserSubscription
  effectivePlanGroup: PlanGroup
  isInTrial: boolean
  isPaidUp: boolean
  trial: TrialInfo
  renewalAlert: RenewalAlert | null
  limits: PlanLimits
}

export interface UsageStats {
  user_id: string
  sales_count_current_month: number
  suppliers_count: number
  users_count: number
  last_reset_date: string
}

export type CreateSubscriptionResult =
  | { success: true; subscriptionId: string; invoiceUrl: string; invoiceId?: string }
  | { success: false; error: string; message: string }
