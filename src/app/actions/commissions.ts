'use server'

import { revalidatePath } from 'next/cache'
import { commissionService } from '@/lib/services/commission-service'
import { commissionRepository } from '@/lib/repositories/commission-repository'
import type {
  Commission,
  CommissionWithDetails,
  SellerCommissionSummary,
} from '@/types'

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

type CalculatePeriodResult = {
  calculated: number
  skipped: number
  errors: number
  totalAmount: number
}

/**
 * Lista comissões da organização
 */
export async function getCommissions(organizationId: string): Promise<Commission[]> {
  return commissionRepository.findByOrganization(organizationId)
}

/**
 * Lista comissões de um período
 */
export async function getCommissionsByPeriod(
  organizationId: string,
  period: string
): Promise<Commission[]> {
  return commissionRepository.findByPeriod(organizationId, period)
}

/**
 * Lista comissões com detalhes (vendedor, venda, regra)
 */
export async function getCommissionsWithDetails(
  organizationId: string,
  period?: string
): Promise<CommissionWithDetails[]> {
  return commissionService.getCommissionsWithDetails(organizationId, period)
}

/**
 * Busca comissão por ID
 */
export async function getCommissionById(id: string): Promise<Commission | null> {
  return commissionRepository.findById(id)
}

/**
 * Calcula comissões para todas as vendas de um período
 */
export async function calculateCommissionsForPeriod(
  organizationId: string,
  period: string
): Promise<ActionResult<CalculatePeriodResult>> {
  try {
    const result = await commissionService.calculateForPeriod(organizationId, period)

    revalidatePath('/vendas')
    revalidatePath('/dashboard')

    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao calcular comissões'
    return { success: false, error: message }
  }
}

/**
 * Recalcula comissões de um vendedor específico
 */
export async function recalculateSellerCommissions(
  sellerId: string
): Promise<ActionResult<CalculatePeriodResult>> {
  try {
    const result = await commissionService.recalculateForSeller(sellerId)

    revalidatePath('/vendas')
    revalidatePath('/dashboard')
    revalidatePath('/vendedores')

    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao recalcular comissões'
    return { success: false, error: message }
  }
}

/**
 * Recalcula comissões de todos os vendedores vinculados a uma regra
 */
export async function recalculateRuleCommissions(
  ruleId: string,
  organizationId: string
): Promise<ActionResult<CalculatePeriodResult>> {
  try {
    const result = await commissionService.recalculateForRule(ruleId, organizationId)

    revalidatePath('/vendas')
    revalidatePath('/dashboard')
    revalidatePath('/regras')

    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao recalcular comissões'
    return { success: false, error: message }
  }
}

/**
 * Obtém resumo de comissões por vendedor
 */
export async function getSellerCommissionsSummary(
  organizationId: string,
  period: string
): Promise<SellerCommissionSummary[]> {
  return commissionService.getSellersSummary(organizationId, period)
}

/**
 * Obtém total de comissões de um período
 */
export async function getTotalCommissionsByPeriod(
  organizationId: string,
  period: string
): Promise<number> {
  return commissionService.getTotalByPeriod(organizationId, period)
}

/**
 * Deleta comissão por ID
 */
export async function deleteCommission(id: string): Promise<ActionResult<void>> {
  try {
    await commissionRepository.delete(id)
    revalidatePath('/vendas')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: 'Erro ao excluir comissão' }
  }
}

/**
 * Deleta todas as comissões de um período
 */
export async function deleteCommissionsByPeriod(
  organizationId: string,
  period: string
): Promise<ActionResult<void>> {
  try {
    await commissionRepository.deleteByPeriod(organizationId, period)
    revalidatePath('/vendas')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: 'Erro ao excluir comissões do período' }
  }
}

