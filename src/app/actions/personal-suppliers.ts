'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { CommissionRule, CommissionTier } from '@/types'

// Types
export type PersonalSupplier = {
  id: string
  user_id: string
  name: string
  cnpj: string | null
  commission_rule_id: string | null
  organization_id: string | null
  match_status: 'unlinked' | 'suggested' | 'linked' | 'rejected'
  matched_at: string | null
  matched_by: 'auto_cnpj' | 'auto_name' | 'manual' | null
  created_at: string
  updated_at: string
}

export type PersonalSupplierWithRule = PersonalSupplier & {
  commission_rule: CommissionRule | null
}

// Schemas de validação
const ruleInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['fixed', 'tiered']),
  percentage: z.number().min(0).max(100).nullable(),
  tiers: z.array(z.object({
    min: z.number().min(0),
    max: z.number().min(0).nullable(),
    percentage: z.number().min(0).max(100),
  })).nullable(),
})

const createSupplierWithRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  rule: ruleInputSchema,
})

const updateSupplierWithRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  cnpj: z.string().optional(),
  rule: ruleInputSchema.optional(),
})

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// =====================================================
// QUERIES
// =====================================================

export async function getPersonalSuppliers(): Promise<PersonalSupplierWithRule[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Buscar fornecedores
  const { data: suppliers, error: suppliersError } = await supabase
    .from('personal_suppliers')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (suppliersError) throw suppliersError
  if (!suppliers || suppliers.length === 0) return []

  // Buscar regras de comissão vinculadas
  const ruleIds = suppliers
    .map(s => s.commission_rule_id)
    .filter((id): id is string => id !== null)

  let rulesMap: Record<string, CommissionRule> = {}

  if (ruleIds.length > 0) {
    const { data: rules, error: rulesError } = await supabase
      .from('commission_rules')
      .select('*')
      .in('id', ruleIds)

    if (rulesError) throw rulesError
    if (rules) {
      rulesMap = Object.fromEntries(rules.map(r => [r.id, r]))
    }
  }

  // Combinar dados
  return suppliers.map(supplier => ({
    ...supplier,
    commission_rule: supplier.commission_rule_id 
      ? rulesMap[supplier.commission_rule_id] || null 
      : null,
  }))
}

export async function getPersonalSupplierById(id: string): Promise<PersonalSupplier | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personal_suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getPersonalSupplierWithRule(id: string): Promise<PersonalSupplierWithRule | null> {
  const supabase = await createClient()

  // Buscar fornecedor
  const { data: supplier, error: supplierError } = await supabase
    .from('personal_suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (supplierError) {
    if (supplierError.code === 'PGRST116') return null
    throw supplierError
  }

  // Buscar regra de comissão se existir
  let commission_rule: CommissionRule | null = null

  if (supplier.commission_rule_id) {
    const { data: rule, error: ruleError } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('id', supplier.commission_rule_id)
      .single()

    if (!ruleError && rule) {
      commission_rule = rule
    }
  }

  return {
    ...supplier,
    commission_rule,
  }
}

// =====================================================
// MUTATIONS
// =====================================================

export async function createPersonalSupplierWithRule(
  input: z.infer<typeof createSupplierWithRuleSchema>
): Promise<ActionResult<PersonalSupplierWithRule>> {
  const parsed = createSupplierWithRuleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // 1. Criar fornecedor
    const { data: supplier, error: supplierError } = await supabase
      .from('personal_suppliers')
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        cnpj: parsed.data.cnpj || null,
      })
      .select()
      .single()

    if (supplierError) throw supplierError

    // 2. Criar regra de comissão vinculada ao fornecedor
    const { rule } = parsed.data
    const { data: commissionRule, error: ruleError } = await supabase
      .from('commission_rules')
      .insert({
        personal_supplier_id: supplier.id,
        name: rule.name,
        type: rule.type,
        percentage: rule.type === 'fixed' ? rule.percentage : null,
        tiers: rule.type === 'tiered' ? rule.tiers : null,
        is_default: false,
        is_active: true,
      })
      .select()
      .single()

    if (ruleError) {
      // Rollback: excluir fornecedor se falhou ao criar regra
      await supabase.from('personal_suppliers').delete().eq('id', supplier.id)
      throw ruleError
    }

    // 3. Atualizar fornecedor com ID da regra
    const { data: updatedSupplier, error: updateError } = await supabase
      .from('personal_suppliers')
      .update({ commission_rule_id: commissionRule.id })
      .eq('id', supplier.id)
      .select()
      .single()

    if (updateError) throw updateError

    revalidatePath('/fornecedores')
    return {
      success: true,
      data: {
        ...updatedSupplier,
        commission_rule: commissionRule,
      },
    }
  } catch (err) {
    console.error('Error creating supplier:', err)
    return { success: false, error: 'Erro ao criar fornecedor' }
  }
}

export async function updatePersonalSupplierWithRule(
  id: string,
  input: z.infer<typeof updateSupplierWithRuleSchema>
): Promise<ActionResult<PersonalSupplierWithRule>> {
  const parsed = updateSupplierWithRuleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const supabase = await createClient()

    // 1. Buscar fornecedor atual
    const { data: currentSupplier, error: fetchError } = await supabase
      .from('personal_suppliers')
      .select('*, commission_rule:commission_rules(*)')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // 2. Atualizar dados do fornecedor
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.cnpj !== undefined) updateData.cnpj = parsed.data.cnpj || null

    const { data: updatedSupplier, error: updateError } = await supabase
      .from('personal_suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // 3. Atualizar regra de comissão (se fornecida)
    let commissionRule = currentSupplier.commission_rule

    if (parsed.data.rule) {
      const { rule } = parsed.data

      if (currentSupplier.commission_rule_id) {
        // Atualizar regra existente
        const { data: updatedRule, error: ruleError } = await supabase
          .from('commission_rules')
          .update({
            name: rule.name,
            type: rule.type,
            percentage: rule.type === 'fixed' ? rule.percentage : null,
            tiers: rule.type === 'tiered' ? rule.tiers : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSupplier.commission_rule_id)
          .select()
          .single()

        if (ruleError) throw ruleError
        commissionRule = updatedRule
      } else {
        // Criar nova regra
        const { data: newRule, error: ruleError } = await supabase
          .from('commission_rules')
          .insert({
            personal_supplier_id: id,
            name: rule.name,
            type: rule.type,
            percentage: rule.type === 'fixed' ? rule.percentage : null,
            tiers: rule.type === 'tiered' ? rule.tiers : null,
            is_default: false,
            is_active: true,
          })
          .select()
          .single()

        if (ruleError) throw ruleError

        // Vincular regra ao fornecedor
        await supabase
          .from('personal_suppliers')
          .update({ commission_rule_id: newRule.id })
          .eq('id', id)

        commissionRule = newRule
      }
    }

    revalidatePath('/fornecedores')
    return {
      success: true,
      data: {
        ...updatedSupplier,
        commission_rule: commissionRule,
      },
    }
  } catch (err) {
    console.error('Error updating supplier:', err)
    return { success: false, error: 'Erro ao atualizar fornecedor' }
  }
}

export async function deletePersonalSupplier(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    // A regra será excluída automaticamente pelo ON DELETE CASCADE
    const { error } = await supabase
      .from('personal_suppliers')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/fornecedores')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error deleting supplier:', err)
    return { success: false, error: 'Erro ao excluir fornecedor' }
  }
}
