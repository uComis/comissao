'use server'

import { z } from 'zod'
import { commissionRuleRepository } from '@/lib/repositories/commission-rule-repository'
import { revalidatePath } from 'next/cache'
import type { CommissionRule, CommissionRuleWithSellers, CommissionTier } from '@/types'

// Schemas de validação
const tierSchema = z.object({
  min: z.number().min(0),
  max: z.number().positive().nullable(),
  percentage: z.number().min(0).max(100),
})

const createRuleSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['fixed', 'tiered']),
  percentage: z.number().min(0).max(100).optional(),
  tiers: z.array(tierSchema).optional(),
  is_default: z.boolean().optional(),
})

const updateRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  type: z.enum(['fixed', 'tiered']).optional(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  tiers: z.array(tierSchema).nullable().optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Validação de faixas (não podem sobrepor)
function validateTiers(tiers: CommissionTier[]): string | null {
  if (tiers.length === 0) return 'Pelo menos uma faixa é obrigatória'

  // Ordena por min
  const sorted = [...tiers].sort((a, b) => a.min - b.min)

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]

    // Verifica se min < max (quando max não é null)
    if (current.max !== null && current.min >= current.max) {
      return `Faixa ${i + 1}: valor mínimo deve ser menor que o máximo`
    }

    // Verifica sobreposição com próxima faixa
    if (i < sorted.length - 1) {
      const next = sorted[i + 1]
      const currentMax = current.max ?? Infinity

      if (currentMax > next.min) {
        return `Faixas ${i + 1} e ${i + 2} estão sobrepostas`
      }
    }
  }

  // Última faixa deve ter max = null (sem limite)
  const lastTier = sorted[sorted.length - 1]
  if (lastTier.max !== null) {
    return 'A última faixa deve ter valor máximo ilimitado'
  }

  return null
}

// ========== ACTIONS DE REGRAS ==========

export async function getCommissionRules(organizationId: string): Promise<CommissionRule[]> {
  return commissionRuleRepository.findByOrganization(organizationId)
}

export async function getActiveCommissionRules(organizationId: string): Promise<CommissionRule[]> {
  return commissionRuleRepository.findActiveByOrganization(organizationId)
}

export async function getCommissionRulesWithSellers(
  organizationId: string
): Promise<CommissionRuleWithSellers[]> {
  return commissionRuleRepository.findWithSellers(organizationId)
}

export async function getCommissionRuleById(id: string): Promise<CommissionRule | null> {
  return commissionRuleRepository.findById(id)
}

export async function createCommissionRule(
  input: z.infer<typeof createRuleSchema>
): Promise<ActionResult<CommissionRule>> {
  const parsed = createRuleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { type, percentage, tiers } = parsed.data

  // Validações específicas por tipo
  if (type === 'fixed') {
    if (percentage === undefined || percentage === null) {
      return { success: false, error: 'Percentual é obrigatório para regra fixa' }
    }
  }

  if (type === 'tiered') {
    if (!tiers || tiers.length === 0) {
      return { success: false, error: 'Faixas são obrigatórias para regra escalonada' }
    }
    const tiersError = validateTiers(tiers)
    if (tiersError) {
      return { success: false, error: tiersError }
    }
  }

  try {
    const rule = await commissionRuleRepository.create({
      organization_id: parsed.data.organization_id,
      name: parsed.data.name,
      type: parsed.data.type,
      percentage: type === 'fixed' ? percentage : undefined,
      tiers: type === 'tiered' ? tiers : undefined,
      is_default: parsed.data.is_default,
    })

    revalidatePath('/regras')
    return { success: true, data: rule }
  } catch (err) {
    console.error('Erro ao criar regra:', err)
    return { success: false, error: 'Erro ao criar regra de comissão' }
  }
}

export async function updateCommissionRule(
  id: string,
  organizationId: string,
  input: z.infer<typeof updateRuleSchema>
): Promise<ActionResult<CommissionRule>> {
  const parsed = updateRuleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // Busca regra atual para validações
  const currentRule = await commissionRuleRepository.findById(id)
  if (!currentRule) {
    return { success: false, error: 'Regra não encontrada' }
  }

  const type = parsed.data.type ?? currentRule.type
  const percentage = parsed.data.percentage !== undefined ? parsed.data.percentage : currentRule.percentage
  const tiers = parsed.data.tiers !== undefined ? parsed.data.tiers : currentRule.tiers

  // Validações específicas por tipo
  if (type === 'fixed') {
    if (percentage === undefined || percentage === null) {
      return { success: false, error: 'Percentual é obrigatório para regra fixa' }
    }
  }

  if (type === 'tiered') {
    if (!tiers || tiers.length === 0) {
      return { success: false, error: 'Faixas são obrigatórias para regra escalonada' }
    }
    const tiersError = validateTiers(tiers)
    if (tiersError) {
      return { success: false, error: tiersError }
    }
  }

  try {
    const updateData: Record<string, unknown> = {}

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.percentage !== undefined) updateData.percentage = parsed.data.percentage
    if (parsed.data.tiers !== undefined) updateData.tiers = parsed.data.tiers
    if (parsed.data.is_default !== undefined) updateData.is_default = parsed.data.is_default
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active

    const rule = await commissionRuleRepository.update(id, organizationId, updateData)
    revalidatePath('/regras')
    return { success: true, data: rule }
  } catch (err) {
    console.error('Erro ao atualizar regra:', err)
    return { success: false, error: 'Erro ao atualizar regra de comissão' }
  }
}

export async function deleteCommissionRule(id: string): Promise<ActionResult<void>> {
  try {
    await commissionRuleRepository.delete(id)
    revalidatePath('/regras')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Erro ao excluir regra:', err)
    return { success: false, error: 'Erro ao excluir regra de comissão' }
  }
}

export async function reactivateCommissionRule(
  id: string,
  organizationId: string
): Promise<ActionResult<CommissionRule>> {
  try {
    const rule = await commissionRuleRepository.update(id, organizationId, { is_active: true })
    revalidatePath('/regras')
    return { success: true, data: rule }
  } catch (err) {
    console.error('Erro ao reativar regra:', err)
    return { success: false, error: 'Erro ao reativar regra de comissão' }
  }
}

// ========== ACTIONS DE VÍNCULO VENDEDOR-REGRA ==========

export async function assignRuleToSellers(
  ruleId: string,
  sellerIds: string[],
  organizationId: string
): Promise<ActionResult<void>> {
  try {
    await commissionRuleRepository.assignRuleToSellers(ruleId, sellerIds, organizationId)
    revalidatePath('/regras')
    revalidatePath('/vendedores')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Erro ao vincular vendedores:', err)
    return { success: false, error: 'Erro ao vincular vendedores à regra' }
  }
}

export async function getSellersByRule(ruleId: string): Promise<string[]> {
  return commissionRuleRepository.findSellersByRule(ruleId)
}

