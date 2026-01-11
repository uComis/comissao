'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { commissionEngine } from '@/lib/commission-engine'
import { checkLimit, incrementUsage, decrementUsage, getDataRetentionFilter, getBlockedSuppliers } from './billing'
import type { PersonalSale, PersonalSaleWithItems, CreatePersonalSaleInput } from '@/types'

// Schemas
const saleItemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  product_name: z.string().min(1, 'Nome do produto é obrigatório'),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  unit_price: z.number().min(0, 'Preço não pode ser negativo'),
  tax_rate: z.number().min(0).max(100).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
})

const createSaleSchema = z.object({
  supplier_id: z.string().uuid('Fornecedor é obrigatório'),
  client_id: z.string().uuid('Cliente é obrigatório'),
  client_name: z.string().min(1, 'Nome do cliente é obrigatório'),
  sale_date: z.string().min(1, 'Data é obrigatória'),
  payment_condition: z.string().optional(),
  first_installment_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).optional(),
  gross_value: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  commission_rate: z.number().min(0).optional(),
}).refine(data => {
  const hasItems = data.items && data.items.length > 0
  const hasGrossValue = data.gross_value !== undefined && data.gross_value !== null
  return hasItems || hasGrossValue
}, {
  message: 'Informe os itens ou o valor total da venda',
  path: ['gross_value']
})

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// =====================================================
// QUERIES
// =====================================================

export async function getPersonalSales(): Promise<PersonalSale[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Aplicar filtro de retenção
  const minDate = await getDataRetentionFilter(user.id)
  
  let query = supabase
    .from('personal_sales')
    .select(`
      *,
      supplier:personal_suppliers(id, name),
      client:personal_clients(id, name)
    `)
    .eq('user_id', user.id)

  // Se houver limite de retenção, aplicar filtro
  if (minDate) {
    query = query.gte('sale_date', minDate.toISOString().split('T')[0])
  }

  const { data, error } = await query.order('sale_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPersonalSalesBySupplier(supplierId: string): Promise<PersonalSale[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Aplicar filtro de retenção
  const minDate = await getDataRetentionFilter(user.id)
  
  let query = supabase
    .from('personal_sales')
    .select(`
      *,
      supplier:personal_suppliers(id, name),
      client:personal_clients(id, name)
    `)
    .eq('user_id', user.id)
    .eq('supplier_id', supplierId)

  // Se houver limite de retenção, aplicar filtro
  if (minDate) {
    query = query.gte('sale_date', minDate.toISOString().split('T')[0])
  }

  const { data, error } = await query.order('sale_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPersonalSaleById(id: string): Promise<PersonalSaleWithItems | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Buscar venda
  const { data: sale, error: saleError } = await supabase
    .from('personal_sales')
    .select(`
      *,
      supplier:personal_suppliers(id, name),
      client:personal_clients(id, name)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (saleError) {
    if (saleError.code === 'PGRST116') return null
    throw saleError
  }

  // Buscar itens
  const { data: items, error: itemsError } = await supabase
    .from('personal_sale_items')
    .select('*')
    .eq('personal_sale_id', id)
    .order('created_at', { ascending: true })

  if (itemsError) throw itemsError

  return {
    ...sale,
    items: items || [],
  }
}

// =====================================================
// MUTATIONS
// =====================================================

export async function createPersonalSale(
  input: CreatePersonalSaleInput
): Promise<ActionResult<PersonalSaleWithItems>> {
  const parsed = createSaleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar limite de vendas
    const limitCheck = await checkLimit(user.id, 'sales')
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error || 'Limite de vendas atingido' }
    }

    // Extrair supplier_id para validação
    const { supplier_id } = parsed.data

    // Verificar se a pasta está bloqueada
    const { blockedSupplierIds } = await getBlockedSuppliers(user.id)
    if (blockedSupplierIds.includes(supplier_id)) {
      return { 
        success: false, 
        error: 'Esta pasta está bloqueada. Faça upgrade do seu plano para criar vendas nesta pasta.' 
      }
    }

    const { client_id, client_name, sale_date, payment_condition, first_installment_date, notes, items = [], gross_value, tax_rate, commission_rate: manual_commission_rate } = parsed.data

    // Calcular totais (incluindo comissão por item)
    const itemsWithTotal = items.map(item => {
      const total_price = item.quantity * item.unit_price
      const tax_amount = total_price * ((item.tax_rate || 0) / 100)
      const net_value = total_price - tax_amount
      const commission_rate = item.commission_rate || 0
      const commission_value = net_value * (commission_rate / 100)
      
      return {
        ...item,
        total_price,
        tax_amount,
        net_value,
        commission_rate,
        commission_value
      }
    })

    let finalGrossValue = 0
    let finalNetValue = 0
    let finalTaxAmount = 0
    let finalTaxRate = 0
    let commissionValue = 0
    let commissionRate = 0

    if (itemsWithTotal.length > 0) {
      finalGrossValue = itemsWithTotal.reduce((sum, item) => sum + item.total_price, 0)
      finalNetValue = itemsWithTotal.reduce((sum, item) => sum + item.net_value, 0)
      finalTaxAmount = itemsWithTotal.reduce((sum, item) => sum + item.tax_amount, 0)
      finalTaxRate = finalGrossValue > 0 ? (finalTaxAmount / finalGrossValue) * 100 : 0
      
      // Comissão total = soma das comissões dos itens
      commissionValue = itemsWithTotal.reduce((sum, item) => sum + item.commission_value, 0)
      // Taxa média ponderada de comissão
      commissionRate = finalNetValue > 0 ? (commissionValue / finalNetValue) * 100 : 0
    } else {
      finalGrossValue = gross_value || 0
      finalTaxRate = tax_rate || 0
      finalTaxAmount = finalGrossValue * (finalTaxRate / 100)
      finalNetValue = finalGrossValue - finalTaxAmount
      
      // Se o usuário informou a comissão manualmente, usa ela
      if (manual_commission_rate !== undefined) {
        commissionRate = manual_commission_rate
        commissionValue = (finalNetValue * commissionRate) / 100
      } else {
        // Buscar regra de comissão do fornecedor (fallback)
        const { data: supplier, error: supplierError } = await supabase
          .from('personal_suppliers')
          .select('commission_rule_id')
          .eq('id', supplier_id)
          .single()

        if (!supplierError && supplier.commission_rule_id) {
          const { data: rule, error: ruleError } = await supabase
            .from('commission_rules')
            .select('type, percentage, tiers')
            .eq('id', supplier.commission_rule_id)
            .single()

          if (!ruleError && rule) {
            const result = commissionEngine.calculate({
              netValue: finalNetValue,
              rule: {
                type: rule.type as 'fixed' | 'tiered',
                percentage: rule.percentage,
                tiers: rule.tiers,
              },
            })
            commissionValue = result.amount
            commissionRate = result.percentageApplied
          }
        }
      }
    }

    // Criar venda
    const { data: sale, error: saleError } = await supabase
      .from('personal_sales')
      .insert({
        user_id: user.id,
        supplier_id,
        client_id,
        client_name,
        sale_date,
        payment_condition: payment_condition || null,
        first_installment_date: first_installment_date || null,
        notes: notes || null,
        gross_value: finalGrossValue,
        net_value: finalNetValue,
        tax_rate: finalTaxRate,
        tax_amount: finalTaxAmount,
        commission_value: commissionValue,
        commission_rate: commissionRate,
        source: 'manual',
      })
      .select(`
        *,
        supplier:personal_suppliers(id, name),
        client:personal_clients(id, name)
      `)
      .single()

    if (saleError) throw saleError

    // Criar itens se houver
    let insertedItems = []
    if (itemsWithTotal.length > 0) {
      const itemsToInsert = itemsWithTotal.map(item => ({
        personal_sale_id: sale.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount,
        net_value: item.net_value,
        commission_rate: item.commission_rate || 0,
        commission_value: item.commission_value || 0,
      }))

      const { data, error: itemsError } = await supabase
        .from('personal_sale_items')
        .insert(itemsToInsert)
        .select()

      if (itemsError) {
        // Rollback: excluir venda se falhou ao criar itens
        await supabase.from('personal_sales').delete().eq('id', sale.id)
        throw itemsError
      }
      insertedItems = data || []
    }

    // Recebíveis são calculados on-the-fly via view v_receivables
    // Não precisa mais gerar registros aqui

    // Incrementar uso
    await incrementUsage(user.id, 'sales')

    revalidatePath('/minhasvendas')
    revalidatePath('/recebiveis')
    return {
      success: true,
      data: {
        ...sale,
        items: insertedItems || [],
      },
    }
  } catch (err) {
    console.error('Error creating sale:', err)
    return { success: false, error: 'Erro ao criar venda' }
  }
}

export async function updatePersonalSale(
  id: string,
  input: CreatePersonalSaleInput
): Promise<ActionResult<PersonalSaleWithItems>> {
  const parsed = createSaleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar se a venda existe e pertence ao usuário
    const { data: existingSale, error: existingError } = await supabase
      .from('personal_sales')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (existingError || !existingSale) {
      return { success: false, error: 'Venda não encontrada' }
    }

    const { supplier_id, client_id, client_name, sale_date, payment_condition, first_installment_date, notes, items = [], gross_value, tax_rate, commission_rate: manual_commission_rate } = parsed.data

    // Calcular totais (incluindo comissão por item)
    const itemsWithTotal = items.map(item => {
      const total_price = item.quantity * item.unit_price
      const tax_amount = total_price * ((item.tax_rate || 0) / 100)
      const net_value = total_price - tax_amount
      const commission_rate = item.commission_rate || 0
      const commission_value = net_value * (commission_rate / 100)
      
      return {
        ...item,
        total_price,
        tax_amount,
        net_value,
        commission_rate,
        commission_value
      }
    })

    // Se tem itens, soma o bruto e o líquido dos itens
    // Se não, usa o gross_value e aplica a tax_rate geral
    let finalGrossValue = 0
    let finalNetValue = 0
    let finalTaxAmount = 0
    let finalTaxRate = 0
    let commissionValue = 0
    let commissionRate = 0

    if (itemsWithTotal.length > 0) {
      finalGrossValue = itemsWithTotal.reduce((sum, item) => sum + item.total_price, 0)
      finalNetValue = itemsWithTotal.reduce((sum, item) => sum + item.net_value, 0)
      finalTaxAmount = itemsWithTotal.reduce((sum, item) => sum + item.tax_amount, 0)
      finalTaxRate = finalGrossValue > 0 ? (finalTaxAmount / finalGrossValue) * 100 : 0
      
      // Comissão total = soma das comissões dos itens
      commissionValue = itemsWithTotal.reduce((sum, item) => sum + item.commission_value, 0)
      // Taxa média ponderada de comissão
      commissionRate = finalNetValue > 0 ? (commissionValue / finalNetValue) * 100 : 0
    } else {
      finalGrossValue = gross_value || 0
      finalTaxRate = tax_rate || 0
      finalTaxAmount = finalGrossValue * (finalTaxRate / 100)
      finalNetValue = finalGrossValue - finalTaxAmount
      
      // Se o usuário informou a comissão manualmente, usa ela sobre o LÍQUIDO
      if (manual_commission_rate !== undefined) {
        commissionRate = manual_commission_rate
        commissionValue = (finalNetValue * commissionRate) / 100
      } else {
        // Buscar regra de comissão do fornecedor (fallback)
        const { data: supplier, error: supplierError } = await supabase
          .from('personal_suppliers')
          .select('commission_rule_id')
          .eq('id', supplier_id)
          .single()

        if (!supplierError && supplier.commission_rule_id) {
          const { data: rule, error: ruleError } = await supabase
            .from('commission_rules')
            .select('type, percentage, tiers')
            .eq('id', supplier.commission_rule_id)
            .single()

          if (!ruleError && rule) {
            const result = commissionEngine.calculate({
              netValue: finalNetValue,
              rule: {
                type: rule.type as 'fixed' | 'tiered',
                percentage: rule.percentage,
                tiers: rule.tiers,
              },
            })
            commissionValue = result.amount
            commissionRate = result.percentageApplied
          }
        }
      }
    }

    // Atualizar venda
    const { data: sale, error: saleError } = await supabase
      .from('personal_sales')
      .update({
        supplier_id,
        client_id,
        client_name,
        sale_date,
        payment_condition: payment_condition || null,
        first_installment_date: first_installment_date || null,
        notes: notes || null,
        gross_value: finalGrossValue,
        net_value: finalNetValue,
        tax_rate: finalTaxRate,
        tax_amount: finalTaxAmount,
        commission_value: commissionValue,
        commission_rate: commissionRate,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        supplier:personal_suppliers(id, name),
        client:personal_clients(id, name)
      `)
      .single()

    if (saleError) throw saleError

    // Deletar itens antigos
    const { error: deleteItemsError } = await supabase
      .from('personal_sale_items')
      .delete()
      .eq('personal_sale_id', id)

    if (deleteItemsError) throw deleteItemsError

    // Criar novos itens se houver
    let insertedItems = []
    if (itemsWithTotal.length > 0) {
      const itemsToInsert = itemsWithTotal.map(item => ({
        personal_sale_id: sale.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount,
        net_value: item.net_value,
        commission_rate: item.commission_rate || 0,
        commission_value: item.commission_value || 0,
      }))

      const { data, error: itemsError } = await supabase
        .from('personal_sale_items')
        .insert(itemsToInsert)
        .select()

      if (itemsError) throw itemsError
      insertedItems = data || []
    }

    // Recebíveis são calculados on-the-fly via view v_receivables
    // Ao editar a venda, as parcelas atualizam automaticamente

    revalidatePath('/minhasvendas')
    revalidatePath(`/minhasvendas/${id}`)
    revalidatePath('/recebiveis')
    return {
      success: true,
      data: {
        ...sale,
        items: insertedItems || [],
      },
    }
  } catch (err) {
    console.error('Error updating sale:', err)
    return { success: false, error: 'Erro ao atualizar venda' }
  }
}

export async function deletePersonalSale(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Itens são deletados automaticamente via CASCADE
    const { error } = await supabase
      .from('personal_sales')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    // Decrementar uso
    await decrementUsage(user.id, 'sales')

    revalidatePath('/minhasvendas')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error deleting sale:', err)
    return { success: false, error: 'Erro ao excluir venda' }
  }
}

// =====================================================
// STATS
// =====================================================

export async function getPersonalSalesStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Aplicar filtro de retenção
  const minDate = await getDataRetentionFilter(user.id)
  
  let query = supabase
    .from('personal_sales')
    .select('gross_value, net_value, commission_value, sale_date')
    .eq('user_id', user.id)

  // Se houver limite de retenção, aplicar filtro
  if (minDate) {
    query = query.gte('sale_date', minDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) throw error

  const totalGross = data?.reduce((sum, s) => sum + (s.gross_value || 0), 0) || 0
  const totalNet = data?.reduce((sum, s) => sum + (s.net_value || 0), 0) || 0
  const totalCommission = data?.reduce((sum, s) => sum + (s.commission_value || 0), 0) || 0

  return {
    totalSales: data?.length || 0,
    totalGross,
    totalNet,
    totalCommission,
  }
}

