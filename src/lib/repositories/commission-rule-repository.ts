import { createClient } from '@/lib/supabase-server'
import type {
  CommissionRule,
  CreateCommissionRuleInput,
  UpdateCommissionRuleInput,
  SellerCommissionRule,
  CreateSellerCommissionRuleInput,
  CommissionRuleWithSellers,
} from '@/types'

export const commissionRuleRepository = {
  // ========== COMMISSION RULES ==========

  async findById(id: string): Promise<CommissionRule | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async findByOrganization(organizationId: string): Promise<CommissionRule[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (error) throw new Error(error.message)
    return data
  },

  async findActiveByOrganization(organizationId: string): Promise<CommissionRule[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(error.message)
    return data
  },

  async findDefaultByOrganization(organizationId: string): Promise<CommissionRule | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data
  },

  async findWithSellers(organizationId: string): Promise<CommissionRuleWithSellers[]> {
    const supabase = await createClient()
    
    // Busca regras
    const { data: rules, error: rulesError } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (rulesError) throw new Error(rulesError.message)

    // Busca vínculos com vendedores
    const { data: sellerRules, error: sellerRulesError } = await supabase
      .from('seller_commission_rules')
      .select('rule_id, seller_id, sellers(id, name)')
      .eq('organization_id', organizationId)

    if (sellerRulesError) throw new Error(sellerRulesError.message)

    // Agrupa vendedores por regra
    const sellersByRule = new Map<string, Array<{ id: string; name: string }>>()
    for (const sr of sellerRules) {
      const seller = sr.sellers as unknown as { id: string; name: string }
      if (!sellersByRule.has(sr.rule_id)) {
        sellersByRule.set(sr.rule_id, [])
      }
      sellersByRule.get(sr.rule_id)!.push({ id: seller.id, name: seller.name })
    }

    // Monta resultado
    return rules.map(rule => ({
      ...rule,
      sellers: sellersByRule.get(rule.id) || [],
    }))
  },

  async create(input: CreateCommissionRuleInput): Promise<CommissionRule> {
    const supabase = await createClient()

    // Se está marcando como default, remove default das outras
    if (input.is_default) {
      await supabase
        .from('commission_rules')
        .update({ is_default: false })
        .eq('organization_id', input.organization_id)
    }

    const { data, error } = await supabase
      .from('commission_rules')
      .insert({
        organization_id: input.organization_id,
        name: input.name,
        type: input.type,
        commission_percentage: input.commission_percentage ?? null,
        tax_percentage: input.tax_percentage ?? null,
        commission_tiers: input.commission_tiers ?? null,
        tax_tiers: input.tax_tiers ?? null,
        is_default: input.is_default ?? false,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, organizationId: string, input: UpdateCommissionRuleInput): Promise<CommissionRule> {
    const supabase = await createClient()

    // Se está marcando como default, remove default das outras
    if (input.is_default) {
      await supabase
        .from('commission_rules')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .neq('id', id)
    }

    const { data, error } = await supabase
      .from('commission_rules')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    // Soft delete - marca como inativo
    const { error } = await supabase
      .from('commission_rules')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async hardDelete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('commission_rules')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // ========== SELLER COMMISSION RULES ==========

  async findSellerRule(sellerId: string): Promise<SellerCommissionRule | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('seller_commission_rules')
      .select('*')
      .eq('seller_id', sellerId)
      .single()

    if (error) return null
    return data
  },

  async findSellersByRule(ruleId: string): Promise<string[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('seller_commission_rules')
      .select('seller_id')
      .eq('rule_id', ruleId)

    if (error) throw new Error(error.message)
    return data.map(d => d.seller_id)
  },

  async assignRuleToSeller(input: CreateSellerCommissionRuleInput): Promise<SellerCommissionRule> {
    const supabase = await createClient()

    // Upsert - se já existe vínculo, atualiza
    const { data, error } = await supabase
      .from('seller_commission_rules')
      .upsert(
        {
          seller_id: input.seller_id,
          rule_id: input.rule_id,
          organization_id: input.organization_id,
        },
        { onConflict: 'seller_id' }
      )
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async removeRuleFromSeller(sellerId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('seller_commission_rules')
      .delete()
      .eq('seller_id', sellerId)

    if (error) throw new Error(error.message)
  },

  async assignRuleToSellers(ruleId: string, sellerIds: string[], organizationId: string): Promise<void> {
    const supabase = await createClient()

    // Remove vínculos antigos desta regra
    await supabase
      .from('seller_commission_rules')
      .delete()
      .eq('rule_id', ruleId)

    // Se não há vendedores para vincular, encerra
    if (sellerIds.length === 0) return

    // Remove vínculos existentes dos vendedores (cada vendedor só pode ter uma regra)
    await supabase
      .from('seller_commission_rules')
      .delete()
      .in('seller_id', sellerIds)

    // Cria novos vínculos
    const { error } = await supabase
      .from('seller_commission_rules')
      .insert(
        sellerIds.map(sellerId => ({
          seller_id: sellerId,
          rule_id: ruleId,
          organization_id: organizationId,
        }))
      )

    if (error) throw new Error(error.message)
  },

  // ========== REGRA EFETIVA DO VENDEDOR ==========

  async getEffectiveRuleForSeller(
    sellerId: string,
    organizationId: string
  ): Promise<CommissionRule | null> {
    // 1. Tenta buscar regra específica do vendedor
    const sellerRule = await this.findSellerRule(sellerId)
    if (sellerRule) {
      return this.findById(sellerRule.rule_id)
    }

    // 2. Retorna regra default da organização
    return this.findDefaultByOrganization(organizationId)
  },
}

