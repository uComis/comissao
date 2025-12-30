'use server'

import { integrationRepository } from '@/lib/repositories/integration-repository'
import { sellerRepository } from '@/lib/repositories/seller-repository'
import { pipedriveSyncService } from '@/lib/services/pipedrive-sync-service'
import { revalidatePath } from 'next/cache'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getIntegrations(organizationId: string) {
  return integrationRepository.findByOrganization(organizationId)
}

export async function getPipedriveIntegration(organizationId: string) {
  return integrationRepository.findByOrganizationAndType(organizationId, 'pipedrive')
}

export async function disconnectIntegration(
  integrationId: string
): Promise<ActionResult<void>> {
  try {
    await integrationRepository.delete(integrationId)
    revalidatePath('/configuracoes')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error in disconnectIntegration:', err)
    return { success: false, error: 'Erro ao desconectar integração' }
  }
}

export async function syncPipedriveDeals(
  organizationId: string
): Promise<ActionResult<{ synced: number; skipped: number }>> {
  try {
    const result = await pipedriveSyncService.syncWonDeals(organizationId)
    revalidatePath('/vendas')
    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar deals'
    console.error('Error in syncPipedriveDeals:', err)
    return { success: false, error: message }
  }
}

export async function getPipedriveUsers(organizationId: string) {
  try {
    return await pipedriveSyncService.getUsers(organizationId)
  } catch (err) {
    console.error('Error in getPipedriveUsers:', err)
    return []
  }
}

export async function getPipedriveDeals(
  organizationId: string,
  status?: 'open' | 'won' | 'lost' | 'all_not_deleted'
) {
  try {
    return await pipedriveSyncService.getDeals(organizationId, status)
  } catch (err) {
    console.error('Error in getPipedriveDeals:', err)
    return []
  }
}

export async function importPipedriveSellers(
  organizationId: string
): Promise<ActionResult<{ imported: number; updated: number; skipped: number }>> {
  try {
    const users = await pipedriveSyncService.getUsers(organizationId)

    if (!users || users.length === 0) {
      return { success: false, error: 'Nenhum vendedor encontrado no Pipedrive' }
    }

    let imported = 0
    let updated = 0
    let skipped = 0

    for (const user of users) {
      // Pular usuários inativos
      if (!user.active_flag) {
        skipped++
        continue
      }

      // Verificar se já existe pelo pipedrive_id
      const existing = await sellerRepository.findByPipedriveId(organizationId, user.id)

      if (existing) {
        // Atualizar se nome ou email mudou
        if (existing.name !== user.name || existing.email !== user.email) {
          await sellerRepository.update(existing.id, {
            name: user.name,
            email: user.email,
          })
          updated++
        } else {
          skipped++
        }
      } else {
        // Criar novo vendedor
        await sellerRepository.create({
          organization_id: organizationId,
          name: user.name,
          email: user.email,
          pipedrive_id: user.id,
        })
        imported++
      }
    }

    revalidatePath('/vendedores')
    revalidatePath('/configuracoes')

    return { success: true, data: { imported, updated, skipped } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao importar vendedores'
    console.error('Error in importPipedriveSellers:', err)
    return { success: false, error: message }
  }
}

