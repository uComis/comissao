'use server'

import { z } from 'zod'
import { sellerRepository } from '@/lib/repositories/seller-repository'
import { commissionRuleRepository } from '@/lib/repositories/commission-rule-repository'
import { revalidatePath } from 'next/cache'
import { checkLimit, incrementUsage, decrementUsage } from './billing'
import { createClient } from '@/lib/supabase-server'
import type { Seller, SellerWithRule } from '@/types'

// Schemas de validação
const createSellerSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  pipedrive_id: z.number().int().positive().optional(),
})

const updateSellerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  pipedrive_id: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
})

// Types de retorno
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Actions
export async function getSellers(organizationId: string): Promise<Seller[]> {
  return sellerRepository.findByOrganization(organizationId)
}

export async function getActiveSellers(organizationId: string): Promise<Seller[]> {
  return sellerRepository.findActiveByOrganization(organizationId)
}

export async function getSellersWithRules(organizationId: string): Promise<SellerWithRule[]> {
  return sellerRepository.findWithRules(organizationId)
}

export async function getSellerById(id: string): Promise<Seller | null> {
  return sellerRepository.findById(id)
}

export async function createSeller(
  input: z.infer<typeof createSellerSchema>
): Promise<ActionResult<Seller>> {
  const parsed = createSellerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', parsed.data.organization_id)
      .single()

    if (orgError || !org) {
      return { success: false, error: 'Organização não encontrada' }
    }

    // Verificar limite de usuários (vendedores)
    const limitCheck = await checkLimit(org.owner_id, 'users')
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error || 'Limite de usuários atingido' }
    }

    const seller = await sellerRepository.create({
      organization_id: parsed.data.organization_id,
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      pipedrive_id: parsed.data.pipedrive_id,
    })

    // Incrementar uso
    await incrementUsage(org.owner_id, 'users')

    revalidatePath('/vendedores')
    return { success: true, data: seller }
  } catch (err) {
    console.error('Error creating seller:', err)
    return { success: false, error: 'Erro ao criar vendedor' }
  }
}

export async function updateSeller(
  id: string,
  input: z.infer<typeof updateSellerSchema>
): Promise<ActionResult<Seller>> {
  const parsed = updateSellerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const updateData: Record<string, unknown> = {}
    
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null
    if (parsed.data.pipedrive_id !== undefined) updateData.pipedrive_id = parsed.data.pipedrive_id
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active

    const seller = await sellerRepository.update(id, updateData)
    revalidatePath('/vendedores')
    return { success: true, data: seller }
  } catch (err) {
    console.error('Error in updateSeller:', err)
    return { success: false, error: 'Erro ao atualizar vendedor' }
  }
}

export async function deleteSeller(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    
    // Buscar organização para pegar owner_id
    const { data: seller, error: fetchError } = await supabase
      .from('sellers')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !seller) throw new Error('Vendedor não encontrado')

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', seller.organization_id)
      .single()

    if (orgError || !org) throw new Error('Organização não encontrada')

    await sellerRepository.delete(id)

    // Decrementar uso
    await decrementUsage(org.owner_id, 'users')

    revalidatePath('/vendedores')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error deleting seller:', err)
    return { success: false, error: 'Erro ao excluir vendedor' }
  }
}

export async function reactivateSeller(id: string): Promise<ActionResult<Seller>> {
  try {
    const seller = await sellerRepository.update(id, { is_active: true })
    revalidatePath('/vendedores')
    return { success: true, data: seller }
  } catch (err) {
    console.error('Error in reactivateSeller:', err)
    return { success: false, error: 'Erro ao reativar vendedor' }
  }
}

export async function setSellerRule(
  sellerId: string,
  ruleId: string | null,
  organizationId: string
): Promise<ActionResult<void>> {
  try {
    if (ruleId) {
      await commissionRuleRepository.assignRuleToSeller({
        seller_id: sellerId,
        rule_id: ruleId,
        organization_id: organizationId,
      })
    } else {
      await commissionRuleRepository.removeRuleFromSeller(sellerId)
    }
    revalidatePath('/vendedores')
    revalidatePath('/regras')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error in setSellerRule:', err)
    return { success: false, error: 'Erro ao definir regra do vendedor' }
  }
}

