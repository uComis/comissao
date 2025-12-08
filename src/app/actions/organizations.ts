'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  tax_deduction_rate: z
    .number()
    .min(0, 'Taxa deve ser no mínimo 0%')
    .max(100, 'Taxa deve ser no máximo 100%')
    .nullable()
    .optional(),
})

export async function updateOrganization(
  id: string,
  input: z.infer<typeof updateOrganizationSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateOrganizationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.tax_deduction_rate !== undefined) {
      updateData.tax_deduction_rate = parsed.data.tax_deduction_rate
    }

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar organização:', error)
      return { success: false, error: 'Erro ao atualizar organização' }
    }

    revalidatePath('/configuracoes')
    return { success: true, data: { id } }
  } catch (err) {
    console.error('Erro ao atualizar organização:', err)
    return { success: false, error: 'Erro ao atualizar organização' }
  }
}

