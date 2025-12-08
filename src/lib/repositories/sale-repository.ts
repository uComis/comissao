import { createClient } from '@/lib/supabase-server'
import type { Sale, CreateSaleInput, UpdateSaleInput, SaleWithSeller } from '@/types'

export const saleRepository = {
  async findById(id: string): Promise<Sale | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async findByOrganization(organizationId: string): Promise<Sale[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sale_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async findByPeriod(organizationId: string, period: string): Promise<Sale[]> {
    const supabase = await createClient()
    // period format: "2025-01" → busca vendas de janeiro/2025
    const startDate = `${period}-01`
    const [year, month] = period.split('-').map(Number)
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // último dia do mês

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async findBySeller(sellerId: string): Promise<Sale[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('seller_id', sellerId)
      .order('sale_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  async findByExternalId(organizationId: string, externalId: string): Promise<Sale | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('external_id', externalId)
      .single()

    if (error) return null
    return data
  },

  async findWithSellers(organizationId: string): Promise<SaleWithSeller[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .select('*, seller:sellers(id, name)')
      .eq('organization_id', organizationId)
      .order('sale_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data as SaleWithSeller[]
  },

  async findWithSellersByPeriod(organizationId: string, period: string): Promise<SaleWithSeller[]> {
    const supabase = await createClient()
    const startDate = `${period}-01`
    const [year, month] = period.split('-').map(Number)
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('sales')
      .select('*, seller:sellers(id, name)')
      .eq('organization_id', organizationId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data as SaleWithSeller[]
  },

  async create(input: CreateSaleInput): Promise<Sale> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .insert(input)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async createMany(inputs: CreateSaleInput[]): Promise<Sale[]> {
    if (inputs.length === 0) return []

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .insert(inputs)
      .select()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, input: UpdateSaleInput): Promise<Sale> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
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
      .from('sales')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async getExistingExternalIds(organizationId: string, externalIds: string[]): Promise<Set<string>> {
    if (externalIds.length === 0) return new Set()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales')
      .select('external_id')
      .eq('organization_id', organizationId)
      .in('external_id', externalIds)

    if (error) throw new Error(error.message)
    return new Set(data?.map((s) => s.external_id).filter(Boolean) as string[])
  },

  async countByPeriod(organizationId: string, period: string): Promise<number> {
    const supabase = await createClient()
    const startDate = `${period}-01`
    const [year, month] = period.split('-').map(Number)
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)

    if (error) throw new Error(error.message)
    return count || 0
  },
}

