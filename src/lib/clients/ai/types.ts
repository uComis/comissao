// Tipos do client AI (não depende do domínio do projeto)

export type AiRole = 'user' | 'assistant'

export type AiMessage =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'tool_call'; name: string; args: Record<string, unknown> }
  | { role: 'tool_response'; name: string; content: string }

export type AiToolCall = {
  name: string
  args: Record<string, unknown>
}

export type AiFunctionDeclaration = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

// Discriminated union: texto ou tool call
export type AiStreamChunk =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; toolCall: AiToolCall }

export type AiChatOptions = {
  model: string
  systemPrompt: string
  messages: AiMessage[]
  tools?: AiFunctionDeclaration[]
}

export type AiClient = {
  chat(options: AiChatOptions): Promise<ReadableStream<AiStreamChunk>>
}

export type AiProviderConfig = {
  provider: 'gemini' // | 'openai' | 'anthropic' in future
  apiKey: string
  defaultModel: string
}
