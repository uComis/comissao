'use server'

import { revalidatePath } from 'next/cache'
import { commissionService } from '@/lib/services/commission-service'
import { commissionRepository } from '@/lib/repositories/commission-repository'
import type {
  Commission,
  CommissionWithDetails,
  SellerCommissionSummary,
  SaleWithCommission,
  DashboardSummary,
  DashboardHistory,
  CommissionSummary,
  SellerHistoryEntry,
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
 * @deprecated Use closePeriod para fechar período
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
    console.error('Error in calculateCommissionsForPeriod:', err)
    return { success: false, error: message }
  }
}

/**
 * Retorna vendas do período com comissões (híbrido)
 * - Vendas fechadas: valor persistido
 * - Vendas abertas: cálculo on-the-fly
 */
export async function getSalesWithCommissions(
  organizationId: string,
  period: string
): Promise<SaleWithCommission[]> {
  return commissionService.getSalesWithCommissions(organizationId, period)
}

/**
 * Retorna vendas do período com comissões - PAGINADO
 */
export async function getSalesWithCommissionsPaginated(
  organizationId: string,
  period: string,
  page: number,
  pageSize: number
): Promise<{ data: SaleWithCommission[]; total: number }> {
  return commissionService.getSalesWithCommissionsPaginated(organizationId, period, page, pageSize)
}

/**
 * Retorna totais do período (para cards de resumo)
 */
export async function getPeriodTotals(
  organizationId: string,
  period: string
): Promise<{
  count: number
  gross: number
  net: number
  commission: number
  openCount: number
  closedCount: number
}> {
  return commissionService.getPeriodTotals(organizationId, period)
}

/**
 * Fecha período - persiste comissões de todas as vendas abertas
 * Ação irreversível: valores são travados
 */
export async function closePeriod(
  organizationId: string,
  period: string
): Promise<ActionResult<CalculatePeriodResult>> {
  try {
    const result = await commissionService.closePeriod(organizationId, period)

    revalidatePath('/vendas')
    revalidatePath('/dashboard')

    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao fechar período'
    console.error('Error in closePeriod:', err)
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
    console.error('Error in recalculateSellerCommissions:', err)
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
    console.error('Error in recalculateRuleCommissions:', err)
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
    console.error('Error in deleteCommission:', err)
    return { success: false, error: 'Erro ao excluir comissão' }
  }
}

/**
 * Estorna comissões (deleta por sale_ids)
 * Permite recálculo on-the-fly das vendas afetadas
 */
export async function reverseCommissions(
  saleIds: string[]
): Promise<ActionResult<{ reversed: number }>> {
  try {
    let reversed = 0
    for (const saleId of saleIds) {
      await commissionRepository.deleteBySaleId(saleId)
      reversed++
    }

    revalidatePath('/vendas')
    revalidatePath('/dashboard')

    return { success: true, data: { reversed } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao estornar comissões'
    console.error('Error in reverseCommissions:', err)
    return { success: false, error: message }
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
    console.error('Error in deleteCommissionsByPeriod:', err)
    return { success: false, error: 'Erro ao excluir comissões do período' }
  }
}

/**
 * Retorna resumo do dashboard para um período
 * Agrega vendas e comissões (híbrido: fechadas + on-the-fly)
 */
export async function getDashboardSummary(
  organizationId: string,
  period: string
): Promise<DashboardSummary> {
  const sales = await commissionService.getSalesWithCommissions(organizationId, period)

  // Agrupa por vendedor
  const sellerMap = new Map<string, SellerCommissionSummary>()

  for (const sale of sales) {
    const sellerId = sale.seller_id
    const sellerName = sale.seller?.name ?? 'Desconhecido'

    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, {
        seller_id: sellerId,
        seller_name: sellerName,
        period,
        sales_count: 0,
        total_gross_value: 0,
        total_net_value: 0,
        total_commission: 0,
      })
    }

    const sellerSummary = sellerMap.get(sellerId)!
    sellerSummary.sales_count++
    sellerSummary.total_gross_value += Number(sale.gross_value)
    sellerSummary.total_net_value += Number(sale.net_value)
    sellerSummary.total_commission += sale.commission?.amount ?? 0
  }

  const sellers = Array.from(sellerMap.values()).sort(
    (a, b) => b.total_commission - a.total_commission
  )

  return {
    period,
    total_sales: sales.length,
    total_gross_value: sales.reduce((sum, s) => sum + Number(s.gross_value), 0),
    total_net_value: sales.reduce((sum, s) => sum + Number(s.net_value), 0),
    total_commission: sales.reduce((sum, s) => sum + (s.commission?.amount ?? 0), 0),
    sellers_count: sellers.length,
    sellers,
  }
}

/**
 * Retorna dados para o relatório com filtros
 * Calcula: bruto, dedução, comissão, resultado
 */
export async function getReportData(
  organizationId: string,
  period: string,
  sellerId?: string | null,
  commissionStatus?: 'open' | 'closed' | 'all'
): Promise<{
  gross: number
  deduction: number
  commission: number
  result: number
  salesCount: number
  deductionPercent: number
  commissionPercent: number
  resultPercent: number
}> {
  const sales = await commissionService.getSalesWithCommissions(organizationId, period)

  // Filtra por vendedor se especificado
  let filtered = sales
  if (sellerId) {
    filtered = filtered.filter((s) => s.seller_id === sellerId)
  }

  // Filtra por status da comissão
  if (commissionStatus === 'open') {
    filtered = filtered.filter((s) => !s.commission?.is_closed)
  } else if (commissionStatus === 'closed') {
    filtered = filtered.filter((s) => !!s.commission?.is_closed)
  }

  const gross = filtered.reduce((sum, s) => sum + Number(s.gross_value), 0)
  const net = filtered.reduce((sum, s) => sum + Number(s.net_value), 0)
  const commission = filtered.reduce((sum, s) => sum + (s.commission?.amount ?? 0), 0)

  const deduction = gross - net
  const result = net - commission

  return {
    gross,
    deduction,
    commission,
    result,
    salesCount: filtered.length,
    deductionPercent: gross > 0 ? (deduction / gross) * 100 : 0,
    commissionPercent: gross > 0 ? (commission / gross) * 100 : 0,
    resultPercent: gross > 0 ? (result / gross) * 100 : 0,
  }
}

/**
 * Retorna histórico de dados para gráficos (últimos N meses)
 * Usado nos gráficos do Dashboard
 */
export async function getDashboardHistory(
  organizationId: string,
  months: number = 6
): Promise<DashboardHistory> {
  const now = new Date()
  const periods: CommissionSummary[] = []
  const sellerDataMap = new Map<string, { name: string; data: Map<string, number> }>()

  // Gera períodos dos últimos N meses (do mais antigo ao mais recente)
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const sales = await commissionService.getSalesWithCommissions(organizationId, period)

    // Totais do período
    const summary: CommissionSummary = {
      period,
      total_sales: sales.length,
      total_gross_value: sales.reduce((sum, s) => sum + Number(s.gross_value), 0),
      total_net_value: sales.reduce((sum, s) => sum + Number(s.net_value), 0),
      total_commission: sales.reduce((sum, s) => sum + (s.commission?.amount ?? 0), 0),
      sellers_count: new Set(sales.map((s) => s.seller_id)).size,
    }
    periods.push(summary)

    // Agrupa comissão por vendedor
    for (const sale of sales) {
      const sellerId = sale.seller_id
      const sellerName = sale.seller?.name ?? 'Desconhecido'
      const commission = sale.commission?.amount ?? 0

      if (!sellerDataMap.has(sellerId)) {
        sellerDataMap.set(sellerId, { name: sellerName, data: new Map() })
      }

      const sellerData = sellerDataMap.get(sellerId)!
      const current = sellerData.data.get(period) ?? 0
      sellerData.data.set(period, current + commission)
    }
  }

  // Converte mapa para array de vendedores
  const allPeriods = periods.map((p) => p.period)
  const sellers: SellerHistoryEntry[] = Array.from(sellerDataMap.entries()).map(
    ([sellerId, { name, data }]) => ({
      seller_id: sellerId,
      seller_name: name,
      data: allPeriods.map((period) => ({
        period,
        commission: data.get(period) ?? 0,
      })),
    })
  )

  // Ordena vendedores por comissão total (maior primeiro)
  sellers.sort((a, b) => {
    const totalA = a.data.reduce((sum, d) => sum + d.commission, 0)
    const totalB = b.data.reduce((sum, d) => sum + d.commission, 0)
    return totalB - totalA
  })

  return { periods, sellers }
}

