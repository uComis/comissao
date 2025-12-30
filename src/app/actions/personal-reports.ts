'use server'

import { createClient } from '@/lib/supabase-server'
import { subMonths, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type ReportEvolution = {
  period: string
  name: string
  vendas: number
  comissao: number
}

export type ReportSupplier = {
  name: string
  vendas: number
  comissao: number
}

export type ReportClient = {
  name: string
  total: number
  count: number
  lastSale: string
}

export type ReportProduct = {
  name: string
  total: number
  qtd: number
}

export type ReportFunnel = {
  name: string
  value: number
  color: string
}

export type ReportsData = {
  monthlyEvolution: ReportEvolution[]
  supplierRanking: ReportSupplier[]
  clientABC: ReportClient[]
  productMix: ReportProduct[]
  commissionFunnel: ReportFunnel[]
}

export async function getPersonalReportsData(): Promise<ReportsData> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // 1. Evolução Mensal (Últimos 6 meses)
  const sixMonthsAgo = format(subMonths(new Date(), 5), 'yyyy-MM-01')
  const { data: evolutionData, error: evolutionError } = await supabase
    .from('personal_sales')
    .select('gross_value, commission_value, sale_date')
    .eq('user_id', user.id)
    .gte('sale_date', sixMonthsAgo)

  if (evolutionError) throw evolutionError

  const monthlyEvolution = (evolutionData || []).reduce((acc: ReportEvolution[], sale) => {
    const month = format(parseISO(sale.sale_date), 'yyyy-MM')
    const existing = acc.find(a => a.period === month)
    if (existing) {
      existing.vendas += Number(sale.gross_value)
      existing.comissao += Number(sale.commission_value)
    } else {
      acc.push({ 
        period: month, 
        name: format(parseISO(sale.sale_date), 'MMM/yy', { locale: ptBR }),
        vendas: Number(sale.gross_value), 
        comissao: Number(sale.commission_value) 
      })
    }
    return acc
  }, []).sort((a, b) => a.period.localeCompare(b.period))

  // 2. Ranking de Fornecedores
  const { data: supplierData, error: supplierError } = await supabase
    .from('personal_sales')
    .select(`
      gross_value, 
      commission_value,
      supplier:personal_suppliers(name)
    `)
    .eq('user_id', user.id)

  if (supplierError) throw supplierError

  const supplierRanking = (supplierData || []).reduce((acc: ReportSupplier[], sale) => {
    const supplier = sale.supplier as unknown as { name: string } | null
    const name = supplier?.name || 'Sem Fornecedor'
    const existing = acc.find(a => a.name === name)
    if (existing) {
      existing.vendas += Number(sale.gross_value)
      existing.comissao += Number(sale.commission_value)
    } else {
      acc.push({ name, vendas: Number(sale.gross_value), comissao: Number(sale.commission_value) })
    }
    return acc
  }, []).sort((a, b) => b.comissao - a.comissao)

  // 3. Curva ABC de Clientes
  const { data: clientData, error: clientError } = await supabase
    .from('personal_sales')
    .select(`
      gross_value,
      client_name,
      sale_date
    `)
    .eq('user_id', user.id)

  if (clientError) throw clientError

  const clientABC = (clientData || []).reduce((acc: ReportClient[], sale) => {
    const name = sale.client_name
    const existing = acc.find(a => a.name === name)
    if (existing) {
      existing.total += Number(sale.gross_value)
      existing.count += 1
      if (parseISO(sale.sale_date) > parseISO(existing.lastSale)) {
        existing.lastSale = sale.sale_date
      }
    } else {
      acc.push({ name, total: Number(sale.gross_value), count: 1, lastSale: sale.sale_date })
    }
    return acc
  }, []).sort((a, b) => b.total - a.total)

  // 4. Mix de Produtos (Top 10)
  const { data: productData, error: productError } = await supabase
    .from('personal_sale_items')
    .select(`
      product_name,
      total_price,
      quantity,
      personal_sales!inner(user_id)
    `)
    .eq('personal_sales.user_id', user.id)

  if (productError) throw productError

  const productMix = (productData || []).reduce((acc: ReportProduct[], item) => {
    const name = item.product_name
    const existing = acc.find(a => a.name === name)
    if (existing) {
      existing.total += Number(item.total_price)
      existing.qtd += Number(item.quantity)
    } else {
      acc.push({ name, total: Number(item.total_price), qtd: Number(item.quantity) })
    }
    return acc
  }, []).sort((a, b) => b.total - a.total).slice(0, 10)

  // 5. Funil de Comissão (Simplificado)
  const { data: receivedData } = await supabase
    .from('received_payments')
    .select(`
      received_amount,
      personal_sales!inner(user_id)
    `)
    .eq('personal_sales.user_id', user.id)

  const totalGross = (evolutionData || []).reduce((sum, s) => sum + Number(s.gross_value), 0)
  const totalEstimated = (evolutionData || []).reduce((sum, s) => sum + Number(s.commission_value), 0)
  const totalReceived = receivedData?.reduce((sum, r) => sum + Number(r.received_amount), 0) || 0

  const commissionFunnel: ReportFunnel[] = [
    { name: 'Venda Total', value: totalGross, color: 'var(--chart-1)' },
    { name: 'Comissão Estimada', value: totalEstimated, color: 'var(--chart-2)' },
    { name: 'Comissão Recebida', value: totalReceived, color: 'var(--chart-3)' },
  ]

  return {
    monthlyEvolution,
    supplierRanking,
    clientABC,
    productMix,
    commissionFunnel
  }
}

