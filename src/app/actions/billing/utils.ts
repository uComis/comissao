'use server'

import type { UserSubscription, PlanGroup } from './types'

// =====================================================
// CONSTANTES
// =====================================================

export const PLAN_HIERARCHY: Record<PlanGroup, number> = {
  free: 0,
  pro: 1,
  ultra: 2,
}

export const PLAN_PRICES: Record<PlanGroup, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 29.90, annual: 299.00 },
  ultra: { monthly: 49.90, annual: 499.00 },
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Calcula o crédito proporcional para upgrade de plano.
 * Usado quando o usuário faz upgrade no meio do período.
 */
export function calculateUpgradeCredit(
  currentSub: UserSubscription,
  newPlanGroup: PlanGroup
): number {
  if (!currentSub.current_period_end) return 0

  const now = new Date()
  const periodEnd = new Date(currentSub.current_period_end)
  
  // Se já passou do período, não tem crédito
  if (now >= periodEnd) return 0

  const daysRemaining = Math.ceil(
    (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Valor diário do plano atual
  const currentPlanValue = getPlanValue(currentSub.plan_group, currentSub.is_annual)
  const daysInPeriod = currentSub.is_annual ? 365 : 30

  const credit = (currentPlanValue / daysInPeriod) * daysRemaining
  
  return Math.round(credit * 100) / 100 // Arredondar para 2 casas decimais
}

/**
 * Retorna o valor do plano baseado no grupo e ciclo.
 */
export function getPlanValue(planGroup: PlanGroup, isAnnual: boolean): number {
  const prices = PLAN_PRICES[planGroup]
  return isAnnual ? prices.annual : prices.monthly
}

/**
 * Verifica se é um upgrade de plano.
 */
export function isUpgrade(from: PlanGroup, to: PlanGroup): boolean {
  return PLAN_HIERARCHY[to] > PLAN_HIERARCHY[from]
}

/**
 * Verifica se é um downgrade de plano.
 */
export function isDowngrade(from: PlanGroup, to: PlanGroup): boolean {
  return PLAN_HIERARCHY[to] < PLAN_HIERARCHY[from]
}

/**
 * Converte cycle do Asaas para is_annual boolean.
 */
export function cycleToIsAnnual(cycle: string): boolean {
  return cycle === 'ANNUALLY' || cycle === 'YEARLY'
}

/**
 * Converte is_annual para cycle do Asaas.
 */
export function isAnnualToCycle(isAnnual: boolean): 'MONTHLY' | 'ANNUALLY' {
  return isAnnual ? 'ANNUALLY' : 'MONTHLY'
}
