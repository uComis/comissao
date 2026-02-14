import { SupabaseClient } from '@supabase/supabase-js'
import { resolveName, toAccentRegex } from './ai-name-resolver'

// =====================================================
// TYPES
// =====================================================

export type ReceivableSearchParams = {
  client_name?: string
  supplier_name?: string
  status?: 'pending' | 'overdue' | 'pending_and_overdue' | 'all'
  due_date_from?: string
  due_date_to?: string
  installment_number?: number
  sale_number?: number
}

export type ReceivableSearchResult = {
  personal_sale_id: string
  sale_number: number | null
  installment_number: number
  total_installments: number
  client_name: string | null
  supplier_name: string | null
  due_date: string
  expected_commission: number
  status: 'pending' | 'overdue'
}

// =====================================================
// SEARCH
// =====================================================

export async function searchReceivables(
  supabase: SupabaseClient,
  userId: string,
  params: ReceivableSearchParams
): Promise<{ receivables: ReceivableSearchResult[]; errors: string[] }> {
  const errors: string[] = []

  // If sale_number is provided, first resolve to personal_sale_id
  let saleIdFromNumber: string | null = null
  if (params.sale_number) {
    const { data: sale } = await supabase
      .from('personal_sales')
      .select('id')
      .eq('user_id', userId)
      .eq('sale_number', params.sale_number)
      .single()

    if (!sale) {
      errors.push(`Venda #${params.sale_number} não encontrada.`)
      return { receivables: [], errors }
    }
    saleIdFromNumber = sale.id
  }

  // --- Resolve names using fuzzy matching ---
  let resolvedClientName: string | null = null
  let resolvedSupplierName: string | null = null

  if (params.client_name) {
    const result = await resolveName(supabase, userId, params.client_name, 'clients')
    if (result.error) {
      // Try in suppliers table (swap hint)
      const swapResult = await resolveName(supabase, userId, params.client_name, 'suppliers')
      if (swapResult.match) {
        errors.push(
          `"${params.client_name}" não é um cliente, mas encontrei a pasta **${swapResult.match.name}**. Você quis dizer a pasta?`
        )
        return { receivables: [], errors }
      }
      errors.push(result.error)
      return { receivables: [], errors }
    }
    resolvedClientName = result.match!.name
  }

  if (params.supplier_name) {
    const result = await resolveName(supabase, userId, params.supplier_name, 'suppliers')
    if (result.error) {
      // Try in clients table (swap hint)
      const swapResult = await resolveName(supabase, userId, params.supplier_name, 'clients')
      if (swapResult.match) {
        errors.push(
          `"${params.supplier_name}" não é uma pasta, mas encontrei o cliente **${swapResult.match.name}**. Você quis dizer o cliente?`
        )
        return { receivables: [], errors }
      }
      errors.push(result.error)
      return { receivables: [], errors }
    }
    resolvedSupplierName = result.match!.name
  }

  // Build query on v_receivables
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from('v_receivables')
    .select(
      'personal_sale_id, installment_number, total_installments, client_name, supplier_name, due_date, expected_commission, status'
    )
    .eq('user_id', userId) as any

  // Status filter
  const statusFilter = params.status || 'pending_and_overdue'
  if (statusFilter === 'pending') {
    query = query.eq('status', 'pending')
  } else if (statusFilter === 'overdue') {
    query = query.eq('status', 'overdue')
  } else if (statusFilter === 'pending_and_overdue') {
    query = query.in('status', ['pending', 'overdue'])
  }
  // 'all' → no status filter

  // Filter by resolved name (accent-insensitive match on the resolved full name)
  if (resolvedClientName) {
    const words = resolvedClientName.trim().split(/\s+/).filter((w) => w.length > 0)
    for (const word of words) {
      query = query.filter('client_name', 'imatch', toAccentRegex(word))
    }
  }

  if (resolvedSupplierName) {
    const words = resolvedSupplierName.trim().split(/\s+/).filter((w) => w.length > 0)
    for (const word of words) {
      query = query.filter('supplier_name', 'imatch', toAccentRegex(word))
    }
  }

  // Date range filter
  if (params.due_date_from) {
    query = query.gte('due_date', params.due_date_from)
  }
  if (params.due_date_to) {
    query = query.lte('due_date', params.due_date_to)
  }

  // Installment number filter
  if (params.installment_number) {
    query = query.eq('installment_number', params.installment_number)
  }

  // Sale ID filter (from sale_number lookup)
  if (saleIdFromNumber) {
    query = query.eq('personal_sale_id', saleIdFromNumber)
  }

  // Order and limit
  query = query.order('due_date', { ascending: true }).limit(20)

  const { data, error } = await query

  if (error) {
    console.error('Receivables search error:', error)
    errors.push('Erro ao buscar parcelas.')
    return { receivables: [], errors }
  }

  if (!data || data.length === 0) {
    return { receivables: [], errors }
  }

  // Fetch sale_numbers for user-friendly display
  const saleIds = [...new Set(data.map((r: any) => r.personal_sale_id))]
  const { data: salesData } = await supabase
    .from('personal_sales')
    .select('id, sale_number')
    .in('id', saleIds)

  const saleNumberMap = new Map(
    salesData?.map((s) => [s.id, s.sale_number as number | null]) || []
  )

  const receivables: ReceivableSearchResult[] = data.map((r: any) => ({
    personal_sale_id: r.personal_sale_id,
    sale_number: saleNumberMap.get(r.personal_sale_id) ?? null,
    installment_number: r.installment_number,
    total_installments: r.total_installments,
    client_name: r.client_name,
    supplier_name: r.supplier_name,
    due_date: r.due_date,
    expected_commission: r.expected_commission,
    status: r.status as 'pending' | 'overdue',
  }))

  return { receivables, errors }
}
