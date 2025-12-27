'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateGoalSchema = z.object({
  goal: z.number().min(0, 'A meta deve ser maior ou igual a zero'),
})

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getUserPreferences() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user preferences:', error)
    return null
  }

  return data
}

export async function updateCommissionGoal(goal: number): Promise<ActionResult<void>> {
  const parsed = updateGoalSchema.safeParse({ goal })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ 
        user_id: user.id, 
        commission_goal: goal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/home')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error updating commission goal:', error)
    return { success: false, error: 'Erro ao atualizar meta' }
  }
}

export async function updateUserMode(mode: 'personal' | 'organization'): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ 
        user_id: user.id, 
        user_mode: mode,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/home')
    revalidatePath('/minhaconta')
    
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error updating user mode:', error)
    return { success: false, error: 'Erro ao atualizar modo de visualização' }
  }
}

export async function getPerformanceStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Pegar início e fim do mês atual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // Buscar total de comissões no mês
  const { data: sales, error: salesError } = await supabase
    .from('personal_sales')
    .select('commission_value')
    .eq('user_id', user.id)
    .gte('sale_date', startOfMonth)
    .lte('sale_date', endOfMonth)

  if (salesError) {
    console.error('Error fetching sales for performance:', salesError)
    return null
  }

  const currentMonthCommission = sales.reduce((sum, s) => sum + (s.commission_value || 0), 0)

  // Buscar meta
  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('commission_goal')
    .eq('user_id', user.id)
    .single()

  if (prefsError && prefsError.code !== 'PGRST116') {
    console.error('Error fetching preferences for performance:', prefsError)
    return null
  }

  return {
    currentMonthCommission,
    goal: prefs?.commission_goal || 0,
    monthName: now.toLocaleString('pt-BR', { month: 'long' })
  }
}

