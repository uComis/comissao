'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { Product } from '@/types'

// Schemas de validação
const createProductSchema = z.object({
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

// Helper: detecta contexto do usuário
async function getUserContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Buscar preferências do usuário
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('user_mode')
    .eq('user_id', user.id)
    .single()

  if (prefs?.user_mode === 'organization') {
    // Buscar organização do usuário
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    return org ? { type: 'organization' as const, id: org.id, userId: user.id } : null
  }

  // Modo personal (vendedor)
  return { type: 'personal' as const, id: user.id, userId: user.id }
}

// =====================================================
// QUERIES
// =====================================================

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()

  const context = await getUserContext(supabase)
  if (!context) return []

  let query = supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (context.type === 'organization') {
    query = query.eq('organization_id', context.id)
  } else {
    query = query.eq('user_id', context.id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await createClient()

  const context = await getUserContext(supabase)
  if (!context) return []

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (context.type === 'organization') {
    query = query.eq('organization_id', context.id)
  } else {
    query = query.eq('user_id', context.id)
  }

  const { data, error } = await query

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
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const supabase = await createClient()

    const context = await getUserContext(supabase)
    if (!context) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const insertData: Record<string, unknown> = {
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      unit_price: parsed.data.unit_price ?? null,
    }

    if (context.type === 'organization') {
      insertData.organization_id = context.id
    } else {
      insertData.user_id = context.id
    }

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/produtos')
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
    return { success: false, error: parsed.error.errors[0].message }
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

    revalidatePath('/produtos')
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

    revalidatePath('/produtos')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error deleting product:', err)
    return { success: false, error: 'Erro ao excluir produto' }
  }
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<ActionResult<Product>> {
  return updateProduct(id, { is_active: isActive })
}
