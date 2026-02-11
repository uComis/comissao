export * from './types'

import { createGeminiProvider } from './gemini-provider'
import type { AiClient, AiProviderConfig } from './types'

export function createAiClient(config: AiProviderConfig): AiClient {
  switch (config.provider) {
    case 'gemini':
      return createGeminiProvider(config.apiKey)
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}
