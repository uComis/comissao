import {
  createPipedriveClient,
  refreshAccessToken,
} from '@/lib/clients/pipedrive'
import { integrationRepository } from '@/lib/repositories/integration-repository'
import { sellerRepository } from '@/lib/repositories/seller-repository'
import { saleRepository } from '@/lib/repositories/sale-repository'
import { createClient } from '@/lib/supabase-server'
import { commissionEngine } from '@/lib/commission-engine'
import type { SyncResult, CreateSaleInput } from '@/types'

// Intervalo mínimo entre syncs (em minutos)
const SYNC_INTERVAL_MINUTES = 2

// Verifica se token está expirado (com margem de 5 minutos)
function isTokenExpired(expiresAt: string): boolean {
  const expiresDate = new Date(expiresAt)
  const now = new Date()
  const marginMs = 5 * 60 * 1000 // 5 minutos
  return expiresDate.getTime() - marginMs <= now.getTime()
}

// Verifica se já passou o intervalo mínimo desde último sync
function shouldSync(lastSyncedAt: string | null, intervalMinutes: number = SYNC_INTERVAL_MINUTES): boolean {
  if (!lastSyncedAt) return true

  const lastSync = new Date(lastSyncedAt)
  const now = new Date()
  const elapsed = now.getTime() - lastSync.getTime()
  const minInterval = intervalMinutes * 60 * 1000

  return elapsed >= minInterval
}

export const pipedriveSyncService = {
  /**
   * Obtém client Pipedrive com token válido (renova se necessário)
   */
  async getClient(organizationId: string) {
    const integration = await integrationRepository.findByOrganizationAndType(
      organizationId,
      'pipedrive'
    )

    if (!integration) {
      throw new Error('Pipedrive integration not found')
    }

    // Renovar token se expirado
    if (isTokenExpired(integration.expires_at)) {
      const newTokens = await refreshAccessToken(integration.refresh_token)
      const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

      await integrationRepository.update(integration.id, {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: expiresAt,
        provider_account_id: newTokens.api_domain,
      })

      return createPipedriveClient(newTokens.api_domain, newTokens.access_token)
    }

    return createPipedriveClient(
      integration.provider_account_id!,
      integration.access_token
    )
  },

  /**
   * Verifica se é necessário sincronizar (throttle)
   */
  async needsSync(organizationId: string): Promise<boolean> {
    const integration = await integrationRepository.findByOrganizationAndType(
      organizationId,
      'pipedrive'
    )

    if (!integration) return false

    return shouldSync(integration.last_synced_at)
  },

  /**
   * Atualiza timestamp do último sync
   */
  async updateLastSyncedAt(organizationId: string): Promise<void> {
    const integration = await integrationRepository.findByOrganizationAndType(
      organizationId,
      'pipedrive'
    )

    if (!integration) return

    await integrationRepository.update(integration.id, {
      last_synced_at: new Date().toISOString(),
    })
  },

  /**
   * Sincroniza deals ganhos do Pipedrive para tabela sales
   * - Faz match de user_id (Pipedrive) com pipedrive_id (seller)
   * - Aplica tax_deduction_rate para calcular net_value
   * - Só importa deals de vendedores ativos cadastrados
   */
  async syncWonDeals(organizationId: string, force: boolean = false): Promise<SyncResult> {
    // Verifica throttle (a menos que force=true)
    if (!force) {
      const needs = await this.needsSync(organizationId)
      if (!needs) {
        return { synced: 0, skipped: 0, errors: 0 }
      }
    }

    const client = await this.getClient(organizationId)
    const supabase = await createClient()

    // Buscar tax_deduction_rate da organização
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('tax_deduction_rate')
      .eq('id', organizationId)
      .single()

    if (orgError) throw new Error(`Failed to get organization: ${orgError.message}`)

    const taxDeductionRate = Number(org.tax_deduction_rate) || 0

    // Buscar vendedores ativos com pipedrive_id
    const sellers = await sellerRepository.findActiveByOrganization(organizationId)
    const sellersByPipedriveId = new Map<number, string>()

    for (const seller of sellers) {
      if (seller.pipedrive_id) {
        sellersByPipedriveId.set(seller.pipedrive_id, seller.id)
      }
    }
    console.log('[sync] sellers mapped', {
      count: sellersByPipedriveId.size,
      pipedriveIds: Array.from(sellersByPipedriveId.keys()),
    })

    // Se não há vendedores com pipedrive_id, não há o que sincronizar
    if (sellersByPipedriveId.size === 0) {
      await this.updateLastSyncedAt(organizationId)
      return { synced: 0, skipped: 0, errors: 0 }
    }

    // Buscar todos os deals ganhos
    const deals = await client.getAllWonDeals()
    console.log('[sync] deals fetched', { total: deals.length })

    if (deals.length === 0) {
      await this.updateLastSyncedAt(organizationId)
      return { synced: 0, skipped: 0, errors: 0 }
    }

    // Buscar external_ids já existentes
    const externalIds = deals.map((d) => String(d.id))
    const existingIds = await saleRepository.getExistingExternalIds(organizationId, externalIds)
    console.log('[sync] existing external ids', { count: existingIds.size })

    // Filtrar e transformar deals
    const salesToInsert: CreateSaleInput[] = []
    let skipped = 0
    let errors = 0

    for (const deal of deals) {
      const externalId = String(deal.id)

      // Skip se já existe
      if (existingIds.has(externalId)) {
        skipped++
        console.log('[sync] skipped (already exists)', { externalId })
        continue
      }

      // Skip se não tem vendedor correspondente
      // user_id pode vir como objeto { id, name, ... } ou número direto
      const pipedriveUserId = typeof deal.user_id === 'object' 
        ? (deal.user_id as { id: number }).id 
        : deal.user_id
      const sellerId = sellersByPipedriveId.get(pipedriveUserId)
      if (!sellerId) {
        skipped++
        debugger
        console.log('[sync] skipped (no seller match)', {
          externalId,
          userId: deal.user_id,
          title: deal.title,
        })
        continue
      }

      // Calcular net_value aplicando taxa mágica
      const grossValue = deal.value
      const netValue = commissionEngine.applyTaxDeduction(grossValue, taxDeductionRate)

      // Extrair data da venda
      const saleDate = deal.won_time
        ? deal.won_time.split(' ')[0]
        : deal.close_time?.split(' ')[0] || new Date().toISOString().split('T')[0]

      salesToInsert.push({
        organization_id: organizationId,
        seller_id: sellerId,
        external_id: externalId,
        client_name: deal.title,
        gross_value: grossValue,
        net_value: netValue,
        sale_date: saleDate,
      })
    }

    // Inserir em batch
    if (salesToInsert.length > 0) {
      try {
        await saleRepository.createMany(salesToInsert)
      } catch (err) {
        console.error('Error inserting sales:', err)
        errors = salesToInsert.length
      }
    }

    // Atualizar timestamp do último sync
    await this.updateLastSyncedAt(organizationId)

    return {
      synced: errors > 0 ? 0 : salesToInsert.length,
      skipped,
      errors,
    }
  },

  /**
   * Sincroniza se necessário (com throttle) - para usar em páginas
   */
  async syncIfNeeded(organizationId: string): Promise<SyncResult> {
    return this.syncWonDeals(organizationId, false)
  },

  /**
   * Força sincronização (ignora throttle) - para uso manual
   */
  async forceSync(organizationId: string): Promise<SyncResult> {
    return this.syncWonDeals(organizationId, true)
  },

  /**
   * Busca usuários do Pipedrive (vendedores)
   */
  async getUsers(organizationId: string) {
    const client = await this.getClient(organizationId)
    return client.getUsers()
  },

  /**
   * Busca deals do Pipedrive (sem salvar)
   */
  async getDeals(organizationId: string, status?: 'open' | 'won' | 'lost' | 'all_not_deleted') {
    const client = await this.getClient(organizationId)
    const { deals } = await client.getDeals({ status })
    return deals
  },
}
