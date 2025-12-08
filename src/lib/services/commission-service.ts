import { saleRepository } from '@/lib/repositories/sale-repository'
import { commissionRepository } from '@/lib/repositories/commission-repository'
import { commissionRuleRepository } from '@/lib/repositories/commission-rule-repository'
import { commissionEngine } from '@/lib/commission-engine'
import type {
  Sale,
  Commission,
  CreateCommissionInput,
  SellerCommissionSummary,
  SaleWithCommission,
  CommissionRule,
} from '@/types'

export type CalculateResult = {
  success: boolean
  commission?: Commission
  error?: string
}

export type CalculatePeriodResult = {
  calculated: number
  skipped: number
  errors: number
  totalAmount: number
}

export const commissionService = {
  /**
   * Calcula comissão para uma venda específica
   * - Busca regra efetiva do vendedor (específica ou default)
   * - Aplica motor de cálculo
   * - Salva/atualiza registro de comissão
   */
  async calculateForSale(sale: Sale): Promise<CalculateResult> {
    try {
      // Busca regra efetiva do vendedor
      const rule = await commissionRuleRepository.getEffectiveRuleForSeller(
        sale.seller_id,
        sale.organization_id
      )

      if (!rule) {
        return {
          success: false,
          error: 'Nenhuma regra de comissão encontrada para o vendedor',
        }
      }

      // Calcula comissão usando o engine
      const result = commissionEngine.calculate({
        netValue: sale.net_value,
        rule: {
          type: rule.type,
          percentage: rule.percentage,
          tiers: rule.tiers,
        },
      })

      // Extrai período da data da venda
      const period = commissionEngine.extractPeriod(sale.sale_date)

      // Monta input para salvar
      const commissionInput: CreateCommissionInput = {
        organization_id: sale.organization_id,
        seller_id: sale.seller_id,
        sale_id: sale.id,
        rule_id: rule.id,
        base_value: sale.net_value,
        percentage_applied: result.percentageApplied,
        amount: result.amount,
        period,
      }

      // Upsert (atualiza se já existe comissão para essa venda)
      const commission = await commissionRepository.upsertBySaleId(commissionInput)

      return {
        success: true,
        commission,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return {
        success: false,
        error: message,
      }
    }
  },

  /**
   * Calcula comissões para todas as vendas de um período
   */
  async calculateForPeriod(
    organizationId: string,
    period: string
  ): Promise<CalculatePeriodResult> {
    // Busca vendas do período
    const sales = await saleRepository.findByPeriod(organizationId, period)

    let calculated = 0
    let skipped = 0
    let errors = 0
    let totalAmount = 0

    for (const sale of sales) {
      const result = await this.calculateForSale(sale)

      if (result.success && result.commission) {
        calculated++
        totalAmount += result.commission.amount
      } else if (result.error?.includes('Nenhuma regra')) {
        skipped++
      } else {
        errors++
      }
    }

    return {
      calculated,
      skipped,
      errors,
      totalAmount,
    }
  },

  /**
   * Recalcula comissões de todas as vendas de um vendedor
   * Útil quando a regra do vendedor muda
   */
  async recalculateForSeller(sellerId: string): Promise<CalculatePeriodResult> {
    const sales = await saleRepository.findBySeller(sellerId)

    let calculated = 0
    let skipped = 0
    let errors = 0
    let totalAmount = 0

    for (const sale of sales) {
      const result = await this.calculateForSale(sale)

      if (result.success && result.commission) {
        calculated++
        totalAmount += result.commission.amount
      } else if (result.error?.includes('Nenhuma regra')) {
        skipped++
      } else {
        errors++
      }
    }

    return {
      calculated,
      skipped,
      errors,
      totalAmount,
    }
  },

  /**
   * Recalcula comissões de todos os vendedores vinculados a uma regra
   * Útil quando a regra é alterada
   */
  async recalculateForRule(ruleId: string, organizationId: string): Promise<CalculatePeriodResult> {
    // Busca vendedores vinculados à regra
    const sellerIds = await commissionRuleRepository.findSellersByRule(ruleId)

    // Busca regra para verificar se é default
    const rule = await commissionRuleRepository.findById(ruleId)

    let calculated = 0
    let skipped = 0
    let errors = 0
    let totalAmount = 0

    // Se é regra default, precisa recalcular vendedores sem regra específica também
    if (rule?.is_default) {
      // Busca todas as vendas da organização
      const sales = await saleRepository.findByOrganization(organizationId)

      for (const sale of sales) {
        const result = await this.calculateForSale(sale)
        if (result.success && result.commission) {
          calculated++
          totalAmount += result.commission.amount
        } else if (result.error?.includes('Nenhuma regra')) {
          skipped++
        } else {
          errors++
        }
      }
    } else {
      // Recalcula apenas vendas dos vendedores vinculados
      for (const sellerId of sellerIds) {
        const result = await this.recalculateForSeller(sellerId)
        calculated += result.calculated
        skipped += result.skipped
        errors += result.errors
        totalAmount += result.totalAmount
      }
    }

    return {
      calculated,
      skipped,
      errors,
      totalAmount,
    }
  },

  /**
   * Obtém resumo de comissões por vendedor em um período
   */
  async getSellersSummary(
    organizationId: string,
    period: string
  ): Promise<SellerCommissionSummary[]> {
    return commissionRepository.getSellerSummary(organizationId, period)
  },

  /**
   * Obtém comissões detalhadas de um período
   */
  async getCommissionsWithDetails(organizationId: string, period?: string) {
    return commissionRepository.findWithDetails(organizationId, period)
  },

  /**
   * Obtém total de comissões de um período
   */
  async getTotalByPeriod(organizationId: string, period: string): Promise<number> {
    return commissionRepository.getTotalByPeriod(organizationId, period)
  },

  /**
   * Calcula comissão para uma venda recém-importada
   * (wrapper para uso no sync)
   */
  async calculateForNewSale(saleId: string): Promise<CalculateResult> {
    const sale = await saleRepository.findById(saleId)
    if (!sale) {
      return {
        success: false,
        error: 'Venda não encontrada',
      }
    }
    return this.calculateForSale(sale)
  },

  /**
   * Retorna vendas do período com comissões (híbrido)
   * - Vendas com comissão persistida: retorna valor fechado
   * - Vendas sem comissão: calcula on-the-fly
   */
  async getSalesWithCommissions(
    organizationId: string,
    period: string
  ): Promise<SaleWithCommission[]> {
    // 1. Busca vendas do período com dados do vendedor
    const sales = await saleRepository.findWithSellersByPeriod(organizationId, period)

    // 2. Busca comissões existentes (fechadas)
    const closedCommissions = await commissionRepository.findByPeriod(organizationId, period)
    const commissionMap = new Map(closedCommissions.map((c) => [c.sale_id, c]))

    // 3. Busca regras ativas para lookup
    const rules = await commissionRuleRepository.findByOrganization(organizationId)
    const ruleMap = new Map(rules.map((r) => [r.id, r]))

    // 4. Monta cache de regras efetivas por vendedor (evita N queries)
    const sellerRuleCache = new Map<string, CommissionRule | null>()

    // 5. Processa cada venda
    const result: SaleWithCommission[] = []

    for (const sale of sales) {
      const closedCommission = commissionMap.get(sale.id)

      if (closedCommission) {
        // Comissão fechada - usa valor persistido
        const rule = closedCommission.rule_id ? ruleMap.get(closedCommission.rule_id) : null
        result.push({
          ...sale,
          commission: {
            amount: closedCommission.amount,
            percentage_applied: closedCommission.percentage_applied,
            rule_id: closedCommission.rule_id,
            rule_name: rule?.name ?? null,
            is_closed: true,
          },
        })
      } else {
        // Sem comissão fechada - calcula on-the-fly
        let effectiveRule = sellerRuleCache.get(sale.seller_id)

        if (effectiveRule === undefined) {
          // Busca regra efetiva apenas uma vez por vendedor
          effectiveRule = await commissionRuleRepository.getEffectiveRuleForSeller(
            sale.seller_id,
            organizationId
          )
          sellerRuleCache.set(sale.seller_id, effectiveRule)
        }

        if (!effectiveRule) {
          // Vendedor sem regra
          result.push({
            ...sale,
            commission: null,
          })
        } else {
          // Calcula on-the-fly
          const calcResult = commissionEngine.calculate({
            netValue: sale.net_value,
            rule: {
              type: effectiveRule.type,
              percentage: effectiveRule.percentage,
              tiers: effectiveRule.tiers,
            },
          })

          result.push({
            ...sale,
            commission: {
              amount: calcResult.amount,
              percentage_applied: calcResult.percentageApplied,
              rule_id: effectiveRule.id,
              rule_name: effectiveRule.name,
              is_closed: false,
            },
          })
        }
      }
    }

    return result
  },

  /**
   * Fecha período - persiste comissões de todas as vendas abertas
   */
  async closePeriod(
    organizationId: string,
    period: string
  ): Promise<CalculatePeriodResult> {
    // Busca vendas do período
    const sales = await saleRepository.findByPeriod(organizationId, period)

    // Busca comissões já fechadas
    const closedCommissions = await commissionRepository.findByPeriod(organizationId, period)
    const closedSaleIds = new Set(closedCommissions.map((c) => c.sale_id))

    // Filtra apenas vendas abertas (sem comissão persistida)
    const openSales = sales.filter((s) => !closedSaleIds.has(s.id))

    let calculated = 0
    let skipped = 0
    let errors = 0
    let totalAmount = 0

    for (const sale of openSales) {
      const result = await this.calculateForSale(sale)

      if (result.success && result.commission) {
        calculated++
        totalAmount += result.commission.amount
      } else if (result.error?.includes('Nenhuma regra')) {
        skipped++
      } else {
        errors++
      }
    }

    // Soma comissões já fechadas no total
    const alreadyClosed = closedCommissions.reduce((sum, c) => sum + c.amount, 0)
    totalAmount += alreadyClosed

    return {
      calculated,
      skipped,
      errors,
      totalAmount,
    }
  },
}

