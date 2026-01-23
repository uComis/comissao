// =====================================================
// FACADE - Exports públicos do módulo billing
// =====================================================

// Types
export type {
  PlanGroup,
  UserSubscription,
  TrialInfo,
  RenewalAlert,
  PlanLimits,
  EffectiveSubscription,
  UsageStats,
  CreateSubscriptionResult,
} from './types'

// Subscriptions (3 rotinas principais)
export { 
  createSubscription,
  activatePlan,
  verifySubscriptionStatus,
} from './subscriptions'

// Plans (cache inteligente + helpers)
export {
  getEffectiveSubscription,
  getPlans,
  setupTrial,
  getDataRetentionFilter,
  getUsageStats,
  checkLimit,
  incrementUsage,
  decrementUsage,
} from './plans'

// Utils (helpers públicos)
export {
  PLAN_HIERARCHY,
  PLAN_PRICES,
  calculateUpgradeCredit,
  getPlanValue,
  isUpgrade,
  isDowngrade,
} from './utils'
