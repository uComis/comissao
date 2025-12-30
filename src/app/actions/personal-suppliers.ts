'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { checkLimit, incrementUsage, decrementUsage } from './billing'
import type { CommissionRule } from '@/types'

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

export type PersonalSupplierWithRules = PersonalSupplier & {
  commission_rules: CommissionRule[]
  default_rule?: CommissionRule | null
}

// Schemas de validação
const ruleInputSchema = z.object({
  id: z.string().optional(), // ID opcional para edição
  name: z.string().min(1, 'Nome da regra é obrigatório'),
  type: z.enum(['fixed', 'tiered']),
  percentage: z.number().min(0).max(100).nullable(),
  tiers: z.array(z.object({
    min: z.number().min(0),
    max: z.number().min(0).nullable(),
    percentage: z.number().min(0).max(100),
  })).nullable(),
  is_default: z.boolean().optional(),
})

const createSupplierWithRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  rule: ruleInputSchema.optional().nullable(),
})

const updateSupplierWithRulesSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  cnpj: z.string().optional(),
  rules: z.array(ruleInputSchema).optional(),
  default_rule_id: z.string().optional(),
})

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// =====================================================
// QUERIES
// =====================================================

export async function getPersonalSuppliers(): Promise<PersonalSupplierWithRules[]> {
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

  const supplierIds = suppliers.map(s => s.id)

  // Buscar TODAS as regras vinculadas aos fornecedores encontrados
  const { data: rules, error: rulesError } = await supabase
    .from('commission_rules')
    .select('*')
    .in('personal_supplier_id', supplierIds)
    .eq('is_active', true)

  if (rulesError) throw rulesError

  // Agrupar regras por fornecedor
  const rulesBySupplier: Record<string, CommissionRule[]> = {}
  
  if (rules) {
    rules.forEach(rule => {
      // Garantir que personal_supplier_id existe na regra (deveria, pois filtramos por ele)
      const supplierId = rule.personal_supplier_id
      if (supplierId) {
        if (!rulesBySupplier[supplierId]) {
            rulesBySupplier[supplierId] = []
        }
        rulesBySupplier[supplierId].push(rule)
      }
    })
  }

  // Combinar dados
  return suppliers.map(supplier => {
    const supplierRules = rulesBySupplier[supplier.id] || []
    const defaultRule = supplier.commission_rule_id 
        ? supplierRules.find(r => r.id === supplier.commission_rule_id) 
        : supplierRules[0] // Fallback

    return {
        ...supplier,
        commission_rules: supplierRules,
        default_rule: defaultRule || null
    }
  })
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

export async function getPersonalSupplierWithRules(id: string): Promise<PersonalSupplierWithRules | null> {
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

  // Buscar todas as regras deste fornecedor
  const { data: rules, error: rulesError } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('personal_supplier_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (rulesError) throw rulesError

  const defaultRule = rules?.find(r => r.id === supplier.commission_rule_id) || rules?.[0] || null

  return {
    ...supplier,
    commission_rules: rules || [],
    default_rule: defaultRule,
  }
}

// =====================================================
// MUTATIONS
// =====================================================

export async function createPersonalSupplierWithRule(
  input: z.infer<typeof createSupplierWithRuleSchema>
): Promise<ActionResult<PersonalSupplierWithRules>> {
  const parsed = createSupplierWithRuleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar limite de fornecedores
    const limitCheck = await checkLimit(user.id, 'suppliers')
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error || 'Limite de fornecedores atingido' }
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

    // 2. Criar regra de comissão inicial (se fornecida)
    const { rule } = parsed.data
    let commissionRule: CommissionRule | undefined

    if (rule) {
      const { data: newRule, error: ruleError } = await supabase
        .from('commission_rules')
        .insert({
          personal_supplier_id: supplier.id,
          name: rule.name,
          type: rule.type,
          percentage: rule.type === 'fixed' ? rule.percentage : null,
          tiers: rule.type === 'tiered' ? rule.tiers : null,
          is_default: true, // A primeira regra é sempre padrão
          is_active: true,
        })
        .select()
        .single()

      if (ruleError) {
        // Rollback: excluir fornecedor se falhou ao criar regra
        await supabase.from('personal_suppliers').delete().eq('id', supplier.id)
        throw ruleError
      }
      commissionRule = newRule

      // 3. Atualizar fornecedor com ID da regra padrão
      const { error: updateError } = await supabase
        .from('personal_suppliers')
        .update({ commission_rule_id: newRule.id })
        .eq('id', supplier.id)

      if (updateError) throw updateError
    }

    // 4. Incrementar uso
    await incrementUsage(user.id, 'suppliers')

    revalidatePath('/fornecedores')
    return {
      success: true,
      data: {
        ...supplier, // Retorna supplier original (pode ter sido atualizado com ID da regra, mas para UI o id basta)
        commission_rule_id: commissionRule?.id || null, // Atualiza ID se criou regra
        commission_rules: commissionRule ? [commissionRule] : [],
        default_rule: commissionRule || null,
      },
    }
  } catch (err) {
    console.error('Error creating supplier:', err)
    return { success: false, error: 'Erro ao criar fornecedor' }
  }
}

export async function updatePersonalSupplierWithRules(
  id: string,
  input: z.infer<typeof updateSupplierWithRulesSchema>
): Promise<ActionResult<PersonalSupplierWithRules>> {
  const parsed = updateSupplierWithRulesSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    // 1. Atualizar dados do fornecedor
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.cnpj !== undefined) updateData.cnpj = parsed.data.cnpj || null
    if (parsed.data.default_rule_id !== undefined) updateData.commission_rule_id = parsed.data.default_rule_id

    const { error: updateError } = await supabase
      .from('personal_suppliers')
      .update(updateData)
      .eq('id', id)

    if (updateError) throw updateError

    // 2. Gerenciar regras (Create/Update/Delete implícito por ausência)
    // NOTA: Para simplificar, assumimos que as regras passadas são as que devem existir.
    // Mas no fluxo de UI atual, geralmente editamos uma a uma ou adicionamos.
    // Vamos focar em criar/atualizar as regras enviadas.

    if (parsed.data.rules) {
      for (const rule of parsed.data.rules) {
        if (rule.id) {
          // Update existente
          const { error: ruleError } = await supabase
            .from('commission_rules')
            .update({
              name: rule.name,
              type: rule.type,
              percentage: rule.type === 'fixed' ? rule.percentage : null,
              tiers: rule.type === 'tiered' ? rule.tiers : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', rule.id)
            .eq('personal_supplier_id', id) // Segurança

          if (ruleError) throw ruleError
        } else {
          // Create nova regra
          const { error: ruleError } = await supabase
            .from('commission_rules')
            .insert({
              personal_supplier_id: id,
              name: rule.name,
              type: rule.type,
              percentage: rule.type === 'fixed' ? rule.percentage : null,
              tiers: rule.type === 'tiered' ? rule.tiers : null,
              is_default: !!rule.is_default,
              is_active: true,
            })

          if (ruleError) throw ruleError
        }
      }
    }

    // 3. Buscar dados atualizados para retorno
    return {
      success: true,
      data: (await getPersonalSupplierWithRules(id))!,
    }
  } catch (err) {
    console.error('Error updating supplier:', err)
    return { success: false, error: 'Erro ao atualizar fornecedor' }
  }
}

// Action específica para adicionar uma regra isolada (usada na venda ou edit)
export async function addCommissionRule(
  supplierId: string,
  ruleData: z.infer<typeof ruleInputSchema>
): Promise<ActionResult<CommissionRule>> {
  const parsed = ruleInputSchema.safeParse(ruleData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const { data: newRule, error } = await supabase
      .from('commission_rules')
      .insert({
        personal_supplier_id: supplierId,
        name: parsed.data.name,
        type: parsed.data.type,
        percentage: parsed.data.type === 'fixed' ? parsed.data.percentage : null,
        tiers: parsed.data.type === 'tiered' ? parsed.data.tiers : null,
        is_default: !!parsed.data.is_default,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    
    // Se foi marcada como default, atualiza o fornecedor
    if (parsed.data.is_default) {
       await supabase
        .from('personal_suppliers')
        .update({ commission_rule_id: newRule.id })
        .eq('id', supplierId)
    }

    revalidatePath('/fornecedores')
    revalidatePath(`/fornecedores/${supplierId}`)
    
    return { success: true, data: newRule }
  } catch (err) {
    console.error('Error adding rule:', err)
    return { success: false, error: 'Erro ao adicionar regra' }
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

    // 2. Buscar o user_id antes (ou passar via param) para decrementar
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await decrementUsage(user.id, 'suppliers')
    }

    revalidatePath('/fornecedores')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error deleting supplier:', err)
    return { success: false, error: 'Erro ao excluir fornecedor' }
  }
}
