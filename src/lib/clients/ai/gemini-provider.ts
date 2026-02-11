// Provider Gemini (não depende do domínio do projeto)

import { GoogleGenAI } from '@google/genai'
import type { AiClient, AiChatOptions, AiStreamChunk } from './types'

export function createGeminiProvider(apiKey: string): AiClient {
  const ai = new GoogleGenAI({ apiKey })

  return {
    async chat(options: AiChatOptions): Promise<ReadableStream<AiStreamChunk>> {
      // Gemini não tem role "system" — injeta como par user→model falso
      const contents = [
        { role: 'user', parts: [{ text: options.systemPrompt }] },
        {
          role: 'model',
          parts: [{ text: 'Entendido! Estou pronto para ajudar.' }],
        },
        ...options.messages.map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: msg.content }],
        })),
      ]

      const response = ai.models.generateContentStream({
        model: options.model,
        contents,
      })

      // Transforma o async iterator do Gemini em ReadableStream genérico
      return new ReadableStream<AiStreamChunk>({
        async start(controller) {
          try {
            const result = await response
            for await (const chunk of result) {
              const text =
                chunk.candidates?.[0]?.content?.parts?.[0]?.text || ''
              if (text) {
                controller.enqueue({ text })
              }
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })
    },
  }
}
