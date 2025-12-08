import Decimal from 'decimal.js'
import type { CommissionTier } from '@/types'

// Configuração do Decimal.js para precisão financeira
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

export type CalculationInput = {
  netValue: number
  rule: {
    type: 'fixed' | 'tiered'
    percentage: number | null
    tiers: CommissionTier[] | null
  }
}

export type CalculationResult = {
  amount: number
  percentageApplied: number
  breakdown?: TierBreakdown[]
}

export type TierBreakdown = {
  min: number
  max: number | null
  percentage: number
  baseValue: number
  amount: number
}

/**
 * Motor de cálculo de comissões
 * Funções puras sem I/O - apenas matemática com decimal.js
 */
export const commissionEngine = {
  /**
   * Calcula comissão baseado no valor líquido e regra aplicada
   */
  calculate(input: CalculationInput): CalculationResult {
    const { netValue, rule } = input

    if (rule.type === 'fixed') {
      return this.calculateFixed(netValue, rule.percentage ?? 0)
    }

    if (rule.type === 'tiered' && rule.tiers) {
      return this.calculateTiered(netValue, rule.tiers)
    }

    // Fallback: sem regra válida, comissão zero
    return {
      amount: 0,
      percentageApplied: 0,
    }
  },

  /**
   * Cálculo de comissão fixa (percentual único)
   */
  calculateFixed(netValue: number, percentage: number): CalculationResult {
    const value = new Decimal(netValue)
    const pct = new Decimal(percentage)

    const amount = value.times(pct).dividedBy(100).toDecimalPlaces(2)

    return {
      amount: amount.toNumber(),
      percentageApplied: percentage,
    }
  },

  /**
   * Cálculo de comissão escalonada (faixas)
   * Cada faixa aplica seu percentual à porção do valor que cai nela
   */
  calculateTiered(netValue: number, tiers: CommissionTier[]): CalculationResult {
    const value = new Decimal(netValue)
    let totalAmount = new Decimal(0)
    const breakdown: TierBreakdown[] = []

    // Ordena tiers pelo min (garantia)
    const sortedTiers = [...tiers].sort((a, b) => a.min - b.min)

    for (const tier of sortedTiers) {
      const tierMin = new Decimal(tier.min)
      const tierMax = tier.max !== null ? new Decimal(tier.max) : null
      const tierPct = new Decimal(tier.percentage)

      // Se o valor é menor que o mínimo da faixa, ignora
      if (value.lessThanOrEqualTo(tierMin)) {
        continue
      }

      // Calcula quanto do valor cai nessa faixa
      let portionInTier: Decimal

      if (tierMax === null) {
        // Última faixa (sem limite superior)
        portionInTier = value.minus(tierMin)
      } else if (value.greaterThan(tierMax)) {
        // Valor ultrapassa essa faixa
        portionInTier = tierMax.minus(tierMin)
      } else {
        // Valor está dentro dessa faixa
        portionInTier = value.minus(tierMin)
      }

      const tierAmount = portionInTier.times(tierPct).dividedBy(100).toDecimalPlaces(2)
      totalAmount = totalAmount.plus(tierAmount)

      breakdown.push({
        min: tier.min,
        max: tier.max,
        percentage: tier.percentage,
        baseValue: portionInTier.toNumber(),
        amount: tierAmount.toNumber(),
      })
    }

    // Calcula percentual efetivo
    const effectivePercentage = value.isZero()
      ? 0
      : totalAmount.dividedBy(value).times(100).toDecimalPlaces(2).toNumber()

    return {
      amount: totalAmount.toDecimalPlaces(2).toNumber(),
      percentageApplied: effectivePercentage,
      breakdown,
    }
  },

  /**
   * Aplica taxa de dedução (taxa mágica) para obter valor líquido
   */
  applyTaxDeduction(grossValue: number, taxDeductionRate: number): number {
    const gross = new Decimal(grossValue)
    const rate = new Decimal(taxDeductionRate)

    const deduction = gross.times(rate).dividedBy(100)
    const netValue = gross.minus(deduction).toDecimalPlaces(2)

    return netValue.toNumber()
  },

  /**
   * Extrai período (ano-mês) de uma data
   */
  extractPeriod(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  },

  /**
   * Valida faixas de comissão escalonada
   * Retorna erros encontrados ou array vazio se válido
   */
  validateTiers(tiers: CommissionTier[]): string[] {
    const errors: string[] = []

    if (tiers.length === 0) {
      errors.push('Pelo menos uma faixa é obrigatória')
      return errors
    }

    const sorted = [...tiers].sort((a, b) => a.min - b.min)

    // Primeira faixa deve começar em 0
    if (sorted[0].min !== 0) {
      errors.push('A primeira faixa deve começar em 0')
    }

    // Verifica gaps e sobreposições
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      if (current.max === null) {
        errors.push('Apenas a última faixa pode ter máximo ilimitado')
      } else if (current.max !== next.min) {
        errors.push(`Gap ou sobreposição entre faixas: ${current.max} → ${next.min}`)
      }
    }

    // Última faixa deve ser ilimitada
    const lastTier = sorted[sorted.length - 1]
    if (lastTier.max !== null) {
      errors.push('A última faixa deve ter máximo ilimitado (null)')
    }

    // Percentuais devem ser positivos
    for (const tier of tiers) {
      if (tier.percentage < 0) {
        errors.push(`Percentual negativo não permitido: ${tier.percentage}%`)
      }
    }

    return errors
  },
}

