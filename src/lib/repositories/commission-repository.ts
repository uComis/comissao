import { createClient } from '@/lib/supabase-server'
import type {
  Commission,
  CreateCommissionInput,
  UpdateCommissionInput,
  CommissionWithDetails,
  SellerCommissionSummary,
} from '@/types'

export const commissionRepository = {
  async findById(id: string): Promise<Commission | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async findBySaleId(saleId: string): Promise<Commission | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('sale_id', saleId)
      .single()

    if (error) return null
    return data
  },

  async findByOrganization(organizationId: string): Promise<Commission[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async findByPeriod(organizationId: string, period: string): Promise<Commission[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('period', period)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async findBySeller(sellerId: string): Promise<Commission[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async findWithDetails(organizationId: string, period?: string): Promise<CommissionWithDetails[]> {
    const supabase = await createClient()
    let query = supabase
      .from('commissions')
      .select(`
        *,
        seller:sellers(id, name),
        sale:sales(id, client_name, gross_value, sale_date),
        rule:commission_rules(id, name, type)
      `)
      .eq('organization_id', organizationId)

    if (period) {
      query = query.eq('period', period)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as CommissionWithDetails[]
  },

  async getSellerSummary(organizationId: string, period: string): Promise<SellerCommissionSummary[]> {
    const supabase = await createClient()

    // Busca comissões com dados do vendedor e venda
    const { data, error } = await supabase
      .from('commissions')
      .select(`
        seller_id,
        amount,
        base_value,
        seller:sellers(id, name),
        sale:sales(gross_value, net_value)
      `)
      .eq('organization_id', organizationId)
      .eq('period', period)

    if (error) throw new Error(error.message)

    // Agrupa por vendedor
    const summaryMap = new Map<string, SellerCommissionSummary>()

    for (const commission of data) {
      const sellerId = commission.seller_id
      const seller = commission.seller as { id: string; name: string }
      const sale = commission.sale as { gross_value: number; net_value: number }

      if (!summaryMap.has(sellerId)) {
        summaryMap.set(sellerId, {
          seller_id: sellerId,
          seller_name: seller.name,
          period,
          sales_count: 0,
          total_gross_value: 0,
          total_net_value: 0,
          total_commission: 0,
        })
      }

      const summary = summaryMap.get(sellerId)!
      summary.sales_count++
      summary.total_gross_value += Number(sale.gross_value)
      summary.total_net_value += Number(sale.net_value)
      summary.total_commission += Number(commission.amount)
    }

    return Array.from(summaryMap.values())
  },

  async create(input: CreateCommissionInput): Promise<Commission> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .insert(input)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async createMany(inputs: CreateCommissionInput[]): Promise<Commission[]> {
    if (inputs.length === 0) return []

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .insert(inputs)
      .select()

    if (error) throw new Error(error.message)
    return data
  },

  async upsertBySaleId(input: CreateCommissionInput): Promise<Commission> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .upsert(input, { onConflict: 'sale_id' })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, input: UpdateCommissionInput): Promise<Commission> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async deleteBySaleId(saleId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('sale_id', saleId)

    if (error) throw new Error(error.message)
  },

  async deleteByPeriod(organizationId: string, period: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('organization_id', organizationId)
      .eq('period', period)

    if (error) throw new Error(error.message)
  },

  async getTotalByPeriod(organizationId: string, period: string): Promise<number> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('commissions')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('period', period)

    if (error) throw new Error(error.message)
    return data.reduce((sum, c) => sum + Number(c.amount), 0)
  },
}

