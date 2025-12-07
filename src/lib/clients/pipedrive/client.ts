// Client HTTP para API Pipedrive (não depende do domínio do projeto)

import type {
  PipedriveDeal,
  PipedriveUser,
  PipedriveApiResponse,
} from './types'

export function createPipedriveClient(apiDomain: string, accessToken: string) {
  // api_domain pode vir como URL completa (https://xxx.pipedrive.com) ou só domínio
  const cleanDomain = apiDomain.replace(/^https?:\/\//, '')
  const baseUrl = `https://${cleanDomain}/api/v1`

  async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Pipedrive API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  return {
    async getCurrentUser(): Promise<PipedriveUser> {
      const response = await request<PipedriveApiResponse<PipedriveUser>>('/users/me')
      return response.data
    },

    async getDeals(params?: {
      status?: 'open' | 'won' | 'lost' | 'all_not_deleted'
      start?: number
      limit?: number
    }): Promise<{ deals: PipedriveDeal[]; hasMore: boolean }> {
      const queryParams = new URLSearchParams()
      if (params?.status) queryParams.set('status', params.status)
      if (params?.start !== undefined) queryParams.set('start', String(params.start))
      if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

      const query = queryParams.toString()
      const endpoint = `/deals${query ? `?${query}` : ''}`

      const response = await request<PipedriveApiResponse<PipedriveDeal[]>>(endpoint)

      return {
        deals: response.data || [],
        hasMore: response.additional_data?.pagination?.more_items_in_collection || false,
      }
    },

    async getAllWonDeals(): Promise<PipedriveDeal[]> {
      const allDeals: PipedriveDeal[] = []
      let start = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const { deals, hasMore: more } = await this.getDeals({
          status: 'won',
          start,
          limit,
        })
        allDeals.push(...deals)
        hasMore = more
        start += limit
      }

      return allDeals
    },

    async getUsers(): Promise<PipedriveUser[]> {
      const response = await request<PipedriveApiResponse<PipedriveUser[]>>('/users')
      return response.data || []
    },
  }
}

export type PipedriveClient = ReturnType<typeof createPipedriveClient>

