// Tipos do client AI (não depende do domínio do projeto)

export type AiRole = 'user' | 'assistant'

export type AiMessage = {
  role: AiRole
  content: string
}

export type AiStreamChunk = { text: string }

export type AiChatOptions = {
  model: string
  systemPrompt: string
  messages: AiMessage[]
}

export type AiClient = {
  chat(options: AiChatOptions): Promise<ReadableStream<AiStreamChunk>>
}

export type AiProviderConfig = {
  provider: 'gemini' // | 'openai' | 'anthropic' in future
  apiKey: string
  defaultModel: string
}
