export type IntegrationType = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type Integration = {
  id: string
  organization_id: string
  integration_type_id: string
  provider_account_id: string | null
  access_token: string
  refresh_token: string
  expires_at: string
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export type IntegrationWithType = Integration & {
  integration_type: IntegrationType
}

export type CreateIntegrationInput = {
  organization_id: string
  integration_type_id: string
  provider_account_id?: string
  access_token: string
  refresh_token: string
  expires_at: string
}

export type UpdateIntegrationInput = Partial<
  Omit<Integration, 'id' | 'organization_id' | 'integration_type_id' | 'created_at' | 'updated_at'>
>

// Tipos para sync
export type SyncResult = {
  synced: number
  skipped: number
  errors: number
}

