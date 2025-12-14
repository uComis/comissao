'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { Product } from '@/types'

// Schemas de validação
const createProductSchema = z.object({
  personal_supplier_id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().optional(),
  unit_price: z.number().min(0).nullable().optional(),
})

const updateProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  sku: z.string().optional(),
  unit_price: z.number().min(0).nullable().optional(),
  is_active: z.boolean().optional(),
})

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// =====================================================
// QUERIES
// =====================================================

export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('personal_supplier_id', supplierId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export async function getActiveProductsBySupplier(supplierId: string): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('personal_supplier_id', supplierId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching active products:', error)
    return []
  }

  return data || []
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

// =====================================================
// MUTATIONS
// =====================================================

export async function createProduct(
  input: z.infer<typeof createProductSchema>
): Promise<ActionResult<Product>> {
  const parsed = createProductSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .insert({
        personal_supplier_id: parsed.data.personal_supplier_id,
        name: parsed.data.name,
        sku: parsed.data.sku || null,
        unit_price: parsed.data.unit_price ?? null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/fornecedores')
    return { success: true, data }
  } catch (err) {
    console.error('Error creating product:', err)
    return { success: false, error: 'Erro ao criar produto' }
  }
}

export async function updateProduct(
  id: string,
  input: z.infer<typeof updateProductSchema>
): Promise<ActionResult<Product>> {
  const parsed = updateProductSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.sku !== undefined) updateData.sku = parsed.data.sku || null
    if (parsed.data.unit_price !== undefined) updateData.unit_price = parsed.data.unit_price
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/fornecedores')
    return { success: true, data }
  } catch (err) {
    console.error('Error updating product:', err)
    return { success: false, error: 'Erro ao atualizar produto' }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/fornecedores')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error deleting product:', err)
    return { success: false, error: 'Erro ao excluir produto' }
  }
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<ActionResult<Product>> {
  return updateProduct(id, { is_active: isActive })
}
