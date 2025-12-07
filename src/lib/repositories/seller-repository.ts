import { createClient } from '@/lib/supabase-server'
import type { Seller, CreateSellerInput, UpdateSellerInput, SellerWithRule } from '@/types'

export const sellerRepository = {
  async findById(id: string): Promise<Seller | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async findByOrganization(organizationId: string): Promise<Seller[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (error) throw new Error(error.message)
    return data
  },

  async findActiveByOrganization(organizationId: string): Promise<Seller[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(error.message)
    return data
  },

  async findByPipedriveId(organizationId: string, pipedriveId: number): Promise<Seller | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('pipedrive_id', pipedriveId)
      .single()

    if (error) return null
    return data
  },

  async create(input: CreateSellerInput): Promise<Seller> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .insert({
        ...input,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, input: UpdateSellerInput): Promise<Seller> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
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
      .from('sellers')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async hardDelete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async findWithRules(organizationId: string): Promise<SellerWithRule[]> {
    const supabase = await createClient()

    // Busca vendedores
    const { data: sellers, error: sellersError } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (sellersError) throw new Error(sellersError.message)

    // Busca vínculos vendedor-regra
    const { data: sellerRules, error: sellerRulesError } = await supabase
      .from('seller_commission_rules')
      .select('seller_id, rule_id, commission_rules(id, name, type, percentage, is_default)')
      .eq('organization_id', organizationId)

    if (sellerRulesError) throw new Error(sellerRulesError.message)

    // Busca regra padrão
    const { data: defaultRule, error: defaultRuleError } = await supabase
      .from('commission_rules')
      .select('id, name, type, percentage, is_default')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    // Ignora erro se não houver regra padrão
    const defaultRuleData = defaultRuleError ? null : defaultRule

    // Mapa de regras por vendedor
    const rulesBySeller = new Map<string, SellerWithRule['commission_rule']>()
    for (const sr of sellerRules) {
      const rule = sr.commission_rules as unknown as {
        id: string
        name: string
        type: 'fixed' | 'tiered'
        percentage: number | null
        is_default: boolean
      }
      rulesBySeller.set(sr.seller_id, rule)
    }

    // Monta resultado
    return sellers.map((seller) => ({
      ...seller,
      commission_rule: rulesBySeller.get(seller.id) || defaultRuleData,
    }))
  },
}

