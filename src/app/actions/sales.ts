'use server'

import { revalidatePath } from 'next/cache'
import { saleRepository } from '@/lib/repositories/sale-repository'
import { pipedriveSyncService } from '@/lib/services/pipedrive-sync-service'
import { commissionService } from '@/lib/services/commission-service'
import type { Sale, SaleWithSeller, SyncResult } from '@/types'

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Lista vendas da organização
 */
export async function getSales(organizationId: string): Promise<Sale[]> {
  return saleRepository.findByOrganization(organizationId)
}

/**
 * Lista vendas com dados do vendedor
 */
export async function getSalesWithSellers(organizationId: string): Promise<SaleWithSeller[]> {
  return saleRepository.findWithSellers(organizationId)
}

/**
 * Lista vendas de um período específico
 */
export async function getSalesByPeriod(
  organizationId: string,
  period: string
): Promise<SaleWithSeller[]> {
  return saleRepository.findWithSellersByPeriod(organizationId, period)
}

/**
 * Busca venda por ID
 */
export async function getSaleById(id: string): Promise<Sale | null> {
  return saleRepository.findById(id)
}

/**
 * Sincroniza vendas do Pipedrive (com throttle)
 * Retorna resultado do sync
 */
export async function syncSales(organizationId: string): Promise<ActionResult<SyncResult>> {
  try {
    const result = await pipedriveSyncService.syncIfNeeded(organizationId)
    
    // Revalida páginas se houve sync
    if (result.synced > 0) {
      revalidatePath('/vendas')
      revalidatePath('/dashboard')
    }

    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar vendas'
    return { success: false, error: message }
  }
}

/**
 * Força sincronização de vendas (ignora throttle)
 */
export async function forceSyncSales(organizationId: string): Promise<ActionResult<SyncResult>> {
  try {
    const result = await pipedriveSyncService.forceSync(organizationId)
    
    revalidatePath('/vendas')
    revalidatePath('/dashboard')

    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar vendas'
    return { success: false, error: message }
  }
}

/**
 * Sincroniza vendas e calcula comissões do período
 * Fluxo completo para página de vendas/dashboard
 */
export async function syncAndCalculate(
  organizationId: string,
  period: string
): Promise<ActionResult<{ sync: SyncResult; commission: { calculated: number; totalAmount: number } }>> {
  try {
    // 1. Sincroniza vendas
    const syncResult = await pipedriveSyncService.syncIfNeeded(organizationId)

    // 2. Calcula comissões do período
    const commissionResult = await commissionService.calculateForPeriod(organizationId, period)

    revalidatePath('/vendas')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: {
        sync: syncResult,
        commission: {
          calculated: commissionResult.calculated,
          totalAmount: commissionResult.totalAmount,
        },
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar vendas'
    return { success: false, error: message }
  }
}

/**
 * Deleta uma venda (e sua comissão associada)
 */
export async function deleteSale(id: string): Promise<ActionResult<void>> {
  try {
    await saleRepository.delete(id)
    revalidatePath('/vendas')
    revalidatePath('/dashboard')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: 'Erro ao excluir venda' }
  }
}

/**
 * Conta vendas de um período
 */
export async function countSalesByPeriod(
  organizationId: string,
  period: string
): Promise<number> {
  return saleRepository.countByPeriod(organizationId, period)
}

